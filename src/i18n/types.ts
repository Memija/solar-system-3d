export type SupportedLanguage = 'en' | 'id' | 'bs' | 'de' | 'pl' | 'sr';

export interface LocaleInfo {
    code: SupportedLanguage | string;
    label: string;
    nativeName: string;
    flag: string;
}

export interface ItemTranslation {
    name: string;
    description: string;
    family?: string;
}

export interface TranslationSchema {
    ui: {
        simDate: string;
        radarToggle: string;
        controlsToggle: string;
        languageToggle: string;
        orbiting: string; // e.g. "(orbiting {planet})"
        jumpToDate: string; // e.g. "Jump to Active Date ({date})"
        close: string;
        help: string;
    };
    categories: {
        star: string;
        planet: string;
        moon: string;
        constellation: string;
        comet: string;
        spacecraft: string;
    };
    controls: {
        simulationFolder: string;
        environmentFolder: string;
        cameraFolder: string;
        toolsFolder: string;
        realisticScale: string;
        showMinimap: string;
        timeSpeed: string;
        speedPreset: string;
        speedPresets: {
            realTime: string;
            oneHourPerSec: string;
            oneDayPerSec: string;
            oneWeekPerSec: string;
            oneMonthPerSec: string;
            paused: string;
            custom: string;
        };
        pause: string;
        resume: string;
        showOrbits: string;
        showMoons: string;
        showAsteroids: string;
        showKuiperBelt: string;
        showDwarfPlanets: string;
        showComets: string;
        showSpacecraft: string;
        showMeteors: string;
        showTrails: string;
        habitableZone: string;
        eclipticGrid: string;
        enableBloom: string;
        realisticLighting: string;
        showAxes: string;
        attachCamera: string;
        viewFromSurface: string;
        freeCamera: string;
        measureDistance: string;
        cinematicTour: string;
        tourSpeed: string;
        tooltips: {
            pauseResume: string;
            speedPreset: string;
            timeSpeed: string;
            realisticScale: string;
            showTrails: string;
            habitableZone: string;
            eclipticGrid: string;
            enableBloom: string;
            realisticLighting: string;
            showAxes: string;
            measureDistance: string;
        };
    };
    modal: {
        badges: {
            celestialBody: string;
            missionDossier: string;
            cometTelemetry: string;
            constellation: string;
            stellarDossier: string;
            lunarTelemetry: string;
            stellarCore: string;
            planetaryDossier: string;
        };
        labels: {
            type: string;
            radius: string;
            distance: string;
            period: string;
            axialTilt: string;
            semiMajorAxis: string;
            eccentricity: string;
            rightAsc: string;
            declination: string;
            stars: string;
            brightest: string;
            area: string;
            family: string;
            spacecraftType: string;
        };
        tooltipTitles: {
            spacecraft: string;
            rightAsc: string;
            declination: string;
            radius: string;
            distance: string;
            semiMajorAxis: string;
            eccentricity: string;
            period: string;
            axialTilt: string;
            stars: string;
            brightest: string;
            area: string;
            family: string;
        };
        tooltips: {
            spacecraft: string;
            rightAsc: string;
            declination: string;
            radiusEarth: string;
            distSun: string;
            distPlanet: string;
            orbitSun: string;
            orbitPlanet: string;
            axialTilt: string;
            semiMajorAxis: string;
            eccentricity: string;
            cometPeriod: string;
            constellationStars: string;
            brightestStar: string;
            constellationArea: string;
            constellationFamily: string;
        };
        resourcesHeader: string;
        noDescription: string;
        audioGuide: string;
        audioPlaying: string;
        periodUnits: {
            year: string;
            month: string;
            day: string;
        };
    };
    popups: {
        trueScaleTitle: string;
        trueScaleDesc: string;
        meteorsTitle: string;
        meteorsDesc: string;
    };
    datepicker: {
        months: string[];
        weekdays: string[];
        bc: string;
        ad: string;
        century: string;
        decade: string;
        year: string;
    };
    bodies: Record<string, ItemTranslation>;
    spacecraft: Record<string, ItemTranslation>;
    comets: Record<string, ItemTranslation>;
    constellations: Record<string, ItemTranslation>;
    stars: Record<string, ItemTranslation>;
}
