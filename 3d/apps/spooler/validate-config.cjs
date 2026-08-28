#!/usr/bin/env node

/**
 * Validate that CSV files and SPOOLER code config match
 * Run: node validate-config.cjs
 */

const fs = require('fs');
const path = require('path');

// Parse CSV file
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');

    const data = {};
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        const type = parts[0];
        const name = parts[3];
        const nameHex = parts[5];

        if (!data[type]) {
            data[type] = {};
        }
        data[type][name] = nameHex;
    }
    return data;
}

// Extract config from HTML file
function extractConfigFromHTML(filePath, configName) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Find the config object in the file
    const regex = new RegExp(`const ${configName} = ({[\\s\\S]*?});`);
    const match = content.match(regex);

    if (!match) {
        throw new Error(`Could not find ${configName} in HTML file`);
    }

    // Safely evaluate the config object
    const configStr = match[1];

    // Convert JS object syntax to JSON-compatible format
    let jsonStr = configStr
        .replace(/'/g, '"') // single quotes to double quotes
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'); // unquoted keys

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Failed to parse config from HTML');
        console.error('Extracted string:', configStr.substring(0, 500));
        throw e;
    }
}

// Compare CSV and config
function compare(csvData, config, configName) {
    console.log(`\n📋 Comparing ${configName}...`);

    let matches = true;
    let totalChecked = 0;
    let mismatches = [];

    for (const [type, variants] of Object.entries(csvData)) {
        if (!config[type]) {
            mismatches.push(`❌ Type "${type}" in CSV but NOT in config`);
            matches = false;
            continue;
        }

        const configVariants = config[type].variants;

        for (const [name, csvHex] of Object.entries(variants)) {
            totalChecked++;

            if (!configVariants[name]) {
                mismatches.push(`❌ ${type} > "${name}" in CSV but NOT in config`);
                matches = false;
                continue;
            }

            const configHex = configVariants[name].code;
            if (csvHex !== configHex) {
                mismatches.push(
                    `❌ ${type} > "${name}": CSV has "${csvHex}" but config has "${configHex}"`
                );
                matches = false;
            }
        }

        // Check for extra variants in config
        for (const [name, variant] of Object.entries(configVariants)) {
            if (!variants[name]) {
                mismatches.push(
                    `❌ ${type} > "${name}" in config but NOT in CSV`
                );
                matches = false;
            }
        }
    }

    // Check for extra types in config
    for (const type of Object.keys(config)) {
        if (!csvData[type]) {
            mismatches.push(`❌ Type "${type}" in config but NOT in CSV`);
            matches = false;
        }
    }

    if (matches) {
        console.log(`✅ ${configName} matches CSV perfectly! (${totalChecked} variants checked)`);
    } else {
        console.log(`\n🔴 Found ${mismatches.length} mismatches in ${configName}:`);
        mismatches.forEach(m => console.log(`   ${m}`));
    }

    return matches;
}

// Main
try {
    console.log('🔍 Validating SPOOLER config against CSV files...\n');

    const htmlPath = path.join(__dirname, 'index.html');
    const genericCsvPath = path.join(__dirname, 'CSV', 'COMPLETE-MATERIAL-REFERENCE_GENERIC csv 5f1d26cb4d86839da51381c82f16af1d.csv');
    const elegooCsvPath = path.join(__dirname, 'CSV', 'COMPLETE-MATERIAL-REFERENCE_ELEGOO csv 3cad26cb4d8680b8959dc6eea48c37c0.csv');

    // Parse CSVs
    const genericCsv = parseCSV(genericCsvPath);
    const elegooCsv = parseCSV(elegooCsvPath);

    // Extract configs from HTML
    const genericConfig = extractConfigFromHTML(htmlPath, 'MATERIAL_CONFIG_GENERIC');
    const elegooConfig = extractConfigFromHTML(htmlPath, 'MATERIAL_CONFIG_ELEGOO');

    // Compare
    const genericMatch = compare(genericCsv, genericConfig, 'MATERIAL_CONFIG_GENERIC');
    const elegooMatch = compare(elegooCsv, elegooConfig, 'MATERIAL_CONFIG_ELEGOO');

    console.log('\n' + '='.repeat(60));
    if (genericMatch && elegooMatch) {
        console.log('✅ ALL CONFIGS MATCH! Your spooler is in sync with CSVs.\n');
        process.exit(0);
    } else {
        console.log('❌ MISMATCHES FOUND! Please review above.\n');
        process.exit(1);
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
