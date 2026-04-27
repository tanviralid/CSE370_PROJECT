const express = require('express');
const router = express.Router();
const db = require('../db');
const { calculateAndUpdateRiskLevels } = require('../utils/riskEngine');

// GET: Crime Trend Analytics Dashboard Stats
router.get('/trends', async (req, res) => {
    try {
        // District-wise statistics
        const [districtStats] = await db.query(`
            SELECT a.district, COUNT(c.report_id) as total_crimes
            FROM Crime_report c
            JOIN Area a ON c.area_id = a.Area_id
            GROUP BY a.district
        `);

        // Common Crime Types
        const [crimeTypes] = await db.query(`
            SELECT crime_type, COUNT(report_id) as count
            FROM Crime_report
            GROUP BY crime_type
            ORDER BY count DESC
            LIMIT 5
        `);

        // Monthly Crime Graphs
        const [monthlyTrends] = await db.query(`
            SELECT DATE_FORMAT(incident_time, '%Y-%m') as month, COUNT(report_id) as count
            FROM Crime_report
            GROUP BY month
            ORDER BY month ASC
            LIMIT 12
        `);

        res.json({
            districtStats,
            crimeTypes,
            monthlyTrends
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Automated Crime Density Risk Indicator
router.get('/risk-levels', async (req, res) => {
    try {
        await calculateAndUpdateRiskLevels();
        
        const [areas] = await db.query('SELECT Area_id, risk_level, district, thana FROM Area');
        res.json({ message: 'Risk levels updated', areas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============ ADMIN-ONLY ROUTES ============

// GET: All registered users
router.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT user_id, name, email, user_type FROM Users ORDER BY user_id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE: Remove a user
router.delete('/users/:userId', async (req, res) => {
    try {
        await db.query('DELETE FROM Users WHERE user_id = ?', [req.params.userId]);
        res.json({ message: 'User removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT: Admin manually update area risk level
router.put('/area/:areaId/risk', async (req, res) => {
    const { risk_level } = req.body;
    try {
        await db.query('UPDATE Area SET risk_level = ?, is_admin_overridden = TRUE WHERE Area_id = ?', [risk_level, req.params.areaId]);
        res.json({ message: 'Risk level updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: All areas for admin management
router.get('/areas', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.Area_id, a.district, a.thana, a.risk_level, a.is_admin_overridden,
                   COUNT(c.report_id) as total_incidents
            FROM Area a
            LEFT JOIN Crime_report c ON a.Area_id = c.area_id
            GROUP BY a.Area_id, a.district, a.thana, a.risk_level, a.is_admin_overridden
            ORDER BY total_incidents DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE: Admin delete a report
router.delete('/reports/:reportId', async (req, res) => {
    try {
        await db.query('DELETE FROM Crime_report WHERE report_id = ?', [req.params.reportId]);
        res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
