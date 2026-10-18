# Welcome to Antigravity!

Welcome to your new developer home! Your Firebase Studio project has been successfully migrated to Antigravity.

Antigravity is our next-generation, agent-first IDE designed for high-velocity, autonomous development. Because Antigravity runs locally on your machine, you now have access to powerful local workflows and fully integrated AI editing capabilities that go beyond a cloud-based web IDE.

## Getting Started
- **Run Locally**: Use the **Run and Debug** menu on the left sidebar to start your local development server.
  - Or in a terminal run `npm run dev` and visit `http://localhost:9002`.
- **Deploy**: You can deploy your changes to Firebase App Hosting by using the integrated terminal and standard Firebase CLI commands, just as you did in Firebase Studio.
- **Cleanup**: Cleanup unused artifacts with the @cleanup workflow.

Enjoy the next era of AI-driven development!

File any bugs at https://github.com/firebase/firebase-tools/issues

**Firebase Studio Export Date:** 2026-10-18


---

## Previous README.md contents:

# Resilia — Community Disaster Resilience Platform

> **"Maintaining vital community lifelines when networks fail."**

Resilia is a network-resilient, AI-powered community disaster coordination platform designed for Philippine communities affected by disasters and disruptions (floods, typhoons, earthquakes).

It equips residents, emergency responders, and disaster coordinators with critical operational intelligence, hazard reporting, assistance triage, shelter management, and mission orchestration—even when cellular data and internet connectivity are severely degraded or severed.

---

## Key Features

1. **Hybrid Network Resilience & Local Caching**:
   - PWA application shell cached with `vite-plugin-pwa` service worker.
   - Versioned local database using browser **IndexedDB** (`resilia_local_db`).
   - Durable pending event queue with UUID-based idempotency.
   - All writes (incident reports, assistance requests, shelter capacity updates, inventory movements) succeed offline.

2. **Seven Modular AI Agents**:
   - **Orchestrator**: Bounded prompt generation and evidence validation.
   - **Information Agent**: Dual-engine question answering (Google Gemini 3.8 Flash when online; grounded deterministic IndexedDB search when offline).
   - **Situation Agent**: Hazard clustering, flood depth tracking, and duplicate detection.
   - **Resource Agent**: Deterministic inventory math and supply burn-rate estimation.
   - **Needs & Coordination Agent**: Transparent rule-based vulnerability prioritization (elderly, infants, wheelchair mobility).
   - **Verification Agent**: Hazard corroboration, contradiction resolution, and coordinator rationale logging.
   - **Sync Agent**: Heartbeat monitoring, exponential backoff, acknowledgements, and conflict tracking.

3. **Philippine Community Demonstration Scenario**:
   - Setting: **Barangay Tumana & Barangay Malanday, Marikina City (Metro Manila)**.
   - Real geographic baseline: Marikina River basin, Tumana Bridge, J.P. Rizal Street, Malanday Elementary School.
   - Official alert thresholds: Level 1 (Prepare, 15m), Level 2 (Pre-emptive Evac, 16m), Level 3 (Forced Evac, 18m).

4. **Role-Based Experience**:
   - **Resident**: Report hazards, submit assistance requests, ask questions, view cached offline maps.
   - **Responder**: Inspect assigned missions, accept/decline, update field status (`ACCEPTED` → `IN_PROGRESS` → `COMPLETED`).
   - **Coordinator**: Command dashboard, verify incidents, approve AI mission proposals, manage shelter capacities and inventory movements.

5. **Anti-Hallucination & AI Honesty**:
   - AI recommendations strictly cite supporting evidence record IDs.
   - Consequential actions require explicit human approval (Principle 5).
   - When offline, generative AI is not faked; local retrieval is explicitly disclosed.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, VitePWA
- **Local Data**: IndexedDB, Durable Event Queue, Repository Pattern
- **Backend**: Node.js & Express, REST API (`/api/v1/*`), Google Gen AI SDK (`@google/genai`)
- **Model**: `gemini-3.8-flash`
- **Deployment**: Google Cloud Run ready, Dockerfile, Firestore security rules

---

## Local Development & Running

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express + Vite)
npm run dev

# Server will run on http://localhost:3000
```

### Running Unit Tests

```bash
npx tsx tests/core.test.ts
```

---

## Documentation & Competition Proposal

- [`docs/COMPETITION_PROPOSAL.md`](docs/COMPETITION_PROPOSAL.md) — Comprehensive Competition Proposal (Vision, Problem Statement, Community Impact, Feasibility, Scalability)
- [`docs/PITCH_DECK.md`](docs/PITCH_DECK.md) — 14-Slide Official AI Builder Cup Submission Deck Blueprint & Verbatim Speaker Script
- [`public/presentation.html`](public/presentation.html) — Interactive 16:9 Widescreen Pitch Deck (Accessible in-app or via `http://localhost:3000/presentation.html`)
- [`Resilia_Competition_Pitch_Deck.pptx`](Resilia_Competition_Pitch_Deck.pptx) — Native Microsoft PowerPoint Presentation (Generate via `npm run deck:pptx`)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System topology, 7 AI agents, and physical LAN edge deployment
- [`docs/OFFLINE_MODE.md`](docs/OFFLINE_MODE.md) — Local caching architecture, IndexedDB schema, and disconnection test guide
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — 3-minute hackathon presentation script
