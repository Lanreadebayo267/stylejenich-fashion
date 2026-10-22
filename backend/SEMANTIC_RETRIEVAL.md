# Optional semantic retrieval

The backend still works with its deterministic keyword matcher by default. To enable local embedding-based semantic retrieval on CPU:

1. Install the optional dependency from the project root:

   `python -m pip install -r backend/requirements-semantic.txt`

2. In the PowerShell terminal that will run the backend, enable semantic search:

   `$env:STYLEJENICH_SEMANTIC_SEARCH="1"`

3. Start or restart the API:

   `python -m uvicorn app.main:app --app-dir backend --reload --port 8000`

4. Test a natural-language request in the website, for example: "I want something classy for a dinner event."

The first semantic request may download `sentence-transformers/all-MiniLM-L6-v2` (a compact embedding model) into the local model cache. That requires an internet connection once. Later runs can use the cached model. The model runs locally on CPU; no catalogue text is sent to a hosted embedding API.

To return to keyword matching, stop the backend and run:

`Remove-Item Env:STYLEJENICH_SEMANTIC_SEARCH`

Then restart the backend.

## Data and safety notes

- Only product names, categories, and catalogue tags are embedded.
- Unverified descriptions, fabric, and colour are excluded from the embedding text.
- If the optional package or model is unavailable, the backend logs a warning and falls back to keyword matching.
- Semantic similarity finds likely relevant catalogue entries; it does not verify prices, sizes, inventory, or delivery promises.
- This is retrieval, not a generative LLM or a complete RAG pipeline yet.
