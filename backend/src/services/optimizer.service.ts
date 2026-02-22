interface EcoAction {
  name: string;
  carbonSaved: number; // kg CO₂
  difficulty: number; // 1-10 scale
  icon: string;
  tip: string;
}

// Potential eco-actions — the "Items" for our Knapsack
const POTENTIAL_ACTIONS: EcoAction[] = [
  {
    name: "Switch to LED Bulbs",
    carbonSaved: 0.5,
    difficulty: 2,
    icon: "💡",
    tip: "Replace one incandescent bulb with LED",
  },
  {
    name: "Cold Water Wash",
    carbonSaved: 0.6,
    difficulty: 1,
    icon: "🧊",
    tip: "Wash clothes in cold water instead of hot",
  },
  {
    name: "Meatless Monday",
    carbonSaved: 2.3,
    difficulty: 5,
    icon: "🥗",
    tip: "Replace one meat meal with a vegetarian option",
  },
  {
    name: "Cycle to Work (5km)",
    carbonSaved: 1.1,
    difficulty: 8,
    icon: "🚲",
    tip: "Bike instead of driving for your daily commute",
  },
  {
    name: "Air Dry Clothes",
    carbonSaved: 2.0,
    difficulty: 3,
    icon: "👕",
    tip: "Skip the dryer — hang clothes to dry",
  },
  {
    name: "Turn off AC (2hrs)",
    carbonSaved: 3.0,
    difficulty: 4,
    icon: "❄️",
    tip: "Use a fan instead of AC for 2 hours",
  },
  {
    name: "Unplug Idle Devices",
    carbonSaved: 0.3,
    difficulty: 1,
    icon: "🔌",
    tip: "Unplug chargers and standby electronics",
  },
  {
    name: "Shorter Shower (-3min)",
    carbonSaved: 0.8,
    difficulty: 3,
    icon: "🚿",
    tip: "Cut your shower time by 3 minutes",
  },
  {
    name: "Carry Reusable Bag",
    carbonSaved: 0.2,
    difficulty: 1,
    icon: "🛍️",
    tip: "Say no to plastic bags when shopping",
  },
  {
    name: "Compost Food Scraps",
    carbonSaved: 1.5,
    difficulty: 4,
    icon: "🪱",
    tip: "Start a small compost bin for kitchen waste",
  },
  {
    name: "Take Public Transport",
    carbonSaved: 1.6,
    difficulty: 6,
    icon: "🚌",
    tip: "Bus or metro instead of driving for one trip",
  },
  {
    name: "Eat a Vegan Meal",
    carbonSaved: 2.8,
    difficulty: 6,
    icon: "🌱",
    tip: "Go fully plant-based for one meal",
  },
  {
    name: "Plant a Sapling",
    carbonSaved: 0.5,
    difficulty: 7,
    icon: "🌳",
    tip: "Plant a tree sapling in your garden or community",
  },
  {
    name: "Carpool to Work",
    carbonSaved: 1.3,
    difficulty: 5,
    icon: "🚗",
    tip: "Share your ride with a colleague",
  },
  {
    name: "Use Stairs (not lift)",
    carbonSaved: 0.1,
    difficulty: 2,
    icon: "🏃",
    tip: "Take the stairs instead of the elevator",
  },
];

/**
 * 0/1 Knapsack Algorithm — finds the optimal set of eco-actions
 * that maximize CO₂ reduction within a user's "difficulty budget".
 *
 * @param maxDifficulty — the user's effort budget (e.g., 10 = easy week, 25 = ambitious)
 */
export const optimizeCarbonDiet = (maxDifficulty: number) => {
  const n = POTENTIAL_ACTIONS.length;

  // dp[i][w] = max carbon saved using items 0..i-1, with difficulty budget w
  const dp: number[][] = Array(n + 1)
    .fill(0)
    .map(() => Array(maxDifficulty + 1).fill(0));

  // Build the DP table
  for (let i = 1; i <= n; i++) {
    const action = POTENTIAL_ACTIONS[i - 1];
    for (let w = 0; w <= maxDifficulty; w++) {
      if (action.difficulty <= w) {
        dp[i][w] = Math.max(
          action.carbonSaved + dp[i - 1][w - action.difficulty],
          dp[i - 1][w],
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to find which items were selected
  let w = maxDifficulty;
  const selectedActions: EcoAction[] = [];
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      const action = POTENTIAL_ACTIONS[i - 1];
      selectedActions.push(action);
      w -= action.difficulty;
    }
  }

  return {
    totalSavings: Math.round(dp[n][maxDifficulty] * 100) / 100,
    difficultyUsed: maxDifficulty - w,
    maxDifficulty,
    actions: selectedActions.reverse(), // show easiest first
  };
};

/**
 * Get all potential actions for reference.
 */
export const getPotentialActions = () => POTENTIAL_ACTIONS;
