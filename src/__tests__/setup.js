// Jest setup file for Fastify Employee API tests

// Set test timeout to 10 seconds
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Helper to create a test employee object
  createTestEmployee: (id = 1, name = 'Test Employee', age = 25) => ({
    id,
    name,
    age,
  }),

  // Helper to create multiple test employees
  createTestEmployees: (count = 3) => {
    const employees = [];
    for (let i = 1; i <= count; i++) {
      employees.push({
        id: i,
        name: `Employee ${i}`,
        age: 20 + i,
      });
    }
    return employees;
  },

  // Helper to validate API response format
  validateApiResponse: (response, expectedSuccess = true) => {
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(expectedSuccess);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');

    if (expectedSuccess) {
      expect(response.body).toHaveProperty('data');
    }
  },
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
