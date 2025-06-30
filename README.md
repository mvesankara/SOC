# SOCaaS

This project is a Security Operations Center as a Service (SOCaaS) dashboard and backend.

## Frontend

The frontend is a single-page application built with HTML, CSS, and vanilla JavaScript. It uses Chart.js for charts and Lucide for icons.

To run the frontend, simply open `index.html` in your web browser.

## Backend

The backend is built with Python and FastAPI.

### Running the Backend

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment (if you haven't already):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    # On Windows, use: venv\\Scripts\\activate
    ```

3.  **Install dependencies (if you haven't already):**
    ```bash
    pip install -r requirements.txt
    # Note: requirements.txt will be created in a future step.
    # For now, if it's the first time, you installed them manually in a previous step:
    # pip install fastapi uvicorn[standard]
    # With database dependencies:
    # pip install fastapi uvicorn[standard] psycopg2-binary sqlalchemy "databases[postgresql]" python-dotenv
    ```

4.  **Set up PostgreSQL:**
    The application requires a PostgreSQL database. You can install it directly or run it using Docker.

    *   **Using Docker (Recommended for ease of setup):**
        ```bash
        docker run --name socaas-postgres -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -e POSTGRES_DB=socaas_db -p 5432:5432 -d postgres:15
        ```
        This will start a PostgreSQL 15 container.
        - `POSTGRES_USER`: `user`
        - `POSTGRES_PASSWORD`: `password`
        - `POSTGRES_DB`: `socaas_db`
        These match the default `DATABASE_URL` in `backend/config.py`.

    *   **Manual Installation:**
        Follow the official PostgreSQL installation guide for your operating system. You will need to create a database (e.g., `socaas_db`), a user (e.g., `user`), and grant privileges.

5.  **Configure Database Connection (Optional - if not using defaults):**
    The database connection URL is configured in `backend/config.py` and defaults to `postgresql://user:password@localhost:5432/socaas_db`.
    You can override this by creating a `.env` file in the `backend/` directory with your custom URL:
    ```env
    # backend/.env
    DATABASE_URL=postgresql://youruser:yourpassword@yourhost:yourport/yourdb
    ```

6.  **Run the FastAPI server:**
    Ensure your PostgreSQL server is running and accessible.
    ```bash
    uvicorn main:app --reload
    ```
    The server will typically be available at `http://127.0.0.1:8000`.
    Upon startup, it will attempt to connect to the database and create the necessary tables if they don't exist.

7.  **Health Check:**
    You can check if the server is running and connected to the database by navigating to `http://127.0.0.1:8000/health` in your browser or using `curl`:
    ```bash
    curl http://127.0.0.1:8000/health
    ```
    You should see `{"status":"ok"}`.

(Further backend setup and details will be added as development progresses)
