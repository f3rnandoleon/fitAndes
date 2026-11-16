import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Accessible breadcrumb navigation bar for public pages.
 */
export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Miga de pan"
      className={`flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-subtle ${className}`.trim()}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2 min-w-0">
            {index > 0 && (
              <span aria-hidden="true" className="text-subtle/60">
                /
              </span>
            )}
            {item.href && !isLast ? (
              <Link href={item.href} className="transition-opacity hover:opacity-60">
                {item.label}
              </Link>
            ) : (
              <span
                className={`truncate max-w-[14rem] sm:max-w-none ${isLast ? "text-foreground font-medium" : ""}`}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

