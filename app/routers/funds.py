from fastapi import APIRouter, Depends, HTTPException, Query
from app.utils import fetch_mutual_fund_data, get_current_user
from typing import List, Optional
from app.schemas import FundSchema
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/funds", tags=["Funds"])

@router.get("/schemes/{fund_house}", response_model=List[FundSchema])
async def get_schemes(
    fund_house: str,
    page: int = Query(default=1, ge=1, description="Page number"),
    search: Optional[str] = Query(default=None, description="Search scheme name"),  
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = await fetch_mutual_fund_data(fund_house, page,search=search)

    return data

@router.get("/fund-families")
async def get_fund_families(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # This will use the same caching mechanism as fetch_mutual_fund_data
    data = await fetch_mutual_fund_data(is_json=False)
    
    if isinstance(data, JSONResponse):
        return data
    
    # Extract unique fund families
    fund_families = list(set(fund["Mutual_Fund_Family"] for fund in data if "Mutual_Fund_Family" in fund))
    
    return {
        "fund_families": sorted(fund_families)  
    }
