import { TranslationSchema } from '../types';

export const en: TranslationSchema = {
    ui: {
        simDate: '⏱ SIM DATE:',
        radarToggle: 'Toggle Minimap Radar (M)',
        controlsToggle: 'Toggle Simulation Controls',
        languageToggle: 'Change Language',
        orbiting: '(orbiting {planet})',
        jumpToDate: 'Jump to Active Date ({date})',
        close: 'Close',
        help: 'Help',
        audioAmbience: 'Cosmic Audio Ambience (S)',
        audioAmbienceAria: 'Toggle cosmic audio',
        telemetry: 'Performance Telemetry (P)',
        telemetryAria: 'Toggle engine telemetry',
        keyboardShortcuts: 'Keyboard Shortcuts (? / H)',
        keyboardShortcutsAria: 'View keyboard shortcuts',
        astrophotography: 'Astrophotography Snapshot (K)',
        astrophotographyAria: 'Capture high-resolution screenshot',
        speedPause: 'Click to Pause / Resume (Space)',
        utcTime: 'Universal Time (UTC)',
        liveRealTime: 'Physical Real-Time Active (1:1)'
    },
    categories: {
        star: '🌟 Stars',
        planet: '🪐 Planets',
        moon: '🌕 Moons',
        constellation: '🌌 Constellations',
        comet: '☄️ Comets',
        spacecraft: '🛰️ Spacecraft'
    },
    controls: {
        simulationFolder: 'Simulation',
        environmentFolder: 'Environment',
        cameraFolder: 'Camera Controls',
        toolsFolder: 'Tools',
        realisticScale: 'Realistic Scale',
        showMinimap: 'Show Minimap',
        timeSpeed: 'Time Speed',
        speedPreset: 'Speed Preset',
        speedPresets: {
            realTime: 'Real-Time (1:1)',
            oneHourPerSec: '1 hour / sec',
            oneDayPerSec: '1 day / sec (Realistic)',
            oneWeekPerSec: '1 week / sec',
            oneMonthPerSec: '1 month / sec',
            paused: 'Paused',
            custom: 'Custom'
        },
        pause: 'Pause',
        resume: 'Resume',
        showOrbits: 'Show Orbits',
        showMoons: 'Show Moons',
        showAsteroids: 'Show Asteroids',
        showKuiperBelt: 'Show Kuiper Belt',
        showDwarfPlanets: 'Show Dwarf Planets',
        showComets: 'Show Comets',
        showSpacecraft: 'Show Spacecraft',
        showMeteors: 'Show Meteors',
        showTrails: 'Show Trails',
        habitableZone: 'Habitable Zone',
        eclipticGrid: 'Ecliptic Grid',
        enableBloom: 'Enable Bloom',
        realisticLighting: 'Realistic Lighting',
        showAxes: 'Show Axes',
        attachCamera: 'Attach Camera',
        viewFromSurface: 'View from Surface',
        freeCamera: 'Free Camera',
        measureDistance: 'Measure Distance',
        cinematicTour: 'Cinematic Tour',
        tourSpeed: 'Tour Speed',
        tooltips: {
            pauseResume: 'Click to pause or resume simulation time (or press Space).',
            speedPreset: 'Select standard realistic astronomical time rates or custom speed.',
            timeSpeed: 'Adjust simulation time speed. 1 day/sec is the calibrated realistic observation speed.',
            realisticScale: 'Toggles realistic orbital distances and scales bodies to real sizes relative to the distances.',
            showTrails: 'Displays the orbital paths or trails behind celestial bodies as they move.',
            habitableZone: "The region around a star where conditions might be right for liquid water to exist on a planet's surface.",
            eclipticGrid: "A grid representing the plane of Earth's orbit around the Sun.",
            enableBloom: 'A post-processing effect that makes bright objects appear to glow.',
            realisticLighting: 'Uses physically based rendering to simulate realistic light interaction with planetary surfaces.',
            showAxes: 'Displays X (red), Y (green), and Z (blue) axes for spatial orientation.',
            measureDistance: 'Enable Measure Distance, then click on two bodies in the 3D scene (or select them from the dropdown) to measure the distance between them.'
        }
    },
    modal: {
        badges: {
            celestialBody: 'CELESTIAL BODY',
            missionDossier: 'MISSION DOSSIER',
            cometTelemetry: 'COMET TELEMETRY',
            constellation: 'CONSTELLATION',
            stellarDossier: 'STELLAR DOSSIER',
            lunarTelemetry: 'LUNAR TELEMETRY',
            stellarCore: 'STELLAR CORE',
            planetaryDossier: 'PLANETARY DOSSIER'
        },
        labels: {
            type: 'Type',
            radius: 'Radius',
            distance: 'Distance',
            period: 'Period',
            axialTilt: 'Axial Tilt',
            semiMajorAxis: 'Semi-Major Axis',
            eccentricity: 'Eccentricity',
            rightAsc: 'Right Asc.',
            declination: 'Declination',
            stars: 'Stars',
            brightest: 'Brightest',
            area: 'Area',
            family: 'Family',
            spacecraftType: 'Spacecraft'
        },
        tooltipTitles: {
            spacecraft: 'Spacecraft',
            rightAsc: 'Right Ascension (RA)',
            declination: 'Declination (Dec)',
            radius: 'Radius',
            distance: 'Orbital Distance',
            semiMajorAxis: 'Semi-Major Axis',
            eccentricity: 'Eccentricity',
            period: 'Orbital Period',
            axialTilt: 'Axial Tilt',
            stars: 'Main Stars',
            brightest: 'Brightest Star',
            area: 'Area',
            family: 'Family'
        },
        tooltips: {
            spacecraft: 'An artificial vehicle designed to operate in outer space.',
            rightAsc: 'Celestial coordinate equivalent to longitude on Earth, measured in sidereal hours.',
            declination: 'Celestial coordinate equivalent to latitude on Earth, measured north (+) or south (-) of celestial equator.',
            radiusEarth: 'Planetary radius relative to Earth.',
            distSun: 'Average distance from the Sun in Astronomical Units (AU).',
            distPlanet: 'Average distance from parent planet.',
            orbitSun: 'Time taken to complete one orbit around the Sun.',
            orbitPlanet: 'Time taken to complete one orbit around host planet.',
            axialTilt: 'Angle between rotational axis and orbital plane.',
            semiMajorAxis: 'Half the longest diameter of the elliptical orbit.',
            eccentricity: 'Orbital deviation from a circle (0 is circular).',
            cometPeriod: 'Time taken to complete one full revolution around the Sun.',
            constellationStars: 'Primary asterism stars.',
            brightestStar: 'Most luminous star in this constellation.',
            constellationArea: 'Total celestial area covered.',
            constellationFamily: 'Constellation grouping.'
        },
        resourcesHeader: 'Telemetry & Resources',
        noDescription: 'No detailed description available in telemetry databanks.',
        audioGuide: 'Listen',
        audioPlaying: 'Playing...',
        audioGuideTitle: 'Audio Guide Narration',
        audioGuideStop: 'Stop Narration',
        audioGuideAria: 'Listen to celestial audio guide',
        audioGuidePlayingAria: 'Stop celestial audio guide narration',
        prevImageAria: 'Previous image',
        nextImageAria: 'Next image',
        periodUnits: {
            year: 'yr',
            month: 'm',
            day: 'd'
        }
    },
    shortcuts: {
        title: 'Observatory Keyboard Shortcuts',
        navTitle: 'Navigation & Quick Focus',
        mercuryToNeptune: 'Mercury to Neptune',
        pluto: 'Pluto (Dwarf Planet)',
        sun: 'The Sun (Solar Core)',
        resetView: 'Realistic Scale / Reset View',
        timeTitle: 'Time & Simulation',
        pauseResume: 'Pause / Resume Simulation',
        warpSpeed: 'Decrease / Increase Warp Speed',
        cinematicTour: 'Toggle Guided Cinematic Tour',
        toolsTitle: 'Celestial Layers & Tools',
        orbits: 'Toggle Planetary Orbits',
        minimap: 'Toggle Radar Minimap',
        constellations: 'Toggle Constellations',
        audio: 'Toggle Cosmic Audio Ambience',
        telemetry: 'Toggle Engine Telemetry HUD',
        snapshot: 'Astrophotography Snapshot',
        fullscreen: 'Toggle Fullscreen Display',
        help: 'Open This Shortcuts Guide',
        esc: 'Close Dialogs / Detach Target'
    },
    popups: {
        trueScaleTitle: 'True Scale of the Solar System',
        trueScaleDesc: 'You are now viewing the Solar System at its true scale. Planets are rendered at their actual sizes relative to the vast distances between them. Because space is mostly empty, planets appear extremely small, almost invisible dots, compared to their orbits. Pointers have been enabled to help you locate them in this mode.',
        meteorsTitle: 'Meteors',
        meteorsDesc: "You are now viewing meteors near Earth. A meteor is a streak of light in the sky caused by a meteoroid crashing through Earth's atmosphere. Millions of meteors occur in Earth's atmosphere daily. Most meteoroids that cause meteors are about the size of a grain of sand, and they come from comets or asteroids. When entering Earth's atmosphere at high speeds, friction with the air causes them to heat up and burn, creating the visible streak of light."
    },
    datepicker: {
        months: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ],
        weekdays: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        bc: 'BC',
        ad: 'AD',
        century: 'Century',
        decade: 'Decade',
        year: 'Year',
        historicalEvents: 'Historical Events...'
    },
    loading: {
        boot: 'Observatory Boot',
        subtitle: 'Deep Space Astronomical Observatory',
        core: 'INITIALIZING OBSERVATORY CORE...',
        ephemerides: 'CALIBRATING CELESTIAL EPHEMERIDES...',
        surfaces: 'SYNTHESIZING PLANETARY SURFACES...',
        controls: 'CONFIGURING OBSERVATORY CONTROLS...',
        acquiring: 'ACQUIRING HIGH-RES ASTROPHOTOGRAPHY...',
        calibrating: 'CALIBRATING ATMOSPHERIC SHADERS...',
        streaming: 'STREAMING DEEP SPACE TEXTURES...',
        synchronizing: 'SYNCHRONIZING CELESTIAL ORBITS...',
        loaded: 'ASSETS LOADED',
        ready: 'SYSTEMS OPERATIONAL • OBSERVATORY READY',
        standby: 'STANDBY',
        connecting: 'CONNECTING',
        assets: 'ASSETS',
        online: 'ONLINE',
        tagBoot: 'BOOT',
        tagCalibrating: 'CALIBRATING',
        tagSynthesizing: 'SYNTHESIZING',
        tagConfiguring: 'CONFIGURING'
    },
    bodies: {
        Sun: {
            name: 'Sun',
            description: 'The Sun is the star at the center of the Solar System. It is a nearly perfect sphere of hot plasma, heated to incandescence by nuclear fusion reactions in its core, radiating energy mainly as light and infrared radiation.'
        },
        Mercury: {
            name: 'Mercury',
            description: 'Mercury is the smallest planet in the Solar System and the closest to the Sun. Its orbit around the Sun takes 87.97 Earth days, the shortest of all the Sun\'s planets.'
        },
        Venus: {
            name: 'Venus',
            description: 'Venus is the second planet from the Sun. It has the densest atmosphere of all four terrestrial planets, consisting of more than 96% carbon dioxide, producing a runaway greenhouse effect.'
        },
        Earth: {
            name: 'Earth',
            description: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 29% of Earth\'s surface is land, with the remaining 71% covered with water.'
        },
        Moon: {
            name: 'Moon',
            description: 'The Moon is Earth\'s only natural satellite. It is the fifth largest satellite in the Solar System and the largest relative to its host planet.'
        },
        Mars: {
            name: 'Mars',
            description: 'Mars is the fourth planet from the Sun and the second-smallest planet in the Solar System. It carries the name of the Roman god of war and is often called the "Red Planet" due to iron oxide on its surface.'
        },
        Phobos: {
            name: 'Phobos',
            description: 'Phobos is the innermost and larger of the two natural satellites of Mars. It is a small, irregularly shaped object orbiting very close to Mars.'
        },
        Deimos: {
            name: 'Deimos',
            description: 'Deimos is the smaller and outer of the two natural satellites of Mars. It has an average radius of 6.2 km and takes 30.3 hours to orbit Mars.'
        },
        Jupiter: {
            name: 'Jupiter',
            description: 'Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass more than two and a half times that of all the other planets combined.'
        },
        Io: {
            name: 'Io',
            description: 'Io is the innermost of the four Galilean moons of Jupiter. With over 400 active volcanoes, it is the most geologically active object in the Solar System.'
        },
        Europa: {
            name: 'Europa',
            description: 'Europa is the smallest of the four Galilean moons orbiting Jupiter. It has a smooth ice surface with subsurface liquid water ocean that may harbor extraterrestrial life.'
        },
        Ganymede: {
            name: 'Ganymede',
            description: 'Ganymede is the largest and most massive moon of Jupiter and the Solar System. It is larger than the planet Mercury and the only moon known to have its own magnetic field.'
        },
        Callisto: {
            name: 'Callisto',
            description: 'Callisto is the second-largest moon of Jupiter and the third-largest in the Solar System. Its surface is the most heavily cratered of any known object in the Solar System.'
        },
        Saturn: {
            name: 'Saturn',
            description: 'Saturn is the sixth planet from the Sun and the second-largest in the Solar System, after Jupiter. It is famous for its prominent, breathtaking planetary ring system.'
        },
        Mimas: {
            name: 'Mimas',
            description: 'Mimas is a moon of Saturn known for its gigantic impact crater, Herschel, giving it an appearance strikingly reminiscent of the Death Star.'
        },
        Enceladus: {
            name: 'Enceladus',
            description: 'Enceladus is the sixth-largest moon of Saturn. It is covered by fresh, clean ice, reflecting almost 100% of sunlight, and features water cryovolcanoes at its south pole.'
        },
        Titan: {
            name: 'Titan',
            description: 'Titan is the largest moon of Saturn and the second-largest natural satellite in the Solar System. It is the only known moon with a dense atmosphere and stable surface hydrocarbon liquid lakes.'
        },
        Iapetus: {
            name: 'Iapetus',
            description: 'Iapetus is the third-largest moon of Saturn, famous for its dramatic two-tone coloration, with one hemisphere dark as coal and the other bright as snow.'
        },
        Uranus: {
            name: 'Uranus',
            description: 'Uranus is the seventh planet from the Sun. It has the third-largest planetary radius and fourth-largest planetary mass in the Solar System, with an extreme axial tilt of 97.77 degrees.'
        },
        Neptune: {
            name: 'Neptune',
            description: 'Neptune is the eighth and farthest-known Solar planet from the Sun. It is 17 times the mass of Earth and features the fastest winds in the Solar System, exceeding 2,100 km/h.'
        },
        Triton: {
            name: 'Triton',
            description: 'Triton is the largest natural satellite of Neptune and the only large moon in the Solar System with a retrograde orbit, moving in the opposite direction of its planet\'s rotation.'
        },
        Pluto: {
            name: 'Pluto',
            description: 'Pluto is a dwarf planet in the Kuiper belt, a ring of bodies beyond the orbit of Neptune. It was the first and largest Kuiper belt object discovered.'
        },
        Charon: {
            name: 'Charon',
            description: 'Charon is the largest of the five known natural satellites of the dwarf planet Pluto. It is so massive relative to Pluto that the two form a binary dwarf planet system.'
        },
        Ceres: {
            name: 'Ceres',
            description: 'Ceres is the largest astronomical object in the asteroid belt between the orbits of Mars and Jupiter. It is the only dwarf planet located in the inner Solar System.'
        },
        Eris: {
            name: 'Eris',
            description: 'Eris is the most massive and second-largest known dwarf planet in the Solar System. It is a trans-Neptunian object located in the scattered disc.'
        },
        Haumea: {
            name: 'Haumea',
            description: 'Haumea is a dwarf planet located beyond Neptune\'s orbit. Its elongated, ellipsoidal shape is caused by its exceptionally rapid rotation (a day lasts less than 4 hours).'
        },
        Makemake: {
            name: 'Makemake',
            description: 'Makemake is a dwarf planet and perhaps the second-largest Kuiper belt object in the classical population, with an extremely cold surface coated in frozen methane and ethane.'
        }
    },
    spacecraft: {
        'Apollo 11': {
            name: 'Apollo 11',
            description: 'Apollo 11 was the American spaceflight that first landed humans on the Moon. Commander Neil Armstrong and Lunar Module Pilot Buzz Aldrin landed the Apollo Lunar Module Eagle on July 20, 1969.'
        },
        'Sputnik 1': {
            name: 'Sputnik 1',
            description: 'Sputnik 1 was the first artificial Earth satellite. The Soviet Union launched it into an elliptical low Earth orbit on 4 October 1957, inaugurating the Space Age.'
        },
        'ISS': {
            name: 'International Space Station (ISS)',
            description: 'The International Space Station is the largest modular space station in low Earth orbit. A multinational collaborative project between NASA, Roscosmos, JAXA, ESA, and CSA.'
        },
        'ISS (International Space Station)': {
            name: 'International Space Station (ISS)',
            description: 'The International Space Station is the largest modular space station in low Earth orbit. A multinational collaborative project between NASA, Roscosmos, JAXA, ESA, and CSA.'
        },
        'Hubble Space Telescope': {
            name: 'Hubble Space Telescope',
            description: 'The Hubble Space Telescope is a space telescope that was launched into low Earth orbit in 1990 and remains in operation, transforming our understanding of the cosmos.'
        },
        'Voyager 1': {
            name: 'Voyager 1',
            description: 'Voyager 1 is a space probe launched by NASA in 1977. Part of the Voyager program to study the outer Solar System, it is the most distant human-made object from Earth.'
        },
        'JWST': {
            name: 'James Webb Space Telescope (JWST)',
            description: 'The James Webb Space Telescope is a space telescope designed primarily to conduct infrared astronomy. Orbiting the Sun-Earth L2 Lagrange point, it observes the earliest galaxies.'
        },
        'James Webb Space Telescope': {
            name: 'James Webb Space Telescope (JWST)',
            description: 'The James Webb Space Telescope is a space telescope designed primarily to conduct infrared astronomy. Orbiting the Sun-Earth L2 Lagrange point, it observes the earliest galaxies.'
        },
        'Cassini-Huygens': {
            name: 'Cassini-Huygens',
            description: 'Cassini-Huygens was a flagship-class space probe mission sent to the Saturn system. It extensively studied Saturn, its rings, and its moons between 2004 and 2017.'
        },
        'Cassini': {
            name: 'Cassini-Huygens',
            description: 'Cassini-Huygens was a flagship-class space probe mission sent to the Saturn system. It extensively studied Saturn, its rings, and its moons between 2004 and 2017.'
        },
        'Voyager 2': {
            name: 'Voyager 2',
            description: 'Voyager 2 is a space probe launched by NASA in 1977. It is the only spacecraft to have visited both ice giant planets: Uranus and Neptune.'
        }
    },
    comets: {
        "Halley's Comet": {
            name: "Halley's Comet",
            description: "Halley's Comet is arguably the most famous comet. It is a periodic comet that returns to Earth's vicinity every 75–76 years, having been observed by astronomers for over two millennia."
        },
        'Comet Hale-Bopp': {
            name: 'Comet Hale-Bopp',
            description: 'Comet Hale-Bopp was one of the most widely observed comets of the 20th century and one of the brightest seen for many decades, remaining visible to the naked eye for a record 18 months.'
        },
        'Hale-Bopp': {
            name: 'Comet Hale-Bopp',
            description: 'Comet Hale-Bopp was one of the most widely observed comets of the 20th century and one of the brightest seen for many decades, remaining visible to the naked eye for a record 18 months.'
        }
    },
    constellations: {
        'Ursa Major': {
            name: 'Ursa Major',
            family: 'Ursa Major',
            description: 'Ursa Major, the Great Bear, contains the prominent asterism known as the Big Dipper or Plough. It is visible throughout the year from most of the Northern Hemisphere.'
        },
        'Ursa Major (Big Dipper)': {
            name: 'Ursa Major',
            family: 'Ursa Major',
            description: 'Ursa Major, the Great Bear, contains the prominent asterism known as the Big Dipper or Plough. It is visible throughout the year from most of the Northern Hemisphere.'
        },
        'Ursa Minor': {
            name: 'Ursa Minor',
            family: 'Ursa Major',
            description: 'Ursa Minor, the Little Bear, is home to Polaris, the North Pole star. It has historically been crucial for northern maritime navigation.'
        },
        'Ursa Minor (Little Dipper)': {
            name: 'Ursa Minor',
            family: 'Ursa Major',
            description: 'Ursa Minor, the Little Bear, is home to Polaris, the North Pole star. It has historically been crucial for northern maritime navigation.'
        },
        'Orion': {
            name: 'Orion',
            family: 'Orion',
            description: 'Orion, the Hunter, is one of the most conspicuous and recognizable constellations in the night sky, featuring the brilliant supergiant stars Betelgeuse and Rigel.'
        },
        'Cassiopeia': {
            name: 'Cassiopeia',
            family: 'Perseus',
            description: 'Cassiopeia is an easily recognizable constellation in the northern sky, shaped like a distinctive "W" or "M" formed by five bright stars.'
        },
        'Cygnus': {
            name: 'Cygnus',
            family: 'Hercules',
            description: 'Cygnus, the Swan, is an iconic constellation along the plane of the Milky Way, featuring the Northern Cross asterism and Deneb.'
        },
        'Cygnus (The Swan)': {
            name: 'Cygnus',
            family: 'Hercules',
            description: 'Cygnus, the Swan, is an iconic constellation along the plane of the Milky Way, featuring the Northern Cross asterism and Deneb.'
        },
        'Scorpius': {
            name: 'Scorpius',
            family: 'Zodiac',
            description: 'Scorpius is a prominent zodiac constellation located in the southern celestial hemisphere, anchored by the red supergiant star Antares.'
        },
        'Crux': {
            name: 'Crux',
            family: 'Heavenly Waters',
            description: 'Crux, the Southern Cross, is the smallest of all 88 modern constellations, yet among the most distinctive in the Southern Hemisphere.'
        },
        'Crux (Southern Cross)': {
            name: 'Crux',
            family: 'Heavenly Waters',
            description: 'Crux, the Southern Cross, is the smallest of all 88 modern constellations, yet among the most distinctive in the Southern Hemisphere.'
        },
        'Leo': {
            name: 'Leo',
            family: 'Zodiac',
            description: 'Leo, the Lion, is a majestic zodiac constellation easily identified by its sickle asterism and the bright star Regulus.'
        },
        'Gemini': {
            name: 'Gemini',
            family: 'Zodiac',
            description: 'Gemini, the Twins, is marked by the prominent twin stars Castor and Pollux, high in the winter sky.'
        },
        'Taurus': {
            name: 'Taurus',
            family: 'Zodiac',
            description: 'Taurus, the Bull, is an ancient zodiac constellation hosting the Pleiades and Hyades star clusters alongside the red giant Aldebaran.'
        },
        'Canis Major': {
            name: 'Canis Major',
            family: 'Orion',
            description: 'Canis Major, the Greater Dog, contains Sirius, the brightest individual star in Earth\'s night sky.'
        }
    },
    stars: {
        'Sirius': {
            name: 'Sirius',
            description: 'The brightest star in the night sky. It is a binary star system consisting of an A-type main-sequence star (Sirius A) and a faint white dwarf (Sirius B).'
        },
        'Canopus': {
            name: 'Canopus',
            description: 'The second-brightest star in the night sky. A bright giant star of spectral type A9, it is often used as an attitude reference in spacecraft guidance systems.'
        },
        'Arcturus': {
            name: 'Arcturus',
            description: 'The brightest star in the northern celestial hemisphere. It is an orange giant star located in the constellation Boötes.'
        },
        'Vega': {
            name: 'Vega',
            description: 'The brightest star in the constellation Lyra and the fifth-brightest star in the night sky. Vega was the first star other than the Sun to be photographed.'
        },
        'Capella': {
            name: 'Capella',
            description: 'The sixth-brightest star in the night sky and the brightest in the constellation Auriga. It is a quadruple star system consisting of two binary pairs.'
        },
        'Rigel': {
            name: 'Rigel',
            description: 'A blue-white supergiant star in the constellation Orion. It is the most luminous star in its local stellar region, radiating over 120,000 times the luminosity of the Sun.'
        },
        'Procyon': {
            name: 'Procyon',
            description: 'The brightest star in Canis Minor. It is a binary star system consisting of a white main-sequence star and a faint white dwarf companion.'
        },
        'Betelgeuse': {
            name: 'Betelgeuse',
            description: 'A distinctly reddish semiregular variable red supergiant star in Orion. One of the largest stars visible to the naked eye, it will eventually end in a supernova.'
        },
        'Achernar': {
            name: 'Achernar',
            description: 'The brightest star in the constellation Eridanus. It is the least spherical and fastest-spinning star studied in the Milky Way.'
        },
        'Hadar': {
            name: 'Hadar',
            description: 'Also known as Beta Centauri, a triple star system in Centaurus and the second-brightest point of light in the constellation.'
        },
        'Altair': {
            name: 'Altair',
            description: 'The brightest star in the constellation Aquila and the twelfth-brightest star in the night sky, known for its extremely rapid equatorial rotation.'
        },
        'Acrux': {
            name: 'Acrux',
            description: 'The brightest star in Crux (the Southern Cross). It is a multiple star system located approximately 320 light-years from the Sun.'
        },
        'Aldebaran': {
            name: 'Aldebaran',
            description: 'An orange giant star in Taurus, appearing as the fiery eye of the Bull. It is the brightest star in the constellation.'
        },
        'Spica': {
            name: 'Spica',
            description: 'The brightest star in Virgo. A spectroscopic binary and rotating ellipsoidal variable, it consists of two stars orbiting each other every four days.'
        },
        'Antares': {
            name: 'Antares',
            description: 'A red supergiant star and the heart of the constellation Scorpius. It is distinctively red and rivaled only by Betelgeuse in apparent size among nearby supergiants.'
        },
        'Pollux': {
            name: 'Pollux',
            description: 'An orange giant star in Gemini and the brighter of the twin stars (Castor and Pollux). It hosts a confirmed extrasolar giant planet.'
        },
        'Fomalhaut': {
            name: 'Fomalhaut',
            description: 'The brightest star in Piscis Austrinus. Famous for its prominent debris circumstellar disk, often referred to as "the Eye of Sauron".'
        },
        'Deneb': {
            name: 'Deneb',
            description: 'A blue-white supergiant star in Cygnus and the tail of the Swan. One of the most intrinsically luminous stars known, visible over 2,600 light-years away.'
        },
        'Regulus': {
            name: 'Regulus',
            description: 'The brightest star in Leo and the heart of the Lion. It is a quadruple star system with an extremely fast rotation period of under 16 hours.'
        },
        'Polaris': {
            name: 'Polaris',
            description: 'The North Star or Pole Star, located almost directly at the north celestial pole. It is a multiple star system and a classical Cepheid variable.'
        }
    }
};
