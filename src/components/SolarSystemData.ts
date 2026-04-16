export interface LinkData {
    title: string;
    url: string;
}

export interface RingData {
    innerRadius: number;
    outerRadius: number;
    color: number;
    opacity?: number;
}

export interface MoonData {
    name: string;
    radius: number;
    distance: number;
    period: number;
    color: number;
    texture?: string;
    description?: string;
    imageUrl?: string;
    images?: string[];
    links?: LinkData[];
    rings?: RingData[];
    axialTilt?: number; // in degrees
}

export interface CelestialBodyData {
    name: string;
    radius: number;
    distance: number;
    period: number;
    color: number;
    texture: string;
    description: string;
    imageUrl: string;
    images?: string[];
    links?: LinkData[];
    moons?: MoonData[];
    rings?: RingData[];
    ra?: number; // For stars
    dec?: number; // For stars
    isDwarfPlanet?: boolean;
    axialTilt?: number; // in degrees
}

export interface StarData {
    name: string;
    ra: number;
    dec: number;
    color?: number;
    description?: string;
    imageUrl?: string;
    images?: string[];
    links?: LinkData[];
}

export interface SpacecraftData {
    name: string;
    targetBody?: string; // If undefined, it orbits the Sun or escapes
    distance: number; // distance from targetBody
    period: number; // orbital period
    inclination?: number;
    color: number;
    description?: string;
    imageUrl?: string;
    images?: string[];
    links?: LinkData[];
    escaping?: boolean; // For Voyager 1
    speed?: number; // For escaping spacecraft
}

export const SpacecraftDataList: SpacecraftData[] = [
    {
        name: "ISS (International Space Station)",
        targetBody: "Earth",
        distance: 2.5, // slightly larger than Earth's radius of 2
        period: 0.05, // fast orbit
        inclination: 51.6,
        color: 0xffffff,
        description: "The International Space Station (ISS) is a modular space station (habitable artificial satellite) in low Earth orbit. It is a multinational collaborative project involving five participating space agencies.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/800px-International_Space_Station_after_undocking_of_STS-132.jpg",
        links: [
            { title: "NASA: ISS", url: "https://www.nasa.gov/mission_pages/station/main/index.html" },
            { title: "Wikipedia: ISS", url: "https://en.wikipedia.org/wiki/International_Space_Station" }
        ]
    },
    {
        name: "Hubble Space Telescope",
        targetBody: "Earth",
        distance: 2.8,
        period: 0.06,
        inclination: 28.5,
        color: 0xcccccc,
        description: "The Hubble Space Telescope is a space telescope that was launched into low Earth orbit in 1990 and remains in operation. It is one of the largest and most versatile, well known both as a vital research tool and as a public relations boon for astronomy.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/HST-SM4.jpeg/800px-HST-SM4.jpeg",
        links: [
            { title: "NASA: Hubble", url: "https://www.nasa.gov/mission_pages/hubble/main/index.html" },
            { title: "Wikipedia: Hubble", url: "https://en.wikipedia.org/wiki/Hubble_Space_Telescope" }
        ]
    },
    {
        name: "Voyager 1",
        distance: 800, // Starts far out
        period: 0, // Not orbiting
        color: 0xaaaaaa,
        escaping: true,
        speed: 1.5,
        description: "Voyager 1 is a space probe launched by NASA on September 5, 1977. Part of the Voyager program to study the outer Solar System, Voyager 1 launched 16 days after its twin, Voyager 2. It is the most distant human-made object from Earth.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Voyager_spacecraft_model.png/800px-Voyager_spacecraft_model.png",
        links: [
            { title: "NASA: Voyager", url: "https://voyager.jpl.nasa.gov/" },
            { title: "Wikipedia: Voyager 1", url: "https://en.wikipedia.org/wiki/Voyager_1" }
        ]
    },
    {
        name: "James Webb Space Telescope",
        targetBody: "Earth",
        distance: 5.0, // L2 point, further out than Hubble
        period: 1.0, // Orbits the Sun with Earth, so period is 1 Earth year
        inclination: 0,
        color: 0xffd700,
        description: "The James Webb Space Telescope (JWST) is a space telescope designed primarily to conduct infrared astronomy. It is the largest space telescope in history, offering unprecedented resolution and sensitivity.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/James_Webb_Space_Telescope.jpg/800px-James_Webb_Space_Telescope.jpg",
        links: [
            { title: "NASA: JWST", url: "https://webb.nasa.gov/" },
            { title: "Wikipedia: JWST", url: "https://en.wikipedia.org/wiki/James_Webb_Space_Telescope" }
        ]
    },
    {
        name: "Cassini",
        targetBody: "Saturn",
        distance: 25,
        period: 0.1,
        color: 0xdddddd,
        description: "The Cassini-Huygens space-research mission involved a collaboration between NASA, the European Space Agency (ESA), and the Italian Space Agency (ASI) to send a space probe to study the planet Saturn and its system.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Cassini_Saturn_Orbit_Insertion.jpg/800px-Cassini_Saturn_Orbit_Insertion.jpg",
        links: [
            { title: "NASA: Cassini", url: "https://solarsystem.nasa.gov/missions/cassini/overview/" },
            { title: "Wikipedia: Cassini", url: "https://en.wikipedia.org/wiki/Cassini%E2%80%93Huygens" }
        ]
    },
    {
        name: "Voyager 2",
        distance: 700, // Starts far out
        period: 0, // Not orbiting
        color: 0x8888aa,
        escaping: true,
        speed: 1.4,
        description: "Voyager 2 is a space probe launched by NASA on August 20, 1977, to study the outer planets. It remains the only spacecraft to have visited either of the ice giants, Uranus and Neptune.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Voyager_spacecraft_model.png/800px-Voyager_spacecraft_model.png",
        links: [
            { title: "NASA: Voyager 2", url: "https://voyager.jpl.nasa.gov/" },
            { title: "Wikipedia: Voyager 2", url: "https://en.wikipedia.org/wiki/Voyager_2" }
        ]
    }
];

