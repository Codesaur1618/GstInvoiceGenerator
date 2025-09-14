# Setup and Installation Guide

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Git

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd gst-invoice-generator

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `db/schema.sql`
3. Get your project URL and API keys from Settings > API

### 3. Environment Configuration

#### Backend (.env)
```bash
cd backend
cp env.example .env
```

Edit `backend/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```bash
cd frontend
cp env.example .env.local
```

Edit `frontend/.env.local`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=GST Invoice Generator
REACT_APP_VERSION=1.0.0
```

### 4. Run Development Servers

```bash
# From project root
npm run dev
```

This will start:
- Backend API on http://localhost:5000
- Frontend React app on http://localhost:3000

Or run separately:
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## Production Deployment

### Frontend (Vercel/Netlify)

#### Vercel
1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/build`
4. Add environment variable: `REACT_APP_API_URL=https://your-backend-url.railway.app/api`

#### Netlify
1. Connect GitHub repository
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/build`
4. Add environment variable: `REACT_APP_API_URL=https://your-backend-url.railway.app/api`

### Backend (Railway/Render)

#### Railway
1. Connect GitHub repository
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL`

#### Render
1. Connect GitHub repository
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Add environment variables (same as Railway)

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build individually
docker build -t gst-backend ./backend
docker build -t gst-frontend ./frontend
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/invoices` - Create invoice
- `GET /api/invoices` - List invoices (with pagination)
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

## Features

✅ **Invoice Form**
- Seller details (company, address, GSTIN, bank details)
- Buyer details (name, address, state, GSTIN)
- Items table with HSN codes
- Auto-calculation of taxes (CGST/SGST/IGST)
- Amount in words conversion

✅ **Invoice Preview**
- Professional GST-compliant layout
- Printable format
- PDF download with jsPDF + html2canvas

✅ **Invoice Management**
- Save to Supabase database
- Invoice history with pagination
- View, edit, delete operations

✅ **Tax Calculations**
- CGST 6% + SGST 6% (same state)
- IGST 12% (different state)
- Automatic round-off adjustment

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly in backend
2. **Database Connection**: Verify Supabase credentials and URL
3. **Build Failures**: Check Node.js version (v16+ required)
4. **PDF Generation**: Ensure html2canvas can access the DOM

### Development Tips

- Use browser dev tools to debug API calls
- Check Supabase logs for database errors
- Use React DevTools for component debugging
- Monitor network tab for failed requests

## Support

For issues and questions:
1. Check the console for error messages
2. Verify environment variables
3. Test API endpoints with Postman/curl
4. Check Supabase dashboard for database issues

