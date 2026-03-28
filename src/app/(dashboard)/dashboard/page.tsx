"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FolderLock,
  KeyRound,
  Clock,
  ShieldCheck,
  Plus,
  LogOut,
  Loader2,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface Vault {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    secrets: number;
  };
}

/* ── Animated counter ────────────────────────────────────── */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));

      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    };

    ref.current = requestAnimationFrame(tick);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value, duration]);

  return <>{display}</>;
}

/* ── Stat card ───────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  index,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: "cyan" | "magenta" | "green" | "purple";
  index: number;
}) {
  const colorMap = {
    cyan: { text: "text-neon-cyan", glow: "neon-text-cyan", bg: "bg-neon-cyan/10", border: "border-neon-cyan/20" },
    magenta: { text: "text-neon-magenta", glow: "neon-text-magenta", bg: "bg-neon-magenta/10", border: "border-neon-magenta/20" },
    green: { text: "text-neon-green", glow: "neon-text-green", bg: "bg-neon-green/10", border: "border-neon-green/20" },
    purple: { text: "text-neon-purple", glow: "neon-text-purple", bg: "bg-neon-purple/10", border: "border-neon-purple/20" },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${c.bg} ${c.border} border`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
      </div>
      <div className={`text-3xl font-mono font-bold ${c.glow} mb-1`}>
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </div>
      <p className="text-sm text-slate-500 font-sans">{label}</p>
    </motion.div>
  );
}

/* ── Skeleton loader ─────────────────────────────────────── */
function VaultSkeleton() {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="h-5 bg-white/5 rounded w-2/3 mb-3" />
      <div className="h-4 bg-white/5 rounded w-full mb-2" />
      <div className="h-4 bg-white/5 rounded w-1/2 mb-4" />
      <div className="flex justify-between items-center">
        <div className="h-5 bg-white/5 rounded w-16" />
        <div className="h-4 bg-white/5 rounded w-24" />
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────── */
export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newVault, setNewVault] = useState({ name: "", description: "" });

  const fetchVaults = useCallback(async () => {
    try {
      const res = await fetch("/api/vaults");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setVaults(data);
    } catch {
      showToast("Failed to load vaults", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVault.name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/vaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVault),
      });

      if (!res.ok) throw new Error("Failed to create vault");

      showToast("Vault created successfully");
      setNewVault({ name: "", description: "" });
      setModalOpen(false);
      fetchVaults();
    } catch {
      showToast("Failed to create vault", "error");
    } finally {
      setCreating(false);
    }
  };

  const totalSecrets = vaults.reduce((sum, v) => sum + v._count.secrets, 0);
  const lastAccess = vaults.length > 0
    ? new Date(vaults[0].updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "--";

  const userName = session?.user?.name?.split(" ")[0] || "Operator";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-mono font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 font-sans mt-1">
            Welcome back,{" "}
            <span className="text-neon-cyan">{userName}</span>
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-white/10 hover:border-red-500/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderLock}
          value={vaults.length}
          label="Total Vaults"
          color="cyan"
          index={0}
        />
        <StatCard
          icon={KeyRound}
          value={totalSecrets}
          label="Total Secrets"
          color="magenta"
          index={1}
        />
        <StatCard
          icon={Clock}
          value={lastAccess}
          label="Last Access"
          color="green"
          index={2}
        />
        <StatCard
          icon={ShieldCheck}
          value={100}
          label="Security Score"
          color="purple"
          index={3}
        />
      </div>

      {/* Vaults section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-mono font-semibold text-white">
            Your Vaults
          </h2>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 hover:shadow-neon-cyan transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Vault
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <VaultSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && vaults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <FolderLock className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-mono text-white mb-2">
              No vaults yet
            </h3>
            <p className="text-sm text-slate-500 font-sans mb-6 max-w-md mx-auto">
              Vaults are secure containers for your secrets. Create your first
              vault to start storing encrypted credentials.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-sans font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 hover:shadow-neon-cyan transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Your First Vault
            </button>
          </motion.div>
        )}

        {/* Vault cards grid */}
        {!loading && vaults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vaults.map((vault, i) => (
              <motion.div
                key={vault.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                onClick={() => router.push(`/dashboard/vault/${vault.id}`)}
                className="glass-card p-5 cursor-pointer group hover:border-neon-cyan/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-mono font-semibold text-white group-hover:text-neon-cyan transition-colors truncate pr-2">
                    {vault.name}
                  </h3>
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-neon-cyan/5 border border-neon-cyan/10 flex items-center justify-center group-hover:bg-neon-cyan/10 transition-colors">
                    <FolderLock className="w-4 h-4 text-neon-cyan/60 group-hover:text-neon-cyan transition-colors" />
                  </div>
                </div>

                {vault.description && (
                  <p className="text-sm text-slate-500 font-sans mb-4 line-clamp-2">
                    {vault.description}
                  </p>
                )}
                {!vault.description && <div className="mb-4" />}

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/20">
                    <KeyRound className="w-3 h-3" />
                    {vault._count.secrets}{" "}
                    {vault._count.secrets === 1 ? "secret" : "secrets"}
                  </span>
                  <span className="text-xs text-slate-600 font-sans">
                    {new Date(vault.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Vault Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Vault"
      >
        <form onSubmit={handleCreateVault} className="space-y-4">
          <div>
            <label className="block text-sm font-sans text-slate-400 mb-1.5">
              Vault Name
            </label>
            <input
              type="text"
              value={newVault.name}
              onChange={(e) =>
                setNewVault((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Production API Keys"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_10px_rgba(0,255,255,0.1)] transition-all"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-slate-400 mb-1.5">
              Description{" "}
              <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={newVault.description}
              onChange={(e) =>
                setNewVault((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="What will this vault store?"
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-sans text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_10px_rgba(0,255,255,0.1)] transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={creating || !newVault.name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 hover:shadow-neon-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Vault
              </>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
