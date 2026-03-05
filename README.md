# UI Code Generator

## Overview

UI Code Generator is a tool that automatically creates **React components styled with Tailwind CSS** and displays a **live preview of the generated UI**.

Instead of manually writing repetitive UI code, this system learns from existing UI components and generates new ones automatically. It uses **AI with Retrieval-Augmented Generation (RAG)** to search through existing UI patterns and generate new React components that follow similar design structures.

This helps developers build user interfaces faster and reuse common design patterns.
<img width="1512" height="828" alt="Screenshot 2026-03-05 at 12 07 27 AM" src="https://github.com/user-attachments/assets/7fd88b7c-4720-4140-b687-f1ca6fe7336f" />
<img width="1512" height="982" alt="Screenshot 2026-03-05 at 12 10 54 AM" src="https://github.com/user-attachments/assets/063a461d-09fc-43c8-ba02-f227b45a749d" />
<img width="1512" height="982" alt="Screenshot 2026-03-05 at 12 11 32 AM" src="https://github.com/user-attachments/assets/f5447e97-2647-4fa5-a67d-3bc4676eaf65" />

---

## Features

* Generates **React UI components automatically**
* Uses **Tailwind CSS** for styling
* Displays **live UI preview**
* Learns from existing UI component code
* Uses **AI + vector search (RAG)** for improved results

---

## Tech Stack

### Backend

* Python
* FastAPI
* LangChain
* ChromaDB (Vector Database)
* HuggingFace Embeddings
* Ollama (Local LLM)

### Frontend

* React
* Tailwind CSS
* Node.js

---

## Project Structure

```
UI-Code-Generator
│
├── Backend
│   ├── app
│   │   ├── data              # UI component files used for learning
│   │   ├── chroma_db         # Vector database created after ingestion
│   │   ├── ingest.py         # Script that builds the vector database
│   │   ├── server.py         # Backend API server
│   │   └── requirements.txt
│   │
│   └── venv
│
├── front-end
│   ├── src
│   ├── public
│   └── package.json
│
└── README.md
```

---

## How It Works

1. UI component files are placed inside the **data folder**.
2. The **ingest script** processes these files and converts them into embeddings.
3. The embeddings are stored inside **ChromaDB**.
4. When the application runs, the backend retrieves relevant UI patterns.
5. An AI model generates **React + Tailwind UI components** based on these patterns.
6. The frontend renders the generated UI and shows a **live preview**.

---

## Backend Setup

### 1. Create Virtual Environment

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r app/requirements.txt
```

---

## Ingest UI Components

Place UI component files inside:

```
Backend/app/data
```

Supported file types:

```
.tsx
.ts
.jsx
.js
.css
```

Run the ingestion script:

```bash
cd Backend/app
python ingest.py
```

This creates the vector database in:

```
Backend/app/chroma_db
```

---

## Run Ollama

Start the Ollama server:

```bash
ollama serve
```

Download a model:

```bash
ollama pull llama3
```

---

## Start Backend Server

```bash
cd Backend/app
uvicorn server:app --reload
```

Backend runs at:

```
http://localhost:8000
```

API Documentation:

```
http://localhost:8000/docs
```

---

## Run Frontend

Open a new terminal and run:

```bash
cd front-end
npm install
npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

## Example Result

The system generates React components such as login forms, dashboards, cards, and layouts styled with Tailwind CSS.

Add your preview screenshot here:

```
assets/demo.png
```

Example in README:

```
![UI Preview](assets/demo.png)
```

---

## Use Case

This project helps developers:

* generate UI components quickly
* reuse design patterns
* speed up frontend development
* experiment with AI-assisted UI creation

---

## License

MIT License
