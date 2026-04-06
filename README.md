# KOMPBRAT

KOMPBRAT is a portfolio-ready MVP for people who want help choosing a PC build or evaluating a marketplace listing before buying.

The product is designed around a simple idea: be "your brother for computers" instead of a generic chatbot. It combines a guided AI PC builder, a deal checker for OLX / Allegro-style listings, and a curated set of handpicked builds in one focused Next.js application.

## What The Project Does

KOMPBRAT helps users:

- describe a budget and use case, then get a structured PC recommendation,
- paste a listing description or raw specs and receive a value verdict,
- browse handpicked build presets stored locally in TypeScript,
- compare external shopping links through a lightweight affiliate redirect layer,
- keep recent builder prompts and recent checks locally in the browser without authentication.

## MVP Features

- AI PC Builder at `/builder`
- Deal Checker at `/checker`
- Handpicked Builds at `/builds`
- Build detail pages at `/builds/[slug]`
- Optional search grounding via Brave or Tavily
- Affiliate redirect endpoint with lightweight click logging
- Local history via `localStorage`
- Polish UX states: loading, empty, error, not found, metadata, OG image

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Zod for request validation
- OpenAI Chat Completions API with structured JSON responses
- Optional Brave / Tavily search integration
- Vercel-ready deployment setup

## Project Structure

The codebase follows a feature-first structure:

- `app/` — routes, pages, route handlers, metadata
- `components/` — UI split by feature (`home`, `builder`, `checker`, `builds`, `layout`, `shared`, `ui`)
- `content/` — local marketing copy and handpicked build data
- `lib/` — business logic, AI prompts, checker heuristics, affiliate helpers, search abstraction, storage helpers
- `hooks/` — reusable client-side hooks, including `localStorage` wrappers
- `types/` — shared TypeScript contracts

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Create your local env file

```bash
cp .env.example .env.local
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## Environment Variables

The project uses the following environment variables:

```env
# OpenAI: used by /api/chat and /api/deal-checker
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Search grounding: optional provider for price/spec context
SEARCH_PROVIDER=brave
BRAVE_API_KEY=
TAVILY_API_KEY=

# Public app metadata
NEXT_PUBLIC_APP_NAME=KOMPBRAT
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variable Overview

- `OPENAI_API_KEY`: OpenAI API key used by the backend route handlers.
- `OPENAI_MODEL`: model name used for structured AI responses. Defaults to `gpt-4o-mini`.
- `SEARCH_PROVIDER`: active search provider, currently `brave` or `tavily`.
- `BRAVE_API_KEY`: optional Brave search key.
- `TAVILY_API_KEY`: optional Tavily search key.
- `NEXT_PUBLIC_APP_NAME`: public app name for metadata and client-facing usage.
- `NEXT_PUBLIC_APP_URL`: public base URL used for metadata, sitemap, and canonical links.

## How The AI Builder Works

The AI builder lives at `/builder` and talks to `POST /api/chat`.

### Flow

1. The user submits a free-form brief with budget, use case, and preferences.
2. The backend validates input with Zod.
3. The route sends a system prompt plus the user brief to OpenAI.
4. The model is asked to return structured JSON in a fixed response shape.
5. The server normalizes the response before returning it to the client.
6. If OpenAI is unavailable, the route falls back to a mock response so the UI still works.

### Builder Response Shape

The route returns:

```json
{
  "summary": "string",
  "buildName": "string",
  "forWho": "string",
  "parts": [
    { "type": "CPU", "name": "..." }
  ],
  "notes": ["string"],
  "warnings": ["string"]
}
```

### UX Notes

- The builder stores recent prompts in `localStorage`.
- Users can reuse previous prompts without creating an account.
- The UI is designed to be ready for a real streaming implementation later.

## How The Deal Checker Works

The deal checker lives at `/checker` and talks to `POST /api/deal-checker`.

### Flow

1. The user pastes a title, price, URL, or raw offer description.
2. The route validates the payload.
3. The checker parses likely hardware parts from text.
4. Heuristics assign a preliminary score and detect red flags.
5. Optional search grounding enriches the analysis with quick external context.
6. OpenAI receives the parsed context and is asked to produce a strict JSON verdict.
7. If OpenAI or search are unavailable, the endpoint still returns a heuristic fallback.

### Checker Response Shape

```json
{
  "verdict": "dobra okazja",
  "score": 78,
  "summary": "string",
  "detectedParts": [
    { "type": "CPU", "name": "..." }
  ],
  "redFlags": ["string"],
  "betterAlternative": "string"
}
```

### What The Checker Looks For

- missing PSU model
- very small SSD
- vague marketing language without hard specs
- old GPU at an inflated price
- suspicious wording such as "no returns" or "not tested"

The goal is not to verify whether the machine technically powers on. The goal is to judge whether the listing looks worth the money.

## How Search Grounding Works

Search grounding is optional and intentionally lightweight in the MVP.

### Current Design

- `lib/search/provider.ts` abstracts the active provider
- `lib/search/brave.ts` handles Brave search
- `lib/search/tavily.ts` handles Tavily search
- the checker can query search results to estimate price context

### Behavior

- if a search provider is configured, the checker may fetch contextual results,
- if no provider is configured, the app still works using local heuristics only,
- if search fails, the route catches the error and continues gracefully.

This keeps the MVP robust while allowing a better grounded analysis when external search is available.

## How Handpicked Builds Work

The handpicked build section is fully local and intentionally simple.

### Data Model

Builds are stored as TypeScript files in `content/builds/` and aggregated via `lib/builds/data.ts`.

Each build includes:

- slug
- title
- price
- category
- source type
- use case
- verdict copy
- full part list
- pros and cons
- affiliate links or source links

### Pages

- `/builds` shows the list with client-side category filters
- `/builds/[slug]` shows the detailed breakdown

This makes the section fast, easy to edit, and ideal for a first live version without a database.

## Affiliate Links

KOMPBRAT includes a simple affiliate-ready redirect flow.

### How It Works

- build cards and detail pages can render multiple external links,
- links are normalized through a small affiliate model,
- the redirect endpoint lives at `GET /api/affiliate/redirect`,
- clicks can be logged without a database using console-based tracking.

This keeps the architecture readable while leaving room for future analytics or persistent click tracking.

## Local Persistence

The MVP intentionally avoids authentication and server-side persistence.

Instead, it stores:

- recent builder prompts,
- recent deal checks,
- selected builder text input,

in the browser using reusable `localStorage` hooks.

This keeps onboarding friction low and is enough for an MVP demo or early user testing.

## Deploying To Vercel

### 1. Push the project to GitHub

Make sure the repository includes:

- the application code,
- `.env.example`,
- all App Router pages and route handlers.

### 2. Import the repository into Vercel

- create a new Vercel project,
- connect the GitHub repo,
- keep the default Next.js framework detection.

### 3. Configure environment variables in Vercel

Add the same variables as in `.env.example`:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `SEARCH_PROVIDER`
- `BRAVE_API_KEY`
- `TAVILY_API_KEY`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`

For production, set:

- `NEXT_PUBLIC_APP_URL=https://your-domain.com`

### 4. Deploy

Vercel will run the standard Next.js build pipeline.

Before shipping, it is a good idea to verify:

```bash
npm run typecheck
npm run lint
npm run build
```

## Notes

- The project is intentionally MVP-first: clear architecture, no database, fast iteration.
- The AI routes are structured for real OpenAI usage, but both builder and checker include fallback behavior for resilience.
- The UI and copy are tuned for a product demo, live MVP, and portfolio presentation.

## License

This repository currently has no explicit open-source license attached.
