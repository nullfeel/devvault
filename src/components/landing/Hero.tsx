"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

/* ── Typing animation hook ─────────────────────────────── */
function useTypingAnimation(lines: string[], speed = 35, lineDelay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let output = "";
    let lineIdx = 0;
    let charIdx = 0;

    const tick = () => {
      if (lineIdx >= lines.length) {
        setDone(true);
        return;
      }
      const line = lines[lineIdx];
      if (charIdx < line.length) {
        output += line[charIdx];
        charIdx++;
        setDisplayed(output);
        setTimeout(tick, speed);
      } else {
        output += "\n";
        setDisplayed(output);
        lineIdx++;
        charIdx = 0;
        setTimeout(tick, lineDelay);
      }
    };

    // Delay start by 1.5s so hero text animates first
    setTimeout(tick, 1500);
  }, [lines, speed, lineDelay]);

  return { displayed, done };
}

/* ── Terminal lines ────────────────────────────────────── */
const terminalLines = [
  "$ devvault store --key STRIPE_API_KEY",
  "\u2713 Encrypted with AES-256-GCM",
  "\u2713 Stored in vault \"production\"",
  "",
  "$ devvault list --vault production",
  "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
  "\u2502 Key             \u2502 Type     \u2502 Updated     \u2502",
  "\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524",
  "\u2502 STRIPE_API_KEY  \u2502 API_KEY  \u2502 2 min ago   \u2502",
  "\u2502 DATABASE_URL    \u2502 ENV_VAR  \u2502 1 hour ago  \u2502",
  "\u2502 JWT_SECRET      \u2502 TOKEN    \u2502 3 days ago  \u2502",
  "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
];

/* ── Stagger variants ──────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export function Hero() {
  const { displayed, done } = useTypingAnimation(terminalLines, 18, 300);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto text-center flex flex-col items-center"
      >
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
          </span>
          <span className="font-mono text-xs tracking-widest text-slate-400 uppercase">
            Encrypted &middot; Secure &middot; Fast
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={fadeUp}
          className="font-mono font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight"
        >
          <span className="glitch block" data-text="Your secrets.">
            Your secrets.
          </span>
          <span
            className="glitch block neon-text-cyan"
            data-text="Encrypted."
          >
            Encrypted.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-2xl text-base sm:text-lg text-slate-400 font-sans leading-relaxed"
        >
          Military-grade AES-256 encryption for your API keys, tokens, and
          credentials. Built for developers who take security seriously.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <a
            href="/register"
            className="px-8 py-3.5 font-mono font-semibold text-sm bg-neon-cyan text-cyber-dark rounded-lg shadow-neon-cyan hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] transition-all duration-300"
          >
            Start Securing
          </a>
          <a
            href="#features"
            className="px-8 py-3.5 font-mono font-semibold text-sm text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/10 hover:border-neon-cyan/60 transition-all duration-300"
          >
            View Demo
          </a>
        </motion.div>

        {/* Terminal */}
        <motion.div
          variants={fadeUp}
          className="mt-14 w-full max-w-2xl"
        >
          <div className="relative glass-card overflow-hidden">
            {/* Terminal top bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neon-cyan/20 bg-neon-cyan/5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-slate-500 font-mono">
                devvault@terminal
              </span>
            </div>

            {/* Terminal content */}
            <div className="p-4 sm:p-6 overflow-x-auto">
              <pre className="font-mono text-[11px] sm:text-xs leading-relaxed text-neon-green whitespace-pre">
                {displayed}
                {!done && (
                  <span className="inline-block w-2 h-4 bg-neon-green animate-blink align-middle" />
                )}
              </pre>
            </div>

            {/* Glow accent at top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
      >
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-neon-cyan/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
