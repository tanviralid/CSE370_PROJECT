const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// Generate unique tracking ID
function generateTrackingId() {
    return 'SCB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// POST: Submit a new crime report (with Incident Grouping)
router.post('/', async (req, res) => {
    const { crime_type, incident_time, victim_witness, area_id } = req.body;
    let newTrackingId = generateTrackingId();

    try {
        // Grouping logic: find reports in same area within last 2 hours
        // For simplicity, we just find if there is an existing 'Incident_Group' nearby in time, but the EER has 'location' string instead of area_id in incident group.
        // Wait, Incident_Group has `location`, `time`, `total_reports`.
        // Let's check for an Incident_Group that matches the location (we can map area_id to string district/thana, or just join)
        
        // 1. Get area details first to form the 'location' string
        const [areaRows] = await db.query('SELECT district, thana FROM Area WHERE Area_id = ?', [area_id]);
        if (areaRows.length === 0) {
            return res.status(400).json({ error: 'Invalid area_id' });
        }
        
        const areaStr = areaRows[0].thana + ', ' + areaRows[0].district;
        let groupId = null;

        // 2. Check for recent groups at this location (e.g., within 3 hours)
        const [groupRows] = await db.query(
            `SELECT id FROM Incident_Group 
             WHERE location = ? 
             AND time >= DATE_SUB(?, INTERVAL 3 HOUR)
             AND time <= DATE_ADD(?, INTERVAL 3 HOUR)`,
            [areaStr, incident_time, incident_time]
        );

        if (groupRows.length > 0) {
            // Found duplicate group, increment reports
            groupId = groupRows[0].id;
            await db.query('UPDATE Incident_Group SET total_reports = total_reports + 1 WHERE id = ?', [groupId]);
        } else {
            // Create new group
            const [insertGroupResult] = await db.query(
                'INSERT INTO Incident_Group (location, time, total_reports) VALUES (?, ?, 1)',
                [areaStr, incident_time]
            );
            groupId = insertGroupResult.insertId;
        }

        // 3. Insert crime report
        const [insertReportResult] = await db.query(
            `INSERT INTO Crime_report 
            (tracking_id, crime_type, incident_time, victim_witness, area_id, group_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
            [newTrackingId, crime_type, incident_time, victim_witness, area_id, groupId]
        );

        res.status(201).json({ 
            message: 'Report submitted successfully', 
            tracking_id: newTrackingId,
            report_id: insertReportResult.insertId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Check report status
router.get('/:trackingId', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT c.crime_type, c.incident_time, c.report_time, c.status, c.victim_witness, 
                    a.district, a.thana, a.risk_level
             FROM Crime_report c
             LEFT JOIN Area a ON c.area_id = a.Area_id
             WHERE c.tracking_id = ?`,
            [req.params.trackingId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST: Community Verification Voting
router.post('/:trackingId/vote', async (req, res) => {
    const { vote_type } = req.body; // 'Likely True', 'Needs Verification', 'Suspicious'
    
    try {
        // Find report ID
        const [reportRows] = await db.query('SELECT report_id FROM Crime_report WHERE tracking_id = ?', [req.params.trackingId]);
        
        if (reportRows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const reportId = reportRows[0].report_id;

        // Insert vote
        await db.query(
            'INSERT INTO Community_Vote (vote_type, report_id) VALUES (?, ?)',
            [vote_type, reportId]
        );

        res.json({ message: 'Vote submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Heatmap data (aggregate counts per area)
router.get('/data/heatmap', async (req, res) => {
    try {
        // Dynamic Geographic Heat Intelligence Engine using simple aggregation
        const [rows] = await db.query(`
            SELECT a.Area_id, a.district, a.thana, a.risk_level, COUNT(c.report_id) as total_incidents
            FROM Area a
            LEFT JOIN Crime_report c ON a.Area_id = c.area_id
            GROUP BY a.Area_id, a.district, a.thana, a.risk_level
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
