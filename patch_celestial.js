const fs = require('fs');
let code = fs.readFileSync('src/components/CelestialBody.ts', 'utf8');

// 1. Fix sun position in update()
code = code.replace(
    /const a = this\.realisticDistances && this\.data\.distanceAU \? this\.data\.distanceAU \* 130 : this\.data\.distance;\n\s+const e = this\.realisticDistances && this\.data\.eccentricity \? this\.data\.eccentricity : 0;\n\s+const b = a \* Math\.sqrt\(1 - e \* e\);\n\n\s+let x = 0;\n\s+let z = 0;\n\n\s+if \(e > 0\) {/g,
    `let x = 0;\n        let z = 0;\n\n        if (this.data.distance !== 0) {\n            const a = this.realisticDistances && this.data.distanceAU ? this.data.distanceAU * 130 : this.data.distance;\n            const e = this.realisticDistances && this.data.eccentricity ? this.data.eccentricity : 0;\n            const b = a * Math.sqrt(1 - e * e);\n\n            if (e > 0) {`
);

code = code.replace(
    /x = Math\.cos\(this\.angle\) \* a;\n\s+z = Math\.sin\(this\.angle\) \* a;\n\s+}/g,
    `x = Math.cos(this.angle) * a;\n                z = Math.sin(this.angle) * a;\n            }\n        }`
);

// 2. Add scaling logic in rebuildOrbit
code = code.replace(
    /rebuildOrbit\(realistic: boolean\) \{\n\s+this\.realisticDistances = realistic;/g,
    `rebuildOrbit(realistic: boolean) {\n        this.realisticDistances = realistic;\n        \n        const displayRadius = this.data.displayRadius ?? this.data.radius;\n        // 1 displayRadius (Earth) = 6371 km. 1 AU = 149597870 km. 1 AU in scene = 130 units.\n        const realisticRadius = displayRadius * 0.005536;\n        const scale = realistic ? (realisticRadius / this.data.radius) : 1.0;\n        this.tiltGroup.scale.setScalar(scale);`
);

fs.writeFileSync('src/components/CelestialBody.ts', code);
