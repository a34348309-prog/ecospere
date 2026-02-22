import prisma from "../lib/prisma";

// ── Carbon factors (kg CO₂ per unit) ──
const ACTIVITY_CARBON_FACTORS: Record<string, Record<string, number>> = {
  transport: {
    drove_car: 0.21, // kg CO₂ per km
    public_transport: 0.05, // kg CO₂ per km
    cycled_walked: 0.0, // zero emissions
    motorbike: 0.11, // kg CO₂ per km
  },
  food: {
    meat_meal: 3.3, // kg CO₂ per meal
    vegetarian_meal: 1.0, // kg CO₂ per meal
    vegan_meal: 0.5, // kg CO₂ per meal
  },
  energy: {
    ac_usage: 1.5, // kg CO₂ per hour
    geyser_usage: 2.0, // kg CO₂ per hour
    washing_machine: 0.6, // kg CO₂ per load
  },
  waste: {
    recycled: -0.5, // negative = carbon offset (per kg)
    composted: -0.3, // negative = carbon offset (per kg)
  },
};

/**
 * Calculate carbon impact for an activity.
 */
export const calculateActivityCarbon = (
  category: string,
  activity: string,
  value: number,
): number => {
  const factor = ACTIVITY_CARBON_FACTORS[category]?.[activity];
  if (factor === undefined) {
    throw new Error(`Unknown activity: ${category}/${activity}`);
  }
  return Math.round(value * factor * 100) / 100;
};

/**
 * Log a daily activity and update user's carbon debt.
 */
export const logActivity = async (
  userId: string,
  category: string,
  activity: string,
  value: number,
  date?: string,
) => {
  const carbonKg = calculateActivityCarbon(category, activity, value);

  const log = await prisma.activityLog.create({
    data: {
      userId,
      category,
      activity,
      value,
      carbonKg,
      date: date ? new Date(date) : new Date(),
    },
  });

  // Update user's carbon debt (positive adds debt, negative offsets it)
  if (carbonKg !== 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        carbonDebt: { increment: carbonKg },
        lifetimeCarbon: { increment: Math.max(carbonKg, 0) },
      },
    });
  }

  return {
    log,
    carbonKg,
    isOffset: carbonKg < 0,
    message:
      carbonKg < 0
        ? `🌿 Great! You offset ${Math.abs(carbonKg)} kg CO₂`
        : carbonKg === 0
          ? `🚶 Zero emissions! Keep it up!`
          : `📊 This added ${carbonKg} kg CO₂ to your footprint`,
  };
};

/**
 * Get user's recent activity history.
 */
export const getUserActivities = async (userId: string, days: number = 7) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.activityLog.findMany({
    where: {
      userId,
      date: { gte: since },
    },
    orderBy: { date: "desc" },
  });
};

/**
 * Get weekly summary — total carbon by category and day.
 */
export const getWeeklySummary = async (userId: string) => {
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      date: { gte: since },
    },
    orderBy: { date: "asc" },
  });

  // Aggregate by category
  const byCategory: Record<string, { count: number; totalCarbon: number }> = {};
  const byActivity: Record<string, number> = {};
  let totalCarbon = 0;
  let totalOffset = 0;

  for (const log of logs) {
    // Category totals
    if (!byCategory[log.category]) {
      byCategory[log.category] = { count: 0, totalCarbon: 0 };
    }
    byCategory[log.category].count += 1;
    byCategory[log.category].totalCarbon += log.carbonKg;

    // Activity counts
    byActivity[log.activity] = (byActivity[log.activity] || 0) + 1;

    if (log.carbonKg > 0) totalCarbon += log.carbonKg;
    else totalOffset += Math.abs(log.carbonKg);
  }

  return {
    totalLogs: logs.length,
    totalCarbon: Math.round(totalCarbon * 100) / 100,
    totalOffset: Math.round(totalOffset * 100) / 100,
    netCarbon: Math.round((totalCarbon - totalOffset) * 100) / 100,
    byCategory,
    byActivity,
  };
};

/**
 * Generate personalized eco tips based on user's recent activity patterns.
 */
