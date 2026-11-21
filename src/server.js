const createApp = require("./app");

// Define the server port
const PORT = process.env.PORT || 3000;

// Create the Express application
const app = createApp();

// Start listening for HTTP requests
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
