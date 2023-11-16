const fs = require('fs');

if (process.argv.length < 3) {
  console.error('[generateNxScript.js] Usage: node generateNxScript.js <inputFile>');
  process.exit(1);
}

const inputFile = process.argv[2];
if(!inputFile.includes('.js')) {
  console.error('[generateNxScript.js] input file must be a Javascript file');
  process.exit(1);
}
const outputFile = inputFile.replace('.js', '.nx.js');
const searchString = 'export ';
const replacementString = '';

fs.readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const updatedData = data.replaceAll(searchString, replacementString);

  fs.writeFile(outputFile, updatedData, 'utf8', (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
});