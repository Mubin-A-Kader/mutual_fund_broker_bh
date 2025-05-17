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
    
    calculated_portfolio = []
    for portfolio in portfolios:
        portfolio_data = {
            "fund_name": portfolio.fund_name,
            "units": portfolio.units,
            "purchase_price": portfolio.purchase_price,
            "total_investment": portfolio.units * portfolio.purchase_price,
            "current_price": portfolio.current_price,
            "current_value": portfolio.units * portfolio.current_price,
            "profit_loss": (portfolio.units * portfolio.current_price) - (portfolio.units * portfolio.purchase_price),
            "profit_loss_percentage": ((portfolio.current_price - portfolio.purchase_price) / portfolio.purchase_price) * 100
        }
        calculated_portfolio.append(portfolio_data)
    
    return {
        "portfolios": calculated_portfolio,
        "total_investment": sum(p["total_investment"] for p in calculated_portfolio),
        "total_current_value": sum(p["current_value"] for p in calculated_portfolio),
        "total_profit_loss": sum(p["profit_loss"] for p in calculated_portfolio)
    }

@router.post("/")
def add_to_portfolio(portfolio: PortfolioCreateAPI, token: str = Depends(verify_token), db: Session = Depends(get_db)):
    user_id = token.get("id")
    fund_data = fetch_mutual_fund_data(json=False)
    fund_info = next((fund for fund in fund_data if fund["Scheme_Name"] == portfolio.fund_name), None)
    
    if not fund_info:
        raise HTTPException(status_code=404, detail="Fund not found")
    portfolio_obj = PortfolioCreate(fund_name=portfolio.fund_name,\
                    units=portfolio.units, purchase_price=float(fund_info.get("Minimum_Purchase_Amount", 0)),\
                    current_price=float(fund_info.get("Minimum_Purchase_Amount", 0)))
    
    return create_portfolio_item(db, portfolio_obj, user_id)