export interface ConstellationData {
    name: string;
    stars: StarData[];
    connections: number[][];
    color: number;
    description?: string;
    imageUrl?: string;
    images?: string[];
    links?: LinkData[];
}

export interface CometData {
    name: string;
    radius: number;
    semiMajorAxis: number;
    eccentricity: number;
    period: number;
    inclination: number; // in degrees
    argumentOfPeriapsis: number; // in degrees
    color: number;
    texture?: string;
    description?: string;
    imageUrl?: string;
    images?: string[];
    links?: LinkData[];
}

export const CometDataList: CometData[] = [
    {
        name: "Halley's Comet",
        radius: 0.1,
        semiMajorAxis: 180, // roughly scaled for visibility
        eccentricity: 0.967,
        period: 75.3,
        inclination: 162.2,
        argumentOfPeriapsis: 111.3,
        color: 0xffffff,
        description: "Halley's Comet or Comet Halley, officially designated 1P/Halley, is a short-period comet visible from Earth every 75-76 years. Halley is the only known short-period comet that is regularly visible to the naked eye from Earth.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Lspn_comet_halley.jpg/800px-Lspn_comet_halley.jpg",
        links: [
            { title: "NASA: Halley's Comet", url: "https://solarsystem.nasa.gov/asteroids-comets-and-meteors/comets/1p-halley/in-depth/" },
            { title: "Wikipedia: Halley's Comet", url: "https://en.wikipedia.org/wiki/Halley%27s_Comet" }
        ]
    },
    {
        name: "Hale-Bopp",
        radius: 0.3,
        semiMajorAxis: 300,
        eccentricity: 0.995,
        period: 2500,
        inclination: 89.4,
        argumentOfPeriapsis: 130.6,
        color: 0xccffff,
        description: "Comet Hale-Bopp (formally designated C/1995 O1) was perhaps the most widely observed comet of the 20th century and one of the brightest seen for many decades. It was visible to the naked eye for a record 18 months.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Comet_Hale-Bopp_1995O1.jpg/800px-Comet_Hale-Bopp_1995O1.jpg",
        links: [
            { title: "Wikipedia: Comet Hale-Bopp", url: "https://en.wikipedia.org/wiki/Comet_Hale-Bopp" }
        ]
    }
];

