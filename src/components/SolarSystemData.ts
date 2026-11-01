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
    displayRadius?: number;
    baseLongitude?: number;
    distance: number;
    distanceAU?: number;
    eccentricity?: number;
    period: number;
    inclination?: number; // in degrees
    longitudeOfPerihelion?: number; // in degrees
    longitudeOfAscendingNode?: number; // in degrees
    rotationPeriodDays?: number; // sidereal rotation period in solar days
    baseRotation?: number; // J2000 prime-meridian angle in radians
    tidallyLocked?: boolean;
    retrograde?: boolean;
    color: number;
    texture?: string;
    description?: string;
    imageUrl?: string;
    images?: string[];
    links?: LinkData[];
    rings?: RingData[];
    axialTilt?: number; // in degrees
    isDwarfPlanet?: boolean;
}

export interface CelestialBodyData {
    name: string;
    radius: number;
    displayRadius?: number;
    baseLongitude?: number;
    distance: number;
    distanceAU?: number;
    eccentricity?: number;
    period: number;
    inclination?: number; // in degrees
    longitudeOfPerihelion?: number; // in degrees
    longitudeOfAscendingNode?: number; // in degrees
    rotationPeriodDays?: number; // sidereal rotation period in solar days
    baseRotation?: number; // J2000 prime-meridian angle in radians
    tidallyLocked?: boolean;
    color: number;
    texture?: string;
    description: string;
    imageUrl: string;
    images?: string[];
    links?: LinkData[];
    moons?: MoonData[];
    rings?: RingData[];
    retrograde?: boolean;
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
    displayRadius?: number;
    links?: LinkData[];
}

export interface SpacecraftData {
    name: string;
    targetBody?: string; // If undefined, it orbits the Sun or escapes
    baseLongitude?: number;
    distance: number; // distance from targetBody
    distanceAU?: number;
    eccentricity?: number;
    period: number; // orbital period
    inclination?: number;
    color: number;
    description?: string;
    imageUrl?: string;
    images?: string[];
    displayRadius?: number;
    links?: LinkData[];
    escaping?: boolean; // For Voyager 1
    speed?: number; // For escaping spacecraft
    launchDate?: string;
    endDate?: string; // ISO 8601 string for start date
}

