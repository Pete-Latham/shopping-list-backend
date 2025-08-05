# Docker Setup for Shopping List Backend

This document explains how to run the Shopping List Backend using Docker.

## Prerequisites

- Docker and Docker Compose installed on your system
- Make sure ports 3000 and 5432 are available

## Quick Start

### Development Mode
```bash
# Start the application in development mode with hot reload
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### Production Mode
```bash
# Start the application in production mode
docker-compose -f docker-compose.yml up --build

# Or run in detached mode
docker-compose -f docker-compose.yml up -d --build
```

## Available Services

- **app**: NestJS backend application (port 3000)
- **postgres**: PostgreSQL database (port 5432)

## Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Application environment (development/production)
- `DB_HOST`: Database host
- `DB_PORT`: Database port
- `DB_USERNAME`: Database username
- `DB_PASSWORD`: Database password
- `DB_DATABASE`: Database name
- `PORT`: Application port

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop services and remove volumes
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# Execute commands in running container
docker-compose exec app npm run test
docker-compose exec postgres psql -U postgres -d shopping_list

# Health check
curl http://127.0.0.1:3000/health
```

## Database Access

Connect to PostgreSQL:
```bash
# Using docker-compose
docker-compose exec postgres psql -U postgres -d shopping_list

# Using external client
psql -h 127.0.0.1 -p 5432 -U postgres -d shopping_list
```

## Troubleshooting

1. **Port conflicts**: Make sure ports 3000 and 5432 are not in use
2. **Database connection issues**: Wait for PostgreSQL to be ready before starting the app
3. **Permission issues**: The app runs as non-root user (nestjs) for security

## File Structure

```
├── Dockerfile                 # Multi-stage build for the NestJS app
├── docker-compose.yml         # Production configuration
├── docker-compose.override.yml # Development overrides
├── .dockerignore             # Files to exclude from Docker context
└── healthcheck.js            # Health check script
```
