from app.database import Base, engine
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.api.v1.wallets import router as wallet_router
from app.api.v1.operations import router as operation_router
from app.api.v1.users import router as users_router

app = FastAPI()

app.include_router(wallet_router, prefix="/api/v1", tags=["wallet"])
app.include_router(operation_router, prefix="/api/v1", tags=["operation"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])

app.mount("/static", StaticFiles(directory="app/static"), name="static")


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000, log_level="info")