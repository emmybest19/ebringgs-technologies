// Shared helpers for the student dashboard pages
export const POINT_TO_NAIRA = 100;

export const formatNaira = (pts: number) => `₦${(pts * POINT_TO_NAIRA).toLocaleString()}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export interface UpcomingSession {
  _id: string;
  title: string;
  courseTitle: string;
  instructor: string;
  scheduledAt: string;
  durationMinutes: number;
  roomId: string;
  meetingUrl?: string;
}

export interface MyAssignment {
  _id: string;
  title: string;
  description: string;
  program: string;
  status: 'submitted' | 'reviewed';
  fileUrl?: string;
  fileName?: string;
  feedback?: string;
  grade?: string;
  submittedAt: string;
  reviewedAt?: string;
}
