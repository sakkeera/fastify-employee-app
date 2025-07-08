const state = require('./state');

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
      return reply.code(400).send({ error: 'Invalid ID format. ID must be a number.' });
    }
    const employeeId = parseInt(id);
    const employees = state.getEmployees();
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) {
      return reply.code(404).send({ error: 'Employee not found' });
    }
    return {
      success: true,
      message: 'Employee retrieved successfully',
      data: employee
    };
  });

  // POST create new employee
  fastify.post('/', async (request, reply) => {
    const { id, name, age } = request.body;
    if (!name || age === undefined) {
      return reply.code(400).send({ error: 'Missing required fields: name and age are required' });
    }
    if (typeof age !== 'number' || age <= 0 || !Number.isInteger(age)) {
      return reply.code(400).send({ error: 'Age must be a positive integer' });
    }
    let employeeId;
    if (id !== undefined) {
      if (isNaN(Number(id)) || Number(id) <= 0 || !Number.isInteger(Number(id))) {
        return reply.code(400).send({ error: 'ID must be a positive integer' });
      }
      employeeId = Number(id);
      const employees = state.getEmployees();
      const existingEmployee = employees.find(emp => emp.id === employeeId);
      if (existingEmployee) {
        return reply.code(409).send({ error: `Employee with ID ${employeeId} already exists` });
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
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, age } = request.body;
    if (!/^\d+$/.test(id)) {
      return reply.code(400).send({ error: 'Invalid ID format. ID must be a number.' });
    }
    const employeeId = parseInt(id);
    if (!name || age === undefined) {
      return reply.code(400).send({ error: 'Missing required fields: name and age are required' });
    }
    if (typeof age !== 'number' || age <= 0 || !Number.isInteger(age)) {
      return reply.code(400).send({ error: 'Age must be a positive integer' });
    }
    const employees = state.getEmployees();
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
      return reply.code(404).send({ error: 'Employee not found' });
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
      return reply.code(400).send({ error: 'Invalid ID format. ID must be a number.' });
    }
    const employeeId = parseInt(id);
    const employees = state.getEmployees();
    const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
      return reply.code(404).send({ error: 'Employee not found' });
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