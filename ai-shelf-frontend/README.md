# AI Shelf Frontend (Next.js)

This folder contains the **Next.js + TypeScript + Tailwind** frontend for **AI Shelf: Agentic Observability Platform**.

## Run

Install deps (npm/pnpm/yarn) then:

- `npm run dev`

## Backend integration

Set:

- `NEXT_PUBLIC_LOGS_BASE_URL` (example: `http://localhost:8000`)

The polling hook calls:

- `GET /logs?trace_id=...` every 2 seconds

## Mock mode

The dashboard is wired to mock data by default in `src/app/page.tsx`.

