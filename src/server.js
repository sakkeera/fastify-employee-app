const fastify = require('fastify')({ 
  logger: true,
  ajv: {
    customOptions: {
      allErrors: true,
    }
  },
  disableRequestLogging: false
});

// Custom error handler for validation errors
try {
  fastify.setErrorHandler((error, request, reply) => {
    // Log the error for debugging
    fastify.log.error(error);
    
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
  console.warn('Custom error handler could not be set');
}

// Register employee routes
fastify.register(require('./routes/employee'), { prefix: '/employees' });

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
