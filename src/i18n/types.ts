export type SupportedLanguage = 'en' | 'id' | 'bs' | 'de' | 'pl' | 'sr';

export interface LocaleInfo {
    code: SupportedLanguage | string;
    label: string;
    nativeName: string;
    flag: string;
    flagFile?: string;
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
        audioAmbience: string;
        audioAmbienceAria: string;
        telemetry: string;
        telemetryAria: string;
        keyboardShortcuts: string;
        keyboardShortcutsAria: string;
        astrophotography: string;
        astrophotographyAria: string;
        speedPause: string;
        utcTime: string;
        liveRealTime: string;
        controls?: string;
        targetPillTitle?: string;
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
        drawerTitle?: string;
        drawerSubtitle?: string;
        tabs?: {
            target: string;
            time: string;
            layers: string;
            camera: string;
            optics: string;
            system: string;
        };
        sections?: {
            celestialNav: string;
            quickTargets: string;
            focusAlign: string;
            viewSurface: string;
            simulationSpeed: string;
            entitiesTrails: string;
            cameraPerspective: string;
            orbitFocus: string;
            surfaceView: string;
            freeCam: string;
            autonomousTour: string;
            opticsScale: string;
            observatoryInstruments: string;
            languageLocalization: string;
            captureSnapshot: string;
            enableAudio: string;
            muteAudio: string;
            shortcutsGuide: string;
            pauseSimulation: string;
            resumeSimulation: string;
            measureTool?: string;
        };
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
        measureTool?: string;
        measureMode?: string;
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
            cometRadius: string;
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
        audioGuideTitle: string;
        audioGuideStop: string;
        audioGuideAria: string;
        audioGuidePlayingAria: string;
        prevImageAria: string;
        nextImageAria: string;
        periodUnits: {
            year: string;
            month: string;
            day: string;
        };
    };
    shortcuts: {
        title: string;
        navTitle: string;
        mercuryToNeptune: string;
        pluto: string;
        sun: string;
        resetView: string;
        timeTitle: string;
        pauseResume: string;
        warpSpeed: string;
        cinematicTour: string;
        toolsTitle: string;
        orbits: string;
        minimap: string;
        constellations: string;
        audio: string;
        telemetry: string;
        snapshot: string;
        fullscreen: string;
        help: string;
        esc: string;
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
        historicalEvents: string;
    };
    loading: {
        boot: string;
        subtitle: string;
        core: string;
        ephemerides: string;
        surfaces: string;
        controls: string;
        acquiring: string;
        calibrating: string;
        streaming: string;
        synchronizing: string;
        loaded: string;
        ready: string;
        standby: string;
        connecting: string;
        assets: string;
        online: string;
        tagBoot: string;
        tagCalibrating: string;
        tagSynthesizing: string;
        tagConfiguring: string;
    };

    measurement?: {
        distLabel: string;
        unitAU: string;
        unitMkm: string;
        selectFirstPrompt: string;
        selectSecondPrompt: string;
        measuredDistancePrompt: string;
        clear: string;
        close: string;
    };

    bodies: Record<string, ItemTranslation>;
    spacecraft: Record<string, ItemTranslation>;
    comets: Record<string, ItemTranslation>;
    constellations: Record<string, ItemTranslation>;
    stars: Record<string, ItemTranslation>;
}
