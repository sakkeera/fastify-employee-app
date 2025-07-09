# Fastify Employee API

A high-performance REST API built with Fastify for managing employee records with in-memory storage, comprehensive validation, and robust error handling.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation & Setup
```bash
# Clone the repository
git clone <repository-url>
cd fastify-employee-app

# Install dependencies
npm install

# Start the server
npm start
```

The server will start on `http://localhost:3000`

### Available Scripts
```bash
npm start          # Start the server
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:verbose  # Run tests with verbose output
```

## 📋 API Documentation

### Base URL
```
http://localhost:3000
```

### Response Format
All API responses follow a consistent JSON structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": {}, // or [] for arrays
  "count": 0  // Only for GET /employees
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

### Employee Schema
```json
{
  "id": 1,           // number (auto-generated or custom, minimum: 1)
  "name": "string",  // string (required, minimum length: 1)
  "age": 30          // integer (required, between 5-95)
}
```

---

## 🔗 API Endpoints

### 1. Health Check
**GET** `/`

Check if the API is running.

**Response (200):**
```json
{
  "message": "Fastify Employee API is running!"
}
```

---

### 2. Get All Employees
**GET** `/employees`

Retrieve all employee records.

**Response (200):**
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "age": 30
    }
  ],
  "count": 1
}
```

---

### 3. Get Employee by ID
**GET** `/employees/:id`

Retrieve a specific employee by ID.

**Parameters:**
- `id` (path): Employee ID (must be a positive integer)

**Response (200):**
```json
{
  "success": true,
  "message": "Employee retrieved successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "age": 30
  }
}
```

**Error Responses:**
- `400`: Invalid ID format
- `404`: Employee not found

---

### 4. Create Employee
**POST** `/employees`

Create a new employee record.

**Request Body:**
```json
{
  "id": 1,           // optional (auto-generated if not provided)
  "name": "John Doe", // required
  "age": 30          // required
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "age": 30
  }
}
```

**Error Responses:**
- `400`: Validation errors
- `409`: Employee ID already exists

---

### 5. Update Employee
**PUT** `/employees/:id`

Update an existing employee record.

**Parameters:**
- `id` (path): Employee ID

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "age": 31
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "age": 31
  }
}
```

**Error Responses:**
- `400`: Invalid ID format or validation errors
- `404`: Employee not found

---

### 6. Delete Employee
**DELETE** `/employees/:id`

Delete an employee record.

**Parameters:**
- `id` (path): Employee ID

**Response (200):**
```json
{
  "success": true,
  "message": "Employee deleted successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "age": 30
  }
}
```

**Error Responses:**
- `400`: Invalid ID format
- `404`: Employee not found

---

## ⚠️ Validation & Error Handling

### Field Validation Rules

| Field | Type | Rules | Error Message |
|-------|------|-------|---------------|
| `id` | number | Optional, minimum: 1, integer | "ID must be at least 1" |
| `name` | string | Required, minimum length: 1 | "name is required" / "name cannot be empty" |
| `age` | integer | Required, between 5-95 | "Age must be between 5 and 95 years" |

### Common Error Scenarios

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Age must be between 5 and 95 years"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Employee not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Employee with ID 1 already exists"
}
```

### Validation Features
- **AJV Schema Validation**: Comprehensive input validation with custom error messages
- **Age Validation**: Unified error message for all age-related validation failures
- **ID Validation**: Strict integer validation for IDs
- **Name Validation**: Prevents empty strings and null values
- **Type Safety**: Ensures proper data types for all fields

---

## 🧪 Testing

The project includes comprehensive test coverage (100%) with Jest and Supertest.

### Test Categories
- **Unit Tests**: Individual function testing
- **Integration Tests**: Complete API workflow testing
- **Validation Tests**: All validation scenarios
- **Error Handling Tests**: All error conditions
- **Server Tests**: Server startup and configuration

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run with verbose output
npm run test:verbose
```

### Test Coverage
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%

---

## 🏗️ Project Structure

```
fastify-employee-app/
├── src/
│   ├── routes/
│   │   └── employee/
│   │       ├── index.js           # Employee route handlers
│   │       └── state.js           # In-memory state management
│   ├── schemas/
│   │   └── employee.schema.js     # AJV validation schemas
│   ├── __tests__/
│   │   ├── routes/
│   │   │   └── employee/
│   │   │       └── index.test.js  # Employee route tests
│   │   ├── server.test.js         # Server configuration tests
│   │   ├── server.coverage.test.js # Additional coverage tests
│   │   └── setup.js               # Test utilities and setup
│   └── server.js                  # Main server file
├── coverage/                      # Test coverage reports
├── node_modules/                  # Dependencies
├── package.json                   # Project configuration
├── package-lock.json             # Dependency lock file
└── README.md                     # This file
```

