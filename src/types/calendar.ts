// 캘린더 한 칸에 들어가는 항목. 일정(schedule_items), 일지의 '내가 할 일',
// 그리고 종료하면서 협의된 날짜('결정')를 함께 보여준다.
// 서버 컴포넌트(page.tsx)가 만들고 클라이언트 컴포넌트가 받으므로 순수 데이터만 담는다.
export type CalendarEntry =
  | {
      kind: "schedule";
      id: string;
      label: string;
      time: string | null; // HH:MM. 없으면 시간 없는 항목으로 뒤에 세운다
      done: boolean;
      projectId: string | null; // 현장을 지정하지 않은 일정은 null(회색)
      projectName: string | null;
    }
  | {
      kind: "todo";
      id: string;
      label: string;
      time: string | null;
      projectId: string;
      projectName: string;
      content: string;
      logDate: string;
    }
  | {
      // status='done' + decision_dates. 끝난 일이지만 '그날로 협의됐다'는 약속이라
      // 캘린더에는 남아 있어야 한다. 고치는 건 일지 카드 쪽이므로 읽기 전용이다.
      // 날짜가 여러 개면 날짜마다 한 칸씩 만들어지고, 그때 id는 같다(키는 날짜별 배열 안에서만 쓰인다).
      kind: "decision";
      id: string;
      label: string; // 그날 일정 내용. 비면 결정사항 → 기록 본문 순으로 대신 넣는다
      time: string | null;
      decision: string | null; // 일지의 결정사항 (label과 같으면 두 번 안 찍는다)
      projectId: string;
      projectName: string;
      content: string;
      logDate: string;
    };
