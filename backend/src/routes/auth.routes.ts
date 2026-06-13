import { Router } from 'express';
import { register, login, refreshToken, getMe, forgotPassword, resetPassword, verifyEmail, resendVerification } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema } from '../validators/auth.validators';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user account management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: Kwame Mensah }
 *               email:    { type: string, format: email, example: kwame@example.com }
 *               password: { type: string, minLength: 8, example: MyPass123 }
 *               role:     { type: string, enum: [student, client], example: student }
 *     responses:
 *       201:
 *         description: User registered; verification email sent
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive access + refresh tokens
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful; returns accessToken, refreshToken, and user
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using a valid refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New access token returned
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent (always returns 200 to prevent user enumeration)
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a token from the reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:    { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify email address via token sent in verification email
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend the email verification link (requires login)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Verification email resent
 */
router.post('/resend-verification', protect, resendVerification);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Returns the authenticated user object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get('/me', protect, getMe);

export default router;
