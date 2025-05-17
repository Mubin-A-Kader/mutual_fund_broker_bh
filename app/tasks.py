from fastapi import BackgroundTasks
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Portfolio
from app.utils import fetch_mutual_fund_data

async def update_portfolio_values():
    db = next(get_db())
    try:
        portfolios = db.query(Portfolio).all()
        fund_data = fetch_mutual_fund_data()
        
        for portfolio in portfolios:
            # Find matching fund in the API response
            fund_info = next((fund for fund in fund_data if fund["Scheme_Name"] == portfolio.fund_name), None)
            if fund_info:
                portfolio.current_price = float(fund_info.get("Minimum_Purchase_Amount", 0))
                portfolio.last_updated = datetime.now()
        
        db.commit()
    finally:
        db.close()