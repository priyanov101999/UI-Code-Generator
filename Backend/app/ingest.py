import os
from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

load_dotenv()

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_DIR = "chroma_db"
COLLECTION = "ui_components"
ALLOWED_EXTS = (".tsx", ".ts", ".jsx", ".js", ".css")

class SafeTextLoader(TextLoader):
    def lazy_load(self):
        try:
            yield from super().lazy_load()
        except (UnicodeDecodeError, RuntimeError) as e:
            print(f"Skipping binary file")

def load_documents():
    loader = DirectoryLoader(
        DATA_DIR,
        glob="**/*",
        loader_cls=SafeTextLoader,
        loader_kwargs={"encoding": "utf-8", "autodetect_encoding": True},
        show_progress=True
    )

    docs = loader.load()
    filtered = []

    for d in docs:
        path = d.metadata.get("source", "")
        if not path.lower().endswith(ALLOWED_EXTS):
            continue
        if os.path.basename(path).startswith("."):
            continue

        d.metadata["path"] = path
        d.metadata["file"] = os.path.basename(path)

        rel = os.path.relpath(path, DATA_DIR)
        parts = rel.split(os.sep)
        d.metadata["section"] = parts[0] if len(parts) > 1 else "root"

        filtered.append(d)

    if not filtered:
        raise ValueError(
            f"No code files found in {DATA_DIR} with allowed extensions {ALLOWED_EXTS}"
        )

    return filtered

def chunk_documents(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=[
            "\n\nexport ",
            "\n\nconst ",
            "\n\nfunction ",
            "\n", "\n\n", " ", ""
        ]
    )

    chunks = splitter.split_documents(docs)

    if not chunks:
        raise ValueError(
            "Chunking failed: no chunks created. Check your documents and separators."
        )

    print(f"Chunk count: {len(chunks)}")
    for i, c in enumerate(chunks[:5]):
        print(f"--- Chunk {i+1} ({len(c.page_content)} chars) ---")
        print(c.page_content[:200], "\n")

    return chunks

def build_vectorstore(chunks):
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=DB_DIR,
        collection_name=COLLECTION
    )
    db.persist()
    print(f"Vectorstore persisted at {DB_DIR}")
    return db

if __name__ == "__main__":
    print(" DATA_DIR:", os.path.abspath(DATA_DIR))

    docs = load_documents()
    for d in docs[:5]:
        print(f"- {d.metadata['file']} ({d.metadata['section']})")

    chunks = chunk_documents(docs)
    build_vectorstore(chunks)

    print(
        f" Ingested {len(docs)} files -> {len(chunks)} chunks into {DB_DIR}"
    )
