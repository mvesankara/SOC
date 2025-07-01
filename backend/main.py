from fastapi import FastAPI
from contextlib import asynccontextmanager
from .database import connect_db, disconnect_db, engine, metadata, database
from .models import Base, Incident # Ensure Incident is imported
from sqlalchemy import select, func

# Create tables if they don't exist.
# This is typically done with migrations (e.g., Alembic) in a production app,
# but for local development and simplicity, we can do it on startup.
Base.metadata.create_all(bind=engine)

# Import the API router
from .api.endpoints import router as api_router


@asynccontextmanager
async def app_lifespan(current_app: FastAPI): # Renamed app parameter to current_app
    # Startup
    print("Attempting to connect to the database...")
    await connect_db()
    current_app.state.db_connected = True # Set state on the passed app instance
    print("Database connection established and app.state.db_connected=True.")
    yield
    # Shutdown
    print("Attempting to disconnect from the database...")
    await disconnect_db()
    current_app.state.db_connected = False # Set state on the passed app instance
    print("Database connection closed and app.state.db_connected=False.")

app = FastAPI(lifespan=app_lifespan) # Single app instance

@app.get("/")
async def read_root():
    return {"message": "SOCaaS Backend is running!"}

@app.get("/health")
async def health_check():
    db_status = "connected" if hasattr(app.state, "db_connected") and app.state.db_connected else "disconnected"
    # For a more robust check, you might attempt a lightweight query here if db_status is "connected"
    return {"status": "ok", "database": db_status }

# Include the API router
app.include_router(api_router, prefix="/api/v1") # Prefixing API routes with /api/v1

@app.get("/test-db")
async def test_db_connection():
    if not (hasattr(app.state, "db_connected") and app.state.db_connected):
        return {"message": "Database not connected. Cannot perform test."}
    try:
        # Create a query to count incidents
        # Incident.__table__ gives access to the SQLAlchemy Table object
        # associated with the Incident model.
        query = select(func.count()).select_from(Incident.__table__)

        # Execute the query
        # database.fetch_val will execute the query and return a single scalar value
        incident_count = await database.fetch_val(query)

        return {
            "message": "Database test successful",
            "incident_count": incident_count
        }
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in /test-db endpoint: {str(e)}")
        # Consider using proper logging in a real app
        return {
            "message": "Database test failed during query execution.",
            "error": str(e)
        }
