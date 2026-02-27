# LifeOps Agent: Your Personal Immigration Co-pilot

LifeOps Agent is a premium AI-powered navigator designed to help immigrants manage complex life transitions with ease and confidence. By combining natural voice interaction with autonomous reasoning, LifeOps turns your questions and concerns into a structured, actionable roadmap.

## 🚀 The Vision

Navigating immigration and settling in a new country is inherently stressful. LifeOps aims to remove the cognitive load by providing a "Personal Navigation Journey" that learns about your unique situation and proactively identifies your next steps.

## 🛠️ Technology Stack

- **Frontend**: Vue.js 3, Tailwind CSS, Cytoscape.js (for context visualization), Font Awesome.
- **Backend**: FastAPI (Python), Neo4j (Graph Database), Uvicorn.
- **AI Integration**: Modulate API (STT), Yutori API (Reasoning & Browsing).

## 🔌 API Architecture

The backend integrates several high-performance APIs to deliver a seamless agentic experience:

### 1. Modulate API (Speech-to-Text)
- **Endpoint**: `https://modulate-developer-apis.com/api/velma-2-stt-batch`
- **Purpose**: High-fidelity transcription of user voice memos.
- **Usage**: Handles the `upload_file` from the frontend, extracting intent even from varied accents and emotional tones.

### 2. Yutori API (Agentic Reasoning & Browsing)
- **Endpoint**: `https://api.yutori.com/v1/browsing/tasks`
- **Purpose**: Grounds the AI's reasoning in real-world data.
- **Usage**: When the agent infers a task (e.g., "Apply for California State ID"), it calls Yutori to find official government links and the most up-to-date requirements.

### 3. Neo4j Graph Database
- **Purpose**: Long-term memory and context mapping.
- **Usage**: Stores "Context Facts" about the user's journey (Arrival Date, Employment Status, Location) as nodes and relationships, allowing the agent to reason across different life events.

## 📡 Backend Endpoints

- `GET /`: Root health check.
- `POST /transcribe`: Accepts an audio file (WebM/WAV) and returns transcribed text via Modulate.
- `POST /agent/process?text={userInput}`: The core reasoning loop. Extracts facts, updates the Neo4j graph, and infers tasks with Yutori-sourced links.
- `GET /agent/state`: Returns the current global state of the user’s journey, including the context graph and action items.

## 🏁 Getting Started

### Local Frontend
1. Open `frontend/index.html` in any modern browser.
2. The UI is built with Vue.js via CDN for simplicity and immediate feedback.

### Local Backend
1. Install dependencies: `pip install -r backend/requirements.txt`
2. Set Environment Variables:
   - `MODULATE_API_KEY`
   - `YUTORI_API_KEY`
   - `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
3. Run the server: `python backend/main.py`

---
*Created for the Autonomous Agents Feb 27 2026. Empowering global citizens with AI.*
