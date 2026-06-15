import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import path from 'path';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import blogRoutes from './routes/blog.routes';
import serviceRoutes from './routes/service.routes';
import uploadRoutes from './routes/upload.routes';
import assignmentRoutes from './routes/assignment.routes';
import adminRoutes from './routes/admin.routes';
import projectRoutes from './routes/project.routes';
import paystackRoutes from './routes/paystack.routes';
import paymentPlanRoutes from './routes/paymentPlan.routes';
import pushRoutes from './routes/push.routes';
import liveSessionRoutes from './routes/liveSession.routes';
import cohortRoutes from './routes/cohort.routes';
import newsletterRoutes from './routes/newsletter.routes';
import certificateRoutes from './routes/certificate.routes';
import pointsRoutes from './routes/points.routes';
import reviewRoutes from './routes/review.routes';
import voucherRoutes from './routes/voucher.routes';
import caseStudyRoutes from './routes/caseStudy.routes';
import aiTutorRoutes from './routes/aiTutor.routes';
import siteAssistantRoutes from './routes/siteAssistant.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/paystack', paystackRoutes);
app.use('/api/payment-plans', paymentPlanRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/live-sessions', liveSessionRoutes);
app.use('/api/cohorts', cohortRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/ai-tutor', aiTutorRoutes);
app.use('/api/site-assistant', siteAssistantRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API docs
app.use('/api/docs', swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'E-Bringgs API Docs',
    swaggerOptions: { persistAuthorization: true },
  }),
);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
