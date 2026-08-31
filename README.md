# LaunchRadar

> You vibe coded the app. Now vibe market it.

An AI growth agent for vibe-coded apps — give it a URL, get a Growth Score,
a Marketing Readiness Checklist, and a concrete this-week action plan.

See [CLAUDE.md](./CLAUDE.md) for architecture, conventions, and the phased
roadmap. See [docs/CONCEPT.md](./docs/CONCEPT.md) for the full original
product vision (all phases, not just what's built so far).

## Getting started

```bash
cp .env.example .env   # fill in DATABASE_URL, Clerk keys, ANTHROPIC_API_KEY
npm install
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx prisma studio` — browse the database
- `npx prisma generate` — regenerate the Prisma client after schema changes
