const test = require("node:test");
const assert = require("node:assert/strict");

const createTodoService = require("../src/services/todoService");

// ========================================
// 1. VALIDATION TESTS
// ========================================

test("Valid Todo data should pass validation", () => {
  const service = createTodoService();

  const result = service.validateTodo(
    {
      title: "Study Node.js",
      state: "todo",
    },
    true,
  );

  assert.equal(result, null);
});

test("Missing title should be rejected", () => {
  const service = createTodoService();

  const result = service.validateTodo(
    {
      state: "todo",
    },
    true,
  );

  assert.equal(result, "Title is required");
});

test("Empty title should be rejected", () => {
  const service = createTodoService();

  const result = service.validateTodo(
    {
      title: "",
    },
    true,
  );

  assert.equal(result, "Title must be a non-empty string");
});

test("Whitespace-only title should be rejected", () => {
  const service = createTodoService();

  const result = service.validateTodo(
    {
      title: "   ",
    },
    true,
  );

  assert.equal(result, "Title must be a non-empty string");
});

test("Invalid Todo state should be rejected", () => {
  const service = createTodoService();

  const result = service.validateTodo(
    {
      title: "Study REST APIs",
      state: "pending",
    },
    true,
  );

  assert.equal(result, "Invalid state");
});

test("All three allowed states should be accepted", () => {
  const service = createTodoService();

  for (const state of ["todo", "doing", "done"]) {
    const result = service.validateTodo(
      {
        title: "Test Task",
        state,
      },
      true,
    );

    assert.equal(result, null);
  }
});

test("Invalid description type should be rejected", () => {
  const service = createTodoService();

  const result = service.validateTodo(
    {
      title: "Study Express",
      description: 123,
    },
    true,
  );

  assert.equal(result, "Description must be a string");
});

test("Invalid date should be rejected", () => {
  const service = createTodoService();

  const result = service.validateTodo(
    {
      title: "Submit assignment",
      dueDate: "2026-02-30",
    },
    true,
  );

  assert.equal(result, "Invalid dueDate");
});

test("Unknown fields should be rejected", () => {
  const service = createTodoService();

  const result = service.validateTodo(
    {
      title: "Study Node.js",
      priority: "high",
    },
    true,
  );

  assert.equal(result, "Unknown field: priority");
});

test("Empty update body should be rejected", () => {
  const service = createTodoService();

  const result = service.validateTodo({});

  assert.equal(result, "Request body cannot be empty");
});

// ========================================
// 2. CREATE TODO TESTS
// ========================================

test("Create Todo with default values", () => {
  const service = createTodoService();

  const todo = service.createTodo({
    title: "Study Node.js",
  });

  assert.equal(todo.title, "Study Node.js");
  assert.equal(todo.state, "todo");
  assert.equal(todo.description, "");
  assert.equal(todo.dueDate, null);
});

test("New Todo should have UUID and timestamps", () => {
  const service = createTodoService();

  const todo = service.createTodo({
    title: "Learn Express",
  });

  assert.match(
    todo.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );

  assert.ok(!Number.isNaN(Date.parse(todo.createdAt)));
  assert.equal(todo.createdAt, todo.updatedAt);
});

test("Created Todo should be stored in the array", () => {
  const service = createTodoService();

  service.createTodo({
    title: "Task A",
  });

  assert.equal(service.getAllTodos().length, 1);
});

test("Each created Todo should have a unique ID", () => {
  const service = createTodoService();

  const first = service.createTodo({
    title: "Task A",
  });

  const second = service.createTodo({
    title: "Task B",
  });

  assert.notEqual(first.id, second.id);
});

// ========================================
// 3. GET ALL TODOS TESTS
// ========================================

test("New service should have an empty array", () => {
  const service = createTodoService();

  assert.deepEqual(service.getAllTodos(), []);
});

test("Get all Todos should return stored items", () => {
  const service = createTodoService();

  service.createTodo({ title: "Task A" });
  service.createTodo({ title: "Task B" });

  const todos = service.getAllTodos();

  assert.equal(todos.length, 2);
  assert.equal(todos[0].title, "Task A");
  assert.equal(todos[1].title, "Task B");
});

test("Filter Todos by state doing", () => {
  const service = createTodoService();

  service.createTodo({
    title: "Task A",
    state: "todo",
  });

  service.createTodo({
    title: "Task B",
    state: "doing",
  });

  const result = service.getAllTodos("doing");

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Task B");
});

// ========================================
// 4. GET TODO BY ID TESTS
// ========================================

test("Find an existing Todo by ID", () => {
  const service = createTodoService();

  const created = service.createTodo({
    title: "Study REST APIs",
  });

  const found = service.getTodoById(created.id);

  assert.equal(found.id, created.id);
  assert.equal(found.title, "Study REST APIs");
});

test("Nonexistent Todo ID should return undefined", () => {
  const service = createTodoService();

  const result = service.getTodoById("999");

  assert.equal(result, undefined);
});

// ========================================
// 5. UPDATE TODO TESTS
// ========================================

test("Update Todo state successfully", () => {
  const service = createTodoService();

  const created = service.createTodo({
    title: "Study Express",
    state: "todo",
  });

  const updated = service.updateTodo(created.id, {
    state: "doing",
  });

  assert.equal(updated.state, "doing");
  assert.equal(updated.title, "Study Express");
  assert.equal(updated.id, created.id);
  assert.equal(updated.createdAt, created.createdAt);
});

test("Updating nonexistent Todo should return null", () => {
  const service = createTodoService();

  const result = service.updateTodo("999", {
    state: "done",
  });

  assert.equal(result, null);
});

// ========================================
// 6. DELETE TODO TESTS
// ========================================

test("Delete existing Todo successfully", () => {
  const service = createTodoService();

  const created = service.createTodo({
    title: "Temporary Task",
  });

  const deleted = service.deleteTodo(created.id);

  assert.equal(deleted, true);
  assert.equal(service.getAllTodos().length, 0);
  assert.equal(service.getTodoById(created.id), undefined);
});

test("Deleting nonexistent Todo should return false", () => {
  const service = createTodoService();

  const deleted = service.deleteTodo("999");

  assert.equal(deleted, false);
});

test("Separate services should have independent data", () => {
  const serviceA = createTodoService();
  const serviceB = createTodoService();

  serviceA.createTodo({
    title: "Task belonging to service A",
  });

  assert.equal(serviceA.getAllTodos().length, 1);
  assert.equal(serviceB.getAllTodos().length, 0);
});