export const SpacecraftDataList: SpacecraftData[] = [
    {
        name: "Apollo 11",
        targetBody: "Moon",
        launchDate: "1969-07-16T13:32:00Z",
        endDate: "1969-07-24T16:50:35Z",
        distance: 1.1,
        distanceAU: 0.000012,
        eccentricity: 0.0,
        period: 0.005,
        inclination: 0.0,
        color: 0xffffff,
        description: "Apollo 11 was the American spaceflight that first landed humans on the Moon. Commander Neil Armstrong and Lunar Module Pilot Buzz Aldrin landed the Apollo Lunar Module Eagle on July 20, 1969. Armstrong became the first person to step onto the lunar surface six hours and 39 minutes later. The event marked a turning point in history and the end of the Space Race.",
        imageUrl: "images/800px-Aldrin_Apollo_11_original.webp",
        links: [
            { title: "NASA: Apollo 11", url: "https://www.nasa.gov/mission_pages/apollo/missions/apollo11.html" },
            { title: "Wikipedia: Apollo 11", url: "https://en.wikipedia.org/wiki/Apollo_11" }
        ]
    },
    {
        name: "Sputnik 1",
        targetBody: "Earth",
        launchDate: "1957-10-04T19:28:34Z",
        endDate: "1958-01-04T00:00:00Z",
        distance: 2.1,
        distanceAU: 0.000040,
        eccentricity: 0.05,
        period: 0.04,
        inclination: 65.1,
        color: 0xcccccc,
        description: "Sputnik 1 was the first artificial Earth satellite. The Soviet Union launched it into an elliptical low Earth orbit on 4 October 1957. It orbited for three weeks before its batteries died and then orbited silently for two months before it fell back into the atmosphere on the 4th January 1958. Its launch was a major event in the Cold War, and triggered the Space Race.",
        imageUrl: "images/800px-Sputnik_1_replica.webp",
        links: [
            { title: "NASA: Sputnik 1", url: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1957-001B" },
            { title: "Wikipedia: Sputnik 1", url: "https://en.wikipedia.org/wiki/Sputnik_1" }
        ]
    },
    {
        name: "ISS (International Space Station)",
        targetBody: "Earth",
        launchDate: "1998-11-20T06:40:00Z",
        distance: 2.5,
        distanceAU: 0.000045,
        eccentricity: 0.0003, // slightly larger than Earth's radius of 2
        period: 0.05, // fast orbit
        inclination: 51.6,
        color: 0xffffff,
        description: "The International Space Station (ISS) is a modular space station in low Earth orbit. The first component, Zarya, was launched on November 20, 1998. It is a multinational collaborative project involving five participating space agencies. It serves as a microgravity and space environment research laboratory in which scientific research is conducted in astrobiology, astronomy, meteorology, physics, and other fields.",
        imageUrl: "images/800px-International_Space_Station_after_undocking_of_STS-132.webp",
        links: [
            { title: "NASA: ISS", url: "https://www.nasa.gov/international-space-station/" },
            { title: "Wikipedia: ISS", url: "https://en.wikipedia.org/wiki/International_Space_Station" }
        ]
    },
    {
        name: "Hubble Space Telescope",
        targetBody: "Earth",
        launchDate: "1990-04-24T12:33:51Z",
        distance: 2.8,
        distanceAU: 0.000046,
        eccentricity: 0.0002,
        period: 0.06,
        inclination: 28.5,
        color: 0xcccccc,
        description: "The Hubble Space Telescope is a space telescope that was launched into low Earth orbit on April 24, 1990 aboard the Space Shuttle Discovery. It remains in operation and is one of the largest and most versatile, well known both as a vital research tool and as a public relations boon for astronomy. The Hubble telescope is named after astronomer Edwin Hubble and is one of NASA's Great Observatories.",
        imageUrl: "images/800px-HST-SM4.webp",
        links: [
            { title: "NASA: Hubble", url: "https://science.nasa.gov/mission/hubble/" },
            { title: "Wikipedia: Hubble", url: "https://en.wikipedia.org/wiki/Hubble_Space_Telescope" }
        ]
    },
    {
        name: "Voyager 1",
        targetBody: "Earth",
        launchDate: "1977-09-05T12:56:00Z",
        distance: 2.0,
        distanceAU: 0.000045,
        eccentricity: 0, // Starts far out
        period: 0, // Not orbiting
        color: 0xaaaaaa,
        escaping: true,
        speed: 1.5,
        description: "Voyager 1 is a space probe launched by NASA on September 5, 1977. Part of the Voyager program to study the outer Solar System, it launched 16 days after its twin, Voyager 2. It is the most distant human-made object from Earth. Its primary mission was to fly by Jupiter and Saturn, and it was the first spacecraft to cross the heliopause and enter interstellar space.",
        imageUrl: "images/800px-Voyager_spacecraft_model.webp",
        links: [
            { title: "NASA: Voyager", url: "https://voyager.jpl.nasa.gov/" },
            { title: "Wikipedia: Voyager 1", url: "https://en.wikipedia.org/wiki/Voyager_1" }
        ]
    },
    {
        name: "James Webb Space Telescope",
        targetBody: "Earth",
        launchDate: "2021-12-25T12:20:00Z",
        baseLongitude: 1.6385, // Anti-sunward Sun-Earth L2 longitude at launch epoch
        distance: 5.0,
        distanceAU: 0.01,
        eccentricity: 0, // L2 point, further out than Hubble
        period: 1.00001742, // Orbits in lockstep with Earth's sidereal year at Sun-Earth L2
        inclination: 0,
        color: 0xffd700,
        description: "The James Webb Space Telescope (JWST) is a space telescope designed primarily to conduct infrared astronomy. Launched on December 25, 2021, it is the largest space telescope in history, offering unprecedented resolution and sensitivity. JWST enables a broad range of investigations across the fields of astronomy and cosmology, such as observation of the first stars and the formation of the first galaxies.",
        imageUrl: "images/800px-James_Webb_Space_Telescope.webp",
        links: [
            { title: "NASA: JWST", url: "https://science.nasa.gov/mission/webb/" },
            { title: "Wikipedia: JWST", url: "https://en.wikipedia.org/wiki/James_Webb_Space_Telescope" }
        ]
    },
    {
        name: "Cassini",
        targetBody: "Saturn",
        launchDate: "1997-10-15T08:43:00Z",
        endDate: "2017-09-15T11:55:46Z",
        distance: 25,
        distanceAU: 0.008,
        eccentricity: 0,
        period: 0.1,
        color: 0xdddddd,
        description: "The Cassini-Huygens space-research mission involved a collaboration between NASA, the European Space Agency (ESA), and the Italian Space Agency (ASI) to send a space probe to study the planet Saturn and its system. The spacecraft arrived at Saturn in 2004 and spent 13 years studying the planet, its rings, and its moons, including releasing the Huygens lander onto Titan.",
        imageUrl: "images/800px-Cassini_Saturn_Orbit_Insertion.webp",
        links: [
            { title: "NASA: Cassini", url: "https://science.nasa.gov/mission/cassini/" },
            { title: "Wikipedia: Cassini", url: "https://en.wikipedia.org/wiki/Cassini%E2%80%93Huygens" }
        ]
    },
    {
        name: "Voyager 2",
        targetBody: "Earth",
        launchDate: "1977-08-20T14:29:44Z",
        distance: 2.0,
        distanceAU: 0.000045,
        eccentricity: 0, // Starts far out
        period: 0, // Not orbiting
        color: 0x8888aa,
        escaping: true,
        speed: 1.4,
        description: "Voyager 2 is a space probe launched by NASA on August 20, 1977, to study the outer planets. It remains the only spacecraft to have visited either of the ice giants, Uranus and Neptune. It successfully completed close flybys of Jupiter, Saturn, Uranus, and Neptune, capturing detailed images and scientific data before joining its twin in interstellar space.",
        imageUrl: "images/800px-Voyager_spacecraft_model.webp",
        links: [
            { title: "NASA: Voyager 2", url: "https://voyager.jpl.nasa.gov/" },
            { title: "Wikipedia: Voyager 2", url: "https://en.wikipedia.org/wiki/Voyager_2" }
        ]
    }
];

export interface ConstellationData {
    area?: string | number;
    brightestStar?: string;
    family?: string;
    name: string;
    stars: StarData[];
    connections: number[][];
    color: number;
    description?: string;
    imageUrl?: string;
    images?: string[];
    displayRadius?: number;
    links?: LinkData[];
}

export interface CometData {
    name: string;
    radius: number;
    displayRadius?: number;
    baseLongitude?: number;
    distanceAU?: number;
    semiMajorAxis: number;
    eccentricity: number;
    period: number;
    inclination: number; // in degrees
    argumentOfPeriapsis: number; // in degrees
    longitudeOfAscendingNode?: number; // in degrees
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
        baseLongitude: 1.15665,
        radius: 0.1, displayRadius: 0.00086,
        distanceAU: 17.834,
        semiMajorAxis: 180, // roughly scaled for visibility
        eccentricity: 0.96714,
        period: 75.464,
        inclination: 162.26,
        argumentOfPeriapsis: 111.33,
        longitudeOfAscendingNode: 58.42,
        color: 0xffffff,
        description: "Halley's Comet or Comet Halley, officially designated 1P/Halley, is a short-period comet visible from Earth every 75-76 years. Halley is the only known short-period comet that is regularly visible to the naked eye from Earth.",
        imageUrl: "images/800px-Lspn_comet_halley.webp",
        links: [
            { title: "NASA: Halley's Comet", url: "https://science.nasa.gov/solar-system/comets/1p-halley/" },
            { title: "Wikipedia: Halley's Comet", url: "https://en.wikipedia.org/wiki/Halley%27s_Comet" }
        ]
    },
    {
        name: "Hale-Bopp",
        baseLongitude: 0.0073187,
        radius: 0.3, displayRadius: 0.0047,
        distanceAU: 177.41,
        semiMajorAxis: 300,
        eccentricity: 0.99485,
        period: 2363.1,
        inclination: 89.43,
        argumentOfPeriapsis: 130.59,
        longitudeOfAscendingNode: 282.47,
        color: 0xccffff,
        description: "Comet Hale-Bopp (formally designated C/1995 O1) was perhaps the most widely observed comet of the 20th century and one of the brightest seen for many decades. It was visible to the naked eye for a record 18 months.",
        imageUrl: "images/800px-Comet_Hale-Bopp_1995O1.webp",
        links: [
            { title: "Wikipedia: Comet Hale-Bopp", url: "https://en.wikipedia.org/wiki/Comet_Hale-Bopp" }
        ]
    }
];

