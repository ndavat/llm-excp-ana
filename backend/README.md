# LLM Exception Analyzer - Backend

Tech stack: Express.js + tRPC, Drizzle ORM (MySQL), Vitest, TypeScript.

## Setup
1. Copy `.env.example` to `.env` and set values:
```
DATABASE_URL=mysql://user:pass@localhost:3306/exception_analyzer
OPENROUTER_API_KEY=sk-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
PORT=3001
```

2. Install deps and generate DB
```
npm i
npx drizzle-kit push
```

3. Run dev server
```
npm run dev
```

4. Run tests
```
npm test
```

## Authentication
Send `Authorization: Bearer mock-token` to access protected procedures (`exceptions.trigger`, `exceptions.analyzeLatest`).

## tRPC endpoints
- POST /trpc (HTTP batch link compatible)

## Notes
- `invokeLLM` & `notifyOwner` are implemented as placeholders and read env config. Replace with real implementations as needed.
