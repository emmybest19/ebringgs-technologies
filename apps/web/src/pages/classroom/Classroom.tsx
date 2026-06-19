import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, PhoneOff, Send, X, UserMinus,
  VolumeX, ClipboardList, Pencil, Info, Circle, Square, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@ebringgs/auth';
import { useUploadRecording } from '../../services/queries';
import AnnotationOverlay from './AnnotationOverlay';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
}

interface Participant {
  userId: string;
  name: string;
  isMuted: boolean;
  joinedAt: Date;
}

type SidePanel = 'chat' | 'participants' | 'attendance' | null;

const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined)
  || `ws://localhost:${import.meta.env.VITE_API_PORT || 5000}/ws`;

export default function Classroom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendance, setAttendance] = useState<Participant[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [showMirrorTip, setShowMirrorTip] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isInstructor = user?.role === 'admin' || user?.role === 'teacher';

  /* ─── Class recording (MediaRecorder, instructor-only) ──────────────
     v1: captures the teacher's local camera + mic only. Screen share is
     NOT captured (separate stream). On stop, opens a small dialog asking
     for a title and uploads the blob via POST /api/recordings. */
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [pendingRecording, setPendingRecording] = useState<{ blob: Blob; durationSec: number } | null>(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const uploadRecording = useUploadRecording();

  // Tick the elapsed timer once a second while recording.
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      if (recordingStartedAtRef.current) {
        setRecordingElapsed(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const startRecording = () => {
    if (!localStream) {
      toast.error('Camera + mic not ready yet.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      toast.error('Your browser does not support MediaRecorder.');
      return;
    }
    try {
      recordedChunksRef.current = [];
      const mr = new MediaRecorder(localStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm',
      });
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mr.mimeType || 'video/webm' });
        const startedAt = recordingStartedAtRef.current ?? Date.now();
        const durationSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
        setPendingRecording({ blob, durationSec });
        // Pre-fill a sensible default title.
        setSaveTitle(`Class ${new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}`);
      };
      // Chunk every 5 s so a crash mid-class still leaves something usable.
      mr.start(5000);
      mediaRecorderRef.current = mr;
      recordingStartedAtRef.current = Date.now();
      setRecordingElapsed(0);
      setIsRecording(true);
      toast.success('Recording started.');
    } catch (err) {
      console.error(err);
      toast.error('Could not start recording.');
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
    setIsRecording(false);
    mediaRecorderRef.current = null;
  };

  const cancelPendingRecording = () => {
    setPendingRecording(null);
    setSaveTitle('');
    setUploadProgress(null);
    recordedChunksRef.current = [];
  };

  const uploadPendingRecording = () => {
    if (!pendingRecording) return;
    const title = saveTitle.trim();
    if (!title) {
      toast.error('Give the recording a title before uploading.');
      return;
    }
    setUploadProgress(0);
    uploadRecording.mutate(
      {
        file: pendingRecording.blob,
        title,
        durationSec: pendingRecording.durationSec,
        roomId: roomId || undefined,
        onProgress: (pct) => setUploadProgress(pct),
      },
      {
        onSuccess: () => {
          toast.success('Recording saved.');
          cancelPendingRecording();
        },
        onError: () => {
          toast.error('Upload failed. The recording is still in memory — try again.');
          setUploadProgress(null);
        },
      },
    );
  };

  const recordingLabel = (() => {
    const m = Math.floor(recordingElapsed / 60);
    const s = recordingElapsed % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); }
  }, [isAuthenticated, navigate]);

  // Connect WebSocket after joining
  const connectWS = useCallback(() => {
    if (!user || !roomId) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        roomId,
        userId: user._id || user.email,
        name: user.name,
      }));
      // Request attendance snapshot
      ws.send(JSON.stringify({ type: 'attendance' }));
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string);
        switch (msg.type) {
          case 'room-participants':
            setParticipants(msg.participants.map((p: { userId: string; name: string }) => ({
              userId: p.userId, name: p.name, isMuted: false, joinedAt: new Date(),
            })));
            break;

          case 'user-joined':
            setParticipants(prev => {
              if (prev.some(p => p.userId === msg.userId)) return prev;
              return [...prev, { userId: msg.userId, name: msg.name, isMuted: false, joinedAt: new Date() }];
            });
            setAttendance(prev => {
              if (prev.some(p => p.userId === msg.userId)) return prev;
              return [...prev, { userId: msg.userId, name: msg.name, isMuted: false, joinedAt: new Date() }];
            });
            setChatMessages(prev => [...prev, {
              id: Date.now().toString(), sender: 'System',
              text: `${msg.name} joined`, timestamp: new Date(),
            }]);
            break;

          case 'user-left':
            setParticipants(prev => prev.filter(p => p.userId !== msg.userId));
            setChatMessages(prev => [...prev, {
              id: Date.now().toString(), sender: 'System',
              text: `${msg.name} left`, timestamp: new Date(),
            }]);
            break;

          case 'chat':
            setChatMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: msg.fromName,
              text: msg.text,
              timestamp: new Date(msg.timestamp),
            }]);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            break;

          case 'mute-all':
            // Force local mute if we're not the instructor who sent it
            if (msg.fromId !== (user._id || user.email)) {
              setIsMuted(true);
              setLocalStream(prev => {
                prev?.getAudioTracks().forEach(t => { t.enabled = false; });
                return prev;
              });
            }
            break;

          case 'kicked':
            ws.close();
            alert('You have been removed from this session by the instructor.');
            navigate('/dashboard');
            break;

          case 'attendance-update':
            setAttendance(msg.participants.map((p: { userId: string; name: string }) => ({
              userId: p.userId, name: p.name, isMuted: false, joinedAt: new Date(),
            })));
            break;

          // WebRTC signaling (basic forwarding, full mesh would need more logic)
          case 'offer':
          case 'answer':
          case 'ice-candidate':
            handleSignaling(msg);
            break;
        }
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => { wsRef.current = null; };
  }, [user, roomId, navigate]);

  const handleSignaling = async (msg: {
    type: string; fromId: string; sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  }) => {
    const pc = peerConnections.current.get(msg.fromId);
    if (!pc) return;
    if (msg.type === 'offer' && msg.sdp) {
      await pc.setRemoteDescription(msg.sdp);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      wsRef.current?.send(JSON.stringify({ type: 'answer', targetId: msg.fromId, sdp: answer }));
    } else if (msg.type === 'answer' && msg.sdp) {
      await pc.setRemoteDescription(msg.sdp);
    } else if (msg.type === 'ice-candidate' && msg.candidate) {
      await pc.addIceCandidate(msg.candidate);
    }
  };

  const startLocalStream = useCallback(async () => {
    try {
      // Explicit constraints help most cameras start in <1s. Bare booleans
      // make some Windows drivers negotiate a default for several seconds.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setLocalStream(stream);
      setJoined(true);
      setChatMessages([{
        id: '0', sender: 'System',
        text: `Welcome to room ${roomId}. The session is in progress.`,
        timestamp: new Date(),
      }]);
      connectWS();
    } catch (err) {
      console.error('Could not access camera/mic:', err);
      setJoined(true);
      connectWS();
    }
  }, [roomId, connectWS]);

  // Attach the stream to the <video> element once both exist. Doing this
  // inline inside startLocalStream is unreliable because the <video> ref is
  // null until React re-renders with `joined === true`.
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, joined, isVideoOff]);

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(t => t.stop());
      wsRef.current?.close();
      peerConnections.current.forEach(pc => pc.close());
    };
  }, [localStream]);

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    setIsMuted(v => !v);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = isVideoOff; });
    setIsVideoOff(v => !v);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      localStream?.getTracks().forEach(t => t.stop());
      await startLocalStream();
      setIsScreenSharing(false);
      setIsAnnotating(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setLocalStream(screenStream);
        // The useEffect on localStream rebinds srcObject automatically.
        setIsScreenSharing(true);
        setShowMirrorTip(true);
        screenStream.getVideoTracks()[0].onended = () => {
          startLocalStream();
          setIsScreenSharing(false);
          setIsAnnotating(false);
        };
      } catch { /* user cancelled */ }
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    wsRef.current?.send(JSON.stringify({ type: 'chat', text }));
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(), sender: user?.name || 'Me',
      text, timestamp: new Date(),
    }]);
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const muteAll = () => {
    wsRef.current?.send(JSON.stringify({ type: 'mute-all' }));
  };

  const kickParticipant = (targetId: string) => {
    if (!confirm('Remove this participant from the session?')) return;
    wsRef.current?.send(JSON.stringify({ type: 'kick', targetId }));
    setParticipants(prev => prev.filter(p => p.userId !== targetId));
  };

  const leaveRoom = () => {
    localStream?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
    navigate('/dashboard');
  };

  const togglePanel = (panel: SidePanel) =>
    setSidePanel(prev => prev === panel ? null : panel);

  if (!joined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-slate-800 rounded-2xl p-10 max-w-md w-full text-center border border-slate-700">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Video size={28} className="text-white" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">Ready to join?</h2>
          <p className="text-slate-400 text-sm mb-2">
            Room: <span className="font-mono text-teal-400">{roomId}</span>
          </p>
          <p className="text-slate-400 text-sm mb-8">Your camera and microphone will be requested.</p>
          <div className="flex flex-col gap-3">
            <button onClick={startLocalStream}
              className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-500 transition-colors">
              Join with camera & mic
            </button>
            <button onClick={() => { setJoined(true); connectWS(); }}
              className="w-full py-3 bg-slate-700 text-slate-300 font-medium rounded-xl hover:bg-slate-600 transition-colors text-sm">
              Join without media
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800">
        <div>
          <p className="text-white font-semibold text-sm">Live Classroom</p>
          <p className="text-slate-400 text-xs font-mono">Room: {roomId}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
            <span>LIVE</span>
          </div>
          <span className="text-xs text-slate-400">
            {participants.length + 1} participant{participants.length !== 0 ? 's' : ''}
          </span>
          {isInstructor && (
            <span className="text-xs bg-teal-700 text-teal-200 px-2 py-0.5 rounded-full font-semibold">
              Instructor
            </span>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-3 content-start overflow-auto">
          {/* Local, spans full width when screen sharing for usable annotation area */}
          <div className={`relative bg-slate-800 rounded-2xl overflow-hidden aspect-video ${isScreenSharing ? 'col-span-full' : ''}`}>
            {/* Always-rendered video element, shows camera or screen-share. Hidden only when camera-off and not sharing. */}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full ${isScreenSharing ? 'object-contain bg-black' : 'object-cover'} ${isVideoOff && !isScreenSharing ? 'hidden' : ''}`}
              aria-label={isScreenSharing ? 'Your screen share preview' : 'Your video'}
            />

            {/* Camera-off avatar (only when not screen sharing) */}
            {isVideoOff && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center" aria-label="Video off">
                <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold"
                  aria-hidden="true">
                  {user?.name?.charAt(0)}
                </div>
              </div>
            )}

            {/* Floating Annotate button, top-right of the tile, visible for ANY share type (screen, window, or tab) */}
            {isScreenSharing && (
              <button
                type="button"
                onClick={() => setIsAnnotating(v => !v)}
                aria-label={isAnnotating ? 'Stop drawing' : 'Open annotation tools'}
                className={`absolute top-3 right-3 z-30 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors ${
                  isAnnotating
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-white text-purple-700 hover:bg-purple-50'
                }`}
              >
                <Pencil size={15} />
                {isAnnotating ? 'Stop drawing' : 'Annotate'}
              </button>
            )}

            {/* Mirror-loop tip, small banner only when sharing entire screen, with dismiss */}
            {isScreenSharing && showMirrorTip && !isAnnotating && (
              <div className="absolute top-3 left-3 z-20 max-w-xs bg-amber-500/95 text-amber-950 text-xs rounded-lg p-3 flex items-start gap-2 shadow-lg">
                <Info size={14} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-0.5">Seeing a mirror loop?</p>
                  <p className="leading-snug">
                    Pick a <strong>specific window or tab</strong> next time, instead of "Entire Screen".
                  </p>
                </div>
                <button onClick={() => setShowMirrorTip(false)} aria-label="Dismiss tip"
                  className="shrink-0 hover:bg-amber-600/30 rounded p-0.5">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Annotation overlay (only available while screen-sharing) */}
            {isScreenSharing && (
              <AnnotationOverlay
                enabled={isAnnotating}
                onClose={() => setIsAnnotating(false)}
              />
            )}

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
              <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
                You{isInstructor ? ' (Instructor)' : ''}{isScreenSharing ? ' · Sharing' : ''}
              </span>
              {isMuted && <MicOff size={13} className="text-red-400" aria-label="Muted" />}
            </div>
          </div>

          {/* Remote participants */}
          {participants.map(p => (
            <div key={p.userId} className="relative bg-slate-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-slate-600 flex items-center justify-center text-white text-xl font-bold"
                aria-hidden="true">
                {p.name.charAt(0)}
              </div>
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full truncate max-w-[80%]">
                  {p.name}
                </span>
                {p.isMuted && <MicOff size={13} className="text-red-400" aria-label={`${p.name} is muted`} />}
              </div>
              {/* Instructor kick button overlay */}
              {isInstructor && (
                <button onClick={() => kickParticipant(p.userId)}
                  aria-label={`Remove ${p.name}`}
                  className="absolute top-2 right-2 p-1 bg-red-600/80 text-white rounded-lg hover:bg-red-600 opacity-0 hover:opacity-100 transition-opacity">
                  <UserMinus size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Chat panel */}
        {sidePanel === 'chat' && (
          <aside className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col"
            aria-label="Chat panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="text-white font-semibold text-sm">Chat</span>
              <button onClick={() => setSidePanel(null)} aria-label="Close chat"
                className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite">
              {chatMessages.map(msg => (
                <div key={msg.id} className={msg.sender === user?.name ? 'text-right' : ''}>
                  <span className="text-xs text-slate-500 mb-0.5 block">{msg.sender}</span>
                  <div className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[90%] text-left ${
                    msg.sender === user?.name
                      ? 'bg-teal-600 text-white'
                      : msg.sender === 'System'
                      ? 'bg-slate-700 text-slate-300 italic'
                      : 'bg-slate-700 text-white'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-slate-700 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Send a message…" aria-label="Chat message"
                className="flex-1 bg-slate-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400" />
              <button onClick={sendMessage} aria-label="Send message"
                className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors">
                <Send size={16} />
              </button>
            </div>
          </aside>
        )}

        {/* Participants panel */}
        {sidePanel === 'participants' && (
          <aside className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col"
            aria-label="Participants panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="text-white font-semibold text-sm">
                Participants ({participants.length + 1})
              </span>
              <button onClick={() => setSidePanel(null)} aria-label="Close participants panel"
                className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-3 space-y-1">
              {/* Self */}
              <li className="flex items-center justify-between px-2 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <span className="text-white text-sm">{user?.name} (You)</span>
                </div>
                {isMuted && <MicOff size={13} className="text-red-400" />}
              </li>
              {participants.map(p => (
                <li key={p.userId} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-700 group">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <span className="text-slate-300 text-sm truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.isMuted && <MicOff size={13} className="text-red-400" />}
                    {isInstructor && (
                      <button onClick={() => kickParticipant(p.userId)}
                        aria-label={`Remove ${p.name}`}
                        title="Remove from session"
                        className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Attendance panel */}
        {sidePanel === 'attendance' && (
          <aside className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col"
            aria-label="Attendance panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="text-white font-semibold text-sm">
                Attendance ({attendance.length})
              </span>
              <button onClick={() => setSidePanel(null)} aria-label="Close attendance panel"
                className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto p-3 space-y-1">
              {attendance.length === 0 ? (
                <li className="text-slate-400 text-xs text-center py-4">No attendance data yet.</li>
              ) : (
                attendance.map(p => (
                  <li key={p.userId} className="px-2 py-2 rounded-lg hover:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-200 text-sm truncate">{p.name}</p>
                        <p className="text-slate-500 text-xs">
                          Joined {p.joinedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </aside>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-slate-900 border-t border-slate-800 py-4 flex items-center justify-center gap-2 flex-wrap px-4">
        <ControlBtn onClick={toggleMute} active={isMuted} activeColor="bg-red-600 hover:bg-red-700"
          label={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </ControlBtn>

        <ControlBtn onClick={toggleVideo} active={isVideoOff} activeColor="bg-red-600 hover:bg-red-700"
          label={isVideoOff ? 'Start video' : 'Stop video'}>
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </ControlBtn>

        <ControlBtn onClick={toggleScreenShare} active={isScreenSharing} activeColor="bg-teal-600 hover:bg-teal-700"
          label="Share screen">
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </ControlBtn>

        {isScreenSharing && (
          <ControlBtn onClick={() => setIsAnnotating(v => !v)} active={isAnnotating}
            activeColor="bg-purple-600 hover:bg-purple-700" label={isAnnotating ? 'Stop drawing' : 'Annotate'}>
            <Pencil size={20} />
          </ControlBtn>
        )}

        <ControlBtn onClick={() => togglePanel('chat')} active={sidePanel === 'chat'}
          activeColor="bg-teal-600 hover:bg-teal-700" label="Chat" badge={chatMessages.length}>
          <MessageSquare size={20} />
        </ControlBtn>

        <ControlBtn onClick={() => togglePanel('participants')} active={sidePanel === 'participants'}
          activeColor="bg-teal-600 hover:bg-teal-700" label="People">
          <Users size={20} />
        </ControlBtn>

        {isInstructor && (
          <>
            <ControlBtn onClick={() => togglePanel('attendance')} active={sidePanel === 'attendance'}
              activeColor="bg-teal-600 hover:bg-teal-700" label="Attendance">
              <ClipboardList size={20} />
            </ControlBtn>

            <ControlBtn onClick={muteAll} label="Mute all" activeColor="bg-amber-600 hover:bg-amber-700">
              <VolumeX size={20} />
            </ControlBtn>

            <ControlBtn
              onClick={isRecording ? stopRecording : startRecording}
              active={isRecording}
              activeColor="bg-red-600 hover:bg-red-700"
              label={isRecording ? `Stop · ${recordingLabel}` : 'Record'}
            >
              {isRecording ? <Square size={20} /> : <Circle size={20} className="fill-current" />}
            </ControlBtn>
          </>
        )}

        <button onClick={leaveRoom} aria-label="Leave session"
          className="flex flex-col items-center gap-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors ml-2">
          <PhoneOff size={20} />
          <span className="text-xs">Leave</span>
        </button>
      </div>

      {/* Recording-saved dialog: title prompt + upload progress */}
      {pendingRecording && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950 flex items-center justify-center">
                <Circle size={16} className="text-red-500 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Save recording</h2>
                <p className="text-xs text-slate-400">
                  {Math.floor(pendingRecording.durationSec / 60)}m {pendingRecording.durationSec % 60}s ·{' '}
                  {(pendingRecording.blob.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>

            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              disabled={uploadProgress !== null}
              autoFocus
              placeholder="e.g. Week 5 — Hooks deep dive"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-700 bg-slate-950 text-sm text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none disabled:opacity-50"
            />

            {uploadProgress !== null && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Uploading...</span>
                  <span className="font-mono tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-600 transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={cancelPendingRecording}
                disabled={uploadProgress !== null && uploadProgress < 100}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-sm font-semibold text-slate-300 hover:border-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Discard
              </button>
              <button
                onClick={uploadPendingRecording}
                disabled={uploadProgress !== null || !saveTitle.trim()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                {uploadProgress !== null
                  ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                  : 'Save recording'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlBtn({
  onClick, active = false, activeColor = 'bg-teal-600 hover:bg-teal-700',
  label, badge, children,
}: {
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={active}
      className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
        active ? `${activeColor} text-white` : 'bg-slate-700 hover:bg-slate-600 text-white'
      }`}>
      {children}
      <span className="text-xs">{label}</span>
      {badge !== undefined && badge > 0 && !active && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center"
          aria-label={`${badge} unread`}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
