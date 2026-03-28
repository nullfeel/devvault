"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: [
    "bg-[#00FFFF] text-[#0A0A0F] font-semibold",
    "hover:shadow-[0_0_25px_rgba(0,255,255,0.35)]",
    "active:shadow-[0_0_15px_rgba(0,255,255,0.25)]",
    "disabled:bg-cyan-900/40 disabled:text-gray-500 disabled:shadow-none",
  ].join(" "),
  outline: [
    "bg-transparent border border-cyan-400/50 text-cyan-400",
    "hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,255,255,0.15)]",
    "hover:bg-cyan-400/5",
    "disabled:border-gray-700 disabled:text-gray-600 disabled:shadow-none",
  ].join(" "),
  ghost: [
    "bg-transparent text-gray-300",
    "hover:bg-white/5 hover:text-white",
    "disabled:text-gray-600",
  ].join(" "),
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-mono
          transition-all duration-200 cursor-pointer
          disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
