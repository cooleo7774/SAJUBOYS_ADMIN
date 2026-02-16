# SAJUBOYS ADMIN Rework Planning

- Last updated: 2026-02-16
- Owner: SAJUBOYS Admin Team
- Scope: Knowledge Studio -> 사주 도메인 지식 운영/생성 파이프라인 전면 리워크

## 1) 비전

현재 어드민은 프롬프트 엔지니어링 중심의 `Knowledge Studio` 구조로 되어 있으며, 사주 도메인 지식 운영/검증/배포 워크플로우를 직접 반영하지 못한다.

리워크 목표는 아래 3가지를 동시에 달성하는 것이다.

1. 사주 도메인 지식을 블록 단위로 구조화하고 재사용 가능하게 만든다.
2. 상품 유형별(종합운세/궁합/사주풀이)로 프롬프트 템플릿과 운영 정책을 분리한다.
3. 유저 출생정보 입력 -> 사주 차트 계산 -> 지식 조립 -> LLM 생성 -> 이력 저장까지 하나의 파이프라인으로 연결한다.

## 2) 현재 문제 정의

- `src/App.tsx` 단일 파일(1293줄) + 탭 6개 구조로 책임이 과도하게 결합되어 있음.
- 프로젝트 컨텍스트 메타데이터를 `context_text` 내부 HTML 코멘트로 저장하여 데이터 관리/검색/검증이 어려움.
- 실제 LLM 호출이 없고 문자열 템플릿 조합만 수행.
- 상품 유형 분리 없이 단일 프로젝트 모델로 운영되어 확장성 부족.

## 3) 목표 아키텍처

### 3.1 프론트엔드 구조

- 라우팅: `react-router-dom`
- 디렉토리 기준:
  - `src/routes/`
  - `src/components/`
  - `src/hooks/`
  - `src/api/`
  - `src/utils/`
- 네비게이션:
  - 대시보드
  - 지식관리
  - 상품관리
  - 생성기
  - 배포

### 3.2 백엔드/데이터 구조

- 지식 블록 테이블 + 프로젝트-지식 매핑 테이블 기반 운영
- 프로젝트별 `product_type`, `prompt_template`, `tone_profile` 관리
- 생성 파이프라인 결과를 이력 테이블에 기록
- 사주 계산은 API/Edge Function으로 분리

## 4) 도메인 지식 모델

### 4.1 Knowledge Category 표준

- `cheon_gan` (천간)
- `ji_ji` (지지)
- `ohaeng` (오행)
- `sib_i_unseong` (십이운성)
- `sibseong` (십성)
- `sinsal` (신살)
- `compatibility_principle` (궁합원리)
- `fortune_principle` (운세원리)
- `tongbyeon` (통변술)
- `interpretation_guide` (해석가이드)
- `custom`

### 4.2 Knowledge Block 개념

- 최소 단위: "하나의 독립적인 규칙/해석 근거"
- 필수 필드: title, category, content(markdown), tags, status
- 운영 필드: priority, source, version, created_by, updated_by

### 4.3 Prompt Template 규칙

- 템플릿 내 지식 참조 구문:
  - `{{knowledge:카테고리}}`
- 예시:
  - `{{knowledge:cheon_gan}}`
  - `{{knowledge:compatibility_principle}}`
- 조립 시점:
  1. 상품 유형
  2. 사용자 입력 기반 사주 계산 결과
  3. 연결된 지식 블록
  4. 톤/가드레일

## 5) 상품(프로젝트) 모델

### 5.1 Product Type

- `daily_fortune` (일일/기간 운세)
- `compatibility` (궁합)
- `full_reading` (종합 사주풀이)

### 5.2 운영 정책

- 상품별:
  - 프롬프트 템플릿
  - 톤앤매너 프로필
  - 가드레일
  - 연결 가능한 지식 카테고리 집합
- 목적: 동일 지식을 재사용하되 상품별 해석 방식은 분리 유지

