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
  router.get("/", (req, res) => {
    const state = req.query.state;

    if (
      state !== undefined &&
      (typeof state !== "string" || !todoService.allowedStates.includes(state))
    ) {
      return res.status(400).json({
        error: "Invalid state filter",
      });
    }

    const todos = todoService.getAllTodos(state);

    res.status(200).json(todos);
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
