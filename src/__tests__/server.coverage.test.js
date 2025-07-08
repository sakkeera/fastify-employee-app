const path = require('path');

describe('Server Coverage', () => {
  let originalEnv;
  let originalExit;
  let exitMock;

  beforeAll(() => {
    originalEnv = { ...process.env };
    originalExit = process.exit;
    exitMock = jest.fn();
    process.exit = exitMock;
  });

  afterAll(() => {
    process.env = originalEnv;
    process.exit = originalExit;
  });

  it('should start and stop the server without errors', async () => {
    jest.resetModules();
    jest.doMock('fastify', () => {
      return () => ({
        register: jest.fn(),
        get: jest.fn(),
        listen: jest.fn().mockResolvedValue(),
        log: { error: jest.fn() },
      });
    });
    const serverPath = path.resolve(__dirname, '../server.js');
    require(serverPath);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(exitMock).not.toHaveBeenCalled();
  });

  it('should handle startup errors and exit process', async () => {
    jest.resetModules();
    jest.doMock('fastify', () => {
      return () => ({
        register: jest.fn(),
        get: jest.fn(),
        listen: jest.fn().mockRejectedValue(new Error('Startup error')),
        log: { error: jest.fn() },
      });
    });
    const serverPath = path.resolve(__dirname, '../server.js');
    require(serverPath);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(exitMock).toHaveBeenCalled();
  });
}); 