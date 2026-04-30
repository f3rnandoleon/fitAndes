import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "accent";
  className?: string;
}

/**
 * Standard badge component for the FitAndes design system.
 */
export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 text-[10px] uppercase font-medium tracking-wider";

  const variants = {
    default: "bg-surface text-foreground",
    success: "bg-success/10 text-success border border-success/20",
    danger: "bg-danger/10 text-danger border border-danger/20",
    warning: "bg-accent/10 text-accent border border-accent/20", // using accent for warning-like color
    accent: "bg-accent text-white",
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  return <span className={classes}>{children}</span>;
}
