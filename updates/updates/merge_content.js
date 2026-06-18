const fs = require('fs');

// Read the current index.html to get the framework
const indexHtml = fs.readFileSync('./index.html', 'utf8');

// Extract the framework (everything up to and including the opening of the two-column layout)
const frameworkStart = indexHtml.indexOf('<!DOCTYPE html>');
const twoColumnStart = indexHtml.indexOf('<div class="grid grid-cols-1 gap-10 items-start lg:grid-cols-[200px_1fr] lg:gap-16">');

const framework = indexHtml.substring(0, twoColumnStart) + '<div class="grid grid-cols-1 gap-10 items-start lg:grid-cols-[200px_1fr] lg:gap-16">\n';

// Extract the closing tags
const mainEnd = '</main>\n';
const gridEnd = '</div>\n';
const bodyEnd = '</body>\n';
const htmlEnd = '</html>\n';

// Read the content.html
const content = fs.readFileSync('./content.html', 'utf8');

// Build the final index.html
const finalHtml = framework + content + gridEnd + bodyEnd + htmlEnd;

// Write the final index.html
fs.writeFileSync('./index.html', finalHtml, 'utf8');

console.log('Successfully generated index.html');
