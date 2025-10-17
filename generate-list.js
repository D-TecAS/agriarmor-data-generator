const { VertexAI } = require("@google-cloud/vertexai");
const fs = require("fs");
const path = require("path");

// ===================================================================
// CONFIGURATION
// ===================================================================
const PROJECT_ID = "farm-maintenance-app";
const LOCATION = "us-central1"; // Using our primary target region
const OUTPUT_FILE = "supplemental_list_1.json";
const KEY_FILE_PATH = path.join(__dirname, 'service-account-key.json');
const MODEL_NAME = "gemini-2.5-flash"; // The model we confirmed works
// ===================================================================

const MANUFACTURERS = ["Gleaner", "Fendt", "Great Plains", "Sunflower", "Steiger", "Case"];
const EQUIPMENT_TYPES = ["Tractor", "Combine", "Plow", "Planter", "Sprayer", "Hay Baler", "Tillage Harrow", "Fertilizer Spreader", "Forage Harvester", "Vertical Till"];
const START_YEAR = 1960;
const END_YEAR = 2024; // Looping until this year

const vertex_ai = new VertexAI({ 
    project: PROJECT_ID, 
    location: LOCATION, 
    keyFilename: KEY_FILE_PATH 
});

const model = MODEL_NAME;
const generativeModel = vertex_ai.getGenerativeModel({ model });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateMasterList() {
    console.log("🚀 Starting High-Fidelity Equipment List Generation...");
    let rawList = [];

    for (const make of MANUFACTURERS) {
        for (const type of EQUIPMENT_TYPES) {
            for (let year = START_YEAR; year <= END_YEAR; year++) {
                console.log(`\n🔍 Querying for: ${make} ${type}s (Year: ${year})`);

                const prompt = `
                    List the most common and significant agricultural "${type}" models made by "${make}" for the year ${year}.
                    Instructions:
                    1. Your response MUST be a valid JSON array of strings.
                    2. Each string is only the model name or number (e.g., "4020", "9500").
                    3. Do not include explanations or markdown.
                    4. If no models were made for this year, return an empty array: [].
                `;

                try {
                    const resp = await generativeModel.generateContent(prompt);
                    const rawResponse = resp.response.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (!rawResponse) {
                        console.log("   -> No response from AI.");
                        continue;
                    }
                    
                    const cleanedResponse = rawResponse.trim().replace(/```json/g, "").replace(/```/g, "");
                    const models = JSON.parse(cleanedResponse);

                    if (models.length > 0) {
                        console.log(`   ✅ Found ${models.length} models.`);
                        for (const modelName of models) {
                            rawList.push({
                                make: make,
                                model: modelName,
                                type: type,
                                year_of_manufacture: year 
                            });
                        }
                    }
                } catch (error) {
                    console.error(`   ❌ Error processing ${make} ${type}s (${year}):`, error.message);
                }

                await delay(1000); 
            }
        }
    }
    
    console.log("\n\nFiltering and de-duplicating the master list...");
    const uniqueEquipment = new Map();
    for (const item of rawList) {
        const key = `${item.make}-${item.model}-${item.type}`;
        if (!uniqueEquipment.has(key)) {
            uniqueEquipment.set(key, {
                make: item.make,
                model: item.model,
                type: item.type
            });
        }
    }
    const masterList = Array.from(uniqueEquipment.values());

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(masterList, null, 2));
    console.log(`\n\n🎉 Success! Master list saved to ${OUTPUT_FILE}`);
    console.log(`Total unique equipment profiles generated: ${masterList.length}`);
}

generateMasterList();