from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import copy
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="LifeOps Agent API")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))

# In-memory mock DB for MVP (Tasks only for now)
MOCK_USER_STATE = {
    "inferred_tasks": [],
    "activity_logs": []
}

class ContextFact(BaseModel):
    entity: str
    value: str

@app.get("/")
def read_root():
    return {"status": "LifeOps Agent Backend Running"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Mock endpoint to handle audio file and return transcription using Modulate API."""
    # In reality, this would call Modulate API for voice/accent transcription
    return {
        "text": "I moved here three months ago and just started working a new job in California. I don't know what forms I need.",
        "status": "success"
    }

@app.post("/agent/process")
async def process_user_input(text: str):
    """
    Mock endpoint simulating the agentic workflow:
    1. Extract context using Yutori LLM
    2. Update Graph DB (Neo4j mocked)
    3. Infer required tasks using Yutori LLM and web search
    """
    global MOCK_USER_STATE
    
    # 1. Mock Extraction (Simulating Yutori LLM)
    new_facts = [
        {"entity": "Arrival", "value": "3 months ago"},
        {"entity": "Employment", "value": "Recently Employed"},
        {"entity": "Location", "value": "California"}
    ]
    
    # 2. Update Graph DB (Neo4j real)
    with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as session:
        for fact in new_facts:
            # We use MERGE to create or find existing User node, then create a ContextFact node linked to it
            session.run(
                """
                MERGE (u:User {id: 'demo_user'})
                MERGE (f:ContextFact {entity: $entity})
                SET f.value = $value
                MERGE (u)-[:HAS_FACT]->(f)
                """,
                entity=fact['entity'],
                value=fact['value']
            )

    # 3. Mock Inference (Simulating Yutori LLM & Web Search)
    new_tasks = [
        {"id": 1, "title": "Check SSN Status", "description": "Agent will verify if an SSN has been issued for your work permit.", "status": "pending", "action": "Simulate Call"},
        {"id": 2, "title": "Draft W-4 Form", "description": "Agent will auto-fill your federal tax withholding form based on your profile.", "status": "pending", "action": "View Draft"},
        {"id": 3, "title": "State ID Appointment", "description": "California DMV appointment needed within 90 days.", "status": "pending", "action": "Schedule"}
    ]
    MOCK_USER_STATE["inferred_tasks"] = new_tasks
    
    return {
        "status": "Agent reasoning complete",
        "context_facts": new_facts,
        "tasks_inferred": len(new_tasks)
    }

@app.get("/agent/state")
def get_user_state():
    """Return the current context graph from Neo4j and inferred tasks for the UI to render."""
    context_facts = []
    
    with driver.session(database=os.getenv("NEO4J_DATABASE", "neo4j")) as session:
        result = session.run(
            """
            MATCH (u:User {id: 'demo_user'})-[:HAS_FACT]->(f:ContextFact)
            RETURN f.entity AS entity, f.value AS value
            """
        )
        for record in result:
            context_facts.append({"entity": record["entity"], "value": record["value"]})

    return {
        "context_facts": context_facts,
        "inferred_tasks": MOCK_USER_STATE["inferred_tasks"],
        "activity_logs": MOCK_USER_STATE["activity_logs"]
    }

if __name__ == "__main__":
    import uvicorn
    # Render binds to $PORT
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
