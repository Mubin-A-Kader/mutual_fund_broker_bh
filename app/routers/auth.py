from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserCreate, Token, UserOut
from app.crud import create_user, get_user_by_email
from app.utils import create_access_token
from fastapi.responses import JSONResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db, user)

@router.post("/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, user.email)
    if not db_user or db_user.hashed_password != user.password + "notreallyhashed":
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"status": "error", "detail": "Invalid credentials"}
        )
    
    access_token = create_access_token(data={"email": db_user.email, "id": db_user.id})
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "success",
            "data": {
                "access_token": access_token,
                "token_type": "bearer"
            }
        }
    )