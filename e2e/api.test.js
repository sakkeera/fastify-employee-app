const request = require('supertest');
const fastify = require('../src/app.js');

describe('Fastify Employee API - Comprehensive System Tests', () => {
  // Test creating an employee
  describe('POST /employees - Create Employee', () => {
    test('should create a new employee with auto-generated ID', async () => {
      const newEmployee = {
        name: 'John Doe',
        age: 30
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(newEmployee)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Employee created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.age).toBe(30);
    });

    test('should create a new employee with custom ID', async () => {
      const uniqueId = Math.floor(Math.random() * 1000000) + 10000;
      const newEmployee = {
        id: uniqueId,
        name: 'Jane Smith',
        age: 25
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(newEmployee)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Employee created successfully',
        data: newEmployee
      });
    });

    test('should reject duplicate employee ID', async () => {
      const uniqueId = Math.floor(Math.random() * 1000000) + 20000;
      const employee = {
        id: uniqueId,
        name: 'Duplicate Test',
        age: 30
      };

      // Create first employee
      await request('http://localhost:3000')
        .post('/employees')
        .send(employee)
        .expect(201);

      // Try to create duplicate
      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(employee)
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        message: `Employee with ID ${uniqueId} already exists`
      });
    });

    test('should reject missing name field', async () => {
      const invalidEmployee = {
        age: 30
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('name is required');
    });

    test('should reject missing age field', async () => {
      const invalidEmployee = {
        name: 'John Doe'
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('age is required');
    });

    test('should reject empty name string', async () => {
      const invalidEmployee = {
        name: '',
        age: 30
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('name cannot be empty');
    });

    test('should reject age below minimum (5)', async () => {
      const invalidEmployee = {
        name: 'Too Young',
        age: 4
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    test('should reject age above maximum (95)', async () => {
      const invalidEmployee = {
        name: 'Too Old',
        age: 100
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    test('should reject age as string', async () => {
      const invalidEmployee = {
        name: 'Invalid Age',
        age: 'thirty'
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    test('should reject decimal age', async () => {
      const invalidEmployee = {
        name: 'Decimal Age',
        age: 25.5
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });

    test('should reject negative custom ID', async () => {
      const invalidEmployee = {
        id: -1,
        name: 'Negative ID',
        age: 30
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('ID must be at least 1');
    });

    test('should reject zero as custom ID', async () => {
      const invalidEmployee = {
        id: 0,
        name: 'Zero ID',
        age: 30
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('ID must be at least 1');
    });

    test('should reject decimal custom ID', async () => {
      const invalidEmployee = {
        id: 2.5,
        name: 'Decimal ID',
        age: 30
      };

      const response = await request('http://localhost:3000')
        .post('/employees')
        .send(invalidEmployee)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('id must be a whole number');
    });
  });

  // Test listing all employees
  describe('GET /employees - List All Employees', () => {
    test('should list all employees (empty initially)', async () => {
      const response = await request('http://localhost:3000')
        .get('/employees')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Employees retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
      // Note: We can't guarantee empty array due to test order, but we can check structure
    });

    test('should list all employees with multiple records', async () => {
      // Create multiple employees
      await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Employee 1', age: 25 });

      await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Employee 2', age: 30 });

      const response = await request('http://localhost:3000')
        .get('/employees')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Employees retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  // Test getting employee by ID
  describe('GET /employees/:id - Get Employee by ID', () => {
    test('should get employee by valid ID', async () => {
      // First create an employee
      const createResponse = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'John Doe', age: 30 });

      const employeeId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request('http://localhost:3000')
        .get(`/employees/${employeeId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Employee retrieved successfully',
        data: {
          id: employeeId,
          name: 'John Doe',
          age: 30
        }
      });
    });

    test('should return 404 for non-existent employee', async () => {
      const response = await request('http://localhost:3000')
        .get('/employees/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Employee not found'
      });
    });

    test('should return 400 for invalid ID format (string)', async () => {
      const response = await request('http://localhost:3000')
        .get('/employees/abc')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid ID format. ID must be a number.'
      });
    });

    test('should return 400 for invalid ID format (decimal)', async () => {
      const response = await request('http://localhost:3000')
        .get('/employees/1.5')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid ID format. ID must be a number.'
      });
    });
  });

  // Test updating an employee
  describe('PUT /employees/:id - Update Employee', () => {
    test('should update an existing employee', async () => {
      // First create an employee
      const createResponse = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Jane Smith', age: 25 });

      const employeeId = createResponse.body.data.id;

      // Then update it
      const updateData = {
        name: 'Jane Smith Updated',
        age: 26
      };

      const response = await request('http://localhost:3000')
        .put(`/employees/${employeeId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Employee updated successfully',
        data: {
          id: employeeId,
          ...updateData
        }
      });
    });

    test('should return 404 for non-existent employee', async () => {
      const response = await request('http://localhost:3000')
        .put('/employees/999')
        .send({ name: 'Not Found', age: 30 })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Employee not found'
      });
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request('http://localhost:3000')
        .put('/employees/abc')
        .send({ name: 'Invalid ID', age: 30 })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid ID format. ID must be a number.'
      });
    });

    test('should reject missing name in update', async () => {
      // First create an employee
      const createResponse = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Test Employee', age: 30 });

      const employeeId = createResponse.body.data.id;

      // Then try to update without name
      const response = await request('http://localhost:3000')
        .put(`/employees/${employeeId}`)
        .send({ age: 31 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('name is required');
    });

    test('should reject missing age in update', async () => {
      // First create an employee
      const createResponse = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Test Employee', age: 30 });

      const employeeId = createResponse.body.data.id;

      // Then try to update without age
      const response = await request('http://localhost:3000')
        .put(`/employees/${employeeId}`)
        .send({ name: 'Updated Name' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('age is required');
    });

    test('should reject invalid age in update', async () => {
      // First create an employee
      const createResponse = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Test Employee', age: 30 });

      const employeeId = createResponse.body.data.id;

      // Then try to update with invalid age
      const response = await request('http://localhost:3000')
        .put(`/employees/${employeeId}`)
        .send({ name: 'Updated Name', age: 150 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Age must be between 5 and 95 years');
    });
  });

  // Test deleting an employee
  describe('DELETE /employees/:id - Delete Employee', () => {
    test('should delete an existing employee', async () => {
      // First create an employee
      const createResponse = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Delete Me', age: 35 });

      const employeeId = createResponse.body.data.id;

      // Then delete it
      const response = await request('http://localhost:3000')
        .delete(`/employees/${employeeId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Employee deleted successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(employeeId);

      // Verify it's deleted
      await request('http://localhost:3000')
        .get(`/employees/${employeeId}`)
        .expect(404);
    });

    test('should return 404 for non-existent employee', async () => {
      const response = await request('http://localhost:3000')
        .delete('/employees/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Employee not found'
      });
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request('http://localhost:3000')
        .delete('/employees/abc')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid ID format. ID must be a number.'
      });
    });
  });

  // Test complete CRUD workflow
  describe('Complete CRUD Workflow', () => {
    test('should handle complete CRUD workflow', async () => {
      // 1. Create employee
      const createResponse = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Workflow Test', age: 28 })
        .expect(201);

      const employeeId = createResponse.body.data.id;

      // 2. Read employee
      const readResponse = await request('http://localhost:3000')
        .get(`/employees/${employeeId}`)
        .expect(200);

      expect(readResponse.body.data.name).toBe('Workflow Test');

      // 3. Update employee
      const updateResponse = await request('http://localhost:3000')
        .put(`/employees/${employeeId}`)
        .send({ name: 'Workflow Updated', age: 29 })
        .expect(200);

      expect(updateResponse.body.data.name).toBe('Workflow Updated');

      // 4. Verify update persisted
      const verifyResponse = await request('http://localhost:3000')
        .get(`/employees/${employeeId}`)
        .expect(200);

      expect(verifyResponse.body.data.name).toBe('Workflow Updated');
      expect(verifyResponse.body.data.age).toBe(29);

      // 5. Delete employee
      await request('http://localhost:3000')
        .delete(`/employees/${employeeId}`)
        .expect(200);

      // 6. Verify deletion
      await request('http://localhost:3000')
        .get(`/employees/${employeeId}`)
        .expect(404);
    });

    test('should handle multiple employees correctly', async () => {
      // Create multiple employees
      const employees = [];
      for (let i = 1; i <= 3; i++) {
        const response = await request('http://localhost:3000')
          .post('/employees')
          .send({ name: `Employee ${i}`, age: 20 + i });
        employees.push(response.body.data);
      }

      // Verify all exist
      const allResponse = await request('http://localhost:3000')
        .get('/employees')
        .expect(200);

      expect(allResponse.body.count).toBeGreaterThanOrEqual(3);

      // Update one
      const updateResponse = await request('http://localhost:3000')
        .put(`/employees/${employees[1].id}`)
        .send({ name: 'Updated Employee 2', age: 50 })
        .expect(200);

      expect(updateResponse.body.data.name).toBe('Updated Employee 2');

      // Delete another
      await request('http://localhost:3000')
        .delete(`/employees/${employees[2].id}`)
        .expect(200);

      // Verify final state
      const finalResponse = await request('http://localhost:3000')
        .get('/employees')
        .expect(200);

      expect(finalResponse.body.count).toBeGreaterThanOrEqual(2);
    });
  });

  // Test edge cases and boundary values
  describe('Edge Cases and Boundary Values', () => {
    test('should handle minimum age (5)', async () => {
      const response = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Min Age', age: 5 })
        .expect(201);

      expect(response.body.data.age).toBe(5);
    });

    test('should handle maximum age (95)', async () => {
      const response = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'Max Age', age: 95 })
        .expect(201);

      expect(response.body.data.age).toBe(95);
    });

    test('should handle large ID numbers', async () => {
      const uniqueLargeId = Math.floor(Math.random() * 1000000000) + 900000000;
      const response = await request('http://localhost:3000')
        .post('/employees')
        .send({ id: uniqueLargeId, name: 'Large ID', age: 30 })
        .expect(201);

      expect(response.body.data.id).toBe(uniqueLargeId);
    });

    test('should handle Unicode names correctly', async () => {
      const response = await request('http://localhost:3000')
        .post('/employees')
        .send({ name: 'José María Azñár 中文', age: 30 })
        .expect(201);

      expect(response.body.data.name).toBe('José María Azñár 中文');
    });
  });
}); 