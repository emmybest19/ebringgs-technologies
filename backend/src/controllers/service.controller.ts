import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../types';
import ServiceInquiry from '../models/ServiceInquiry.model';
import User from '../models/User.model';
import { sendPushToRole } from '../utils/pushNotification';
import { sendEmail, emailTemplates } from '../utils/email';
import { servicesCatalog, getService as findService, isServiceInstallmentEligible } from '../config/services.catalog';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Decorate the catalog entry with the computed installment-eligibility flag.
// We compute it here rather than letting the frontend re-derive the ₦200k floor.
function decorate(service: typeof servicesCatalog[number]) {
  return { ...service, installmentEligible: isServiceInstallmentEligible(service) };
}

export const listServices = (_req: Request, res: Response) => {
  res.json({ status: 'success', data: { services: servicesCatalog.map(decorate) } });
};

export const getService = (req: Request, res: Response, next: NextFunction) => {
  const service = findService(req.params.id);
  if (!service) return next(new AppError('Service not found.', 404));
  res.json({ status: 'success', data: { service: decorate(service) } });
};

export const submitInquiry = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let {
      name, email, serviceId, message,
      goals, budgetRange, timeline, referenceLinks,
    } = req.body;

    // Auto-fill from auth'd user (override anything sent in the body)
    if (req.user?.userId) {
      const user = await User.findById(req.user.userId).select('name email');
      if (user) {
        name = user.name;
        email = user.email;
      }
    }

    if (!name || !email || !message) {
      return next(new AppError('Name, email and message are required.', 400));
    }

    const cleanedLinks: string[] | undefined = Array.isArray(referenceLinks)
      ? referenceLinks.map((l: unknown) => String(l).trim()).filter((l: string) => l.length > 0).slice(0, 10)
      : undefined;

    const service = findService(serviceId);
    await ServiceInquiry.create({
      name,
      email,
      user: req.user?.userId,
      serviceId: serviceId ?? null,
      serviceName: service?.title ?? null,
      message,
      goals,
      budgetRange,
      timeline,
      referenceLinks: cleanedLinks,
    });
    // Notify admins via push (instant if online)
    sendPushToRole('admin', {
      title: 'New Service Inquiry',
      body: `${name} inquired about ${service?.title || 'a service'}.`,
      url: '/admin/service-requests',
      tag: 'service-inquiry',
    }).catch(() => {});

    // Email every admin (always reaches them — fire & forget)
    notifyAdminsByEmail(name, email, service?.title || 'General inquiry', message)
      .catch((err) => console.error('[email] admin inquiry notification failed:', err.message));

    res.status(201).json({ status: 'success', message: 'Inquiry submitted. We will be in touch shortly.' });
  } catch (err) { next(err); }
};

async function notifyAdminsByEmail(
  inquirerName: string,
  inquirerEmail: string,
  serviceName: string,
  message: string,
): Promise<void> {
  const admins = await User.find({ role: 'admin' }).select('email').lean();
  if (admins.length === 0) return;

  const { subject, html } = emailTemplates.newServiceInquiry(
    inquirerName, inquirerEmail, serviceName, message, CLIENT_URL,
  );

  // Send in parallel; one failure shouldn't block the others
  await Promise.allSettled(
    admins.map((a) => sendEmail({ to: a.email, subject, html })),
  );
}
