# Cloudflare Pages 배포 가이드 (admin.saju-boys.com)

이 문서는 Cloudflare + GitHub 연동 배포를 기준으로 작성했습니다.

## 1) 먼저 내가 코드로 이미 해둔 것

- `functions/_middleware.ts` 추가
- 운영 주소 전체에 Basic Auth(아이디/비밀번호) 적용
- Cloudflare 환경변수 `ADMIN_BASIC_AUTH_USER`, `ADMIN_BASIC_AUTH_PASS`가 없으면 503으로 차단

즉, 배포 후 환경변수만 설정하면 바로 운영자 전용 로그인창이 뜹니다.

## 2) Cloudflare Pages 프로젝트 생성 (사용자 작업)

1. Cloudflare Dashboard 접속
2. `Workers & Pages` -> `Create application` -> `Pages` -> `Connect to Git`
3. GitHub 저장소 선택: `SAJUBOYS_ADMIN`
4. 배포 브랜치 선택: 보통 `main`

빌드 설정:

- Framework preset: `Vite`
- Build command: `pnpm build`
- Build output directory: `dist`
- Root directory: 비워둠(저장소 루트)

## 3) Pages 환경변수 설정 (사용자 작업)

`Settings -> Environment variables`에서 아래 값을 추가합니다.

일반 변수:

- Key: `VITE_DEFAULT_API_BASE_URL`
- Value: `https://api.saju-boys.com` (또는 실제 API 주소)

비밀 변수(Secret) 2개:

- Key: `ADMIN_BASIC_AUTH_USER`
- Value: 운영자 로그인 아이디 (예: `adminops`)
- Key: `ADMIN_BASIC_AUTH_PASS`
- Value: 운영자 로그인 비밀번호 (긴 랜덤 문자열 권장)

설정 후 `Save` -> `Redeploy` 합니다.

## 4) 도메인 연결 (사용자 작업)

1. Pages 프로젝트 -> `Custom domains`
2. `Set up a custom domain` 클릭
3. `admin.saju-boys.com` 입력
4. 안내대로 DNS 레코드 생성/확인

Cloudflare에서 도메인을 관리 중이면 보통 자동으로 연결됩니다.

## 5) 확인 방법 (사용자 작업)

1. `https://admin.saju-boys.com` 접속
2. 브라우저 아이디/비밀번호 팝업이 뜨는지 확인
3. 로그인 후 Knowledge Studio 화면 확인
4. 우측 상단 `Connect`로 API 연결

## 6) API 쪽에서 꼭 해야 하는 것 (사용자 또는 API 담당자 작업)

어드민이 다른 도메인에서 API를 호출하면 CORS 설정이 필요합니다.

- 허용 Origin: `https://admin.saju-boys.com`
- 허용 Header: `content-type`, `x-admin-api-key`, `authorization`
- 허용 Method: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

## 7) 운영 팁

- 운영자 계정은 개인별로 나눠서 사용
- 비밀번호는 주기적으로 변경
- 담당자 변경 시 즉시 비밀번호 재발급
- 아주 중요: 같은 비밀번호를 다른 서비스와 재사용하지 않기

## 8) 문제 해결

- 로그인 팝업이 안 뜬다:
  `ADMIN_BASIC_AUTH_USER`, `ADMIN_BASIC_AUTH_PASS` 설정 누락 여부 확인
- 로그인해도 화면이 503:
  Secret 값 오타 또는 미설정 가능성 큼
- 화면은 보이는데 데이터가 안 뜬다:
  `VITE_DEFAULT_API_BASE_URL` 값과 API CORS 설정 확인
