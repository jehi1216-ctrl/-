// 캘린더 한 칸에 들어가는 항목. 일정(schedule_items)과 일지의 '내가 할 일'을 함께 보여준다.
// 서버 컴포넌트(page.tsx)가 만들고 클라이언트 컴포넌트가 받으므로 순수 데이터만 담는다.
export type CalendarEntry =
  | {
      kind: "schedule";
      id: string;
      label: string;
      done: boolean;
      projectId: string | null; // 현장을 지정하지 않은 일정은 null(회색)
      projectName: string | null;
    }
  | {
      kind: "todo";
      id: string;
      label: string;
      projectId: string;
      projectName: string;
      content: string;
      logDate: string;
    };
