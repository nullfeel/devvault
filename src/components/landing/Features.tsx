"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  FolderLock,
  Terminal,
  Timer,
  FileSearch,
} from "lucide-react";

/* ── Feature data ──────────────────────────────────────── */
const features = [
  {
    icon: ShieldCheck,
    title: "AES-256 Encryption",
    description:
      "Military-grade, zero-knowledge encryption. Your secrets are encrypted before they ever leave your device. Not even we can read them.",
    large: true,
  },
  {
    icon: Users,
    title: "Team Sharing",
    description:
      "Share secrets with teammates via secure, expiring links. Granular access controls ensure only the right people see the right data.",
    large: true,
  },
  {
    icon: FolderLock,
    title: "Vault Organization",
    description:
      "Group secrets by project, environment, or team. Keep production, staging, and development credentials neatly separated.",
    large: false,
  },
  {
    icon: Terminal,
    title: "CLI Integration",
    description:
      "Manage secrets directly from your terminal. Pull, push, and rotate credentials without leaving your workflow.",
    large: false,
  },
  {
    icon: Timer,
    title: "Auto-Expiry",
    description:
      "Secrets self-destruct after a set time. Perfect for temporary access tokens and one-time credentials.",
    large: false,
  },
  {
    icon: FileSearch,
    title: "Audit Log",
    description:
      "Track who accessed what and when. Full history of every read, write, and share operation in your vaults.",
    large: false,
  },
];

/* ── Spotlight card ────────────────────────────────────── */
function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    []
  );

  const Icon = feature.icon;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`relative group glass-card p-6 sm:p-8 overflow-hidden cursor-default ${
        feature.large ? "md:col-span-2 lg:col-span-1" : ""
      }`}
    >
      {/* Spotlight effect */}
      {hovering && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(320px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0,255,255,0.07), transparent 60%)`,
          }}
        />
      )}

      {/* Neon top border on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/0 to-transparent group-hover:via-neon-cyan/60 transition-all duration-500" />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-5 group-hover:shadow-neon-cyan transition-shadow duration-500">
          <Icon className="w-6 h-6 text-neon-cyan" />
        </div>
        <h3 className="font-mono font-semibold text-lg text-slate-100 mb-2">
          {feature.title}
        </h3>
        <p className="text-sm text-slate-400 font-sans leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Features section ──────────────────────────────────── */
export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="font-mono text-sm text-neon-cyan tracking-widest">
            01
          </span>
          <h2 className="mt-2 font-mono font-bold text-3xl sm:text-4xl md:text-5xl text-slate-50">
            Features
          </h2>
          <p className="mt-4 max-w-xl text-slate-400 font-sans">
            Everything you need to store, manage, and share secrets with
            confidence.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
