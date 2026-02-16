import { Request, Response, NextFunction } from 'express';
import { extractUnitsFromText, processCarbonBill, getUserCarbonBills, getUserCarbonSummary } from '../services/carbon.service';
import { AppError } from '../middleware/errorHandler';

/**
 * @swagger
 * /api/v1/carbon/upload-bill:
 *   post:
 *     summary: Upload a utility bill image for OCR processing
 *     tags: [Carbon]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               billImage: { type: string, format: binary }
 *               billType: { type: string, enum: [electricity, gas, water] }
 *     responses:
 *       200: { description: Bill processed with carbon calculation }
 */
export const uploadBill = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { billType } = req.body;
        const file = (req as any).file;

        if (!file) {
            throw new AppError('No bill image uploaded', 400);
        }

        // Dynamic import of Tesseract to avoid startup cost
        let rawText = '';
        try {
            const Tesseract = require('tesseract.js');
            const result = await Tesseract.recognize(file.path, 'eng', {
                logger: (m: any) => {
                    if (m.status === 'recognizing text') {
                        console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
                    }
                },
            });
            rawText = result.data.text;
        } catch (ocrError) {
            console.warn('[OCR] Tesseract failed, using manual fallback:', ocrError);
            throw new AppError('OCR processing failed. Please enter units manually.', 422);
        }

        // Extract units from OCR text
        const { totalUnits, patterns } = extractUnitsFromText(rawText);

        if (!totalUnits || totalUnits <= 0) {
            return res.status(200).json({
                success: false,
                message: 'Could not extract consumption units from the bill. Please enter manually.',
                rawText: rawText.substring(0, 500),
                patterns,
                requiresManualInput: true,
            });
        }

        // Process the bill
        const result = await processCarbonBill(
            userId,
            billType || 'electricity',
            totalUnits,
            rawText,
            file.path,
            { patterns, ocrConfidence: 'auto' }
        );

        res.json({
            success: true,
            message: `Bill processed: ${result.formula}`,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/carbon/manual:
 *   post:
 *     summary: Manually enter utility bill data
 *     tags: [Carbon]
 *     security: [{ bearerAuth: [] }]
 */
export const manualBillEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { billType, totalUnits, billDate } = req.body;

        if (!totalUnits || totalUnits <= 0) {
            throw new AppError('Total units must be a positive number', 400);
        }

        const result = await processCarbonBill(userId, billType, totalUnits);

        res.json({
            success: true,
            message: `Bill processed: ${result.formula}`,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/carbon/history:
 *   get:
 *     summary: Get user's carbon bill history
 *     tags: [Carbon]
 *     security: [{ bearerAuth: [] }]
 */
export const getCarbonHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const limit = parseInt(req.query.limit as string) || 20;
        const bills = await getUserCarbonBills(userId, limit);
        res.json({ success: true, data: bills });
    } catch (error) {
        next(error);
    }
};

/**
 * @swagger
 * /api/v1/carbon/summary:
 *   get:
 *     summary: Get user's carbon footprint summary
 *     tags: [Carbon]
 *     security: [{ bearerAuth: [] }]
 */
export const getCarbonSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const summary = await getUserCarbonSummary(userId);
        res.json({ success: true, ...summary });
    } catch (error) {
        next(error);
    }
};
