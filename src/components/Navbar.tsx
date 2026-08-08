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
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <span className="text-sm font-semibold tracking-tight text-brand-800">
          ArchiLog
        </span>
        <div className="ml-auto flex items-center gap-2 sm:order-last">
          {email && (
            <span className="hidden text-xs text-gray-400 sm:inline">
              {email}
            </span>
          )}
          <LogoutButton />
        </div>
        <nav className="grid w-full grid-cols-3 gap-1 sm:flex sm:w-auto sm:items-center sm:gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-2 py-1.5 text-center text-sm font-medium transition-colors sm:px-3 ${
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
    </header>
  );
}
