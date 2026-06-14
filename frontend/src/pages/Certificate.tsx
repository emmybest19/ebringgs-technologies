import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';
import Logo from '../components/Logo';

interface CertificateData {
  studentName: string;
  programTitle: string;
  instructorName: string;
  completedAt: string;
}

export default function Certificate() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!courseId || !user) { setLoading(false); return; }
    // Fetch certificate data from backend
    api.get(`/certificates/${courseId}`)
      .then(({ data }) => {
        setCert({
          studentName: user.name,
          programTitle: data.data?.title ?? 'Training Program',
          instructorName: data.data?.instructor ?? 'E-Bringgs Instructor',
          completedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        });
      })
      .catch(() => {
        setCert({
          studentName: user.name,
          programTitle: 'Training Program',
          instructorName: 'E-Bringgs Instructor',
          completedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
        });
      })
      .finally(() => setLoading(false));
  }, [courseId, user]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 px-4">
        <Award size={48} className="text-gray-300 dark:text-slate-500" />
        <p className="text-gray-500 dark:text-slate-400 text-lg">{error || 'Certificate not found.'}</p>
        <Link to="/dashboard" className="text-teal-600 hover:underline text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Toolbar â€” hidden when printing */}
      <div className="print:hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
          <Download size={15} /> Download / Print
        </button>
      </div>

      {/* Certificate */}
      <div className="flex items-center justify-center py-12 px-4 print:py-0 print:px-0">
        <div id="certificate"
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none"
          style={{ aspectRatio: '1.414 / 1' }}>

          {/* Top accent bar */}
          <div className="h-3 bg-linear-to-r from-teal-600 via-cyan-600 to-teal-600" />

          <div className="flex flex-col items-center justify-center h-[calc(100%-12px)] px-16 py-10 text-center">
            {/* Logo / Brand */}
            <div className="mb-8">
              <Logo variant="full" size={64} />
            </div>

            {/* Award icon */}
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border-4 border-amber-200">
              <Award size={32} className="text-amber-500" />
            </div>

            <p className="text-xs font-semibold tracking-widest text-teal-500 uppercase mb-2">
              Certificate of Completion
            </p>

            <p className="text-sm text-gray-500 mb-1">This certifies that</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
              {cert.studentName}
            </h1>

            <p className="text-sm text-gray-500 mb-2">has successfully completed the program</p>
            <h2 className="text-xl font-bold text-teal-700 mb-6 max-w-md leading-tight">
              {cert.programTitle}
            </h2>

            {/* Divider */}
            <div className="flex items-center gap-4 w-full max-w-xs mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Footer details */}
            <div className="flex items-end justify-between w-full max-w-md">
              <div className="text-left">
                <p className="text-xs text-gray-400 mb-1">Date of completion</p>
                <p className="text-sm font-semibold text-gray-700">{cert.completedAt}</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-px bg-gray-400 mb-1 mx-auto" />
                <p className="text-xs text-gray-400">Instructor signature</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{cert.instructorName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
