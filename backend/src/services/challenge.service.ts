import prisma from "../lib/prisma";

// ── Challenge Templates ──
const CHALLENGE_TEMPLATES = [
  // Transport
  { title: "Green Commuter", description: "Log 3 cycling/walking trips", icon: "🚲", targetCategory: "transport", targetActivity: "cycled_walked", targetValue: 3, xpReward: 40 },
  { title: "Public Transit Hero", description: "Take public transport 3 times", icon: "🚌", targetCategory: "transport", targetActivity: "public_transport", targetValue: 3, xpReward: 35 },
  { title: "Car-Free Days", description: "Log 5 zero-car transport activities", icon: "🌍", targetCategory: "transport", targetActivity: "cycled_walked", targetValue: 5, xpReward: 50 },

  // Food
  { title: "Meatless Champion", description: "Log 5 vegetarian or vegan meals", icon: "🥗", targetCategory: "food", targetActivity: null, targetValue: 5, xpReward: 40 },
  { title: "Plant Power", description: "Log 3 vegan meals this week", icon: "🌱", targetCategory: "food", targetActivity: "vegan_meal", targetValue: 3, xpReward: 45 },
  { title: "Veggie Explorer", description: "Log 4 vegetarian meals", icon: "🥦", targetCategory: "food", targetActivity: "vegetarian_meal", targetValue: 4, xpReward: 35 },

  // Energy
  { title: "Energy Saver", description: "Keep AC usage under 3 hours total", icon: "❄️", targetCategory: "energy", targetActivity: "ac_usage", targetValue: 3, xpReward: 35 },
  { title: "Cool Down Naturally", description: "Log 0 AC hours for 3 days", icon: "🌬️", targetCategory: "energy", targetActivity: "ac_usage", targetValue: 0, xpReward: 50 },

  // Waste
  { title: "Recycling Warrior", description: "Recycle 5 kg of waste", icon: "♻️", targetCategory: "waste", targetActivity: "recycled", targetValue: 5, xpReward: 40 },
  { title: "Compost King", description: "Compost 3 kg of food scraps", icon: "🪱", targetCategory: "waste", targetActivity: "composted", targetValue: 3, xpReward: 35 },

  // Mixed / general
  { title: "Eco Logger", description: "Log 10 activities this week", icon: "📝", targetCategory: "transport", targetActivity: null, targetValue: 10, xpReward: 30 },
  { title: "Carbon Cutter", description: "Offset 2 kg CO₂ via recycling/composting", icon: "🎯", targetCategory: "waste", targetActivity: null, targetValue: 4, xpReward: 45 },
];

/**
 * Get the start of the current week (Monday 00:00).
 */
const getWeekBounds = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  return { weekStart, weekEnd };
};

/**
 * Pick N random challenges from templates, personalized based on user's weak areas.
 */
const pickChallenges = async (userId: string, count: number = 3) => {
  // Get last week's activity summary to find weak areas
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const logs = await prisma.activityLog.findMany({
    where: { userId, date: { gte: since } },
  });

  const categoryCounts: Record<string, number> = { transport: 0, food: 0, energy: 0, waste: 0 };
  for (const log of logs) {
    categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
  }

  // Sort templates: prioritize categories the user doesn't do much
  const scored = CHALLENGE_TEMPLATES.map((t) => ({
    ...t,
    priority: 10 - (categoryCounts[t.targetCategory] || 0), // fewer logs = higher priority
  }));

  // Shuffle within priority groups for variety
  scored.sort(() => Math.random() - 0.5);
  scored.sort((a, b) => b.priority - a.priority);

  // Pick top N, ensuring variety (no more than 2 from same category)
  const picked: typeof scored = [];
  const catCount: Record<string, number> = {};

  for (const c of scored) {
    if (picked.length >= count) break;
    const cc = catCount[c.targetCategory] || 0;
    if (cc < 2) {
      picked.push(c);
      catCount[c.targetCategory] = cc + 1;
    }
  }

  return picked;
};

/**
 * Get or generate weekly challenges for a user.
 */
export const getWeeklyChallenges = async (userId: string) => {
  const { weekStart, weekEnd } = getWeekBounds();

  // Check if challenges already exist for this week
  const existing = await prisma.weeklyChallenge.findMany({
    where: {
      userId,
      weekStart: { gte: weekStart },
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing.length >= 3) {
    return existing;
  }

  // Generate new challenges for the week
  const templates = await pickChallenges(userId, 3);

  const challenges = await Promise.all(
    templates.map((t) =>
      prisma.weeklyChallenge.create({
        data: {
          userId,
          title: t.title,
          description: t.description,
          icon: t.icon,
          targetCategory: t.targetCategory,
          targetActivity: t.targetActivity,
          targetValue: t.targetValue,
          xpReward: t.xpReward,
          weekStart,
          weekEnd,
        },
      })
    )
  );

  return challenges;
};

/**
 * Update challenge progress when an activity is logged.
 * Call this after every activity log.
 */
export const updateChallengeProgress = async (
  userId: string,
  category: string,
  activity: string,
  value: number,
) => {
  const { weekStart } = getWeekBounds();

  // Get all active (uncompleted) challenges for this week
  const challenges = await prisma.weeklyChallenge.findMany({
    where: {
      userId,
      weekStart: { gte: weekStart },
      isCompleted: false,
    },
  });

  const completedChallenges: string[] = [];

  for (const challenge of challenges) {
    // Check if activity matches challenge target
    const categoryMatch = challenge.targetCategory === category;
    const activityMatch = !challenge.targetActivity || challenge.targetActivity === activity;

    if (categoryMatch && activityMatch) {
      const newValue = challenge.currentValue + value;
      const isNowComplete = newValue >= challenge.targetValue;

      await prisma.weeklyChallenge.update({
        where: { id: challenge.id },
        data: {
          currentValue: newValue,
          isCompleted: isNowComplete,
          completedAt: isNowComplete ? new Date() : null,
        },
      });

      if (isNowComplete) {
        // Award XP for completing the challenge
        await prisma.user.update({
          where: { id: userId },
          data: { ecoScore: { increment: challenge.xpReward } },
        });
        completedChallenges.push(challenge.title);
      }
    }
  }

  return completedChallenges;
};
