# StyleJenich Fashion — React + TypeScript

The StyleJenich website is a React/TypeScript application built with Vite.

## Hybrid AI architecture

- The Vercel-hosted React website sends chat messages to the FastAPI service.
- FastAPI validates messages, applies business rules, and retrieves possible gallery matches.
- Optional semantic retrieval can improve catalogue matching.
- Gemini generates customer-facing language using only the supplied business policy and limited gallery context.
- Product price, stock, sizes, fabric, colour, and delivery facts are not inferred from unverified gallery records.
- If Gemini is not configured or temporarily unavailable, the API returns a safe catalogue/business-contact fallback.

The legacy Vercel \`/api/chat\` function remains in the repository for now, but the updated chat widget uses \`/api/v1/ai/chat\` on FastAPI.

## Run locally on Windows

### 1. Create the environment file

From the repository root in PowerShell:

\`\`\`powershell
Copy-Item .env.example .env
\`\`\`

Open \`.env\` and add your Gemini API key to \`GEMINI_API_KEY\`. Keep \`VITE_API_BASE_URL=\` empty for local development. Never put the Gemini key in a variable beginning with \`VITE_\`.

### 2. Start the Python backend

Open a PowerShell terminal in the repository root:

\`\`\`powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend/requirements-dev.txt
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
\`\`\`

If PowerShell blocks virtual-environment activation, run this once in that terminal:

\`\`\`powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\\.venv\\Scripts\\Activate.ps1
\`\`\`

Check the API at http://127.0.0.1:8000/api/v1/health and the interactive docs at http://127.0.0.1:8000/docs.

### 3. Start the website

Open a second PowerShell terminal in the repository root:

\`\`\`powershell
npm install
npm run dev
\`\`\`

Open the local Vite URL, usually http://localhost:5173. Vite proxies \`/api\` requests to the local FastAPI service.

### 4. Run tests and build

\`\`\`powershell
python -m pytest backend/tests -q
npm run build
\`\`\`

## API endpoints

- \`GET /api/v1/health\`
- \`GET /api/v1/products\`
- \`GET /api/v1/products?q=wedding\`
- \`POST /api/v1/ai/chat\`

Example request:

\`\`\`json
{
  "messages": [
    {"role": "user", "content": "I need an outfit for a wedding"}
  ]
}
\`\`\`

## Deployment environment

Deploy the FastAPI service separately from the Vercel website.

Backend environment variables:

- \`GEMINI_API_KEY\`: secret Gemini API key; backend only.
- \`GEMINI_MODEL\`: defaults to \`gemini-2.5-flash\`.
- \`DATABASE_URL\`: PostgreSQL connection string for persistent production data.
- \`FRONTEND_ORIGINS\`: comma-separated exact browser origins allowed by CORS. Include the production domain and the specific Vercel Preview domain used for testing.
- \`STYLEJENICH_SEMANTIC_SEARCH\`: leave \`0\` until the optional embedding package and model have been tested on the chosen host.

Vercel Preview/Production environment variable:

- \`VITE_API_BASE_URL\`: the public origin of the deployed FastAPI service, with no trailing slash.

Never store \`GEMINI_API_KEY\` in Vercel as a \`VITE_\` variable or in frontend source code. Vite variables are visible to browsers.

## Data quality

The seed catalogue is based on the existing gallery records. The current records have \`metadata_verified=false\`; their descriptions and attributes are not confirmed business facts. Prices and availability are unknown. Have the business owner verify each record before using it as a source of product facts.

## Next milestones

1. Add production rate limiting, request logging, and stricter abuse protection.
2. Verify catalogue and business-policy facts with the owner.
3. Add PostgreSQL migrations and persistent production storage.
4. Add evaluation cases for groundedness, safety, and response quality.
5. Add a replaceable model-provider interface for the fine-tuned Qwen + LoRA adapter.
6. Add controlled enquiry and order workflows with explicit customer confirmation.
