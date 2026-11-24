const { randomUUID } = require("node:crypto");

const allowedStates = ["todo", "doing", "done"];

function createTodoService() {
  // Private array for storing Todo items
  let todos = [];

  // Validate data received from the client
  function validateTodo(data, isCreate = false) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return "Request body must be a JSON object";
    }

    if (isCreate && !("title" in data)) {
      return "Title is required";
    }

    if (Object.keys(data).length === 0) {
      return "Request body cannot be empty";
    }

    const allowedFields = ["title", "description", "state", "dueDate"];

    for (const field of Object.keys(data)) {
      if (!allowedFields.includes(field)) {
        return `Unknown field: ${field}`;
      }
    }

    if (
      "title" in data &&
      (typeof data.title !== "string" || data.title.trim() === "")
    ) {
      return "Title must be a non-empty string";
    }

    if ("description" in data && typeof data.description !== "string") {
      return "Description must be a string";
    }

    if ("state" in data && !allowedStates.includes(data.state)) {
      return "Invalid state";
    }

    if ("dueDate" in data && data.dueDate !== null) {
      if (
        typeof data.dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)
      ) {
        return "Invalid dueDate";
      }

      const date = new Date(data.dueDate);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== data.dueDate
      ) {
        return "Invalid dueDate";
      }
    }

    return null;
  }

  // CREATE
  function createTodo(data) {
    const now = new Date().toISOString();

    const newTodo = {
      id: randomUUID(),
      title: data.title.trim(),
      description: data.description ?? "",
      state: data.state ?? "todo",
      dueDate: data.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };

    todos.push(newTodo);
    return newTodo;
  }

  // READ ALL
  function getAllTodos(state) {
    if (state !== undefined) {
      return todos.filter((todo) => todo.state === state);
    }

    return [...todos];
  }

  // READ ONE
  function getTodoById(id) {
    return todos.find((todo) => todo.id === id);
  }

  // UPDATE
  function updateTodo(id, updates) {
    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      return null;
    }

    todos[index] = {
      ...todos[index],
      ...updates,
      title:
        updates.title !== undefined ? updates.title.trim() : todos[index].title,
      updatedAt: new Date().toISOString(),
    };

    return todos[index];
  }

  // DELETE
  function deleteTodo(id) {
    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      return false;
    }

    todos.splice(index, 1);
    return true;
  }

  // Convert a single value into a CSV-safe field
  function escapeCsv(value) {
    // Convert null or undefined to an empty field
    if (value === null || value === undefined) {
      return "";
    }

    const text = String(value);

    // Escape quotation marks by doubling them
    const escaped = text.replace(/"/g, '""');

    // Quote fields containing commas, quotes or newlines
    if (/[",\r\n]/.test(text)) {
      return `"${escaped}"`;
    }

    return escaped;
  }

  // Convert an array of Todo items into CSV
  function toCsv(items) {
    const headers = [
      "id",
      "title",
      "description",
      "state",
      "dueDate",
      "createdAt",
      "updatedAt",
    ];

    // Convert Todo objects into CSV rows
    const rows = items.map((todo) => [
      todo.id,
      todo.title,
      todo.description,
      todo.state,
      todo.dueDate,
      todo.createdAt,
      todo.updatedAt,
    ]);

    // Add headers as the first row
    const allRows = [headers, ...rows];

    // Escape each value and join fields with commas
    return allRows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  }

  return {
    validateTodo,
    createTodo,
    getAllTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    toCsv,
    allowedStates,
  };
}

module.exports = createTodoService;
