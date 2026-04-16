const fs = require('fs');
let code = fs.readFileSync('src/components/SceneManager.ts', 'utf8');

// Remove showLabels and showInfos from class properties
code = code.replace(/    showLabels: boolean;\n/g, '');
code = code.replace(/    showInfos: boolean;\n/g, '');

// Remove initialization
code = code.replace(/        this\.showLabels = true;\n/g, '');
code = code.replace(/        this\.showInfos = true;\n/g, '');

// Remove label creation for major stars
code = code.replace(/            const label = this\.createLabel\(star\.name\);\n            label\.position\.set\(x, y - 200, z\);\n            this\.scene\.add\(label\);\n/g, '');

// Remove createLabel method
code = code.replace(/    createLabel\(text: string\) \{[\s\S]*?return sprite;\n    \}\n\n/g, '');

// Remove toggleLabels and toggleInfos methods
code = code.replace(/    toggleLabels\(visible: boolean\) \{[\s\S]*?\}\n\n/g, '');
code = code.replace(/    toggleInfos\(visible: boolean\) \{[\s\S]*?\}\n\n/g, '');

// Remove label visibility updates in toggleComets and toggleSpacecrafts
code = code.replace(/            if \(comet\.labelSprite\) comet\.labelSprite\.visible = visible && this\.showLabels;\n/g, '');
code = code.replace(/            if \(sc\.labelSprite\) sc\.labelSprite\.visible = visible && this\.showLabels;\n/g, '');


fs.writeFileSync('src/components/SceneManager.ts', code);
