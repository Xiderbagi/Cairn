"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/dashboard", "Overview"],
  ["/entries/new", "Add entry"],
  ["/entries", "Entries"],
  ["/home-equipment", "Home & equipment"],
  ["/taxes", "T2125 & GST/HST"],
  ["/settings", "Settings"],
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav className="mb-5 mt-4 flex gap-1 overflow-x-auto border-b border-line" aria-label="Main">
      {LINKS.map(([href, label]) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[0.95rem] font-medium ${active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
