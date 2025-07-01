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
    You should see `{"status":"ok", "database": "connected"}` (if the database is reachable).

### API Endpoints

All API endpoints are prefixed with `/api/v1`.

#### Incidents API (`/api/v1/incidents/`)

*   **`POST /incidents/`**: Create a new incident.
    *   **Request Body**: JSON object matching the `IncidentCreate` schema (see `backend/schemas.py`).
        ```json
        {
          "title": "Suspicious Login Attempt",
          "criticite": "Élevé",
          "statut": "Ouvert",
          "type": "Auth",
          "source": "VPN Gateway"
        }
        ```
        *(Note: `CriticiteLevel` and `StatutIncident` are enums: `Critique`, `Élevé`, `Moyen`, `Bas` for criticite; `Ouvert`, `En cours`, `Résolu`, `Fermé` for statut)*
    *   **Response Body**: JSON object of the created incident, matching `IncidentRead` schema. Status code 201.

*   **`GET /incidents/`**: List all incidents.
    *   **Query Parameters**:
        *   `skip` (int, optional, default 0): Number of records to skip.
        *   `limit` (int, optional, default 100): Maximum number of records to return (max 200).
    *   **Response Body**: JSON object containing `items` (list of incidents matching `IncidentRead` schema) and `total` (total number of incidents).
        ```json
        {
          "items": [
            {
              "title": "Suspicious Login Attempt",
              "criticite": "Élevé",
              "statut": "Ouvert",
              "type": "Auth",
              "source": "VPN Gateway",
              "id": 1,
              "timestamp": "2023-10-27T10:30:00Z"
            }
          ],
          "total": 1
        }
        ```

*   **`GET /incidents/{incident_id}`**: Get a specific incident by its ID.
    *   **Path Parameter**: `incident_id` (int).
    *   **Response Body**: JSON object of the incident, matching `IncidentRead` schema. Status 404 if not found.

*   **`PUT /incidents/{incident_id}`**: Update an existing incident.
    *   **Path Parameter**: `incident_id` (int).
    *   **Request Body**: JSON object with fields to update (see `IncidentUpdate` schema in `backend/schemas.py`). All fields are optional.
        ```json
        {
          "statut": "En cours",
          "title": "Investigation of Suspicious Login"
        }
        ```
    *   **Response Body**: JSON object of the updated incident, matching `IncidentRead` schema. Status 404 if not found.

*   **`DELETE /incidents/{incident_id}`**: Delete an incident.
    *   **Path Parameter**: `incident_id` (int).
    *   **Response**: Status code 204 (No Content) on successful deletion. Status 404 if not found.

(Further backend setup and details will be added as development progresses)
