/**
 * SettingOptionsData.ts
 * Detailed astronomical, scientific, and observational explanations
 * for every configuration toggle and instrument in the Observatory Command settings.
 */

import { i18n } from '../i18n';

export interface SettingOptionInfo {
    id: string;
    icon: string;
    titleKey: string;
    fallbackTitle: string;
    categoryKey: string;
    fallbackCategory: string;
    kbd?: string;
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
        titleKey: 'controls.pause',
        fallbackTitle: 'Pause / Resume Simulation',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        kbd: 'Space',
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
        overview: 'Smooth variable scrubber controlling the continuous forward velocity of simulation time.',
        science: 'Adjusts the delta-time multiplier passed into Keplerian orbital integration functions and axial rotation matrix transforms during every frame of the render loop.',
        tip: 'Use the [ and ] keys on your keyboard for fine step increments (0.005 day/s per tap) without opening the drawer.'
    },
    jumpToDate: {
        id: 'jumpToDate',
        icon: '📅',
        titleKey: 'datepicker.historicalEvents',
        fallbackTitle: 'Date & Historical Ephemeris',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
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
        overview: 'Displays a live holographic radar display in the lower-right viewport, tracking celestial bodies, spacecraft, and camera sweep.',
        science: 'Modeled after deep-space tracking station displays, projecting 3D heliocentric positions onto a polar range display with logarithmic distance rings from 1 AU to 40 AU.',
        tip: 'Click on celestial blips directly on the radar screen to instantly focus and lock your camera onto those distant worlds.'
    },
    telemetry: {
        id: 'telemetry',
        icon: '⚡',
        titleKey: 'controls.telemetry',
        fallbackTitle: 'Engine Telemetry HUD',
        categoryKey: 'controls.tabs.system',
        fallbackCategory: 'System Instrument',
        kbd: 'P',
        overview: 'Displays real-time technical graphics performance metrics in the lower-left viewport, including FPS, frame render time (ms), WebGL draw calls, geometry triangles, and GPU texture memory.',
        science: 'Provides crucial diagnostics for monitoring three.js WebGL rendering pipeline health, frame pacing, shader efficiency, and memory consumption.',
        tip: 'Press P to toggle telemetry and monitor how complex effects like bloom or particle fields affect your device’s GPU frame rate.'
    }
};

/**
 * Retrieves the setting option explanation, dynamically resolving
 * current translations for title and category while providing rich fallbacks.
 */
export function getSettingOptionInfo(id: string): {
    id: string;
    icon: string;
    title: string;
    category: string;
    kbd?: string;
    overview: string;
    science: string;
    tip: string;
} | undefined {
    const raw = SETTING_OPTIONS_INFO[id];
    if (!raw) return undefined;

    const title = i18n.t(raw.titleKey) || raw.fallbackTitle;
    const category = i18n.t(raw.categoryKey) || raw.fallbackCategory;

    return {
        id: raw.id,
        icon: raw.icon,
        title,
        category,
        kbd: raw.kbd,
        overview: raw.overview,
        science: raw.science,
        tip: raw.tip
    };
}
