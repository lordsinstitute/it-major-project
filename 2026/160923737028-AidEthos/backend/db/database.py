"""AidEthos — Database connection"""
import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aidethos.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

def create_tables():
    SQLModel.metadata.create_all(engine)
    # Safe additive migration for the existing mini-project SQLite database.
    if DATABASE_URL.startswith("sqlite"):
        from sqlalchemy import text, inspect
        additions = {
            "ngo": {"is_verified": "BOOLEAN NOT NULL DEFAULT 0", "average_rating": "FLOAT NOT NULL DEFAULT 0", "rating_count": "INTEGER NOT NULL DEFAULT 0", "completed_tasks": "INTEGER NOT NULL DEFAULT 0"},
            "volunteer": {"availability_status": "VARCHAR NOT NULL DEFAULT 'Available'", "availability_notes": "VARCHAR"},
            "crisis": {"task_start": "DATETIME", "task_end": "DATETIME", "location_url": "VARCHAR"},
        }
        with engine.begin() as conn:
            tables = set(inspect(engine).get_table_names())
            for table, cols in additions.items():
                if table not in tables:
                    continue
                existing = {col["name"] for col in inspect(engine).get_columns(table)}
                for name, definition in cols.items():
                    if name not in existing:
                        conn.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "{name}" {definition}'))

def get_session():
    with Session(engine) as session:
        yield session
