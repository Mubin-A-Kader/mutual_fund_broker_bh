import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_register_and_login():
    email = "mubin@codewave.com"
    password = "123456"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register
        resp = await ac.post("/auth/register", json={"email": email, "password": password})
        assert resp.status_code in (200, 400, 409, 422)

        # Login
        resp = await ac.post("/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200
        data = resp.json()
        print(data,"dasdfsd")
        assert "access_token" in data["data"]

@pytest.mark.asyncio
async def test_funds_endpoints():
    email = "mubin@codewave.com"
    password = "123456"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200
        token = resp.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = await ac.get("/funds/fund-families", headers=headers)
        assert resp.status_code == 200

        fund_house = "Test Fund House"
        resp = await ac.get(f"/funds/schemes/{fund_house}?page=1", headers=headers)
        assert resp.status_code in (200, 422)

@pytest.mark.asyncio
async def test_portfolio_endpoints():
    email = "mubin@codewave.com"
    password = "123456"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/auth/login", json={"email": email, "password": password})
        assert resp.status_code == 200
        token = resp.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = await ac.get("/portfolio/", headers=headers)
        assert resp.status_code == 200

        payload = {"fund_name": "Aditya Birla Sun Life Mutual Fund", "units": 10}
        resp = await ac.post("/portfolio/", json=payload, headers=headers)
        assert resp.status_code in (200, 422)

@pytest.mark.asyncio
async def test_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/")
        assert resp.status_code == 200