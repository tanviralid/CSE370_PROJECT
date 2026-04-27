const db = require('../db');

async function calculateAndUpdateRiskLevels() {
    const [districtCounts] = await db.query(`
        SELECT a.district, COUNT(c.report_id) as district_crimes
        FROM Crime_report c
        JOIN Area a ON c.area_id = a.Area_id
        GROUP BY a.district
    `);

    const totalRecentCrimes = districtCounts.reduce((sum, row) => sum + Number(row.district_crimes), 0);

    const updates = districtCounts.map(async (row) => {
        let risk = 'Low';
        if (totalRecentCrimes > 0) {
            const ratio = Number(row.district_crimes) / totalRecentCrimes;
            if (ratio >= 0.4) {
                risk = 'High';
            } else if (ratio >= 0.2) {
                risk = 'Moderate';
            }
        }

        return db.query('UPDATE Area SET risk_level = ? WHERE district = ? AND is_admin_overridden = FALSE', [risk, row.district]);
    });
    
    const recentDistricts = districtCounts.map(r => r.district);
    if (recentDistricts.length > 0) {
        updates.push(db.query(
            'UPDATE Area SET risk_level = "Low" WHERE district NOT IN (?) AND is_admin_overridden = FALSE', 
            [recentDistricts]
        ));
    } else {
        updates.push(db.query('UPDATE Area SET risk_level = "Low" WHERE is_admin_overridden = FALSE'));
    }

    await Promise.all(updates);
}

module.exports = { calculateAndUpdateRiskLevels };
