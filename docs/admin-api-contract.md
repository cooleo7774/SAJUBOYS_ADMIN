# Admin API Contract (MVP)

## 1) Projects

`GET /api/admin/knowledge/projects`

```json
{
  "items": [
    {
      "id": "match-soft-v1",
      "name": "Match Reading - Soft Expert",
      "status": "draft",
      "updated_at": "2026-02-15T01:10:00Z"
    }
  ]
}
```

`POST /api/admin/knowledge/projects`

```json
{
  "name": "Daily Fortune - Action Brief",
  "goal": "하루 운세를 실행 가능한 브리핑으로 제공"
}
```

## 2) Context

`PUT /api/admin/knowledge/projects/:projectId/context`

참고: 상세 조회는 `GET /api/admin/knowledge/projects/:projectId`에서 context를 포함해 반환

```json
{
  "goal": "관계 흐름 해석",
  "tone": "정확하지만 단정하지 않음",
  "context": "운명 단정 금지, 불확실성 명시",
  "guardrails_must": ["실행 포인트 포함"],
  "guardrails_avoid": ["100% 단정 표현"]
}
```

## 3) Examples

`POST /api/admin/knowledge/projects/:projectId/examples`

```json
{
  "label": "좋은 예시 A",
  "kind": "good",
  "user_prompt": "내가 먼저 연락해도 될까?",
  "expected_output": "..."
}
```

`DELETE /api/admin/knowledge/projects/:projectId/examples/:exampleId`

## 4) Eval

`POST /api/admin/knowledge/projects/:projectId/evals/run`

```json
{
  "prompt": "이번 주에 고백해도 될까?",
  "example_id": "ex-1"
}
```

## 5) Publish

`POST /api/admin/knowledge/projects/:projectId/publish`

```json
{
  "release_note": "tone guardrail 강화",
  "knowledge_version": "kw_2026_02_15_001"
}
```