export const SolarSystemData: CelestialBodyData[] = [
    {
        name: "Sun",
        radius: 25, // Visual scale
        distance: 0,
        period: 0,
        color: 0xffff00,
        texture: 'textures/sun.png',
        axialTilt: 7.25,
        description: "The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating the energy mainly as visible light, ultraviolet light, and infrared radiation. It is by far the most important source of energy for life on Earth.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/800px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/800px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg",
            "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001435/GSFC_20171208_Archive_e001435~orig.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/9/97/X5.4_solar_flare_seen_by_SDO_in_131_%C3%85_extreme_ultraviolet_light.jpg"
        ],
        links: [
            { title: "NASA: Sun Overview", url: "https://science.nasa.gov/sun" },
            { title: "Wikipedia: Sun", url: "https://en.wikipedia.org/wiki/Sun" }
        ]
    },
    {
        name: "Mercury",
        radius: 0.76,
        distance: 60,
        period: 0.24,
        color: 0xaaaaaa,
        texture: 'textures/mercury.png',
        axialTilt: 0.034,
        description: "Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, the shortest of all the Sun's planets. It is named after the Roman god Mercurius (Mercury), god of commerce, messenger of the gods, and mediator between gods and mortals.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Mercury_in_color_-_Prockter07-edit1.jpg/800px-Mercury_in_color_-_Prockter07-edit1.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Mercury_in_color_-_Prockter07-edit1.jpg/800px-Mercury_in_color_-_Prockter07-edit1.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg",
            "https://images-assets.nasa.gov/image/PIA11364/PIA11364~orig.jpg"
        ],
        links: [
            { title: "NASA: Mercury Overview", url: "https://science.nasa.gov/mercury" },
            { title: "Wikipedia: Mercury", url: "https://en.wikipedia.org/wiki/Mercury_(planet)" }
        ]
    },
    {
        name: "Venus",
        radius: 1.9,
        distance: 90,
        period: 0.62,
        color: 0xffcc00,
        texture: 'textures/venus.png',
        axialTilt: 177.36,
        description: "Venus is the second planet from the Sun. It is named after the Roman goddess of love and beauty. As the brightest natural object in Earth's night sky after the Moon, Venus can cast shadows and can be visible to the naked eye in broad daylight.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Venus-real_color.jpg/800px-Venus-real_color.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Venus-real_color.jpg/800px-Venus-real_color.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/b/b2/Venus_2_Approach_Image.jpg",
            "https://images-assets.nasa.gov/image/PIA00271/PIA00271~orig.jpg"
        ],
        links: [
            { title: "NASA: Venus Overview", url: "https://science.nasa.gov/venus" },
            { title: "Wikipedia: Venus", url: "https://en.wikipedia.org/wiki/Venus" }
        ]
    },
    {
        name: "Earth",
        radius: 2,
        distance: 130,
        period: 1,
        color: 0x0000ff,
        texture: 'textures/earth.png',
        axialTilt: 23.44,
        description: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 29% of Earth's surface is land consisting of continents and islands. The remaining 71% is covered with water, mostly by oceans, seas, gulfs, and other salt-water bodies, but also by lakes, rivers, and other freshwater.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/800px-The_Earth_seen_from_Apollo_17.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/800px-The_Earth_seen_from_Apollo_17.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/0/0d/Africa_and_Europe_from_a_Million_Miles_Away.png",
            "https://images-assets.nasa.gov/image/PIA18033/PIA18033~orig.jpg"
        ],
        links: [
            { title: "NASA: Earth Overview", url: "https://science.nasa.gov/earth" },
            { title: "Wikipedia: Earth", url: "https://en.wikipedia.org/wiki/Earth" }
        ],
        moons: [
            {
                name: "Moon",
                radius: 0.27,
                distance: 5,
                period: 0.074,
                color: 0x888888,
                texture: 'textures/moon.jpg',
                axialTilt: 6.68,
                description: "The Moon is Earth's only natural satellite. It is the fifth largest satellite in the Solar System and the largest and most massive relative to its parent planet.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/800px-FullMoon2010.jpg",
                images: [
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/800px-FullMoon2010.jpg",
                    "https://upload.wikimedia.org/wikipedia/commons/d/dd/Full_Moon_Luc_Viatour.jpg",
                    "https://images-assets.nasa.gov/image/PIA00405/PIA00405~orig.jpg"
                ],
                links: [
                    { title: "NASA: Moon Overview", url: "https://science.nasa.gov/moon" },
                    { title: "Wikipedia: Moon", url: "https://en.wikipedia.org/wiki/Moon" }
                ]
            }
        ]
    },
    {
        name: "Mars",
        radius: 1.06,
        distance: 170,
        period: 1.88,
        color: 0xff0000,
        texture: 'textures/mars.png',
        axialTilt: 25.19,
        description: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System, being larger than only Mercury. In English, Mars carries the name of the Roman god of war and is often referred to as the 'Red Planet'.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/800px-OSIRIS_Mars_true_color.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/800px-OSIRIS_Mars_true_color.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/5/58/Mars_23_aug_2003_hubbe.jpg",
            "https://images-assets.nasa.gov/image/PIA02653/PIA02653~orig.jpg"
        ],
        links: [
            { title: "NASA: Mars Overview", url: "https://science.nasa.gov/mars" },
            { title: "Wikipedia: Mars", url: "https://en.wikipedia.org/wiki/Mars" }
        ],
        moons: [
            {
                name: "Phobos",
                radius: 0.1,
                distance: 2,
                period: 0.03,
                color: 0x888888,
                description: "Phobos is the innermost and larger of the two natural satellites of Mars, the other being Deimos.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Phobos_colour_2008.jpg/800px-Phobos_colour_2008.jpg",
                links: [
                    { title: "Wikipedia: Phobos", url: "https://en.wikipedia.org/wiki/Phobos_(moon)" }
                ]
            },
            {
                name: "Deimos",
                radius: 0.06,
                distance: 3.5,
                period: 0.12,
                color: 0x999999,
                description: "Deimos is the smaller and outermost of the two natural satellites of Mars.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Deimos-MRO.jpg/800px-Deimos-MRO.jpg",
                links: [
                    { title: "Wikipedia: Deimos", url: "https://en.wikipedia.org/wiki/Deimos_(moon)" }
                ]
            }
        ]
    },
    {
        name: "Jupiter",
        radius: 11.2,
        distance: 280,
        period: 11.86,
        color: 0xffa500,
        texture: 'textures/jupiter.png',
        axialTilt: 3.13,
        description: "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets in the Solar System combined.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/800px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg/800px-Jupiter_and_its_shrunken_Great_Red_Spot.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg",
            "https://images-assets.nasa.gov/image/PIA22946/PIA22946~orig.jpg"
        ],
        links: [
            { title: "NASA: Jupiter Overview", url: "https://science.nasa.gov/jupiter" },
            { title: "Wikipedia: Jupiter", url: "https://en.wikipedia.org/wiki/Jupiter" }
        ],
        moons: [
            { name: "Io", radius: 0.28, distance: 15, period: 0.005, color: 0xffff00 },
            { name: "Europa", radius: 0.25, distance: 17, period: 0.01, color: 0xffffff },
            { name: "Ganymede", radius: 0.41, distance: 19, period: 0.02, color: 0x888888 },
            { name: "Callisto", radius: 0.38, distance: 21, period: 0.045, color: 0x555555 }
        ]
    },
    {
        name: "Saturn",
        radius: 9.45,
        distance: 400,
        period: 29.45,
        color: 0xffd700,
        texture: 'textures/saturn.png',
        axialTilt: 26.73,
        description: "Saturn is the sixth planet from the Sun and the second-largest in the Solar System, after Jupiter. It is a gas giant with an average radius of about nine and a half times that of Earth. It has only one-eighth the average density of Earth; however, with its larger volume, Saturn is over 95 times more massive.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/800px-Saturn_during_Equinox.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/800px-Saturn_during_Equinox.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/b/b4/Saturn_%28planet%29_large.jpg",
            "https://images-assets.nasa.gov/image/PIA11141/PIA11141~orig.jpg"
        ],
        links: [
            { title: "NASA: Saturn Overview", url: "https://science.nasa.gov/saturn" },
            { title: "Wikipedia: Saturn", url: "https://en.wikipedia.org/wiki/Saturn" }
        ],
        moons: [
            { name: "Titan", radius: 0.4, distance: 15, period: 0.044, color: 0xffaa00 }
        ],
        rings: [
            { innerRadius: 11, outerRadius: 21, color: 0xe6e6cd, opacity: 0.8 },
            { innerRadius: 21.5, outerRadius: 23, color: 0xcdcdb4, opacity: 0.6 }
        ]
    },
    {
        name: "Uranus",
        radius: 6,
        distance: 520,
        period: 84,
        color: 0x00ffff,
        texture: 'textures/uranus.png',
        axialTilt: 97.77,
        description: "Uranus is the seventh planet from the Sun. Its name is a reference to the Greek god of the sky, Uranus, who, according to Greek mythology, was the great-grandfather of Ares (Mars), grandfather of Zeus (Jupiter) and father of Cronus (Saturn). It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/800px-Uranus2.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/800px-Uranus2.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/c/c9/Uranus_as_seen_by_NASA%27s_Voyager_2_%28remastered%29_-_JPEG_converted.jpg",
            "https://images-assets.nasa.gov/image/PIA18182/PIA18182~orig.jpg"
        ],
        links: [
            { title: "NASA: Uranus Overview", url: "https://science.nasa.gov/uranus" },
            { title: "Wikipedia: Uranus", url: "https://en.wikipedia.org/wiki/Uranus" }
        ],
        rings: [
            { innerRadius: 9.5, outerRadius: 9.7, color: 0x99ccff, opacity: 0.4 },
            { innerRadius: 10, outerRadius: 12, color: 0x99ccff, opacity: 0.1 }
        ]
    },
    {
        name: "Neptune",
        radius: 5.82,
        distance: 640,
        period: 164.8,
        color: 0x0000ff,
        texture: 'textures/neptune.png',
        axialTilt: 28.32,
        description: "Neptune is the eighth and farthest-known Solar planet from the Sun. In the Solar System, it is the fourth-largest planet by diameter, the third-most-massive planet, and the densest giant planet. It is 17 times the mass of Earth, slightly more massive than its near-twin Uranus.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg/800px-Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg/800px-Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg",
            "https://images-assets.nasa.gov/image/PIA01492/PIA01492~orig.jpg"
        ],
        links: [
            { title: "NASA: Neptune Overview", url: "https://science.nasa.gov/neptune" },
            { title: "Wikipedia: Neptune", url: "https://en.wikipedia.org/wiki/Neptune" }
        ],
        moons: [
            {
                name: "Triton",
                radius: 0.35,
                distance: 12,
                period: 0.06,
                color: 0xcccccc,
                description: "Triton is the largest natural satellite of the planet Neptune, and the first Neptunian moon to be discovered.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Triton_moon_mosaic_Voyager_2_%28large%29.jpg/800px-Triton_moon_mosaic_Voyager_2_%28large%29.jpg",
                links: [
                    { title: "Wikipedia: Triton", url: "https://en.wikipedia.org/wiki/Triton_(moon)" }
                ]
            }
        ]
    },
    // Dwarf Planets
    {
        name: "Pluto",
        isDwarfPlanet: true,
        radius: 0.36,
        distance: 700,
        period: 248,
        color: 0xddaa88,
        texture: 'textures/pluto.png',
        axialTilt: 122.53,
        description: "Pluto is a dwarf planet in the Kuiper belt, a ring of bodies beyond the orbit of Neptune. It was the first and the largest Kuiper belt object to be discovered. Pluto was discovered by Clyde Tombaugh in 1930 and declared to be the ninth planet from the Sun.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Pluto_in_True_Color_-_High-Res.jpg/800px-Pluto_in_True_Color_-_High-Res.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Pluto_in_True_Color_-_High-Res.jpg/800px-Pluto_in_True_Color_-_High-Res.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/a/a7/Pluto-01_Stern_03_Pluto_Color_TXT.jpg",
            "https://images-assets.nasa.gov/image/PIA19952/PIA19952~orig.jpg"
        ],
        links: [
            { title: "NASA: Pluto Overview", url: "https://science.nasa.gov/dwarf-planets/pluto" },
            { title: "Wikipedia: Pluto", url: "https://en.wikipedia.org/wiki/Pluto" }
        ],
        moons: [
            {
                name: "Charon",
                radius: 0.18,
                distance: 2.0,
                period: 0.017,
                color: 0xaaaaaa,
                description: "Charon is the largest of the five known natural satellites of the dwarf planet Pluto.",
                imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Charon_in_True_Color_-_High-Res.jpg/800px-Charon_in_True_Color_-_High-Res.jpg",
                links: [
                    { title: "Wikipedia: Charon", url: "https://en.wikipedia.org/wiki/Charon_(moon)" }
                ]
            }
        ]
    },
    {
        name: "Ceres",
        isDwarfPlanet: true,
        radius: 0.14,
        distance: 220,
        period: 4.6,
        color: 0x888888,
        texture: 'textures/ceres.png',
        description: "Ceres is a dwarf planet in the asteroid belt between the orbits of Mars and Jupiter. It was the first asteroid discovered, on 1 January 1801, by Giuseppe Piazzi at Palermo Astronomical Observatory in Sicily. Originally considered a planet, it was reclassified as an asteroid in the 1850s.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29_%28cropped%29.jpg/800px-Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29_%28cropped%29.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29_%28cropped%29.jpg/800px-Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/5/58/Ceres_-_RC3_-_Haulani_Crater_%2822381131691%29.jpg",
            "https://images-assets.nasa.gov/image/PIA19631/PIA19631~orig.jpg"
        ],
        links: [
            { title: "NASA: Ceres Overview", url: "https://science.nasa.gov/dwarf-planets/ceres" },
            { title: "Wikipedia: Ceres", url: "https://en.wikipedia.org/wiki/Ceres_(dwarf_planet)" }
        ]
    },
    {
        name: "Eris",
        isDwarfPlanet: true,
        radius: 0.36,
        distance: 780,
        period: 558,
        color: 0xcccccc,
        texture: 'textures/ceres.png', // Fallback texture since there is no eris.png
        description: "Eris is the most massive and second-largest known dwarf planet in the Solar System. It is a trans-Neptunian object (TNO) in the scattered disk and has a high-eccentricity orbit.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Eris_and_dysnomia2.jpg/800px-Eris_and_dysnomia2.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Eris_and_dysnomia2.jpg/800px-Eris_and_dysnomia2.jpg"
        ],
        links: [
            { title: "NASA: Eris Overview", url: "https://science.nasa.gov/dwarf-planets/eris" },
            { title: "Wikipedia: Eris", url: "https://en.wikipedia.org/wiki/Eris_(dwarf_planet)" }
        ]
    },
    {
        name: "Haumea",
        isDwarfPlanet: true,
        radius: 0.3,
        distance: 740,
        period: 284,
        color: 0xaaaaaa,
        texture: 'textures/haumea.png',
        description: "Haumea is a dwarf planet located beyond Neptune's orbit. It was discovered in 2004 by a team headed by Mike Brown of Caltech at the Palomar Observatory in the United States and independently in 2005 by a team headed by José Luis Ortiz Moreno at the Sierra Nevada Observatory in Spain.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Haumea_Hubble.png/800px-Haumea_Hubble.png",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Haumea_Hubble.png/800px-Haumea_Hubble.png",
            "https://upload.wikimedia.org/wikipedia/commons/9/9c/Haumea_Rotation.gif"
        ],
        links: [
            { title: "NASA: Haumea Overview", url: "https://science.nasa.gov/dwarf-planets/haumea" },
            { title: "Wikipedia: Haumea", url: "https://en.wikipedia.org/wiki/Haumea" }
        ]
    },
    {
        name: "Makemake",
        isDwarfPlanet: true,
        radius: 0.22,
        distance: 760,
        period: 309,
        color: 0xaa8866,
        texture: 'textures/makemake.png',
        description: "Makemake is a dwarf planet and perhaps the second-largest Kuiper belt object in the classical population, with a diameter approximately two-thirds that of Pluto. Makemake has one known satellite, S/2015 (136472) 1. Its extremely low average temperature, about 30 K (−243.2 °C), means its surface is covered with methane, ethane, and possibly nitrogen ices.",
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Makemake_moon_Hubble_image_with_legend.jpg/800px-Makemake_moon_Hubble_image_with_legend.jpg",
        images: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Makemake_moon_Hubble_image_with_legend.jpg/800px-Makemake_moon_Hubble_image_with_legend.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/2/29/Makemake_and_its_moon.jpg"
        ],
        links: [
            { title: "NASA: Makemake Overview", url: "https://science.nasa.gov/dwarf-planets/makemake" },
            { title: "Wikipedia: Makemake", url: "https://en.wikipedia.org/wiki/Makemake" }
        ]
    }
];
