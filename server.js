require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // NEW: Using PostgreSQL instead of SQLite

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 1. Connect to your Permanent Cloud Database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for cloud connections
});

// 2. Create the Table (If it doesn't exist yet)
const createTableQuery = `
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    make_model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    u_size INTEGER NOT NULL,
    rack_number VARCHAR(255) NOT NULL,
    u_space VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    remark TEXT
)`;

pool.query(createTableQuery)
    .then(() => console.log("Connected to Cloud Database!"))
    .catch(err => console.error("Error creating table", err));

// 3. Get all assets
app.get('/api/assets', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM assets ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// 4. Add a new asset
app.post('/api/assets', async (req, res) => {
    const { name, make_model, serial_number, u_size, rack_number, u_space, status, remark } = req.body;
    try {
        const insertQuery = `
            INSERT INTO assets (name, make_model, serial_number, u_size, rack_number, u_space, status, remark) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
        const values = [name, make_model, serial_number, u_size, rack_number, u_space, status, remark];
        
        const result = await pool.query(insertQuery, values);
        res.json(result.rows[0]); // Send back the saved asset
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

// 5. Delete an asset
app.delete('/api/assets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM assets WHERE id = $1", [id]);
        res.json({ message: "Asset deleted permanently" });
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

app.listen(port, () => {
    console.log(`Backend Server running on port ${port}`);
});