const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error(`Error connecting to MySQL: `, err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM users WHERE username = ?';
    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error(`Error selecting from MySQL: `, err.stack);
            res.send('An error occurred');
            return;
        }
        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                res.send('Login successful');
            } else {
                res.send('Invalid email or password');
            }
        } else {
            res.send('Invalid email or password');
        }
    });
});

app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    
    try {
        const hashed_password = await bcrypt.hash(password, 10);
        
        const sql = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
        db.query(sql, [email, username, hashed_password], (err, result) => {
            if (err) {
                console.error(`Error inserting into MySQL: `, err.stack);
                res.status(500).json({ error: err.message });
            } else {
                res.status(200).json({ message: 'Registration successful' });
            }
        });
    } catch (error) {
        console.error(`Error hashing password: `, error);
        res.status(500).json({ error: 'Error hashing password' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});