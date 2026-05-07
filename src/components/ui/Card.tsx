import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

/**
 * Standard card component for the FitAndes design system.
 */
export function Card({
  children,
  className = "",
  padding = "md",
  hoverable = false,
}: CardProps) {
  const baseStyles = "border border-border bg-white transition-all rounded-[var(--radius-lg)] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]";
  
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8 sm:p-10",
  };

  const hoverStyles = hoverable ? "hover:border-subtle hover:shadow-sm" : "";

  const classes = `${baseStyles} ${paddings[padding]} ${hoverStyles} ${className}`;

  return <div className={classes}>{children}</div>;
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`px-6 py-4 border-b border-border/60 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`px-6 py-4 border-t border-border/60 bg-surface/30 ${className}`}>{children}</div>;
}
