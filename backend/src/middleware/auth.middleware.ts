import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}

/**
 * JWT Authentication middleware.
 * Extracts and verifies the Bearer token from the Authorization header.
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Access denied. No token provided.',
                statusCode: 401,
            },
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
        (req as any).user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: {
                message: 'Invalid or expired token.',
                statusCode: 403,
            },
        });
    }
};

/**
 * Optional auth — sets user if token exists, but doesn't block.
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
            (req as any).user = decoded;
        } catch {
            // Token invalid, but we still proceed
        }
    }
    next();
};
