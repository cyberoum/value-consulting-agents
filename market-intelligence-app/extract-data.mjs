// Script to extract data objects from the HTML file into ES modules
import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync('/Users/oumaimaaurag/Downloads/market-intelligence-v25_5.html', 'utf-8');

// Extract the script content
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.error('No script found'); process.exit(1); }
const script = scriptMatch[1];

// Data objects to extract and their target files
const extractions = [
  { varName: 'MARKETS_META', file: 'src/data/markets.js', exportName: 'MARKETS_META' },
  { varName: 'MARKET_DATA', file: 'src/data/markets.js', exportName: 'MARKET_DATA', append: true },
  { varName: 'COUNTRY_DATA', file: 'src/data/countries.js', exportName: 'COUNTRY_DATA' },
  { varName: 'BANK_DATA', file: 'src/data/banks.js', exportName: 'BANK_DATA' },
  { varName: 'QUAL_FRAMEWORK', file: 'src/data/qualification.js', exportName: 'QUAL_FRAMEWORK' },
  { varName: 'QUAL_DATA', file: 'src/data/qualification.js', exportName: 'QUAL_DATA', append: true },
  { varName: 'CX_DATA', file: 'src/data/cx.js', exportName: 'CX_DATA' },
  { varName: 'COMP_DATA', file: 'src/data/competition.js', exportName: 'COMP_DATA' },
  { varName: 'VALUE_SELLING', file: 'src/data/valueSelling.js', exportName: 'VALUE_SELLING' },
  { varName: 'SOURCES', file: 'src/data/sources.js', exportName: 'SOURCES' },
  { varName: 'GROUP_RELATIONSHIPS', file: 'src/data/relationships.js', exportName: 'GROUP_RELATIONSHIPS' },
];

// Extract a const declaration block from script
function extractConst(script, varName) {
  const regex = new RegExp(`const ${varName}\\s*=\\s*`);
  const match = script.match(regex);
  if (!match) { console.warn(`Could not find ${varName}`); return null; }

  const startIdx = match.index + match[0].length;
  let depth = 0;
  let i = startIdx;
  let started = false;

  while (i < script.length) {
    const ch = script[i];
    if (ch === '{' || ch === '[') { depth++; started = true; }
    if (ch === '}' || ch === ']') { depth--; }
    if (started && depth === 0) {
      return script.substring(match.index, i + 1).replace(`const ${varName}`, `export const ${varName}`);
    }
    // Skip strings
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i++;
      while (i < script.length && script[i] !== quote) {
        if (script[i] === '\\') i++; // skip escaped chars
        i++;
      }
    }
    i++;
  }
  console.warn(`Could not find end of ${varName}`);
  return null;
}

// Group by file
const fileContents = {};
for (const ext of extractions) {
  const content = extractConst(script, ext.varName);
  if (content) {
    if (fileContents[ext.file]) {
      fileContents[ext.file] += '\n\n' + content + ';\n';
    } else {
      fileContents[ext.file] = content + ';\n';
    }
    console.log(`✓ Extracted ${ext.varName} (${content.length} chars)`);
  }
}

// Write files
for (const [file, content] of Object.entries(fileContents)) {
  writeFileSync(file, content);
  console.log(`✓ Wrote ${file} (${(content.length/1024).toFixed(1)}KB)`);
}

// Now extract BANK_DATA patches (the if blocks at the end)
const patchRegex = /\/\/ .*?(?:add|NORDEA|DNB|HANDELS|SWED|DANSKE|OP|TF).*?\nif \(BANK_DATA\["(.*?)"\]\) \{[\s\S]*?(?=\n(?:\/\/|if \(BANK_DATA|function|let |const |$))/g;
let patches = '';
let patchMatch;
while ((patchMatch = patchRegex.exec(script)) !== null) {
  patches += patchMatch[0] + '\n\n';
}

if (patches) {
  // Read existing banks.js and append patches
  const banksContent = readFileSync('src/data/banks.js', 'utf-8');
  writeFileSync('src/data/banks.js', banksContent + '\n// ===== DATA PATCHES =====\n' + patches);
  console.log(`✓ Appended bank data patches (${(patches.length/1024).toFixed(1)}KB)`);
}

console.log('\nDone! All data extracted.');
