# Fastify Employee App (In-Memory)

A simple REST API built with Fastify for managing employee records with in-memory storage.

## 🚀 Run App

```bash
node src/server.js
```

The server will start on `http://localhost:3000`

## 📮 API Endpoints - Complete Postman Collection

### Base URL: `http://localhost:3000`

---

### 1. **Health Check**
- **Method:** `GET`
- **URL:** `http://localhost:3000`
- **Headers:** None required
- **Body:** None

**Expected Response:**
```json
{
  "message": "Fastify Employee API is running!"
}
```

---

### 2. **GET All Employees**
- **Method:** `GET`
- **URL:** `http://localhost:3000/employees`
- **Headers:** None required
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Sakkeer",
      "age": 28
    }
  ],
  "count": 1
}
```
*(Empty data array initially, will show all employees once you add some)*

---

### 3. **CREATE Employee (POST)**
- **Method:** `POST`
- **URL:** `http://localhost:3000/employees`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "name": "Sakkeer",
  "age": 28
}
```
*Note: You can optionally provide an `id` field to specify a custom ID*

**Expected Response (201 Created):**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": {
    "id": 1,
    "name": "Sakkeer",
    "age": 28
  }
}
```

---

### 4. **GET Employee by ID**
- **Method:** `GET`
- **URL:** `http://localhost:3000/employees/1`
- **Headers:** None required
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee retrieved successfully",
  "data": {
    "id": 1,
    "name": "Sakkeer",
    "age": 28
  }
}
```

---

### 5. **UPDATE Employee (PUT)**
- **Method:** `PUT`
- **URL:** `http://localhost:3000/employees/1`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "name": "Sakkeer A",
  "age": 29
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "data": {
    "id": 1,
    "name": "Sakkeer A",
    "age": 29
  }
}
```

---

### 6. **DELETE Employee**
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/employees/1`
- **Headers:** None required
- **Body:** None

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee deleted successfully",
  "data": {
    "id": 1,
    "name": "Sakkeer A",
    "age": 29
  }
}
```

---

## 📋 Testing Sequence in Postman

1. **First, test the health check:** `GET http://localhost:3000`
2. **Check empty employees list:** `GET http://localhost:3000/employees`
3. **Create an employee:** `POST http://localhost:3000/employees` with the JSON body
4. **Get all employees again:** `GET http://localhost:3000/employees` (should now show the employee with ID: 1)
5. **Get specific employee:** `GET http://localhost:3000/employees/1`
6. **Update the employee:** `PUT http://localhost:3000/employees/1` with updated JSON
7. **Delete the employee:** `DELETE http://localhost:3000/employees/1`
8. **Verify deletion:** `GET http://localhost:3000/employees` (should be empty again)

## 📋 Employee Schema

Each employee record contains:
- `id`: number (unique identifier, auto-generated if not provided, or custom if specified)
- `name`: string (employee name, required)
- `age`: number (employee age, must be positive, required)

## 📋 API Response Format

All API responses follow a consistent format:
```json
{
  "success": boolean,
  "message": "string",
  "data": object | array,
  "count": number (only for GET all employees)
}
```

## ⚠️ Error Responses

The API will return appropriate error messages for:
- **400 Bad Request:** 
  - Missing required fields (name and age)
  - Invalid ID format (ID must be a number)
  - Invalid age (must be a positive number)
- **404 Not Found:** Employee ID doesn't exist
- **409 Conflict:** Employee ID already exists (when creating with custom ID)

## 🔧 Features

- ✅ In-memory data storage
- ✅ Full CRUD operations
- ✅ Input validation
- ✅ Error handling
- ✅ RESTful API design
- ✅ Fastify framework for high performance

## 🛠️ Project Structure

```
fastify-employee-app/
├── src/
│   ├── routes/
│   │   └── employee/
│   │       └── index.js
│   └── server.js
├── README.md
├── package.json
└── node_modules/
```

## 📦 Dependencies

- **fastify**: High-performance web framework for Node.js 