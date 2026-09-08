import { describe, it, expect, beforeEach } from 'vitest';
import { i18n, TranslationSchema } from '../../i18n/index';

describe('I18n System', () => {
    beforeEach(() => {
        i18n.setLanguage('en');
    });

    it('should support all 6 mandated languages', () => {
        const locales = i18n.getAvailableLocales();
        const codes = locales.map(l => l.code);
        expect(codes).toContain('en');
        expect(codes).toContain('id');
        expect(codes).toContain('bs');
        expect(codes).toContain('de');
        expect(codes).toContain('pl');
        expect(codes).toContain('sr');
        expect(locales.length).toBe(6);
    });

    it('should switch languages and notify listeners', () => {
        let notifiedLang = '';
        const unsub = i18n.onLanguageChange((lang) => {
            notifiedLang = lang;
        });

        i18n.setLanguage('bs');
        expect(i18n.currentLanguage).toBe('bs');
        expect(notifiedLang).toBe('bs');

        unsub();
        i18n.setLanguage('de');
        expect(i18n.currentLanguage).toBe('de');
        expect(notifiedLang).toBe('bs'); // Unsubscribed, should not update
    });

    it('should translate UI strings and categories across languages', () => {
        i18n.setLanguage('en');
        expect(i18n.t('categories.planet')).toBe('🪐 Planets');

        i18n.setLanguage('id');
        expect(i18n.t('categories.planet')).toBe('🪐 Planet');

        i18n.setLanguage('bs');
        expect(i18n.t('categories.planet')).toBe('🪐 Planete');

        i18n.setLanguage('de');
        expect(i18n.t('categories.planet')).toBe('🪐 Planeten');

        i18n.setLanguage('pl');
        expect(i18n.t('categories.planet')).toBe('🪐 Planety');

        i18n.setLanguage('sr');
        expect(i18n.t('categories.planet')).toBe('🪐 Планете');
    });

    it('should support parameter interpolation', () => {
        i18n.setLanguage('en');
        expect(i18n.t('ui.orbiting', { planet: 'Earth' })).toBe('(orbiting Earth)');

        i18n.setLanguage('id');
        expect(i18n.t('ui.orbiting', { planet: 'Bumi' })).toBe('(mengorbit Bumi)');

        i18n.setLanguage('bs');
        expect(i18n.t('ui.orbiting', { planet: 'Zemlja' })).toBe('(orbitira oko: Zemlja)');
    });

    it('should resolve body names and descriptions via helpers', () => {
        i18n.setLanguage('en');
        expect(i18n.getBodyName('Earth')).toBe('Earth');
        expect(i18n.getBodyDescription('Earth')).toContain('third planet from the Sun');

        i18n.setLanguage('bs');
        expect(i18n.getBodyName('Earth')).toBe('Zemlja');
        expect(i18n.getBodyDescription('Earth')).toContain('treća planeta od Sunca');

        i18n.setLanguage('id');
        expect(i18n.getBodyName('Earth')).toBe('Bumi');

        i18n.setLanguage('sr');
        expect(i18n.getBodyName('Earth')).toBe('Земља');

        i18n.setLanguage('de');
        expect(i18n.getBodyName('Earth')).toBe('Erde');

        i18n.setLanguage('pl');
        expect(i18n.getBodyName('Earth')).toBe('Ziemia');
    });

    it('should resolve localized month names', () => {
        i18n.setLanguage('en');
        const monthsEn = i18n.getMonths();
        expect(monthsEn[0]).toBe('January');

        i18n.setLanguage('bs');
        const monthsBs = i18n.getMonths();
        expect(monthsBs[0]).toBe('Januar');

        i18n.setLanguage('de');
        const monthsDe = i18n.getMonths();
        expect(monthsDe[0]).toBe('Januar');
        expect(monthsDe[9]).toBe('Oktober');

        i18n.setLanguage('pl');
        const monthsPl = i18n.getMonths();
        expect(monthsPl[0]).toBe('Styczeń');

        i18n.setLanguage('sr');
        const monthsSr = i18n.getMonths();
        expect(monthsSr[0]).toBe('Јануар');
    });

    it('should fallback to English for missing keys in other languages', () => {
        i18n.setLanguage('de');
        // Both German and English define simDate, but test fallback behavior logic
        const simDate = i18n.t('ui.simDate');
        expect(simDate).toBeTruthy();

        // Should return key path if missing in English too
        expect(i18n.t('nonexistent.nested.key')).toBe('nonexistent.nested.key');
    });

    it('should be extensible with new languages via registerLocale', () => {
        const dummyTranslations: TranslationSchema = {
            ui: {
                simDate: '⏱ DATE SIM:',
                radarToggle: 'Radar',
                controlsToggle: 'Contrôles',
                languageToggle: 'Langue',
                orbiting: '(en orbite autour de {planet})',
                jumpToDate: 'Aller à la date ({date})',
                close: 'Fermer',
                help: 'Aide'
            },
            categories: {
                star: '🌟 Étoiles',
                planet: '🪐 Planètes',
                moon: '🌕 Lunes',
                constellation: '🌌 Constellations',
                comet: '☄️ Comètes',
                spacecraft: '🛰️ Vaisseaux'
            },
            controls: {
                simulationFolder: 'Simulation',
                environmentFolder: 'Environnement',
                cameraFolder: 'Caméra',
                toolsFolder: 'Outils',
                realisticScale: 'Échelle réelle',
                showMinimap: 'Afficher la minicarte',
                timeSpeed: 'Vitesse',
                speedPreset: 'Préréglage de vitesse',
                speedPresets: {
                    realTime: 'Temps réel (1:1)',
                    oneHourPerSec: '1 heure / sec',
                    oneDayPerSec: '1 jour / sec (Réaliste)',
                    oneWeekPerSec: '1 semaine / sec',
                    oneMonthPerSec: '1 mois / sec',
                    paused: 'En pause',
                    custom: 'Personnalisé'
                },
                pause: 'Pause',
                resume: 'Reprendre',
                showOrbits: 'Afficher les orbites',
                showMoons: 'Afficher les lunes',
                showAsteroids: 'Afficher les astéroïdes',
                showKuiperBelt: 'Ceinture de Kuiper',
                showDwarfPlanets: 'Planètes naines',
                showComets: 'Comètes',
                showSpacecraft: 'Vaisseaux',
                showMeteors: 'Météores',
                showTrails: 'Traînées',
                habitableZone: 'Zone habitable',
                eclipticGrid: 'Grille écliptique',
                enableBloom: 'Activer le bloom',
                realisticLighting: 'Éclairage réaliste',
                showAxes: 'Afficher les axes',
                attachCamera: 'Attacher la caméra',
                viewFromSurface: 'Vue de la surface',
                freeCamera: 'Caméra libre',
                measureDistance: 'Mesurer la distance',
                cinematicTour: 'Visite guidée',
                tourSpeed: 'Vitesse de visite',
                tooltips: {
                    pauseResume: '',
                    speedPreset: '',
                    timeSpeed: '',
                    realisticScale: '',
                    showTrails: '',
                    habitableZone: '',
                    eclipticGrid: '',
                    enableBloom: '',
                    realisticLighting: '',
                    showAxes: '',
                    measureDistance: ''
                }
            },
            modal: {
                badges: {
                    celestialBody: 'CORPS CÉLESTE',
                    missionDossier: 'DOSSIER DE MISSION',
                    cometTelemetry: 'TÉLÉMÉTRIE DE COMÈTE',
                    constellation: 'CONSTELLATION',
                    stellarDossier: 'DOSSIER STELLAIRE',
                    lunarTelemetry: 'TÉLÉMÉTRIE LUNAIRE',
                    stellarCore: 'CŒUR STELLAIRE',
                    planetaryDossier: 'DOSSIER PLANÉTAIRE'
                },
                labels: {
                    type: 'Type',
                    spacecraftType: 'Vaisseau spatial',
                    rightAsc: 'Ascension droite',
                    declination: 'Déclinaison',
                    radius: 'Rayon',
                    semiMajorAxis: 'Demi-grand axe',
                    eccentricity: 'Excentricité',
                    period: 'Période',
                    distance: 'Distance',
                    axialTilt: 'Inclinaison axiale',
                    stars: 'Étoiles',
                    brightest: 'Plus brillante',
                    area: 'Surface',
                    family: 'Famille'
                },
                tooltipTitles: {
                    spacecraft: '',
                    rightAsc: '',
                    declination: '',
                    radius: '',
                    semiMajorAxis: '',
                    eccentricity: '',
                    period: '',
                    distance: '',
                    axialTilt: '',
                    stars: '',
                    brightest: '',
                    area: '',
                    family: ''
                },
                tooltips: {
                    spacecraft: '',
                    rightAsc: '',
                    declination: '',
                    radiusEarth: '',
                    semiMajorAxis: '',
                    eccentricity: '',
                    cometPeriod: '',
                    distSun: '',
                    distPlanet: '',
                    orbitSun: '',
                    orbitPlanet: '',
                    axialTilt: '',
                    constellationStars: '',
                    brightestStar: '',
                    constellationArea: '',
                    constellationFamily: ''
                },
                periodUnits: { year: 'an', month: 'm', day: 'j' },
                resourcesHeader: 'Télémesure & Ressources',
                noDescription: 'Aucune description.',
                audioGuide: 'Écouter',
                audioPlaying: 'Lecture en cours...'
            },
            datepicker: {
                months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
                weekdays: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
                bc: 'av. J.-C.',
                ad: 'ap. J.-C.',
                century: 'Siècle',
                decade: 'Décennie',
                year: 'Année'
            },
            popups: {
                trueScaleTitle: 'Vraie échelle',
                trueScaleDesc: 'Description...',
                meteorsTitle: 'Météores',
                meteorsDesc: 'Description...'
            },
            bodies: {
                Earth: { name: 'Terre', description: 'Notre planète bleue.' }
            },
            spacecraft: {},
            comets: {},
            constellations: {},
            stars: {}
        };

        i18n.registerLocale('fr', { code: 'fr', label: 'French', nativeName: 'Français', flag: '🇫🇷' }, dummyTranslations);

        expect(i18n.getAvailableLocales().some(l => l.code === 'fr')).toBe(true);

        i18n.setLanguage('fr');
        expect(i18n.currentLanguage).toBe('fr');
        expect(i18n.t('categories.planet')).toBe('🪐 Planètes');
        expect(i18n.getBodyName('Earth')).toBe('Terre');
        expect(i18n.getBodyDescription('Earth')).toBe('Notre planète bleue.');
    });
});
