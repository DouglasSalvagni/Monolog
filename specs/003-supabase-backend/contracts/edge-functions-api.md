# Edge Functions API Contract

**Phase**: Phase 1 — Design & Contracts
**Date**: 2026-05-09
**Feature**: [spec.md](../spec.md)

## Base URL

```
https://<project>.supabase.co/functions/v1
```

Local development:
```
http://localhost:54321/functions/v1
```

## Authentication

All endpoints require a valid Supabase access token in the `Authorization`
header:

```
Authorization: Bearer <supabase-access-token>
```

The token is obtained from Supabase Auth after login (email/password or OAuth).

## Endpoints

### POST /refine

Refine raw transcript text via LLM and save to database.

**Request**:
```json
{
  "rawText": "string (required) — raw transcript from Deepgram",
  "durationSeconds": "number (optional) — audio duration"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "refinedText": "string — LLM-refined text",
    "createdAt": "ISO 8601 timestamp"
  }
}
```

**Response 400**:
```json
{
  "success": false,
  "error": "rawText is required"
}
```

**Response 401**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### GET /list

List user's transcriptions, newest first.

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 50 | Max items per page |
| `offset` | number | 0 | Pagination offset |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rawText": "string",
      "refinedText": "string",
      "durationSeconds": 0,
      "createdAt": "ISO 8601"
    }
  ],
  "total": 42
}
```

---

### DELETE /delete

Delete a transcription by ID.

**Request**:
```json
{
  "id": "uuid — transcription ID to delete"
}
```

**Response 200**:
```json
{
  "success": true
}
```

**Response 404**: If transcription does not exist or does not belong to user.

---

## Error Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

## IPC Channels (Desktop)

### Main → Renderer

| Channel | Payload | Description |
|---------|---------|-------------|
| `auth:state-changed` | `{ user: { id, email } \| null }` | Auth state change |
| `history:entries` | `{ entries: Transcription[], total: number }` | History list |

### Renderer → Main

| Channel | Payload | Description |
|---------|---------|-------------|
| `auth:login` | `{ email, password }` | Email/password login |
| `auth:signup` | `{ email, password }` | Create account |
| `auth:logout` | _(none)_ | Logout |
| `auth:restore-session` | _(none)_ | Try to restore from saved token |
| `history:list` | `{ limit?, offset? }` | Fetch history |
| `history:delete` | `{ id }` | Delete a transcription |

## TypeScript Types

```typescript
interface TranscriptionData {
  id: string
  rawText: string
  refinedText: string
  durationSeconds: number
  createdAt: string
}

interface AuthState {
  user: { id: string; email: string } | null
  loading: boolean
}

interface RefineRequest {
  rawText: string
  durationSeconds?: number
}

interface RefineResponse {
  success: boolean
  data?: { id: string; refinedText: string; createdAt: string }
  error?: string
}
```
