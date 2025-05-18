from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import requests
from typing import List, Dict, Any

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

class CustomPagination:
    def __init__(self, items: List[Dict[str, Any]], page: int = 1, page_size: int = 5):
        self.items = items
        self.page = page
        self.page_size = page_size
        self.total_items = len(items)
        self.total_pages = (self.total_items + page_size - 1) // page_size

    def get_page_items(self) -> List[Dict[str, Any]]:
        start_idx = (self.page - 1) * self.page_size
        end_idx = start_idx + self.page_size
        return self.items[start_idx:end_idx]

    def get_pagination_info(self) -> Dict[str, Any]:
        return {
            "total_items": self.total_items,
            "total_pages": self.total_pages,
            "current_page": self.page,
            "page_size": self.page_size,
            "has_next": self.page < self.total_pages,
            "has_previous": self.page > 1
        }

def fetch_mutual_fund_data(rta_agent_code: str = "CAMS", page: int = 1,json=True):
    url = "https://latest-mutual-fund-nav.p.rapidapi.com/master"
    querystring = {"scheme_type":"Open","RTA_Agent_Code": rta_agent_code}
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    
    try:
        curren_dir = os.getcwd()
        with open(f'{curren_dir}/tests/dummy.json', 'r') as f:
            response = requests.Response()
            response._content = f.read().encode('utf-8')
            response.status_code = 200
        
        if response.status_code == 200:
            data = response.json()
            if not json:
                return data
            paginator = CustomPagination(items=data, page=page)
            return JSONResponse(
                content={
                    "data": paginator.get_page_items(),
                    "pagination": paginator.get_pagination_info()
                },
                status_code=status.HTTP_200_OK
            )
        else:
            return JSONResponse(
                content={"detail": f"API request failed with status code: {response.status_code}"},
                status_code=response.status_code
            )
    except requests.exceptions.RequestException as e:
        return JSONResponse(
            content={"detail": f"Failed to fetch mutual fund data: {str(e)}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )