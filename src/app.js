const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");

const fs = require("node:fs");
const path = require("node:path");

const createTodoRouter = require("./routes/todo");
const createTodoService = require("./services/todoService");

// Locate the OpenAPI specification
const openApiPath = path.join(__dirname, "docs", "openapi.yaml");

// Read and parse the YAML specification
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));

function createApp() {
  // Create Express application
  const app = express();

  // Create independent Todo service
  const todoService = createTodoService();

  // Middleware to parse JSON
  app.use(express.json());

  // Root endpoint
  app.get("/", (req, res) => {
    res.status(200).json({
      message: "Todo REST API is running",
    });
  });

  // Swagger UI documentation
  app.use("/doc", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  // Todo API routes
  app.use("/todos", createTodoRouter(todoService));

  // Handle malformed JSON
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({
        error: "Malformed JSON request body",
      });
    }

    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  });

  return app;
}

module.exports = createApp;
