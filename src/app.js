const express = require("express");

const createTodoRouter = require("./routes/todo");
const createTodoService = require("./services/todoService");

function createApp() {
  // Create the Express application
  const app = express();

  // Create an independent Todo service
  const todoService = createTodoService();

  // Middleware to parse JSON request bodies
  app.use(express.json());

  // Root endpoint to check server status
  app.get("/", (req, res) => {
    res.status(200).json({
      message: "Todo REST API is running",
    });
  });

  // Register the Todo routes
  app.use("/todos", createTodoRouter(todoService));

  // Handle malformed JSON requests
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

  // Return the configured Express application
  return app;
}

module.exports = createApp;
