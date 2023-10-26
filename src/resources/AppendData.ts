import fs from 'fs';
import specJson from './specGenerator.js';

const filePath = `${process.cwd()}/src/resources/spec.json`;

// Write the auto-generated json data into spec.json.
try {
  fs.writeFileSync(filePath, JSON.stringify(specJson, null, 2));
} catch (error) {
  // doing nothing, leave the original spec.json as it is
}
