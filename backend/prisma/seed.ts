import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EcoSphere database...\n');

  const hashedPassword = await bcrypt.hash('password123', 12);

  // ─── USERS ────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const user1 = await prisma.user.upsert({
    where: { email: 'alex.j@example.com' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      password: hashedPassword,
      level: 12,
      ecoScore: 850,
      carbonDebt: 45.5,
      totalTreesPlanted: 127,
      oxygenContribution: 2400.5,
      lifetimeCarbon: 1200.0,
      treesToOffset: 15,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'maria.s@example.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      email: 'maria.s@example.com',
      password: hashedPassword,
      level: 8,
      ecoScore: 620,
      carbonDebt: 80.2,
      totalTreesPlanted: 89,
      oxygenContribution: 1670.3,
      lifetimeCarbon: 900.0,
      treesToOffset: 10,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'priya.k@example.com' },
    update: {},
    create: {
      name: 'Priya Kumar',
      email: 'priya.k@example.com',
      password: hashedPassword,
      level: 15,
      ecoScore: 1200,
      carbonDebt: 12.0,
      totalTreesPlanted: 210,
      oxygenContribution: 3950.0,
      lifetimeCarbon: 1500.0,
      treesToOffset: 5,
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'james.w@example.com' },
    update: {},
    create: {
      name: 'James Wilson',
      email: 'james.w@example.com',
      password: hashedPassword,
      level: 5,
      ecoScore: 310,
      carbonDebt: 150.0,
      totalTreesPlanted: 42,
      oxygenContribution: 789.0,
      lifetimeCarbon: 600.0,
      treesToOffset: 20,
    },
  });

  console.log(`   ✅ Created ${4} users`);

  // ─── NGOs ─────────────────────────────────────────────────
  console.log('🏢 Creating NGOs...');
  await prisma.$executeRaw`
        INSERT INTO "NGO" (id, name, description, address, website, coordinates, "createdAt")
        VALUES
        (gen_random_uuid(), 'Green Boston Initiative', 'Local environmental NGO focused on urban planting and green infrastructure.', '123 Green Way, Boston, MA', 'https://greenboston.org', ST_SetSRID(ST_MakePoint(-71.0589, 42.3601), 4326), NOW()),
        (gen_random_uuid(), 'EcoWarriors Foundation', 'Youth-led organization driving community-based environmental action.', '456 Eco Blvd, Cambridge, MA', 'https://ecowarriors.org', ST_SetSRID(ST_MakePoint(-71.1097, 42.3736), 4326), NOW()),
        (gen_random_uuid(), 'TreeLine Alliance', 'Dedicated to reforestation and urban canopy expansion.', '789 Forest Ave, Somerville, MA', 'https://treelinealliance.org', ST_SetSRID(ST_MakePoint(-71.0997, 42.3876), 4326), NOW()),
        (gen_random_uuid(), 'Clean Air Initiative', 'Fighting air pollution through awareness and tree planting drives.', '321 Air St, Brookline, MA', 'https://cleanairinit.org', ST_SetSRID(ST_MakePoint(-71.1215, 42.3419), 4326), NOW())
        ON CONFLICT DO NOTHING;
    `;
  console.log('   ✅ Created NGOs');

  // ─── COMMUNITY EVENTS ─────────────────────────────────────
  console.log('📅 Creating community events...');
  await prisma.$executeRaw`
        INSERT INTO "Event" (id, title, description, organizer, date, time, "locationName", coordinates, "currentParticipants", "maxParticipants", "hostId", "createdAt")
        VALUES
        (gen_random_uuid(), 'Community Tree Planting', 'Join us for a day of planting trees in Boston Common!', 'Green Boston', '2026-02-18T10:00:00Z', '10:00 AM', 'Boston Common', ST_SetSRID(ST_MakePoint(-71.0621, 42.3550), 4326), 12, 50, ${user1.id}, NOW()),
        (gen_random_uuid(), 'River Cleanup Drive', 'Help us clean the Charles River banks. Gloves provided!', 'EcoWarriors', '2026-02-25T09:00:00Z', '9:00 AM', 'Charles River Esplanade', ST_SetSRID(ST_MakePoint(-71.0740, 42.3544), 4326), 8, 30, ${user2.id}, NOW()),
        (gen_random_uuid(), 'Urban Garden Workshop', 'Learn sustainable urban gardening techniques.', 'TreeLine Alliance', '2026-03-05T14:00:00Z', '2:00 PM', 'Cambridge Community Garden', ST_SetSRID(ST_MakePoint(-71.1097, 42.3736), 4326), 5, 25, ${user3.id}, NOW()),
        (gen_random_uuid(), 'Eco Awareness Walk', 'A guided walk through local ecosystems with expert talks.', 'Clean Air', '2026-03-12T11:00:00Z', '11:00 AM', 'Arnold Arboretum', ST_SetSRID(ST_MakePoint(-71.1259, 42.3010), 4326), 15, 40, ${user1.id}, NOW())
        ON CONFLICT DO NOTHING;
    `;
  console.log('   ✅ Created community events');

  // ─── PLANTATION EVENTS (with Polygon boundaries) ──────────
  console.log('🌳 Creating plantation events with polygon boundaries...');

  // Plantation 1: Boston Common area (large rectangle)
  await prisma.$executeRaw`
        INSERT INTO "PlantationEvent" (id, title, description, "organizerName", date, "locationName", "siteBoundary", centroid, "treesGoal", "treesPlanted", status, "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'Boston Common Reforestation Drive',
            'Large-scale tree planting across Boston Common. Goal: 200 trees to restore the urban canopy.',
            'Green Boston Initiative',
            '2026-02-20T09:00:00Z',
            'Boston Common',
            ST_SetSRID(ST_GeomFromText('POLYGON((-71.0700 42.3520, -71.0580 42.3520, -71.0580 42.3580, -71.0700 42.3580, -71.0700 42.3520))'), 4326),
            ST_SetSRID(ST_MakePoint(-71.0640, 42.3550), 4326),
            200,
            45,
            'active',
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
    `;

  // Plantation 2: Charles River corridor
  await prisma.$executeRaw`
        INSERT INTO "PlantationEvent" (id, title, description, "organizerName", date, "locationName", "siteBoundary", centroid, "treesGoal", "treesPlanted", status, "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'Charles River Green Belt',
            'Planting native trees along the Charles River to improve riparian habitat and air quality.',
            'EcoWarriors Foundation',
            '2026-03-01T08:00:00Z',
            'Charles River Esplanade',
            ST_SetSRID(ST_GeomFromText('POLYGON((-71.0850 42.3530, -71.0650 42.3530, -71.0650 42.3570, -71.0850 42.3570, -71.0850 42.3530))'), 4326),
            ST_SetSRID(ST_MakePoint(-71.0750, 42.3550), 4326),
            150,
            0,
            'upcoming',
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
    `;

  // Plantation 3: Arnold Arboretum (irregular polygon)
  await prisma.$executeRaw`
        INSERT INTO "PlantationEvent" (id, title, description, "organizerName", date, "locationName", "siteBoundary", centroid, "treesGoal", "treesPlanted", status, "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'Arnold Arboretum Expansion',
            'Help expand the arboretum collections with new native species plantings.',
            'TreeLine Alliance',
            '2026-03-15T10:00:00Z',
            'Arnold Arboretum',
            ST_SetSRID(ST_GeomFromText('POLYGON((-71.1300 42.2990, -71.1200 42.2990, -71.1180 42.3020, -71.1220 42.3050, -71.1300 42.3040, -71.1300 42.2990))'), 4326),
            ST_SetSRID(ST_MakePoint(-71.1240, 42.3018), 4326),
            100,
            0,
            'upcoming',
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
    `;

  // Plantation 4: Completed event
  await prisma.$executeRaw`
        INSERT INTO "PlantationEvent" (id, title, description, "organizerName", date, "locationName", "siteBoundary", centroid, "treesGoal", "treesPlanted", status, "createdAt", "updatedAt")
        VALUES (
            gen_random_uuid(),
            'Franklin Park Restoration',
            'Completed restoration project. 80 trees planted by 25 volunteers.',
            'Clean Air Initiative',
            '2026-01-15T10:00:00Z',
            'Franklin Park',
            ST_SetSRID(ST_GeomFromText('POLYGON((-71.0950 42.3100, -71.0850 42.3100, -71.0850 42.3160, -71.0950 42.3160, -71.0950 42.3100))'), 4326),
            ST_SetSRID(ST_MakePoint(-71.0900, 42.3130), 4326),
            80,
            80,
            'completed',
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
    `;
  console.log('   ✅ Created 4 plantation events with polygon boundaries');

  // ─── AQI RECORDS (global snapshots) ───────────────────────
  console.log('🌫️ Creating AQI records...');
  await prisma.$executeRaw`
        INSERT INTO "AQIRecord" (id, value, "locationName", coordinates, timestamp)
        VALUES
        (gen_random_uuid(), 42, 'Boston Downtown', ST_SetSRID(ST_MakePoint(-71.0589, 42.3601), 4326), NOW()),
        (gen_random_uuid(), 68, 'Cambridge Center', ST_SetSRID(ST_MakePoint(-71.1097, 42.3736), 4326), NOW()),
        (gen_random_uuid(), 115, 'Industrial Zone', ST_SetSRID(ST_MakePoint(-71.0200, 42.3800), 4326), NOW()),
        (gen_random_uuid(), 35, 'Arnold Arboretum', ST_SetSRID(ST_MakePoint(-71.1259, 42.3010), 4326), NOW())
        ON CONFLICT DO NOTHING;
    `;
  console.log('   ✅ Created AQI records');

  console.log('\n🌿 Seed data created successfully!');
  console.log('   Users: alex.j@example.com / maria.s@example.com / priya.k@example.com / james.w@example.com');
  console.log('   Password: password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
