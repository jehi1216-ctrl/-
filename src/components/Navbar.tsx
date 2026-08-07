"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/projects", label: "프로젝트" },
  { href: "/dashboard", label: "오늘 기록" },
  { href: "/weekly", label: "주간 업무" },
  { href: "/journal", label: "전체 목록" },
  { href: "/calendar", label: "캘린더" },
  { href: "/checklist", label: "체크리스트" },
];

export default function Navbar({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-sm font-semibold tracking-tight text-brand-800">
            ArchiLog
          </span>
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {email && (
            <span className="hidden text-xs text-gray-400 sm:inline">
              {email}
            </span>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
