"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const dashTabs = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/design", label: "Design" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/skills", label: "Skills" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export function DashTabs() {
  const pathname = usePathname();
  return (
    <nav className="ui-tabs" aria-label="Dashboard">
      <div className="wrap">
        <ul>
          {dashTabs.map((tab) => (
            <li key={tab.href}>
              <Link href={tab.href} aria-current={pathname === tab.href ? "page" : undefined}>
                {tab.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
