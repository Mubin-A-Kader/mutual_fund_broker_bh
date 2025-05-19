from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import aiohttp
from typing import List, Dict, Any
import json
from redis import asyncio as aioredis
import pickle
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


redis = aioredis.from_url("redis://localhost", encoding="utf-8", decode_responses=False)

async def fetch_mutual_fund_data(rta_agent_code: str = "CAMS", page: int = 1, is_json=True):
    # Create a cache key based on the function parameters
    cache_key = f"mutual_fund_data:{rta_agent_code}:{page}:{is_json}"
    
    # Try to get data from cache first
    cached_data = await redis.get(cache_key)
    if cached_data:
        print(cached_data)
        return pickle.loads(cached_data)
    
    url = f'https://{RAPIDAPI_HOST}/latest'
    querystring = {"scheme_type":"Open","RTA_Agent_Code": rta_agent_code}
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=querystring) as response:
                if response.status != 200:
                    print("API quota exceeded, falling back to default data")
                    curren_dir = os.getcwd()
                    with open(f'{curren_dir}/tests/dummy.json', 'r') as f:
                        print("API response taking from cache or json file")
                        data = json.loads(f.read())
                else:
                    print("API call successful")
                    data = await response.json()
                
                result = data if not is_json else JSONResponse(
                    content={
                        "data": CustomPagination(items=data, page=page).get_page_items(),
                        "pagination": CustomPagination(items=data, page=page).get_pagination_info()
                    },
                    status_code=status.HTTP_200_OK
                )
                
                # Caching for 3 hour 
                await redis.setex(cache_key, 3600*3, pickle.dumps(result))
                return result
                
    except Exception as e:
        error_response = JSONResponse(
            content={"detail": f"Failed to fetch mutual fund data: {str(e)}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        return error_response