const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../src/app");

// ========================================
// 1. ROOT ENDPOINT
// ========================================

test("GET / returns 200 server status", async () => {
  const app = createApp();

  const res = await request(app).get("/");

  assert.equal(res.status, 200);
  assert.equal(res.body.message, "Todo REST API is running");
});

// ========================================
// 2. POST /todos - CREATE
// ========================================

test("POST /todos creates a Todo, returns 201", async () => {
  const app = createApp();

  const res = await request(app).post("/todos").send({
    title: "Study Node.js",
    description: "Learn Express",
    state: "todo",
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.title, "Study Node.js");
  assert.equal(res.body.description, "Learn Express");
  assert.equal(res.body.state, "todo");

  // Check generated fields
  assert.ok(res.body.id);
  assert.ok(res.body.createdAt);
  assert.ok(res.body.updatedAt);

  // Check response header
  assert.equal(res.headers.location, `/todos/${res.body.id}`);
});

test("POST uses default values, returns 201", async () => {
  const app = createApp();

  const res = await request(app).post("/todos").send({
    title: "Complete assignment",
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.state, "todo");
  assert.equal(res.body.description, "");
  assert.equal(res.body.dueDate, null);
});

test("POST rejects a missing title, returns 400", async () => {
  const app = createApp();

  const res = await request(app).post("/todos").send({
    state: "todo",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Title is required");
});

test("POST rejects an invalid state, returns 400", async () => {
  const app = createApp();

  const res = await request(app).post("/todos").send({
    title: "Study Express",
    state: "pending",
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Invalid state");
});

test("POST rejects a non-string title, returns 400", async () => {
  const app = createApp();

  const res = await request(app).post("/todos").send({
    title: 123,
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Title must be a non-empty string");
});

test("POST rejects malformed JSON, returns 400", async () => {
  const app = createApp();

  const res = await request(app)
    .post("/todos")
    .set("Content-Type", "application/json")
    .send('{"title":"Study","state":"todo",}');

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Malformed JSON request body");
});

// ========================================
// 3. GET /todos - READ ALL
// ========================================

test("GET /todos returns an empty array, returns 200", async () => {
  const app = createApp();

  const res = await request(app).get("/todos");

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
});

test("GET /todos returns all created Todos, returns 200", async () => {
  const app = createApp();

  await request(app).post("/todos").send({ title: "Task A" });

  await request(app).post("/todos").send({ title: "Task B" });

  const res = await request(app).get("/todos");

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
  assert.equal(res.body[0].title, "Task A");
  assert.equal(res.body[1].title, "Task B");
});

test("GET /todos filters by state, returns 200", async () => {
  const app = createApp();

  await request(app).post("/todos").send({ title: "Task A", state: "todo" });

  await request(app).post("/todos").send({ title: "Task B", state: "doing" });

  const res = await request(app).get("/todos?state=doing");

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].title, "Task B");
  assert.equal(res.body[0].state, "doing");
});

test("GET /todos rejects invalid state filter, returns 400", async () => {
  const app = createApp();

  const res = await request(app).get("/todos?state=pending");

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Invalid state filter");
});

// ========================================
// 4. GET /todos/:id - READ ONE
// ========================================

test("GET /todos/:id returns matching Todo, returns 200", async () => {
  const app = createApp();

  const created = await request(app)
    .post("/todos")
    .send({ title: "Learn REST APIs" });

  const res = await request(app).get(`/todos/${created.body.id}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.id, created.body.id);
  assert.equal(res.body.title, "Learn REST APIs");
});

test("GET /todos/:id returns 404 for missing ID", async () => {
  const app = createApp();

  const res = await request(app).get("/todos/nonexistent-id");

  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Todo not found");
});

// ========================================
// 5. PUT /todos/:id - UPDATE
// ========================================

test("PUT updates Todo state, returns 200", async () => {
  const app = createApp();

  const created = await request(app).post("/todos").send({
    title: "Study Express",
    state: "todo",
  });

  const res = await request(app).put(`/todos/${created.body.id}`).send({
    state: "doing",
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.state, "doing");
  assert.equal(res.body.title, "Study Express");
  assert.equal(res.body.id, created.body.id);

  // Original creation timestamp is preserved
  assert.equal(res.body.createdAt, created.body.createdAt);

  // Confirm the update was saved
  const verified = await request(app).get(`/todos/${created.body.id}`);

  assert.equal(verified.body.state, "doing");
});

test("PUT updates multiple Todo fields, returns 200", async () => {
  const app = createApp();

  const created = await request(app)
    .post("/todos")
    .send({ title: "Original Title" });

  const res = await request(app).put(`/todos/${created.body.id}`).send({
    title: "Updated Title",
    description: "Updated description",
    state: "done",
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.title, "Updated Title");
  assert.equal(res.body.description, "Updated description");
  assert.equal(res.body.state, "done");
  assert.ok(res.body.updatedAt);
});

test("PUT rejects an invalid state, returns 400", async () => {
  const app = createApp();

  const created = await request(app)
    .post("/todos")
    .send({ title: "Test Task" });

  const res = await request(app)
    .put(`/todos/${created.body.id}`)
    .send({ state: "cancelled" });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Invalid state");

  // Invalid update must not change stored data
  const verified = await request(app).get(`/todos/${created.body.id}`);

  assert.equal(verified.body.state, "todo");
});

test("PUT returns 404 for missing Todo", async () => {
  const app = createApp();

  const res = await request(app)
    .put("/todos/nonexistent-id")
    .send({ state: "doing" });

  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Todo not found");
});

// ========================================
// 6. DELETE /todos/:id - DELETE
// ========================================

test("DELETE successfully removes a Todo and verifies its absence (204/404)", async () => {
  const app = createApp();

  const created = await request(app)
    .post("/todos")
    .send({ title: "Temporary Task" });

  const deleted = await request(app).delete(`/todos/${created.body.id}`);

  assert.equal(deleted.status, 204);
  assert.equal(deleted.text, "");

  // Verify the Todo no longer exists
  const res = await request(app).get(`/todos/${created.body.id}`);

  assert.equal(res.status, 404);
});

test("DELETE returns 404 for missing Todo", async () => {
  const app = createApp();

  const res = await request(app).delete("/todos/nonexistent-id");

  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Todo not found");
});

// ========================================
// 7. TEST DATA ISOLATION
// ========================================

test("Separate app instances have independent data", async () => {
  const appA = createApp();
  const appB = createApp();

  await request(appA).post("/todos").send({ title: "Only in app A" });

  const resA = await request(appA).get("/todos");
  const resB = await request(appB).get("/todos");

  assert.equal(resA.body.length, 1);
  assert.equal(resB.body.length, 0);
});
