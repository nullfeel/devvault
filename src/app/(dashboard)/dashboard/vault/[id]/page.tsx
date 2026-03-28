"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Pencil,
  Trash2,
  KeyRound,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

/* ── Types ───────────────────────────────────────────────── */
type SecretType = "PASSWORD" | "API_KEY" | "TOKEN" | "ENV_VAR" | "OTHER";

interface Secret {
  id: string;
  key: string;
  value: string;
  type: SecretType;
  createdAt: string;
  updatedAt: string;
}

interface Vault {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  secrets: Secret[];
  createdAt: string;
  updatedAt: string;
}

const SECRET_TYPES: { value: SecretType; label: string }[] = [
  { value: "PASSWORD", label: "Password" },
  { value: "API_KEY", label: "API Key" },
  { value: "TOKEN", label: "Token" },
  { value: "ENV_VAR", label: "Env Var" },
  { value: "OTHER", label: "Other" },
];

const TYPE_COLORS: Record<SecretType, string> = {
  PASSWORD: "bg-red-500/10 text-red-400 border-red-500/20",
  API_KEY: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
  TOKEN: "bg-neon-purple/10 text-neon-purple border-neon-purple/20",
  ENV_VAR: "bg-neon-green/10 text-neon-green border-neon-green/20",
  OTHER: "bg-white/10 text-slate-300 border-white/10",
};

/* ── Custom dropdown for type selector ───────────────────── */
function TypeSelect({
  value,
  onChange,
}: {
  value: SecretType;
  onChange: (val: SecretType) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = SECRET_TYPES.find((t) => t.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan/40 transition-all"
      >
        <span className={`inline-flex items-center gap-2`}>
          <span
            className={`px-2 py-0.5 rounded text-xs border ${TYPE_COLORS[value]}`}
          >
            {selected?.label}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 mt-1 w-full rounded-lg bg-[#12121A] border border-white/10 shadow-lg overflow-hidden"
          >
            {SECRET_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => {
                  onChange(t.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                  t.value === value ? "bg-white/5" : ""
                }`}
              >
                <span
                  className={`px-2 py-0.5 rounded text-xs border ${TYPE_COLORS[t.value]}`}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Skeleton loader ─────────────────────────────────────── */
function SecretRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="h-4 bg-white/5 rounded w-32" />
      <div className="h-5 bg-white/5 rounded w-16" />
      <div className="flex-1 h-4 bg-white/5 rounded w-24" />
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-white/5 rounded" />
        <div className="w-8 h-8 bg-white/5 rounded" />
        <div className="w-8 h-8 bg-white/5 rounded" />
      </div>
    </div>
  );
}

/* ── Main Vault Detail Page ──────────────────────────────── */
export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const vaultId = params.id as string;

  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editVaultModalOpen, setEditVaultModalOpen] = useState(false);
  const [deleteVaultModalOpen, setDeleteVaultModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [deletingSecret, setDeletingSecret] = useState<Secret | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editVaultForm, setEditVaultForm] = useState({ name: "", description: "" });
  const [savingVault, setSavingVault] = useState(false);
  const [deletingVault, setDeletingVault] = useState(false);

  // Form state
  const [secretForm, setSecretForm] = useState({
    key: "",
    value: "",
    type: "OTHER" as SecretType,
  });

  const fetchVault = useCallback(async () => {
    try {
      const res = await fetch(`/api/vaults/${vaultId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setVault(data);
    } catch {
      showToast("Failed to load vault", "error");
    } finally {
      setLoading(false);
    }
  }, [vaultId, showToast]);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  /* ── Vault actions ──────────────────────────────────── */
  const openEditVault = () => {
    if (!vault) return;
    setEditVaultForm({ name: vault.name, description: vault.description || "" });
    setEditVaultModalOpen(true);
  };

  const handleEditVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVaultForm.name.trim()) return;
    setSavingVault(true);
    try {
      const res = await fetch(`/api/vaults/${vaultId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editVaultForm),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Vault updated");
      setEditVaultModalOpen(false);
      fetchVault();
    } catch {
      showToast("Failed to update vault", "error");
    } finally {
      setSavingVault(false);
    }
  };

  const handleDeleteVault = async () => {
    setDeletingVault(true);
    try {
      const res = await fetch(`/api/vaults/${vaultId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast("Vault deleted");
      router.push("/dashboard");
    } catch {
      showToast("Failed to delete vault", "error");
    } finally {
      setDeletingVault(false);
    }
  };

  /* ── Actions ─────────────────────────────────────────── */
  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast("Copied to clipboard");
    } catch {
      showToast("Failed to copy", "error");
    }
  };

  const openAddModal = () => {
    setEditingSecret(null);
    setSecretForm({ key: "", value: "", type: "OTHER" });
    setSecretModalOpen(true);
  };

  const openEditModal = (secret: Secret) => {
    setEditingSecret(secret);
    setSecretForm({
      key: secret.key,
      value: secret.value,
      type: secret.type,
    });
    setSecretModalOpen(true);
  };

  const openDeleteModal = (secret: Secret) => {
    setDeletingSecret(secret);
    setDeleteModalOpen(true);
  };

  const handleSaveSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretForm.key.trim() || !secretForm.value.trim()) return;

    setSaving(true);
    try {
      if (editingSecret) {
        // Update
        const res = await fetch(
          `/api/vaults/${vaultId}/secrets/${editingSecret.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(secretForm),
          }
        );
        if (!res.ok) throw new Error("Failed to update");
        showToast("Secret updated");
      } else {
        // Create
        const res = await fetch(`/api/vaults/${vaultId}/secrets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(secretForm),
        });
        if (!res.ok) throw new Error("Failed to create");
        showToast("Secret created");
      }

      setSecretModalOpen(false);
      fetchVault();
    } catch {
      showToast(
        editingSecret ? "Failed to update secret" : "Failed to create secret",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSecret = async () => {
    if (!deletingSecret) return;

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/vaults/${vaultId}/secrets/${deletingSecret.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Secret deleted");
      setDeleteModalOpen(false);
      setDeletingSecret(null);
      fetchVault();
    } catch {
      showToast("Failed to delete secret", "error");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Loading state ─────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-7 bg-white/5 rounded w-48 animate-pulse" />
        </div>
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-neon-cyan/10">
            <div className="h-4 bg-white/5 rounded w-20" />
          </div>
          {[...Array(4)].map((_, i) => (
            <SecretRowSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-mono text-white mb-2">
            Vault not found
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            This vault may have been deleted or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-neon-cyan font-sans transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono font-bold text-white flex items-center gap-3">
              {vault.name}
              <button
                onClick={openEditVault}
                className="p-1.5 rounded-lg text-slate-600 hover:text-neon-cyan hover:bg-neon-cyan/5 transition-all"
                title="Edit vault"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteVaultModalOpen(true)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-all"
                title="Delete vault"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </h1>
            {vault.description && (
              <p className="text-sm text-slate-500 font-sans mt-1">
                {vault.description}
              </p>
            )}
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans font-medium bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 hover:shadow-neon-green transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Secret
          </button>
        </div>
      </motion.div>

      {/* Secrets table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        {/* Table header */}
        <div className="px-4 sm:px-6 py-3 border-b border-neon-cyan/10 bg-neon-cyan/[0.02]">
          <div className="grid grid-cols-12 gap-4 text-xs font-mono text-slate-500 uppercase tracking-wider">
            <div className="col-span-4 sm:col-span-3">Key</div>
            <div className="col-span-2 hidden sm:block">Type</div>
            <div className="col-span-4 sm:col-span-4">Value</div>
            <div className="col-span-4 sm:col-span-3 text-right">Actions</div>
          </div>
        </div>

        {/* Empty state */}
        {vault.secrets.length === 0 && (
          <div className="px-6 py-16 text-center">
            <KeyRound className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-sm text-slate-500 font-sans mb-4">
              No secrets in this vault yet.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-sans bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Your First Secret
            </button>
          </div>
        )}

        {/* Secret rows */}
        <div className="divide-y divide-white/5">
          {vault.secrets.map((secret, i) => {
            const revealed = revealedIds.has(secret.id);
            return (
              <motion.div
                key={secret.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-12 gap-4 items-center px-4 sm:px-6 py-3 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Key */}
                <div className="col-span-4 sm:col-span-3">
                  <span className="font-mono text-sm neon-text-green truncate block">
                    {secret.key}
                  </span>
                </div>

                {/* Type badge */}
                <div className="col-span-2 hidden sm:block">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-mono border ${TYPE_COLORS[secret.type]}`}
                  >
                    {secret.type.replace("_", " ")}
                  </span>
                </div>

                {/* Value */}
                <div className="col-span-4 sm:col-span-4">
                  {revealed ? (
                    <span className="font-mono text-sm text-neon-cyan break-all">
                      {secret.value}
                    </span>
                  ) : (
                    <span className="font-mono text-sm text-slate-600 tracking-wider">
                      ••••••••••••
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-1">
                  <button
                    onClick={() => copyToClipboard(secret.value)}
                    title="Copy value"
                    className="p-2 rounded-lg text-slate-600 hover:text-neon-cyan hover:bg-neon-cyan/5 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleReveal(secret.id)}
                    title={revealed ? "Hide value" : "Reveal value"}
                    className="p-2 rounded-lg text-slate-600 hover:text-neon-cyan hover:bg-neon-cyan/5 transition-all"
                  >
                    {revealed ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(secret)}
                    title="Edit secret"
                    className="p-2 rounded-lg text-slate-600 hover:text-neon-purple hover:bg-neon-purple/5 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(secret)}
                    title="Delete secret"
                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Add/Edit Secret Modal */}
      <Modal
        isOpen={secretModalOpen}
        onClose={() => setSecretModalOpen(false)}
        title={editingSecret ? "Edit Secret" : "Add Secret"}
      >
        <form onSubmit={handleSaveSecret} className="space-y-4">
          <div>
            <label className="block text-sm font-sans text-slate-400 mb-1.5">
              Key
            </label>
            <input
              type="text"
              value={secretForm.key}
              onChange={(e) =>
                setSecretForm((prev) => ({ ...prev, key: e.target.value }))
              }
              placeholder="e.g. DATABASE_URL"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_10px_rgba(0,255,255,0.1)] transition-all"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-slate-400 mb-1.5">
              Value
            </label>
            <textarea
              value={secretForm.value}
              onChange={(e) =>
                setSecretForm((prev) => ({ ...prev, value: e.target.value }))
              }
              placeholder="Enter the secret value..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_10px_rgba(0,255,255,0.1)] transition-all resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-sans text-slate-400 mb-1.5">
              Type
            </label>
            <TypeSelect
              value={secretForm.type}
              onChange={(val) =>
                setSecretForm((prev) => ({ ...prev, type: val }))
              }
            />
          </div>

          <button
            type="submit"
            disabled={saving || !secretForm.key.trim() || !secretForm.value.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20 hover:shadow-neon-green disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {editingSecret ? "Update Secret" : "Add Secret"}
              </>
            )}
          </button>
        </form>
      </Modal>

      {/* Delete Secret Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Secret"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-300 font-sans">
                Are you sure you want to delete{" "}
                <span className="font-mono text-red-400">
                  {deletingSecret?.key}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-sans text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSecret}
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

      {/* Edit Vault Modal */}
      <Modal
        isOpen={editVaultModalOpen}
        onClose={() => setEditVaultModalOpen(false)}
        title="Edit Vault"
      >
        <form onSubmit={handleEditVault} className="space-y-4">
          <div>
            <label className="block text-sm font-sans text-slate-400 mb-1.5">
              Vault Name
            </label>
            <input
              type="text"
              value={editVaultForm.name}
              onChange={(e) =>
                setEditVaultForm((p) => ({ ...p, name: e.target.value }))
              }
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
              value={editVaultForm.description}
              onChange={(e) =>
                setEditVaultForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-sans text-sm placeholder-slate-600 focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_10px_rgba(0,255,255,0.1)] transition-all resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={savingVault || !editVaultForm.name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 hover:bg-neon-cyan/20 hover:shadow-neon-cyan disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {savingVault ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </Modal>

      {/* Delete Vault Modal */}
      <Modal
        isOpen={deleteVaultModalOpen}
        onClose={() => setDeleteVaultModalOpen(false)}
        title="Delete Vault"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 font-sans">
              Are you sure you want to delete{" "}
              <span className="font-mono text-red-400">{vault.name}</span>?
              All secrets inside will be permanently deleted.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteVaultModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-sans text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteVault}
              disabled={deletingVault}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 transition-all"
            >
              {deletingVault ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Vault
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