export const SolarSystemData: CelestialBodyData[] = [
    {
        name: "Sun",
        radius: 25, displayRadius: 109.2, // Visual scale
        distance: 0,
        distanceAU: 0,
        eccentricity: 0,
        period: 0,
        rotationPeriodDays: 25.05,
        color: 0xfbbf24,
        axialTilt: 7.25,
        description: "The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating the energy mainly as visible light, ultraviolet light, and infrared radiation. It is by far the most important source of energy for life on Earth.",
        imageUrl: "images/800px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA's_Solar_Dynamics_Observatory_-_20100819.webp",
        images: [
            "images/800px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA's_Solar_Dynamics_Observatory_-_20100819.webp",
            "images/GSFC_20171208_Archive_e001435_orig.webp",
            "images/X5.4_solar_flare_SDO_131A.webp"
        ],
        links: [
            { title: "NASA: Sun Overview", url: "https://science.nasa.gov/sun" },
            { title: "Wikipedia: Sun", url: "https://en.wikipedia.org/wiki/Sun" }
        ]
    },
    {
        name: "Mercury",
        baseLongitude: 4.4026008,
        radius: 0.76, displayRadius: 0.383,
        distance: 60,
        distanceAU: 0.38709927,
        eccentricity: 0.20563593,
        period: 0.2408467,
        inclination: 7.004979,
        longitudeOfPerihelion: 77.457796,
        longitudeOfAscendingNode: 48.330766,
        rotationPeriodDays: 58.6462,
        color: 0x94a3b8,
        axialTilt: 0.034,
        description: "Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, the shortest of all the Sun's planets. It is named after the Roman god Mercurius (Mercury), god of commerce, messenger of the gods, and mediator between gods and mortals.",
        imageUrl: "images/800px-Mercury_in_color_-_Prockter07-edit1.webp",
        images: [
            "images/800px-Mercury_in_color_-_Prockter07-edit1.webp",
            "images/Mercury_in_true_color.webp",
            "images/JPL_11364_orig.webp"
        ],
        links: [
            { title: "NASA: Mercury Overview", url: "https://science.nasa.gov/mercury" },
            { title: "Wikipedia: Mercury", url: "https://en.wikipedia.org/wiki/Mercury_(planet)" }
        ]
    },
    {
        name: "Venus",
        baseLongitude: 3.1761345,
        radius: 1.9, displayRadius: 0.949,
        distance: 90,
        distanceAU: 0.72333566,
        eccentricity: 0.00677672,
        period: 0.61519726,
        inclination: 3.394676,
        longitudeOfPerihelion: 131.602467,
        longitudeOfAscendingNode: 76.679843,
        rotationPeriodDays: 243.0226,
        color: 0xf59e0b,
        axialTilt: 177.36,
        description: "Venus is the second planet from the Sun. It is named after the Roman goddess of love and beauty. As the brightest natural object in Earth's night sky after the Moon, Venus can cast shadows and can be visible to the naked eye in broad daylight.",
        imageUrl: "images/800px-Venus-real_color.webp",
        images: [
            "images/800px-Venus-real_color.webp",
            "images/Venus_2_Approach_Image.webp",
            "images/JPL_00271_orig.webp"
        ],
        links: [
            { title: "NASA: Venus Overview", url: "https://science.nasa.gov/venus" },
            { title: "Wikipedia: Venus", url: "https://en.wikipedia.org/wiki/Venus" }
        ]
    },
    {
        name: "Earth",
        baseLongitude: 1.7534376,
        radius: 2, displayRadius: 1.0,
        distance: 130,
        distanceAU: 1.00000261,
        eccentricity: 0.01671123,
        period: 1.00001742,
        inclination: 0.000015,
        longitudeOfPerihelion: 102.937682,
        longitudeOfAscendingNode: 0,
        rotationPeriodDays: 0.9972695663,
        baseRotation: 4.894961213,
        color: 0x38bdf8,
        texture: 'textures/earth_equirectangular.webp',
        axialTilt: 23.43928,
        description: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 29% of Earth's surface is land consisting of continents and islands. The remaining 71% is covered with water, mostly by oceans, seas, gulfs, and other salt-water bodies, but also by lakes, rivers, and other freshwater.",
        imageUrl: "images/800px-The_Earth_seen_from_Apollo_17.webp",
        images: [
            "images/800px-The_Earth_seen_from_Apollo_17.webp",
            "images/Africa_and_Europe_from_a_Million_Miles_Away.webp",
            "images/JPL_18033_orig.webp"
        ],
        links: [
            { title: "NASA: Earth Overview", url: "https://science.nasa.gov/earth" },
            { title: "Wikipedia: Earth", url: "https://en.wikipedia.org/wiki/Earth" }
        ],
        moons: [
            {
                name: "Moon",
                baseLongitude: 3.8103407,
                radius: 0.27, displayRadius: 0.272,
                distance: 5,
                distanceAU: 0.00257,
                eccentricity: 0.0549,
                period: 0.07480242,
                inclination: 5.145,
                longitudeOfPerihelion: 83.353247,
                longitudeOfAscendingNode: 125.04452,
                tidallyLocked: true,
                color: 0xcbd5e1,
                texture: 'textures/moon.webp',
                axialTilt: 6.68,
                description: "The Moon is Earth's only natural satellite. It is the fifth largest satellite in the Solar System and the largest and most massive relative to its parent planet.",
                imageUrl: "images/800px-FullMoon2010.webp",
                images: [
                    "images/800px-FullMoon2010.webp",
                    "images/Full_Moon_Luc_Viatour.webp",
                    "images/JPL_00405_orig.webp"
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
        baseLongitude: 6.2037127,
        radius: 1.06, displayRadius: 0.532,
        distance: 170,
        distanceAU: 1.52371034,
        eccentricity: 0.0933941,
        period: 1.8808476,
        inclination: 1.849691,
        longitudeOfPerihelion: 336.05637,
        longitudeOfAscendingNode: 49.559539,
        rotationPeriodDays: 1.02595675,
        color: 0xf45d48,
        axialTilt: 25.19,
        description: "Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System, being larger than only Mercury. In English, Mars carries the name of the Roman god of war and is often referred to as the 'Red Planet'.",
        imageUrl: "images/800px-OSIRIS_Mars_true_color.webp",
        images: [
            "images/800px-OSIRIS_Mars_true_color.webp",
            "images/Mars_23_aug_2003_hubbe.webp",
            "images/JPL_02653_orig.webp"
        ],
        links: [
            { title: "NASA: Mars Overview", url: "https://science.nasa.gov/mars" },
            { title: "Wikipedia: Mars", url: "https://en.wikipedia.org/wiki/Mars" }
        ],
        moons: [
            {
                name: "Phobos",
                baseLongitude: 1.62,
                radius: 0.1, displayRadius: 0.0017,
                distance: 2,
                distanceAU: 0.000062,
                eccentricity: 0.0151,
                period: 0.0008731,
                inclination: 25.19,
                longitudeOfAscendingNode: 180,
                tidallyLocked: true,
                color: 0x888888,
                description: "Phobos is the innermost and larger of the two natural satellites of Mars, the other being Deimos.",
                imageUrl: "images/800px-Phobos_colour_2008.webp",
                links: [
                    { title: "Wikipedia: Phobos", url: "https://en.wikipedia.org/wiki/Phobos_(moon)" }
                ]
            },
            {
                name: "Deimos",
                baseLongitude: 4.15,
                radius: 0.06, displayRadius: 0.00098,
                distance: 3.5,
                distanceAU: 0.000156,
                eccentricity: 0.0002,
                period: 0.0034564,
                inclination: 25.19,
                longitudeOfAscendingNode: 180,
                tidallyLocked: true,
                color: 0x999999,
                description: "Deimos is the smaller and outermost of the two natural satellites of Mars.",
                imageUrl: "images/800px-Deimos-MRO.webp",
                links: [
                    { title: "Wikipedia: Deimos", url: "https://en.wikipedia.org/wiki/Deimos_(moon)" }
                ]
            }
        ]
    },
    {
        name: "Jupiter",
        baseLongitude: 0.6003311,
        radius: 11.2, displayRadius: 10.97,
        distance: 280,
        distanceAU: 5.202887,
        eccentricity: 0.04838624,
        period: 11.862615,
        inclination: 1.304397,
        longitudeOfPerihelion: 14.72848,
        longitudeOfAscendingNode: 100.473909,
        rotationPeriodDays: 0.41354,
        color: 0xe59866,
        axialTilt: 3.13,
        description: "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass one-thousandth that of the Sun, but two-and-a-half times that of all the other planets in the Solar System combined.",
        imageUrl: "images/800px-Jupiter_and_its_shrunken_Great_Red_Spot.webp",
        images: [
            "images/800px-Jupiter_and_its_shrunken_Great_Red_Spot.webp",
            "images/Jupiter.webp",
            "images/JPL_22946_orig.webp"
        ],
        links: [
            { title: "NASA: Jupiter Overview", url: "https://science.nasa.gov/jupiter" },
            { title: "Wikipedia: Jupiter", url: "https://en.wikipedia.org/wiki/Jupiter" }
        ],
        moons: [
            {
                name: "Io", baseLongitude: 1.85, radius: 0.28, displayRadius: 0.286, distance: 15,
                distanceAU: 0.00281, eccentricity: 0.0041, period: 0.004843,
                inclination: 3.13, longitudeOfAscendingNode: 180, tidallyLocked: true, color: 0xfacc15,
                description: "Io is the innermost and third-largest of the four Galilean moons of the planet Jupiter. It is the fourth-largest moon in the Solar System, has the highest density of any moon, the strongest surface gravity of any moon, and the lowest amount of water of any known astronomical object in the Solar System.",
                imageUrl: "images/800px-Io.webp",
                links: [{ title: "Wikipedia: Io", url: "https://en.wikipedia.org/wiki/Io_(moon)" }]
            },
            {
                name: "Europa", baseLongitude: 3.49, radius: 0.25, displayRadius: 0.245, distance: 17,
                distanceAU: 0.00448, eccentricity: 0.009, period: 0.009723,
                inclination: 3.13, longitudeOfAscendingNode: 180, tidallyLocked: true, color: 0xffffff,
                description: "Europa is the smallest of the four Galilean moons orbiting Jupiter, and the sixth-closest to the planet of all its 95 known moons. It is also the sixth-largest moon in the Solar System.",
                imageUrl: "images/800px-Europa.webp",
                links: [{ title: "Wikipedia: Europa", url: "https://en.wikipedia.org/wiki/Europa_(moon)" }]
            },
            {
                name: "Ganymede", baseLongitude: 2.11, radius: 0.41, displayRadius: 0.413, distance: 19,
                distanceAU: 0.00715, eccentricity: 0.0013, period: 0.019588,
                inclination: 3.13, longitudeOfAscendingNode: 180, tidallyLocked: true, color: 0x888888,
                description: "Ganymede is the largest and most massive of the Solar System's moons. The ninth-largest object in the Solar System, it is the largest without a substantial atmosphere. It has a diameter of 5,268 km (3,273 mi), making it 26% larger than the planet Mercury by volume, although it is only 45% as massive.",
                imageUrl: "images/800px-Ganymede.webp",
                links: [{ title: "Wikipedia: Ganymede", url: "https://en.wikipedia.org/wiki/Ganymede_(moon)" }]
            },
            {
                name: "Callisto", baseLongitude: 5.02, radius: 0.38, displayRadius: 0.378, distance: 21,
                distanceAU: 0.01258, eccentricity: 0.0074, period: 0.045692,
                inclination: 3.13, longitudeOfAscendingNode: 180, tidallyLocked: true, color: 0x555555,
                description: "Callisto is the second-largest moon of Jupiter, after Ganymede. It is the third-largest moon in the Solar System after Ganymede and Saturn's largest moon Titan, and the largest object in the Solar System that may not be properly differentiated.",
                imageUrl: "images/800px-Callisto.webp",
                links: [{ title: "Wikipedia: Callisto", url: "https://en.wikipedia.org/wiki/Callisto_(moon)" }]
            }
        ]
    },
    {
        name: "Saturn",
        baseLongitude: 0.871866,
        radius: 9.45, displayRadius: 9.14,
        distance: 400,
        distanceAU: 9.53667594,
        eccentricity: 0.05386179,
        period: 29.447498,
        inclination: 2.485992,
        longitudeOfPerihelion: 92.598878,
        longitudeOfAscendingNode: 113.662424,
        rotationPeriodDays: 0.44401,
        color: 0xfcd34d,
        axialTilt: 26.73,
        description: "Saturn is the sixth planet from the Sun and the second-largest in the Solar System, after Jupiter. It is a gas giant with an average radius of about nine and a half times that of Earth. It has only one-eighth the average density of Earth; however, with its larger volume, Saturn is over 95 times more massive.",
        imageUrl: "images/800px-Saturn_during_Equinox.webp",
        images: [
            "images/800px-Saturn_during_Equinox.webp",
            "images/Saturn_(planet)_large.webp",
            "images/JPL_11141_orig.webp"
        ],
        links: [
            { title: "NASA: Saturn Overview", url: "https://science.nasa.gov/saturn" },
            { title: "Wikipedia: Saturn", url: "https://en.wikipedia.org/wiki/Saturn" }
        ],
        moons: [
            {
                name: "Mimas", baseLongitude: 0.94, radius: 0.12, displayRadius: 0.03, distance: 27,
                distanceAU: 0.00124, eccentricity: 0.0202, period: 0.00258,
                inclination: 26.73, longitudeOfAscendingNode: 180, tidallyLocked: true, color: 0xcccccc,
                description: "Mimas is a moon of Saturn which was discovered in 1789 by William Herschel. It is named after Mimas, a son of Gaia in Greek mythology. With a diameter of 396 kilometres, it is the smallest astronomical body that is known to be rounded in shape because of self-gravitation.",
                imageUrl: "images/800px-Mimas.webp",
                links: [{ title: "Wikipedia: Mimas", url: "https://en.wikipedia.org/wiki/Mimas_(moon)" }]
            },
            {
                name: "Enceladus", baseLongitude: 3.48, radius: 0.15, displayRadius: 0.04, distance: 31,
                distanceAU: 0.00159, eccentricity: 0.0047, period: 0.003751,
                inclination: 26.73, longitudeOfAscendingNode: 180, tidallyLocked: true, color: 0xffffff,
                description: "Enceladus is the sixth-largest moon of Saturn. It is about 500 kilometers in diameter, about a tenth of that of Saturn's largest moon, Titan. It is mostly covered by fresh, clean ice, making it one of the most reflective bodies of the Solar System.",
                imageUrl: "images/800px-Enceladus.webp",
                links: [{ title: "Wikipedia: Enceladus", url: "https://en.wikipedia.org/wiki/Enceladus" }]
            },
            {
                name: "Titan", baseLongitude: 2.91, radius: 0.4, displayRadius: 0.404, distance: 37,
                distanceAU: 0.00816, eccentricity: 0.0288, period: 0.043656,
                inclination: 26.73, longitudeOfAscendingNode: 180, tidallyLocked: true, color: 0xffaa00,
                description: "Titan is the largest moon of Saturn and the second-largest natural satellite in the Solar System. It is the only moon known to have a dense atmosphere, and the only known body in space, other than Earth, where clear evidence of stable bodies of surface liquid has been found.",
                imageUrl: "images/800px-Titan.webp",
                links: [{ title: "Wikipedia: Titan", url: "https://en.wikipedia.org/wiki/Titan_(moon)" }]
            },
            {
                name: "Iapetus", baseLongitude: 5.62, radius: 0.25, displayRadius: 0.115, distance: 45,
                distanceAU: 0.0238, eccentricity: 0.0286, period: 0.21717,
                inclination: 15.47, longitudeOfAscendingNode: 180, tidallyLocked: true, color: 0xaaaaaa,
                description: "Iapetus is the third-largest natural satellite of Saturn, eleventh-largest in the Solar System, and the largest body in the Solar System known not to be in hydrostatic equilibrium. Iapetus is best known for its dramatic 'two-tone' coloration.",
                imageUrl: "images/800px-Iapetus.webp",
                links: [{ title: "Wikipedia: Iapetus", url: "https://en.wikipedia.org/wiki/Iapetus_(moon)" }]
            }
        ],
        rings: [
            { innerRadius: 11, outerRadius: 21, color: 0xe6e6cd, opacity: 0.8 },
            { innerRadius: 21.5, outerRadius: 23, color: 0xcdcdb4, opacity: 0.6 }
        ]
    },
    {
        name: "Uranus",
        baseLongitude: 5.4670362,
        radius: 6, displayRadius: 3.98,
        distance: 520,
        distanceAU: 19.18916464,
        eccentricity: 0.04725744,
        period: 84.016846,
        inclination: 0.772638,
        longitudeOfPerihelion: 170.954276,
        longitudeOfAscendingNode: 74.016925,
        rotationPeriodDays: 0.71833,
        color: 0x22d3ee,
        axialTilt: 97.77,
        description: "Uranus is the seventh planet from the Sun. Its name is a reference to the Greek god of the sky, Uranus, who, according to Greek mythology, was the great-grandfather of Ares (Mars), grandfather of Zeus (Jupiter) and father of Cronus (Saturn). It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System.",
        imageUrl: "images/800px-Uranus2.webp",
        images: [
            "images/800px-Uranus2.webp",
            "images/Uranus_as_seen_by_NASA's_Voyager_2_(remastered)_-_JPEG_converted.webp",
            "images/JPL_18182_orig.webp"
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
        baseLongitude: 5.3211593,
        radius: 5.82, displayRadius: 3.86,
        distance: 640,
        distanceAU: 30.06992276,
        eccentricity: 0.00859048,
        period: 164.79132,
        inclination: 1.770043,
        longitudeOfPerihelion: 44.964762,
        longitudeOfAscendingNode: 131.784226,
        rotationPeriodDays: 0.67125,
        color: 0x3b82f6,
        axialTilt: 28.32,
        description: "Neptune is the eighth and farthest-known Solar planet from the Sun. In the Solar System, it is the fourth-largest planet by diameter, the third-most-massive planet, and the densest giant planet. It is 17 times the mass of Earth, slightly more massive than its near-twin Uranus.",
        imageUrl: "images/800px-Neptune_-_Voyager_2_(29347980845)_flatten_crop.webp",
        images: [
            "images/800px-Neptune_-_Voyager_2_(29347980845)_flatten_crop.webp",
            "images/Neptune_Full.webp",
            "images/JPL_01492_orig.webp"
        ],
        links: [
            { title: "NASA: Neptune Overview", url: "https://science.nasa.gov/neptune" },
            { title: "Wikipedia: Neptune", url: "https://en.wikipedia.org/wiki/Neptune" }
        ],
        moons: [
            {
                name: "Triton",
                baseLongitude: 4.61,
                radius: 0.35, displayRadius: 0.212,
                distance: 12,
                distanceAU: 0.00237,
                eccentricity: 0.00001,
                period: 0.01609,
                retrograde: true,
                tidallyLocked: true,
                color: 0xcccccc,
                description: "Triton is the largest natural satellite of the planet Neptune, and the first Neptunian moon to be discovered.",
                imageUrl: "images/800px-Triton_moon_mosaic_Voyager_2_(large).webp",
                links: [
                    { title: "Wikipedia: Triton", url: "https://en.wikipedia.org/wiki/Triton_(moon)" }
                ]
            }
        ]
    },
    // Dwarf Planets
    {
        name: "Pluto",
        baseLongitude: 4.1700981,
        isDwarfPlanet: true,
        radius: 0.36, displayRadius: 0.187,
        distance: 700,
        distanceAU: 39.482117,
        eccentricity: 0.2488273,
        period: 247.92065,
        inclination: 17.140012,
        longitudeOfPerihelion: 224.068916,
        longitudeOfAscendingNode: 110.303937,
        rotationPeriodDays: 6.38723,
        color: 0xddaa88,
        axialTilt: 122.53,
        description: "Pluto is a dwarf planet in the Kuiper belt, a ring of bodies beyond the orbit of Neptune. It was the first and the largest Kuiper belt object to be discovered. Pluto was discovered by Clyde Tombaugh in 1930 and declared to be the ninth planet from the Sun.",
        imageUrl: "images/800px-Pluto_in_True_Color_-_High-Res.webp",
        images: [
            "images/800px-Pluto_in_True_Color_-_High-Res.webp",
            "images/Pluto-01_Stern_03_Pluto_Color_TXT.webp",
            "images/JPL_19952_orig.webp"
        ],
        links: [
            { title: "NASA: Pluto Overview", url: "https://science.nasa.gov/dwarf-planets/pluto" },
            { title: "Wikipedia: Pluto", url: "https://en.wikipedia.org/wiki/Pluto" }
        ],
        moons: [
            {
                name: "Charon",
                baseLongitude: 2.25,
                radius: 0.18, displayRadius: 0.095,
                distance: 2.0,
                distanceAU: 0.000131,
                eccentricity: 0.00005,
                period: 0.017487,
                retrograde: true,
                tidallyLocked: true,
                color: 0xaaaaaa,
                description: "Charon is the largest of the five known natural satellites of the dwarf planet Pluto.",
                imageUrl: "images/800px-Charon_in_True_Color_-_High-Res.webp",
                links: [
                    { title: "Wikipedia: Charon", url: "https://en.wikipedia.org/wiki/Charon_(moon)" }
                ]
            }
        ]
    },
    {
        name: "Ceres",
        baseLongitude: 2.771515,
        isDwarfPlanet: true,
        radius: 0.14, displayRadius: 0.074,
        distance: 220,
        distanceAU: 2.7656,
        eccentricity: 0.07969,
        period: 4.5993,
        inclination: 10.588,
        longitudeOfPerihelion: 153.543,
        longitudeOfAscendingNode: 80.249,
        rotationPeriodDays: 0.3781,
        color: 0x888888,
        description: "Ceres is a dwarf planet in the asteroid belt between the orbits of Mars and Jupiter. It was the first asteroid discovered, on 1 January 1801, by Giuseppe Piazzi at Palermo Astronomical Observatory in Sicily. Originally considered a planet, it was reclassified as an asteroid in the 1850s.",
        imageUrl: "images/800px-Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).webp",
        images: [
            "images/800px-Ceres_-_RC3_-_Haulani_Crater_(22381131691)_(cropped).webp",
            "images/Ceres_-_RC3_-_Haulani_Crater_(22381131691).webp",
            "images/JPL_19631_orig.webp"
        ],
        links: [
            { title: "NASA: Ceres Overview", url: "https://science.nasa.gov/dwarf-planets/ceres" },
            { title: "Wikipedia: Ceres", url: "https://en.wikipedia.org/wiki/Ceres_(dwarf_planet)" }
        ]
    },
    {
        name: "Eris",
        baseLongitude: 0.37635,
        isDwarfPlanet: true,
        radius: 0.36, displayRadius: 0.182,
        distance: 780,
        distanceAU: 67.93,
        eccentricity: 0.4382,
        period: 559.89,
        inclination: 43.93,
        longitudeOfPerihelion: 186.79,
        longitudeOfAscendingNode: 36.00,
        rotationPeriodDays: 1.079,
        color: 0xcccccc,
        description: "Eris is the most massive and second-largest known dwarf planet in the Solar System. It is a trans-Neptunian object (TNO) in the scattered disk and has a high-eccentricity orbit.",
        imageUrl: "images/800px-Eris_and_dysnomia2.webp",
        images: [
            "images/800px-Eris_and_dysnomia2.webp"
        ],
        links: [
            { title: "NASA: Eris Overview", url: "https://science.nasa.gov/dwarf-planets/eris" },
            { title: "Wikipedia: Eris", url: "https://en.wikipedia.org/wiki/Eris_(dwarf_planet)" }
        ]
    },
    {
        name: "Haumea",
        baseLongitude: 3.35122,
        isDwarfPlanet: true,
        radius: 0.3, displayRadius: 0.128,
        distance: 740,
        distanceAU: 43.06,
        eccentricity: 0.1944,
        period: 282.58,
        inclination: 28.21,
        longitudeOfPerihelion: 2.48,
        longitudeOfAscendingNode: 121.79,
        rotationPeriodDays: 0.16314,
        color: 0xaaaaaa,
        description: "Haumea is a dwarf planet located beyond Neptune's orbit. It was discovered in 2004 by a team headed by Mike Brown of Caltech at the Palomar Observatory in the United States and independently in 2005 by a team headed by José Luis Ortiz Moreno at the Sierra Nevada Observatory in Spain.",
        imageUrl: "images/800px-Haumea_Hubble.webp",
        images: [
            "images/800px-Haumea_Hubble.webp",
            "images/Haumea_Rotation.gif"
        ],
        links: [
            { title: "NASA: Haumea Overview", url: "https://science.nasa.gov/dwarf-planets/haumea" },
            { title: "Wikipedia: Haumea", url: "https://en.wikipedia.org/wiki/Haumea" }
        ]
    },
    {
        name: "Makemake",
        baseLongitude: 2.71158,
        isDwarfPlanet: true,
        radius: 0.22, displayRadius: 0.112,
        distance: 760,
        distanceAU: 45.57,
        eccentricity: 0.160,
        period: 307.62,
        inclination: 29.0,
        longitudeOfPerihelion: 16.4,
        longitudeOfAscendingNode: 79.3,
        rotationPeriodDays: 0.951,
        color: 0xaa8866,
        description: "Makemake is a dwarf planet and perhaps the second-largest Kuiper belt object in the classical population, with a diameter approximately two-thirds that of Pluto. Makemake has one known satellite, S/2015 (136472) 1. Its extremely low average temperature, about 30 K (−243.2 °C), means its surface is covered with methane, ethane, and possibly nitrogen ices.",
        imageUrl: "images/800px-Makemake_moon_Hubble_image_with_legend.webp",
        images: [
            "images/800px-Makemake_moon_Hubble_image_with_legend.webp",
            "images/Makemake_and_its_moon.webp"
        ],
        links: [
            { title: "NASA: Makemake Overview", url: "https://science.nasa.gov/dwarf-planets/makemake" },
            { title: "Wikipedia: Makemake", url: "https://en.wikipedia.org/wiki/Makemake" }
        ]
    }
];
