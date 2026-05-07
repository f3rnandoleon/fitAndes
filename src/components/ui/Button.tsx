"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

/**
 * Standard button component for the FitAndes design system.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center uppercase transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none font-medium";

  const variants = {
    primary: "bg-foreground text-background hover:opacity-90",
    secondary: "bg-surface text-foreground hover:bg-surface-soft border border-border",
    outline: "border border-foreground text-foreground hover:bg-foreground hover:text-background",
    ghost: "text-muted hover:bg-surface",
    danger: "bg-danger text-white hover:opacity-90",
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px] tracking-[0.12em] rounded-full",
    md: "px-6 py-3 text-[11px] tracking-[0.16em] rounded-full",
    lg: "px-8 py-4 text-xs tracking-[0.2em] rounded-full",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="mr-2 h-3 w-3 animate-spin border-2 border-current border-t-transparent rounded-full" />
      ) : null}
      {children}
    </button>
  );
}
