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
    const { crime_type, incident_time, victim_witness, district, thana } = req.body;
    let newTrackingId = generateTrackingId();

    try {
        // 1. Get or Create Area
        let area_id;
        const [areaRows] = await db.query('SELECT Area_id FROM Area WHERE district = ? AND thana = ?', [district, thana]);
        if (areaRows.length > 0) {
            area_id = areaRows[0].Area_id;
        } else {
            const [insertAreaResult] = await db.query('INSERT INTO Area (district, thana) VALUES (?, ?)', [district, thana]);
            area_id = insertAreaResult.insertId;
        }

        const areaStr = thana + ', ' + district;
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

// GET: Heatmap data (aggregate counts per area)
// IMPORTANT: This must be defined BEFORE /:trackingId to avoid being caught by that wildcard
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

module.exports = router;
