const fastify = require('../src/app.js');
const state = require('../src/routes/employee/state');

let server;

beforeAll(async () => {
  // Start the server before all tests
  server = await fastify.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Server started for e2e tests on http://localhost:3000');
});

beforeEach(() => {
  // Reset state before each test to ensure isolation
  state.reset();
});

afterAll(async () => {
  // Close the server after all tests
  if (server) {
    await fastify.close();
    console.log('Server closed after e2e tests');
  }
}); 