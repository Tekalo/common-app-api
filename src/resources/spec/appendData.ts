import fs from 'fs';
import specJson from './specGenerator.js';

const filePath = `${process.cwd()}/src/resources/spec/spec.json`;

// Write the auto-generated json data into spec.json.
fs.writeFileSync(filePath, JSON.stringify(specJson, null, 2));
