"use client";

import { motion } from "framer-motion";

export function CTA() {
  return (
    <section id="cta" className="relative py-24 sm:py-32 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative glass-card neon-border p-10 sm:p-16 text-center overflow-hidden"
        >
          {/* Background glow blobs */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-neon-magenta/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Shimmer heading */}
            <h2 className="font-mono font-bold text-3xl sm:text-4xl md:text-5xl leading-tight">
              <span
                className="inline-block bg-clip-text text-transparent bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]"
                style={{
                  backgroundImage:
                    "linear-gradient(110deg, #f8fafc 0%, #00FFFF 25%, #FF00FF 50%, #00FFFF 75%, #f8fafc 100%)",
                }}
              >
                Ready to secure your secrets?
              </span>
            </h2>

            <p className="mt-5 text-slate-400 font-sans text-base sm:text-lg max-w-lg mx-auto">
              Join developers who trust DevVault for their most sensitive data.
            </p>

            <motion.a
              href="/register"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-block mt-8 px-10 py-4 font-mono font-bold text-sm sm:text-base bg-neon-cyan text-cyber-dark rounded-xl shadow-neon-cyan hover:shadow-[0_0_40px_rgba(0,255,255,0.5)] transition-shadow duration-300"
            >
              Get Started &mdash; It&apos;s Free
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
