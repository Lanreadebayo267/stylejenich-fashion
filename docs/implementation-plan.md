# StyleJenich AI: implementation plan

## Goal

Extend the existing deployed React + TypeScript + Vite landing page without replacing it. Deliver a catalogue-backed fashion assistant and API first, then add evaluated RAG and a controlled business workflow. Keep model-training experiments reproducible and separate from production inference.

## Repository findings

- Existing UI: React 18 + TypeScript + Vite.
- Existing pages: home, gallery, about, contact.
- Existing content: src/data/content.ts and src/types.ts.
- Existing assistant: src/components/StyleJenichAI.tsx; it previously called /api/chat, but the repository has no backend implementation.
- Existing gallery images are referenced from /images/ paths.
- No NVIDIA GPU is available, so training experiments must be CPU-sized. Cloud GPU is optional, not a requirement for the first release.

## Architecture

- Frontend: keep the existing Vite application and visual design.
- Backend: Python FastAPI, Pydantic/SQLModel schemas, SQLite for local development, PostgreSQL for deployment if available.
- Product truth: relational catalogue is authoritative for IDs, price, size and availability.
- Retrieval: start with deterministic catalogue search; add embeddings and RAG only after metadata is owner-verified.
- LLM: use a server-side provider interface and environment secret when added; never put provider keys in VITE_ variables.
- Agent: one explicit workflow with read-only catalogue tools and an order-draft tool. Owner approval is required before any order or inventory mutation.
- Research: NumPy MLP, PyTorch image classifier, miniature Transformer, and fine-tuning comparison in separate ml/ experiments.

## First vertical slice

1. Keep the existing pages and StyleJenich AI chat widget.
2. Add FastAPI endpoints: GET /api/v1/health, GET /api/v1/products, POST /api/v1/ai/chat.
3. Seed a structured SQLite catalogue from existing gallery references.
4. Add a Vite /api proxy for local development and VITE_API_BASE_URL for a separately deployed API.
5. Use deterministic keyword retrieval first. The assistant must disclose that captions, price and availability are not verified.
6. Run backend smoke tests and verify the frontend can chat with the API.

## Two-to-four-week schedule

### Week 1 — Preserve and connect
- Create a feature branch and keep main untouched.
- Verify current npm build and image paths.
- Start FastAPI, create schema and seed data.
- Connect the existing chat component through the Vite proxy.
- Add health, catalogue and chat API tests.
- Acceptance: existing website still builds; API returns products; chat returns catalogue-grounded results.

### Week 2 — Catalogue and RAG
- Review each image/title/caption with the business owner.
- Add product editing protected by admin authentication.
- Add business policy documents only after the owner approves their content.
- Build retrieval evaluation cases.
- Add embeddings and a vector store only after verified text exists.
- Acceptance: retrieval returns known relevant products; unknown prices/availability are never invented.

### Week 3 — Agent and ML baseline
- Add a single agent workflow: search designs, ask missing requirements, prepare an order draft.
- Require owner approval for order confirmation or stock changes.
- Build a labelled image manifest and split by garment/product to avoid leakage.
- Train a CPU-friendly baseline and small PyTorch classifier.
- Implement an MLP and backpropagation in NumPy.
- Acceptance: workflow tests pass; ML experiments save config, seed, metrics and model artifacts.

### Week 4 — Transformer, evaluation and presentation
- Implement a small causal Transformer and train on a permitted small text corpus.
- Compare a pretrained model with a small LoRA/QLoRA experiment only if the model and hardware are feasible.
- Evaluate assistant correctness, retrieval Recall@k, classifier macro-F1, workflow success and latency.
- Add deployment configuration, technical report and demo script.
- CUDA and distributed training are stretch experiments on CPU-only hardware; use cloud compute only if access is available and the experiment is important to the course rubric.

## Data model

Product records should include id, name, description, category, fabric, colour, price, currency, availability_status, image_url, tags and metadata_verified. Unknown price and stock remain null/unknown. Do not infer these from photographs.

The current gallery captions may not match all images. Verify the actual image against its title and caption before enabling semantic recommendations. Seed records are marked metadata_verified=false for this reason.

## Evaluation plan

- API: schema validation, status codes, filtering and permissions.
- Catalogue retrieval: Recall@5 on a manually labelled query set.
- RAG: evidence support, answer correctness, source coverage, and abstention when data is absent.
- Image classifier: macro-F1, per-class precision/recall, confusion matrix, and a majority-class baseline.
- NumPy MLP: gradient checking and loss convergence.
- Transformer: train/validation loss and qualitative next-token samples; report small-data limitations.
- Agent: supported workflow completion, tool-call accuracy, and no unauthorised state changes.
- Report targets separately from measured results.

## CPU-only constraints

Keep the image classifier small and use low image resolutions and small batches. The from-scratch Transformer should be a learning experiment with a small vocabulary and short sequence length. Do not claim commercial-scale pretraining. CUDA benchmarking and distributed training cannot be demonstrated locally without suitable hardware; document this constraint or run a small cloud experiment if available.

## Definition of done

- Existing landing page remains functional.
- Backend and frontend run from documented steps.
- Product API and assistant have automated tests.
- Business metadata is owner-verified before being treated as truth.
- RAG and agent features are evaluated against test cases.
- ML experiments are reproducible and include limitations.
- No secrets or customer personal data are committed to Git.
