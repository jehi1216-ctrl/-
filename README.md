# 업무 일지 (Work Journal)

Next.js(App Router) + Supabase + Tailwind CSS로 만든 개인 업무 일지 웹앱입니다.

## 주요 기능

- 이메일 기반 회원가입/로그인 (Supabase Auth)
- 오늘 날짜 기준 업무 입력 (내용, 카테고리, 소요시간, 상태)
- 날짜별로 그룹핑된 전체 업무 일지 목록 + 카테고리 필터
- 모바일 반응형 UI

## 폴더 구조

```
work-journal/
├─ src/
│  ├─ app/
│  │  ├─ (main)/            # 로그인 필요한 화면 (공통 레이아웃 + 네비게이션)
│  │  │  ├─ layout.tsx
│  │  │  ├─ dashboard/      # 오늘 업무 입력 화면
│  │  │  └─ journal/        # 전체 목록 화면
│  │  ├─ login/
│  │  ├─ signup/
│  │  ├─ auth/callback/     # 이메일 인증 콜백
│  │  ├─ layout.tsx
│  │  └─ page.tsx           # "/" → "/dashboard" 리다이렉트
│  ├─ components/           # Navbar, JournalForm, JournalEntryCard 등
│  ├─ lib/supabase/         # Supabase client/server/middleware 유틸
│  ├─ lib/date.ts           # 날짜 포맷/타임존(KST) 유틸
│  ├─ middleware.ts         # 세션 갱신 + 인증 라우트 보호
│  └─ types/journal.ts      # WorkLog 타입, 카테고리/상태 상수
├─ supabase/schema.sql      # DB 스키마 + RLS 정책
└─ .env.local.example
```

## 1. 로컬 개발 환경 준비

Node.js 18.18 이상이 필요합니다.

```bash
npm install
cp .env.local.example .env.local   # 아래 2번에서 발급받은 값 입력
npm run dev
```

브라우저에서 http://localhost:3000 접속.

## 2. Supabase 프로젝트 생성 방법

1. [supabase.com](https://supabase.com) 접속 후 로그인, **New Project** 클릭
2. 프로젝트 이름, DB 비밀번호, 리전(가까운 곳, 예: Northeast Asia (Seoul) 없으면 Tokyo)을 선택하고 생성
3. 생성이 끝나면 좌측 메뉴 **SQL Editor**로 이동 → 이 저장소의 [`supabase/schema.sql`](./supabase/schema.sql) 내용을 붙여넣고 **Run**
   - `work_logs` 테이블과 Row Level Security 정책이 생성됩니다.
4. 좌측 메뉴 **Project Settings → API**로 이동해서 다음 값을 확인:
   - `Project URL` → `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `.env.local`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Authentication → Providers**에서 Email 로그인이 활성화되어 있는지 확인 (기본 활성화됨)
6. **Authentication → URL Configuration**에서 아래 값을 등록:
   - Site URL: 로컬 개발 시 `http://localhost:3000`, 배포 후에는 Vercel 도메인으로 변경
   - Redirect URLs: `http://localhost:3000/auth/callback` (배포 후 `https://your-domain.vercel.app/auth/callback`도 추가)
   - 회원가입 시 발송되는 이메일 인증 링크가 이 콜백 경로(`/auth/callback`)로 돌아와 세션을 생성합니다.

`.env.local` 예시:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 3. Vercel 배포 방법

1. 이 프로젝트를 GitHub 저장소로 push
2. [vercel.com](https://vercel.com)에서 **Add New → Project**로 해당 저장소 import
3. Framework Preset은 자동으로 Next.js가 감지됩니다.
4. **Environment Variables**에 아래 두 값을 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy** 클릭
6. 배포가 끝나면 Supabase **Authentication → URL Configuration**의 Site URL / Redirect URLs를 실제 Vercel 도메인(`https://your-app.vercel.app`, `https://your-app.vercel.app/auth/callback`)으로 업데이트
   - 업데이트하지 않으면 배포 환경에서 회원가입 확인 메일의 링크가 로컬호스트로 연결됩니다.

## 다음 단계 아이디어 (2단계 이후)

- 카테고리를 사용자가 직접 추가/관리
- 주간/월간 통계 (카테고리별 소요시간 합계)
- 업무 일지 수정 기능 (현재는 상태 토글/삭제만 지원)
- 다크 모드
