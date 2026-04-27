const express = require('express');
const router = express.Router();
const db = require('../db');

// POST: Police verify/update report status
router.post('/verify', async (req, res) => {
    const { report_id, status, verifier_id } = req.body;
    
    try {
        await db.query(
            'UPDATE Crime_report SET status = ?, verifier_id = ? WHERE report_id = ?',
            [status, verifier_id, report_id]
        );

        res.json({ message: 'Report status updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: All reports for police case management
router.get('/reports', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.report_id, c.tracking_id, c.crime_type, c.incident_time, c.report_time, 
                   c.status, c.victim_witness, a.district, a.thana, a.risk_level,
                   (SELECT COUNT(*) FROM Community_Vote cv WHERE cv.report_id = c.report_id AND cv.vote_type = 'Likely True') as votes_true,
                   (SELECT COUNT(*) FROM Community_Vote cv WHERE cv.report_id = c.report_id AND cv.vote_type = 'Suspicious') as votes_suspicious
            FROM Crime_report c
            LEFT JOIN Area a ON c.area_id = a.Area_id
            ORDER BY c.report_time DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Summary stats for police dashboard
router.get('/stats', async (req, res) => {
    try {
        const [pending] = await db.query("SELECT COUNT(*) as count FROM Crime_report WHERE status = 'Pending'");
        const [inProgress] = await db.query("SELECT COUNT(*) as count FROM Crime_report WHERE status = 'In Progress'");
        const [resolved] = await db.query("SELECT COUNT(*) as count FROM Crime_report WHERE status = 'Resolved'");
        const [rejected] = await db.query("SELECT COUNT(*) as count FROM Crime_report WHERE status = 'Rejected'");
        const [total] = await db.query("SELECT COUNT(*) as count FROM Crime_report");
        const [highRisk] = await db.query("SELECT COUNT(*) as count FROM Area WHERE risk_level = 'High'");

        res.json({
            pending: pending[0].count,
            inProgress: inProgress[0].count,
            resolved: resolved[0].count,
            rejected: rejected[0].count,
            total: total[0].count,
            highRiskAreas: highRisk[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
