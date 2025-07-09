// Test file specifically for app.js coverage
const originalConsoleWarn = console.warn;
let mockConsoleWarn;

describe('App.js Coverage', () => {
  beforeEach(() => {
    mockConsoleWarn = jest.fn();
    console.warn = mockConsoleWarn;
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should handle setErrorHandler failure and call console.warn', () => {
    // Mock fastify to throw an error when setErrorHandler is called
    const mockFastify = {
      register: jest.fn(),
      listen: jest.fn().mockResolvedValue(),
      log: { error: jest.fn() },
      setErrorHandler: jest.fn(() => {
        throw new Error('setErrorHandler failed');
      }),
      get: jest.fn(),
    };

    jest.doMock('fastify', () => jest.fn(() => mockFastify));
    jest.resetModules();

    // This should trigger the catch block in app.js line 79
    require('../app');

    expect(mockConsoleWarn).toHaveBeenCalledWith('Custom error handler could not be set');
  });
}); 