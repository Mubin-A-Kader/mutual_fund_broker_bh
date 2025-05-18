# Mutual Fund Broker

A project for managing mutual fund transactions and brokerage operations.

## Prerequisites

Before running this project, make sure you have the following installed:
- Docker
- Docker Compose

## Running with Docker

1. Build and start the containers:
```bash
docker-compose up --build
    - This will spin up backend, frontend containers and take care of database migrations inside backend container.
    - Note: we havent created seperate ontiner for database. all are running inside backend container. and on the destruction of backend container, database will be destroyed.
