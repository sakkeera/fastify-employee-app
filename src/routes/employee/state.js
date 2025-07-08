// In-memory state for employees
let employees = [];
let nextId = 1;

module.exports = {
  getEmployees: () => employees,
  setEmployees: (arr) => { employees = arr; },
  getNextId: () => nextId,
  setNextId: (val) => { nextId = val; },
  reset: () => {
    employees = [];
    nextId = 1;
  }
}; 