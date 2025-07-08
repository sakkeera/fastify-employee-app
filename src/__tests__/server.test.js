const request = require('supertest');
const Fastify = require('fastify');

// Mock console.log and process.exit to prevent actual server startup
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalProcessExit = process.exit;

describe('Server', () => {
  let mockConsoleLog;
  let mockConsoleWarn;
  let mockProcessExit;

  beforeEach(() => {
    // Mock console.log, console.warn and process.exit
    mockConsoleLog = jest.fn();
    mockConsoleWarn = jest.fn();
    mockProcessExit = jest.fn();
    console.log = mockConsoleLog;
    console.warn = mockConsoleWarn;
    process.exit = mockProcessExit;
  });

  afterEach(() => {
    // Restore original functions
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    process.exit = originalProcessExit;
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('Server Startup and Configuration', () => {
    it('should start server successfully', async () => {
      const mockFastify = {
        register: jest.fn(),
        listen: jest.fn().mockResolvedValue(),
        log: { error: jest.fn() },
        setErrorHandler: jest.fn(),
      };

      jest.doMock('fastify', () => jest.fn(() => mockFastify));
      jest.resetModules();

      require('../server');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockFastify.setErrorHandler).toHaveBeenCalled();
      expect(mockFastify.register).toHaveBeenCalledWith(
        expect.any(Function),
        { prefix: '/employees' }
      );
      expect(mockFastify.listen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0'
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('Server is running on http://localhost:3000');
      expect(mockProcessExit).not.toHaveBeenCalled();
    });

    it('should handle server startup errors', async () => {
      const mockError = new Error('Port already in use');
      const mockFastify = {
        register: jest.fn(),
        listen: jest.fn().mockRejectedValue(mockError),
        log: { error: jest.fn() },
        setErrorHandler: jest.fn(),
      };

      jest.doMock('fastify', () => jest.fn(() => mockFastify));
      jest.resetModules();

      require('../server');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockFastify.log.error).toHaveBeenCalledWith(mockError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should handle setErrorHandler failure gracefully', async () => {
      const mockFastify = {
        register: jest.fn(),
        listen: jest.fn().mockResolvedValue(),
        log: { error: jest.fn() },
        setErrorHandler: jest.fn(() => {
          throw new Error('setErrorHandler failed');
        }),
      };

      jest.doMock('fastify', () => jest.fn(() => mockFastify));
      jest.resetModules();

      require('../server');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockConsoleWarn).toHaveBeenCalledWith('Custom error handler could not be set');
      expect(mockFastify.register).toHaveBeenCalled();
      expect(mockFastify.listen).toHaveBeenCalled();
    });

    it('should create fastify instance with correct configuration', () => {
      const mockFastify = jest.fn(() => ({
        register: jest.fn(),
        listen: jest.fn().mockResolvedValue(),
        log: { error: jest.fn() },
        setErrorHandler: jest.fn(),
      }));

      jest.doMock('fastify', () => mockFastify);
      jest.resetModules();

      require('../server');

      expect(mockFastify).toHaveBeenCalledWith({
        logger: true,
        ajv: {
          customOptions: {
            allErrors: true,
          }
        },
        disableRequestLogging: false
      });
    });
  });

  describe('Error Handler Coverage', () => {
    let mockFastify;
    let errorHandler;

    beforeEach(() => {
      mockFastify = {
        register: jest.fn(),
        listen: jest.fn().mockResolvedValue(),
        log: { error: jest.fn() },
        setErrorHandler: jest.fn((handler) => {
          errorHandler = handler;
        }),
      };

      jest.doMock('fastify', () => jest.fn(() => mockFastify));
      jest.resetModules();
      require('../server');
    });

    it('should handle validation errors with age minimum validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/age',
            keyword: 'minimum',
            params: { limit: 5 }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Age must be between 5 and 95 years'
      });
    });

    it('should handle validation errors with age maximum validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/age',
            keyword: 'maximum',
            params: { limit: 95 }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Age must be between 5 and 95 years'
      });
    });

    it('should handle validation errors with age type validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/age',
            keyword: 'type',
            params: { type: 'integer' }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Age must be between 5 and 95 years'
      });
    });

    it('should handle validation errors with age multipleOf validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/age',
            keyword: 'multipleOf',
            params: { multipleOf: 1 }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Age must be between 5 and 95 years'
      });
    });

    it('should handle validation errors with id minimum validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/id',
            keyword: 'minimum',
            params: { limit: 1 }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'ID must be at least 1'
      });
    });

    it('should handle validation errors with other field minimum validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/name',
            keyword: 'minimum',
            params: { limit: 1 }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'name must be at least 1'
      });
    });

    it('should handle validation errors with maximum validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/id',
            keyword: 'maximum',
            params: { limit: 1000 }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'id must be at most 1000'
      });
    });

    it('should handle validation errors with type validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/name',
            keyword: 'type',
            params: { type: 'string' }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'name must be a string'
      });
    });

    it('should handle validation errors with required validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '',
            keyword: 'required',
            params: { missingProperty: 'name' }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'name is required'
      });
    });

    it('should handle validation errors with minLength validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/name',
            keyword: 'minLength',
            params: { limit: 1 }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'name cannot be empty'
      });
    });

    it('should handle validation errors with multipleOf validation', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/id',
            keyword: 'multipleOf',
            params: { multipleOf: 1 }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'id must be a whole number'
      });
    });

    it('should handle validation errors with unknown keyword', () => {
      const mockError = {
        validation: [
          {
            instancePath: '/name',
            keyword: 'custom',
            params: {}
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid name'
      });
    });

    it('should handle validation errors with empty instancePath', () => {
      const mockError = {
        validation: [
          {
            instancePath: '',
            keyword: 'type',
            params: { type: 'object' }
          }
        ]
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'data must be a object'
      });
    });

    it('should handle validation errors with empty validation array', () => {
      const mockError = {
        validation: []
      };
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed'
      });
    });

    it('should handle non-validation errors', () => {
      const mockError = new Error('Internal server error');
      const mockReply = {
        code: jest.fn().mockReturnThis(),
        send: jest.fn()
      };

      errorHandler(mockError, {}, mockReply);

      expect(mockFastify.log.error).toHaveBeenCalledWith(mockError);
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('Health Check Endpoint and Integration', () => {
    let app;
    let server;

    beforeEach(async () => {
      app = Fastify({ 
        logger: false,
        ajv: {
          customOptions: {
            allErrors: true,
          }
        }
      });

      // Set up error handler like in server.js
      app.setErrorHandler((error, request, reply) => {
        if (error.validation) {
          const validationErrors = error.validation;
          let errorMessage = 'Validation failed';
          
          if (validationErrors.length > 0) {
            const firstError = validationErrors[0];
            const field = firstError.instancePath.replace('/', '') || firstError.params.missingProperty || 'data';
            
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
        
        return reply.code(500).send({
          success: false,
          message: 'Internal server error'
        });
      });

      app.register(require('../routes/employee'), { prefix: '/employees' });

      await app.ready();
      server = app.server;
    });

    afterEach(async () => {
      if (server) {
        await server.close();
      }
    });

    it('should handle complete server workflow', async () => {
      const response = await request(server).get('/employees').expect(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
    });
  });

  describe('Module Loading and Error Paths', () => {
    it('should handle different server startup error types', async () => {
      const mockError = new TypeError('Network connection failed');
      const mockFastify = {
        register: jest.fn(),
        listen: jest.fn().mockRejectedValue(mockError),
        log: { error: jest.fn() },
        setErrorHandler: jest.fn(),
      };

      jest.doMock('fastify', () => jest.fn(() => mockFastify));
      jest.resetModules();

      require('../server');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockFastify.log.error).toHaveBeenCalledWith(mockError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('should execute all server initialization code', () => {
      const mockFastify = {
        register: jest.fn(),
        listen: jest.fn().mockResolvedValue(),
        log: { error: jest.fn() },
        setErrorHandler: jest.fn(),
      };

      const fastifyConstructor = jest.fn(() => mockFastify);
      jest.doMock('fastify', () => fastifyConstructor);
      jest.resetModules();

      require('../server');

      expect(fastifyConstructor).toHaveBeenCalledWith({
        logger: true,
        ajv: {
          customOptions: {
            allErrors: true,
          }
        },
        disableRequestLogging: false
      });
      expect(mockFastify.setErrorHandler).toHaveBeenCalled();
      expect(mockFastify.register).toHaveBeenCalledWith(
        expect.any(Function),
        { prefix: '/employees' }
      );
      expect(mockFastify.listen).toHaveBeenCalledWith({
        port: 3000,
        host: '0.0.0.0'
      });
    });
  });
});
