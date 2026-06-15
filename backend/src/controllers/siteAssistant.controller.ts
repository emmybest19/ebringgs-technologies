import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import { askSiteAssistant } from '../services/siteAssistant.service';

const MAX_QUESTION_LEN = 1500;
const MAX_HISTORY_TURNS = 10;

interface HistoryTurn {
  role: 'user' | 'model';
  text: string;
}

// POST /api/site-assistant/ask
// Public endpoint, no auth, rate-limited per IP by the route layer.
export const askPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { question, history } = req.body as {
      question?: string;
      history?: HistoryTurn[];
    };

    if (!question || typeof question !== 'string' || !question.trim()) {
      return next(new AppError('A question is required.', 400));
    }
    if (question.length > MAX_QUESTION_LEN) {
      return next(new AppError(`Question must be ${MAX_QUESTION_LEN} characters or fewer.`, 400));
    }

    const cleanHistory = Array.isArray(history)
      ? history
          .filter((t) => t && (t.role === 'user' || t.role === 'model') && typeof t.text === 'string')
          .slice(-MAX_HISTORY_TURNS)
      : [];

    const reply = await askSiteAssistant({
      question: question.trim(),
      history: cleanHistory,
    });

    res.json({
      status: 'success',
      data: reply,
    });
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Site assistant failed.';
    console.error('[site-assistant] ask failed:', msg);
    if (msg.includes('not configured')) {
      return next(new AppError('Site assistant is not enabled yet.', 503));
    }
    // Surface the actual upstream message so the UI can show a useful hint.
    return next(new AppError(`Site assistant error: ${msg}`, 502));
  }
};
