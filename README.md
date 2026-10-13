# Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Running the Application](#running-the-application)

## Prerequisites

Make sure you have the following installed:

- Node.js 20+ (recommended)
- pnpm
- Docker and Docker Compose

## Project Structure

```
web-engineering-2/
├── apps/
│   ├── backend/
│   │   └── nest/                    # NestJS backend application
│   │       ├── src/
│   │       │   ├── modules/         # Feature modules (articles, auth, comments, etc.)
│   │       │   ├── app.module.ts    # Root module
│   │       │   └── main.ts          # Application bootstrap
│   │       ├── package.json
│   │       └── tsconfig.json
│   └── frontend/
│       └── vue/                     # Vue 3 frontend application
│           ├── src/
│           │   ├── components/      # Reusable Vue components
│           │   ├── views/           # Page components
│           │   ├── services/        # API service clients
│           │   ├── composables/     # Vue composables (reusable logic)
│           │   ├── stores/          # Pinia store (state management)
│           │   ├── router/          # Vue Router configuration
│           │   └── styles/          # Global styles (Tailwind CSS)
│           ├── package.json
│           └── vite.config.ts       # Vite build configuration
├── libs/
│   ├── database/                    # Shared database layer
│   │   └── sqlite/
│   │       ├── prisma/              # Prisma schema and migrations
│   │       └── src/                 # Database service
│   └── model/                       # Shared TypeScript models and types
├── docs/                            # Documentation (OpenAPI spec)
├── docker-compose.yml               # Docker orchestration
├── package.json                     # Root workspace package
└── pnpm-workspace.yaml              # pnpm monorepo configuration
```

## Technologies

### Backend Stack

- **[NestJS](https://nestjs.com/)**
- **[Prisma](https://www.prisma.io/)**
- **[JWT (JSON Web Tokens)](https://jwt.io/)** with **[Passport.js](http://www.passportjs.org/)**
- **[SQLite](https://www.sqlite.org/) with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)**

### Frontend Stack

- **[Vue 3](https://vuejs.org/)**
- **[Vite](https://vitejs.dev/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Tailwind CSS](https://tailwindcss.com/) with [DaisyUI](https://daisyui.com/)**
- **[Pinia](https://pinia.vuejs.org/)**
- **[Vue Router](https://router.vuejs.org/)**

### Shared Tools

- **[pnpm](https://pnpm.io/)**
- **[Docker & Docker Compose](https://www.docker.com/)**
- **[ESLint](https://eslint.org/)**
- **[Prettier](https://prettier.io/)**

## Environment Setup

Before running the application, you need to create `.env` files with the required environment variables.

### Backend Environment Variables

Create `.env` file in `apps/backend/nest/`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Secret for authentication (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Configuration (must match DATABASE_URL in libs/database/sqlite/.env)
DATABASE_URL=file:../../../data/dev.db
```

**Variable Explanations:**

- `PORT` - The port on which the NestJS server runs (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `JWT_SECRET` - Secret key used to sign JWT tokens. **Must be changed in production to a secure random string**
- `DATABASE_URL` - Path to the SQLite database file (must match the path in `libs/database/sqlite/.env`)

### Database Environment Variables

Create `.env` file in `libs/database/sqlite/`:

```env
# Database Configuration (must match DATABASE_URL in apps/backend/nest/.env)
DATABASE_URL=file:../../../data/dev.db
```

**Variable Explanations:**

- `DATABASE_URL` - Path to the SQLite database file (must match the path in `apps/backend/nest/.env`)

### Frontend Environment Variables

Create `.env.local` file in `apps/frontend/vue/`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
```

**Variable Explanations:**

- `VITE_API_URL` - The base URL of the backend API. This is used by all frontend services to communicate with the backend

### Database Configuration

The database configuration is handled through Prisma. The SQLite database file will be created automatically at the path specified in `DATABASE_URL`.

---

## Installation

### 1. Install dependencies

From the project root, run:

```bash
pnpm install
```

### 2. Set up environment variables

Create the required `.env` files as described in the [Environment Setup](#environment-setup) section.

### 3. Initialize the database

Navigate to the database directory and initialize Prisma:

```bash
cd libs/database/sqlite
npx prisma generate
npx prisma migrate dev
```

## Running the Application

### Option 1: Local Development (Recommended)

#### 1. Start the backend

```bash
pnpm start:nest
```

The backend will be available at:

- API: http://localhost:3000/api

#### 2. Start the frontend

In a second terminal, run:

```bash
pnpm start:vue
```

The frontend will be available at:

- http://localhost:5173

**Note:** Make sure both `.env` files (backend and frontend) are created before running the development servers.

### Option 2: Docker Compose

Run the entire application in Docker containers for a production-like environment.

From the project root, build and start both services:

```bash
docker compose up --build
```

The application will be available at:

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001/api

To stop the containers:

```bash
docker compose down
```

## Useful commands

- Build the backend:

  ```bash
  pnpm build:nest
  ```

- Build the frontend:

  ```bash
  pnpm build:vue
  ```

- Rebuild Docker images:
  ```bash
  docker compose build
  ```
