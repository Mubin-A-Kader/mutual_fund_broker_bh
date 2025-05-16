from sqlalchemy.orm import Session
from app.models import User, Portfolio
from app.schemas import UserCreate, PortfolioCreate

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = User(email=user.email, hashed_password=fake_hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_portfolio_item(db: Session, portfolio: PortfolioCreate, user_id: int):
    db_portfolio = Portfolio(**portfolio.model_dump(), user_id=user_id)

    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio

def get_portfolios(db: Session, user_id: int):
    return db.query(Portfolio).filter(Portfolio.user_id == user_id).all()