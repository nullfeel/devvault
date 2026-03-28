"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  LogOut,
  Loader2,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      showToast("Passwords don't match", "error");
      return;
    }
    if (passwords.newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      showToast("Password changed successfully");
      setPasswords({ current: "", newPassword: "", confirm: "" });
      setChangingPassword(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to change password",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-mono font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 font-sans mt-1">
          Manage your account and preferences
        </p>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 space-y-5"
      >
        <h2 className="text-base font-mono font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-neon-cyan" />
          Profile
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="w-12 h-12 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan text-lg font-mono font-bold">
              {session?.user?.name?.charAt(0)?.toUpperCase() ||
                session?.user?.email?.charAt(0)?.toUpperCase() ||
                "?"}
            </div>
            <div>
              <p className="text-white font-sans font-medium">
                {session?.user?.name || "User"}
              </p>
              <p className="text-sm text-slate-500 font-sans flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 space-y-5"
      >
        <h2 className="text-base font-mono font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-neon-green" />
          Security
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-sm text-white font-sans">Password</p>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Change your account password
              </p>
            </div>
            <button
              onClick={() => setChangingPassword(!changingPassword)}
              className="px-4 py-2 rounded-lg text-sm font-sans text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/10 transition-all"
            >
              {changingPassword ? "Cancel" : "Change"}
            </button>
          </div>

          {changingPassword && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handlePasswordChange}
              className="space-y-3 pl-4 border-l-2 border-neon-cyan/20"
            >
              <input
                type="password"
                placeholder="Current password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-sans text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 transition-all"
                required
              />
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, newPassword: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-sans text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 transition-all"
                required
                minLength={8}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirm: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-sans text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 transition-all"
                required
              />
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 disabled:opacity-40 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </button>
            </motion.form>
          )}

          <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-sm text-white font-sans">Encryption</p>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                AES-256-GCM · All secrets encrypted at rest
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-neon-green/10 text-neon-green border border-neon-green/20">
              Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 border-red-500/20"
      >
        <h2 className="text-base font-mono font-semibold text-red-400 mb-4">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/10">
          <div>
            <p className="text-sm text-white font-sans">Sign out</p>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              End your current session
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
