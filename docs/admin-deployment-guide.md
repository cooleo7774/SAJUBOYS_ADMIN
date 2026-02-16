# admin.saju-boys.com 운영 배포 가이드

비개발자 기준으로 따라할 수 있게, 가장 단순한 운영 방식(운영자 전용 아이디/비밀번호 + HTTPS)을 기준으로 작성했습니다.

## 1. 목표

- 접속 주소: `https://admin.saju-boys.com`
- 접근 제한: 운영자만 아이디/비밀번호 입력 후 접속
- 운영 기능: Context/Examples/Playground/Publish를 통해 결과 문구 기획 및 반영

## 2. 전체 구조 (쉽게 보기)

- `admin.saju-boys.com`으로 접속
- Nginx가 먼저 아이디/비밀번호를 확인
- 통과하면 어드민 화면(React 정적 파일)을 보여줌
- 어드민 화면의 `/api` 요청은 내부 API 서버(`127.0.0.1:4000`)로 전달

## 3. DNS 설정

도메인 구매처(가비아, 후이즈, Cloudflare 등)에서 아래 레코드를 추가합니다.

- 타입: `A`
- 이름: `admin`
- 값: 어드민 서버 공인 IP
- TTL: 기본값

적용까지 보통 몇 분에서 최대 24시간 걸릴 수 있습니다.

## 4. 서버 초기 준비

아래 예시는 Ubuntu 기준입니다.

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx apache2-utils
```

## 5. 어드민 빌드 파일 배포

어드민 프로젝트 루트에서:

```bash
pnpm install
pnpm build
```

운영 경로로 복사:

```bash
sudo mkdir -p /var/www/sajuboys-admin/current
sudo rsync -av --delete dist/ /var/www/sajuboys-admin/current/dist/
```

## 6. 아이디/비밀번호(운영자 계정) 생성

최초 1명 생성:

```bash
sudo htpasswd -c /etc/nginx/.htpasswd-sajuboys-admin admin1
```

추가 운영자 생성:

```bash
sudo htpasswd /etc/nginx/.htpasswd-sajuboys-admin admin2
```

계정 삭제:

```bash
sudo htpasswd -D /etc/nginx/.htpasswd-sajuboys-admin admin2
```

## 7. Nginx 설정 적용

저장소의 예시 파일을 서버 Nginx 설정으로 복사합니다.

- 원본: `ops/nginx/admin.saju-boys.com.conf`
- 대상: `/etc/nginx/sites-available/admin.saju-boys.com.conf`

링크 생성:

```bash
sudo ln -s /etc/nginx/sites-available/admin.saju-boys.com.conf /etc/nginx/sites-enabled/admin.saju-boys.com.conf
```

문법 검사 + 재시작:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. HTTPS 인증서 발급

```bash
sudo certbot --nginx -d admin.saju-boys.com
```

정상 완료되면 `https://admin.saju-boys.com` 접속 시 자물쇠(HTTPS)가 표시됩니다.

## 9. API 연결 설정

어드민은 기본 API 주소를 환경변수로 주는 방식이 가장 편합니다.

1. 배포 서버에서 `.env.production` 파일 생성
2. 아래 값 입력

```bash
VITE_DEFAULT_API_BASE_URL=/api
```

3. 다시 `pnpm build` 후 배포

이렇게 하면 운영자가 화면에서 API 주소를 매번 입력하지 않아도 됩니다.

## 10. 운영자 사용 흐름

1. `https://admin.saju-boys.com` 접속
2. 브라우저 팝업에 아이디/비밀번호 입력
3. 어드민 접속 후 `Connect`
4. `Context`에서 문체/가드레일 설정
5. `Examples`에 좋은/나쁜 예시 등록
6. `Playground`로 결과 미리보기
7. 문제 없으면 `Publish`로 반영

## 11. 꼭 지킬 운영 수칙

- 운영자 계정은 개인별로 분리 (공용 계정 금지)
- 퇴사/권한 변경 시 즉시 계정 삭제
- 비밀번호는 정기 변경
- 운영 서버에서만 어드민 배포, 개발 URL 공개 금지
- API 키는 메신저에 평문 공유 금지

## 12. 문제 발생 시 빠른 점검

- 접속 자체 실패: DNS 레코드/IP 확인
- 아이디/비번 창이 안 뜸: Nginx `auth_basic` 설정 확인
- 화면은 열리는데 데이터가 안 보임: `/api` 프록시와 API 서버 상태 확인
- 인증서 경고: Certbot 인증서 경로 및 만료일 확인
