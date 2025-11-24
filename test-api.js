/**
 * Simple test script to verify API configuration
 * Run with: node test-api.js
 */

require('dotenv').config();
const axios = require('axios');

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

console.log('Testing API Configuration...\n');

// Check if API keys are set
if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.error('❌ Error: API keys are not configured in .env file');
    console.log('\nPlease create a .env file with:');
    console.log('ADZUNA_APP_ID=your_app_id_here');
    console.log('ADZUNA_APP_KEY=your_app_key_here');
    process.exit(1);
}

console.log('✓ API keys found in .env file');
console.log(`  App ID: ${ADZUNA_APP_ID.substring(0, 8)}...`);
console.log(`  App Key: ${ADZUNA_APP_KEY.substring(0, 8)}...\n`);

// Test API connection
const testUrl = `https://api.adzuna.com/v1/api/jobs/us/search/1`;
const params = {
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: 1,
    what: 'developer'
};

console.log('Testing API connection...');

axios.get(testUrl, { params, timeout: 10000 })
    .then(response => {
        console.log('✓ API connection successful!');
        console.log(`  Status: ${response.status}`);
        console.log(`  Jobs found: ${response.data.count || 0}`);
        console.log('\n✅ API configuration is correct. You can now run the application.');
    })
    .catch(error => {
        if (error.response) {
            console.error('❌ API Error:', error.response.status);
            console.error('  Message:', error.response.data?.error || error.message);
            
            if (error.response.status === 401 || error.response.status === 403) {
                console.error('\n⚠️  Invalid API credentials. Please check your App ID and App Key.');
            }
        } else if (error.request) {
            console.error('❌ Network Error: Unable to connect to API');
            console.error('  Please check your internet connection.');
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    });

