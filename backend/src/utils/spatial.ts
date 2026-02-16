import { Prisma } from '@prisma/client';

/**
 * Create a PostGIS Point from lat/lng.
 */
export const pointToSql = (lat: number, lng: number) => {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
};

/**
 * Find records within a radius (meters) using PostGIS ST_DWithin.
 */
export const findNearby = (table: string, lat: number, lng: number, radiusInMeters: number) => {
  return Prisma.sql`
        SELECT * FROM ${Prisma.raw(table)}
        WHERE ST_DWithin(
            coordinates::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusInMeters}
        )
    `;
};

/**
 * Check if a point is inside a polygon using PostGIS ST_Contains.
 */
export const isPointInPolygon = (polygonColumn: string, lat: number, lng: number) => {
  return Prisma.sql`
        ST_Contains(
            ${Prisma.raw(polygonColumn)},
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        )
    `;
};

/**
 * Calculate distance between two points in meters.
 */
export const distanceBetween = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  return Prisma.sql`
        ST_Distance(
            ST_SetSRID(ST_MakePoint(${lng1}, ${lat1}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng2}, ${lat2}), 4326)::geography
        )
    `;
};
