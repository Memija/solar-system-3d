import { TranslationSchema } from '../types';

export const de: TranslationSchema = {
    ui: {
        simDate: '⏱ SIM-DATUM:',
        radarToggle: 'Minimap-Radar umschalten (M)',
        controlsToggle: 'Simulationssteuerung umschalten',
        languageToggle: 'Sprache ändern',
        orbiting: '(umkreist {planet})',
        jumpToDate: 'Zum aktiven Datum springen ({date})',
        close: 'Schließen',
        help: 'Hilfe'
    },
    categories: {
        star: '🌟 Sterne',
        planet: '🪐 Planeten',
        moon: '🌕 Monde',
        constellation: '🌌 Sternbilder',
        comet: '☄️ Kometen',
        spacecraft: '🛰️ Raumfahrzeuge'
    },
    controls: {
        simulationFolder: 'Simulation',
        environmentFolder: 'Umgebung',
        cameraFolder: 'Kamerasteuerung',
        toolsFolder: 'Werkzeuge',
        realisticScale: 'Reale Maßstäbe',
        showMinimap: 'Minimap anzeigen',
        timeSpeed: 'Zeitgeschwindigkeit',
        speedPreset: 'Geschwindigkeit',
        speedPresets: {
            realTime: 'Echtzeit (1:1)',
            oneHourPerSec: '1 Std. / Sek.',
            oneDayPerSec: '1 Tag / Sek. (Realistisch)',
            oneWeekPerSec: '1 Woche / Sek.',
            oneMonthPerSec: '1 Monat / Sek.',
            paused: 'Pausiert',
            custom: 'Benutzerdefiniert'
        },
        pause: 'Pause',
        resume: 'Fortsetzen',
        showOrbits: 'Umlaufbahnen anzeigen',
        showMoons: 'Monde anzeigen',
        showAsteroids: 'Asteroiden anzeigen',
        showKuiperBelt: 'Kuipergürtel anzeigen',
        showDwarfPlanets: 'Zwergplaneten anzeigen',
        showComets: 'Kometen anzeigen',
        showSpacecraft: 'Raumfahrzeuge anzeigen',
        showMeteors: 'Meteore anzeigen',
        showTrails: 'Bahnspuren anzeigen',
        habitableZone: 'Habitable Zone',
        eclipticGrid: 'Ekliptik-Gitter',
        enableBloom: 'Lichtglanz (Bloom) aktivieren',
        realisticLighting: 'Realistische Beleuchtung',
        showAxes: 'Achsen anzeigen',
        attachCamera: 'Kamera anheften',
        viewFromSurface: 'Ansicht von der Oberfläche',
        freeCamera: 'Freie Kamera',
        measureDistance: 'Distanz messen',
        cinematicTour: 'Kino-Tour',
        tourSpeed: 'Tour-Geschwindigkeit',
        tooltips: {
            pauseResume: 'Klicken, um die Simulationszeit anzuhalten oder fortzusetzen (Leertaste).',
            speedPreset: 'Wählen Sie realistische astronomische Zeitgeschwindigkeiten oder benutzerdefinierte Werte.',
            timeSpeed: 'Passen Sie die Simulationszeit an. 1 Tag/Sek ist die kalibrierte realistische Beobachtungsgeschwindigkeit.',
            realisticScale: 'Schaltet auf realistische Bahnradien um und skaliert Himmelskörper proportional zu den enormen Entfernungen.',
            showTrails: 'Zeigt die Bahnen und Schweife hinter Himmelskörpern während ihrer Bewegung an.',
            habitableZone: 'Bereich um einen Stern, in dem flüssiges Wasser auf der Planetenoberfläche existieren kann.',
            eclipticGrid: 'Ein Koordinatengitter, das die Ebene der Erdbahn um die Sonne darstellt.',
            enableBloom: 'Ein visueller Effekt, der helle Lichtquellen und Sterne intensiv leuchten lässt.',
            realisticLighting: 'Nutzt physikbasiertes Rendering zur Simulation authentischer Lichtbrechung im Weltraum.',
            showAxes: 'Blendet die Koordinatenachsen X (Rot), Y (Grün) und Z (Blau) zur Raumorientierung ein.',
            measureDistance: 'Entfernungsmesser aktivieren und anschließend zwei Himmelskörper in der 3D-Szene anklicken, um die Distanz zu berechnen.'
        }
    },
    modal: {
        badges: {
            celestialBody: 'HIMMELSKÖRPER',
            missionDossier: 'MISSIONS-DOSSIER',
            cometTelemetry: 'KOMETEN-TELEMETRIE',
            constellation: 'STERNBILD',
            stellarDossier: 'STERN-DOSSIER',
            lunarTelemetry: 'MOND-TELEMETRIE',
            stellarCore: 'STERNENKERN',
            planetaryDossier: 'PLANETEN-DOSSIER'
        },
        labels: {
            type: 'Typ',
            radius: 'Radius',
            distance: 'Entfernung',
            period: 'Umlaufzeit',
            axialTilt: 'Achsenneigung',
            semiMajorAxis: 'Große Halbachse',
            eccentricity: 'Exzentrizität',
            rightAsc: 'Rektaszension',
            declination: 'Deklination',
            stars: 'Hauptsterne',
            brightest: 'Hellster Stern',
            area: 'Fläche',
            family: 'Gruppe',
            spacecraftType: 'Raumfahrzeug'
        },
        tooltipTitles: {
            spacecraft: 'Raumfahrzeug',
            rightAsc: 'Rektaszension (RA)',
            declination: 'Deklination (Dec)',
            radius: 'Radius',
            distance: 'Bahnradius',
            semiMajorAxis: 'Große Halbachse',
            eccentricity: 'Exzentrizität',
            period: 'Umlaufzeit',
            axialTilt: 'Achsenneigung',
            stars: 'Hauptsterne',
            brightest: 'Hellster Stern',
            area: 'Fläche',
            family: 'Sternbild-Familie'
        },
        tooltips: {
            spacecraft: 'Ein künstliches Raumfahrzeug zur Erforschung des Weltraums.',
            rightAsc: 'Himmelskoordinate analog zum Längengrad auf der Erde, gemessen in Sternstunden.',
            declination: 'Himmelskoordinate analog zum Breitengrad auf der Erde, gemessen nördlich (+) oder südlich (-) des Himmelsäquators.',
            radiusEarth: 'Radius des Himmelskörpers im Verhältnis zum Erdradius (R⊕).',
            distSun: 'Durchschnittliche Entfernung von der Sonne in Astronomischen Einheiten (AE).',
            distPlanet: 'Durchschnittlicher Abstand zum Mutterplaneten.',
            orbitSun: 'Benötigte Zeit für eine vollständige Umrundung der Sonne.',
            orbitPlanet: 'Benötigte Zeit für eine vollständige Umrundung des Heimatplaneten.',
            axialTilt: 'Winkel zwischen der Rotationsachse und der Bahnebene.',
            semiMajorAxis: 'Die halbe Länge des größten Durchmessers der elliptischen Umlaufbahn.',
            eccentricity: 'Abweichung der Umlaufbahn von einer Kreisform (0 entspricht einem perfekten Kreis).',
            cometPeriod: 'Benötigte Zeit des Kometen für einen Umlauf um die Sonne.',
            constellationStars: 'Sichtbare Hauptsterne, die das markante Sternenmuster bilden.',
            brightestStar: 'Der leuchtstärkste Stern innerhalb dieses Sternbildes.',
            constellationArea: 'Gesamter am Himmel überdeckter Bereich (in Quadratgrad).',
            constellationFamily: 'Astronomische Klassifizierung zusammengehöriger Sternbilder.'
        },
        resourcesHeader: 'Telemetrie & Ressourcen',
        noDescription: 'Keine detaillierte Beschreibung in den Telemetriedatenbanken hinterlegt.',
        audioGuide: 'Anhören',
        audioPlaying: 'Wiedergabe...',
        periodUnits: {
            year: 'J',
            month: 'M',
            day: 'T'
        }
    },
    popups: {
        trueScaleTitle: 'Echter Maßstab des Sonnensystems',
        trueScaleDesc: 'Sie betrachten das Sonnensystem nun im realen Maßstab. Die Planeten werden in ihren tatsächlichen Größen im Verhältnis zu den gewaltigen kosmischen Entfernungen gerendert. Da der Weltraum größtenteils leer ist, erscheinen Planeten im Vergleich zu ihren Umlaufbahnen wie winzige Punkte. Markierungen wurden aktiviert, um sie aufzufinden.',
        meteorsTitle: 'Meteore',
        meteorsDesc: 'Sie beobachten nun Meteore in Erdnähe. Ein Meteor ist ein Lichtstreifen am Nachthimmel, der entsteht, wenn ein Meteoroid mit enormer Geschwindigkeit in die Erdatmosphäre eintritt. Durch die Reibungshitze mit der Luft verglüht er und erzeugt die sichtbare Sternschnuppe.'
    },
    datepicker: {
        months: [
            'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
            'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
        ],
        weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
        bc: 'v. Chr.',
        ad: 'n. Chr.',
        century: 'Jahrhundert',
        decade: 'Jahrzehnt',
        year: 'Jahr'
    },
    bodies: {
        Sun: {
            name: 'Sonne',
            description: 'Die Sonne ist der Stern im Zentrum des Sonnensystems. Sie ist eine nahezu perfekte Kugel aus heißem Plasma, die durch Kernfusion von Wasserstoff zu Helium in ihrem Kern gewaltige Energiemengen in Form von Licht und Wärme abstrahlt.'
        },
        Mercury: {
            name: 'Merkur',
            description: 'Merkur ist der kleinste Planet im Sonnensystem und der sonnennächste. Für einen Sonnenumlauf benötigt er lediglich 87,97 Erdentage – die kürzeste Umlaufzeit aller Planeten.'
        },
        Venus: {
            name: 'Venus',
            description: 'Die Venus ist der zweite Planet von der Sonne. Sie besitzt die dichteste Atmosphäre aller terrestrischen Planeten, bestehend aus über 96 % Kohlendioxid, was einen extremen Treibhauseffekt mit 465 °C Oberflächentemperatur verursacht.'
        },
        Earth: {
            name: 'Erde',
            description: 'Die Erde ist der dritte Planet von der Sonne und der einzige bekannte Himmelskörper, der Leben beherbergt. Rund 71 % ihrer Oberfläche sind von flüssigem Wasser bedeckt.'
        },
        Moon: {
            name: 'Mond',
            description: 'Der Mond ist der einzige natürliche Satellit der Erde. Er ist der fünftgrößte Mond im Sonnensystem und stabilisiert mit seiner Gravitation die Erdachse.'
        },
        Mars: {
            name: 'Mars',
            description: 'Der Mars ist der vierte Planet von der Sonne und der zweitkleinste im Sonnensystem. Wegen des Eisenoxids auf seiner Oberfläche als "Roter Planet" bekannt, beherbergt er den höchsten Vulkan (Olympus Mons) und tiefsten Canyon.'
        },
        Phobos: {
            name: 'Phobos',
            description: 'Phobos ist der innere und größere der beiden natürlichen Satelliten des Mars. Er ist unregelmäßig geformt und umkreist den Mars in extrem geringer Höhe.'
        },
        Deimos: {
            name: 'Deimos',
            description: 'Deimos ist der kleinere, äußere Marsmond mit einer dicken Regolithschicht, die Einschlagkrater sanft abfedert.'
        },
        Jupiter: {
            name: 'Jupiter',
            description: 'Jupiter ist der fünfte Planet von der Sonne und der größte im Sonnensystem. Dieser Gasriese besitzt mehr als die zweieinhalbfache Masse aller anderen Planeten zusammen und ist berühmt für seinen Großen Roten Fleck.'
        },
        Io: {
            name: 'Io',
            description: 'Io ist der innerste der vier Galileischen Monde Jupiters. Mit über 400 aktiven Vulkanen ist er der geologisch aktivste Himmelskörper im gesamten Sonnensystem.'
        },
        Europa: {
            name: 'Europa',
            description: 'Europa ist der kleinste der vier Galileischen Monde Jupiters. Unter seiner spiegelglatten Eiskruste befindet sich ein riesiger Ozean aus flüssigem Wasser, der als vielversprechender Kandidat für außerirdisches Leben gilt.'
        },
        Ganymede: {
            name: 'Ganymed',
            description: 'Ganymed ist der größte und massereichste Mond im Sonnensystem, sogar größer als der Planet Merkur. Er ist der einzige bekannte Mond mit einem eigenen Magnetfeld.'
        },
        Callisto: {
            name: 'Kallisto',
            description: 'Kallisto ist der zweitgrößte Mond Jupiters. Seine uralte Oberfläche weist die höchste Kraterdichte aller bekannten Himmelskörper auf.'
        },
        Saturn: {
            name: 'Saturn',
            description: 'Saturn ist der sechste Planet von der Sonne und der zweitgrößte im Sonnensystem. Er ist weltberühmt für sein atemberaubendes, filigranes Ringsystem aus Eis- und Gesteinsteilchen.'
        },
        Mimas: {
            name: 'Mimas',
            description: 'Mimas ist ein Saturnmond, der wegen seines gewaltigen Einschlagkraters Herschel dem "Todesstern" aus Star Wars verblüffend ähnlich sieht.'
        },
        Enceladus: {
            name: 'Enceladus',
            description: 'Enceladus ist der sechstgrößte Mond des Saturns. Er ist von reinem Wassereis bedeckt, reflektiert nahezu 100 % des Sonnenlichts und schleudert aus Geysiren am Südpol Wasserfontänen ins All.'
        },
        Titan: {
            name: 'Titan',
            description: 'Titan ist der größte Mond des Saturns und der zweitgrößte im Sonnensystem. Er ist der einzige Mond mit einer dichten Atmosphäre und stabilen Flüssigkeitsseen aus flüssigem Methan und Ethan.'
        },
        Iapetus: {
            name: 'Iapetus',
            description: 'Iapetus ist der drittgrößte Saturnmond, berühmt für seine kontrastreiche Zweifarbigkeit: Eine Hemisphäre ist kohlschwarz, die andere schneeweiß.'
        },
        Uranus: {
            name: 'Uranus',
            description: 'Uranus ist der siebte Planet von der Sonne. Die Rotationsachse dieses Eisriesen ist mit 97,77 Grad so stark geneigt, dass er quasi auf seiner Umlaufbahn rollt.'
        },
        Neptune: {
            name: 'Neptun',
            description: 'Neptun ist der achte und sonnenfernste Planet im Sonnensystem. Der intensiv blaue Eisriese verzeichnet mit über 2.100 km/h die stärksten Winde aller Planeten.'
        },
        Triton: {
            name: 'Triton',
            description: 'Triton ist der größte Mond des Neptuns und der einzige Großmond im Sonnensystem mit einer retrograden Umlaufbahn entgegen der Rotationsrichtung seines Planeten.'
        },
        Pluto: {
            name: 'Pluto',
            description: 'Pluto ist ein Zwergplanet im Kuipergürtel jenseits der Neptunbahn. Er war der erste und größte dort entdeckte Himmelskörper.'
        },
        Charon: {
            name: 'Charon',
            description: 'Charon ist der größte der fünf Monde Plutos. Wegen seiner beachtlichen Masse bilden Pluto und Charon ein Doppel-Zwergplanetensystem.'
        },
        Ceres: {
            name: 'Ceres',
            description: 'Ceres ist das größte Objekt im Asteroidengürtel zwischen Mars und Jupiter und der einzige Zwergplanet im inneren Sonnensystem.'
        },
        Eris: {
            name: 'Eris',
            description: 'Eris ist ein massereicher Zwergplanet in der gestreuten Scheibe jenseits des Kuipergürtels, dessen Entdeckung zur Neudefinition des Planetenbegriffs führte.'
        },
        Haumea: {
            name: 'Haumea',
            description: 'Haumea ist ein Zwergplanet im Kuipergürtel, dessen ellipsoide Form durch eine extrem schnelle Eigendrehung (ein Tag dauert weniger als 4 Stunden) verursacht wird.'
        },
        Makemake: {
            name: 'Makemake',
            description: 'Makemake ist ein extrem kalter Zwergplanet im Kuipergürtel, der mit gefrorenem Methan und Ethan überzogen ist.'
        }
    },
    spacecraft: {
        'Apollo 11': {
            name: 'Apollo 11',
            description: 'Die historische amerikanische Raumfahrtmission, die am 20. Juli 1969 mit Neil Armstrong und Buzz Aldrin erstmals Menschen auf den Mond brachte.'
        },
        'Sputnik 1': {
            name: 'Sputnik 1',
            description: 'Der erste künstliche Erdsatellit der Geschichte, der am 4. Oktober 1957 von der Sowjetunion gestartet wurde und das Raumfahrtzeitalter einläutete.'
        },
        'ISS': {
            name: 'Internationale Raumstation (ISS)',
            description: 'Das größte modulare Forschungslabor im erdnahen Orbit, betrieben von NASA, Roskosmos, JAXA, ESA und CSA.'
        },
        'Hubble Space Telescope': {
            name: 'Hubble-Weltraumteleskop',
            description: 'Das 1990 gestartete Weltraumteleskop revolutionierte mit seinen ikonischen Aufnahmen unser Verständnis des Universums.'
        },
        'Voyager 1': {
            name: 'Voyager 1',
            description: '1977 gestartete NASA-Raumsonde zur Erkundung des äußeren Sonnensystems. Sie ist das am weitesten von der Erde entfernte menschengemachte Objekt.'
        },
        'JWST': {
            name: 'James-Webb-Weltraumteleskop (JWST)',
            description: 'Das fortschrittlichste Infrarot-Weltraumteleskop am Lagrange-Punkt L2, das die frühesten Galaxien nach dem Urknall beobachtet.'
        },
        'Cassini-Huygens': {
            name: 'Cassini-Huygens',
            description: 'Erfolgreiche Raumfahrtmission, die von 2004 bis 2017 das Saturnsystem, seine Ringe und Monde intensiv erforschte.'
        },
        'Voyager 2': {
            name: 'Voyager 2',
            description: 'Die einzige Raumsonde der Menschheit, die aus nächster Nähe an den beiden Eisriesen Uranus und Neptun vorbeiflog.'
        }
    },
    comets: {
        "Halley's Comet": {
            name: 'Halleyscher Komet',
            description: 'Der bekannteste periodische Komet, der alle 75–76 Jahre in Erdnähe zurückkehrt und seit über zwei Jahrtausenden dokumentiert wird.'
        },
        'Comet Hale-Bopp': {
            name: 'Komet Hale-Bopp',
            description: 'Einer der hellsten und meistbeobachteten Kometen des 20. Jahrhunderts, der 18 Monate lang mit bloßem Auge sichtbar war.'
        }
    },
    constellations: {
        'Ursa Major': {
            name: 'Großer Bär (Ursa Major)',
            family: 'Ursa Major',
            description: 'Ein markantes Sternbild des Nordhimmels, das den bekannten Großen Wagen beinhaltet.'
        },
        'Ursa Minor': {
            name: 'Kleiner Bär (Ursa Minor)',
            family: 'Ursa Major',
            description: 'Das Sternbild, in dem sich der Polarstern (Polaris) als Wegweiser nach Norden befindet.'
        },
        'Orion': {
            name: 'Orion (Himmelsjäger)',
            family: 'Orion',
            description: 'Eines der auffälligsten Sternbilder des Winterhimmels mit den Überriesen Beteigeuze und Rigel.'
        },
        'Cassiopeia': {
            name: 'Kassiopeia (Himmels-W)',
            family: 'Perseus',
            description: 'Ein leicht auffindbares zirkumpolares Sternbild des Nordhimmels in Form eines auffälligen Ws.'
        },
        'Cygnus': {
            name: 'Schwan (Cygnus)',
            family: 'Herkules',
            description: 'Ein ikonisches Sternbild entlang der Milchstraße mit dem Kreuz des Nordens und dem Stern Deneb.'
        },
        'Scorpius': {
            name: 'Skorpion (Scorpius)',
            family: 'Tierkreis',
            description: 'Ein prächtiges Sternbild des Südhimmels mit dem feuerroten Überriesen Antares im Zentrum.'
        },
        'Crux': {
            name: 'Kreuz des Südens (Crux)',
            family: 'Himmlische Wasser',
            description: 'Das kleinste der 88 modernen Sternbilder und der wichtigste Wegweiser der Südhalbkugel.'
        },
        'Leo': {
            name: 'Löwe (Leo)',
            family: 'Tierkreis',
            description: 'Ein majestätisches Tierkreissternbild, markiert durch den sichelförmigen Kopf und den Stern Regulus.'
        },
        'Gemini': {
            name: 'Zwillinge (Gemini)',
            family: 'Tierkreis',
            description: 'Ein Tierkreissternbild mit den zwei markanten Zwillingssternen Castor und Pollux.'
        },
        'Taurus': {
            name: 'Stier (Taurus)',
            family: 'Tierkreis',
            description: 'Ein uraltes Sternbild mit den Sternhaufen der Plejaden und Hyaden sowie dem Riesenstern Aldebaran.'
        },
        'Canis Major': {
            name: 'Großer Hund (Canis Major)',
            family: 'Orion',
            description: 'Sternbild mit Sirius, dem mit Abstand hellsten Stern am gesamten Nachthimmel der Erde.'
        }
    },
    stars: {
        'Sirius': {
            name: 'Sirius',
            description: 'Der hellste Stern am Nachthimmel, ein Doppelsternsystem im Sternbild Großer Hund.'
        },
        'Canopus': {
            name: 'Canopus',
            description: 'Der zweithellste Stern am Nachthimmel, der häufig zur Lageregelung von Raumsonden dient.'
        },
        'Arcturus': {
            name: 'Arktur',
            description: 'Der hellste Stern der nördlichen Himmelshälfte, ein oranger Riese im Sternbild Bärenhüter.'
        },
        'Vega': {
            name: 'Wega',
            description: 'Der hellste Stern im Sternbild Leier und der erste Stern außer der Sonne, der fotografiert wurde.'
        },
        'Capella': {
            name: 'Capella',
            description: 'Der sechsthellste Stern am Nachthimmel und ein Vierfachsternsystem im Sternbild Fuhrmann.'
        },
        'Rigel': {
            name: 'Rigel',
            description: 'Ein blauweißer Überriese im Orion, der über 120.000-mal mehr Licht als unsere Sonne abstrahlt.'
        },
        'Procyon': {
            name: 'Prokyon',
            description: 'Der hellste Stern im Kleinen Hund, ein Doppelstern in nur 11,46 Lichtjahren Distanz.'
        },
        'Betelgeuse': {
            name: 'Beteigeuze',
            description: 'Ein Roter Überriese im Orion, der sich im Endstadium seiner Entwicklung befindet und als Supernova enden wird.'
        },
        'Achernar': {
            name: 'Achernar',
            description: 'Der hellste Stern im Eridanus, bekannt für seine extrem rasche Rotation und starke Abplattung.'
        },
        'Hadar': {
            name: 'Hadar (Beta Centauri)',
            description: 'Ein Dreifachsternsystem im Zentaur und der zweithellste Lichtpunkt des Sternbilds.'
        },
        'Altair': {
            name: 'Atair',
            description: 'Der hellste Stern im Adler, der sich am Äquator außergewöhnlich schnell um die eigene Achse dreht.'
        },
        'Acrux': {
            name: 'Acrux',
            description: 'Der hellste Stern im Kreuz des Südens, ein Mehrfachsternsystem in 320 Lichtjahren Entfernung.'
        },
        'Aldebaran': {
            name: 'Aldebaran',
            description: 'Ein oranger Riesenstern im Stier, der als das feurige Auge des Stiers leuchtet.'
        },
        'Spica': {
            name: 'Spica',
            description: 'Der hellste Stern in der Jungfrau, ein spektroskopischer Doppelstern.'
        },
        'Antares': {
            name: 'Antares',
            description: 'Ein Roter Überriese und das Herz des Skorpions, einer der größten mit bloßem Auge sichtbaren Sterne.'
        },
        'Pollux': {
            name: 'Pollux',
            description: 'Ein oranger Riese in den Zwillingen, der von einem massereichen Exoplaneten umkreist wird.'
        },
        'Fomalhaut': {
            name: 'Fomalhaut',
            description: 'Der hellste Stern im Südlichen Fisch, berühmt für seine Trümmerscheibe, das "Auge Saurons".'
        },
        'Deneb': {
            name: 'Deneb',
            description: 'Ein blauweißer Überriese im Schwan und einer der leuchtstärksten bekannten Sterne der Galaxie.'
        },
        'Regulus': {
            name: 'Regulus',
            description: 'Der hellste Stern im Löwen und das "Herz des Löwen", ein Vierfachsternsystem.'
        },
        'Polaris': {
            name: 'Polarstern (Polaris)',
            description: 'Der Nordstern, der fast exakt am nördlichen Himmelspol steht und seit Jahrtausenden die Orientierung ermöglicht.'
        }
    }
};
