"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FolderLock,
  Plus,
  KeyRound,
  Trash2,
  Loader2,
  AlertTriangle,
  Search,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface Vault {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { secrets: number };
}

export default function VaultsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingVault, setDeletingVault] = useState<Vault | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newVault, setNewVault] = useState({ name: "", description: "" });

  const fetchVaults = useCallback(async () => {
    try {
      const res = await fetch("/api/vaults");
      if (!res.ok) throw new Error("Failed");
      setVaults(await res.json());
    } catch {
      showToast("Failed to load vaults", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVault.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/vaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVault),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Vault created successfully");
      setNewVault({ name: "", description: "" });
      setCreateOpen(false);
      fetchVaults();
    } catch {
      showToast("Failed to create vault", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVault) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vaults/${deletingVault.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Vault deleted successfully");
      setDeleteOpen(false);
      setDeletingVault(null);
      fetchVaults();
    } catch {
      showToast("Failed to delete vault", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = vaults.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-mono font-bold text-white">Vaults</h1>
          <p className="text-sm text-slate-500 font-sans mt-1">
            Manage your encrypted secret containers
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 hover:shadow-neon-cyan transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Vault
        </button>
      </motion.div>

      {/* Search */}
      {vaults.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search vaults..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-sans text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_10px_rgba(0,255,255,0.1)] transition-all"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-5 bg-white/5 rounded w-2/3 mb-3" />
              <div className="h-4 bg-white/5 rounded w-full mb-4" />
              <div className="flex justify-between">
                <div className="h-5 bg-white/5 rounded w-16" />
                <div className="h-4 bg-white/5 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && vaults.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <FolderLock className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-mono text-white mb-2">No vaults yet</h3>
          <p className="text-sm text-slate-500 font-sans mb-6">
            Create your first vault to start storing encrypted secrets.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-sans font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Your First Vault
          </button>
        </motion.div>
      )}

      {/* Vault grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vault, i) => (
            <motion.div
              key={vault.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 cursor-pointer group hover:border-neon-cyan/30 transition-all relative"
            >
              <div
                onClick={() =>
                  router.push(`/dashboard/vault/${vault.id}`)
                }
                className="mb-3"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-mono font-semibold text-white group-hover:text-neon-cyan transition-colors truncate pr-2">
                    {vault.name}
                  </h3>
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-neon-cyan/5 border border-neon-cyan/10 flex items-center justify-center">
                    <FolderLock className="w-4 h-4 text-neon-cyan/60" />
                  </div>
                </div>
                {vault.description && (
                  <p className="text-sm text-slate-500 font-sans line-clamp-2">
                    {vault.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/20">
                  <KeyRound className="w-3 h-3" />
                  {vault._count.secrets}{" "}
                  {vault._count.secrets === 1 ? "secret" : "secrets"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingVault(vault);
                    setDeleteOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete vault"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* No search results */}
      {!loading && vaults.length > 0 && filtered.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-slate-500 font-sans">
            No vaults match &quot;{search}&quot;
          </p>
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Vault">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-sans text-slate-400 mb-1.5">
              Vault Name
            </label>
            <input
              type="text"
              value={newVault.name}
              onChange={(e) => setNewVault((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Production API Keys"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_10px_rgba(0,255,255,0.1)] transition-all"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-sans text-slate-400 mb-1.5">
              Description <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={newVault.description}
              onChange={(e) => setNewVault((p) => ({ ...p, description: e.target.value }))}
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

      {/* Delete Modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Vault">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 font-sans">
              Are you sure you want to delete{" "}
              <span className="font-mono text-red-400">{deletingVault?.name}</span>?
              All secrets inside will be permanently deleted.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-sans text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 transition-all"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
