import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { initializeDatabase, seedDatabase } from "./database/postgres";
import attributesRouter from "./routes/attributes";
import categoriesRouter from "./routes/categories";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/attributes", attributesRouter);
app.use("/api/categories", categoriesRouter);

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "Trustana API",
    version: "1.0.0",
    status: "running",
    documentation: "/api",
    endpoints: {
      health: "/api/health",
      attributes: "/api/attributes",
      categories: "/api/categories/tree",
    },
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "Trustana API",
    version: "1.0.0",
    description: "API for managing product categories and attributes",
    endpoints: {
      health: {
        method: "GET",
        path: "/api/health",
        description: "Health check endpoint",
      },
      attributes: {
        method: "GET",
        path: "/api/attributes",
        description: "Get attributes with optional filtering",
        queryParams: {
          page: "Page number (default: 1)",
          limit: "Items per page (default: 50)",
          categoryIds: "Comma-separated category IDs",
          keyword: "Search keyword",
        },
      },
      categories: {
        method: "GET",
        path: "/api/categories/tree",
        description: "Get category tree structure",
        queryParams: {
          includeAttributeCount: "Include attribute counts (true/false)",
          includeProductCount: "Include product counts (true/false)",
        },
      },
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("Initializing database...");
    await initializeDatabase();
    console.log("Database initialized successfully");

    console.log("Seeding database...");
    await seedDatabase();
    console.log("Database seeded successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(
        `📚 API Documentation available at http://localhost:${PORT}/api`
      );
      console.log(
        `🏥 Health check available at http://localhost:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT. Graceful shutdown...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM. Graceful shutdown...");
  process.exit(0);
});

startServer();
