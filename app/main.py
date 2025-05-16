from fastapi import FastAPI, BackgroundTasks
from app.routers import auth, funds, portfolio
from app.database import engine, Base
from fastapi_utils.tasks import repeat_every
from app.tasks import update_portfolio_values
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)
app.include_router(funds.router)
app.include_router(portfolio.router)

@app.on_event("startup")
@repeat_every(seconds=3600)  # Run every hour
async def periodic_portfolio_update():
    await update_portfolio_values()

@app.get("/")
def read_root():
    return {"message": "Welcome to Mutual Fund Broker Backend"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],  # Add your frontend URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)