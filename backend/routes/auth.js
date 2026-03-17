const express = require('express');
const router = express.Router();
const db = require('../db');

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
