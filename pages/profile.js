import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRole } from "@/lib/roleContext";

export default function ProfilePage() {
  const { logout, refreshRole } = useRole();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        setName(data.data.user_name);
        setEmail(data.data.user_email);
      }
    }
    loadProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (password && !currentPassword) {
      toast.error("Original password is required to change your password.");
      return;
    }
    if (password && password !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        password: password || undefined,
        currentPassword: currentPassword || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      toast.error(data.error || "Failed to update profile.");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    await refreshRole();
    toast.success("Profile updated successfully!");
  }

  function confirmLogout() {
    setShowLogoutConfirm(false);
    toast("Logged out. See you next time!", { icon: "👋" });
    setTimeout(() => logout(), 1000);
  }

  return (
    <div className="min-h-screen bg-primary-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your account information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Avatar card — banner + overlapping avatar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-16 bg-primary-600" />
              <div className="px-5 pb-5 -mt-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-xl bg-primary-700 ring-4 ring-white dark:ring-gray-800 flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
                  {name.charAt(0)}
                </div>
                <p className="font-bold text-gray-900 text-lg mt-3">{name}</p>
                <p className="text-sm text-gray-500 break-all">{email}</p>
                <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                  <User size={11} /> User
                </span>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSave}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4"
            >
              <h2 className="font-bold text-gray-800 text-sm">
                Edit Information
              </h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm hover:border-primary-300 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-gray-900"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Original password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Original password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required if changing password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm hover:border-primary-300 dark:hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition placeholder-gray-300 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showCurrentPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition placeholder-gray-300 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition placeholder-gray-300 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 will-change-transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:scale-100 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {saving ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : (
                    <Save size={15} />
                  )}
                  {saving ? "Saving…" : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  title="Log out"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100 will-change-transform hover:scale-105 active:scale-95 active:bg-red-200 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <LogOut size={16} />
                  <span>Log Out</span>
                </button>
              </div>
            </form>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 px-1">
              <ShieldCheck size={13} />
              Your password is securely hashed and never shown in plain text.
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative bg-white rounded-xl border border-gray-200 shadow-md w-full max-w-sm z-10 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <LogOut size={18} className="text-red-500" />
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Close"
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Log out?</h3>
            <p className="text-sm text-gray-500 mb-5">
              You'll be redirected to the home page.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Yes, log out
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
