"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Standard input component for the FitAndes design system.
 */
export function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[10px] uppercase tracking-[0.16em] text-subtle"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full border px-4 py-3 text-sm bg-white transition-colors focus:border-foreground outline-none border-border text-foreground placeholder:text-subtle/50 rounded-[var(--radius-md)] ${
          error ? "border-danger" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  );
}
