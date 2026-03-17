const express = require('express');
const router = express.Router();
const db = require('../db');

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
        // Find incidents in the last 30 days grouped by area
        const [recentCounts] = await db.query(`
            SELECT area_id, COUNT(report_id) as recent_crimes
            FROM Crime_report
            WHERE incident_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY area_id
        `);

        // Iterate and update risk levels
        const updates = recentCounts.map(async (row) => {
            let risk = 'Low';
            if (row.recent_crimes > 10) {
                risk = 'High';
            } else if (row.recent_crimes > 3) {
                risk = 'Moderate';
            }

            return db.query('UPDATE Area SET risk_level = ? WHERE Area_id = ?', [risk, row.area_id]);
        });
        
        // Let's also reset areas with 0 recent crimes to Low
        const recentAreaIds = recentCounts.map(r => r.area_id);
        if (recentAreaIds.length > 0) {
            updates.push(db.query(
                'UPDATE Area SET risk_level = "Low" WHERE Area_id NOT IN (?)', 
                [recentAreaIds]
            ));
        } else {
            updates.push(db.query('UPDATE Area SET risk_level = "Low"'));
        }

        await Promise.all(updates);
        
        // Return updated areas
        const [areas] = await db.query('SELECT Area_id, risk_level, district, thana FROM Area');
        
        res.json({ message: 'Risk levels updated', areas });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
