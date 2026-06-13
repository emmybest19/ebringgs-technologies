import { Request, Response, NextFunction } from 'express';

export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No file uploaded.' });
      return;
    }
    res.json({
      status: 'success',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
      },
    });
  } catch (err) { next(err); }
};
