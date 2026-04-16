const fs = require('fs');
let code = fs.readFileSync('src/components/UIManager.ts', 'utf8');

// Remove from params object
code = code.replace(/            showLabels: true,\n/, '');
code = code.replace(/            showInfos: true,\n/, '');

// Remove GUI controls
code = code.replace(/        simFolder\.add\(params, 'showLabels'\)\.name\('Show Labels'\)\.onChange\(val => \{\n            this\.sceneManager\.toggleLabels\(val\);\n        \}\);\n/g, '');
code = code.replace(/        simFolder\.add\(params, 'showInfos'\)\.name\('Show Info'\)\.onChange\(val => \{\n            this\.sceneManager\.toggleInfos\(val\);\n        \}\);\n/g, '');

fs.writeFileSync('src/components/UIManager.ts', code);
