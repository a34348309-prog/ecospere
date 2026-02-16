import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many requests. Please try again later.',
            statusCode: 429,
        },
    },
});

/**
 * Auth rate limiter — 10 attempts per 15 minutes (login/register).
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Too many authentication attempts. Please try again later.',
            statusCode: 429,
        },
    },
});

/**
 * Expensive API limiter — 20 requests per 15 minutes (Google AQI, OCR).
 */
export const expensiveApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            message: 'Rate limit exceeded for this resource. Please try again later.',
            statusCode: 429,
        },
    },
});
