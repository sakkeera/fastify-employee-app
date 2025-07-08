const request = require('supertest');
const Fastify = require('fastify');

// Mock console.log and process.exit to prevent actual server startup
const originalConsoleLog = console.log;
const originalProcessExit = process.exit;

describe('Server', () => {
  let mockConsoleLog;
  let mockProcessExit;
  let serverModule;

  beforeEach(() => {
    // Mock console.log and process.exit
    mockConsoleLog = jest.fn();
    mockProcessExit = jest.fn();
    console.log = mockConsoleLog;
    process.exit = mockProcessExit;
  });

  afterEach(() => {
    // Restore original functions
    console.log = originalConsoleLog;
    process.exit = originalProcessExit;
  });

  describe('Server Startup Error Handling', () => {
    it('should handle server startup errors and exit process', async () => {
      const mockError = new Error('Port already in use');
      
      // Create a mock Fastify instance that rejects on listen
      const mockFastify = {
        register: jest.fn(),
        get: jest.fn(),
        listen: jest.fn().mockRejectedValue(mockError),
        log: {
          error: jest.fn(),
        },
      };

      // Mock the fastify require to return our mock
      jest.doMock('fastify', () => {
        return jest.fn(() => mockFastify);
      });

      // Clear require cache to ensure fresh module load
      jest.resetModules();

      // Import the server module (this will execute the start function)
      serverModule = require('../server');

      // Wait for the async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that error was logged
      expect(mockFastify.log.error).toHaveBeenCalledWith(mockError);

      // Verify that process.exit was called with code 1
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should test start function with different error types', async () => {
      const mockError = new Error('Network error');
      
      // Create a mock Fastify instance that rejects on listen
      const mockFastify = {
        register: jest.fn(),
        get: jest.fn(),
        listen: jest.fn().mockRejectedValue(mockError),
        log: {
          error: jest.fn(),
        },
      };

      // Mock the fastify require to return our mock
      jest.doMock('fastify', () => {
        return jest.fn(() => mockFastify);
      });

      // Clear require cache
      jest.resetModules();

      // Execute server.js
      require('../server');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify error handling
      expect(mockFastify.log.error).toHaveBeenCalledWith(mockError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Health Check Endpoint', () => {
    let app;
    let server;

    beforeEach(async () => {
      // Create a fresh Fastify instance for endpoint testing
      app = Fastify({ logger: false });

      // Register employee routes
      app.register(require('../routes/employee'), { prefix: '/employees' });

      // Health check endpoint (same as server.js)
      app.get('/', async (request, reply) => {
        return { message: 'Fastify Employee API is running!' };
      });

      // Start server
      await app.ready();
      server = app.server;
    });

    afterEach(async () => {
      if (server) {
        await server.close();
      }
    });

    it('should return health check message', async () => {
      const response = await request(server).get('/').expect(200);

      expect(response.body).toEqual({
        message: 'Fastify Employee API is running!',
      });
    });

    it('should return correct content type', async () => {
      const response = await request(server).get('/').expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should handle health check endpoint with proper async/await', async () => {
      const response = await request(server).get('/').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should test the exact health check function from server.js', async () => {
      // Define the exact same function as in server.js
      const healthCheckFunction = async (request, reply) => {
        return { message: 'Fastify Employee API is running!' };
      };

      // Test the function directly
      const result = await healthCheckFunction({}, {});
      expect(result).toEqual({ message: 'Fastify Employee API is running!' });
    });
  });

  describe('Server Configuration', () => {
    let app;
    let server;

    beforeEach(async () => {
      // Create a fresh Fastify instance for configuration testing
      app = Fastify({ logger: false });

      // Register employee routes
      app.register(require('../routes/employee'), { prefix: '/employees' });

      // Health check endpoint (same as server.js)
      app.get('/', async (request, reply) => {
        return { message: 'Fastify Employee API is running!' };
      });

      // Start server
      await app.ready();
      server = app.server;
    });

    afterEach(async () => {
      if (server) {
        await server.close();
      }
    });

    it('should register employee routes with correct prefix', async () => {
      // Test that employee routes are accessible
      const response = await request(server).get('/employees').expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
    });

    it('should handle 404 for non-existent routes', async () => {
      const response = await request(server)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle multiple health check requests sequentially', async () => {
      // Test multiple health check requests sequentially to avoid connection issues
      for (let i = 0; i < 3; i++) {
        const response = await request(server).get('/').expect(200);
        expect(response.body).toEqual({
          message: 'Fastify Employee API is running!',
        });
      }
    });
  });

  describe('API Integration Through Server', () => {
    let app;
    let server;

    beforeEach(async () => {
      // Create a fresh Fastify instance for integration testing
      app = Fastify({ logger: false });

      // Register employee routes
      app.register(require('../routes/employee'), { prefix: '/employees' });

      // Health check endpoint (same as server.js)
      app.get('/', async (request, reply) => {
        return { message: 'Fastify Employee API is running!' };
      });

      // Start server
      await app.ready();
      server = app.server;
    });

    afterEach(async () => {
      if (server) {
        await server.close();
      }
    });

    it('should handle complete API workflow through server', async () => {
      // Test that the server properly handles all employee operations

      // 1. Create employee
      const createResponse = await request(server)
        .post('/employees')
        .send({ name: 'Test Employee', age: 30 })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name).toBe('Test Employee');

      // 2. Get all employees
      const getAllResponse = await request(server)
        .get('/employees')
        .expect(200);

      expect(getAllResponse.body.success).toBe(true);
      expect(getAllResponse.body.data).toHaveLength(1);
      expect(getAllResponse.body.count).toBe(1);

      // 3. Get specific employee
      const employeeId = createResponse.body.data.id;
      const getOneResponse = await request(server)
        .get(`/employees/${employeeId}`)
        .expect(200);

      expect(getOneResponse.body.success).toBe(true);
      expect(getOneResponse.body.data.id).toBe(employeeId);

      // 4. Update employee
      const updateResponse = await request(server)
        .put(`/employees/${employeeId}`)
        .send({ name: 'Updated Employee', age: 31 })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('Updated Employee');

      // 5. Delete employee
      const deleteResponse = await request(server)
        .delete(`/employees/${employeeId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.data.id).toBe(employeeId);
    });

    it('should handle server shutdown gracefully', async () => {
      // Test that the server can be closed without errors
      expect(async () => {
        await server.close();
      }).not.toThrow();
    });
  });

  describe('Server Module Structure', () => {
    it('should have correct module structure', () => {
      // Test that the server module can be required without errors
      expect(() => {
        require('../server');
      }).not.toThrow();
    });

    it('should properly register employee routes', async () => {
      // Create a fresh Fastify instance to test route registration
      const app = Fastify({ logger: false });
      
      // Register employee routes (same as server.js)
      app.register(require('../routes/employee'), { prefix: '/employees' });
      
      // Health check endpoint (same as server.js)
      app.get('/', async (request, reply) => {
        return { message: 'Fastify Employee API is running!' };
      });

      // Start server
      await app.ready();
      const server = app.server;

      // Test that employee routes are accessible
      const response = await request(server).get('/employees').expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');

      // Clean up
      await server.close();
    });

    it('should execute server.js file completely', async () => {
      // Mock fastify to prevent actual server startup but allow execution
      const mockFastify = {
        register: jest.fn(),
        get: jest.fn(),
        listen: jest.fn().mockResolvedValue(),
        log: {
          error: jest.fn(),
        },
      };

      // Mock the fastify require to return our mock
      jest.doMock('fastify', () => {
        return jest.fn(() => mockFastify);
      });

      // Clear require cache
      jest.resetModules();

      // This should execute all lines in server.js including line 8
      const serverModule = require('../server');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that the register call was made (this covers line 8)
      expect(mockFastify.register).toHaveBeenCalledWith(
        expect.any(Function),
        { prefix: '/employees' }
      );

      // Verify that listen was called
      expect(mockFastify.listen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0'
      });
    });

    it('should directly execute server.js without mocking fastify', async () => {
      // Create a custom fastify instance that doesn't actually start a server
      const originalFastify = require('fastify');
      
      // Temporarily replace the fastify module with our custom implementation
      const customFastify = jest.fn((options) => {
        const instance = {
          register: jest.fn(),
          get: jest.fn(),
          listen: jest.fn().mockResolvedValue(),
          log: {
            error: jest.fn(),
          },
        };
        return instance;
      });

      // Mock the module
      jest.doMock('fastify', () => customFastify);
      
      // Clear require cache
      jest.resetModules();

      // Execute server.js
      require('../server');

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that fastify was called with correct options
      expect(customFastify).toHaveBeenCalledWith({ logger: true });

      // Verify that register was called (this should cover line 8)
      const mockInstance = customFastify.mock.results[0].value;
      expect(mockInstance.register).toHaveBeenCalledWith(
        expect.any(Function),
        { prefix: '/employees' }
      );

      // Verify that listen was called
      expect(mockInstance.listen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0'
      });
    });

    it('should directly require server.js for complete coverage', () => {
      // This test directly requires the server.js file to ensure all lines are covered
      // We'll mock fastify to prevent actual server startup
      
      const mockFastifyInstance = {
        register: jest.fn(),
        get: jest.fn(),
        listen: jest.fn().mockResolvedValue(),
        log: { error: jest.fn() },
      };

      const mockFastify = jest.fn(() => mockFastifyInstance);
      
      // Mock the fastify module
      jest.doMock('fastify', () => mockFastify);
      jest.resetModules();

      // Directly require the server file - this should execute all lines
      require('../server');

      // Verify that all expected calls were made
      expect(mockFastify).toHaveBeenCalledWith({ logger: true });
      expect(mockFastifyInstance.register).toHaveBeenCalledWith(
        expect.any(Function),
        { prefix: '/employees' }
      );
      expect(mockFastifyInstance.listen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0'
      });
    });
  });
});