### Key Components

#### Server (`src/server.js`)
- Fastify instance configuration
- AJV validation setup
- Custom error handler
- Route registration
- Server startup logic

#### Routes (`src/routes/employee/index.js`)
- Complete CRUD operations
- Input validation
- Error handling
- Business logic

#### State Management (`src/routes/employee/state.js`)
- In-memory data storage
- Employee array management
- ID generation
- State reset functionality

#### Schemas (`src/schemas/employee.schema.js`)
- AJV validation schemas
- Field definitions
- Validation rules

#### Tests (`src/__tests__/`)
- Comprehensive test suite
- 100% code coverage
- Integration and unit tests
- Test utilities

---

## 🔧 Technical Features

### Performance
- **Fastify Framework**: High-performance web framework
- **In-Memory Storage**: Fast data access
- **Efficient Validation**: AJV schema validation
- **Minimal Dependencies**: Lightweight implementation

### Reliability
- **Comprehensive Error Handling**: All error scenarios covered
- **Input Validation**: Strict validation rules
- **Type Safety**: Proper data type enforcement
- **Consistent Responses**: Standardized response format

### Developer Experience
- **100% Test Coverage**: Comprehensive testing
- **Clear Documentation**: Detailed API documentation
- **Consistent Code Style**: Well-organized codebase
- **Easy Setup**: Simple installation and startup

### Security
- **Input Sanitization**: Prevents malicious input
- **Type Validation**: Ensures data integrity
- **Error Message Standardization**: Prevents information leakage
- **Request Validation**: Comprehensive request validation

---

## 📦 Dependencies

### Production Dependencies
- **fastify**: ^5.4.0 - High-performance web framework
- **ajv**: ^8.17.1 - JSON Schema validator
- **ajv-errors**: ^3.0.0 - Custom error messages for AJV

### Development Dependencies
- **jest**: ^29.7.0 - Testing framework
- **supertest**: ^6.3.3 - HTTP assertion library

---

## 🔄 API Usage Examples

### Complete CRUD Workflow

```bash
# 1. Health Check
curl http://localhost:3000

# 2. Create Employee
curl -X POST http://localhost:3000/employees \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "age": 30}'

# 3. Get All Employees
curl http://localhost:3000/employees

# 4. Get Employee by ID
curl http://localhost:3000/employees/1

# 5. Update Employee
curl -X PUT http://localhost:3000/employees/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe Updated", "age": 31}'

# 6. Delete Employee
curl -X DELETE http://localhost:3000/employees/1

# 7. Verify Deletion
curl http://localhost:3000/employees
```

### Postman Collection

Import the following into Postman for easy testing:

1. **Health Check**: `GET http://localhost:3000`
2. **Get All**: `GET http://localhost:3000/employees`
3. **Create**: `POST http://localhost:3000/employees`
4. **Get One**: `GET http://localhost:3000/employees/1`
5. **Update**: `PUT http://localhost:3000/employees/1`
6. **Delete**: `DELETE http://localhost:3000/employees/1`

---

## 🚨 Error Handling

The API implements comprehensive error handling with specific error messages:

### Validation Errors
- **Missing Fields**: "name is required", "age is required"
- **Invalid Types**: "age must be a integer", "name must be a string"
- **Range Violations**: "Age must be between 5 and 95 years"
- **Format Errors**: "ID must be at least 1", "name cannot be empty"

### Business Logic Errors
- **Not Found**: "Employee not found"
- **Duplicate ID**: "Employee with ID X already exists"
- **Invalid Format**: "Invalid ID format. ID must be a number."

### Server Errors
- **Internal Errors**: "Internal server error"
- **Startup Errors**: Logged with process exit

---

## 🎯 Development Notes

### In-Memory Storage
- Data is stored in memory and will be lost on server restart
- Suitable for development and testing
- Can be easily replaced with persistent storage

### Auto-Generated IDs
- IDs are auto-generated starting from 1
- Custom IDs can be provided during creation
- ID uniqueness is enforced

### Validation Strategy
- Server-side validation using AJV
- Comprehensive error messages
- Type safety enforcement
- Input sanitization

---

## 📈 Future Enhancements

- Database integration (PostgreSQL, MongoDB)
- Authentication and authorization
- Pagination for large datasets
- Sorting and filtering
- Bulk operations
- API versioning
- Rate limiting
- Logging and monitoring
- Docker containerization
- API documentation with Swagger/OpenAPI

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Support

For questions or issues, please create an issue in the repository or contact the development team. 