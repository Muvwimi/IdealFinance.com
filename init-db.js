// Database initialization script for Ideal Finance
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ideal_finance',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Initialize database tables
async function initializeDatabase() {
    try {
        console.log('Initializing Ideal Finance database...');
        
        // Create users table
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

        // Create loans table
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

        // Create payments table
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

        // Create documents table
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

        // Create audit_logs table
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

        // Create admin user (for testing)
        const bcrypt = require('bcrypt');
        const adminPassword = await bcrypt.hash('admin123', 10);
        
        await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, user_type) 
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO NOTHING
        `, [
            'admin@idealfinance.zm',
            adminPassword,
            'Admin',
            'User',
            'admin'
        ]);

        // Create test client user
        const clientPassword = await bcrypt.hash('client123', 10);
        
        await pool.query(`
            INSERT INTO users (email, password_hash, first_name, last_name, phone, user_type) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO NOTHING
        `, [
            'test@example.com',
            clientPassword,
            'Test',
            'Client',
            '+260971234567',
            'client'
        ]);

        console.log('Database initialized successfully!');
        console.log('Test accounts created:');
        console.log('Admin: admin@idealfinance.zm / admin123');
        console.log('Client: test@example.com / client123');
        
    } catch (error) {
        console.error('Database initialization error:', error);
    } finally {
        await pool.end();
    }
}

// Run initialization
initializeDatabase();