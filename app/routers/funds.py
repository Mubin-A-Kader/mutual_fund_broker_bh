from fastapi import APIRouter, Depends, HTTPException, Query
from app.utils import fetch_mutual_fund_data
from typing import List
from app.schemas import FundSchema

router = APIRouter(prefix="/funds", tags=["Funds"])

@router.get("/schemes/{fund_house}", response_model=List[FundSchema])
def get_schemes(
    fund_house: str,
    page: int = Query(default=1, ge=1, description="Page number")
):
    data = fetch_mutual_fund_data(fund_house, page)
    return data