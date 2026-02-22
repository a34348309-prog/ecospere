import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface LifestyleInput {
    commuteDistance: number;
    vehicleType: string;
    monthlyElectricity: number;
    age: number;
    city: string;
    dietaryPreference: string;
    meatMealsPerWeek: number;
    hasGarden: boolean;
    homeOwnership: string;
    householdSize: number;
    acUsageHours: number;
    wasteRecycling: string;
    monthlyGroceryBill: number;
    willingnessChangeDiet: number;
    willingnessPublicTransport: number;
    timeAvailability: string;
}

interface ScoredAction {
    actionId: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    carbonSavedKg: number;
    monthlySavings: number;
    upfrontCost: number;
    difficulty: number;
    phase: string;
    treesEquivalent: number;
    tips: string;
    personalScore: number;  // 0-100 personalized relevance
}

interface PhasePlan {
    phase: string;
    label: string;
    months: string;
    actions: ScoredAction[];
    treesReduced: number;
    monthlySavings: number;
    description: string;
}

export interface GeneratedPlan {
    treesNeeded: number;
    phases: PhasePlan[];
    treesReducedByActions: number;
    treesRemaining: number;
    totalMonthlySavings: number;
    totalUpfrontCost: number;
    totalYearlySavings: number;
    totalCO2Reduced: number;
    sponsorCost: number;
    netSavingsYear1: number;
    impactSummary: {
        co2ReducedAnnually: number;
        equivalentTrees: number;
        moneySaved: number;
        healthBenefits: string[];
        communityImpact: string[];
    };
    financialSummary: {
        oneTimeCosts: number;
        monthlySavingsStart: number;
        totalYear1Savings: number;
        treesSponsored: number;
        sponsorCost: number;
        netSavingsYear1: number;
    };
}

// ─────────────────────────────────────────────────────────────
// DEFAULT ACTION DATABASE — 30+ actions across all categories
// Used to seed the EcoAction table if empty
// ─────────────────────────────────────────────────────────────

