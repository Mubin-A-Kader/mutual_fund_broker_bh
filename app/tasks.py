from fastapi import BackgroundTasks
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Portfolio
from app.utils import fetch_mutual_fund_data

async def update_portfolio_values():
    async for db in get_db():
        try:
            result = await db.execute(select(Portfolio))
            portfolios = result.scalars().all()
            fund_data = await fetch_mutual_fund_data()
            
            for portfolio in portfolios:
                # Find matching fund in the API response
                fund_info = next((fund for fund in fund_data if fund["Scheme_Name"] == portfolio.fund_name), None)
                if fund_info:
                    portfolio.current_price = float(fund_info.get("NAV", 0))
                    portfolio.last_updated = datetime.now()
            
            await db.commit()
        finally:
            await db.close()