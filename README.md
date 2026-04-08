# AI Environmental Impact Tracker

A Chrome extension that tracks your ChatGPT usage and logs the environmental impact of each query. Every time you send a message on ChatGPT, the extension captures metadata about the request (timestamp, prompt length, estimated token count, model) and stores it in a Supabase database.

## How it works

The extension has four parts:

- **Content script (MAIN world)** — injected into ChatGPT tabs at page load. Intercepts `window.fetch` to detect when a query is submitted to the ChatGPT API.
- **Content script (isolated world)** — receives the intercepted data from the MAIN world via `postMessage` and forwards it to the background service worker via `chrome.runtime.sendMessage`.
- **Background service worker** — receives the message and writes a row to the `query_logs` table in Supabase, tagged with an anonymous device ID stored in `chrome.storage.local`.
- **Popup** — a React UI that reads your query history from Supabase and displays it when you click the extension icon.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the Supabase table

In your Supabase project's SQL editor, run:

```sql
create table query_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  device_id text not null,
  prompt_length integer,
  estimated_tokens integer,
  model text,
  conversation_id text,
  prompt_preview text,
  energy_wh numeric,
  water_ml numeric,
  carbon_grams numeric
);

-- Allow all reads and inserts (anonymous use)
alter table query_logs enable row level security;
create policy "allow all" on query_logs for all using (true) with check (true);
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project URL and anon key (found in your Supabase project under **Settings → API**):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Build the extension

```bash
npm run build
```

This outputs the compiled extension to the `dist/` folder.

### 5. Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project

The extension icon will appear in your Chrome toolbar.

## Development

To automatically rebuild on file changes:

```bash
npm run build -- --watch
```

After each rebuild, go to `chrome://extensions` and click the refresh icon on the extension card to reload it.

## Project structure

```
src/
├── background/     # Service worker — receives messages, writes to Supabase
├── content/        # Isolated-world content script — bridges MAIN world to background
├── content-injected/  # MAIN world script — intercepts window.fetch on ChatGPT
├── lib/
│   └── supabase.ts # Supabase client
├── popup/          # React popup UI (query history)
└── types.ts        # Shared TypeScript types
public/
└── manifest.json   # Chrome extension manifest (MV3)
```
