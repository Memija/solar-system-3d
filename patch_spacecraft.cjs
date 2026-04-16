const fs = require('fs');
let code = fs.readFileSync('src/components/Spacecraft.ts', 'utf8');

// Remove import
code = code.replace(/import \{ createSpriteLabel \} from '\.\/LabelHelper\.js';\n/, '');

// Remove properties
code = code.replace(/    labelSprite: THREE\.Sprite \| null;\n/, '');

// Remove initialization
code = code.replace(/        this\.labelSprite = null;\n/, '');

// Remove invocations
code = code.replace(/        this\.createLabel\(\);\n/, '');

// Remove methods
code = code.replace(/    createLabel\(\) \{[\s\S]*?\}\n\n/g, '');

// Remove toggleLabels method
code = code.replace(/    toggleLabels\(visible: boolean\) \{[\s\S]*?\}\n/g, '');

fs.writeFileSync('src/components/Spacecraft.ts', code);
