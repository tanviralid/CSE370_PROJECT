const axios = require('axios');

async function testSubmit() {
    try {
        const payload = {
            crime_type: 'Theft/Robbery',
            incident_time: '2026-03-17T21:00', // How frontend sends it
            victim_witness: 'Anonymous',
            district: 'Dhaka',
            thana: 'Gulshan'
        };
        const res = await axios.post('http://localhost:5000/api/reports', payload);
        console.log("Success:", res.data);
    } catch (error) {
        console.error("Error response:", error.response ? error.response.data : error.message);
    }
}

testSubmit();
