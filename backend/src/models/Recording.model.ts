import mongoose, { Document, Schema } from 'mongoose';

/**
 * A class recording — captured client-side by the teacher's browser via
 * MediaRecorder and uploaded as a video blob (typically video/webm).
 *
 * v1 limitations (worth knowing):
 *   - Captures the teacher's camera + mic stream only. Screen-share is not
 *     part of the recording in this version.
 *   - The teacher's browser tab must stay open for the whole recording.
 *   - Files are stored on local disk under `backend/uploads/recordings/`.
 *     Swap in S3 / Cloud Storage before going to production scale.
 */

export interface IRecording extends Document {
  uploader: mongoose.Types.ObjectId;   // teacher or admin who recorded
  title: string;
  description?: string;
  url: string;                         // public path under /uploads/recordings/
  filename: string;                    // server-side filename for delete
  mimeType: string;                    // typically video/webm
  sizeBytes: number;
  durationSec?: number;                // client-reported duration
  /** Optional roomId from the WebRTC classroom, lets us trace back to a session. */
  roomId?: string;
  /** Optional tag matching a Checkout / tutoring planId so we can show
   * the recording to students enrolled in that track later. */
  planId?: string;
  /** When false, hide from student-facing listings (default true). */
  visibleToStudents: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recordingSchema = new Schema<IRecording>(
  {
    uploader:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    url:         { type: String, required: true },
    filename:    { type: String, required: true },
    mimeType:    { type: String, required: true },
    sizeBytes:   { type: Number, required: true, min: 0 },
    durationSec: { type: Number, min: 0 },
    roomId:      { type: String, trim: true, index: true },
    planId:      { type: String, trim: true, index: true },
    visibleToStudents: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Most common access pattern: newest recordings first.
recordingSchema.index({ createdAt: -1 });

export default mongoose.model<IRecording>('Recording', recordingSchema);
