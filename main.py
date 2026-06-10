from fastapi import FastAPI
import uvicorn

from app.api.v1.wallets import router as wallet_router
from app.api.v1.operations import router as operation_router

app = FastAPI()

app.include_router(wallet_router, prefix="/api/v1", tags=["wallet"])
app.include_router(operation_router, prefix="/api/v1", tags=["operation"])



if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000, log_level="info")