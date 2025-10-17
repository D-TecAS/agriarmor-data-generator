const fs = require('fs');
const path = require('path');

const keyFilePath = path.join(__dirname, 'service-account-key.json');

try {
    if (!fs.existsSync(keyFilePath)) {
        throw new Error('service-account-key.json file not found in this directory.');
    }
    const keyData = JSON.parse(fs.readFileSync(keyFilePath));
    
    console.log('\n--- Key File Verification ---');
    console.log(`✅ Project ID found in key file: ${keyData.project_id}`);
    console.log('---------------------------\n');

} catch (error) {
    console.error('\n--- Key File Verification FAILED ---');
    console.error(`❌ Error: ${error.message}`);
    console.error('------------------------------------\n');
}