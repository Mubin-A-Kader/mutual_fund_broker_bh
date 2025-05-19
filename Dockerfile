FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y gcc python3-dev build-essential

WORKDIR /

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app /app
COPY ./data ./data
COPY ./alembic.ini .       
COPY ./alembic /alembic 
COPY ./tests /tests 
COPY .env .env   

# Run alembic upgrade head before starting the app
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
