import prisma from "../lib/prisma";

/**
 * Verify user attendance at a Plantation Event via geofencing.
 * Uses PostGIS ST_Contains to check if user's location is within the event's site_boundary polygon.
 */
export const verifyAttendance = async (
  userId: string,
  eventId: string,
  userLat: number,
  userLng: number,
): Promise<{ verified: boolean; message: string; data?: any }> => {
  // 1. Check if event exists
  const event = await prisma.$queryRaw<any[]>`
        SELECT id, title, status, "treesGoal", "treesPlanted",
               ST_AsGeoJSON("siteBoundary") as boundary_geojson
        FROM "PlantationEvent"
        WHERE id = ${eventId}
    `;

  if (!event || event.length === 0) {
    return { verified: false, message: "Plantation event not found" };
  }

  const plantationEvent = event[0];

  if (plantationEvent.status === "completed") {
    return {
      verified: false,
      message: "This event has already been completed",
    };
  }

  // 2. Geofencing check — ST_Contains(site_boundary, user_point)
  const containsResult = await prisma.$queryRaw<{ st_contains: boolean }[]>`
        SELECT ST_Contains(
            "siteBoundary",
            ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)
        ) as st_contains
        FROM "PlantationEvent"
        WHERE id = ${eventId}
    `;

  const isWithinBoundary = containsResult[0]?.st_contains === true;

  if (!isWithinBoundary) {
    return {
      verified: false,
      message:
        "You are not within the event boundary. Please move closer to the planting site.",
    };
  }

  // 3. Check if already verified
  const existingRecord = await prisma.impactLedger.findUnique({
    where: {
      userId_plantationId: {
        userId,
        plantationId: eventId,
      },
    },
  });

  if (existingRecord?.attended) {
    return {
      verified: true,
      message: "Attendance already verified for this event",
      data: existingRecord,
    };
  }

  // 4. Mark as attended — upsert into Impact_Ledger
  const ledgerEntry = await prisma.impactLedger.upsert({
    where: {
      userId_plantationId: {
        userId,
        plantationId: eventId,
      },
    },
    update: {
      attended: true,
      verifiedAt: new Date(),
      treesContributed: 1, // default 1 tree per attendance
    },
    create: {
      userId,
      plantationId: eventId,
      attended: true,
      verifiedAt: new Date(),
      treesContributed: 1,
    },
  });

  // 5. Increment eco_score & decrement carbon debt (tree debt)
  const ECO_SCORE_PER_TREE = 10;
  const CARBON_OFFSET_PER_TREE = 21.77; // kg CO₂ absorbed per tree per year (EPA estimate)

  await prisma.user.update({
    where: { id: userId },
    data: {
      ecoScore: { increment: ECO_SCORE_PER_TREE },
      totalTreesPlanted: { increment: 1 },
      carbonDebt: { decrement: CARBON_OFFSET_PER_TREE },
      oxygenContribution: { increment: 117.9 }, // kg O₂ per tree per year
    },
  });

  // 6. Update plantation event trees count
  await prisma.plantationEvent.update({
    where: { id: eventId },
    data: {
      treesPlanted: { increment: 1 },
    },
  });

  return {
    verified: true,
    message: "🌳 Attendance verified! Tree planted successfully.",
    data: {
      ledgerEntry,
      rewards: {
        ecoScoreEarned: ECO_SCORE_PER_TREE,
        carbonOffset: CARBON_OFFSET_PER_TREE,
        oxygenContribution: 117.9,
      },
    },
  };
};

/**
 * Get all plantation events with their status.
 */
export const getPlantationEvents = async (status?: string) => {
  let whereClause = "";
  if (status) {
    whereClause = `WHERE status = '${status}'`;
  }

  const events = await prisma.$queryRaw<any[]>`
        SELECT id, title, description, "organizerName", date, "locationName",
               "treesPlanted", "treesGoal", status,
               ST_AsGeoJSON("siteBoundary") as boundary,
               ST_AsGeoJSON(centroid) as centroid_point,
               ST_X(centroid) as lng, ST_Y(centroid) as lat,
               "createdAt"
        FROM "PlantationEvent"
        ORDER BY date DESC
    `;

  return events.map((e: any) => ({
    ...e,
    boundary: e.boundary ? JSON.parse(e.boundary) : null,
    centroid_point: e.centroid_point ? JSON.parse(e.centroid_point) : null,
  }));
};

/**
 * Get user's impact ledger (all verified participations).
 */
export const getUserImpactLedger = async (userId: string) => {
  return prisma.impactLedger.findMany({
    where: { userId },
    include: {
      plantation: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

/**
 * Create a new plantation event with polygon boundary.
 */
export const createPlantationEvent = async (data: {
  title: string;
  description: string;
  organizerName: string;
  date: string;
  locationName: string;
  treesGoal: number;
  boundary: number[][]; // [[lng, lat], [lng, lat], ...]
}) => {
  // Build polygon WKT from coordinates
  const coordsStr = data.boundary
    .map(([lng, lat]) => `${lng} ${lat}`)
    .join(", ");
  // Ensure the polygon is closed
  const firstCoord = data.boundary[0];
  const lastCoord = data.boundary[data.boundary.length - 1];
  const closedCoordsStr =
    firstCoord[0] === lastCoord[0] && firstCoord[1] === lastCoord[1]
      ? coordsStr
      : `${coordsStr}, ${firstCoord[0]} ${firstCoord[1]}`;

  // Calculate centroid for easy point-based lookups
  const centroidLng =
    data.boundary.reduce((sum, [lng]) => sum + lng, 0) / data.boundary.length;
  const centroidLat =
    data.boundary.reduce((sum, [, lat]) => sum + lat, 0) / data.boundary.length;

  // Build the full WKT string for the polygon
  const polygonWKT = `POLYGON((${closedCoordsStr}))`;

  const result = await prisma.$executeRaw`
        INSERT INTO "PlantationEvent" (
            id, title, description, "organizerName", date, "locationName",
            "siteBoundary", centroid, "treesGoal", status, "createdAt", "updatedAt"
        ) VALUES (
            gen_random_uuid(),
            ${data.title},
            ${data.description},
            ${data.organizerName},
            ${new Date(data.date)},
            ${data.locationName},
            ST_SetSRID(ST_GeomFromText(${polygonWKT}, 0), 4326),
            ST_SetSRID(ST_MakePoint(${centroidLng}, ${centroidLat}), 4326),
            ${data.treesGoal},
            'upcoming',
            NOW(),
            NOW()
        )
    `;

  return {
    created: result > 0,
    centroid: { lng: centroidLng, lat: centroidLat },
  };
};
