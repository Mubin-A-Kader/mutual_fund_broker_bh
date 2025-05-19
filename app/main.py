from fastapi import FastAPI
from app.routers import auth, funds, portfolio
from app.database import engine, Base
from fastapi_utils.tasks import repeat_every
from contextlib import asynccontextmanager

from app.tasks import update_portfolio_values
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Register periodic task
    await periodic_portfolio_update() 

    yield 

app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)
app.include_router(funds.router)
app.include_router(portfolio.router)

@repeat_every(seconds=3600)  # Run every hour
async def periodic_portfolio_update():
    print("Running periodic portfolio update...")
    await update_portfolio_values()

@app.get("/")
def read_root():
    return {"message": "Welcome to Mutual Fund Broker Backend"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://127.0.0.1:3000",\
                   "http://localhost:3000","http://127.0.0.1:8080",\
                    "http://localhost:8080","http://localhost:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)