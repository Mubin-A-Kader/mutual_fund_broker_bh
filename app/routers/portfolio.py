from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import PortfolioCreateAPI,PortfolioCreate
from app.crud import get_portfolios, create_portfolio_item
from app.utils import verify_token, fetch_mutual_fund_data

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("/")
def read_portfolio(token: str = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = token.get("id")
    portfolios = get_portfolios(db, user_id)
    for portfolio in portfolios:
        portfolio.current_value = portfolio.units * portfolio.current_price
    return portfolios

@router.post("/")
def add_to_portfolio(portfolio: PortfolioCreateAPI, token: str = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = token.get("id")
    fund_data = fetch_mutual_fund_data(json=False)
    fund_info = next((fund for fund in fund_data if fund["Scheme_Name"] == portfolio.fund_name), None)
    
    if not fund_info:
        raise HTTPException(status_code=404, detail="Fund not found")
    portfolio_obj = PortfolioCreate(fund_name=portfolio.fund_name,\
                    units=portfolio.units, purchase_price=float(fund_info.get("Minimum_Purchase_Amount", 0)),\
                    current_price=float(fund_info.get("NAV", 0)))
    
    return create_portfolio_item(db, portfolio_obj, user_id)