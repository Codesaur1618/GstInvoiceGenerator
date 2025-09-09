# GST Invoice System - Vercel Deployment Guide

This guide will help you deploy your GST Invoice System to Vercel.

## Prerequisites

1. A GitHub account with your code repository
2. A Vercel account (free tier available)
3. Your GST Invoice System code pushed to GitHub

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository contains:
- ✅ `vercel.json` configuration file
- ✅ `api/` directory with serverless functions
- ✅ `frontend/` directory with React app
- ✅ `package.json` with all dependencies

### 2. Deploy to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your GST Invoice System repository

2. **Configure Environment Variables:**
   In your Vercel project settings, add these environment variables:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DATABASE_URL=sqlite:///tmp/gst_invoice.db
   FRONTEND_URL=https://your-app-name.vercel.app
   NODE_ENV=production
   ```

3. **Deploy:**
   - Vercel will automatically detect the configuration
   - Click "Deploy" to start the deployment process
   - Wait for the build to complete (usually 2-5 minutes)

### 3. Database Setup

The system uses SQLite for simplicity. For production use, consider:
- **Vercel Postgres** (recommended for production)
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

To use a different database:
1. Update `api/lib/database.js` with your database configuration
2. Update the `DATABASE_URL` environment variable
3. Redeploy your application

### 4. Access Your Application

Once deployed, you can access your application at:
- **Frontend:** `https://your-app-name.vercel.app`
- **API:** `https://your-app-name.vercel.app/api`

### 5. Default Admin Account

The system creates a default admin account:
- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Important:** Change the admin password immediately after first login!

## API Endpoints

Your deployed API will have these endpoints:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product (sellers only)
- `GET /api/products/:id` - Get single product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get single invoice
- `PATCH /api/invoices/:id/status` - Update invoice status
- `DELETE /api/invoices/:id` - Delete invoice

### Sellers & Buyers
- `GET /api/sellers` - List sellers
- `GET /api/buyers` - List buyers

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Ensure `frontend/package.json` has build scripts
   - Verify file paths in `vercel.json`

2. **API Errors:**
   - Check environment variables are set correctly
   - Verify database connection
   - Check Vercel function logs

3. **Frontend Issues:**
   - Ensure API URLs are correct
   - Check CORS configuration
   - Verify environment variables

### Getting Help

- Check Vercel deployment logs
- Review function logs in Vercel dashboard
- Test API endpoints using tools like Postman
- Check browser console for frontend errors

## Production Considerations

1. **Security:**
   - Use strong JWT secrets
   - Enable HTTPS (automatic with Vercel)
   - Consider rate limiting for API endpoints

2. **Performance:**
   - Use Vercel's edge functions for better performance
   - Consider caching strategies
   - Optimize database queries

3. **Monitoring:**
   - Set up Vercel Analytics
   - Monitor function execution times
   - Track error rates

## Custom Domain

To use a custom domain:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `FRONTEND_URL` environment variable

## Updates and Maintenance

- Push changes to your GitHub repository
- Vercel will automatically redeploy
- Monitor deployment status in Vercel dashboard
- Test thoroughly after each deployment

---

**Need help?** Check the Vercel documentation or create an issue in your repository.
