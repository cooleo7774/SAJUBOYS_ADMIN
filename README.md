# SAJUBOYS_ADMIN

사주 지식창고 운영을 위한 독립 어드민 프로젝트 초기 스캐폴드입니다.

## MVP 목표

- `Knowledge Studio`에서 프로젝트 단위로 사전 맥락을 관리
- 원하는 출력 예시(좋은/나쁜 예시) 등록
- Playground에서 결과 미리보기 및 유사도 확인
- `draft -> published` 퍼블리시 플로우 시작점 제공

## 실행

```bash
cd SAJUBOYS_ADMIN
pnpm install
pnpm dev
```

기본 주소: `http://localhost:5173`

## API 연결

`apps/api`가 실행 중이어야 합니다.

1. 상단 `API Base URL`에 API 주소 입력 (예: `http://127.0.0.1:4000`)
2. 인증 방식 선택:
3. `Admin API Key` 사용: `apps/api`에 `ADMIN_API_KEY` 설정 후 동일 키 입력
4. 또는 `Bearer Token` 사용: `ADMIN_USER_IDS`에 포함된 사용자 토큰 입력
5. `Connect` 클릭

## 현재 포함 기능

- API 연결 모드(`API Base URL`, `Admin API Key`, `Bearer Token`)
- 프로젝트 목록 조회 / 생성
- Context 탭 편집 + 저장
- Example Outputs 조회 + 추가
- Playground 탭 (프롬프트 + 예시 기반 미리 생성)
- Publish 탭에서 `style_mode`, `knowledge_version`, `release_note` 지정 후 발행
- API 연결 실패 시 fallback 샘플 모드 자동 전환

## 다음 단계

- 예시 수정/삭제 UI 추가
- Eval 결과를 DB(`admin_knowledge_versions.metadata_json`)에 저장
- 프로젝트별 접근 권한(`owner/editor/viewer`) 모델 추가
