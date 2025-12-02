const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ideal_finance',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Initialize database tables
const initializeDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                phone VARCHAR(20),
                user_type VARCHAR(20) DEFAULT 'client',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS loans (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                loan_amount DECIMAL(12,2) NOT NULL,
                loan_term INTEGER NOT NULL,
                interest_rate DECIMAL(5,2) NOT NULL,
                monthly_payment DECIMAL(10,2) NOT NULL,
                total_payment DECIMAL(12,2) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                purpose TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                loan_id INTEGER REFERENCES loans(id),
                amount DECIMAL(10,2) NOT NULL,
                payment_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                payment_method VARCHAR(50),
                transaction_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                loan_id INTEGER REFERENCES loans(id),
                document_type VARCHAR(50) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                action VARCHAR(100) NOT NULL,
                details TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, userType = 'client' } = req.body;
        
        // Validate input
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Check if user exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone, user_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, user_type',
            [email, passwordHash, firstName, lastName, phone, userType]
        );

        const user = result.rows[0];
        
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, userType: user.user_type }, JWT_SECRET, { expiresIn: '24h' });

        // Log the registration
        await pool.query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', [
            user.id, 'USER_REGISTERED', 'New user registration', req.ip
        ]);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                userType: user.user_type
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await pool.query('SELECT id, email, password_hash, first_name, last_name, user_type FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, userType: user.user_type }, JWT_SECRET, { expiresIn: '24h' });

        // Log the login
        await pool.query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', [
            user.id, 'USER_LOGIN', 'User logged in', req.ip
        ]);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                userType: user.user_type
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Loan endpoints
app.post('/api/loans/apply', authenticateToken, async (req, res) => {
    try {
        const { loanAmount, loanTerm, interestRate, monthlyPayment, totalPayment, purpose } = req.body;
        const userId = req.user.userId;

        // Validate loan parameters
        if (!loanAmount || !loanTerm || !interestRate || !monthlyPayment || !totalPayment) {
            return res.status(400).json({ error: 'All loan parameters are required' });
        }

        const result = await pool.query(
            'INSERT INTO loans (user_id, loan_amount, loan_term, interest_rate, monthly_payment, total_payment, purpose) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [userId, loanAmount, loanTerm, interestRate, monthlyPayment, totalPayment, purpose]
        );

        // Log the loan application
        await pool.query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', [
            userId, 'LOAN_APPLIED', `Loan application submitted for ${loanAmount}`, req.ip
        ]);

        res.status(201).json({
            message: 'Loan application submitted successfully',
            loan: result.rows[0]
        });
    } catch (error) {
        console.error('Loan application error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/loans/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const userType = req.user.userType;

        let query;
        let params;

        if (userType === 'admin' || userType === 'manager') {
            // Admin/manager can see all loans
            query = 'SELECT l.*, u.first_name, u.last_name, u.email FROM loans l JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC';
            params = [];
        } else {
            // Regular users can only see their own loans
            query = 'SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC';
            params = [userId];
        }

        const result = await pool.query(query, params);
        res.json({ loans: result.rows });
    } catch (error) {
        console.error('Loan status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Payment endpoints
app.post('/api/payments/process', authenticateToken, async (req, res) => {
    try {
        const { loanId, amount, paymentMethod } = req.body;
        const userId = req.user.userId;

        // Verify loan ownership (clients can only pay their own loans)
        const loanCheck = await pool.query('SELECT user_id FROM loans WHERE id = $1', [loanId]);
        if (loanCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        if (req.user.userType === 'client' && loanCheck.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to make payment for this loan' });
        }

        // Create payment record
        const result = await pool.query(
            'INSERT INTO payments (loan_id, amount, payment_date, payment_method, transaction_id) VALUES ($1, $2, CURRENT_DATE, $3, $4) RETURNING *',
            [loanId, amount, paymentMethod, `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`]
        );

        // Log the payment
        await pool.query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', [
            userId, 'PAYMENT_MADE', `Payment of ${amount} made for loan ${loanId}`, req.ip
        ]);

        res.json({
            message: 'Payment processed successfully',
            payment: result.rows[0]
        });
    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard analytics
app.get('/api/dashboard/analytics', authenticateToken, async (req, res) => {
    try {
        // Verify admin/manager access
        if (req.user.userType !== 'admin' && req.user.userType !== 'manager') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Get total loans
        const totalLoans = await pool.query('SELECT COUNT(*) as count, SUM(loan_amount) as total FROM loans');
        
        // Get loans by status
        const loansByStatus = await pool.query(
            'SELECT status, COUNT(*) as count, SUM(loan_amount) as total FROM loans GROUP BY status'
        );

        // Get monthly loan applications
        const monthlyLoans = await pool.query(
            'SELECT DATE_TRUNC(\'month\', created_at) as month, COUNT(*) as count, SUM(loan_amount) as total FROM loans GROUP BY DATE_TRUNC(\'month\', created_at) ORDER BY month DESC LIMIT 12'
        );

        // Get total users
        const totalUsers = await pool.query('SELECT COUNT(*) as count FROM users');

        res.json({
            totalLoans: totalLoans.rows[0],
            loansByStatus: loansByStatus.rows,
            monthlyLoans: monthlyLoans.rows,
            totalUsers: totalUsers.rows[0].count
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Document upload
app.post('/api/documents/upload', authenticateToken, upload.single('document'), async (req, res) => {
    try {
        const { loanId, documentType } = req.body;
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await pool.query(
            'INSERT INTO documents (user_id, loan_id, document_type, file_path, file_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, loanId || null, documentType, req.file.path, req.file.originalname]
        );

        // Log the document upload
        await pool.query('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)', [
            userId, 'DOCUMENT_UPLOADED', `${documentType} uploaded`, req.ip
        ]);

        res.json({
            message: 'Document uploaded successfully',
            document: result.rows[0]
        });
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Static file serving
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/portal', (req, res) => {
    res.sendFile(path.join(__dirname, 'portal.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize database and start server
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Access the website at http://localhost:${PORT}`);
    });
});