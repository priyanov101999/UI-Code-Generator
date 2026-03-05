from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

db = Chroma(
    persist_directory="chroma_db",
    embedding_function=embeddings,
)

llm = ChatOllama(
    model="mistral:7b-instruct",
    temperature=0.1,
)

class Query(BaseModel):
    query: str

@app.post("/ask")
async def ask(q: Query):
    docs = db.similarity_search(q.query, k=6)
    context = "\n\n".join([d.page_content for d in docs])
    prompt = (
    "You are a UI engineer who writes React 17 + Material-UI v4 components.\n"
    "You generate code STRICTLY COMPATIBLE with the following package versions:\n"
    "- React: 17.0.2\n"
    "- React DOM: 17.0.2\n"
    "- Material-UI Core: 4.12.4 (import from '@material-ui/core')\n"
    "- Material-UI Icons: 4.11.3 (import from '@material-ui/icons')\n\n"

    "================ HARD VERSION RULES ================\n"
    "- Use ONLY imports from '@material-ui/core' and '@material-ui/icons'.\n"
    "- NEVER use '@mui/material' or '@mui/icons-material'.\n"
    "- NEVER use '@mui/styles'.\n"
    "- If styling is needed, use one of:\n"
    "    • makeStyles from '@material-ui/core/styles'\n"
    "    • inline styles\n"
    "    • Material-UI v4 layout components\n"
    "- Functional components only.\n"
    "- Code must run in React 17.\n\n"

    "================ HARD OUTPUT RULES ================\n"
    "- Output ONLY UI code.\n"
    "- No markdown. No comments. No explanations.\n"
    "- No API calls. No axios. No fetch.\n"
    "- No backend/business logic.\n"
    "- No external libraries.\n"
    "- Return ONLY a single functional React component.\n"
    "- React state IS ALLOWED (useState only for UI behavior).\n"
    "- No useEffect unless strictly needed for UI rendering.\n"
    "- Event handlers allowed.\n"
    "- Avoid unused imports.\n\n"

    "================ MATERIAL-UI v4 RULES ================\n"
    "- TextField must use the 'label' prop. Do NOT wrap TextField inside FormControl.\n"
    "- For password toggles, use InputAdornment + IconButton.\n"
    "- ALL icons must be imported from '@material-ui/icons/<IconName>' as default imports.\n"
    "- Layout should use Container, Grid, Box from '@material-ui/core'.\n"
    "- No 'sx' prop (NOT available in v4).\n"
    "- No Tailwind CSS.\n\n"

    "================ IMPORT COMPLETENESS RULES ================\n"
    "- EVERY JSX element/component used MUST have a valid import.\n"
    "- All '@material-ui/core' components must be imported in ONE combined import line.\n"
    "- Every icon must be a DEFAULT import from '@material-ui/icons/<IconName>'.\n"
    "- REMOVE any import that is unused.\n"
    "- DO NOT produce JSX for a component if you do not include its import.\n\n"

    "Example patterns:\n"
    "Core: import { Container, Grid, TextField, InputAdornment, IconButton, Button } from '@material-ui/core';\n"
    "Icons: import LockOutlinedIcon from '@material-ui/icons/LockOutlined';\n\n"

    "================ TWO-PASS GENERATION ================\n"
    "Pass 1 (internal): Draft the component and imports.\n"
    "Pass 2 (internal): Re-check every JSX element against imports and remove anything not imported.\n"
    "Only then output final code.\n\n"

    "================ IMPORT AUDIT (MANDATORY) ================\n"
    "Before finalizing your answer, do this mental checklist:\n"
    "A) List every JSX tag/component you used.\n"
    "B) Ensure each is imported from '@material-ui/core' in ONE combined import line.\n"
    "C) List every icon you used and import each as a DEFAULT import from '@material-ui/icons/<IconName>'.\n"
    "D) If any item is missing, you MUST fix it before outputting.\n"
    "E) If uncertain about an import path, DO NOT use that component.\n"
    "The answer is invalid if any used component/icon lacks a correct import.\n\n"

    "================ OUTPUT FORMAT (STRICT) ================\n"
    "Return exactly:\n"
    "1) All imports at top.\n"
    "2) makeStyles definition (if used).\n"
    "3) Single functional component.\n"
    "4) export default <ComponentName>;\n\n"

    "================ PRIORITY ================\n"
    "1) HARD RULES override everything.\n"
    "2) Then USER REQUEST.\n"
    "3) Then CONTEXT.\n\n"
    "================ HOOK RULES (IFRAME SAFE) ================"
    "- NEVER use `useState` directly."
    "- NEVER write: import { useState } from 'react'."
    "- ALWAYS write hooks as: React.useState, React.useEffect, React.useMemo, React.useCallback."
    f"CONTEXT:\n{context}\n\n"
    f"USER REQUEST:\n{q.query}\n"
)

    answer = llm.invoke(prompt)
    return {"answer": answer.content}

@app.post("/ask-no-rag")
async def ask_no_rag(q: Query):
    prompt = (
        "You are a UI designer who writes React + Material UI components.\n\n"
        "STRICT RULES:\n"
        "- Output ONLY UI code.\n"
        "- NO business logic.\n"
        "- NO axios or fetch.\n"
        "- NO API calls.\n"
        "- NO state (no useState, no useEffect).\n"
        "- NO validation.\n"
        "- NO event handlers except empty placeholders like onClick={() => {}}.\n"
        "- NO comments.\n"
        "- NO markdown.\n"
        "- Only return a single functional React component.\n"
        "- Dont give any character which wont be in react code.\n"
        "- Remember no english sentence at all.\n"
        "- Code should be independent.\n\n"
        f"USER REQUEST:\n{q.query}"
    )

    answer = llm.invoke(prompt)
    return {"answer": answer.content}