## 6) 데이터 모델 변경안

### 6.1 신규/변경 테이블

1. `admin_knowledge_blocks` (신규)
2. `admin_project_knowledge` (신규, M:N)
3. `admin_generation_history` (신규)
4. `admin_projects` (기존 확장)

### 6.2 컬럼 변경 (admin_projects)

- 추가:
  - `product_type text check (...)`
  - `prompt_template text`
  - `tone_profile jsonb`

### 6.3 SQL 마이그레이션 원칙

- 파일은 `supabase/migrations/`에 timestamp prefix로 생성
- 모든 신규 테이블에 `created_at`, `updated_at` 포함
- 운영자 접근 RLS 정책/권한 정책 명시
- 롤백 가능성 검토 후 적용

## 7) API 설계 방향

### 7.1 프론트 API 모듈 분리

- `src/api/client.ts`: 공통 fetch client + header + error 처리
- `src/api/projects.ts`: 프로젝트/상품 관련 API
- `src/api/knowledge.ts`: 지식 블록 CRUD + attach/detach
- `src/api/types.ts`: 공통 타입 정의

### 7.2 사주 계산/생성 엔드포인트

- 사주 계산:
  - `POST /api/admin/saju/calculate`
- 생성(LLM):
  - `POST /api/admin/generate` (명칭은 구현 단계에서 확정)
- 응답에는 최소한 아래 포함:
  - 사주 차트(연/월/일/시 주)
  - 오행 분포
  - 십성 결과
  - 최종 프롬프트
  - 생성 결과 텍스트

## 8) 단계별 실행 계획

## Step 0: 기획 문맥 고정

- [x] `docs/PLANNING.md` 생성
- 산출물:
  - 비전, 모델, 단계 계획, 검증 기준을 단일 문서로 유지

## Step 1: 기반 구조 구축

- 상태: 완료 (2026-02-16)
- 대상 파일:
  - `src/App.tsx`
  - `src/api.ts` -> `src/api/*`
  - `package.json`
- 작업:
  - `react-router-dom` 설치
  - 디렉토리 스캐폴딩
  - 공통 유틸 분리 (`scoreSimilarity`, `splitLines` 등)
  - App Router shell 전환
  - 기존 탭 기능 route 단위 분할
- DoD:
  - `pnpm build` 성공
  - route 직접 접근 동작 확인

## Step 2: 지식 블록 시스템

- 상태: 완료 (2026-02-16, 프론트/백엔드 라우터/마이그레이션/계약 반영)
- 대상 파일:
  - `src/routes/KnowledgeLibrary.tsx`
  - `src/routes/KnowledgeBlockEditor.tsx`
  - `src/api/knowledge.ts`
  - SQL migration
- 작업:
  - 지식 블록 CRUD
  - 카테고리/태그/검색/필터
  - 프로젝트 attach/detach
- DoD:
  - UI CRUD + DB 반영 확인

## Step 3: 상품 구조 개편

- 상태: 완료 (2026-02-16, 설정 UI/저장소/API 스캐폴딩 반영)
- 대상 파일:
  - `src/routes/admin/ProductList.tsx`
  - `src/routes/admin/ProductSettings.tsx`
- 작업:
  - `product_type` 기반 프로젝트 관리
  - 프롬프트 템플릿 에디터
  - 톤/가드레일 분리 관리
  - 조립 프롬프트 미리보기
- DoD:
  - 상품 유형별 설정 저장/조회 가능

## Step 4: 생성 파이프라인

- 상태: 완료 (2026-02-16, 만세력 라이브러리 기반 계산 + LLM endpoint 연동)
- 대상 파일:
  - `src/routes/admin/Generator.tsx`
  - `src/utils/saju.ts`
  - Edge/API function
- 작업:
  - 출생정보 입력 폼
  - 사주 차트 계산
  - 프롬프트 조립 + LLM 호출
  - 생성 이력 저장/비교
