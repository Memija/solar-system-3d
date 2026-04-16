const fs = require('fs');
let code = fs.readFileSync('src/components/CelestialBody.ts', 'utf8');

// Remove import
code = code.replace(/import \{ createSpriteLabel, createInfoLabel, updateInfoLabel \} from '\.\/LabelHelper\.js';\n/, '');

// Remove properties
code = code.replace(/    labelSprite: THREE\.Sprite \| null;\n/, '');
code = code.replace(/    infoSprite: THREE\.Sprite \| null;\n/, '');

// Remove initialization
code = code.replace(/        this\.labelSprite = null;\n/, '');
code = code.replace(/        this\.infoSprite = null;\n/, '');

// Remove invocations
code = code.replace(/        \/\/ Create Labels\n        this\.createLabel\(\);\n        this\.createInfoLabel\(\);\n/, '');

// Remove methods
code = code.replace(/    createLabel\(\) \{[\s\S]*?\}\n\n/g, '');
code = code.replace(/    createInfoLabel\(\) \{[\s\S]*?\}\n\n/g, '');

// Remove toggleMoons logic
code = code.replace(/            if \(moon\.labelSprite\) moon\.labelSprite\.visible = visible;\n/, '');

// Remove update logic
code = code.replace(/        if \(this\.infoSprite && this\.infoSprite\.visible\) \{[\s\S]*?\}\n\n/, '');

// Remove toggleLabels and toggleInfo methods
code = code.replace(/    toggleLabels\(visible: boolean\) \{[\s\S]*?\}\n\n/g, '');
code = code.replace(/    toggleInfo\(visible: boolean\) \{[\s\S]*?\}\n\n/g, '');

fs.writeFileSync('src/components/CelestialBody.ts', code);
