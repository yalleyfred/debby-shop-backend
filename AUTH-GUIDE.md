# Authentication API Endpoints Test Guide

## 🔐 **Available Authentication Endpoints**

The authentication system is now running with the following endpoints:

### **Public Endpoints (No Authentication Required)**

1. **GET /** - Application info
   ```bash
   curl http://localhost:3000/
   ```

2. **POST /auth/register** - Register new user
   ```bash
   curl -X POST http://localhost:3000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "password123",
       "firstName": "John",
       "lastName": "Doe",
       "phone": "+1234567890",
       "role": "customer"
     }'
   ```

3. **POST /auth/login** - Login user
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com",
       "password": "password123"
     }'
   ```

4. **POST /auth/forgot-password** - Request password reset
   ```bash
   curl -X POST http://localhost:3000/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{
       "email": "john@example.com"
     }'
   ```

5. **POST /auth/reset-password** - Reset password with token
   ```bash
   curl -X POST http://localhost:3000/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "token": "your_reset_token_here",
       "newPassword": "newpassword123"
     }'
   ```

6. **POST /auth/verify-email** - Verify email address
   ```bash
   curl -X POST http://localhost:3000/auth/verify-email \
     -H "Content-Type: application/json" \
     -d '{
       "token": "your_verification_token_here"
     }'
   ```

### **Protected Endpoints (Authentication Required)**

7. **GET /auth/profile** - Get user profile
   ```bash
   curl -X GET http://localhost:3000/auth/profile \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

8. **POST /auth/refresh-token** - Refresh access token
   ```bash
   curl -X POST http://localhost:3000/auth/refresh-token \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

9. **POST /auth/logout** - Logout user
   ```bash
   curl -X POST http://localhost:3000/auth/logout \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

10. **GET /auth/admin-only** - Admin-only endpoint (requires admin role)
    ```bash
    curl -X GET http://localhost:3000/auth/admin-only \
      -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
    ```

## 🧪 **Testing Workflow**

1. **Register a new user** using `/auth/register`
2. **Login** using `/auth/login` to get JWT tokens
3. **Use the access token** to access protected endpoints
4. **Test role-based access** by creating an admin user

## 📋 **User Interface Structure**

```typescript
interface User {
  id: string;           // UUID
  email: string;        // Unique email
  firstName: string;
  lastName: string;
  phone?: string;       // Optional phone number
  avatar?: string;      // Optional avatar URL
  role: 'customer' | 'admin';
  emailVerified: boolean;
  createdAt: string;    // ISO string
}
```

## 🔑 **JWT Token Structure**

The JWT payload contains:
```json
{
  "sub": "user_id_uuid",
  "email": "user@example.com",
  "iat": 1704531600,
  "exp": 1704535200
}
```

## 🛡️ **Security Features**

✅ Password hashing with bcrypt (12 rounds)  
✅ JWT-based authentication  
✅ Role-based access control  
✅ Email verification flow  
✅ Password reset flow  
✅ Global JWT guard with public route exceptions  
✅ Input validation with class-validator  
✅ CORS enabled for frontend integration  

## 🚀 **Next Steps**

- Test the endpoints with your preferred API client (Postman, Insomnia, etc.)
- Integrate with a frontend application
- Set up email service for verification and password reset
- Add rate limiting for auth endpoints
- Implement refresh token rotation