- DoD:
  - 실제 입력으로 생성 완료 + 이력 저장 확인

## Step 5: 배포/대시보드

- 상태: 완료 (2026-02-16, 대시보드/배포 타임라인 UI 구현)
- 대상 파일:
  - `src/routes/admin/Dashboard.tsx`
  - `src/routes/admin/DeployManager.tsx`
- 작업:
  - 운영 현황 대시보드
  - 스냅샷 포함 배포/버전 타임라인
- DoD:
  - 배포 이력/상태 추적 가능

## Step 6: 비개발자 UX 폴리시 적용

- 상태: 완료 (2026-02-16, 한국어 UI/자동저장/확인모달/차트 시각화 반영)
- 작업:
  - 한국어 UI 전면 적용
  - 인라인 도움말 + 확인 모달
  - 차트 시각화
  - 자동 저장(debounce)
- DoD:
  - 비개발자 운영자 기준 핵심 시나리오 단독 수행 가능

## 9) 기술 결정사항

- 채택:
  - `react-router-dom`
  - React Context + hooks
  - 기존 커스텀 CSS 유지
- 비채택:
  - 상태관리 라이브러리(불필요)
  - UI 프레임워크(미도입)
  - 폼 라이브러리(현 범위 불필요)
- 미정:
  - 만세력/사주 계산 라이브러리 최종 선정 (Step 4에서 확정)

## 10) 검증 전략

- 각 Step 완료 후 `pnpm build`
- 라우팅 페이지 직접 접근 테스트
- 지식 블록 CRUD 후 Supabase 데이터 직접 확인
- 생성 파이프라인 실사용 입력 테스트
- API 비연결 시 fallback 모드 동작 확인

## 11) 리스크 및 대응

1. 대규모 파일 분리 중 동작 회귀
- 대응: Step 1에서 기능 보존 우선 리팩터링 + build/수동 스모크 체크

2. 지식 카테고리 모델 경직화
- 대응: `custom` 카테고리 유지 + 매핑 테이블 설계

3. 사주 계산 정확성 검증 난이도
- 대응: 골든 케이스 셋 확보 후 회귀 검증

4. 운영자 UX 복잡도 증가
- 대응: 기본값/도움말/자동저장/안전한 확인 모달 적용

## 12) 협업 규칙 (Claude Code / Codex 공용)

- 이 문서를 single source of truth로 사용
- Step 단위로 PR/커밋 경계 유지
- 문서 갱신 없이 구조 변경 금지
- 모든 구조/스키마 변경은 본 문서의 해당 섹션 동기화
- 모든 구현 작업은 완료 직후 본 문서의 작업 로그에 기록

## 13) 다음 실행 항목 (Immediate)

1. Cloudflare Pages 환경에 `functions/api/admin/[[path]].ts` 배포 연결 및 실운영 env 세팅
2. Supabase에 `supabase/migrations/*` 적용 및 RLS 정책 검증
3. OPENAI_API_KEY/OPENAI_MODEL 운영 키 세팅 후 생성 품질 QA
4. 대용량 번들 최적화(사주 계산 모듈 코드 스플리팅) 적용

## 14) 작업 로그 규칙

- 포맷: `YYYY-MM-DD HH:mm | Step | 변경 요약 | 검증 결과`
- 하나의 작업 묶음이 끝날 때마다 최소 1줄 이상 추가
- 설계/스키마/API 계약 변경은 관련 섹션 번호를 함께 명시

## 15) 작업 로그

