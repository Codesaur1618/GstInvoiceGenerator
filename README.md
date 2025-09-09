# GST Invoice Generator

A full-stack web application for generating GST invoices with PDF export and database storage.

## Tech Stack

- **Frontend**: React + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel/Netlify (frontend) + Railway/Render (backend)

## Features

- 📝 Invoice form with seller, buyer, and items details
- 🧮 Auto-calculation of taxes (CGST, SGST, IGST)
- 🖨️ Printable invoice format matching GST standards
- 📄 PDF download functionality
- 💾 Database storage with Supabase
- 📊 Invoice history and management
- 🎨 Modern UI with TailwindCSS

## Project Structure

```
├── frontend/          # React application
├── backend/           # Express.js API
├── db/               # Database schema
└── package.json      # Root package configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `db/schema.sql`
   - Get your Supabase URL and API key

4. Configure environment variables:
   - Backend: Create `backend/.env` with Supabase credentials
   - Frontend: Create `frontend/.env.local` with API URL

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

## API Endpoints

- `POST /api/invoices` - Create new invoice
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

## Deployment

### Frontend (Vercel/Netlify)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `frontend/dist`

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Add environment variables for Supabase

## License

MIT

