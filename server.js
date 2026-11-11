const express = require("express");
const { randomUUID } = require("node:crypto");

const app = express();
const PORT = 3000;

// Middleware to read incoming JSON data
app.use(express.json());

// Temporary database using an array
let todos = [];

// Test the server
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Todo REST API is running",
  });
});

// POST endpoint to create a new Todo item
app.post("/todos", (req, res) => {
  // Read data sent by the client
  const { title, description, state, dueDate } = req.body;

  // Create current date and time
  const now = new Date().toISOString();

  // Create a new Todo object
  const newTodo = {
    id: randomUUID(),
    title: title,
    description: description || "",
    state: state || "todo",
    dueDate: dueDate || null,
    createdAt: now,
    updatedAt: now,
  };

  // Add the new Todo to the array
  todos.push(newTodo);
  console.log(todos);

  // Send success response
  res.status(201).json(newTodo);
});

// GET all Todos or filter by state
app.get("/todos", (req, res) => {
  // Read the state query parameter
  const state = req.query.state;

  // If a state is provided, filter the array
  if (state !== undefined) {
    const filteredTodos = todos.filter((todo) => todo.state === state);

    return res.status(200).json(filteredTodos);
  }

  // Otherwise return all Todos
  res.status(200).json(todos);
});

// NEW: GET a single Todo item by ID
app.get("/todos/:id", (req, res) => {
  // Read the ID from the URL
  const id = req.params.id;

  // Find the Todo with the matching ID
  const todo = todos.find((item) => item.id === id);

  // Return 404 if no Todo is found
  if (!todo) {
    return res.status(404).json({
      error: "Todo not found",
    });
  }

  // Return the Todo item
  res.status(200).json(todo);
});

// PUT endpoint to update an existing Todo
app.put("/todos/:id", (req, res) => {
  // Read the Todo ID from the URL
  const id = req.params.id;

  // Find the index of the Todo in the array
  const index = todos.findIndex((item) => item.id === id);

  // Return 404 if the Todo does not exist
  if (index === -1) {
    return res.status(404).json({
      error: "Todo not found",
    });
  }

  // Read the fields sent by the client
  const { title, description, state, dueDate } = req.body;

  // Update only the fields provided by the client
  if (title !== undefined) {
    todos[index].title = title;
  }

  if (description !== undefined) {
    todos[index].description = description;
  }

  if (state !== undefined) {
    todos[index].state = state;
  }

  if (dueDate !== undefined) {
    todos[index].dueDate = dueDate;
  }

  // Update the modification timestamp
  todos[index].updatedAt = new Date().toISOString();

  // Return the updated Todo
  res.status(200).json(todos[index]);
});

// DELETE endpoint to remove a Todo item
app.delete("/todos/:id", (req, res) => {
  // Read the ID from the URL
  const id = req.params.id;

  // Find the position of the Todo in the array
  const index = todos.findIndex((item) => item.id === id);

  // Return 404 if the Todo does not exist
  if (index === -1) {
    return res.status(404).json({
      error: "Todo not found",
    });
  }

  // Remove one item from the array
  todos.splice(index, 1);

  // Return success with no response body
  res.status(204).send();
});

// Handle malformed JSON request bodies
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

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
