/**
 * SettingOptionsData.ts
 * Concise localized astronomical explanations for every configuration toggle
 * and instrument in the Observatory Command settings.
 */

import { i18n, SupportedLanguage } from '../i18n';
import { svgIcon, SvgIconName } from './SvgIcons';

export interface SettingOptionInfo {
    id: string;
    iconName: SvgIconName;
    titleKey: string;
    fallbackTitle: string;
    categoryKey: string;
    fallbackCategory: string;
    kbd?: string;
    summary: string;
}

export const SETTING_OPTIONS_INFO: Record<string, SettingOptionInfo> = {
    celestialNav: {
        id: 'celestialNav',
        iconName: 'camera',
        titleKey: 'controls.sections.celestialNav',
        fallbackTitle: 'Celestial Target Navigation',
        categoryKey: 'controls.tabs.target',
        fallbackCategory: 'Target Ephemeris',
        summary: 'Target, track, and align the camera to planets, moons, and spacecraft with JPL ephemerides.'
    },
    pauseResume: {
        id: 'pauseResume',
        iconName: 'pause',
        titleKey: 'controls.sections.simulationState',
        fallbackTitle: 'Simulation State',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        kbd: 'Space',
        summary: 'Freezes simulation time across the solar system to inspect exact planetary alignments.'
    },
    speedPresets: {
        id: 'speedPresets',
        iconName: 'telemetry',
        titleKey: 'controls.speedPreset',
        fallbackTitle: 'Astronomical Speed Presets',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        summary: 'Calibrated time-warp presets from 1:1 real-time up to 1 month per second.'
    },
    timeSpeed: {
        id: 'timeSpeed',
        iconName: 'time',
        titleKey: 'controls.timeSpeed',
        fallbackTitle: 'Simulation Time Speed',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        kbd: '[ / ]',
        summary: 'Adjust forward simulation speed smoothly in fine 0.005 day/s increments.'
    },
    jumpToDate: {
        id: 'jumpToDate',
        iconName: 'calendar',
        titleKey: 'ui.simDate',
        fallbackTitle: 'Observation Date',
        categoryKey: 'controls.tabs.time',
        fallbackCategory: 'Simulation Dynamics',
        summary: 'Calculate authentic planetary coordinates for any historical or future date across millennia.'
    },
    showOrbits: {
        id: 'showOrbits',
        iconName: 'orbits',
        titleKey: 'controls.showOrbits',
        fallbackTitle: 'Planetary & Celestial Orbits',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'O',
        summary: 'Toggles elliptical Keplerian orbital trajectory paths for all celestial bodies.'
    },
    showMoons: {
        id: 'showMoons',
        iconName: 'moons',
        titleKey: 'controls.showMoons',
        fallbackTitle: 'Natural Satellites & Moons',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'N',
        summary: 'Displays 3D models and orbital positions for natural satellites orbiting host worlds.'
    },
    showConstellations: {
        id: 'showConstellations',
        iconName: 'constellations',
        titleKey: 'controls.showConstellations',
        fallbackTitle: 'Constellations',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'C',
        summary: 'Displays classical celestial constellations and stellar asterism lines on the night sky sphere.'
    },
    showAsteroids: {
        id: 'showAsteroids',
        iconName: 'asteroids',
        titleKey: 'controls.showAsteroids',
        fallbackTitle: 'Main Asteroid Belt',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'E',
        summary: 'Renders the main asteroid belt between Mars and Jupiter with Kirkwood gaps.'
    },
    showKuiperBelt: {
        id: 'showKuiperBelt',
        iconName: 'kuiper',
        titleKey: 'controls.showKuiperBelt',
        fallbackTitle: 'Kuiper Belt',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'U',
        summary: 'Visualizes the outer disc of icy bodies, dwarf planets, and comets extending past Neptune.'
    },
    showDwarfPlanets: {
        id: 'showDwarfPlanets',
        iconName: 'dwarf',
        titleKey: 'controls.showDwarfPlanets',
        fallbackTitle: 'Dwarf Planets',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'W',
        summary: 'Toggles dwarf planets including Ceres, Pluto, Eris, Haumea, and Makemake.'
    },
    showComets: {
        id: 'showComets',
        iconName: 'comets',
        titleKey: 'controls.showComets',
        fallbackTitle: 'Comets & Ion Tails',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'Q',
        summary: 'Renders periodic comets with dynamic solar-wind ion and dust tails.'
    },
    showSpacecraft: {
        id: 'showSpacecraft',
        iconName: 'spacecraft',
        titleKey: 'controls.showSpacecraft',
        fallbackTitle: 'Interplanetary Spacecraft',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'J',
        summary: 'Visualizes historic explorer trajectories including Voyager 1, Cassini, and New Horizons.'
    },
    showMeteors: {
        id: 'showMeteors',
        iconName: 'meteors',
        titleKey: 'controls.showMeteors',
        fallbackTitle: 'Near-Earth Meteor Showers',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'Y',
        summary: "Renders atmospheric shooting star radiants streaking across Earth's upper atmosphere."
    },
    showTrails: {
        id: 'showTrails',
        iconName: 'trails',
        titleKey: 'controls.showTrails',
        fallbackTitle: 'Orbital Motion Trails',
        categoryKey: 'controls.tabs.layers',
        fallbackCategory: 'Celestial Layer',
        kbd: 'I',
        summary: 'Draws dynamic velocity trails behind moving worlds highlighting orbital speed differentials.'
    },
    orbitFocus: {
        id: 'orbitFocus',
        iconName: 'attach-camera',
        titleKey: 'controls.sections.orbitFocus',
        fallbackTitle: 'Orbit Focus Perspective',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        kbd: 'A',
        summary: 'Locks camera tracking onto the target body while allowing full 3D orbital inspection.'
    },
    surfaceView: {
        id: 'surfaceView',
        iconName: 'surface-view',
        titleKey: 'controls.sections.surfaceView',
        fallbackTitle: 'Surface View Horizon',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        kbd: 'V',
        summary: 'Places the observer on the equator of the target world looking outward at the horizon.'
    },
    freeCamera: {
        id: 'freeCamera',
        iconName: 'free-camera',
        titleKey: 'controls.sections.freeCam',
        fallbackTitle: 'Free Camera / Inertial Flight',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        kbd: 'D',
        summary: 'Detaches the camera for unconstrained six-degrees-of-freedom flight across space.'
    },
    cinematicTour: {
        id: 'cinematicTour',
        iconName: 'cinematic-tour',
        titleKey: 'controls.cinematicTour',
        fallbackTitle: 'Autonomous Grand Tour',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        kbd: 'T',
        summary: 'Automated cinematic tour visiting solar system highlights sequentially with smooth flybys.'
    },
    tourSpeed: {
        id: 'tourSpeed',
        iconName: 'time',
        titleKey: 'controls.tourSpeed',
        fallbackTitle: 'Tour Dwell Interval',
        categoryKey: 'controls.tabs.camera',
        fallbackCategory: 'Camera Perspective',
        summary: 'Adjusts the dwell duration spent orbiting each celestial body during the grand tour.'
    },
    realisticDistances: {
        id: 'realisticDistances',
        iconName: 'scale',
        titleKey: 'controls.realisticScale',
        fallbackTitle: 'Realistic Distances / True Scale',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'R',
        summary: 'Switches between artistic viewable spacing and true 1:1 astronomical physical scale.'
    },
    showHabitableZone: {
        id: 'showHabitableZone',
        iconName: 'habitable',
        titleKey: 'controls.habitableZone',
        fallbackTitle: 'Circumstellar Habitable Zone',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'Z',
        summary: 'Visualizes the circumstellar Goldilocks zone where liquid water can exist on planets.'
    },
    showEclipticGrid: {
        id: 'showEclipticGrid',
        iconName: 'grid',
        titleKey: 'controls.eclipticGrid',
        fallbackTitle: 'Ecliptic Plane Grid',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'G',
        summary: "Displays the fundamental reference plane defined by Earth's orbital plane around the Sun."
    },
    enableBloom: {
        id: 'enableBloom',
        iconName: 'bloom',
        titleKey: 'controls.enableBloom',
        fallbackTitle: 'HDR Bloom Glow Effect',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'B',
        summary: 'Toggles HDR atmospheric glow, solar flare radiance, and emissive surface bloom.'
    },
    realisticLighting: {
        id: 'realisticLighting',
        iconName: 'lighting',
        titleKey: 'controls.realisticLighting',
        fallbackTitle: 'Realistic Deep Space Lighting',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'L',
        summary: 'Simulates true inverse-square solar radiation falloff with realistic planetary shadows.'
    },
    showAxes: {
        id: 'showAxes',
        iconName: 'axes',
        titleKey: 'controls.showAxes',
        fallbackTitle: 'Coordinate Barycenter Axes',
        categoryKey: 'controls.tabs.optics',
        fallbackCategory: 'Optics & Scale',
        kbd: 'X',
        summary: 'Overlays 3D Cartesian coordinate axes (X: Red, Y: Green, Z: Blue) centered on the Sun.'
    },
    minimap: {
        id: 'minimap',
        iconName: 'minimap',
        titleKey: 'controls.showMinimap',
        fallbackTitle: 'Tactical Radar Minimap',
        categoryKey: 'controls.tabs.system',
        fallbackCategory: 'System Instrument',
        kbd: 'M',
        summary: 'Toggles the top-down tactical radar display in the lower-right corner showing nearby bodies.'
    },
    telemetry: {
        id: 'telemetry',
        iconName: 'telemetry',
        titleKey: 'ui.telemetry',
        fallbackTitle: 'Engine Telemetry HUD',
        categoryKey: 'controls.tabs.system',
        fallbackCategory: 'System Instrument',
        kbd: 'P',
        summary: 'Displays real-time graphics performance metrics including FPS (Frames Per Second), draw calls, and GPU (Graphics Processing Unit) load.'
    }
};

