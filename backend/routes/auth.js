const express = require('express');
const router = express.Router();
const db = require('../db');

// POST: Register a new account
router.post('/register', async (req, res) => {
    const { name, email, password, user_type } = req.body;

    if (!name || !email || !password || !user_type) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if user already exists
        const [existing] = await db.query('SELECT user_id FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Insert new user
        const [result] = await db.query(
            'INSERT INTO Users (name, email, password, user_type) VALUES (?, ?, ?, ?)',
            [name, email, password, user_type]
        );

        res.status(201).json({
            message: 'Account created successfully',
            user: {
                user_id: result.insertId,
                name,
                email,
                user_type
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// POST: Simple Login for Admin and Police
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query(
            'SELECT user_id, name, email, user_type FROM Users WHERE email = ? AND password = ?',
            [email, password]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        
        // In a real app we'd sign a JWT here. For this simplified version we'll just return the user info.
        res.json({
            message: 'Login successful',
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                user_type: user.user_type
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
