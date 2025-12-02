# Ideal Finance - Microfinance Platform

A comprehensive microfinance institution website with full client portal, management dashboard, and backend system.

## Features

### 🌐 Frontend
- **Modern Landing Page** - Responsive design with animations and interactive elements
- **Client Portal** - Full-featured dashboard for loan management and payments
- **Management Dashboard** - Business analytics and client management system
- **About Page** - Company information, team profiles, and compliance details

### 🔧 Backend
- **Authentication System** - Secure login/registration with JWT tokens
- **Loan Management** - Complete loan application and approval workflow
- **Payment Processing** - Secure payment handling and transaction history
- **Database Integration** - PostgreSQL database with comprehensive schema
- **API Endpoints** - RESTful API for all frontend functionality

### 🛡️ Security & Compliance
- **Regulatory Compliance** - Bank of Zambia licensed operations
- **Data Protection** - Encrypted data storage and transmission
- **Audit Logging** - Complete activity tracking and monitoring
- **Rate Limiting** - Protection against abuse and attacks

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS for styling
- Anime.js for animations
- ECharts.js for data visualization
- Splide.js for carousels
- Typed.js for text effects
- p5.js for interactive backgrounds

### Backend
- Node.js with Express.js
- PostgreSQL database
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads
- Helmet for security headers
- Express Rate Limit for API protection

## Project Structure

```
ideal-finance/
├── index.html              # Landing page
├── portal.html             # Client portal
├── dashboard.html          # Management dashboard
├── about.html              # About page
├── main.js                 # Landing page JavaScript
├── portal.js               # Portal JavaScript
├── dashboard.js            # Dashboard JavaScript
├── server.js               # Backend server
├── package.json            # Node.js dependencies
├── init-db.js              # Database initialization
├── resources/              # Images and assets
│   ├── logo.png
│   ├── hero-main.jpg
│   ├── mobile-banking.jpg
│   ├── dashboard-preview.jpg
│   └── client-success.jpg
├── interaction.md          # Interaction design documentation
├── design.md               # Design style guide
├── outline.md              # Project outline
└── README.md               # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### 1. Database Setup
```bash
# Install PostgreSQL and create database
createdb ideal_finance

# Set environment variables (optional)
export DB_USER=postgres
export DB_HOST=localhost
export DB_NAME=ideal_finance
export DB_PASSWORD=your_password
export DB_PORT=5432
export JWT_SECRET=your_jwt_secret
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Or install specific packages
npm install express cors bcrypt jsonwebtoken pg multer helmet express-rate-limit
```

### 3. Initialize Database
```bash
# Run database initialization
node init-db.js
```

### 4. Start the Server
```bash
# Start the backend server
node server.js

# Or for development with auto-restart
npm run dev
```

### 5. Access the Website
- **Landing Page**: http://localhost:3000
- **Client Portal**: http://localhost:3000/portal.html
- **Management Dashboard**: http://localhost:3000/dashboard.html
- **About Page**: http://localhost:3000/about.html

## Test Accounts

### Admin Account
- **Email**: admin@idealfinance.zm
- **Password**: admin123
- **Access**: Full management dashboard

### Client Account
- **Email**: test@example.com
- **Password**: client123
- **Access**: Client portal features

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Loans
- `POST /api/loans/apply` - Apply for loan
- `GET /api/loans/status` - Get loan status

### Payments
- `POST /api/payments/process` - Process payment

### Dashboard
- `GET /api/dashboard/analytics` - Get business analytics

### Documents
- `POST /api/documents/upload` - Upload documents

## Features Overview

### Landing Page
- Animated hero section with particle background
- Interactive loan calculator
- Services showcase
- Client testimonials carousel
- Company statistics with counters
- Responsive design

### Client Portal
- Secure login/registration
- Loan application wizard (3-step process)
- Account dashboard with loan overview
- Payment management system
- Document upload functionality
- Payment calendar
- Recent activity tracking

### Management Dashboard
- Key performance metrics
- Interactive charts and analytics
- Client management system
- Risk assessment dashboard
- Filtering and search capabilities
- Recent activity monitoring

### Security Features
- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- Audit logging
- CORS protection
- Helmet security headers

## Compliance Features
- Bank of Zambia licensing information
- AML/CFT compliance measures
- Data protection protocols
- Regulatory framework documentation
- Client protection policies

## Customization

### Styling
- Modify CSS variables in `:root` for color scheme changes
- Update Tailwind configuration for custom styling
- Replace images in `/resources` directory

### Functionality
- Modify API endpoints in `server.js`
- Update database schema in initialization scripts
- Customize dashboard metrics and charts
- Add new loan products and services

## Deployment

### Production Setup
1. Set production environment variables
2. Configure SSL certificates
3. Set up reverse proxy (nginx recommended)
4. Configure database connection pooling
5. Enable production security features

### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_NAME=ideal_finance_prod
DB_USER=your_db_user
DB_PASSWORD=your_db_password
JWT_SECRET=your_secure_jwt_secret
```

## Support

For technical support or questions:
- Email: support@idealfinance.zm
- Phone: +260 97 123 4567
- Business Hours: Monday-Friday, 8:00 AM - 5:00 PM

## License

This project is licensed under the MIT License - see the LICENSE file for details.

© 2024 Ideal Finance. All rights reserved.
Licensed and regulated by the Bank of Zambia.