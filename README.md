# SAJUBOYS_ADMIN

사주 도메인 지식 운영과 해석 생성 파이프라인을 관리하는 어드민 콘솔입니다.

## 현재 구조

- 사이드바 네비게이션
  - 대시보드
  - 지식관리
  - 상품관리
  - 생성기
  - 배포
- React Router 기반 페이지 분리
- API Live + Fallback(LocalStorage) 동시 지원

## 실행

```bash
cd SAJUBOYS_ADMIN
pnpm install
pnpm dev
```

기본 주소: `http://localhost:5173`

## API 연결

권장 기본값은 동일 도메인 API(`functions/api/admin/[[path]].ts`)입니다.
외부 API를 사용하려면 `VITE_DEFAULT_API_BASE_URL` 또는 상단 API 재연결 설정으로 변경할 수 있습니다.

1. 상단 `API 재연결`로 연결 상태 확인
2. `.env.production` 또는 `.env.local`의 기본 API 주소 사용
3. 인증은 `Admin API Key` 또는 Bearer Token 정책에 맞춰 백엔드에서 검증

### 내장 Admin API (Cloudflare Pages Functions)

- 엔드포인트 루트: `/api/admin/*`
- 구현 파일: `functions/api/admin/[[path]].ts`
- LLM 연동:
  - `OPENAI_API_KEY` 설정 시 `/api/admin/generate`가 OpenAI Responses API 호출
  - 미설정 시 fallback 생성 로직 사용
- 저장:
  - `ADMIN_DATA_KV` 바인딩 시 데이터 영속 저장
  - 미바인딩 시 워커 메모리 fallback 저장

## 주요 기능

- 상품(프로젝트) 목록/선택/생성
- 지식 블록 라이브러리 CRUD + 프로젝트 attach/detach
- 상품 유형(`daily_fortune | compatibility | full_reading`) 설정
- 프롬프트 템플릿(`{{knowledge:카테고리}}`, `{{saju_chart}}`, `{{user_prompt}}`) 조립 미리보기
- 생성기: 출생정보 입력 -> 사주 차트 -> 프롬프트 조립 -> 결과 생성
- 생성 이력 저장/비교
- 배포 스냅샷 생성 + 버전 타임라인
- 자동 저장(디바운스) + 확인 모달 기반 비개발자 UX

## 스키마/계약 문서

- 기획/작업 로그: `docs/PLANNING.md`
- API 계약: `docs/admin-api-contract.md`
- 스키마 초안: `docs/admin-knowledge-schema.sql`
- 마이그레이션: `supabase/migrations/`

## 운영 배포 (`admin.saju-boys.com`)

- Cloudflare + GitHub 배포: `docs/cloudflare-pages-deploy.md`
- 자체 서버 + Nginx 배포: `docs/admin-deployment-guide.md`
- Nginx 설정 예시: `ops/nginx/admin.saju-boys.com.conf`
- 운영자 보호용 Basic Auth: `worker/index.js`, `functions/_middleware.ts`
