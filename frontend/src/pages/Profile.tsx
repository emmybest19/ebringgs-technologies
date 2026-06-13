import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  X,
  Phone,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/auth.store";
import { useUpdateProfile, useChangePassword } from "../services/queries";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const navigate = useNavigate();

  // Profile form
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  // Password change form
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const loading = updateProfile.isPending;
  const pwLoading = changePassword.isPending;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    fetchMe();
  }, [isAuthenticated, navigate, fetchMe]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || "");
      setPhone((user as { phone?: string }).phone || "");
      setWhatsappOptIn((user as { whatsappOptIn?: boolean }).whatsappOptIn !== false);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateProfile.mutate(
      { name, bio, phone, whatsappOptIn },
      {
        // Auth store has its own copy of `user` — refresh it so the navbar
        // avatar and other consumers reflect the new name/bio immediately.
        onSuccess: () => {
          fetchMe();
          toast.success("Profile updated successfully!");
        },
        onError: () => toast.error("Failed to update profile. Please try again."),
      },
    );
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match.");
      return;
    }
    changePassword.mutate(
      { currentPassword: currentPw, newPassword: newPw },
      {
        onSuccess: () => {
          toast.success("Password changed successfully!");
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
          setTimeout(() => setShowPwForm(false), 1500);
        },
        onError: (err: unknown) => {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined;
          toast.error(msg || "Failed to change password. Please try again.");
        },
      },
    );
  };

  if (!user) return null;

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile settings</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Manage your account information
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-xl">{user.name}</h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm">{user.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-semibold rounded-full capitalize">
                  {user.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  <User size={15} /> Full name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  <Mail size={15} /> Email address
                </label>
                <input
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm resize-none dark:bg-slate-800 dark:text-white"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 text-right">
                  {bio.length}/500
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  <Phone size={15} /> Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678 or +234..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm dark:bg-slate-800 dark:text-white"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  Used for WhatsApp updates on your projects, classes, and payments.
                </p>
              </div>

              {phone && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <MessageCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappOptIn}
                        onChange={(e) => setWhatsappOptIn(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Send me WhatsApp updates
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      Class reminders, project updates, and payment confirmations — straight to your WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors text-sm"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save changes
              </button>
            </form>
          </div>

          {/* Account & Security */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield size={18} className="text-teal-600" /> Account &
              Security
            </h3>

            <div className="space-y-4">
              {/* Password row */}
              <div className="py-3 border-b border-gray-50 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      Password
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Keep your account secure with a strong password
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPwForm((v) => !v)}
                    className="text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1"
                  >
                    {showPwForm ? (
                      <>
                        <X size={13} /> Cancel
                      </>
                    ) : (
                      "Change"
                    )}
                  </button>
                </div>

                {/* Inline password change form */}
                {showPwForm && (
                  <form
                    onSubmit={handlePasswordChange}
                    className="mt-4 space-y-3 bg-gray-50 dark:bg-slate-950 rounded-xl p-4 border border-gray-100 dark:border-slate-800"
                  >
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Current password
                      </label>
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        required
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw((v) => !v)}
                        className="absolute right-3 top-[26px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                      >
                        {showCurrentPw ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        New password
                      </label>
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        required
                        placeholder="Min 8 characters"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-3 top-[26px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                      >
                        {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      {/* Strength indicator */}
                      {newPw.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                newPw.length >= i * 3
                                  ? newPw.length >= 12
                                    ? "bg-green-500"
                                    : newPw.length >= 8
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                  : "bg-gray-200 dark:bg-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                        Confirm new password
                      </label>
                      <input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        required
                        placeholder="Repeat new password"
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-white ${
                          confirmPw && confirmPw !== newPw
                            ? "border-red-300"
                            : "border-gray-200 dark:border-slate-700"
                        }`}
                      />
                      {confirmPw && confirmPw !== newPw && (
                        <p className="text-xs text-red-500 mt-1">
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors"
                    >
                      {pwLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Lock size={14} />
                      )}
                      {pwLoading ? "Updating\u2026" : "Update password"}
                    </button>
                  </form>
                )}
              </div>

              {/* Email verification */}
              <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    Email verification
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Verify your email to unlock all features
                  </p>
                </div>
                {user.email ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                    Pending
                  </span>
                )}
              </div>

              {/* Delete account */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Delete account
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Permanently delete your data — contact support
                  </p>
                </div>
                <a
                  href="mailto:support@ebringgs.com?subject=Account deletion request"
                  className="text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Request
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
