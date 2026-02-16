import prisma from '../lib/prisma';

// Emission factors (kg CO₂ per unit)
const EMISSION_FACTORS: Record<string, number> = {
    electricity: 0.85,  // kg CO₂ per kWh
    gas: 2.0,           // kg CO₂ per therm
    water: 0.36,        // kg CO₂ per kL
};

/**
 * Extract units from OCR raw text using regex patterns.
 * Looks for common utility bill patterns.
 */
export const extractUnitsFromText = (rawText: string): { totalUnits: number | null; patterns: string[] } => {
    const patterns: string[] = [];
    let totalUnits: number | null = null;

    // Pattern 1: "Total Units: 245" or "Units Consumed: 245"
    const unitsPattern = /(?:total\s*units|units?\s*consumed|consumption)\s*[:\-]?\s*([\d,]+\.?\d*)/gi;
    let match = unitsPattern.exec(rawText);
    if (match) {
        totalUnits = parseFloat(match[1].replace(',', ''));
        patterns.push(`units_pattern: ${match[0]}`);
    }

    // Pattern 2: "245 kWh" or "245 KWH"
    if (!totalUnits) {
        const kwhPattern = /([\d,]+\.?\d*)\s*kwh/gi;
        match = kwhPattern.exec(rawText);
        if (match) {
            totalUnits = parseFloat(match[1].replace(',', ''));
            patterns.push(`kwh_pattern: ${match[0]}`);
        }
    }

    // Pattern 3: "Amount Consumed: 245" or "Energy Consumed: 245"
    if (!totalUnits) {
        const amountPattern = /(?:amount|energy)\s*consumed\s*[:\-]?\s*([\d,]+\.?\d*)/gi;
        match = amountPattern.exec(rawText);
        if (match) {
            totalUnits = parseFloat(match[1].replace(',', ''));
            patterns.push(`amount_pattern: ${match[0]}`);
        }
    }

    // Pattern 4: "Reading: 12345 - 12100 = 245"
    if (!totalUnits) {
        const readingPattern = /(\d+)\s*[-–]\s*(\d+)\s*=\s*([\d,]+\.?\d*)/gi;
        match = readingPattern.exec(rawText);
        if (match) {
            totalUnits = parseFloat(match[3].replace(',', ''));
            patterns.push(`reading_diff_pattern: ${match[0]}`);
        }
    }

    return { totalUnits, patterns };
};

/**
 * Calculate CO₂ emissions from utility consumption.
 * Formula: totalUnits × emissionFactor = kg CO₂
 */
export const calculateCarbonEmission = (totalUnits: number, billType: string): number => {
    const factor = EMISSION_FACTORS[billType] || EMISSION_FACTORS.electricity;
    return Math.round(totalUnits * factor * 100) / 100; // Round to 2 decimal places
};

/**
 * Process a carbon bill (either from OCR or manual input).
 * Saves the bill and updates user's carbon_debt.
 */
export const processCarbonBill = async (
    userId: string,
    billType: string,
    totalUnits: number,
    rawText?: string,
    imagePath?: string,
    extractedData?: any
): Promise<any> => {
    const carbonKg = calculateCarbonEmission(totalUnits, billType);

    // Create the bill record
    const bill = await prisma.carbonBill.create({
        data: {
            userId,
            billType,
            totalUnits,
            carbonKg,
            rawText: rawText || null,
            imagePath: imagePath || null,
            extractedData: extractedData || null,
        },
    });

    // Update user's carbonDebt and lifetimeCarbon
    await prisma.user.update({
        where: { id: userId },
        data: {
            carbonDebt: { increment: carbonKg },
            lifetimeCarbon: { increment: carbonKg },
        },
    });

    return {
        bill,
        carbonKg,
        formula: `${totalUnits} ${billType === 'electricity' ? 'kWh' : 'units'} × ${EMISSION_FACTORS[billType]} = ${carbonKg} kg CO₂`,
    };
};

/**
 * Get carbon bill history for a user.
 */
export const getUserCarbonBills = async (userId: string, limit: number = 20) => {
    return prisma.carbonBill.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
};

/**
 * Get user's carbon summary.
 */
export const getUserCarbonSummary = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            lifetimeCarbon: true,
            carbonDebt: true,
            treesToOffset: true,
            totalTreesPlanted: true,
        },
    });

    const bills = await prisma.carbonBill.groupBy({
        by: ['billType'],
        where: { userId },
        _sum: { carbonKg: true, totalUnits: true },
        _count: true,
    });

    return { user, breakdownByType: bills };
};
