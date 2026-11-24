const express = require("express");

function createTodoRouter(todoService) {
  const router = express.Router();

  // POST /todos - Create a Todo
  router.post("/", (req, res) => {
    const error = todoService.validateTodo(req.body, true);

    if (error) {
      return res.status(400).json({ error });
    }

    const newTodo = todoService.createTodo(req.body);

    res.status(201).location(`/todos/${newTodo.id}`).json(newTodo);
  });

  // GET /todos - Retrieve all or filter by state
  // Supports both JSON and CSV response formats
  router.get("/", (req, res) => {
    // Read the state query parameter
    const state = req.query.state;

    // Validate the requested state
    if (
      state !== undefined &&
      (typeof state !== "string" || !todoService.allowedStates.includes(state))
    ) {
      return res.status(400).json({
        error: "Invalid state filter",
      });
    }

    // Retrieve all Todos or filter by state
    const todos = todoService.getAllTodos(state);

    // Tell clients that the response depends on Accept
    res.vary("Accept");

    // Use JSON if no specific format is requested
    const acceptHeader = req.get("Accept");

    const format =
      !acceptHeader || acceptHeader.trim() === "*/*"
        ? "application/json"
        : req.accepts(["application/json", "text/csv"]);

    // Return 406 if the requested format is unsupported
    if (!format) {
      return res.status(406).json({
        error: "Not Acceptable",
      });
    }

    // Return CSV if requested
    if (format === "text/csv") {
      const csv = todoService.toCsv(todos);

      return res.status(200).type("text/csv").send(csv);
    }

    // Otherwise return JSON
    return res.status(200).json(todos);
  });

  // GET /todos/:id - Retrieve a single Todo
  router.get("/:id", (req, res) => {
    const todo = todoService.getTodoById(req.params.id);

    if (!todo) {
      return res.status(404).json({
        error: "Todo not found",
      });
    }

    res.status(200).json(todo);
  });

  // PUT /todos/:id - Update a Todo
  router.put("/:id", (req, res) => {
    const existingTodo = todoService.getTodoById(req.params.id);

    if (!existingTodo) {
      return res.status(404).json({
        error: "Todo not found",
      });
    }

    const error = todoService.validateTodo(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    const updatedTodo = todoService.updateTodo(req.params.id, req.body);

    res.status(200).json(updatedTodo);
  });

  // DELETE /todos/:id - Delete a Todo
  router.delete("/:id", (req, res) => {
    const deleted = todoService.deleteTodo(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Todo not found",
      });
    }

    res.status(204).send();
  });

  return router;
}

module.exports = createTodoRouter;