export const generateEcoTips = async (userId: string) => {
  const summary = await getWeeklySummary(userId);
  const tips: {
    icon: string;
    title: string;
    description: string;
    savingsKg: number;
  }[] = [];

  const { byActivity, byCategory, totalLogs } = summary;

  // ── Transport tips ──
  const carTrips = byActivity["drove_car"] || 0;
  const bikeTrips = byActivity["cycled_walked"] || 0;
  if (carTrips >= 3) {
    tips.push({
      icon: "🚌",
      title: "Try Public Transport",
      description: `You drove ${carTrips} times this week. Switching 2 trips to public transport could save ~${(2 * 10 * (0.21 - 0.05)).toFixed(1)} kg CO₂ (assuming 10km each).`,
      savingsKg: 2 * 10 * (0.21 - 0.05),
    });
  }
  if (carTrips > 0 && bikeTrips === 0) {
    tips.push({
      icon: "🚲",
      title: "Try Cycling for Short Trips",
      description:
        "Walking or cycling for trips under 3km produces zero emissions and boosts your health!",
      savingsKg: 0.63,
    });
  }

  // ── Food tips ──
  const meatMeals = byActivity["meat_meal"] || 0;
  const vegMeals = byActivity["vegetarian_meal"] || 0;
  if (meatMeals >= 5) {
    const savings = 2 * (3.3 - 1.0);
    tips.push({
      icon: "🥗",
      title: "Meatless Meals",
      description: `You had ${meatMeals} meat meals this week. Replacing 2 with vegetarian saves ~${savings.toFixed(1)} kg CO₂.`,
      savingsKg: savings,
    });
  }
  if (meatMeals > 0 && vegMeals > meatMeals) {
    tips.push({
      icon: "🌟",
      title: "Great Food Choices!",
      description: `You chose ${vegMeals} vegetarian meals vs ${meatMeals} meat meals. Keep up the amazing balance!`,
      savingsKg: 0,
    });
  }

  // ── Energy tips ──
  const acHours = byActivity["ac_usage"] || 0;
  const geyserHours = byActivity["geyser_usage"] || 0;
  if (acHours > 0) {
    const acCarbon = byCategory["energy"]?.totalCarbon || 0;
    tips.push({
      icon: "❄️",
      title: "Optimize AC Usage",
      description: `Setting your AC to 24°C instead of 20°C saves ~20% energy. You logged ${acHours} hours of AC this week.`,
      savingsKg: acCarbon * 0.2,
    });
  }
  if (geyserHours >= 5) {
    tips.push({
      icon: "🚿",
      title: "Shorter Hot Showers",
      description:
        "Reducing geyser usage by 30 minutes daily saves ~1 kg CO₂/day. Try a solar water heater!",
      savingsKg: 7,
    });
  }

  // ── Waste tips ──
  const recycled = byActivity["recycled"] || 0;
  const composted = byActivity["composted"] || 0;
  if (recycled === 0 && composted === 0) {
    tips.push({
      icon: "♻️",
      title: "Start Recycling",
      description:
        "Separating recyclables and composting food waste can offset 0.5-1 kg CO₂ daily.",
      savingsKg: 3.5,
    });
  }
  if (recycled > 0 || composted > 0) {
    tips.push({
      icon: "🎉",
      title: "Waste Hero!",
      description: `You recycled/composted ${recycled + composted} time(s) this week. You're offsetting ${Math.abs(summary.totalOffset).toFixed(1)} kg CO₂!`,
      savingsKg: 0,
    });
  }

  // ── No data tip ──
  if (totalLogs === 0) {
    tips.push({
      icon: "📝",
      title: "Start Tracking",
      description:
        "Log your daily activities to get personalized eco tips! Track transport, meals, energy, and waste.",
      savingsKg: 0,
    });
  }

  // ── Net positive reinforcement ──
  if (summary.totalOffset > summary.totalCarbon && totalLogs > 0) {
    tips.unshift({
      icon: "🏆",
      title: "Carbon Negative This Week!",
      description: `Amazing! Your offsets (${summary.totalOffset.toFixed(1)} kg) exceed your emissions (${summary.totalCarbon.toFixed(1)} kg). You're making a real difference!`,
      savingsKg: 0,
    });
  }

  return { tips, summary };
};

/**
 * Get available activity categories and their options.
 */
export const getActivityOptions = () => {
  return Object.entries(ACTIVITY_CARBON_FACTORS).map(
    ([category, activities]) => ({
      category,
      activities: Object.entries(activities).map(([activity, factor]) => ({
        activity,
        factor,
        unit:
          category === "transport"
            ? "km"
            : category === "food"
              ? "meals"
              : category === "energy"
                ? "hours"
                : "kg",
        isOffset: factor < 0,
      })),
    }),
  );
};
