from pydantic import BaseModel

# User
class UserCreate(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

# Funds
class FundSchema(BaseModel):
    fund_house: str
    scheme_name: str
    Net_Asset_Value: float

# Portfolio
class PortfolioCreate(BaseModel):
    fund_name: str
    units: float
    purchase_price: float
    current_price: float

# Portfolio
class PortfolioCreateAPI(BaseModel):
    fund_name: str
    units: float
