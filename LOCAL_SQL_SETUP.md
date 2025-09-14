# Local SQL Database Setup Guide

This guide explains the complete local SQL database setup for the GST Invoice Generator application.

## Overview

The application now uses a local SQLite database instead of Supabase, providing a complete self-contained solution with the following modules:

1. **User Management** - Separate roles for Sellers and Buyers
2. **Product Management** - CRUD operations for products
3. **Invoice Management** - Complete invoicing system with GST calculations

## Database Schema

### Users Table
- Supports three roles: `admin`, `seller`, `buyer`
- Stores business details, GST information, and banking details
- Authentication via JWT tokens

### Products Table
- Linked to sellers
- Includes HSN codes, GST rates, and stock management
- Soft delete functionality (is_active flag)

### Invoices Table
- Links sellers and buyers
- Automatic GST calculations (CGST/SGST for same state, IGST for different states)
- Invoice status tracking: draft, sent, paid, cancelled
- Denormalized data for historical accuracy

### Invoice Items Table
- Line items for each invoice
- Can be linked to products or custom entries
- Automatic tax calculations per item

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- `sqlite3` - SQLite database driver
- `knex` - SQL query builder
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication

### 2. Initialize the Database

```bash
npm run db:init
```

This command:
- Creates the SQLite database at `db/local.db`
- Sets up all tables with proper indexes
- Creates default users with sample data

### 3. Default Credentials

After initialization, you can login with:

- **Admin**: admin@gstinvoice.local / admin123
- **Seller**: seller1@example.com / seller123
- **Buyer**: buyer1@example.com / buyer123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (seller/buyer)
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/users` - List users (filtered by role)

### Products (Seller Only)
- `GET /api/products` - List products (sellers see own, buyers see all)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Soft delete product
- `PATCH /api/products/:id/stock` - Update stock quantity

### Invoices
- `GET /api/invoices` - List invoices (filtered by user role)
- `GET /api/invoices/:id` - Get single invoice with items
- `POST /api/invoices` - Create new invoice
- `PATCH /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete draft invoice

## Authentication

All API endpoints (except login/register) require authentication via JWT token:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## User Roles & Permissions

### Admin
- Full system access
- Can view all users, products, and invoices
- System configuration and management

### Seller
- Can create and manage their own products
- Can create invoices for buyers
- Can view their own invoices
- Can update their business profile

### Buyer
- Can browse all products from all sellers
- Can view invoices where they are the buyer
- Can update their business profile

## GST Calculation Logic

The system automatically calculates GST based on state codes:

- **Same State (Seller & Buyer)**: CGST (6%) + SGST (6%) = 12% total
- **Different States**: IGST (12%)

GST rates can be customized per product (default is 18%).

## Database Management

### Reset Database
```bash
npm run db:reset
```
This will delete the existing database and create a fresh one with sample data.

### Manual Database Access
The SQLite database file is located at `db/local.db`. You can use any SQLite client to browse the data:

- [DB Browser for SQLite](https://sqlitebrowser.org/)
- [TablePlus](https://tableplus.com/)
- SQLite command line tool

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   This starts both backend (port 5000) and frontend (port 3000)

2. **Backend Only**
   ```bash
   npm run dev:backend
   ```

3. **Frontend Only**
   ```bash
   npm run dev:frontend
   ```

## Environment Configuration

Create a `.env` file in the backend directory:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-this-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access Control**: Permissions based on user roles
4. **Input Validation**: All inputs are validated and sanitized
5. **Rate Limiting**: API endpoints are rate-limited to prevent abuse

## Troubleshooting

### Database Connection Issues
- Ensure the `db` directory exists
- Check file permissions for the database file
- Verify SQLite is properly installed

### Authentication Errors
- Ensure JWT_SECRET is set in .env
- Check token expiration (24 hours by default)
- Verify user is active (is_active = 1)

### Migration Issues
- Use `npm run db:reset` to start fresh
- Check console for specific SQL errors
- Ensure all foreign key constraints are met

## Production Considerations

1. **Change JWT_SECRET**: Use a strong, random secret in production
2. **Database Backups**: Regularly backup the `db/local.db` file
3. **SSL/HTTPS**: Use HTTPS in production
4. **Environment Variables**: Never commit .env files
5. **Database Location**: Consider moving database outside the application directory

## Removed Dependencies

The following Supabase-related items have been removed:
- `@supabase/supabase-js` npm package
- `backend/config/supabase.js` configuration file
- All Supabase references in the codebase

The application now runs completely locally without any external database dependencies!
