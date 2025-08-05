<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

**Shopping List Backend** - A NestJS-based REST API for managing shopping lists and items, built with TypeORM and PostgreSQL. This application provides a robust backend service for creating, managing, and organizing shopping lists with full CRUD operations.

### Features
- 📝 **Shopping List Management**: Create, read, update, and delete shopping lists
- 📋 **Item Management**: Add, edit, and mark items as completed
- 🗄️ **PostgreSQL Database**: Reliable data persistence with TypeORM
- 🐳 **Docker Support**: Containerized application with development and production modes
- 🏥 **Health Checks**: Built-in health monitoring endpoints
- 🔧 **Environment Configuration**: Flexible configuration management

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## 🐳 Docker Architecture

This application is fully containerized using Docker with a multi-service architecture designed for both development and production environments.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
│                 (shopping-list-network)                     │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   NestJS Backend    │    │      PostgreSQL DB          │ │
│  │  (shopping-list-    │    │   (shopping-list-db)        │ │
│  │     backend)        │    │                             │ │
│  │                     │    │  Port: 5432                 │ │
│  │  Port: 3000         │◄───┤  Database: shopping_list    │ │
│  │  Health: /health    │    │  User: postgres             │ │
│  │  API: /shopping-    │    │  Persistent Volume          │ │
│  │       lists         │    │                             │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Container Services

#### 🚀 **Application Container** (`shopping-list-backend`)
- **Base Image**: `node:20-alpine` (multi-stage build)
- **Port**: 3000 (exposed to host)
- **Environment**: Development with hot-reload / Production optimized
- **Security**: Runs as non-root user (`nestjs:1001`)
- **Health Check**: HTTP endpoint at `/health`
- **Features**:
  - Multi-stage Dockerfile for optimized production builds
  - Development mode with live code reloading
  - Automatic TypeScript compilation
  - Security-hardened with non-root user execution

#### 🗄️ **Database Container** (`shopping-list-db`)
- **Base Image**: `postgres:15-alpine`
- **Port**: 5432 (exposed to host)
- **Database**: `shopping_list`
- **Persistence**: Named volume for data retention
- **Health Check**: PostgreSQL readiness probe
- **Features**:
  - Automatic database initialization
  - Persistent data storage across container restarts
  - Health monitoring for dependency management

### Docker Configuration Files

| File | Purpose |
|------|--------|
| `Dockerfile` | Multi-stage build configuration for the NestJS app |
| `docker-compose.yml` | Production services definition |
| `docker-compose.override.yml` | Development overrides (hot-reload, debugging) |
| `.dockerignore` | Excludes unnecessary files from build context |
| `healthcheck.js` | Health check script for container monitoring |

### Quick Start Commands

```bash
# Development mode (with hot reload)
docker-compose up --build

# Production mode
docker-compose -f docker-compose.yml up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Environment Variables

The application uses environment-based configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment |
| `PORT` | `3000` | Application port |
| `DB_HOST` | `127.0.0.1` | Database host (use `postgres` in Docker) |
| `DB_PORT` | `5432` | Database port |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `password` | Database password |
| `DB_DATABASE` | `shopping_list` | Database name |

### Development vs Production

**Development Mode Features:**
- Hot reload with volume mounting
- Source code debugging on port 9229
- Full TypeScript compilation in watch mode
- Development dependencies included

**Production Mode Features:**
- Optimized multi-stage build
- Minimal production image
- Security hardening
- Health checks and monitoring
- Only production dependencies

For detailed Docker usage instructions, see [DOCKER.md](./DOCKER.md).

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
