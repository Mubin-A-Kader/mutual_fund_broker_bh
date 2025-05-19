from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, Portfolio
from app.schemas import UserCreate, PortfolioCreate

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user: UserCreate):
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = User(email=user.email, hashed_password=fake_hashed_password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def create_portfolio_item(db: AsyncSession, portfolio: PortfolioCreate, user_id: int):
    db_portfolio = Portfolio(**portfolio.model_dump(), user_id=user_id)
    db.add(db_portfolio)
    await db.commit()
    await db.refresh(db_portfolio)
    return db_portfolio

async def get_portfolios(db: AsyncSession, user_id: int):
    result = await db.execute(select(Portfolio).filter(Portfolio.user_id == user_id))
    return result.scalars().all()