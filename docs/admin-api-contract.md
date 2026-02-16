# Admin API Contract (Rework Draft)

Last updated: 2026-02-16

구현 위치:
- Cloudflare Pages Functions 라우터: `functions/api/admin/[...path].ts`
- LLM 연동 env: `OPENAI_API_KEY`, `OPENAI_MODEL`
- 저장소: `ADMIN_DATA_KV` 바인딩이 있으면 KV 영속 저장, 없으면 in-memory fallback

## 1) Products (Projects)

`GET /api/admin/knowledge/projects`

```json
{
  "items": [
    {
      "id": "uuid",
      "project_key": "match-soft-v1",
      "name": "궁합 해설 - 소프트",
      "status": "draft",
      "language": "ko",
      "product_type": "compatibility",
      "current_knowledge_version": "dep_20260216_1030",
      "updated_at": "2026-02-16T01:10:00Z",
      "example_count": 3
    }
  ]
}
```

`GET /api/admin/knowledge/projects/:projectId`

- 상세에는 `goal`, `tone`, `context_text`, `guardrails_*`, `examples` 포함

`POST /api/admin/knowledge/projects`

```json
{
  "project_key": "daily-fortune-v2",
  "name": "일일 운세 v2",
  "language": "ko",
  "goal": "",
  "tone": "",
  "context_text": "",
  "guardrails_must": [],
  "guardrails_avoid": []
}
```

`PUT /api/admin/knowledge/projects/:projectId/context`

```json
{
  "goal": "관계 흐름 해석",
  "tone": "정확하지만 단정하지 않음",
  "context_text": "운명 단정 금지, 불확실성 명시",
  "guardrails_must": ["실행 포인트 포함"],
  "guardrails_avoid": ["100% 단정 표현"]
}
```

## 2) Product Settings

`GET /api/admin/products/:projectId/settings`

```json
{
  "product_type": "compatibility",
  "prompt_template": "[역할] ... {{knowledge:compatibility_principle}} ...",
  "tone_profile": {
    "formality": "balanced",
    "directness": "soft"
  }
}
```

`PUT /api/admin/products/:projectId/settings`

```json
{
  "product_type": "daily_fortune",
  "prompt_template": "...",
  "tone_profile": {
    "formality": "formal",
    "directness": "balanced"
  }
}
```

## 3) Knowledge Blocks

`GET /api/admin/knowledge/blocks?category=...&status=...&q=...`

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "천간 기본 해석",
      "category": "cheon_gan",
      "content": "...",
      "tags": ["기본", "천간"],
      "status": "published",
      "priority": 200,
      "source": "internal-doc",
      "created_at": "2026-02-16T00:00:00Z",
      "updated_at": "2026-02-16T00:00:00Z"
    }
  ]
}
```

`GET /api/admin/knowledge/blocks/:blockId`

`POST /api/admin/knowledge/blocks`

```json
{
  "title": "오행 분포 해석",
  "category": "ohaeng",
  "content": "...",
  "tags": ["오행"],
  "status": "draft",
  "priority": 100,
  "source": "internal"
}
```

`PUT /api/admin/knowledge/blocks/:blockId`

`DELETE /api/admin/knowledge/blocks/:blockId`

### Project-Knowledge mapping

`GET /api/admin/knowledge/projects/:projectId/blocks`

```json
{
  "items": [
    {
      "project_id": "uuid",
      "knowledge_block_id": "uuid",
      "attached_at": "2026-02-16T10:30:00Z"
    }
  ]
}
```

`POST /api/admin/knowledge/projects/:projectId/blocks`

```json
{
  "knowledge_block_id": "uuid"
}
```

`DELETE /api/admin/knowledge/projects/:projectId/blocks/:knowledgeBlockId`

## 4) Generation Pipeline

`POST /api/admin/saju/calculate`

```json
{
  "birth_date": "1994-09-07",
  "birth_time": "13:40",
  "gender": "female"
}
```

응답 예시:

```json
{
  "year": { "stem": "갑", "branch": "자", "element": "wood" },
  "month": { "stem": "을", "branch": "축", "element": "wood" },
  "day": { "stem": "병", "branch": "인", "element": "fire" },
  "hour": { "stem": "정", "branch": "묘", "element": "fire" },
  "five_elements": { "wood": 2, "fire": 2, "earth": 1, "metal": 1, "water": 2 },
  "ten_gods": ["일간:병", "정관", "편재"]
}
```

`POST /api/admin/generate`

```json
{
  "project_id": "uuid",
  "product_type": "compatibility",
  "prompt": "연애 흐름이 궁금해요",
  "assembled_prompt": "...",
  "saju_chart": { "...": "..." }
}
```

`GET /api/admin/generations?project_id=:projectId`

`POST /api/admin/generations`

```json
{
  "project_id": "uuid",
  "product_type": "compatibility",
  "input_json": { "birth_date": "1994-09-07" },
  "prompt_text": "...",
  "output_text": "..."
}
```

## 5) Deployments

`GET /api/admin/deployments?project_id=:projectId`

`POST /api/admin/deployments`

```json
{
  "project_id": "uuid",
  "version": "dep_20260216_1040",
  "release_note": "지식 블록 업데이트",
  "snapshot_json": {
    "project": { "...": "..." },
    "product_settings": { "...": "..." },
    "knowledge_blocks": []
  }
}
```
