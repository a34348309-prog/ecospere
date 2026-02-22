-- CreateTable: LifestyleProfile
CREATE TABLE "LifestyleProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commuteDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vehicleType" TEXT NOT NULL DEFAULT 'none',
    "monthlyElectricity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "age" INTEGER NOT NULL DEFAULT 25,
    "city" TEXT NOT NULL DEFAULT '',
    "dietaryPreference" TEXT NOT NULL DEFAULT 'non_vegetarian',
    "meatMealsPerWeek" INTEGER NOT NULL DEFAULT 7,
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "homeOwnership" TEXT NOT NULL DEFAULT 'rent',
    "householdSize" INTEGER NOT NULL DEFAULT 1,
    "acUsageHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wasteRecycling" TEXT NOT NULL DEFAULT 'sometimes',
    "monthlyGroceryBill" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "willingnessChangeDiet" INTEGER NOT NULL DEFAULT 3,
    "willingnessPublicTransport" INTEGER NOT NULL DEFAULT 3,
    "timeAvailability" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifestyleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EcoAction
CREATE TABLE "EcoAction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🌱',
    "carbonSavedKg" DOUBLE PRECISION NOT NULL,
    "monthlySavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "upfrontCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "phase" TEXT NOT NULL DEFAULT 'short_term',
    "requiresGarden" BOOLEAN NOT NULL DEFAULT false,
    "requiresHomeOwnership" BOOLEAN NOT NULL DEFAULT false,
    "minHouseholdSize" INTEGER NOT NULL DEFAULT 1,
    "applicableVehicles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicableDiets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "treesEquivalent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tips" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EcoAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserEcoPlan
CREATE TABLE "UserEcoPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "treesNeeded" INTEGER NOT NULL DEFAULT 0,
    "treesReducedByActions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "treesRemaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMonthlySavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUpfrontCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalYearlySavings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCO2Reduced" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sponsorCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSavingsYear1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planData" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEcoPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserPlanAction
CREATE TABLE "UserPlanAction" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPlanAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LifestyleProfile_userId_key" ON "LifestyleProfile"("userId");
CREATE UNIQUE INDEX "UserEcoPlan_userId_key" ON "UserEcoPlan"("userId");
CREATE UNIQUE INDEX "UserPlanAction_planId_actionId_key" ON "UserPlanAction"("planId", "actionId");

-- AddForeignKey
ALTER TABLE "LifestyleProfile" ADD CONSTRAINT "LifestyleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserEcoPlan" ADD CONSTRAINT "UserEcoPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserPlanAction" ADD CONSTRAINT "UserPlanAction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "UserEcoPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPlanAction" ADD CONSTRAINT "UserPlanAction_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "EcoAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
