const fs = require('fs');
const path = require('path');

console.log('🚀 GST Invoice Generator - Backend Setup');
console.log('========================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  // Create .env file from .env.example
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file from .env.example');
    console.log('📝 Edit backend/.env to configure your environment variables\n');
  } else {
    // Create a basic .env file
    const envContent = `# Backend Environment Variables
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file with default configuration');
    console.log('📝 Please edit backend/.env and update the JWT_SECRET\n');
  }
}

console.log('📋 Setup Instructions:');
console.log('===================\n');

console.log('1. Initialize the database:');
console.log('   npm run db:init\n');

console.log('2. Start the development server:');
console.log('   npm run dev\n');

console.log('3. Default user credentials:');
console.log('   Admin: admin@gstinvoice.local / admin123');
console.log('   Seller: seller1@example.com / seller123');
console.log('   Buyer: buyer1@example.com / buyer123\n');

console.log('4. API endpoints:');
console.log('   - POST   /api/auth/register     - Register new user');
console.log('   - POST   /api/auth/login        - Login');
console.log('   - GET    /api/auth/me           - Get current user');
console.log('   - GET    /api/products          - List products');
console.log('   - POST   /api/products          - Create product (seller)');
console.log('   - GET    /api/invoices          - List invoices');
console.log('   - POST   /api/invoices          - Create invoice\n');

console.log('5. The local SQLite database will be created at:');
console.log('   db/local.db\n');

console.log('✅ Setup complete! Happy coding! 🎉\n');