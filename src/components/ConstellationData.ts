import { ConstellationData } from './SolarSystemData.js';

export const MajorConstellations: ConstellationData[] = [
    {
        name: "Ursa Major (Big Dipper)",
        description: "Ursa Major is a constellation in the northern sky, whose associated mythology likely dates back into prehistory. Its Latin name means 'greater (or larger) bear', referring to and contrasting with nearby Ursa Minor, the lesser bear.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Ursa_Major_IAU.svg/800px-Ursa_Major_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Ursa_Major_IAU.svg/800px-Ursa_Major_IAU.svg.png",
            "https://cdn.esahubble.org/archives/images/screen/heic0406a.jpg"
        ],
        links: [
            { title: "Wikipedia: Ursa Major", url: "https://en.wikipedia.org/wiki/Ursa_Major" }
        ],
        stars: [
            { name: "Dubhe", ra: 11.062, dec: 61.75 },
            { name: "Merak", ra: 11.03, dec: 56.38 },
            { name: "Phecda", ra: 11.897, dec: 53.69 },
            { name: "Megrez", ra: 12.257, dec: 57.03 },
            { name: "Alioth", ra: 12.9, dec: 55.96 },
            { name: "Mizar", ra: 13.398, dec: 54.92 },
            { name: "Alkaid", ra: 13.792, dec: 49.31 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]],
        color: 0x00ffff
    },
    {
        name: "Ursa Minor (Little Dipper)",
        description: "Ursa Minor is a constellation in the Northern Sky. Like the Great Bear, the tail of the Little Bear may also be seen as the handle of a ladle, hence the North American name, Little Dipper.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Ursa_Minor_IAU.svg/800px-Ursa_Minor_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Ursa_Minor_IAU.svg/800px-Ursa_Minor_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Ursa Minor", url: "https://en.wikipedia.org/wiki/Ursa_Minor" }
        ],
        stars: [
            { name: "Polaris", ra: 2.53, dec: 89.26 },
            { name: "Yildun", ra: 17.54, dec: 86.58 },
            { name: "Epsilon UMi", ra: 16.76, dec: 82.03 },
            { name: "Zeta UMi", ra: 15.73, dec: 77.79 },
            { name: "Eta UMi", ra: 16.29, dec: 75.75 },
            { name: "Pherkad", ra: 15.34, dec: 71.83 },
            { name: "Kochab", ra: 14.84, dec: 74.15 }
        ],
        connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 2]],
        color: 0x00ff88
    },
    {
        name: "Orion",
        description: "Orion is a prominent constellation located on the celestial equator and visible throughout the world. It is one of the most conspicuous and recognizable constellations in the night sky.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Orion_IAU.svg/800px-Orion_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Orion_IAU.svg/800px-Orion_IAU.svg.png",
            "https://cdn.esahubble.org/archives/images/screen/heic0601a.jpg"
        ],
        links: [
            { title: "Wikipedia: Orion", url: "https://en.wikipedia.org/wiki/Orion_(constellation)" }
        ],
        stars: [
            { name: "Betelgeuse", ra: 5.92, dec: 7.41 },
            { name: "Rigel", ra: 5.24, dec: -8.20 },
            { name: "Bellatrix", ra: 5.42, dec: 6.35 },
            { name: "Mintaka", ra: 5.53, dec: -0.30 },
            { name: "Alnilam", ra: 5.60, dec: -1.20 },
            { name: "Alnitak", ra: 5.68, dec: -1.94 },
            { name: "Saiph", ra: 5.79, dec: -9.67 }
        ],
        connections: [
            [0, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [1, 5], [3, 0], // Body
            [0, 5] // Diagonal
        ],
        color: 0xffaa00
    },
    {
        name: "Cassiopeia",
        description: "Cassiopeia is a constellation in the northern sky, named after the vain queen Cassiopeia in Greek mythology, who boasted about her unrivalled beauty.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Cassiopeia_IAU.svg/800px-Cassiopeia_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Cassiopeia_IAU.svg/800px-Cassiopeia_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Cassiopeia", url: "https://en.wikipedia.org/wiki/Cassiopeia_(constellation)" }
        ],
        stars: [
            { name: "Schedar", ra: 0.67, dec: 56.53 },
            { name: "Caph", ra: 0.15, dec: 59.15 },
            { name: "Gamma Cas", ra: 0.93, dec: 60.72 },
            { name: "Ruchbah", ra: 1.43, dec: 60.23 },
            { name: "Segin", ra: 1.90, dec: 63.67 }
        ],
        connections: [[0, 1], [0, 2], [2, 3], [3, 4]],
        color: 0xff00ff
    },
    {
        name: "Cygnus (The Swan)",
        description: "Cygnus is a northern constellation on the plane of the Milky Way, deriving its name from the Latinized Greek word for swan. It is one of the most recognizable constellations of the northern summer and autumn.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Cygnus_IAU.svg/800px-Cygnus_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Cygnus_IAU.svg/800px-Cygnus_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Cygnus", url: "https://en.wikipedia.org/wiki/Cygnus_(constellation)" }
        ],
        stars: [
            { name: "Deneb", ra: 20.69, dec: 45.28 },
            { name: "Sadr", ra: 20.37, dec: 40.26 },
            { name: "Gienah", ra: 20.77, dec: 33.97 },
            { name: "Albireo", ra: 19.51, dec: 27.96 },
            { name: "Delta Cyg", ra: 19.75, dec: 45.13 }
        ],
        connections: [[0, 1], [1, 2], [1, 3], [1, 4]], // Cross shape
        color: 0x00ccff
    },
    {
        name: "Scorpius",
        description: "Scorpius is one of the constellations of the zodiac. Its name is Latin for scorpion. It lies between Libra to the west and Sagittarius to the east. It is a large constellation located in the southern hemisphere near the center of the Milky Way.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Scorpius_IAU.svg/800px-Scorpius_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Scorpius_IAU.svg/800px-Scorpius_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Scorpius", url: "https://en.wikipedia.org/wiki/Scorpius" }
        ],
        stars: [
            { name: "Antares", ra: 16.49, dec: -26.43 },
            { name: "Graffias", ra: 16.09, dec: -19.80 },
            { name: "Dschubba", ra: 16.00, dec: -22.62 },
            { name: "Sargas", ra: 17.62, dec: -43.00 },
            { name: "Shaula", ra: 17.56, dec: -37.10 },
            { name: "Wei", ra: 16.84, dec: -25.11 } // Approximate hook start
        ],
        connections: [[0, 2], [2, 1], [0, 5], [5, 3], [3, 4]], // Simplified hook
        color: 0xff4400
    },
    {
        name: "Crux (Southern Cross)",
        description: "Crux is a constellation in the southern sky that is centred on four bright stars in a cross-shaped asterism known as the Southern Cross. It lies on the southern end of the Milky Way's visible band.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Crux_IAU.svg/800px-Crux_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Crux_IAU.svg/800px-Crux_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Crux", url: "https://en.wikipedia.org/wiki/Crux" }
        ],
        stars: [
            { name: "Acrux", ra: 12.44, dec: -63.10 },
            { name: "Mimosa", ra: 12.79, dec: -59.68 },
            { name: "Gacrux", ra: 12.52, dec: -57.11 },
            { name: "Delta Cru", ra: 12.25, dec: -58.75 }
        ],
        connections: [[0, 2], [1, 3]], // Cross
        color: 0xffffff
    },
    {
        name: "Leo",
        description: "Leo is one of the constellations of the zodiac, lying between Cancer the crab to the west and Virgo the maiden to the east. Its name is Latin for lion.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Leo_IAU.svg/800px-Leo_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Leo_IAU.svg/800px-Leo_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Leo", url: "https://en.wikipedia.org/wiki/Leo_(constellation)" }
        ],
        stars: [
            { name: "Regulus", ra: 10.14, dec: 11.97 },
            { name: "Denebola", ra: 11.82, dec: 14.57 },
            { name: "Algieba", ra: 10.33, dec: 19.84 },
            { name: "Zosma", ra: 11.24, dec: 20.52 }
        ],
        connections: [[0, 2], [2, 3], [3, 1], [0, 1]], // Simplified body
        color: 0xffd700
    },
    {
        name: "Gemini",
        description: "Gemini is one of the constellations of the zodiac. Its name is Latin for twins, and it is associated with the mythological twins Castor and Pollux.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gemini_IAU.svg/800px-Gemini_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gemini_IAU.svg/800px-Gemini_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Gemini", url: "https://en.wikipedia.org/wiki/Gemini_(constellation)" }
        ],
        stars: [
            { name: "Pollux", ra: 7.76, dec: 28.03 },
            { name: "Castor", ra: 7.58, dec: 31.89 },
            { name: "Alhena", ra: 6.63, dec: 16.39 }
        ],
        connections: [[0, 1], [0, 2]], // Simplified
        color: 0xffa500
    },
    {
        name: "Taurus",
        description: "Taurus is one of the constellations of the zodiac and is located in the northern hemisphere. Taurus is a large and prominent constellation in the northern hemisphere's winter sky.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Taurus_IAU.svg/800px-Taurus_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Taurus_IAU.svg/800px-Taurus_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Taurus", url: "https://en.wikipedia.org/wiki/Taurus_(constellation)" }
        ],
        stars: [
            { name: "Aldebaran", ra: 4.60, dec: 16.51 },
            { name: "Elnath", ra: 5.43, dec: 28.61 },
            { name: "Alcyone", ra: 3.79, dec: 24.11 } // Pleiades
        ],
        connections: [[0, 1], [0, 2]], // V shape
        color: 0xff8c00
    },
    {
        name: "Canis Major",
        description: "Canis Major is a constellation in the southern celestial hemisphere. In the second century, it was included in Ptolemy's 48 constellations, and is counted among the 88 modern constellations.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Canis_Major_IAU.svg/800px-Canis_Major_IAU.svg.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Canis_Major_IAU.svg/800px-Canis_Major_IAU.svg.png"
        ],
        links: [
            { title: "Wikipedia: Canis Major", url: "https://en.wikipedia.org/wiki/Canis_Major" }
        ],
        stars: [
            { name: "Sirius", ra: 6.75, dec: -16.72 },
            { name: "Adhara", ra: 6.98, dec: -28.97 },
            { name: "Wezen", ra: 7.14, dec: -26.39 }
        ],
        connections: [[0, 1], [1, 2]],
        color: 0xffffff
    }
];
