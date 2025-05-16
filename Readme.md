
alembic init alembic

alembic revision --autogenerate -m "change message"
alembic upgrade head

alembic downgrade -1
