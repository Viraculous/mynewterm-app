"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function IconWrap({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center">{children}</span>;
}

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 21a8 8 0 0 0-16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 6h13M8 12h13M8 18h13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCritique() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/", label: "Dashboard", icon: <IconHome /> },
    { href: "/profile", label: "My Profile", icon: <IconUser /> },
    { href: "/apply", label: "New Application", icon: <IconPlus /> },
    { href: "/critique", label: "Critique", icon: <IconCritique /> },
    { href: "/library", label: "Library", icon: <IconBookmark /> },
    { href: "/tracker", label: "Tracker", icon: <IconList /> },
  ];

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-white/10"
      style={{ background: "#0D1526" }}
    >
      <div className="px-4 pt-5 pb-4">
        <div className="text-[15px] font-extrabold leading-tight tracking-tight" style={{ color: "#60A5FA" }}>
          MyNewTerm Helper
        </div>
        <div className="mt-1 text-[13px] font-semibold tracking-wide text-gray-400">
          Science Teacher
        </div>
      </div>

      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors",
                    "border-l-2",
                    isActive
                      ? "border-blue-400 text-blue-300 bg-white/5"
                      : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5",
                  ].join(" ")}
                >
                  <IconWrap>{item.icon}</IconWrap>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 pb-4 pt-3 text-xs text-gray-500">
        Submit manually on MyNewTerm
      </div>
    </aside>
  );
}

