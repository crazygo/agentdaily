#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Merge Script for Index HTML Generation
 *
 * This script merges framework.html (static structure) with content.html (dynamic content)
 * to generate a complete index.html file.
 *
 * Usage:
 *   node templates/merge.js
 *   node templates/merge.js [output-filename]
 *
 * Files:
 *   - templates/framework.html: Contains header, styles, navigation, footer (static)
 *   - updates/content.html: Contains category sections with cards (AI-generated)
 *   - Output: updates/index.html (default) or custom filename
 */

const FRAMEWORK_FILE = path.join(__dirname, 'framework.html');
const CONTENT_FILE = path.join(__dirname, '../updates/content.html');
const DEFAULT_OUTPUT = path.join(__dirname, '../updates/index.html');
const CONTENT_PLACEHOLDER = '{{CONTENT}}';

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
        process.exit(1);
    }
}

function writeFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Successfully generated: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`❌ Error writing ${filePath}:`, error.message);
        return false;
    }
}

function merge() {
    console.log('🔄 Starting merge process...\n');

    // Read framework
    console.log(`📖 Reading framework.html...`);
    const framework = readFile(FRAMEWORK_FILE);

    // Read content
    console.log(`📖 Reading content.html...`);
    const content = readFile(CONTENT_FILE);

    // Check if placeholder exists
    if (!framework.includes(CONTENT_PLACEHOLDER)) {
        console.error(`❌ Error: Placeholder "${CONTENT_PLACEHOLDER}" not found in framework.html`);
        process.exit(1);
    }

    // Merge
    console.log(`🔀 Merging content into framework...`);
    const merged = framework.replace(CONTENT_PLACEHOLDER, content);

    // Get output filename from command line argument or use default
    const outputFile = process.argv[2] ? path.join(__dirname, '../updates', process.argv[2]) : DEFAULT_OUTPUT;

    // Write output
    console.log(`💾 Writing to ${path.basename(outputFile)}...\n`);
    if (writeFile(outputFile, merged)) {
        console.log('\n✨ Merge completed successfully!');
        console.log('\n📝 Summary:');
        console.log(`   Framework: templates/framework.html`);
        console.log(`   Content:   updates/content.html`);
        console.log(`   Output:    updates/${path.basename(outputFile)}`);
        console.log(`   Size:      ${(merged.length / 1024).toFixed(2)} KB`);
    }
}

// Run the merge
merge();
