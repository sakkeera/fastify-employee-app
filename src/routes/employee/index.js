const state = require('./state');
const { employeeSchema } = require('../../schemas/employee.schema');

// Validation schemas
const updateEmployeeSchema = {
  type: 'object',
  required: ['name', 'age'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      description: 'Employee name'
    },
    age: {
      type: 'integer',
      minimum: 5,
      maximum: 95,
      description: 'Employee age (must be between 5 and 95)'
    }
  }
};

// Custom schema for POST that makes id optional
const createEmployeeSchema = {
  type: 'object',
  required: ['name', 'age'],
  properties: {
    id: { 
      type: 'number',
      minimum: 1,
      multipleOf: 1 // Ensures integer
    },
    name: { 
      type: 'string',
      minLength: 1 // Prevents empty strings
    },
    age: {
      type: 'integer',
      minimum: 5,
      maximum: 95,
    },
  },
  additionalProperties: false,
};

module.exports = function (fastify, opts, done) {
  // GET all employees
  fastify.get('/', async (request, reply) => {
    const employees = state.getEmployees();
    return {
      success: true,
      message: 'Employees retrieved successfully',
      data: employees,
      count: employees.length
    };
  });

      // GET employee by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    // Strict integer string check
    if (!/^\d+$/.test(id)) {
      return reply.code(400).send({ 
        success: false,
        message: 'Invalid ID format. ID must be a number.' 
      });
    }
    const employeeId = parseInt(id);
    const employees = state.getEmployees();
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
      return reply.code(404).send({ 
        success: false,
        message: 'Employee not found' 
      });
    }
    return {
      success: true,
      message: 'Employee retrieved successfully',
      data: employee
    };
  });

  // POST create new employee
  fastify.post('/', {
    schema: {
      body: createEmployeeSchema
    }
  }, async (request, reply) => {
    const { id, name, age } = request.body;
    
    let employeeId;
    if (id !== undefined) {
      employeeId = Number(id);
      const employees = state.getEmployees();
      const existingEmployee = employees.find(emp => emp.id === employeeId);
      if (existingEmployee) {
        return reply.code(409).send({ 
          success: false,
          message: `Employee with ID ${employeeId} already exists` 
        });
      }
    } else {
      employeeId = state.getNextId();
      state.setNextId(employeeId + 1);
    }
    
    const newEmployee = { id: employeeId, name, age };
    const employees = state.getEmployees();
    employees.push(newEmployee);
    state.setEmployees(employees);
    return reply.code(201).send({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee
    });
  });

  // PUT update employee
  fastify.put('/:id', {
    schema: {
      body: createEmployeeSchema
    }
  }, async (request, reply) => {
    const { id } = request.params;
    const { name, age } = request.body;
    
    if (!/^\d+$/.test(id)) {
      return reply.code(400).send({ 
        success: false,
        message: 'Invalid ID format. ID must be a number.' 
      });
    }
    
    const employeeId = parseInt(id);
    const employees = state.getEmployees();
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
      return reply.code(404).send({ 
        success: false,
        message: 'Employee not found' 
      });
    }
    
    employees[employeeIndex] = { ...employees[employeeIndex], name, age };
    state.setEmployees(employees);
    return {
      success: true,
      message: 'Employee updated successfully',
      data: employees[employeeIndex]
    };
  });

  // DELETE employee
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    if (!/^\d+$/.test(id)) {
      return reply.code(400).send({ 
        success: false,
        message: 'Invalid ID format. ID must be a number.' 
      });
    }
    const employeeId = parseInt(id);
    const employees = state.getEmployees();
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
      return reply.code(404).send({ 
        success: false,
        message: 'Employee not found' 
      });
    }
    const deletedEmployee = employees.splice(employeeIndex, 1)[0];
    state.setEmployees(employees);
    return {
      success: true,
      message: 'Employee deleted successfully',
      data: deletedEmployee
    };
  });

  done();
}; 