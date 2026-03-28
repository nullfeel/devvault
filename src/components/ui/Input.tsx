"use client";

import React, { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, className = "", id, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || props.name || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm text-gray-400 font-mono"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon
                size={16}
                className={`transition-colors duration-200 ${
                  isFocused ? "text-cyan-400" : "text-gray-500"
                }`}
              />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e as React.FocusEvent<HTMLInputElement>);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e as React.FocusEvent<HTMLInputElement>);
            }}
            className={`
              w-full bg-white/5 border rounded-lg px-4 py-3 text-white
              placeholder-gray-500 font-sans text-sm
              transition-all duration-200 outline-none
              ${Icon ? "pl-10" : ""}
              ${
                error
                  ? "border-red-500/50 shadow-[0_0_10px_rgba(255,0,0,0.1)]"
                  : "border-white/10 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,255,255,0.15)]"
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400 font-mono mt-1"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
