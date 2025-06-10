# Trustana API Project

A full-stack e-commerce catalog management application built with React, TypeScript, Express, and PostgreSQL. This project demonstrates a product categorization system with dynamic attributes, allowing for hierarchical category management and product organization.

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, React Query
- **Backend**: Express, Node.js, TypeScript
- **Database**: PostgreSQL 15
- **Containerization**: Docker, Docker Compose
- **Development**: Nodemon, ESLint, Concurrently

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) and Docker Compose

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/trustana-api.git
   cd trustana-api
   ```

2. Install dependencies:
   ```bash
   npm install
   # or using pnpm
   pnpm install
   ```

## 🏃‍♂️ Running the Application

### Development Mode

You can start the application in development mode with a single command:

```bash
npm run dev
```

This command will:

1. Start the PostgreSQL database container
2. Initialize the database with the schema defined in `init.sql`
3. Start the Express server (backend) on port 3001
4. Start the Vite development server (frontend) on port 5173

### Alternative Start Options

Start with full Docker setup (database & seeding):

```bash
npm run dev:full
```

Start only the database:

```bash
npm run db:start
```

Start only the backend server:

```bash
npm run server:dev
```

Start only the frontend:

```bash
npm run client:dev
```

## 🔄 Database Management

Reset the database (removes all data and recreates the containers):

```bash
npm run db:reset
```

Stop the database:

```bash
npm run db:stop
```

Remove all containers and volumes:

```bash
npm run db:down
```

View database logs:

```bash
npm run db:logs
```

## 🔧 Configuration

The application uses environment variables for configuration. You can create a `.env` file in the root directory with the following variables:

```
PORT=3001
CLIENT_URL=http://localhost:5173
```

## 📦 Building for Production

Build the application for production:

```bash
npm run build
```

This will compile the TypeScript files and bundle the frontend application.

## 📝 API Endpoints

The API provides the following main endpoints:

- `/api/attributes` - Manage product attributes
- `/api/categories` - Manage product categories
- `/api/products` - Manage products

## 📚 Project Structure

```
trustana-api/
├── server/                # Backend code
│   └── src/
│       ├── controllers/   # Route controllers
│       ├── database/      # Database connection and utilities
│       ├── models/        # Data models
│       └── routes/        # API routes
├── src/                   # Frontend code
│   ├── components/        # React components
│   ├── lib/               # Utilities and API client
│   └── assets/            # Static assets
├── docker-compose.yml     # Docker configuration
├── init.sql               # Database initialization
└── package.json           # Project dependencies and scripts
```
