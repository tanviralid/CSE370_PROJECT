const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const { calculateAndUpdateRiskLevels } = require('../utils/riskEngine');

// Generate unique tracking ID
function generateTrackingId() {
    return 'SCB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET: Heatmap data (aggregate counts per area)
router.get('/heatmap', async (req, res) => {
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

        // 2. Check for exact duplicate incident (same crime type, area, within 2 hours)
        const [duplicateRows] = await db.query(
            `SELECT tracking_id FROM Crime_report 
             WHERE crime_type = ? 
             AND area_id = ? 
             AND incident_time >= DATE_SUB(?, INTERVAL 2 HOUR)
             AND incident_time <= DATE_ADD(?, INTERVAL 2 HOUR)
             LIMIT 1`,
            [crime_type, area_id, incident_time, incident_time]
        );

        if (duplicateRows.length > 0) {
            return res.status(200).json({
                message: 'this report has already been submitted',
                tracking_id: duplicateRows[0].tracking_id,
                isDuplicate: true
            });
        }

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

        // 4. Automatically recalculate risk levels to ensure the intelligence engine is up to date
        await calculateAndUpdateRiskLevels();

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
                    a.district, a.thana, a.risk_level,
                    (SELECT COUNT(*) FROM Community_Vote cv WHERE cv.report_id = c.report_id AND cv.vote_type = 'Likely True') as votes_true,
                    (SELECT COUNT(*) FROM Community_Vote cv WHERE cv.report_id = c.report_id AND cv.vote_type = 'Needs Verification') as votes_warning,
                    (SELECT COUNT(*) FROM Community_Vote cv WHERE cv.report_id = c.report_id AND cv.vote_type = 'Suspicious') as votes_suspicious
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

        // --- Advanced Automated Community Moderation System ---
        // Fetch all current votes for this report
        const [voteStats] = await db.query(
            `SELECT 
                SUM(CASE WHEN vote_type = 'Suspicious' THEN 1 ELSE 0 END) as suspicious_count,
                SUM(CASE WHEN vote_type = 'Likely True' THEN 1 ELSE 0 END) as true_count
             FROM Community_Vote WHERE report_id = ?`,
            [reportId]
        );
        
        const suspCount = Number(voteStats[0].suspicious_count) || 0;
        const trueCount = Number(voteStats[0].true_count) || 0;

        // Auto-Reject Logic:
        // 1. If NO likely true votes: reject if suspicious > 5
        // 2. If HAS likely true votes: reject if suspicious is 2 more than likely true
        const shouldReject = (trueCount === 0 && suspCount > 5) || (trueCount > 0 && suspCount >= trueCount + 2);

        if (shouldReject) {
            await db.query(`UPDATE Crime_report SET status = 'Rejected' WHERE report_id = ?`, [reportId]);
        } 
        // Auto-Progress if Likely True >= 2 AND not rejected
        else if (trueCount >= 2) {
            // Only update if it's currently Pending
            await db.query(`UPDATE Crime_report SET status = 'In Progress' WHERE report_id = ? AND status = 'Pending'`, [reportId]);
        }

        // Return updated vote counts so the frontend can react immediately
        const [voteCounts] = await db.query(
            `SELECT 
                (SELECT COUNT(*) FROM Community_Vote WHERE report_id = ? AND vote_type = 'Likely True') as votes_true,
                (SELECT COUNT(*) FROM Community_Vote WHERE report_id = ? AND vote_type = 'Needs Verification') as votes_warning,
                (SELECT COUNT(*) FROM Community_Vote WHERE report_id = ? AND vote_type = 'Suspicious') as votes_suspicious,
                status
             FROM Crime_report WHERE report_id = ?`,
            [reportId, reportId, reportId, reportId]
        );

        res.json({ message: 'Vote submitted successfully', updatedVotes: voteCounts[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
