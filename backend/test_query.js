const db = require('./db');
db.query(`SELECT c.crime_type, c.incident_time, c.report_time, c.status, c.victim_witness, 
                    a.district, a.thana, a.risk_level,
                    (SELECT COUNT(*) FROM Community_Vote cv WHERE cv.report_id = c.report_id AND cv.vote_type = 'Likely True') as votes_true,
                    (SELECT COUNT(*) FROM Community_Vote cv WHERE cv.report_id = c.report_id AND cv.vote_type = 'Needs Verification') as votes_warning,
                    (SELECT COUNT(*) FROM Community_Vote cv WHERE cv.report_id = c.report_id AND cv.vote_type = 'Suspicious') as votes_suspicious
             FROM Crime_report c
             LEFT JOIN Area a ON c.area_id = a.Area_id
             WHERE c.tracking_id = 'TRK-9903'`)
  .then(([rows]) => { console.log(rows); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
