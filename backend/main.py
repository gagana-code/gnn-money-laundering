from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from routers import transactions, upload, alerts, graph, dashboard, metrics
import uvicorn

app = FastAPI(title="AML Detection System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])

@app.get("/")
def root():
    return {"message": "AML Detection System API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