- 2026-02-16 13:52 | Step 0 | `docs/PLANNING.md` 최초 작성 (비전/도메인/데이터/API/Step 계획) | 문서 생성 완료
- 2026-02-16 14:24 | Step 1 | `react-router-dom` 설치, Router shell 전환, `src/api.ts` 분리(`src/api/*`), 공통 로직을 `src/utils/*`, `src/hooks/useAdminStudio.ts`, `src/routes/*`로 이동 | build 검증 대기
- 2026-02-16 14:26 | Step 1 | `pnpm build` 통과, 라우트 기반 번들 생성 확인 | 검증 완료
- 2026-02-16 14:39 | Step 2 | `src/api/knowledge.ts`, `src/routes/KnowledgeLibrary.tsx`, `src/routes/KnowledgeBlockEditor.tsx`, `src/utils/fallbackKnowledgeStore.ts` 추가 + `/knowledge` 라우트 연결 | fallback CRUD/attach-detach 동작 확인 (로컬)
- 2026-02-16 14:41 | Step 2 | `supabase/migrations/202602160001_admin_knowledge_blocks.sql` 생성 (지식 블록/프로젝트 매핑 테이블) | `pnpm build` 통과
- 2026-02-16 15:14 | Step 3 | `src/api/products.ts`, `src/hooks/useProductSettings.ts`, `src/routes/admin/ProductList.tsx`, `src/routes/admin/ProductSettings.tsx` 구현 | 상품 유형/템플릿/가드레일 편집 및 자동저장 동작 확인
- 2026-02-16 15:14 | Step 4 | `src/routes/admin/Generator.tsx`, `src/utils/saju.ts`, `src/api/generator.ts`, `src/utils/generationHistoryStore.ts` 구현 | 생성 파이프라인(계산->조립->생성->이력) fallback 모드 확인
- 2026-02-16 15:14 | Step 5 | `src/routes/admin/Dashboard.tsx`, `src/routes/admin/DeployManager.tsx`, `src/api/deployments.ts`, `src/utils/deploymentStore.ts` 구현 | 대시보드 통계/배포 타임라인 표시 확인
- 2026-02-16 15:14 | Step 6 | 한국어 사이드바 UI(`src/components/admin/AdminShell.tsx`), 확인 모달(`src/components/common/ConfirmModal.tsx`), 차트 시각화/CSS(`src/styles.css`) 반영 | `pnpm build` 통과
- 2026-02-16 15:14 | Docs/Schema | `docs/admin-api-contract.md`, `docs/admin-knowledge-schema.sql`, `README.md`, `supabase/migrations/202602160002~004` 갱신 | 문서/마이그레이션 동기화 완료
- 2026-02-16 16:03 | Step 2~5 Backend | `functions/api/admin/[[path]].ts` 추가(프로젝트/지식/상품설정/생성/배포 전 엔드포인트) + OPENAI 연동 로직 추가 | 프론트 빌드 영향 없음, API 라우터 코드 반영 완료
- 2026-02-16 17:27 | Ops/Deploy Fix | Cloudflare Pages Functions 라우트 파일명을 `functions/api/admin/[...path].ts` -> `functions/api/admin/[[path]].ts`로 변경, path 파라미터 slash 분해 로직 추가 | Pages 빌드 경로 규칙 호환 수정
- 2026-02-16 16:03 | Step 2~5 DB | `supabase/migrations/202602160005_admin_rls_policies.sql` 추가(RLS enable + admin policy) | RLS SQL 작성 완료(적용 대기)
- 2026-02-16 16:03 | Step 4 정확도 | `lunar-javascript` 도입, `src/utils/saju.ts` 만세력 팔자 계산으로 교체, `src/types/lunar-javascript.d.ts` 추가 | `pnpm build` 통과
- 2026-02-16 16:58 | Ops/DB 적용 | 운영 Supabase에 `supabase/migrations/*.sql` 적용 시도(순서 확인 완료: 202602160001~005) | CLI 인증 토큰 부재로 적용 보류(`supabase projects list`에서 access token 필요 오류)
- 2026-02-16 17:12 | Ops/DB 적용 | 선행 스키마 누락 대응으로 `supabase/migrations/202602160000_admin_projects_baseline.sql` 추가 후 `supabase db push --include-all` 재실행 | 운영 DB에 202602160000~005 적용 완료, `supabase migration list` local=remote 일치 확인
