import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { currentMonthKST, shiftMonth, buildMonthGrid, todayKST } from "@/lib/date";
import type { ScheduleItem } from "@/types/schedule";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonthKST();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weeks = buildMonthGrid(month);
  const rangeStart = weeks[0][0].date;
  const rangeEnd = weeks[weeks.length - 1][6].date;

  const { data: scheduleItems } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("user_id", user!.id)
    .gte("date", rangeStart)
    .lte("date", rangeEnd)
    .order("created_at", { ascending: true });

  const itemsByDate = new Map<string, ScheduleItem[]>();
  for (const item of (scheduleItems ?? []) as ScheduleItem[]) {
    const bucket = itemsByDate.get(item.date) ?? [];
    bucket.push(item);
    itemsByDate.set(item.date, bucket);
  }

  const [y, m] = month.split("-").map(Number);
  const today = todayKST();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">
          {y}년 {m}월
        </h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?month=${shiftMonth(month, -1)}`}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            이전
          </Link>
          <Link
            href={`/calendar?month=${currentMonthKST()}`}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            오늘
          </Link>
          <Link
            href={`/calendar?month=${shiftMonth(month, 1)}`}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            다음
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px] rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-gray-100 text-center text-xs font-medium text-gray-400">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid grid-cols-7 border-b border-gray-100 last:border-b-0"
            >
              {week.map((cell) => {
                const dayItems = itemsByDate.get(cell.date) ?? [];
                const dayNum = Number(cell.date.slice(8, 10));
                const isToday = cell.date === today;
                return (
                  <div
                    key={cell.date}
                    className={`flex min-h-[96px] flex-col gap-1 border-r border-gray-100 p-1.5 text-left last:border-r-0 ${
                      cell.inMonth ? "" : "bg-gray-50/50"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        isToday
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 font-semibold text-white"
                          : cell.inMonth
                            ? "text-gray-500"
                            : "text-gray-300"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayItems.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className={`truncate rounded px-1 py-0.5 text-[10px] ${
                            item.is_done
                              ? "bg-gray-100 text-gray-400 line-through"
                              : "bg-brand-50 text-brand-700"
                          }`}
                          title={item.content}
                        >
                          {item.content}
                        </span>
                      ))}
                      {dayItems.length > 3 && (
                        <span className="text-[10px] text-gray-400">
                          +{dayItems.length - 3}건 더
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
