# SecureVote API Documentation

## Base URL

The API base URL depends on your deployment environment:

- Development: Retrieved from `terraform output -raw api_url` in the dev environment
- Production: Retrieved from `terraform output -raw api_url` in the prod environment

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Health Check

#### GET /health

Check the API and database health status.

**Response**

```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Authentication

#### POST /api/auth/register

Register a new user.

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe",
  "organization": "Example Org",
  "role": "admin"
}
```

**Response**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "admin"
  }
}
```

#### POST /api/auth/login

Login an existing user.

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### Elections

#### POST /api/elections

Create a new election. Requires authentication with admin role.

**Request Body**

```json
{
  "title": "Board Member Election 2024",
  "description": "Annual board member election",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-02T00:00:00Z"
}
```

**Response**

```json
{
  "election_id": "election_id_here",
  "title": "Board Member Election 2024",
  "status": "created"
}
```

#### GET /api/elections/:id

Get details of a specific election. Requires authentication.

**Response**

```json
{
  "id": "election_id_here",
  "title": "Board Member Election 2024",
  "description": "Annual board member election",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-06-02T00:00:00Z",
  "status": "active"
}
```

### Votes

#### POST /api/votes

Submit a vote for an election. Requires authentication.

**Request Body**

```json
{
  "electionId": "election_id_here",
  "encryptedVote": "encrypted_vote_data"
}
```

**Response**

```json
{
  "status": "accepted",
  "verificationCode": "verification_code_here"
}
```

#### GET /api/votes/verify/:code

Verify a submitted vote using the verification code.

**Response**

```json
{
  "status": "verified",
  "timestamp": "2024-01-20T15:30:00Z"
}
```

### Results

#### POST /api/results/:electionId/publish

Publish the results of an election. Requires authentication with admin role.

**Response**

```json
{
  "status": "completed",
  "publishedAt": "2024-01-20T16:00:00Z"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "validation_error",
  "message": "Invalid request parameters",
  "details": ["Specific error details"]
}
```

### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "not_found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "internal_error",
  "message": "An internal error occurred"
}
```

## Rate Limiting

The API implements rate limiting with the following defaults:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1516131940
```
