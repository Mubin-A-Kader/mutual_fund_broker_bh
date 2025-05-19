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


# Update the Redis connection to use the service name with fallback
async def get_redis_connection():
    try:
        # Try Docker Redis first
        redis = await aioredis.from_url("redis://redis:6379", encoding="utf-8", decode_responses=False)
        await redis.ping()
        return redis
    except Exception as e:
        print(f"Docker Redis connection failed: {e}")
        try:
            # Fallback to local Redis
            redis = await aioredis.from_url("redis://localhost:6379", encoding="utf-8", decode_responses=False)
            await redis.ping()
            print("Connected to local Redis")
            return redis
        except Exception as e:
            print(f"Local Redis connection failed: {e}")
            raise

# Initialize Redis connection
redis = None

async def get_redis():
    global redis
    if redis is None:
        redis = await get_redis_connection()
    return redis

# Replace the direct redis initialization with the async initialization
# The redis variable will be initialized when first needed in fetch_mutual_fund_data

async def fetch_mutual_fund_data(Mutual_Fund_Family: str = None, page: int = 1, is_json=True):
    try:
        redis_client = await get_redis()

        base_cache_key = f"mutual_fund_data:raw:{Mutual_Fund_Family if Mutual_Fund_Family else 'all'}"
        
        cached_raw_data = await redis_client.get(base_cache_key)
        
        if cached_raw_data:
            print("Getting data from Redis cache")
            data = pickle.loads(cached_raw_data)
            # Filter data only if Mutual_Fund_Family is specified
            if Mutual_Fund_Family:
                data = [item for item in data if item.get('Mutual_Fund_Family') == Mutual_Fund_Family]
        else:
            url = f'https://{RAPIDAPI_HOST}/latest'
            querystring = {"scheme_type": "Open"}
            if Mutual_Fund_Family:
                querystring["Mutual_Fund_Family"] = Mutual_Fund_Family
                
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
                                # Filter data only if Mutual_Fund_Family is specified
                                if Mutual_Fund_Family:
                                    data = [item for item in data if item.get('Mutual_Fund_Family') == Mutual_Fund_Family]
                        else:
                            print("API call successful")
                            data = await response.json()
                        
                        # Cache the raw data for 3 hours
                        await redis.setex(base_cache_key, 3600*3, pickle.dumps(data))
            except Exception as e:
                return JSONResponse(
                    content={"detail": f"Failed to fetch mutual fund data: {str(e)}"},
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # If raw data is requested, return it directly
        if not is_json:
            return data
        
        # For paginated JSON response, create a paginated cache key
        paginated_cache_key = f"mutual_fund_data:paginated:{Mutual_Fund_Family}:{page}"
        cached_paginated_data = await redis.get(paginated_cache_key)
        
        if cached_paginated_data:
            print("Getting paginated data from Redis cache")
            return pickle.loads(cached_paginated_data)
        
        # Create new paginated response
        paginated_response = JSONResponse(
            content={
                "data": CustomPagination(items=data, page=page).get_page_items(),
                "pagination": CustomPagination(items=data, page=page).get_pagination_info()
            },
            status_code=status.HTTP_200_OK
        )
        
        # Cache the paginated response
        await redis.setex(paginated_cache_key, 3600*3, pickle.dumps(paginated_response))
        return paginated_response
    except Exception as e:
        return JSONResponse(
            content={"detail": f"Failed to get Redis connection: {str(e)}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )