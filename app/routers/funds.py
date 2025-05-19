from fastapi import APIRouter, Depends, HTTPException, Query
from app.utils import fetch_mutual_fund_data, verify_token
from typing import List
from app.schemas import FundSchema
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/funds", tags=["Funds"])

@router.get("/schemes/{fund_house}", response_model=List[FundSchema])
async def get_schemes(
    fund_house: str,
    page: int = Query(default=1, ge=1, description="Page number"),
    token: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    data = await fetch_mutual_fund_data(fund_house, page)
    return data