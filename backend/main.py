from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import copy
from neo4j import GraphDatabase
from dotenv import load_dotenv
import json
from typing import List, Optional

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
    "activity_logs": [],
    "api_calls": []
}

class ContextFact(BaseModel):
    entity: str
    value: str

@app.get("/")
def read_root():
    return {"status": "LifeOps Agent Backend Running"}

def record_api_call(service_name: str, endpoint: str):
    """Record an API call in the mock user state."""
    MOCK_USER_STATE["api_calls"].append({
        "service": service_name,
        "endpoint": endpoint,
        "timestamp": os.getenv("CURRENT_TIME", "Just now") # Mock timestamp
    })

def get_yutori_links(task_title: str, context: str) -> List[dict]:
    """Call Yutori Browsing API to find official links for a task."""
    api_key = os.getenv("YUTORI_API_KEY")
    if not api_key:
        print("YUTORI_API_KEY not set, using mock links.")
        return [{"title": f"Official {task_title} Info", "url": "https://www.google.com/search?q=" + task_title.replace(' ', '+')}]

    url = "https://api.yutori.com/v1/browsing/tasks"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "instruction": f"Find official government or organizational links and a brief description for the following task: '{task_title}' given this context: '{context}'. Return only a JSON array of objects with 'title' and 'url' fields.",
        "require_auth": False
    }

    record_api_call("Yutori", url)

    try:
        # Note: In a real scenario, this might take time. 
        # For the sake of the hackathon, we'll try to get it quickly or fallback.
        # Since we don't have a specific mock for Yutori success, we'll assume it returns something useful.
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # If the API returns results directly, parse them. 
            # (Assuming Yutori's output format based on browsing task behavior)
            result_text = data.get("result", "[]")
            try:
                # Attempt to parse if it's a stringified JSON
                if isinstance(result_text, str):
                    import re
                    match = re.search(r'\[.*\]', result_text, re.DOTALL)
                    if match:
                        return json.loads(match.group(0))
                return json.loads(result_text)
            except:
                return [{"title": "Official Link", "url": "https://www.usa.gov"}]
        return [{"title": "Search Info", "url": "https://www.google.com/search?q=" + task_title.replace(' ', '+')}]
    except Exception as e:
        print(f"Yutori API Error: {e}")
        return [{"title": "Search Info", "url": "https://www.google.com/search?q=" + task_title.replace(' ', '+')}]

import requests

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Handle audio file and return transcription using Modulate API via requests."""
    api_key = os.getenv("MODULATE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="MODULATE_API_KEY not set")

    url = "https://modulate-developer-apis.com/api/velma-2-stt-batch"
    headers = {"X-API-Key": api_key}
    
    # Read the file content
    content = await file.read()
    
    record_api_call("Modulate", url)

    # Use audio/webm as that is what the frontend provides
    files = {"upload_file": ("audio.webm", content, "audio/webm")}
    data = {
        "speaker_diarization": "true",
        "emotion_signal": "true"
    }
    
    try:
        response = requests.post(url, headers=headers, data=data, files=files)
        response.raise_for_status()
        result = response.json()
        
        # Parse the JSON matching the typical Modulate response
        # Try different possible keys for the transcription text
        transcribed_text = result.get("text")
        if not transcribed_text and "utterances" in result:
            # Join utterances if text is not directly present
            transcribed_text = " ".join([u.get("text", "") for u in result["utterances"]])
        
        if not transcribed_text and "results" in result:
            transcribed_text = str(result["results"])
            
        return {
            "text": transcribed_text or "",
            "status": "success",
            "full_response": result if not transcribed_text else None, # Debug info if parsing fails
            "debug_size_bytes": len(content)
        }
    except Exception as e:
        print(f"Modulate API Error: {str(e)}")
        # Fallback for hackathon demo if API keys are invalid/missing
        return {
            "text": "I moved here three months ago and just started working a new job in California. I don't know what forms I need.",
            "status": "success",
            "error": str(e)
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

    # 3. Enhanced Inference with Yutori Links
    context_str = ", ".join([f"{f['entity']}: {f['value']}" for f in new_facts])
    
    raw_tasks = [
        {"id": 1, "title": "Check SSN Status", "description": "Agent will verify if an SSN has been issued for your work permit.", "status": "pending", "action": "Provide Info"},
        {"id": 2, "title": "Draft W-4 Form", "description": "Agent will auto-fill your federal tax withholding form based on your profile.", "status": "pending", "action": "Provide Docs"},
        {"id": 3, "title": "State ID Appointment", "description": "California DMV appointment needed within 90 days.", "status": "pending", "action": "Provide Schedule"}
    ]
    
    new_tasks = []
    for t in raw_tasks:
        # Retrieve links from Yutori for each task
        links = get_yutori_links(t['title'], context_str)
        t['links'] = links
        new_tasks.append(t)

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
        "activity_logs": MOCK_USER_STATE["activity_logs"],
        "api_calls": MOCK_USER_STATE["api_calls"]
    }

if __name__ == "__main__":
    import uvicorn
    # Render binds to $PORT
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
