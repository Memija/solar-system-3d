/**
 * SettingOptionsData.ts
 * Concise astronomical, scientific, and observational explanations
 * for every configuration toggle and instrument in the Observatory Command settings.
 */

import { i18n, SupportedLanguage } from '../i18n';

export interface SettingOptionInfo {
    id: string;
    icon: string;
    titleKey: string;
    fallbackTitle: string;
    categoryKey: string;
    fallbackCategory: string;
    kbd?: string;
    summary: string;
    overview: string;
    science: string;
    tip: string;
}

export const SETTING_OPTIONS_INFO: Record<string, SettingOptionInfo> = {
    // -------------------------------------------------------------------------
    // CELESTIAL TARGETING & NAVIGATION
    // -------------------------------------------------------------------------
    celestialNav: {
        id: 'celestialNav',
        icon: '🔭',
        titleKey: 'controls.sections.celestialNav',
        fallbackTitle: 'Celestial Target Navigation',
        categoryKey: 'controls.tabs.target',
        fallbackCategory: 'Target Ephemeris',
        summary: 'Target, track, and align the camera to planets, moons, and spacecraft with JPL ephemerides.',
        overview: 'Direct celestial coordinate targeting and ephemeris tracking system for navigating between stars, planets, moons, and spacecraft.',
        science: 'Translates JPL Horizons ephemerides and orbital state vectors into the camera coordinate system, dynamically adjusting focus targets and tracking frames.',
        tip: 'Use the category and body dropdowns or click any of the quick focus chips to immediately lock onto any planet, moon, or deep space probe.'
    },

    // -------------------------------------------------------------------------
    // SIMULATION TIME & DYNAMICS
    // -------------------------------------------------------------------------
    pauseResume: {
        id: 'pauseResume',
        icon: '⏯️',
        titleKey: 'controls.sections.simulationState',
        fallbackTitle: 'Simulation State',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        kbd: 'Space',
        summary: 'Freezes simulation time across the solar system to inspect exact planetary alignments.',
        overview: 'Freezes or resumes simulation time across the entire Solar System, holding all planetary revolutions and rotations in place.',
        science: 'Celestial mechanics describes continuous orbits dictated by gravitational forces and Keplerian laws. Pausing simulation time allows astronomers and observers to examine exact planetary conjunctions, occultations, and geometric distance vectors at an exact epoch without motion blur.',
        tip: 'Press Space at any time to instantly freeze the simulation, then inspect the 3D distances between worlds or measure distances using the bottom HUD bar.'
    },
    speedPresets: {
        id: 'speedPresets',
        icon: '⚡',
        titleKey: 'controls.speedPreset',
        fallbackTitle: 'Astronomical Speed Presets',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        summary: 'Calibrated time-warp presets from 1:1 real-time up to 1 month per second.',
        overview: 'Quick one-click calibrated warp speeds matching standard astronomical observation time scales.',
        science: 'Planetary periods span vastly different timescales: Mercury orbits the Sun in just 88 days, Earth in 365.25 days, and Neptune in 164.8 years. The 1 day/sec preset is scientifically calibrated so inner planets move at observable speeds while outer giants advance gracefully.',
        tip: 'Use "1 day / s" for realistic planetary viewing, or "1 mo / s" when you want to observe full outer planet orbits and solar system cycles.'
    },
    timeSpeed: {
        id: 'timeSpeed',
        icon: '⏱️',
        titleKey: 'controls.timeSpeed',
        fallbackTitle: 'Simulation Time Speed',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        kbd: '[ / ]',
        summary: 'Adjust forward simulation speed smoothly in fine 0.005 day/s increments.',
        overview: 'Smooth variable scrubber controlling the continuous forward velocity of simulation time.',
        science: 'Adjusts the delta-time multiplier passed into Keplerian orbital integration functions and axial rotation matrix transforms during every frame of the render loop.',
        tip: 'Use the [ and ] keys on your keyboard for fine step increments (0.005 day/s per tap) without opening the drawer.'
    },
    jumpToDate: {
        id: 'jumpToDate',
        icon: '📅',
        titleKey: 'ui.simDate',
        fallbackTitle: 'Observation Date',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        summary: 'Calculate authentic planetary coordinates for any historical or future date across millennia.',
        overview: 'Calibrates celestial coordinates to exact historical or future calendar dates across thousands of years.',
        science: 'Utilizes Keplerian orbital elements (semi-major axis, eccentricity, inclination, longitude of ascending node, argument of periapsis, and mean anomaly at epoch J2000) to compute authentic heliocentric positions for any Julian day.',
        tip: 'Click on the date display in the header bar or select a milestone (e.g. Apollo 11 or Voyager launches) to witness the Solar System as it appeared on that historic day.'
    },

    // -------------------------------------------------------------------------
    // CELESTIAL LAYERS
    // -------------------------------------------------------------------------
    showOrbits: {
        id: 'showOrbits',
        icon: '🪐',
        titleKey: 'controls.showOrbits',
        fallbackTitle: 'Planetary & Celestial Orbits',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'O',
        summary: 'Toggles elliptical Keplerian orbital trajectory paths for all celestial bodies.',
        overview: 'Toggles the glowing elliptical orbital trajectory curves drawn for all planets, dwarf planets, comets, and spacecraft.',
        science: 'Planets move in ellipses with the Sun at one focus (Kepler’s First Law). These 3D paths visualize the spatial geometry of each body’s orbital plane, perihelion (closest approach), aphelion (farthest distance), and orbital inclination relative to the ecliptic.',
        tip: 'Tilt your camera view nearly edge-on to notice how closely the eight major planets share a common flat orbital plane, while dwarf planets and comets tilt sharply.'
    },
    showMoons: {
        id: 'showMoons',
        icon: '🌕',
        titleKey: 'controls.showMoons',
        fallbackTitle: 'Natural Satellites & Moons',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'N',
        summary: 'Displays 3D models and orbital positions for natural satellites orbiting host worlds.',
        overview: 'Toggles the 3D meshes, orbital positions, and trajectories of natural satellites orbiting host planets throughout the Solar System.',
        science: 'From Earth’s Moon to the ocean worlds Europa and Enceladus, moons represent some of the most geologically active and astrobiologically intriguing destinations in space, shaped by intense gravitational tidal heating.',
        tip: 'Focus on Jupiter (press 5) or Saturn (press 6) and zoom in to watch the Galilean moons or Titan orbit their host gas giants in real-time.'
    },
    showAsteroids: {
        id: 'showAsteroids',
        icon: '🪨',
        titleKey: 'controls.showAsteroids',
        fallbackTitle: 'Main Asteroid Belt',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'E',
        summary: 'Renders the main asteroid belt between Mars and Jupiter with Kirkwood gaps.',
        overview: 'Toggles thousands of simulated asteroid particles orbiting in the circumstellar disc between the orbits of Mars and Jupiter.',
        science: 'Located between 2.2 and 3.2 astronomical units (AU) from the Sun, the asteroid belt contains primordial remnants from the solar nebula that were prevented by Jupiter’s gravitational perturbations from accreting into a planet, resulting in distinct empty zones called Kirkwood gaps.',
        tip: 'Rotate the camera to top-down view to see the toroidal ring distribution and observe how it cleanly separates the rocky inner terrestrial planets from the outer gas giants.'
    },
    showKuiperBelt: {
        id: 'showKuiperBelt',
        icon: '❄️',
        titleKey: 'controls.showKuiperBelt',
        fallbackTitle: 'Kuiper Belt',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'U',
        summary: 'Visualizes the outer disc of icy bodies, dwarf planets, and comets extending past Neptune.',
        overview: 'Toggles the visualization of the vast outer disc of icy planetesimals, dwarf planets, and cometary nuclei extending beyond Neptune.',
        science: 'Extending from Neptune’s orbit at 30 AU out to approximately 55 AU, the Kuiper Belt is composed of primitive frozen volatiles such as methane, ammonia, and water ice. It is home to Pluto, Haumea, and Makemake, and acts as the source reservoir for short-period comets.',
        tip: 'Zoom all the way out until Neptune’s orbit looks compact to appreciate the staggering width and volume of the outer solar system boundary.'
    },
    showDwarfPlanets: {
        id: 'showDwarfPlanets',
        icon: '⚪',
        titleKey: 'controls.showDwarfPlanets',
        fallbackTitle: 'Dwarf Planets',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'W',
        summary: 'Toggles dwarf planets including Ceres, Pluto, Eris, Haumea, and Makemake.',
        overview: 'Toggles dwarf planets and their orbital paths, including Ceres, Pluto, Eris, Haumea, and Makemake.',
        science: 'Defined by the International Astronomical Union in 2006, a dwarf planet is a celestial body orbiting the Sun that has sufficient mass for self-gravity to overcome rigid body forces (hydrostatic equilibrium), but has not cleared the neighborhood around its orbit.',
        tip: 'Focus on Pluto (press 9) and toggle orbits to see how its 17° inclination carries it high above and below the solar system’s main plane.'
    },
    showComets: {
        id: 'showComets',
        icon: '☄️',
        titleKey: 'controls.showComets',
        fallbackTitle: 'Comets & Ion Tails',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'Q',
        summary: 'Renders periodic comets with dynamic solar-wind ion and dust tails.',
        overview: 'Toggles historic and periodic comets (Halley, Encke, Hale-Bopp, NEOWISE, 67P) featuring dynamic solar-wind ion and dust tails.',
        science: 'Comets are icy bodies that warm as they approach perihelion. Solar radiation and the solar wind vaporize volatile ices, forming a glowing coma and two tails: a straight blue ion tail pushed directly away by solar wind, and a curved white dust tail along the orbital path.',
        tip: 'Follow Comet Halley through its perihelion pass near the Sun to observe its tail dynamically turn away from the solar barycenter.'
    },
    showSpacecraft: {
        id: 'showSpacecraft',
        icon: '🛰️',
        titleKey: 'controls.showSpacecraft',
        fallbackTitle: 'Interplanetary Spacecraft',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'J',
        summary: 'Visualizes historic explorer trajectories including Voyager 1, Cassini, and New Horizons.',
        overview: 'Toggles 3D models and trajectories of legendary robotic emissaries, including Voyager 1 & 2, Pioneer, New Horizons, Cassini, and Juno.',
        science: 'Human deep-space exploration relies on complex gravity-assist slingshots around planets to build velocity and adjust orbital inclinations, enabling missions to escape the Sun’s gravitational well and enter interstellar space.',
        tip: 'Select Voyager 1 to see humanity’s most distant technological ambassador traversing the interstellar frontier beyond the heliopause.'
    },
    showMeteors: {
        id: 'showMeteors',
        icon: '🌠',
        titleKey: 'controls.showMeteors',
        fallbackTitle: 'Near-Earth Meteor Showers',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'Y',
        summary: 'Renders atmospheric shooting star radiants streaking across Earth\'s upper atmosphere.',
        overview: 'Toggles atmospheric meteor showers streaking through Earth’s upper atmosphere.',
        science: 'Meteors are incandescent streaks of light produced when microscopic meteoroids (cometary dust and asteroid debris) enter the atmosphere at hypervelocities (11 to 72 km/s), generating extreme ram pressure and ionization.',
        tip: 'Toggling this setting centers Earth. Zoom into the dark hemisphere of Earth to watch shooting stars burn across the night sky.'
    },
    showTrails: {
        id: 'showTrails',
        icon: '〰️',
        titleKey: 'controls.showTrails',
        fallbackTitle: 'Orbital Motion Trails',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'I',
        summary: 'Draws dynamic velocity trails behind moving worlds highlighting orbital speed differentials.',
        overview: 'Toggles dynamic velocity tails tracing the immediate orbital path traveled behind moving planets and moons.',
        science: 'Planets travel at tremendous velocities (e.g. Earth travels at ~29.8 km/s, Mercury at ~47.4 km/s). Motion trails visualize instantaneous velocity vectors and highlight the speed differentials dictated by Kepler’s Second Law.',
        tip: 'Speed up simulation time with ] while trails are enabled to see the inner planets sweep through space noticeably faster than outer worlds.'
    },

    // -------------------------------------------------------------------------
    // CAMERA & PERSPECTIVE
    // -------------------------------------------------------------------------
    orbitFocus: {
        id: 'orbitFocus',
        icon: '🎯',
        titleKey: 'controls.sections.orbitFocus',
        fallbackTitle: 'Orbit Focus Perspective',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        kbd: 'A',
        summary: 'Locks camera tracking onto the target body while allowing full 3D orbital inspection.',
        overview: 'Locks the camera tracking onto the selected celestial target, keeping it centered while you orbit, pitch, and zoom.',
        science: 'Transforms the observation frame of reference to a body-centered coordinate system, exactly matching how planetary orbiters and astronomical telescopes study specific targets.',
        tip: 'Select any planet or star from the Target chips or dropdown, then press A to snap and lock camera focus onto it.'
    },
    surfaceView: {
        id: 'surfaceView',
        icon: '🪐',
        titleKey: 'controls.sections.surfaceView',
        fallbackTitle: 'Surface View Horizon',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        kbd: 'V',
        summary: 'Places the observer on the equator of the target world looking outward at the horizon.',
        overview: 'Positions the observer directly on the surface of the selected planet or moon looking out toward the sky and horizon.',
        science: 'Simulates the viewpoint of an astronaut or robotic surface lander (such as Curiosity or Perseverance), demonstrating planetary axial rotation and celestial transits as seen from alien ground.',
        tip: 'Land on Mars or the Moon, then speed up simulation time to watch sunrise, sunset, and host planet transits across the horizon.'
    },
    freeCamera: {
        id: 'freeCamera',
        icon: '🚀',
        titleKey: 'controls.sections.freeCam',
        fallbackTitle: 'Free Camera / Inertial Flight',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        kbd: 'D',
        summary: 'Detaches the camera for unconstrained six-degrees-of-freedom flight across space.',
        overview: 'Detaches the camera from all celestial targets, giving you unconstrained six-degrees-of-freedom navigation across deep space.',
        science: 'Provides an inertial observer viewpoint free from planetary gravitational references, ideal for inspecting arbitrary solar system alignments and polar views.',
        tip: 'Press D to detach camera, then drag to pan and rotate anywhere in the solar system without being pulled by planetary motion.'
    },
    cinematicTour: {
        id: 'cinematicTour',
        icon: '🎬',
        titleKey: 'controls.cinematicTour',
        fallbackTitle: 'Autonomous Grand Tour',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        kbd: 'T',
        summary: 'Automated cinematic tour visiting solar system highlights sequentially with smooth flybys.',
        overview: 'Automates a continuous cinematic guided flyby journey through every planet and major destination in the Solar System.',
        science: 'Inspired by the historic 1970s "Grand Tour" alignment of outer planets that allowed the Voyager missions to visit Jupiter, Saturn, Uranus, and Neptune through sequential gravity assists.',
        tip: 'Sit back and enjoy the full-screen tour, or press T or click anywhere on screen to exit and regain manual control.'
    },
    tourSpeed: {
        id: 'tourSpeed',
        icon: '⏱️',
        titleKey: 'controls.tourSpeed',
        fallbackTitle: 'Tour Dwell Interval',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        summary: 'Adjusts the dwell duration spent orbiting each celestial body during the grand tour.',
        overview: 'Controls how many seconds the camera dwells inspecting each celestial body during the Autonomous Grand Tour before smoothly flying to the next world.',
        science: 'Adjusts the spline interpolation and camera lerp duration between orbital targets during the automated flight sequence.',
        tip: 'Set to 5–8 seconds for an engaging presentation, or longer if reading dossier statistics as the camera orbits.'
    },

    // -------------------------------------------------------------------------
    // OPTICS & PHYSICAL SCALE
    // -------------------------------------------------------------------------
    realisticDistances: {
        id: 'realisticDistances',
        icon: '📏',
        titleKey: 'controls.realisticScale',
        fallbackTitle: 'Realistic Distances / True Scale',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'R',
        summary: 'Switches between artistic viewable spacing and true 1:1 astronomical physical scale.',
        overview: 'Switches from pedagogical artistic scale to authentic 1:1 true physical scale where distances between worlds match real physics.',
        science: 'Space is overwhelmingly empty vacuum. In standard interactive models, planet sizes are magnified by hundreds of times so they can be seen alongside their orbits. In True Scale mode, Earth is a tiny 12,742 km speck orbiting 150 million km from the Sun.',
        tip: 'Notice the holographic locator reticles that appear around planets in this mode so you can locate microscopic worlds across astronomical distances.'
    },
    showHabitableZone: {
        id: 'showHabitableZone',
        icon: '🌱',
        titleKey: 'controls.habitableZone',
        fallbackTitle: 'Circumstellar Habitable Zone',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'Z',
        summary: 'Visualizes the circumstellar Goldilocks zone where liquid water can exist on planets.',
        overview: 'Renders the luminous green "Goldilocks Zone" around the Sun where planetary surface temperatures can sustain liquid water.',
        science: 'Based on solar luminosity flux models and atmospheric greenhouse assumptions, the conservative habitable zone extends from ~0.95 to ~1.37 AU. Earth resides comfortably within it, while Venus is just inside the runaway greenhouse boundary and Mars touches the frozen outer limit.',
        tip: 'Observe how Earth orbits right through the sweet spot of the zone, while Mars lies near the chilled outer frontier.'
    },
    showEclipticGrid: {
        id: 'showEclipticGrid',
        icon: '🌐',
        titleKey: 'controls.eclipticGrid',
        fallbackTitle: 'Ecliptic Plane Grid',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'G',
        summary: 'Displays the fundamental reference plane defined by Earth\'s orbital plane around the Sun.',
        overview: 'Renders the primary astronomical reference coordinate grid aligned with the geometric plane of Earth’s orbit around the Sun.',
        science: 'The ecliptic is the geometric plane containing Earth’s orbit. Because the Solar System formed from a collapsing protoplanetary accretion disc, nearly all planets orbit within a few degrees of this plane, making it the bedrock coordinate system for celestial ephemerides.',
        tip: 'View the solar system from the side with the grid on to see the slight orbital inclination of Mercury (7°) and the steep tilt of Pluto (17°).'
    },
    enableBloom: {
        id: 'enableBloom',
        icon: '✨',
        titleKey: 'controls.enableBloom',
        fallbackTitle: 'HDR Bloom Glow Effect',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'B',
        summary: 'Toggles HDR atmospheric glow, solar flare radiance, and emissive surface bloom.',
        overview: 'Toggles high-dynamic-range post-processing bloom shaders, producing realistic optical halos, solar coronal glow, and atmospheric edge illumination.',
        science: 'Simulates the optical diffraction and light scattering that occurs in telescope optics and human eyes when viewing intensely bright radiation sources that exceed the sensor’s dynamic range.',
        tip: 'Observe the radiant solar flares and coronal glow around the Sun, as well as atmospheric limb scattering around Earth and Venus.'
    },
    realisticLighting: {
        id: 'realisticLighting',
        icon: '💡',
        titleKey: 'controls.realisticLighting',
        fallbackTitle: 'Realistic Deep Space Lighting',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'L',
        summary: 'Simulates true inverse-square solar radiation falloff with realistic planetary shadows.',
        overview: 'Toggles physically based inverse-square law directional illumination with deep-space pitch-black shadows vs ambient viewing light.',
        science: 'In space, without a diffuse atmosphere to scatter photons, shadows are razor-sharp and pitch-black. Day and night hemispheres are separated by a dramatic terminator line, and night sides receive light only from starshine or reflected planetshine.',
        tip: 'Orbit around Earth, Saturn, or the Moon to the unlit night hemisphere to witness the dramatic razor-sharp solar terminator.'
    },
    showAxes: {
        id: 'showAxes',
        icon: '🧭',
        titleKey: 'controls.showAxes',
        fallbackTitle: 'Coordinate Barycenter Axes',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'X',
        summary: 'Overlays 3D Cartesian coordinate axes (X: Red, Y: Green, Z: Blue) centered on the Sun.',
        overview: 'Renders Cartesian spatial orientation axes centered on the solar barycenter (Red = X, Green = Y / Solar North, Blue = Z).',
        science: 'Corresponds to standard J2000 heliocentric coordinate systems used in aerospace navigation, astrodynamics, and spacecraft mission design.',
        tip: 'Use axes when navigating in Free Camera mode to keep your bearings relative to the Solar System’s rotational north pole.'
    },

    // -------------------------------------------------------------------------
    // SYSTEM INSTRUMENTS
    // -------------------------------------------------------------------------
    minimap: {
        id: 'minimap',
        icon: '🛰️',
        titleKey: 'controls.showMinimap',
        fallbackTitle: 'Tactical Radar Minimap',
        categoryKey: 'controls.tabs.system',
        fallbackCategory: 'System Instrument',
        kbd: 'M',
        summary: 'Toggles the top-down tactical radar display in the lower-right corner showing nearby bodies.',
        overview: 'Displays a live holographic radar display in the lower-right viewport, tracking celestial bodies, spacecraft, and camera sweep.',
        science: 'Modeled after deep-space tracking station displays, projecting 3D heliocentric positions onto a polar range display with logarithmic distance rings from 1 AU to 40 AU.',
        tip: 'Click on celestial blips directly on the radar screen to instantly focus and lock your camera onto those distant worlds.'
    },
    telemetry: {
        id: 'telemetry',
        icon: '⚡',
        titleKey: 'ui.telemetry',
        fallbackTitle: 'Engine Telemetry HUD',
        categoryKey: 'controls.tabs.system',
        fallbackCategory: 'System Instrument',
        kbd: 'P',
        summary: 'Displays real-time graphics performance metrics including FPS (Frames Per Second), draw calls, and GPU (Graphics Processing Unit) load.',
        overview: 'Displays real-time technical graphics performance metrics in the lower-left viewport, including FPS (Frames Per Second), frame render time (ms), WebGL draw calls, geometry triangles, and GPU (Graphics Processing Unit) texture memory.',
        science: 'Provides crucial diagnostics for monitoring three.js WebGL rendering pipeline health, frame pacing, shader efficiency, and memory consumption.',
        tip: 'Press P to toggle telemetry and monitor how complex effects like bloom or particle fields affect your device’s GPU frame rate.'
    }
};

