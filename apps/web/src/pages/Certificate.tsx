import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '@ebringgs/api';
import { Logo, useSEO, schema } from '@ebringgs/ui';

/**
 * Certificate fetched from the backend by certificateId. All fields are the
 * **snapshotted** values from when the cert was issued — a later rename of
 * the student or edit of the cohort doesn't change a cert that's already out
 * in the world. That's the whole point of a credential.
 */
interface CertificateData {
  certificateId: string;
  studentName: string;
  program: string;
  instructor: string;
  completedAt: string;
  isValid: boolean;
  revokedReason?: string;
}

const FOUNDER_NAME = 'Ebri Emmanuel';
const FOUNDER_TITLE = 'Founder, E-Bringgs Technologies';

export default function Certificate() {
  // Param name kept as `:courseId` in the route for backwards-compat; semantic
  // value is the certificateId (e.g. "EB-WD-2026-0042").
  const { courseId: certificateId } = useParams<{ courseId: string }>();
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const certUrl = certificateId ? `https://ebringgs.com/certificate/${certificateId}` : undefined;
  useSEO({
    title: cert ? `Certificate ${cert.certificateId}` : 'Certificate',
    description: cert
      ? `${cert.studentName} completed ${cert.program} at E-Bringgs Technologies on ${new Date(cert.completedAt).toLocaleDateString()}.`
      : 'E-Bringgs Technologies certificate of completion.',
    url: certUrl,
    image: 'https://ebringgs.com/logo-full.jpg',
    imageAlt: cert ? `Certificate of completion for ${cert.studentName}` : undefined,
    type: 'profile',
    robotsExtras: ['max-image-preview:large'],
    jsonLd: cert && certUrl
      ? [
          schema.credential({
            name: `${cert.program} Certificate of Completion`,
            recipientName: cert.studentName,
            issuedOn: cert.completedAt,
            credentialId: cert.certificateId,
            url: certUrl,
          }),
        ]
      : undefined,
  });

  useEffect(() => {
    if (!certificateId) { setLoading(false); setNotFound(true); return; }
    api.get(`/certificates/${certificateId}`)
      .then(({ data }) => {
        const c = data.data?.certificate;
        if (!c) { setNotFound(true); return; }
        setCert({
          certificateId: c.certificateId,
          studentName: c.studentName,
          program: c.program,
          instructor: c.instructor,
          completedAt: new Date(c.completedAt).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric',
          }),
          isValid: c.isValid,
          revokedReason: c.revokedReason,
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [certificateId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Refuse to render anything that isn't a real, backend-issued certificate.
  // This is the credibility lock — no more minting via /certificate/anything.
  if (notFound || !cert) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <Award size={48} className="text-gray-300 dark:text-slate-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Certificate not found</h1>
        <p className="text-gray-500 dark:text-slate-400 max-w-md">
          We couldn't find a certificate with this ID. If you believe you've completed a program
          and don't see your certificate yet, please contact support.
        </p>
        <Link to="/dashboard" className="text-teal-600 hover:underline text-sm">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const verifyHost = typeof window !== 'undefined' ? window.location.host : 'ebringgs.com';

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Toolbar, hidden when printing */}
      <div className="print:hidden bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={15} /> Back to Dashboard
        </Link>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
          <Download size={15} /> Download / Print
        </button>
      </div>

      {/* Revocation banner — printable, in red, so a revoked cert can't pass as valid. */}
      {!cert.isValid && (
        <div className="bg-red-50 dark:bg-red-950 border-b border-red-200 dark:border-red-800 px-6 py-3 text-center">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            ⚠ This certificate has been revoked
            {cert.revokedReason ? ` — ${cert.revokedReason}` : '.'}
          </p>
        </div>
      )}

      {/* Certificate */}
      <div className="flex items-center justify-center py-12 px-4 print:py-0 print:px-0">
        <div id="certificate"
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none relative"
          style={{ aspectRatio: '1.414 / 1' }}>

          {/* Top accent bar */}
          <div className="h-3 bg-linear-to-r from-teal-600 via-cyan-600 to-teal-600" />

          <div className="flex flex-col items-center justify-center h-[calc(100%-12px)] px-16 py-8 text-center">
            {/* Logo / Brand */}
            <div className="mb-6">
              <Logo variant="full" size={56} />
            </div>

            {/* Award icon */}
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-3 border-4 border-amber-200">
              <Award size={28} className="text-amber-500" />
            </div>

            <p className="text-xs font-semibold tracking-widest text-teal-500 uppercase mb-2">
              Certificate of Completion
            </p>

            <p className="text-sm text-gray-500 mb-1">This certifies that</p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
              {cert.studentName}
            </h1>

            <p className="text-sm text-gray-500 mb-2">has successfully completed the program</p>
            <h2 className="text-xl font-bold text-teal-700 mb-5 max-w-md leading-tight">
              {cert.program}
            </h2>

            {/* Divider */}
            <div className="flex items-center gap-4 w-full max-w-xs mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <CheckCircle2 size={18} className="text-green-500 shrink-0" />
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Footer details — date left, founder signature right */}
            <div className="flex items-end justify-between w-full max-w-md mb-3">
              <div className="text-left">
                <p className="text-xs text-gray-400 mb-1">Date of completion</p>
                <p className="text-sm font-semibold text-gray-700">{cert.completedAt}</p>
                <p className="text-xs text-gray-400 mt-2">Instructor</p>
                <p className="text-xs font-semibold text-gray-700">{cert.instructor}</p>
              </div>
              <div className="text-center">
                {/* Founder signature — drop a transparent PNG at frontend/public/signature.png to replace */}
                <img loading="lazy"
                  src="/signature.png"
                  alt=""
                  className="h-12 mx-auto -mb-2 object-contain"
                  onError={(e) => {
                    // Hide cleanly if the user hasn't uploaded a signature yet
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="w-32 h-px bg-gray-400 mx-auto" />
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{FOUNDER_NAME}</p>
                <p className="text-[10px] text-gray-500">{FOUNDER_TITLE}</p>
              </div>
            </div>

            {/* Verification fine print — Udemy-style, bottom of the cert */}
            <div className="w-full max-w-md mt-2 pt-2 border-t border-gray-100">
              <p className="text-[9px] text-gray-400 tracking-wide">
                Certificate ID:{' '}
                <span className="font-mono font-semibold text-gray-500">
                  {cert.certificateId}
                </span>
              </p>
              <p className="text-[9px] text-gray-400 tracking-wide">
                Verify at {verifyHost}/verify-certificate
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
