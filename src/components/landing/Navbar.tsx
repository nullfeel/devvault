"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <AnimatePresence>
        {scrolled && (
          <motion.nav
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
          >
            <div className="mx-auto max-w-6xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center justify-between">
              {/* Logo */}
              <a href="#" className="flex items-center gap-2 group">
                <Shield className="w-5 h-5 text-neon-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] transition-transform group-hover:scale-110" />
                <span className="font-mono font-bold text-lg neon-text-cyan">
                  DevVault
                </span>
              </a>

              {/* Desktop Links */}
              <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-neon-cyan transition-colors font-sans"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="/register"
                  className="relative px-5 py-2 text-sm font-mono font-semibold text-neon-cyan border border-neon-cyan/40 rounded-lg hover:bg-neon-cyan/10 hover:shadow-neon-cyan transition-all duration-300"
                >
                  Get Started
                </a>
              </div>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden text-slate-300 hover:text-neon-cyan transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile Fullscreen Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-cyber-dark/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-10"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-neon-cyan transition-colors"
              aria-label="Close menu"
            >
              <X className="w-7 h-7" />
            </button>

            <a href="#" className="flex items-center gap-2 mb-4" onClick={() => setMobileOpen(false)}>
              <Shield className="w-6 h-6 text-neon-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]" />
              <span className="font-mono font-bold text-2xl neon-text-cyan">DevVault</span>
            </a>

            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="text-2xl font-sans text-slate-300 hover:text-neon-cyan transition-colors"
              >
                {link.label}
              </motion.a>
            ))}

            <motion.a
              href="/register"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-4 px-8 py-3 font-mono font-semibold text-lg text-cyber-dark bg-neon-cyan rounded-lg shadow-neon-cyan hover:scale-105 transition-transform"
            >
              Get Started
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