/**
 * Complete, authentic translations for concise option summaries across all supported languages.
 */
export const SETTING_SUMMARIES: Record<SupportedLanguage, Record<string, string>> = {
    en: {
        celestialNav: 'Target, track, and align the camera to planets, moons, and spacecraft with JPL ephemerides.',
        pauseResume: 'Freezes simulation time across the solar system to inspect exact planetary alignments.',
        speedPresets: 'Calibrated time-warp presets from 1:1 real-time up to 1 month per second.',
        timeSpeed: 'Adjust forward simulation speed smoothly in fine 0.005 day/s increments.',
        jumpToDate: 'Calculate authentic planetary coordinates for any historical or future date across millennia.',
        showOrbits: 'Toggles elliptical Keplerian orbital trajectory paths for all celestial bodies.',
        showMoons: 'Displays 3D models and orbital positions for natural satellites orbiting host worlds.',
        showAsteroids: 'Renders the main asteroid belt between Mars and Jupiter with Kirkwood gaps.',
        showKuiperBelt: 'Visualizes the outer disc of icy bodies, dwarf planets, and comets extending past Neptune.',
        showDwarfPlanets: 'Toggles dwarf planets including Ceres, Pluto, Eris, Haumea, and Makemake.',
        showComets: 'Renders periodic comets with dynamic solar-wind ion and dust tails.',
        showSpacecraft: 'Visualizes historic explorer trajectories including Voyager 1, Cassini, and New Horizons.',
        showMeteors: 'Renders atmospheric shooting star radiants streaking across Earth\'s upper atmosphere.',
        showTrails: 'Draws dynamic velocity trails behind moving worlds highlighting orbital speed differentials.',
        orbitFocus: 'Locks camera tracking onto the target body while allowing full 3D orbital inspection.',
        surfaceView: 'Places the observer on the equator of the target world looking outward at the horizon.',
        freeCamera: 'Detaches the camera for unconstrained six-degrees-of-freedom flight across space.',
        cinematicTour: 'Automated cinematic tour visiting solar system highlights sequentially with smooth flybys.',
        tourSpeed: 'Adjusts the dwell duration spent orbiting each celestial body during the grand tour.',
        realisticDistances: 'Switches between artistic viewable spacing and true 1:1 astronomical physical scale.',
        showHabitableZone: 'Visualizes the circumstellar Goldilocks zone where liquid water can exist on planets.',
        showEclipticGrid: 'Displays the fundamental reference plane defined by Earth\'s orbital plane around the Sun.',
        enableBloom: 'Toggles HDR atmospheric glow, solar flare radiance, and emissive surface bloom.',
        realisticLighting: 'Simulates true inverse-square solar radiation falloff with realistic planetary shadows.',
        showAxes: 'Overlays 3D Cartesian coordinate axes (X: Red, Y: Green, Z: Blue) centered on the Sun.',
        minimap: 'Toggles the top-down tactical radar display in the lower-right corner showing nearby bodies.',
        telemetry: 'Displays real-time graphics performance metrics including FPS (Frames Per Second), draw calls, and GPU (Graphics Processing Unit) load.'
    },
    bs: {
        celestialNav: 'Ciljajte, pratite i usmjerite kameru na planete, mjesece i letjelice prema JPL efemeridama.',
        pauseResume: 'Zaustavlja vrijeme simulacije u cijelom Sunčevom sistemu radi pregleda tačnih položaja planeta.',
        speedPresets: 'Kalibrisane brzine protoka vremena od realnog vremena 1:1 do 1 mjeseca u sekundi.',
        timeSpeed: 'Glatko podešavanje brzine simulacije u finim koracima od 0.005 dana/sekundi.',
        jumpToDate: 'Izračunajte autentične koordinate planeta za bilo koji historijski ili budući datum.',
        showOrbits: 'Prikazuje eliptične Keplerove orbitalne putanje za sva nebeska tijela.',
        showMoons: 'Prikazuje 3D modele i orbitalne položaje prirodnih satelita oko matičnih planeta.',
        showAsteroids: 'Prikazuje glavni asteroidni pojas između Marsa i Jupitera sa Kirkvudovim pukotinama.',
        showKuiperBelt: 'Vizualizira prostrani pojas ledenih tijela, patuljastih planeta i kometa iza Neptuna.',
        showDwarfPlanets: 'Prikazuje patuljaste planete uključujući Cereru, Pluton, Eridu, Haumeu i Makemake.',
        showComets: 'Prikazuje periodične komete sa dinamičkim jonskim i prašinskim repovima.',
        showSpacecraft: 'Vizualizira putanje historijskih sondi uključujući Voyager 1, Cassini i New Horizons.',
        showMeteors: 'Prikazuje meteorske pljuskove i zvijezde padalice u Zemljinoj atmosferi.',
        showTrails: 'Iscrtava dinamičke tragove brzine iza tijela koji dočaravaju razlike u orbitalnim brzinama.',
        orbitFocus: 'Zaključava praćenje kamere na odabrano tijelo uz slobodno orbitalno rotiranje i zumiranje.',
        surfaceView: 'Postavlja posmatrača na površinu odabranog svijeta gledajući prema nebu i horizontu.',
        freeCamera: 'Odvaja kameru za potpuno slobodan let sa šest stepeni slobode kroz duboki svemir.',
        cinematicTour: 'Automatska filmska tura koja sekvencijalno obilazi najvažnije destinacije Sunčevog sistema.',
        tourSpeed: 'Podešava trajanje zadržavanja kamere u orbiti svakog tijela tokom automatske ture.',
        realisticDistances: 'Prebacuje između umjetničkog prikaza i stvarne astronomske razmjere 1:1.',
        showHabitableZone: 'Prikazuje nastanjivu zonu oko Sunca u kojoj tečna voda može postojati na planetama.',
        showEclipticGrid: 'Prikazuje referentnu koordinatnu mrežu ravni Zemljine orbite oko Sunca.',
        enableBloom: 'Uključuje atmosferski sjaj, bljeskove Sunca i svjetlosni Bloom efekat.',
        realisticLighting: 'Simulira realistično opadanje sunčevog zračenja uz oštre, prirodne svemirske sjenke.',
        showAxes: 'Prikazuje 3D Kartezijeve koordinatne ose (X: crvena, Y: zelena, Z: plava) sa centrom u Suncu.',
        minimap: 'Prikazuje taktički radarski radar u donjem desnom uglu sa prikazom obližnjih tijela.',
        telemetry: 'Prikazuje performanse grafičkog enginea uključujući FPS (broj sličica u sekundi), vrijeme renderovanja i GPU (grafički procesor) memoriju.'
    },
    sr: {
        celestialNav: 'Циљајте, пратите и усмерите камеру на планете, месеце и летелице према JPL ефемеридама.',
        pauseResume: 'Зауставља време симулације у целом Сунчевом систему ради прегледа тачних положаја планета.',
        speedPresets: 'Калибрисане брзине протока времена од реалног времена 1:1 до 1 месеца у секунди.',
        timeSpeed: 'Глатко подешавање брзине симулације у финим корацима од 0.005 дана/секунди.',
        jumpToDate: 'Израчунајте аутентичне координате планета за било који историјски или будући датум.',
        showOrbits: 'Приказује елиптичне Кеплерове орбиталне путање за сва небеска тела.',
        showMoons: 'Приказује 3D моделе и орбиталне положаје природних сателита око матичних планета.',
        showAsteroids: 'Приказује главни астероидни појас између Марса и Јупитера са Кирквудовим шупљинама.',
        showKuiperBelt: 'Визуелизује пространи појас ледених тела, патуљастих планета и комета иза Нептуна.',
        showDwarfPlanets: 'Приказује патуљасте планете укључујући Цереру, Плутон, Ериду, Хаумеу и Макемаке.',
        showComets: 'Приказује периодичне комете са динамичким јонским и прашинским реповима.',
        showSpacecraft: 'Визуелизује путање историјских сонди укључујући Војаџер 1, Касини и Њу Хорајзонс.',
        showMeteors: 'Приказује метеорске ројеве и звезде падалице у Земљиној атмосфери.',
        showTrails: 'Исцртава динамичке трагове брзине иза тела који дочаравају разлике у орбиталним брзинама.',
        orbitFocus: 'Закључава праћење камере на одабрано тело уз слободно орбитално ротирање и зумирање.',
        surfaceView: 'Поставља посматрача на површину одабраног света гледајући према небу и хоризонту.',
        freeCamera: 'Одваја камеру за потпуно слободан лет са шест степени слободе кроз дубоки свемир.',
        cinematicTour: 'Аутоматска филмска тура која редом обилази најважније дестинације Сунчевог система.',
        tourSpeed: 'Подешава трајање задржавања камере у орбити сваког тела током аутоматске туре.',
        realisticDistances: 'Пребацује између уметничког приказа и стварне астрономске размере 1:1.',
        showHabitableZone: 'Приказује настањиву зону око Сунца у којој течна вода може постојати на планетама.',
        showEclipticGrid: 'Приказује референтну координатну мрежу равни Земљине орбите око Сунца.',
        enableBloom: 'Укључује атмосферски сјај, бљескове Сунца и светлосни Bloom ефекат.',
        realisticLighting: 'Симулира реалистично опадање сунчевог зрачења уз оштре, природне свемирске сенке.',
        showAxes: 'Приказује 3D Декартове координатне осе (X: црвена, Y: зелена, Z: плава) са центром у Сунцу.',
        minimap: 'Приказује тактички радарски екран у доњем десном углу са приказом оближњих тела.',
        telemetry: 'Приказује перформансе графичког енџина укључујући FPS (број сличица у секунди), време рендеровања и GPU (графички процесор) меморију.'
    },
    de: {
        celestialNav: 'Zielen, verfolgen und richten Sie die Kamera mit JPL-Ephemeriden auf Planeten, Monde und Sonden aus.',
        pauseResume: 'Hält die Simulationszeit im gesamten Sonnensystem an, um exakte Planetenkonstellationen zu prüfen.',
        speedPresets: 'Kalibrierte Zeitstufen von Echtzeit 1:1 bis zu 1 Monat pro Sekunde.',
        timeSpeed: 'Feinfühlige Geschwindigkeitsregelung in Schritten von 0,005 Tagen/Sekunde.',
        jumpToDate: 'Berechnet authentische Planetenkoordinaten für jedes historische oder zukünftige Datum.',
        showOrbits: 'Zeigt elliptische Kepler-Bahnen aller Himmelskörper im Raum an.',
        showMoons: 'Blendet 3D-Modelle und Umlaufbahnen natürlicher Monde um ihre Heimatwelten ein.',
        showAsteroids: 'Rendert den Asteroidengürtel zwischen Mars und Jupiter mit Kirkwood-Lücken.',
        showKuiperBelt: 'Visualisiert die Eiskörper, Zwergplaneten und Kometen jenseits von Neptun.',
        showDwarfPlanets: 'Zeigt Zwergplaneten wie Ceres, Pluto, Eris, Haumea und Makemake samt Bahnen an.',
        showComets: 'Rendert periodische Kometen mit dynamischen Ionen- und Staubschweifen.',
        showSpacecraft: 'Visualisiert Flugbahnen historischer Raumsonden wie Voyager 1, Cassini und New Horizons.',
        showMeteors: 'Rendert Sternschnuppen und Meteorschauer in der oberen Erdatmosphäre.',
        showTrails: 'Zeichnet dynamische Bewegungsschweife zur Veranschaulichung orbitaler Geschwindigkeiten.',
        orbitFocus: 'Fixiert den Blickpunkt auf das Zielobjekt bei freier 3D-Drehung und Zoom.',
        surfaceView: 'Versetzt den Beobachter auf die Oberfläche des Planeten mit Blick zum Horizont.',
        freeCamera: 'Löst die Kamera für uneingeschränkten 6-Achsen-Flug durch den Raum.',
        cinematicTour: 'Automatische kinoreife Rundreise zu den Höhepunkten des Sonnensystems.',
        tourSpeed: 'Bestimmt die Verweildauer im Orbit der Himmelskörper während der Tour.',
        realisticDistances: 'Schaltet zwischen didaktischer Ansicht und echtem physikalischen 1:1-Maßstab um.',
        showHabitableZone: 'Visualisiert die lebensfreundliche Zone um die Sonne, in der flüssiges Wasser möglich ist.',
        showEclipticGrid: 'Blendet das Referenzgitter der Erdbahnebene um die Sonne ein.',
        enableBloom: 'Aktiviert atmosphärisches Leuchten, Sonnenkorona und HDR-Glanz.',
        realisticLighting: 'Simuliert authentischen Strahlungsabfall und tiefschwarze Weltraumschatten.',
        showAxes: 'Blendet räumliche 3D-Koordinatenachsen (X: Rot, Y: Grün, Z: Blau) an der Sonne ein.',
        minimap: 'Aktiviert das taktische holografische Radarfenster unten rechts.',
        telemetry: 'Zeigt technische Echtzeit-Metriken wie FPS (Bilder pro Sekunde), Frametime und GPU-Last (Grafikprozessor) an.'
    },
    id: {
        celestialNav: 'Arahkan, lacak, dan kunci kamera ke planet, bulan, dan wahana antariksa dengan efemeris JPL.',
        pauseResume: 'Membekukan waktu simulasi tata surya untuk memeriksa kesejajaran presisi planet.',
        speedPresets: 'Preset laju waktu terkalibrasi dari waktu nyata 1:1 hingga 1 bulan per detik.',
        timeSpeed: 'Atur laju simulasi maju secara halus dalam kenaikan 0,005 hari/detik.',
        jumpToDate: 'Hitung koordinat planet autentik untuk tanggal historis maupun masa depan lintas milenium.',
        showOrbits: 'Menampilkan garis lintasan orbit Kepler elips untuk semua benda langit.',
        showMoons: 'Menampilkan model 3D dan posisi orbit satelit alami yang mengitari planet induknya.',
        showAsteroids: 'Menampilkan sabuk asteroid utama antara Mars dan Jupiter dengan celah Kirkwood.',
        showKuiperBelt: 'Memvisualisasikan piringan luar benda es, planet kerdil, dan komet melewati Neptunus.',
        showDwarfPlanets: 'Menampilkan planet kerdil termasuk Ceres, Pluto, Eris, Haumea, dan Makemake.',
        showComets: 'Menampilkan komet periodik lengkap dengan ekor ion dan debu angin matahari dinamis.',
        showSpacecraft: 'Memvisualisasikan lintasan penjelajah legendaris seperti Voyager 1, Cassini, dan New Horizons.',
        showMeteors: 'Menampilkan hujan meteor atmosfer yang meluncur melintasi atmosfer Bumi.',
        showTrails: 'Menggambar jejak kecepatan dinamis di belakang benda langit yang menunjukkan selisih laju orbit.',
        orbitFocus: 'Mengunci pelacakan kamera pada objek target dengan kebebasan rotasi dan zoom 3D penuh.',
        surfaceView: 'Menempatkan pengamat di permukaan dunia target menghadap ke langit dan cakrawala.',
        freeCamera: 'Melepaskan kamera untuk navigasi bebas enam derajat kebebasan melintasi antariksa.',
        cinematicTour: 'Tur sinematik otomatis mengunjungi destinasi utama tata surya secara berurutan.',
        tourSpeed: 'Mengatur durasi pengamatan di orbit setiap benda langit selama tur otomatis.',
        realisticDistances: 'Beralih antara jarak tampilan visual dan skala fisik astronomis sebenarnya 1:1.',
        showHabitableZone: 'Memvisualisasikan zona Goldilocks di sekitar Matahari tempat air cair dapat bertahan.',
        showEclipticGrid: 'Menampilkan kisi koordinat bidang orbit Bumi mengelilingi Matahari.',
        enableBloom: 'Mengaktifkan pendaran atmosfer, suar matahari, dan efek cahaya HDR.',
        realisticLighting: 'Mensimulasikan penurunan radiasi matahari hukum kuadrat terbalik dengan bayangan tajam.',
        showAxes: 'Menampilkan sumbu koordinat kartesius 3D (X: Merah, Y: Hijau, Z: Biru) berpusat di Matahari.',
        minimap: 'Menampilkan radar taktis di sudut kanan bawah yang melacak benda langit terdekat.',
        telemetry: 'Menampilkan metrik performa grafis real-time termasuk FPS (Frame Per Detik), waktu render, dan beban GPU (Unit Pemroses Grafis).'
    },
    pl: {
        celestialNav: 'Namierzaj, śledź i ustawiaj kamerę na planety, księżyce i sondy z efemerydami JPL.',
        pauseResume: 'Zatrzymuje upływ czasu w całym Układzie Słonecznym, umożliwiając badanie koniunkcji planet.',
        speedPresets: 'Skalibrowane prędkości czasu od rzeczywistego 1:1 do 1 miesiąca na sekundę.',
        timeSpeed: 'Płynna regulacja prędkości symulacji w precyzyjnych krokach co 0,005 dnia/s.',
        jumpToDate: 'Oblicza autentyczne pozycje planet dla dowolnej daty historycznej lub przyszłej.',
        showOrbits: 'Włącza eliptyczne trajektorie orbit keplerowskich dla wszystkich ciał niebieskich.',
        showMoons: 'Wyświetla modele 3D i orbity naturalnych satelitów krążących wokół planet.',
        showAsteroids: 'Renderuje główny pas planetoid między Marsem a Jowiszem z przerwami Kirkwooda.',
        showKuiperBelt: 'Wizualizuje zewnętrzny dysk lodowych ciał, planet karłowatych i komet za orbitą Neptuna.',
        showDwarfPlanets: 'Włącza planety karłowate, w tym Ceres, Plutona, Eris, Haumeę i Makemake.',
        showComets: 'Renderuje komety okresowe z dynamicznymi warkoczami jonowymi i pyłowymi.',
        showSpacecraft: 'Wizualizuje trajektorie słynnych sond, m.in. Voyager 1, Cassini i New Horizons.',
        showMeteors: 'Renderuje roje meteorów spalające się w górnych warstwach atmosfery Ziemi.',
        showTrails: 'Rysuje dynamiczne ślady prędkości za ciałami ilustrujące różnice prędkości orbitalnych.',
        orbitFocus: 'Blokuje śledzenie kamery na wybranym obiekcie z pełną swobodą obrotu i przybliżania.',
        surfaceView: 'Umieszcza obserwatora na powierzchni wybranego świata z widokiem na horyzont.',
        freeCamera: 'Odłącza kamerę, dając pełną swobodę sześciu stopni ruchu w przestrzeni kosmicznej.',
        cinematicTour: 'Automatyczna filmowa podróż po najważniejszych obiektach Układu Słonecznego.',
        tourSpeed: 'Reguluje czas przebywania kamery na orbicie każdego ciała podczas automatycznej podróży.',
        realisticDistances: 'Przełącza między skróconą skalą poglądową a autentyczną skalą fizyczną 1:1.',
        showHabitableZone: 'Wizualizuje ekosferę wokół Słońca, w której może istnieć woda w stanie ciekłym.',
        showEclipticGrid: 'Wyświetla siatkę płaszczyzny orbity Ziemi wokół Słońca jako układ odniesienia.',
        enableBloom: 'Włącza poświatę atmosferyczną, blask korony słonecznej i efekt świetlny HDR.',
        realisticLighting: 'Symuluje realistyczny spadek natężenia światła słonecznego i głębokie cienie kosmiczne.',
        showAxes: 'Wyświetla przestrzenne osie współrzędnych (X: czerwona, Y: zielona, Z: niebieska) w centrum Słońca.',
        minimap: 'Włącza taktyczny ekran radaru w prawym dolnym rogu śledzący pobliskie obiekty.',
        telemetry: 'Wyświetla wskaźniki wydajności graficznej w czasie rzeczywistym, w tym FPS (klatki na sekundę), czas klatki i pamięć GPU (procesora graficznego).'
    }
};

/**
 * Retrieves the setting option explanation, dynamically resolving
 * current translations for title, category, and summary across all supported languages.
 */
export function getSettingOptionInfo(id: string): {
    id: string;
    icon: string;
    title: string;
    category: string;
    kbd?: string;
    summary: string;
    overview: string;
    science: string;
    tip: string;
} | undefined {
    const raw = SETTING_OPTIONS_INFO[id];
    if (!raw) return undefined;

    const currentLang = (i18n.currentLanguage || 'en') as SupportedLanguage;

    const title = (raw.titleKey ? i18n.t(raw.titleKey) : '') || raw.fallbackTitle;
    const category = (raw.categoryKey ? i18n.t(raw.categoryKey) : '') || raw.fallbackCategory;

    const langSummaries = SETTING_SUMMARIES[currentLang] || SETTING_SUMMARIES.en;
    const summary = langSummaries[id] || SETTING_SUMMARIES.en[id] || raw.summary;

    return {
        id: raw.id,
        icon: raw.icon,
        title,
        category,
        kbd: raw.kbd,
        summary,
        overview: raw.overview,
        science: raw.science,
        tip: raw.tip
    };
}
