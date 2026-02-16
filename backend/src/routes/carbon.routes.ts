import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadBill, manualBillEntry, getCarbonHistory, getCarbonSummary } from '../controllers/carbon.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { carbonBillManualSchema } from '../schemas';

// Multer config for bill image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/bills'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `bill-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, webp) and PDFs are allowed'));
        }
    },
});

const router = Router();

router.post('/upload-bill', authenticateToken, upload.single('billImage'), uploadBill);
router.post('/manual', authenticateToken, validate(carbonBillManualSchema), manualBillEntry);
router.get('/history', authenticateToken, getCarbonHistory);
router.get('/summary', authenticateToken, getCarbonSummary);

export default router;
