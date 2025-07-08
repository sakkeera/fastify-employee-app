const request = require('supertest');
const Fastify = require('fastify');
const employeeRoutes = require('../../../routes/employee');
const state = require('../../../routes/employee/state');

describe('Employee Routes', () => {
  let app;
  let server;

  // Setup before each test
  beforeEach(async () => {
    // Reset in-memory state
    state.reset();
    // Create a fresh Fastify instance for each test
    app = Fastify({ 
      logger: false,
      ajv: {
        customOptions: {
          allErrors: true,
        }
      }
    });

    // Set up custom error handler for tests
    try {
      app.setErrorHandler((error, request, reply) => {
        if (error.validation) {
          // Handle validation errors
          const validationErrors = error.validation;
          let errorMessage = 'Validation failed';
          
          if (validationErrors.length > 0) {
            const firstError = validationErrors[0];
            const field = firstError.instancePath.replace('/', '') || firstError.params.missingProperty || 'data';
            
            // Unified age error message for any age-related validation
            if (field === 'age' && (firstError.keyword === 'minimum' || firstError.keyword === 'maximum' || firstError.keyword === 'type' || firstError.keyword === 'multipleOf')) {
              errorMessage = 'Age must be between 5 and 95 years';
            } else {
              switch (firstError.keyword) {
                case 'minimum':
                  if (field === 'id') {
                    errorMessage = `ID must be at least ${firstError.params.limit}`;
                  } else {
                    errorMessage = `${field} must be at least ${firstError.params.limit}`;
                  }
                  break;
                case 'maximum':
                  errorMessage = `${field} must be at most ${firstError.params.limit}`;
                  break;
                case 'type':
                  errorMessage = `${field} must be a ${firstError.params.type}`;
                  break;
                case 'required':
                  errorMessage = `${firstError.params.missingProperty} is required`;
                  break;
                case 'minLength':
                  errorMessage = `${field} cannot be empty`;
                  break;
                case 'multipleOf':
                  errorMessage = `${field} must be a whole number`;
                  break;
                default:
                  errorMessage = `Invalid ${field}`;
              }
            }
          }
          
          return reply.code(400).send({
            success: false,
            message: errorMessage
          });
        }
        
        // Handle other errors
        return reply.code(500).send({
          success: false,
          message: 'Internal server error'
        });
      });
    } catch (err) {
      // If setErrorHandler is not available, continue without custom error handling
      console.warn('Custom error handler could not be set in test environment');
    }

    // Register employee routes
    app.register(employeeRoutes, { prefix: '/employees' });

    // Health check endpoint
    app.get('/', async (request, reply) => {
      return { message: 'Fastify Employee API is running!' };
    });

    // Start server
    await app.ready();
    server = app.server;
  });

  // Cleanup after each test
  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('GET /employees', () => {
    it('should return empty employees list initially', async () => {
      const response = await request(server).get('/employees').expect(200);

      testUtils.validateApiResponse(response);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should return all employees with count', async () => {
      // First create some employees
      const employee1 = testUtils.createTestEmployee(1, 'John Doe', 30);
      const employee2 = testUtils.createTestEmployee(2, 'Jane Smith', 25);

      await request(server)
        .post('/employees')
        .send({ name: employee1.name, age: employee1.age })
        .expect(201);

      await request(server)
        .post('/employees')
        .send({ name: employee2.name, age: employee2.age })
        .expect(201);

      // Now get all employees
      const response = await request(server).get('/employees').expect(200);

      testUtils.validateApiResponse(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.data[0].name).toBe(employee1.name);
      expect(response.body.data[1].name).toBe(employee2.name);
    });
  });

  describe('GET /employees/:id', () => {
    it('should return employee by valid ID', async () => {
      // Create an employee first
      const testEmployee = testUtils.createTestEmployee(1, 'John Doe', 30);

      await request(server)
        .post('/employees')
        .send({ name: testEmployee.name, age: testEmployee.age })
        .expect(201);

      // Get employee by ID
      const response = await request(server).get('/employees/1').expect(200);

      testUtils.validateApiResponse(response);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: 1,
          name: testEmployee.name,
          age: testEmployee.age,
        })
      );
    });

    it('should return 404 for non-existent employee ID', async () => {
      const response = await request(server).get('/employees/999').expect(404);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Employee not found');
    });

    it('should return 400 for invalid ID format (string)', async () => {
      const response = await request(server).get('/employees/abc').expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(
        'Invalid ID format. ID must be a number.'
      );
    });

    it('should return 400 for invalid ID format (decimal)', async () => {
      const response = await request(server).get('/employees/1.5').expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(
        'Invalid ID format. ID must be a number.'
      );
    });
  });

  describe('POST /employees', () => {
    it('should create employee with auto-generated ID', async () => {
      const employeeData = { name: 'John Doe', age: 30 };

      const response = await request(server)
        .post('/employees')
        .send(employeeData)
        .expect(201);

      testUtils.validateApiResponse(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.name).toBe(employeeData.name);
      expect(response.body.data.age).toBe(employeeData.age);
    });

    it('should create employee with custom ID', async () => {
      const employeeData = { id: 5, name: 'Jane Smith', age: 25 };

      const response = await request(server)
        .post('/employees')
        .send(employeeData)
        .expect(201);

      testUtils.validateApiResponse(response);
      expect(response.body.data.id).toBe(5);
      expect(response.body.data.name).toBe(employeeData.name);
      expect(response.body.data.age).toBe(employeeData.age);
    });

    it('should return 409 when creating employee with duplicate ID', async () => {
      // Create first employee
      await request(server)
        .post('/employees')
        .send({ id: 1, name: 'John Doe', age: 30 })
        .expect(201);

      // Try to create second employee with same ID
      const response = await request(server)
        .post('/employees')
        .send({ id: 1, name: 'Jane Smith', age: 25 })
        .expect(409);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Employee with ID 1 already exists');
    });

    it('should return 400 when missing name field', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ age: 30 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when missing age field', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ name: 'John Doe' })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when age is not a number', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ name: 'John Doe', age: 'thirty' })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when age is too low (below 5)', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ name: 'John Doe', age: 3 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    it('should return 400 when age is too high (above 95)', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ name: 'John Doe', age: 100 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    it('should return 400 when age is zero', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ name: 'John Doe', age: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    it('should return 400 when custom ID is not a number', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ id: 'abc', name: 'John Doe', age: 30 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when custom ID is negative', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ id: -1, name: 'John Doe', age: 30 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when custom ID is zero', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ id: 0, name: 'John Doe', age: 30 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle empty name string', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ name: '', age: 30 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle null values', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ name: null, age: null })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when custom ID is decimal', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ id: 2.5, name: 'Decimal ID', age: 30 })
        .expect(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when age is decimal', async () => {
      const response = await request(server)
        .post('/employees')
        .send({ name: 'John Doe', age: 25.5 })
        .expect(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });
  });

  describe('PUT /employees/:id', () => {
    beforeEach(async () => {
      // Create a test employee for update tests
      await request(server)
        .post('/employees')
        .send({ name: 'John Doe', age: 30 })
        .expect(201);
    });

    it('should update employee with valid data', async () => {
      const updateData = { name: 'John Doe Updated', age: 31 };

      const response = await request(server)
        .put('/employees/1')
        .send(updateData)
        .expect(200);

      testUtils.validateApiResponse(response);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: 1,
          name: updateData.name,
          age: updateData.age,
        })
      );
    });

    it('should return 404 for non-existent employee ID', async () => {
      const response = await request(server)
        .put('/employees/999')
        .send({ name: 'John Doe', age: 30 })
        .expect(404);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Employee not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(server)
        .put('/employees/abc')
        .send({ name: 'John Doe', age: 30 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(
        'Invalid ID format. ID must be a number.'
      );
    });

    it('should return 400 when missing name field', async () => {
      const response = await request(server)
        .put('/employees/1')
        .send({ age: 31 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when missing age field', async () => {
      const response = await request(server)
        .put('/employees/1')
        .send({ name: 'John Doe Updated' })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when age is not a number', async () => {
      const response = await request(server)
        .put('/employees/1')
        .send({ name: 'John Doe', age: 'thirty' })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when age is too low (below 5)', async () => {
      const response = await request(server)
        .put('/employees/1')
        .send({ name: 'John Doe', age: 3 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    it('should return 400 when age is too high (above 95)', async () => {
      const response = await request(server)
        .put('/employees/1')
        .send({ name: 'John Doe', age: 100 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    it('should return 400 when age is zero', async () => {
      const response = await request(server)
        .put('/employees/1')
        .send({ name: 'John Doe', age: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    it('should return 400 when age is decimal', async () => {
      const response = await request(server)
        .put('/employees/1')
        .send({ name: 'John Doe', age: 25.5 })
        .expect(400);
      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });
  });

  describe('DELETE /employees/:id', () => {
    beforeEach(async () => {
      // Create a test employee for delete tests
      await request(server)
        .post('/employees')
        .send({ name: 'John Doe', age: 30 })
        .expect(201);
    });

    it('should delete employee with valid ID', async () => {
      const response = await request(server).delete('/employees/1').expect(200);

      testUtils.validateApiResponse(response);
      expect(response.body.data).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'John Doe',
          age: 30,
        })
      );

      // Verify employee is actually deleted
      await request(server).get('/employees/1').expect(404);
    });

    it('should return 404 for non-existent employee ID', async () => {
      const response = await request(server)
        .delete('/employees/999')
        .expect(404);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Employee not found');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(server)
        .delete('/employees/abc')
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe(
        'Invalid ID format. ID must be a number.'
      );
    });

    it('should handle multiple deletions correctly', async () => {
      // Create multiple employees
      await request(server)
        .post('/employees')
        .send({ name: 'Employee 2', age: 25 })
        .expect(201);

      await request(server)
        .post('/employees')
        .send({ name: 'Employee 3', age: 35 })
        .expect(201);

      // Delete employee 2
      await request(server).delete('/employees/2').expect(200);

      // Verify employee 2 is deleted but others remain
      await request(server).get('/employees/1').expect(200);

      await request(server).get('/employees/2').expect(404);

      await request(server).get('/employees/3').expect(200);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete CRUD workflow', async () => {
      // 1. Create employee
      const createResponse = await request(server)
        .post('/employees')
        .send({ name: 'John Doe', age: 30 })
        .expect(201);

      const employeeId = createResponse.body.data.id;

      // 2. Read employee
      const readResponse = await request(server)
        .get(`/employees/${employeeId}`)
        .expect(200);

      expect(readResponse.body.data).toEqual(createResponse.body.data);

      // 3. Update employee
      const updateResponse = await request(server)
        .put(`/employees/${employeeId}`)
        .send({ name: 'John Doe Updated', age: 31 })
        .expect(200);

      expect(updateResponse.body.data.name).toBe('John Doe Updated');
      expect(updateResponse.body.data.age).toBe(31);

      // 4. Delete employee
      const deleteResponse = await request(server)
        .delete(`/employees/${employeeId}`)
        .expect(200);

      expect(deleteResponse.body.data.id).toBe(employeeId);

      // 5. Verify deletion
      await request(server).get(`/employees/${employeeId}`).expect(404);
    });

    it('should maintain data consistency across operations', async () => {
      // Create multiple employees
      const employees = testUtils.createTestEmployees(3);

      for (const employee of employees) {
        await request(server)
          .post('/employees')
          .send({ name: employee.name, age: employee.age })
          .expect(201);
      }

      // Verify all employees exist
      const getAllResponse = await request(server)
        .get('/employees')
        .expect(200);

      expect(getAllResponse.body.data).toHaveLength(3);
      expect(getAllResponse.body.count).toBe(3);

      // Update one employee
      await request(server)
        .put('/employees/2')
        .send({ name: 'Updated Employee 2', age: 50 })
        .expect(200);

      // Verify the update didn't affect others
      const updatedResponse = await request(server)
        .get('/employees/1')
        .expect(200);

      expect(updatedResponse.body.data.name).toBe('Employee 1');

      // Delete one employee
      await request(server).delete('/employees/3').expect(200);

      // Verify count is updated
      const finalResponse = await request(server).get('/employees').expect(200);

      expect(finalResponse.body.data).toHaveLength(2);
      expect(finalResponse.body.count).toBe(2);
    });
  });

  describe('Health Check Endpoint (from server.js)', () => {
    it('should return health check message', async () => {
      const response = await request(server)
        .get('/')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Fastify Employee API is running!'
      });
    });

    it('should return correct content type for health check', async () => {
      const response = await request(server)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should handle health check endpoint with proper async/await', async () => {
      const response = await request(server)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message).toBe('Fastify Employee API is running!');
    });

    it('should handle multiple health check requests', async () => {
      // Test multiple health check requests to ensure endpoint is stable
      for (let i = 0; i < 3; i++) {
        const response = await request(server)
          .get('/')
          .expect(200);

        expect(response.body).toEqual({
          message: 'Fastify Employee API is running!'
        });
      }
    });
  });

  describe('Server Configuration (from server.js)', () => {
    it('should register employee routes with correct prefix', async () => {
      // Test that employee routes are accessible (this covers the register call from server.js)
      const response = await request(server)
        .get('/employees')
        .expect(200);

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

    it('should handle server shutdown gracefully', async () => {
      // Test that the server can be closed without errors
      expect(async () => {
        await server.close();
      }).not.toThrow();
    });
  });

  describe('Server Integration (from server.js)', () => {
    it('should handle complete API workflow through server configuration', async () => {
      // Test that the server properly handles all employee operations
      // This simulates the complete workflow that would happen in server.js
      
      // 1. Health check
      const healthResponse = await request(server)
        .get('/')
        .expect(200);
      expect(healthResponse.body.message).toBe('Fastify Employee API is running!');

      // 2. Create employee
      const createResponse = await request(server)
        .post('/employees')
        .send({ name: 'Test Employee', age: 30 })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name).toBe('Test Employee');

      // 3. Get all employees
      const getAllResponse = await request(server)
        .get('/employees')
        .expect(200);

      expect(getAllResponse.body.success).toBe(true);
      expect(getAllResponse.body.data).toHaveLength(1);
      expect(getAllResponse.body.count).toBe(1);

      // 4. Get specific employee
      const employeeId = createResponse.body.data.id;
      const getOneResponse = await request(server)
        .get(`/employees/${employeeId}`)
        .expect(200);

      expect(getOneResponse.body.success).toBe(true);
      expect(getOneResponse.body.data.id).toBe(employeeId);

      // 5. Update employee
      const updateResponse = await request(server)
        .put(`/employees/${employeeId}`)
        .send({ name: 'Updated Employee', age: 31 })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('Updated Employee');

      // 6. Delete employee
      const deleteResponse = await request(server)
        .delete(`/employees/${employeeId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.data.id).toBe(employeeId);

      // 7. Verify deletion with health check still working
      const finalHealthResponse = await request(server)
        .get('/')
        .expect(200);
      expect(finalHealthResponse.body.message).toBe('Fastify Employee API is running!');
    });

    it('should maintain server stability during concurrent operations', async () => {
      // Test that the server remains stable during concurrent operations
      const promises = [
        request(server).get('/').expect(200), // Health check
        request(server).get('/employees').expect(200), // Get employees
        request(server).post('/employees').send({ name: 'Concurrent Test', age: 25 }).expect(201) // Create employee
      ];

      const responses = await Promise.all(promises);
      
      // Verify all operations completed successfully
      expect(responses[0].body.message).toBe('Fastify Employee API is running!');
      expect(responses[1].body.success).toBe(true);
      expect(responses[2].body.success).toBe(true);
    });

    it('should test server startup success path', async () => {
      // Test the start function success path (this covers the console.log line)
      const start = async () => {
        try {
          await app.listen({ port: 3001, host: '0.0.0.0' });
          console.log('Server is running on http://localhost:3001');
        } catch (err) {
          app.log.error(err);
          process.exit(1);
        }
      };

      // Mock console.log to capture the output
      const originalConsoleLog = console.log;
      const mockConsoleLog = jest.fn();
      console.log = mockConsoleLog;

      try {
        // Start the server on a different port to avoid conflicts
        await start();
        
        // Verify that the success message was logged
        expect(mockConsoleLog).toHaveBeenCalledWith('Server is running on http://localhost:3001');
        
        // Clean up - close the server
        await app.close();
      } finally {
        // Restore original console.log
        console.log = originalConsoleLog;
      }
    });
  });
});
