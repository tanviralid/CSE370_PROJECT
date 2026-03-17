const express = require('express');
const router = express.Router();
const db = require('../db');

// POST: Police verify report
router.post('/verify', async (req, res) => {
    const { report_id, status, verifier_id } = req.body;
    
    // Status can be 'Pending', 'In Progress', 'Resolved', 'Rejected'

    try {
        await db.query(
            'UPDATE Crime_report SET status = ?, verifier_id = ? WHERE report_id = ?',
            [status, verifier_id, report_id]
        );

        res.json({ message: 'Report status updated successfully by police' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Fetch reports for a specific police station (Optional/Extra)
router.get('/station/:stationId/reports', async (req, res) => {
    try {
        // Here we could join and find reports within the station's district or thana
        // For simplicity, just return the list of reports for the admin/police dashboard.
        const [rows] = await db.query(`
            SELECT c.*, a.district, a.thana 
            FROM Crime_report c
            JOIN Area a ON c.area_id = a.Area_id
            ORDER BY incident_time DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
