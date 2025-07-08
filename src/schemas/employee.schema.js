const employeeSchema = {
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

module.exports = { employeeSchema }; 