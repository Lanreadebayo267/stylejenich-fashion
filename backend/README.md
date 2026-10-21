# StyleJenich AI backend

This is the first backend vertical slice: a FastAPI service with a structured SQLite catalogue, a product search endpoint, and a catalogue-grounded chat endpoint. The chat currently uses deterministic keyword retrieval, not an LLM. This keeps responses grounded while the data is being verified.

## Requirements

- Python 3.10 or newer
- Node.js and npm for the existing Vite frontend

## Run locally

From the repository root:

    python -m venv .venv

Activate the virtual environment, then run:

    python -m pip install -r backend/requirements.txt
    python -m uvicorn app.main:app --app-dir backend --reload --port 8000

Open http://127.0.0.1:8000/docs for the interactive API documentation.

In a second terminal:

    npm install
    npm run dev

The Vite development server proxies /api requests to http://127.0.0.1:8000.

## Endpoints

- GET /api/v1/health
- GET /api/v1/products
- GET /api/v1/products?q=wedding
- POST /api/v1/ai/chat

Example chat request:

    {
      "messages": [
        {"role": "user", "content": "I need a dress for a wedding"}
      ]
    }

## Environment

- DATABASE_URL: optional SQLAlchemy URL. Defaults to a local SQLite file under backend/.
- FRONTEND_ORIGINS: comma-separated browser origins allowed by CORS.
- VITE_API_BASE_URL: optional API origin for a separately deployed backend. Leave empty for local Vite proxying.

For production, set VITE_API_BASE_URL to the deployed API origin and set FRONTEND_ORIGINS to the exact deployed frontend origin. Never put LLM keys or other secrets in VITE_ variables because frontend variables are exposed to browsers.

## Data quality note

The seed records are derived from the existing gallery's titles, descriptions, and image paths. Their metadata_verified flag is false and price/availability are unknown by design. Review each image, title, caption, category and any future price with the business owner before presenting it as verified product information.

## Next milestones

1. Verify the catalogue with the owner and add admin-only create/update endpoints.
2. Add tests, authentication and persistent production PostgreSQL storage.
3. Add embeddings and RAG over verified catalogue and policy documents.
4. Add an LLM provider behind a server-side interface and evaluate grounded answers.
5. Add a controlled enquiry-to-order workflow with owner approval.
6. Build the separate model-training and evaluation experiments under ml/.
