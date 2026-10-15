# 홍드 TALK

원하는 대화 상대를 고르고 편안하게 이야기를 시작하는 반응형 웹 채팅 경험입니다. 로그인, 대화 상대 탐색, 채팅방, 내 정보 화면을 하나의 일관된 인터페이스로 제공합니다.

## 주요 경험

- 데스크탑·태블릿·모바일에 맞춰 바뀌는 채팅 레이아웃
- 이메일 기반 회원가입 및 로그인
- Supabase Auth와 사용자 프로필 연동
- 상대 선택, 메시지 입력, 채팅방 탐색 흐름
- 접근 가능한 키보드 포커스와 화면별 내비게이션 상태

## 기술 구성

- Vanilla HTML, CSS, JavaScript
- Supabase Auth / Database
- Vercel 정적 배포

## 로컬 실행

```sh
npm start
```

`http://127.0.0.1:4173`에서 확인할 수 있습니다.

## Supabase 설정

1. `supabase login` 후 프로젝트를 연결합니다.
2. `supabase db push`로 `profiles` 테이블과 RLS 정책을 적용합니다.
3. `supabase-config.js`에 프로젝트 URL과 publishable(또는 anon) 키를 넣습니다.

`service_role` 키는 브라우저 코드나 저장소에 절대 포함하지 않습니다.