const DEFAULT_ACTIONS = [
    // ── ENERGY (10 actions) ──────────────────────────────────
    {
        name: 'Switch to LED bulbs',
        category: 'energy',
        description: 'Replace all incandescent/CFL bulbs with energy-efficient LEDs',
        icon: '💡',
        carbonSavedKg: 15,
        monthlySavings: 200,
        upfrontCost: 1500,
        difficulty: 1,
        phase: 'immediate',
        treesEquivalent: 0.17,
        tips: 'Start with the rooms you use most. LEDs last 15-25 years and use 75% less energy.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'AC temperature to 24°C',
        category: 'energy',
        description: 'Set AC to 24°C instead of lower temperatures — each degree saves 6% energy',
        icon: '❄️',
        carbonSavedKg: 25,
        monthlySavings: 500,
        upfrontCost: 0,
        difficulty: 2,
        phase: 'immediate',
        treesEquivalent: 0.28,
        tips: 'Use a ceiling fan alongside AC. Clean AC filters monthly for 15% better efficiency.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Unplug idle electronics',
        category: 'energy',
        description: 'Unplug chargers, TVs, and appliances when not in use to eliminate phantom load',
        icon: '🔌',
        carbonSavedKg: 8,
        monthlySavings: 150,
        upfrontCost: 0,
        difficulty: 1,
        phase: 'immediate',
        treesEquivalent: 0.09,
        tips: 'Use a power strip to easily switch off multiple devices at once.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Install a smart thermostat',
        category: 'energy',
        description: 'Use a programmable thermostat to optimize heating/cooling schedules',
        icon: '🌡️',
        carbonSavedKg: 30,
        monthlySavings: 600,
        upfrontCost: 3000,
        difficulty: 3,
        phase: 'short_term',
        treesEquivalent: 0.33,
        tips: 'Program to reduce cooling when you\'re away. Smart models learn your schedule automatically.',
        requiresGarden: false,
        requiresHomeOwnership: true,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Switch to solar water heater',
        category: 'energy',
        description: 'Install a solar water heater to eliminate gas/electric water heating',
        icon: '☀️',
        carbonSavedKg: 50,
        monthlySavings: 800,
        upfrontCost: 15000,
        difficulty: 4,
        phase: 'medium_term',
        treesEquivalent: 0.56,
        tips: 'Government subsidies available. Pays for itself in 18 months. Works even on cloudy days.',
        requiresGarden: false,
        requiresHomeOwnership: true,
        minHouseholdSize: 2,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Use natural ventilation',
        category: 'energy',
        description: 'Open windows for cross-ventilation instead of using AC during mild weather',
        icon: '🪟',
        carbonSavedKg: 20,
        monthlySavings: 400,
        upfrontCost: 0,
        difficulty: 2,
        phase: 'immediate',
        treesEquivalent: 0.22,
        tips: 'Works best in early morning and evening. Use window screens to keep insects out.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Cold water laundry',
        category: 'energy',
        description: 'Wash clothes in cold water — 90% of washing machine energy goes to heating',
        icon: '🧊',
        carbonSavedKg: 12,
        monthlySavings: 180,
        upfrontCost: 0,
        difficulty: 1,
        phase: 'immediate',
        treesEquivalent: 0.13,
        tips: 'Modern detergents work equally well in cold water. Air-dry clothes for extra savings.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Install rooftop solar panels',
        category: 'energy',
        description: 'Generate your own clean electricity with rooftop solar installation',
        icon: '🔆',
        carbonSavedKg: 150,
        monthlySavings: 2000,
        upfrontCost: 80000,
        difficulty: 5,
        phase: 'long_term',
        treesEquivalent: 1.67,
        tips: 'Government subsidies cover 30-40%. Net metering lets you sell excess power back.',
        requiresGarden: false,
        requiresHomeOwnership: true,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Use energy-efficient appliances',
        category: 'energy',
        description: 'Replace old appliances with BEE 5-star rated models when upgrading',
        icon: '⭐',
        carbonSavedKg: 35,
        monthlySavings: 500,
        upfrontCost: 5000,
        difficulty: 3,
        phase: 'medium_term',
        treesEquivalent: 0.39,
        tips: 'Start with the fridge — it runs 24/7. A 5-star fridge saves 45% over old models.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Reduce AC usage by 2 hours/day',
        category: 'energy',
        description: 'Use fans or coolers instead of AC for part of the day',
        icon: '🌀',
        carbonSavedKg: 40,
        monthlySavings: 700,
        upfrontCost: 0,
        difficulty: 3,
        phase: 'short_term',
        treesEquivalent: 0.44,
        tips: 'A ceiling fan uses 75W vs AC\'s 1500W. Use AC only during peak heat hours.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },

    // ── TRANSPORT (7 actions) ────────────────────────────────
    {
        name: 'Switch to bus/metro commute',
        category: 'transport',
        description: 'Use public transport for your daily commute instead of private vehicle',
        icon: '🚌',
        carbonSavedKg: 80,
        monthlySavings: 2000,
        upfrontCost: 0,
        difficulty: 4,
        phase: 'short_term',
        treesEquivalent: 0.89,
        tips: 'Get a monthly pass for 40% savings. Use travel time for reading or podcasts.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: ['car', 'bike'],
        applicableDiets: [] as string[],
    },
    {
        name: 'Carpool to work',
        category: 'transport',
        description: 'Share your commute with colleagues or neighbors going the same way',
        icon: '🚗',
        carbonSavedKg: 50,
        monthlySavings: 1500,
        upfrontCost: 0,
        difficulty: 3,
        phase: 'short_term',
        treesEquivalent: 0.56,
        tips: 'Apps like QuickRide help find carpool partners. Take turns driving to split costs.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: ['car'],
        applicableDiets: [] as string[],
    },
    {
        name: 'Cycle for short trips (<5km)',
        category: 'transport',
        description: 'Use a bicycle for errands and short-distance trips',
        icon: '🚲',
        carbonSavedKg: 25,
        monthlySavings: 800,
        upfrontCost: 5000,
        difficulty: 3,
        phase: 'short_term',
        treesEquivalent: 0.28,
        tips: 'Great exercise too! Electric bicycles make it easier in hot weather or hilly terrain.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: ['car', 'bike'],
        applicableDiets: [] as string[],
    },
    {
        name: 'Work from home 2 days/week',
        category: 'transport',
        description: 'Negotiate remote work days to reduce commuting emissions',
        icon: '🏠',
        carbonSavedKg: 35,
        monthlySavings: 1200,
        upfrontCost: 0,
        difficulty: 3,
        phase: 'medium_term',
        treesEquivalent: 0.39,
        tips: 'Present productivity data to your employer. Even 1 day/week makes a significant impact.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: ['car', 'bike', 'public_transport'],
        applicableDiets: [] as string[],
    },
    {
        name: 'Maintain proper tire pressure',
        category: 'transport',
        description: 'Keep tires inflated to recommended pressure — saves 3% fuel',
        icon: '🛞',
        carbonSavedKg: 10,
        monthlySavings: 300,
        upfrontCost: 0,
        difficulty: 1,
        phase: 'immediate',
        treesEquivalent: 0.11,
        tips: 'Check weekly at petrol stations. Under-inflated tires also wear out 25% faster.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: ['car', 'bike'],
        applicableDiets: [] as string[],
    },
    {
        name: 'Switch to electric vehicle',
        category: 'transport',
        description: 'Replace petrol/diesel vehicle with an electric vehicle for daily commute',
        icon: '⚡',
        carbonSavedKg: 120,
        monthlySavings: 3000,
        upfrontCost: 200000,
        difficulty: 5,
        phase: 'long_term',
        treesEquivalent: 1.33,
        tips: 'Government subsidies available. Running cost is ₹1/km vs ₹5-8/km for petrol.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: ['car', 'bike'],
        applicableDiets: [] as string[],
    },
    {
        name: 'Walk for trips under 2km',
        category: 'transport',
        description: 'Walk instead of driving for very short trips — free and healthy',
        icon: '🚶',
        carbonSavedKg: 15,
        monthlySavings: 500,
        upfrontCost: 0,
        difficulty: 2,
        phase: 'immediate',
        treesEquivalent: 0.17,
        tips: 'A 2km walk takes about 25 minutes. Great for health — burns 100 calories per km.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: ['car', 'bike'],
        applicableDiets: [] as string[],
    },

    // ── DIET (7 actions) ─────────────────────────────────────
    {
        name: 'Meatless Mondays',
        category: 'diet',
        description: 'Go vegetarian one day per week to reduce food-related emissions',
        icon: '🥗',
        carbonSavedKg: 20,
        monthlySavings: 500,
        upfrontCost: 0,
        difficulty: 2,
        phase: 'immediate',
        treesEquivalent: 0.22,
        tips: 'Try paneer tikka, dal makhani, or veggie biryani — delicious and protein-rich!',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: ['non_vegetarian', 'flexitarian'],
    },
    {
        name: 'Reduce meat to 3 meals/week',
        category: 'diet',
        description: 'Gradually replace meat meals with plant-based alternatives',
        icon: '🌿',
        carbonSavedKg: 40,
        monthlySavings: 800,
        upfrontCost: 0,
        difficulty: 3,
        phase: 'short_term',
        treesEquivalent: 0.44,
        tips: 'Replace red meat first (highest emissions). Chicken has 5x less impact than beef.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: ['non_vegetarian', 'flexitarian'],
    },
    {
        name: 'Buy local & seasonal produce',
        category: 'diet',
        description: 'Shop at local farmers markets — reduces transport emissions and supports farmers',
        icon: '🏪',
        carbonSavedKg: 15,
        monthlySavings: 400,
        upfrontCost: 0,
        difficulty: 2,
        phase: 'immediate',
        treesEquivalent: 0.17,
        tips: 'Seasonal produce is 30% cheaper and fresher. Visit your local sabzi mandi weekly.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Reduce food waste by 50%',
        category: 'diet',
        description: 'Plan meals, use leftovers creatively, and store food properly',
        icon: '🍽️',
        carbonSavedKg: 25,
        monthlySavings: 600,
        upfrontCost: 0,
        difficulty: 2,
        phase: 'short_term',
        treesEquivalent: 0.28,
        tips: 'Make a weekly meal plan. Use the FIFO method — First In, First Out for groceries.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Grow herbs & greens at home',
        category: 'diet',
        description: 'Grow basic herbs, spinach, and greens in pots on your balcony or garden',
        icon: '🌱',
        carbonSavedKg: 5,
        monthlySavings: 300,
        upfrontCost: 500,
        difficulty: 3,
        phase: 'short_term',
        treesEquivalent: 0.06,
        tips: 'Start with tulsi, mint, and coriander — they grow easily in Indian climate.',
        requiresGarden: true,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Switch to plant-based milk',
        category: 'diet',
        description: 'Replace dairy milk with soy, oat, or almond milk for some uses',
        icon: '🥛',
        carbonSavedKg: 10,
        monthlySavings: 0,
        upfrontCost: 0,
        difficulty: 3,
        phase: 'medium_term',
        treesEquivalent: 0.11,
        tips: 'Soy milk has the closest nutritional profile to dairy. Great for smoothies and cereal.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: ['flexitarian', 'vegetarian'],
    },
    {
        name: 'Carry your own water bottle',
        category: 'diet',
        description: 'Use a reusable bottle to avoid single-use plastic water bottles',
        icon: '🫗',
        carbonSavedKg: 3,
        monthlySavings: 200,
        upfrontCost: 500,
        difficulty: 1,
        phase: 'immediate',
        treesEquivalent: 0.03,
        tips: 'A stainless steel bottle lasts years. Install a water filter at home for pure water.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },

    // ── WASTE (4 actions) ────────────────────────────────────
    {
        name: 'Start composting kitchen waste',
        category: 'waste',
        description: 'Compost vegetable peels, coffee grounds, and food scraps at home',
        icon: '🪱',
        carbonSavedKg: 20,
        monthlySavings: 300,
        upfrontCost: 2000,
        difficulty: 3,
        phase: 'short_term',
        treesEquivalent: 0.22,
        tips: 'A simple khamba composter works great on balconies. Produces free fertilizer!',
        requiresGarden: true,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Segregate waste for recycling',
        category: 'waste',
        description: 'Separate dry, wet, and hazardous waste at source for proper recycling',
        icon: '♻️',
        carbonSavedKg: 15,
        monthlySavings: 100,
        upfrontCost: 500,
        difficulty: 2,
        phase: 'immediate',
        treesEquivalent: 0.17,
        tips: 'Use 3 bins: green (wet), blue (dry recyclable), red (hazardous). Sell dry waste to kabadiwala.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Carry reusable bags & containers',
        category: 'waste',
        description: 'Replace single-use plastic bags with cloth bags for all shopping',
        icon: '🛍️',
        carbonSavedKg: 5,
        monthlySavings: 100,
        upfrontCost: 300,
        difficulty: 1,
        phase: 'immediate',
        treesEquivalent: 0.06,
        tips: 'Keep bags in your car/backpack so you always have them. Steel containers for takeaway food.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Switch to bamboo/reusable products',
        category: 'waste',
        description: 'Replace disposable items with bamboo toothbrush, steel straws, cloth napkins',
        icon: '🎋',
        carbonSavedKg: 8,
        monthlySavings: 200,
        upfrontCost: 1000,
        difficulty: 2,
        phase: 'short_term',
        treesEquivalent: 0.09,
        tips: 'Bamboo products biodegrade in months vs plastic\'s centuries. Start with toothbrush and straws.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },

    // ── TREE PLANTING (4 actions) ────────────────────────────
    {
        name: 'Plant a tree in your garden',
        category: 'tree_planting',
        description: 'Plant a native tree species in your garden or society compound',
        icon: '🌳',
        carbonSavedKg: 22,
        monthlySavings: 0,
        upfrontCost: 200,
        difficulty: 3,
        phase: 'medium_term',
        treesEquivalent: 1.0,
        tips: 'Neem and Peepal absorb the most CO₂. Plant during monsoon for best survival rates.',
        requiresGarden: true,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Sponsor tree planting (5 trees)',
        category: 'tree_planting',
        description: 'Sponsor 5 trees through a verified NGO tree planting program',
        icon: '🌲',
        carbonSavedKg: 110,
        monthlySavings: 0,
        upfrontCost: 1500,
        difficulty: 1,
        phase: 'medium_term',
        treesEquivalent: 5.0,
        tips: 'Organizations like SankalpTaru give GPS-tracked trees. ₹300 per tree with maintenance.',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Join community plantation drives',
        category: 'tree_planting',
        description: 'Participate in local tree planting events and plantation drives',
        icon: '🤝',
        carbonSavedKg: 22,
        monthlySavings: 0,
        upfrontCost: 0,
        difficulty: 2,
        phase: 'short_term',
        treesEquivalent: 1.0,
        tips: 'Check EcoSphere events tab for upcoming drives near you. Great community activity!',
        requiresGarden: false,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
    {
        name: 'Maintain a kitchen garden',
        category: 'tree_planting',
        description: 'Grow vegetables, fruits, and medicinal plants in your garden or terrace',
        icon: '🪴',
        carbonSavedKg: 10,
        monthlySavings: 500,
        upfrontCost: 2000,
        difficulty: 4,
        phase: 'medium_term',
        treesEquivalent: 0.11,
        tips: 'Start with tomatoes, chillies, and brinjal. Use compost from kitchen waste as fertilizer.',
        requiresGarden: true,
        requiresHomeOwnership: false,
        minHouseholdSize: 1,
        applicableVehicles: [] as string[],
        applicableDiets: [] as string[],
    },
];

// ─────────────────────────────────────────────────────────────
// SEED ACTIONS — Ensure EcoAction table is populated
// ─────────────────────────────────────────────────────────────

export const seedActionsIfEmpty = async (): Promise<void> => {
    const count = await prisma.ecoAction.count();
    if (count > 0) return;

    console.log('[EcoPlan] Seeding action database with', DEFAULT_ACTIONS.length, 'actions...');
    for (const action of DEFAULT_ACTIONS) {
        await prisma.ecoAction.create({ data: action });
    }
    console.log('[EcoPlan] Action database seeded successfully.');
};

// ─────────────────────────────────────────────────────────────
// CALCULATE TREE DEBT — Based on annual carbon footprint
// ─────────────────────────────────────────────────────────────

/**
 * Calculate annual CO₂ emissions and tree debt from lifestyle data.
 * A mature tree absorbs ~22 kg CO₂ per year (Indian average).
 */
const CO2_PER_TREE_PER_YEAR = 22; // kg CO₂ absorbed by one tree per year
const COST_PER_TREE = 300; // ₹ cost to sponsor one tree

export const calculateTreeDebt = (profile: LifestyleInput): { annualCO2: number; treesNeeded: number } => {
    let annualCO2 = 0;

    // 1. Transport emissions (kg CO₂ per year)
    const vehicleFactors: Record<string, number> = {
        car: 0.192, bike: 0.103, public_transport: 0.041, none: 0,
    };
    const vehicleFactor = vehicleFactors[profile.vehicleType] || 0;
    annualCO2 += profile.commuteDistance * vehicleFactor * 365;

    // 2. Electricity emissions (0.85 kg CO₂ per kWh, monthly → yearly)
    annualCO2 += profile.monthlyElectricity * 0.85 * 12;

    // 3. AC usage (1.5 kW avg × hours × 6 summer months × 0.85 factor)
    annualCO2 += profile.acUsageHours * 1.5 * 30 * 6 * 0.85;

    // 4. Diet emissions
    const dietFactors: Record<string, number> = {
        non_vegetarian: 2500, flexitarian: 1800, vegetarian: 1200, vegan: 900,
    };
    let dietCO2 = dietFactors[profile.dietaryPreference] || 2500;
    // Adjust for meat frequency (baseline assumes 7 meals/week for non-veg)
    if (profile.dietaryPreference === 'non_vegetarian') {
        dietCO2 = dietCO2 * (profile.meatMealsPerWeek / 7);
    }
    annualCO2 += dietCO2;

    // 5. Waste (no recycling adds ~100 kg CO₂/year per person)
    const wasteFactors: Record<string, number> = {
        always: 50, sometimes: 100, never: 200,
    };
    annualCO2 += (wasteFactors[profile.wasteRecycling] || 100) * profile.householdSize;

    // 6. Household size multiplier (shared living reduces per-capita emissions)
    const householdMultiplier = 1 + (profile.householdSize - 1) * 0.3;
    annualCO2 *= householdMultiplier / profile.householdSize;

    const treesNeeded = Math.ceil(annualCO2 / CO2_PER_TREE_PER_YEAR);

    return { annualCO2: Math.round(annualCO2), treesNeeded };
};

// ─────────────────────────────────────────────────────────────
// PERSONALIZED SCORING ALGORITHM
// ─────────────────────────────────────────────────────────────

/**
 * Score each action based on user's lifestyle, willingness, and living situation.
 * Returns a personalized relevance score (0-100) for each action.
 *
 * Scoring factors:
 *  - Applicability (hard filter: garden, home ownership, vehicle type, diet)
 *  - Impact efficiency (carbon saved per unit difficulty)
 *  - Willingness alignment (diet/transport willingness scores)
 *  - Time availability alignment
 *  - Household size relevance
 *  - Financial efficiency (savings relative to household grocery budget)
 */
const scoreAction = (action: any, profile: LifestyleInput): number => {
    let score = 50; // base score

    // ── Hard filters (disqualify if not applicable) ──────────
    if (action.requiresGarden && !profile.hasGarden) return 0;
    if (action.requiresHomeOwnership && profile.homeOwnership !== 'own') return 0;
    if (action.minHouseholdSize > profile.householdSize) return 0;

    // Vehicle type filter
    if (action.applicableVehicles.length > 0) {
        if (!action.applicableVehicles.includes(profile.vehicleType)) return 0;
    }

    // Diet filter
    if (action.applicableDiets.length > 0) {
        if (!action.applicableDiets.includes(profile.dietaryPreference)) return 0;
    }

    // ── Impact efficiency (max +20) ─────────────────────────
    const impactRatio = action.carbonSavedKg / Math.max(action.difficulty, 1);
    score += Math.min(20, impactRatio * 2);

    // ── Willingness alignment (max +15) ─────────────────────
    if (action.category === 'diet') {
        score += (profile.willingnessChangeDiet / 5) * 15;
    }
    if (action.category === 'transport') {
        score += (profile.willingnessPublicTransport / 5) * 15;
    }

    // ── Time availability (max +10) ─────────────────────────
    const timeScores: Record<string, number> = { low: 0, medium: 5, high: 10 };
    const timeScore = timeScores[profile.timeAvailability] || 5;
    // High-difficulty actions penalized for low time availability
    if (action.difficulty >= 4 && profile.timeAvailability === 'low') {
        score -= 15;
    } else {
        score += timeScore;
    }

    // ── Household size bonus (max +5) ───────────────────────
    // Actions with monthly savings benefit more with larger households
    if (profile.householdSize >= 3 && action.monthlySavings > 0) {
        score += 5;
    }

    // ── Financial efficiency bonus (max +10) ────────────────
    if (action.monthlySavings > 0) {
        const savingsPercent = (action.monthlySavings / Math.max(profile.monthlyGroceryBill, 1000)) * 100;
        score += Math.min(10, savingsPercent);
    }

    // ── AC-specific boost ───────────────────────────────────
    if (action.category === 'energy' && action.name.toLowerCase().includes('ac')) {
        if (profile.acUsageHours > 4) score += 10;
        if (profile.acUsageHours <= 1) score -= 20;
    }

    // ── Commute-specific boost ──────────────────────────────
    if (action.category === 'transport') {
        if (profile.commuteDistance > 20) score += 10;
        if (profile.commuteDistance < 5) score -= 10;
    }

    // ── Already recycling → less boost for recycling actions ─
    if (action.category === 'waste' && profile.wasteRecycling === 'always') {
        score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
};

// ─────────────────────────────────────────────────────────────
// OPTIMIZATION ALGORITHM — Select best actions for user
// ─────────────────────────────────────────────────────────────

/**
 * Select the optimal combination of actions using a greedy approach
 * weighted by personalized scores (no budget constraint).
 * Groups actions into phases and ensures category diversity.
 */
const selectOptimalActions = (
    allActions: any[],
    profile: LifestyleInput,
): ScoredAction[] => {
    // Score all actions
    const scored: ScoredAction[] = allActions
        .map((action) => ({
            actionId: action.id,
            name: action.name,
            category: action.category,
            description: action.description,
            icon: action.icon,
            carbonSavedKg: action.carbonSavedKg,
            monthlySavings: action.monthlySavings,
            upfrontCost: action.upfrontCost,
            difficulty: action.difficulty,
            phase: action.phase,
            treesEquivalent: action.treesEquivalent,
            tips: action.tips,
            personalScore: scoreAction(action, profile),
        }))
        .filter((a) => a.personalScore > 0) // Remove inapplicable actions
        .sort((a, b) => b.personalScore - a.personalScore); // Best first

    // Select top actions ensuring category diversity
    const categoryLimits: Record<string, number> = {
        energy: 5, transport: 4, diet: 4, waste: 3, tree_planting: 3,
    };
    const categoryCounts: Record<string, number> = {};
    const selected: ScoredAction[] = [];

    for (const action of scored) {
        const catCount = categoryCounts[action.category] || 0;
        const limit = categoryLimits[action.category] || 3;
        if (catCount < limit) {
            selected.push(action);
            categoryCounts[action.category] = catCount + 1;
        }
    }

    return selected;
};

// ─────────────────────────────────────────────────────────────
// PHASED PLAN GENERATOR
// ─────────────────────────────────────────────────────────────

const PHASE_CONFIG = [
    { phase: 'immediate', label: 'Quick Wins', months: 'Month 1-2', description: 'Easy changes you can start today with zero or minimal cost' },
    { phase: 'short_term', label: 'Building Habits', months: 'Month 3-6', description: 'Sustainable changes that become second nature over time' },
    { phase: 'medium_term', label: 'Growing Impact', months: 'Month 7-9', description: 'Bigger investments that pay back significantly' },
    { phase: 'long_term', label: 'Full Transformation', months: 'Month 10-12', description: 'Major lifestyle upgrades for maximum long-term impact' },
];

export const generatePlan = async (
    userId: string,
    profile: LifestyleInput,
): Promise<GeneratedPlan> => {
    // Ensure actions are seeded
    await seedActionsIfEmpty();

    // Fetch all active actions from database
    const allActions = await prisma.ecoAction.findMany({
        where: { isActive: true },
    });

    // Calculate tree debt
    const { annualCO2, treesNeeded } = calculateTreeDebt(profile);

    // Select optimal actions for this user
    const selectedActions = selectOptimalActions(allActions, profile);

    // Organize into phases
    const phases: PhasePlan[] = PHASE_CONFIG.map((config) => {
        const phaseActions = selectedActions
            .filter((a) => a.phase === config.phase)
            .sort((a, b) => b.personalScore - a.personalScore);

        const treesReduced = phaseActions.reduce((sum, a) => sum + a.treesEquivalent, 0);
        const monthlySavings = phaseActions.reduce((sum, a) => sum + a.monthlySavings, 0);

        return {
            ...config,
            actions: phaseActions,
            treesReduced: Math.round(treesReduced * 100) / 100,
            monthlySavings,
        };
    });

    // Financial calculations
    const totalMonthlySavings = selectedActions.reduce((s, a) => s + a.monthlySavings, 0);
    const totalUpfrontCost = selectedActions.reduce((s, a) => s + a.upfrontCost, 0);
    const totalCO2Reduced = selectedActions.reduce((s, a) => s + a.carbonSavedKg * 12, 0); // annual
    const treesReducedByActions = Math.round(totalCO2Reduced / CO2_PER_TREE_PER_YEAR * 100) / 100;
    const treesRemaining = Math.max(0, Math.round((treesNeeded - treesReducedByActions) * 100) / 100);
    const sponsorCost = Math.round(treesRemaining * COST_PER_TREE);
    const totalYearlySavings = totalMonthlySavings * 12;
    const netSavingsYear1 = totalYearlySavings - totalUpfrontCost - sponsorCost;

    // Health and community impact
    const healthBenefits: string[] = [];
    const communityImpact: string[] = [];

    if (selectedActions.some(a => a.category === 'diet')) {
        healthBenefits.push('Better diet and nutrition');
    }
    if (selectedActions.some(a => a.category === 'transport' && a.name.toLowerCase().includes('walk'))) {
        healthBenefits.push('More walking improves cardiovascular health');
    }
    if (selectedActions.some(a => a.category === 'transport' && a.name.toLowerCase().includes('cycle'))) {
        healthBenefits.push('Cycling improves fitness and reduces stress');
    }
    if (selectedActions.some(a => a.name.toLowerCase().includes('ac'))) {
        healthBenefits.push('Less AC dependency builds natural heat tolerance');
    }
    if (healthBenefits.length === 0) {
        healthBenefits.push('Reduced stress through eco-conscious living');
    }

    if (selectedActions.some(a => a.category === 'waste')) {
        communityImpact.push('Reduced local waste sent to landfills');
    }
    if (selectedActions.some(a => a.category === 'tree_planting')) {
        communityImpact.push('More trees improve local air quality');
    }
    communityImpact.push('Inspiring others through visible eco-actions');

    return {
        treesNeeded,
        phases,
        treesReducedByActions,
        treesRemaining,
        totalMonthlySavings,
        totalUpfrontCost,
        totalYearlySavings,
        totalCO2Reduced: Math.round(totalCO2Reduced),
        sponsorCost,
        netSavingsYear1,
        impactSummary: {
            co2ReducedAnnually: Math.round(totalCO2Reduced),
            equivalentTrees: Math.round(treesReducedByActions),
            moneySaved: totalYearlySavings,
            healthBenefits,
            communityImpact,
        },
        financialSummary: {
            oneTimeCosts: totalUpfrontCost,
            monthlySavingsStart: totalMonthlySavings,
            totalYear1Savings: totalYearlySavings,
            treesSponsored: Math.ceil(treesRemaining),
            sponsorCost,
            netSavingsYear1,
        },
    };
};

// ─────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS — Called by controller
// ─────────────────────────────────────────────────────────────

/**
 * Save or update user's lifestyle profile.
 */
export const saveLifestyleProfile = async (userId: string, data: LifestyleInput) => {
    return prisma.lifestyleProfile.upsert({
        where: { userId },
        update: { ...data, updatedAt: new Date() },
        create: { userId, ...data },
    });
};

/**
 * Generate a new eco plan for the user and persist it.
 */
export const generateAndSavePlan = async (userId: string, profileData: LifestyleInput) => {
    // Save/update lifestyle profile
    await saveLifestyleProfile(userId, profileData);

    // Check if user already has a plan that hasn't expired
    const existingPlan = await prisma.userEcoPlan.findUnique({
        where: { userId },
    });

    if (existingPlan && existingPlan.expiresAt > new Date()) {
        // Allow regeneration only if expired (30-day window)
        const daysSinceGeneration = Math.floor(
            (Date.now() - existingPlan.generatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceGeneration < 30) {
            // Return existing plan if less than 30 days old
            const planActions = await prisma.userPlanAction.findMany({
                where: { planId: existingPlan.id },
                include: { action: true },
                orderBy: { score: 'desc' },
            });
            return {
                plan: existingPlan,
                actions: planActions,
                isExisting: true,
            };
        }
    }

    // Generate new plan
    const plan = await generatePlan(userId, profileData);

    // Delete old plan if exists
    if (existingPlan) {
        await prisma.userPlanAction.deleteMany({ where: { planId: existingPlan.id } });
        await prisma.userEcoPlan.delete({ where: { id: existingPlan.id } });
    }

    // Save new plan
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const savedPlan = await prisma.userEcoPlan.create({
        data: {
            userId,
            treesNeeded: plan.treesNeeded,
            treesReducedByActions: plan.treesReducedByActions,
            treesRemaining: plan.treesRemaining,
            totalMonthlySavings: plan.totalMonthlySavings,
            totalUpfrontCost: plan.totalUpfrontCost,
            totalYearlySavings: plan.totalYearlySavings,
            totalCO2Reduced: plan.totalCO2Reduced,
            sponsorCost: plan.sponsorCost,
            netSavingsYear1: plan.netSavingsYear1,
            planData: plan as any,
            generatedAt: new Date(),
            expiresAt,
        },
    });

    // Save individual plan actions
    const allPlanActions = plan.phases.flatMap((phase) =>
        phase.actions.map((action) => ({
            planId: savedPlan.id,
            actionId: action.actionId,
            phase: action.phase,
            score: action.personalScore,
        }))
    );

    if (allPlanActions.length > 0) {
        await prisma.userPlanAction.createMany({ data: allPlanActions });
    }

    // Update user's treesToOffset
    await prisma.user.update({
        where: { id: userId },
        data: { treesToOffset: plan.treesNeeded },
    });

    return { plan: { ...savedPlan, planData: plan }, actions: allPlanActions, isExisting: false };
};

/**
 * Get user's current eco plan.
 */
export const getCurrentPlan = async (userId: string) => {
    const plan = await prisma.userEcoPlan.findUnique({
        where: { userId },
        include: {
            actions: {
                include: { action: true },
                orderBy: { score: 'desc' },
            },
        },
    });

    if (!plan) return null;

    // Calculate completion percentage
    const totalActions = plan.actions.length;
    const completedActions = plan.actions.filter((a) => a.isCompleted).length;
    const completionPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    return { ...plan, completionPercent };
};

/**
 * Update action progress (mark as completed/uncompleted).
 */
export const updateActionProgress = async (
    userId: string,
    actionId: string,
    isCompleted: boolean,
) => {
    const plan = await prisma.userEcoPlan.findUnique({ where: { userId } });
    if (!plan) throw new Error('No eco plan found. Generate a plan first.');

    const planAction = await prisma.userPlanAction.findFirst({
        where: { planId: plan.id, actionId },
    });
    if (!planAction) throw new Error('Action not found in your plan.');

    const updated = await prisma.userPlanAction.update({
        where: { id: planAction.id },
        data: {
            isCompleted,
            completedAt: isCompleted ? new Date() : null,
        },
    });

    // Recalculate plan completion percentage
    const allActions = await prisma.userPlanAction.findMany({
        where: { planId: plan.id },
    });
    const totalActions = allActions.length;
    const completedActions = allActions.filter((a) => a.isCompleted).length;
    const completionPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    await prisma.userEcoPlan.update({
        where: { id: plan.id },
        data: { completionPercent, updatedAt: new Date() },
    });

    return { updated, completionPercent, completedCount: completedActions, totalCount: totalActions };
};

/**
 * Get all available eco actions.
 */
export const getAllActions = async () => {
    await seedActionsIfEmpty();
    return prisma.ecoAction.findMany({
        where: { isActive: true },
        orderBy: { category: 'asc' },
    });
};

/**
 * Get user's impact summary across their eco plan.
 */
export const getImpactSummary = async (userId: string) => {
    const plan = await prisma.userEcoPlan.findUnique({
        where: { userId },
        include: {
            actions: {
                include: { action: true },
            },
        },
    });

    if (!plan) return null;

    const completedActions = plan.actions.filter((a) => a.isCompleted);
    const co2Saved = completedActions.reduce((sum, a) => sum + a.action.carbonSavedKg * 12, 0);
    const moneySaved = completedActions.reduce((sum, a) => sum + a.action.monthlySavings, 0);
    const treesOffset = completedActions.reduce((sum, a) => sum + a.action.treesEquivalent, 0);

    // Milestones
    const milestones = [];
    if (completedActions.length >= 1) milestones.push({ name: 'First Step', icon: '🌱', achieved: true });
    if (completedActions.length >= 5) milestones.push({ name: 'Eco Starter', icon: '🌿', achieved: true });
    if (completedActions.length >= 10) milestones.push({ name: 'Green Warrior', icon: '🌳', achieved: true });
    if (plan.completionPercent >= 50) milestones.push({ name: 'Halfway Hero', icon: '⭐', achieved: true });
    if (plan.completionPercent >= 100) milestones.push({ name: 'Eco Champion', icon: '🏆', achieved: true });

    // Add unachieved upcoming milestones
    if (completedActions.length < 5) milestones.push({ name: 'Eco Starter', icon: '🌿', achieved: false });
    if (completedActions.length < 10) milestones.push({ name: 'Green Warrior', icon: '🌳', achieved: false });
    if (plan.completionPercent < 50) milestones.push({ name: 'Halfway Hero', icon: '⭐', achieved: false });

    return {
        totalActions: plan.actions.length,
        completedActions: completedActions.length,
        completionPercent: plan.completionPercent,
        co2SavedAnnually: Math.round(co2Saved),
        monthlySavings: moneySaved,
        treesOffsetByActions: Math.round(treesOffset * 100) / 100,
        treesRemaining: plan.treesRemaining,
        milestones,
        planGeneratedAt: plan.generatedAt,
    };
};
