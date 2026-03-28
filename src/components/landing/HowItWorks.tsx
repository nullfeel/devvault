"use client";

import { motion } from "framer-motion";
import { FolderLock, KeyRound, Share2 } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: FolderLock,
    title: "Create a Vault",
    description:
      "Set up isolated vaults for each project or environment. Define access policies and encryption settings in seconds.",
  },
  {
    num: "02",
    icon: KeyRound,
    title: "Store Secrets",
    description:
      "Add API keys, tokens, and credentials. Everything is encrypted client-side with AES-256-GCM before storage.",
  },
  {
    num: "03",
    icon: Share2,
    title: "Share Securely",
    description:
      "Generate expiring, one-time links to share secrets with your team. Full audit trail on every access.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 sm:py-32 px-4 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <span className="font-mono text-sm text-neon-cyan tracking-widest">
            02
          </span>
          <h2 className="mt-2 font-mono font-bold text-3xl sm:text-4xl md:text-5xl text-slate-50">
            How It Works
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-[72px] left-[16.67%] right-[16.67%] h-px">
            <div className="w-full h-full bg-gradient-to-r from-neon-cyan/40 via-neon-magenta/40 to-neon-purple/40" />
            {/* Dots on the line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-cyan shadow-neon-cyan" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-magenta shadow-neon-magenta" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-neon-purple shadow-neon-purple" />
          </div>

          {/* Connecting line (mobile) */}
          <div className="md:hidden absolute top-0 bottom-0 left-6 w-px">
            <div className="w-full h-full bg-gradient-to-b from-neon-cyan/40 via-neon-magenta/40 to-neon-purple/40" />
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon;
            const colors = [
              { text: "text-neon-cyan", shadow: "shadow-neon-cyan", bg: "bg-neon-cyan/10", border: "border-neon-cyan/20" },
              { text: "text-neon-magenta", shadow: "shadow-neon-magenta", bg: "bg-neon-magenta/10", border: "border-neon-magenta/20" },
              { text: "text-neon-purple", shadow: "shadow-neon-purple", bg: "bg-neon-purple/10", border: "border-neon-purple/20" },
            ][i];

            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.2, ease: "easeOut" }}
                className="relative flex flex-col items-center text-center md:pl-0 pl-14"
              >
                {/* Step number */}
                <span
                  className={`font-mono font-bold text-5xl sm:text-6xl ${colors.text} opacity-20 mb-4 select-none`}
                >
                  {step.num}
                </span>

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-5 ${colors.shadow}`}
                >
                  <Icon className={`w-7 h-7 ${colors.text}`} />
                </div>

                {/* Title */}
                <h3 className="font-mono font-semibold text-xl text-slate-100 mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 font-sans leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
