# Quickstart: Supabase Backend

**Phase**: Phase 1 — Design & Contracts
**Date**: 2026-05-09
**Feature**: [spec.md](./spec.md)

## Prerequisites

- Node.js 24+
- Supabase CLI (`npm install -g supabase`)
- Supabase account (free tier at https://supabase.com)
- Groq API key (or OpenAI key) for the Edge Function

## Setup

### 1. Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Copy the project URL and anon key from Project Settings → API
3. Save them for later

### 2. Configure Environment Variables

```bash
# Desktop app (.env)
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

```bash
# Edge Function (set via Supabase dashboard or CLI)
# Settings → Edge Functions → Environment variables
OPENAI_API_KEY=gsk_xxx  # or sk-xxx for OpenAI
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

### 3. Run Migrations

```bash
supabase migration up
```

This creates the `transcriptions` table with RLS policies.

### 4. Deploy Edge Function

```bash
supabase functions deploy refine
```

### 5. Run Desktop App

```bash
npm run dev
```

The app will show a login screen. Create an account or log in, then
record audio as before.

## Manual Test Checklist

### Test 1: Auth Flow

1. Launch the app — login screen appears
2. Create account with email/password
3. App navigates to main screen with email displayed
4. Quit and reopen — session persists (no login required)
5. Logout — login screen reappears

### Test 2: Refinement via Edge Function

1. Log in
2. Record audio and stop
3. Verify: `[recording] calling edge function...` in console
4. Verify: refined text appears in UI and clipboard
5. Verify: `[recording] edge function success` in console

### Test 3: History

1. Create 3 transcriptions
2. Open history — all 3 visible with timestamps
3. Click one — full text displayed
4. Copy text — goes to clipboard
5. Delete one — disappears from list

### Test 4: Offline Fallback

1. Disconnect network
2. Record audio — verify local refinement works (Groq direct)
3. Reconnect — verify offline queue syncs to Supabase

## Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| `401 Unauthorized` | Invalid/expired token | Re-login or check SUPABASE_ANON_KEY |
| Edge Function timeout (>5s) | LLM provider slow | Check OPENAI_API_KEY and model |
| `404` on Edge Function | Function not deployed | Run `supabase functions deploy` |
| CORS error | Missing CORS headers | Check `_shared/cors.ts` |
| Realtime not pushing | Replication not enabled | Enable in Supabase dashboard → Realtime |
