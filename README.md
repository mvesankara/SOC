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
    ```

4.  **Run the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```
    The server will typically be available at `http://127.0.0.1:8000`.

5.  **Health Check:**
    You can check if the server is running by navigating to `http://127.0.0.1:8000/health` in your browser or using `curl`:
    ```bash
    curl http://127.0.0.1:8000/health
    ```
    You should see `{"status":"ok"}`.

(Further backend setup and details will be added as development progresses)
