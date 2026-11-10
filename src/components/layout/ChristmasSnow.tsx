"use client";

import { useEffect, useState } from "react";

export default function ChristmasSnow() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 24 copos de nieve ligeros, fluidos y transparentes
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-20 select-none"
      aria-hidden="true"
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="snowflake absolute text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
          style={{
            left: `${(i * 4.2 + (i % 3) * 1.5) % 98}%`,
            animationDelay: `${(i * 0.45) % 6}s`,
            animationDuration: `${7 + (i % 5) * 2.5}s`,
            fontSize: `${9 + (i % 4) * 4}px`,
            opacity: 0.35 + (i % 3) * 0.25,
          }}
        >
          {i % 3 === 0 ? "❄" : i % 3 === 1 ? "❅" : "•"}
        </span>
      ))}
    </div>
  );
}

