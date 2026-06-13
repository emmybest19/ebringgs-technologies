import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { askGemini } from '../services/aiTutor.service';

const MAX_QUESTION_LEN = 2000;
const MAX_HISTORY_TURNS = 12;

// Per-user, per-day in-memory rate limit. For early operations this is fine;
// move to Redis when running multi-instance.
const DAILY_LIMIT = Number(process.env.AI_TUTOR_DAILY_LIMIT || 30);
const usageLog = new Map<string, { count: number; day: string }>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkAndIncrement(userId: string): { ok: true } | { ok: false; remaining: 0 } {
  const today = todayKey();
  const entry = usageLog.get(userId);
  if (!entry || entry.day !== today) {
    usageLog.set(userId, { count: 1, day: today });
    return { ok: true };
  }
  if (entry.count >= DAILY_LIMIT) return { ok: false, remaining: 0 };
  entry.count += 1;
  return { ok: true };
}

export function getRemainingQuota(userId: string): number {
  const today = todayKey();
  const entry = usageLog.get(userId);
  if (!entry || entry.day !== today) return DAILY_LIMIT;
  return Math.max(0, DAILY_LIMIT - entry.count);
}

interface HistoryTurn {
  role: 'user' | 'model';
  text: string;
}

// POST /api/ai-tutor/ask
export const ask = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { question, context, history } = req.body as {
      question?: string;
      context?: string;
      history?: HistoryTurn[];
    };

    if (!question || typeof question !== 'string' || !question.trim()) {
      return next(new AppError('A question is required.', 400));
    }
    if (question.length > MAX_QUESTION_LEN) {
      return next(new AppError(`Question must be ${MAX_QUESTION_LEN} characters or fewer.`, 400));
    }

    const limit = checkAndIncrement(userId);
    if (!limit.ok) {
      return next(new AppError(`You've used your ${DAILY_LIMIT} AI questions for today. Try again tomorrow.`, 429));
    }

    const cleanHistory = Array.isArray(history)
      ? history
          .filter((t) => t && (t.role === 'user' || t.role === 'model') && typeof t.text === 'string')
          .slice(-MAX_HISTORY_TURNS)
      : [];

    const cleanContext = typeof context === 'string' ? context.slice(0, 6000) : undefined;

    const answer = await askGemini({
      question: question.trim(),
      context: cleanContext,
      history: cleanHistory,
    });

    res.json({
      status: 'success',
      data: {
        answer,
        remaining: getRemainingQuota(userId),
      },
    });
  } catch (err: unknown) {
    const msg = (err as Error).message || 'AI tutor failed.';
    if (msg.includes('not configured')) {
      return next(new AppError('AI tutor is not enabled yet. Contact admin.', 503));
    }
    next(err);
  }
};

// GET /api/ai-tutor/quota
export const getQuota = async (req: AuthRequest, res: Response) => {
  res.json({
    status: 'success',
    data: {
      limit: DAILY_LIMIT,
      remaining: getRemainingQuota(req.user!.userId),
    },
  });
};