export const SETTING_SUMMARIES: Record<SupportedLanguage, Record<string, string>> = {
    en: {
        celestialNav: 'Target, track, and align the camera to planets, moons, and spacecraft with JPL ephemerides.',
        pauseResume: 'Freezes simulation time across the solar system to inspect exact planetary alignments.',
        speedPresets: 'Calibrated time-warp presets from 1:1 real-time up to 1 month per second.',
        timeSpeed: 'Adjust forward simulation speed smoothly in fine 0.005 day/s increments.',
        jumpToDate: 'Calculate authentic planetary coordinates for any historical or future date across millennia.',
        showOrbits: 'Toggles elliptical Keplerian orbital trajectory paths for all celestial bodies.',
        showMoons: 'Displays 3D models and orbital positions for natural satellites orbiting host worlds.',
        showConstellations: 'Displays classical celestial constellations and stellar asterism lines on the night sky sphere.',
        showAsteroids: 'Renders the main asteroid belt between Mars and Jupiter with Kirkwood gaps.',
        showKuiperBelt: 'Visualizes the outer disc of icy bodies, dwarf planets, and comets extending past Neptune.',
        showDwarfPlanets: 'Toggles dwarf planets including Ceres, Pluto, Eris, Haumea, and Makemake.',
        showComets: 'Renders periodic comets with dynamic solar-wind ion and dust tails.',
        showSpacecraft: 'Visualizes historic explorer trajectories including Voyager 1, Cassini, and New Horizons.',
        showMeteors: "Renders atmospheric shooting star radiants streaking across Earth's upper atmosphere.",
        showTrails: 'Draws dynamic velocity trails behind moving worlds highlighting orbital speed differentials.',
        orbitFocus: 'Locks camera tracking onto the target body while allowing full 3D orbital inspection.',
        surfaceView: 'Places the observer on the equator of the target world looking outward at the horizon.',
        freeCamera: 'Detaches the camera for unconstrained six-degrees-of-freedom flight across space.',
        cinematicTour: 'Automated cinematic tour visiting solar system highlights sequentially with smooth flybys.',
        tourSpeed: 'Adjusts the dwell duration spent orbiting each celestial body during the grand tour.',
        realisticDistances: 'Switches between artistic viewable spacing and true 1:1 astronomical physical scale.',
        showHabitableZone: 'Visualizes the circumstellar Goldilocks zone where liquid water can exist on planets.',
        showEclipticGrid: "Displays the fundamental reference plane defined by Earth's orbital plane around the Sun.",
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
        showConstellations: 'Prikazuje klasična zvjezdana sazviježđa i linije asterizama na nebeskoj sferi.',
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
        minimap: 'Prikazuje taktički radarski ekran u donjem desnom uglu sa prikazom obližnjih tijela.',
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
        showConstellations: 'Приказује класична сазвежђа и линије астеризама на небеској сфери.',
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
        showConstellations: 'Blendet klassische Sternbilder und Verbindungslinien auf der Himmelskugel ein.',
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
        showConstellations: 'Menampilkan rasi bintang klasik dan garis asterisme di bola langit malam.',
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
        showConstellations: 'Wyświetla klasyczne gwiazdozbiory i linie asteryzmów na sferze niebieskiej.',
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

export function getSettingOptionInfo(id: string): {
    id: string;
    icon: string;
    title: string;
    category: string;
    kbd?: string;
    summary: string;
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
        icon: svgIcon(raw.iconName, 'obs-svg-icon tooltip-svg-icon'),
        title,
        category,
        kbd: raw.kbd,
        summary
    };
}
