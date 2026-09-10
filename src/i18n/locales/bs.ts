import { TranslationSchema } from '../types';

export const bs: TranslationSchema = {
    ui: {
        simDate: '⏱ VRIJEME SIMULACIJE:',
        radarToggle: 'Uključi/isključi radar (M)',
        controlsToggle: 'Uključi/isključi kontrole simulacije',
        languageToggle: 'Promijeni jezik',
        orbiting: '(orbitira oko: {planet})',
        jumpToDate: 'Skoči na aktivni datum ({date})',
        close: 'Zatvori',
        help: 'Pomoć',
        audioAmbience: 'Kosmički audio ambijent (S)',
        audioAmbienceAria: 'Uključi/isključi kosmički zvuk',
        telemetry: 'Telemetrija performansi (P)',
        telemetryAria: 'Uključi/isključi telemetriju',
        keyboardShortcuts: 'Prečice na tastaturi (? / H)',
        keyboardShortcutsAria: 'Prikaži prečice na tastaturi',
        astrophotography: 'Astrofotografski snimak (K)',
        astrophotographyAria: 'Snimi sliku visoke rezolucije',
        speedPause: 'Kliknite za pauzu / nastavak (Razmaknica)',
        utcTime: 'Univerzalno vrijeme (UTC)',
        liveRealTime: 'Fizičko stvarno vrijeme (1:1)'
    },
    categories: {
        star: '🌟 Zvijezde',
        planet: '🪐 Planete',
        moon: '🌕 Mjeseci / Sateliti',
        constellation: '🌌 Sazviježđa',
        comet: '☄️ Komete',
        spacecraft: '🛰️ Svemirske letjelice'
    },
    controls: {
        simulationFolder: 'Simulacija',
        environmentFolder: 'Okruženje',
        cameraFolder: 'Kontrole kamere',
        toolsFolder: 'Alati',
        realisticScale: 'Realne proporcije',
        showMinimap: 'Prikaži radar minimapu',
        timeSpeed: 'Brzina vremena',
        speedPreset: 'Preset brzine',
        speedPresets: {
            realTime: 'Stvarno vrijeme (1:1)',
            oneHourPerSec: '1 sat / sek',
            oneDayPerSec: '1 dan / sek (Realistično)',
            oneWeekPerSec: '1 sedmica / sek',
            oneMonthPerSec: '1 mjesec / sek',
            paused: 'Pauzirano',
            custom: 'Prilagođeno'
        },
        pause: 'Pauza',
        resume: 'Nastavi',
        showOrbits: 'Prikaži orbite',
        showMoons: 'Prikaži mjesece',
        showAsteroids: 'Prikaži asteroide',
        showKuiperBelt: 'Prikaži Kojperov pojas',
        showDwarfPlanets: 'Prikaži patuljaste planete',
        showComets: 'Prikaži komete',
        showSpacecraft: 'Prikaži letjelice',
        showMeteors: 'Prikaži meteore',
        showTrails: 'Prikaži tragove putanja',
        habitableZone: 'Nastanjiva zona',
        eclipticGrid: 'Ekliptička mreža',
        enableBloom: 'Omogući svjetlosni sjaj (Bloom)',
        realisticLighting: 'Realistično osvjetljenje',
        showAxes: 'Prikaži ose',
        attachCamera: 'Veži kameru za tijelo',
        viewFromSurface: 'Pogled sa površine',
        freeCamera: 'Slobodna kamera',
        measureDistance: 'Izmjeri udaljenost',
        cinematicTour: 'Kinematska tura',
        tourSpeed: 'Brzina ture',
        tooltips: {
            pauseResume: 'Kliknite da pauzirate ili nastavite vrijeme (ili pritisnite Space).',
            speedPreset: 'Izaberite standardne realistične astronomske brzine ili prilagođenu brzinu.',
            timeSpeed: 'Podesite brzinu simulacije vremena. 1 dan/sek je kalibrisana realistična brzina posmatranja.',
            realisticScale: 'Uključuje realne orbitalne udaljenosti i skalira nebeska tijela prema stvarnim svemirskim razmjerima.',
            showTrails: 'Prikazuje orbitalne putanje ili tragove iza tijela dok se kreću kroz svemir.',
            habitableZone: 'Područje oko zvijezde gdje uslovi omogućavaju postojanje tečne vode na površini planete.',
            eclipticGrid: 'Koordinatna mreža koja predstavlja ravan Zemljine orbite oko Sunca.',
            enableBloom: 'Post-procesing efekat koji čini da svijetli objekti realistično zrače i sjaje.',
            realisticLighting: 'Koristi fizički bazirano renderovanje za simulaciju prirodne interakcije svjetlosti sa površinama.',
            showAxes: 'Prikazuje X (crvena), Y (zelena) i Z (plava) ose radi prostorne orijentacije.',
            measureDistance: 'Aktivirajte mjerenje, a zatim kliknite na dva tijela u 3D sceni da biste izmjerili rastojanje između njih.'
        }
    },
    modal: {
        badges: {
            celestialBody: 'NEBESKO TIJELO',
            missionDossier: 'DOSIJE MISIJE',
            cometTelemetry: 'TELEMETRIJA KOMETE',
            constellation: 'SAZVIJEŽĐE',
            stellarDossier: 'ZVJEZDANI DOSIJE',
            lunarTelemetry: 'LUNARNA TELEMETRIJA',
            stellarCore: 'ZVJEZDANO JEZGRO',
            planetaryDossier: 'PLANETARNI DOSIJE'
        },
        labels: {
            type: 'Tip',
            radius: 'Poluprečnik',
            distance: 'Udaljenost',
            period: 'Period orbite',
            axialTilt: 'Nagib ose',
            semiMajorAxis: 'Velika poluosa',
            eccentricity: 'Ekscentricitet',
            rightAsc: 'Rektascenzija',
            declination: 'Deklinacija',
            stars: 'Glavne zvijezde',
            brightest: 'Najsjajnija',
            area: 'Površina',
            family: 'Grupa sazviježđa',
            spacecraftType: 'Svemirska letjelica'
        },
        tooltipTitles: {
            spacecraft: 'Svemirska letjelica',
            rightAsc: 'Rektascenzija (RA)',
            declination: 'Deklinacija (Dec)',
            radius: 'Poluprečnik',
            distance: 'Orbitalna udaljenost',
            semiMajorAxis: 'Velika poluosa',
            eccentricity: 'Ekscentricitet',
            period: 'Orbitalni period',
            axialTilt: 'Nagib ose',
            stars: 'Glavne zvijezde',
            brightest: 'Najsjajnija zvijezda',
            area: 'Pokrivena površina',
            family: 'Grupa sazviježđa'
        },
        tooltips: {
            spacecraft: 'Vještački objekat ili sonda dizajnirana za istraživanje svemira.',
            rightAsc: 'Nebeska koordinata ekvivalentna geografskoj dužini na Zemlji, mjerena u sideričkim satima.',
            declination: 'Nebeska koordinata ekvivalentna geografskoj širini na Zemlji, mjerena sjeverno (+) ili južno (-) od nebeskog ekvatora.',
            radiusEarth: 'Poluprečnik tijela izražen u odnosu na poluprečnik Zemlje (R⊕).',
            distSun: 'Prosječna udaljenost od Sunca u astronomskim jedinicama (AU).',
            distPlanet: 'Prosječna udaljenost od matične planete.',
            orbitSun: 'Vrijeme potrebno za jedan puni krug oko Sunca.',
            orbitPlanet: 'Vrijeme potrebno za jedan puni krug oko matične planete.',
            axialTilt: 'Ugao između ose rotacije i orbitalne ravni.',
            semiMajorAxis: 'Polovina najdužeg prečnika eliptične orbite.',
            eccentricity: 'Mjera odstupanja orbite od kružnice (0 predstavlja savršeni krug).',
            cometPeriod: 'Vrijeme potrebno kometi da napravi jedan puni krug oko Sunca.',
            constellationStars: 'Primarne zvijezde koje sačinjavaju prepoznatljiv oblik sazviježđa.',
            brightestStar: 'Najsjajnija zvijezda unutar ovog sazviježđa.',
            constellationArea: 'Ukupna površina nebeske sfere koju pokriva sazviježđe (u kvadratnim stepenima).',
            constellationFamily: 'Astronomsko grupisanje srodnih sazviježđa.'
        },
        resourcesHeader: 'Telemetrija i resursi',
        noDescription: 'Nema detaljnog opisa u bazama podataka telemetrije.',
        audioGuide: 'Slušaj',
        audioPlaying: 'Reprodukcija...',
        audioGuideTitle: 'Audio vodič naracija',
        audioGuideStop: 'Zaustavi naraciju',
        audioGuideAria: 'Slušaj nebeski audio vodič',
        audioGuidePlayingAria: 'Zaustavi naraciju nebeskog audio vodiča',
        prevImageAria: 'Prethodna slika',
        nextImageAria: 'Sljedeća slika',
        periodUnits: {
            year: 'god',
            month: 'mj',
            day: 'd'
        }
    },
    shortcuts: {
        title: 'Prečice na tastaturi opservatorije',
        navTitle: 'Navigacija i brzi fokus',
        mercuryToNeptune: 'Merkur do Neptun',
        pluto: 'Pluton (Patuljasta planeta)',
        sun: 'Sunce (Solarno jezgro)',
        resetView: 'Realna razmjera / Resetuj pogled',
        timeTitle: 'Vrijeme i simulacija',
        pauseResume: 'Pauziraj / Nastavi simulaciju',
        warpSpeed: 'Smanji / Povećaj brzinu vremena',
        cinematicTour: 'Uključi/isključi filmsku turu',
        toolsTitle: 'Nebeski slojevi i alati',
        orbits: 'Uključi/isključi planetarne orbite',
        minimap: 'Uključi/isključi radarski minimap',
        constellations: 'Uključi/isključi sazviježđa',
        audio: 'Uključi/isključi kosmički zvuk',
        telemetry: 'Uključi/isključi telemetrijski HUD',
        snapshot: 'Astrofotografski snimak',
        fullscreen: 'Cijeli ekran',
        help: 'Otvori vodič za prečice',
        esc: 'Zatvori dijaloge / Otkači metu'
    },
    popups: {
        trueScaleTitle: 'Prave razmjere Sunčevog sistema',
        trueScaleDesc: 'Sada posmatrate Sunčev sistem u njegovim stvarnim razmjerima. Planete su prikazane u pravoj veličini u odnosu na ogromna međusobna rastojanja. Budući da je svemir pretežno prazan prostor, planete izgledaju kao mikroskopske tačkice u poređenju sa svojim orbitama. Pokazivači su uključeni kako bi vam pomogli da ih pronađete.',
        meteorsTitle: 'Meteori',
        meteorsDesc: 'Sada posmatrate meteore u blizini Zemlje. Meteor je svijetleći trag na nebu koji nastaje kada meteoroid uleti u Zemljinu atmosferu ogromnom brzinom. Uslijed trenja sa zrakom dolazi do zagrijavanja i sagorijevanja, što stvara prepoznatljiv vizuelni bljesak.'
    },
    datepicker: {
        months: [
            'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
            'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
        ],
        weekdays: ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'],
        bc: 'p.n.e.',
        ad: 'n.e.',
        century: 'Stoljeće',
        decade: 'Decenija',
        year: 'Godina',
        historicalEvents: 'Historijski događaji...'
    },
    loading: {
        boot: 'Pokretanje opservatorije',
        subtitle: 'Astronomski opservatorij dubokog svemira',
        core: 'INICIJALIZACIJA JEZGRA OPSERVATORIJE...',
        ephemerides: 'KALIBRACIJA NEBESKIH EFEMERIDA...',
        surfaces: 'SINTEZA PLANETARNIH POVRŠINA...',
        controls: 'KONFIGURISANJE KONTROLA OPSERVATORIJE...',
        acquiring: 'PREUZIMANJE ASTROFOTOGRAFIJA VISOKE REZOLUCIJE...',
        calibrating: 'KALIBRACIJA ATMOSFERSKIH SJENČENJA...',
        streaming: 'UČITAVANJE TEKSTURA DUBOKOG SVEMIRA...',
        synchronizing: 'SINHRONIZACIJA NEBESKIH ORBITA...',
        loaded: 'RESURSI UČITANI',
        ready: 'SISTEMI OPERATIVNI • OPSERVATORIJA SPREMNA',
        standby: 'PRIPRAVNOST',
        connecting: 'POVEZIVANJE',
        assets: 'RESURSI',
        online: 'AKTIVNO',
        tagBoot: 'POKRETANJE',
        tagCalibrating: 'KALIBRACIJA',
        tagSynthesizing: 'SINTEZA',
        tagConfiguring: 'KONFIGURISANJE'
    },
    bodies: {
        Sun: {
            name: 'Sunce',
            description: 'Sunce je zvijezda u centru našeg Sunčevog sistema. To je skoro savršena kugla vruće plazme, zagrijana do usijanja nuklearnom fuzijom u svom jezgru, odakle zrači energiju neophodnu za život na Zemlji.'
        },
        Mercury: {
            name: 'Merkur',
            description: 'Merkur je najmanja planeta u Sunčevom sistemu i najbliža Suncu. Njegova orbita oko Sunca traje samo 87,97 zemaljskih dana, što je najbrže među svim planetama.'
        },
        Venus: {
            name: 'Venera',
            description: 'Venera je druga planeta od Sunca. Posjeduje najgušću atmosferu među terestričkim planetama, sa preko 96% ugljik-dioksida, stvarajući ekstremni efekat staklenika i površinsku temperaturu od oko 465°C.'
        },
        Earth: {
            name: 'Zemlja',
            description: 'Zemlja je treća planeta od Sunca i jedini poznati astronomski objekat na kojem postoji život. Oko 71% njene površine pokriveno je vodom, a zaštićena je snažnim magnetnim poljem.'
        },
        Moon: {
            name: 'Mjesec',
            description: 'Mjesec je jedini prirodni satelit Zemlje. Peti je po veličini prirodni satelit u Sunčevom sistemu i najveći u odnosu na planetu oko koje kruži.'
        },
        Mars: {
            name: 'Mars',
            description: 'Mars je četvrta planeta od Sunca i druga najmanja u Sunčevom sistemu. Poznat kao "Crvena planeta" zbog željeznog oksida na površini, dom je najvećeg vulkana (Olympus Mons) i najdubljeg kanjona u Sunčevom sistemu.'
        },
        Phobos: {
            name: 'Fobos',
            description: 'Fobos je unutrašnji i veći od dva prirodna satelita Marsa. Nepravilnog je oblika i kruži izuzetno blizu Marsove površine.'
        },
        Deimos: {
            name: 'Dejmos',
            description: 'Dejmos je manji i vanjski Marsov satelit. Prekriven je debelim slojem regolita koji ublažava izgled njegovih kratera.'
        },
        Jupiter: {
            name: 'Jupiter',
            description: 'Jupiter je peta planeta od Sunca i najveća u Sunčevom sistemu. Ovaj gasoviti div ima masu preko dva i po puta veću od svih ostalih planeta zajedno, uz čuvenu Veliku crvenu pjegu.'
        },
        Io: {
            name: 'Ija',
            description: 'Ija je unutrašnji od četiri galilejska mjeseca Jupitera. Sa više od 400 aktivnih vulkana, to je geološki najaktivniji objekat u čitavom Sunčevom sistemu.'
        },
        Europa: {
            name: 'Evropa',
            description: 'Evropa je najmanji galilejski mjesec koji kruži oko Jupitera. Ispod glatke ledene kore krije se duboki okean tečne vode koji bi mogao pružati uslove za život.'
        },
        Ganymede: {
            name: 'Ganimed',
            description: 'Ganimed je najveći i najmasivniji mjesec u Sunčevom sistemu, veći čak i od planete Merkur. Jedini je poznati mjesec koji posjeduje sopstveno magnetno polje.'
        },
        Callisto: {
            name: 'Kalisto',
            description: 'Kalisto je drugi po veličini Jupiterov mjesec. Njegova drevna površina je među najviše izbrazdanim kraterima u čitavom Sunčevom sistemu.'
        },
        Saturn: {
            name: 'Saturn',
            description: 'Saturn je šesta planeta od Sunca i druga po veličini u Sunčevom sistemu. Najpoznatiji je po svom veličanstvenom i složenom sistemu prstenova sačinjenih od leda i stijena.'
        },
        Mimas: {
            name: 'Mimas',
            description: 'Mimas je Saturnov mjesec poznat po gigantskom udarnom krateru Heršel, zbog čega nevjerovatno podsjeća na "Zvijezdu smrti".'
        },
        Enceladus: {
            name: 'Encelad',
            description: 'Encelad je sjajni ledeni mjesec Saturna koji reflektuje skoro 100% Sunčeve svjetlosti. Gejziri na njegovom južnom polu izbacuju vodenu paru i organske molekule u svemir.'
        },
        Titan: {
            name: 'Titan',
            description: 'Titan je najveći Saturnov mjesec i drugi po veličini u Sunčevom sistemu. Jedini je satelit sa gustom atmosferom i stabilnim tečnim jezerima ugljovodonika na površini.'
        },
        Iapetus: {
            name: 'Japet',
            description: 'Japet je Saturnov mjesec karakterističan po svom dvobojnom izgledu: jedna polulopta mu je tamna poput uglja, a druga svijetla poput snijega.'
        },
        Uranus: {
            name: 'Uran',
            description: 'Uran je sedma planeta od Sunca. Ovaj ledeni div ima nagib ose rotacije od čak 97,77 stepeni, pa se praktično "kotrlja" po svojoj orbitalnoj ravni.'
        },
        Neptune: {
            name: 'Neptun',
            description: 'Neptun je osma i najudaljenija planeta Sunčevog sistema. Poznat je po dubokoj plavoj boji i najbržim vjetrovima u Sunčevom sistemu koji dostižu preko 2.100 km/h.'
        },
        Triton: {
            name: 'Triton',
            description: 'Triton je najveći Neptunov satelit i jedini veliki mjesec u Sunčevom sistemu koji se kreće u retrogradnoj orbiti (suprotno od rotacije matične planete).'
        },
        Pluto: {
            name: 'Pluton',
            description: 'Pluton je patuljasta planeta u Kojperovom pojasu iza orbite Neptuna. Bio je prvi i najveći otkriveni objekat u ovom dalekom ledenom pojasu.'
        },
        Charon: {
            name: 'Haron',
            description: 'Haron je najveći od pet prirodnih satelita Plutona. Zbog srazmjerne veličine, Pluton i Haron čine jedinstven binarni sistem patuljastih planeta.'
        },
        Ceres: {
            name: 'Cerera',
            description: 'Cerera je najveći objekat u glavnom asteroidnom pojasu između Marsa i Jupitera i jedina patuljasta planeta u unutrašnjem dijelu Sunčevog sistema.'
        },
        Eris: {
            name: 'Erida',
            description: 'Erida je masivna patuljasta planeta smještena u rasejanom disku izvan Kojperovog pojasa, čije je otkriće dovelo do redefinisanja pojma planete.'
        },
        Haumea: {
            name: 'Haumea',
            description: 'Haumea je patuljasta planeta elipsoidnog oblika uzrokovanog izuzetno brzom rotacijom (jedan dan traje manje od 4 sata).'
        },
        Makemake: {
            name: 'Makemake',
            description: 'Makemake je patuljasta planeta u Kojperovom pojasu prekrivena zaleđenim metanom i etanom, sa izrazito niskim temperaturama.'
        }
    },
    spacecraft: {
        'Apollo 11': {
            name: 'Apolo 11',
            description: 'Američka svemirska misija koja je 20. jula 1969. prvi put spustila ljude na Mjesec, pod komandom Nila Armstronga i Baza Oldrina.'
        },
        'Sputnik 1': {
            name: 'Sputnjik 1',
            description: 'Prvi vještački Zemljin satelit, lansiran od strane Sovjetskog Saveza 4. oktobra 1957. godine, čime je započela svemirska era čovječanstva.'
        },
        'ISS': {
            name: 'Međunarodna svemirska stanica (ISS)',
            description: 'Najveća modularna laboratorija u niskoj Zemljinoj orbiti, plod saradnje svemirskih agencija NASA, Roskosmos, JAXA, ESA i CSA.'
        },
        'ISS (International Space Station)': {
            name: 'Međunarodna svemirska stanica (ISS)',
            description: 'Najveća modularna laboratorija u niskoj Zemljinoj orbiti, plod saradnje svemirskih agencija NASA, Roskosmos, JAXA, ESA i CSA.'
        },
        'Hubble Space Telescope': {
            name: 'Svemirski teleskop Habl',
            description: 'Revolucionarni svemirski teleskop lansiran 1990. godine koji je iz temelja promijenio naše razumijevanje kosmosa i astrofizike.'
        },
        'Voyager 1': {
            name: 'Vojadžer 1',
            description: 'Sonda koju je NASA lansirala 1977. godine. Najudaljeniji je objekat stvoren ljudskom rukom, a danas krstari međuzvjezdanim prostorom.'
        },
        'JWST': {
            name: 'Svemirski teleskop Džejms Veb (JWST)',
            description: 'Najsavremeniji infracrveni svemirski teleskop koji posmatra prve galaksije nastale nakon Velikog praska iz tačke Lagranž L2.'
        },
        'James Webb Space Telescope': {
            name: 'Svemirski teleskop Džejms Veb (JWST)',
            description: 'Najsavremeniji infracrveni svemirski teleskop koji posmatra prve galaksije nastale nakon Velikog praska iz tačke Lagranž L2.'
        },
        'Cassini-Huygens': {
            name: 'Kasini-Hojgens',
            description: 'Vodeća svemirska misija koja je od 2004. do 2017. detaljno istraživala Saturn, njegove veličanstvene prstenove i neobične mjesece.'
        },
        'Cassini': {
            name: 'Kasini-Hojgens',
            description: 'Vodeća svemirska misija koja je od 2004. do 2017. detaljno istraživala Saturn, njegove veličanstvene prstenove i neobične mjesece.'
        },
        'Voyager 2': {
            name: 'Vojadžer 2',
            description: 'Jedina svemirska letjelica u historiji koja je izbliza posjetila oba ledena diva: Uran i Neptun.'
        }
    },
    comets: {
        "Halley's Comet": {
            name: 'Halejeva kometa',
            description: 'Najpoznatija periodična kometa koja se vraća u blizinu Zemlje svakih 75–76 godina, a astronomi je posmatraju već duže od dva milenija.'
        },
        'Comet Hale-Bopp': {
            name: 'Kometa Hejl-Bop',
            description: 'Jedna od najsjajnijih i najduže posmatranih kometa 20. vijeka, ostala je vidljiva golim okom tokom rekordnih 18 mjeseci.'
        },
        'Hale-Bopp': {
            name: 'Kometa Hejl-Bop',
            description: 'Jedna od najsjajnijih i najduže posmatranih kometa 20. vijeka, ostala je vidljiva golim okom tokom rekordnih 18 mjeseci.'
        }
    },
    constellations: {
        'Ursa Major': {
            name: 'Veliki medvjed (Ursa Major)',
            family: 'Ursa Major',
            description: 'Sjeverno sazviježđe koje sadrži čuveni asterizam Velika kola.'
        },
        'Ursa Major (Big Dipper)': {
            name: 'Veliki medvjed (Ursa Major)',
            family: 'Ursa Major',
            description: 'Sjeverno sazviježđe koje sadrži čuveni asterizam Velika kola.'
        },
        'Ursa Minor': {
            name: 'Mali medvjed (Ursa Minor)',
            family: 'Ursa Major',
            description: 'Sjeverno sazviježđe čija je najsjajnija zvijezda Sjevernjača (Polaris), ključni orjentir u navigaciji.'
        },
        'Ursa Minor (Little Dipper)': {
            name: 'Mali medvjed (Ursa Minor)',
            family: 'Ursa Major',
            description: 'Sjeverno sazviježđe čija je najsjajnija zvijezda Sjevernjača (Polaris), ključni orjentir u navigaciji.'
        },
        'Orion': {
            name: 'Orion (Lovac)',
            family: 'Orion',
            description: 'Jedno od najprepoznatljivijih sazviježđa na noćnom nebu, dom superdžinova Betelgeza i Rigela.'
        },
        'Cassiopeia': {
            name: 'Kasiopeja',
            family: 'Perzej',
            description: 'Lako uočljivo sjeverno sazviježđe prepoznatljivog oblika slova "W" ili "M".'
        },
        'Cygnus': {
            name: 'Labud (Cygnus)',
            family: 'Herkul',
            description: 'Sazviježđe koje leži na ravni Mliječnog puta, sa asterizmom Sjeverni krst i zvijezdom Deneb.'
        },
        'Cygnus (The Swan)': {
            name: 'Labud (Cygnus)',
            family: 'Herkul',
            description: 'Sazviježđe koje leži na ravni Mliječnog puta, sa asterizmom Sjeverni krst i zvijezdom Deneb.'
        },
        'Scorpius': {
            name: 'Škorpija (Scorpius)',
            family: 'Zodijak',
            description: 'Upečatljivo zodijačko sazviježđe na južnom nebu sa sjajnim crvenim superdžinom Antaresom u svom srcu.'
        },
        'Crux': {
            name: 'Južni krst (Crux)',
            family: 'Nebeske vode',
            description: 'Najmanje od svih 88 modernih sazviježđa, izuzetno važno za orjentaciju na južnoj polulopti.'
        },
        'Crux (Southern Cross)': {
            name: 'Južni krst (Crux)',
            family: 'Nebeske vode',
            description: 'Najmanje od svih 88 modernih sazviježđa, izuzetno važno za orjentaciju na južnoj polulopti.'
        },
        'Leo': {
            name: 'Lav (Leo)',
            family: 'Zodijak',
            description: 'Veličanstveno zodijačko sazviježđe lako prepoznatljivo po obliku srpa i sjajnoj zvijezdi Regul.'
        },
        'Gemini': {
            name: 'Blizanci (Gemini)',
            family: 'Zodijak',
            description: 'Zodijačko sazviježđe označeno dvjema sjajnim zvijezdama blizancima: Kastorom i Poluksom.'
        },
        'Taurus': {
            name: 'Bik (Taurus)',
            family: 'Zodijak',
            description: 'Drevno zodijačko sazviježđe koje sadrži zbijena jata Plejade i Hijade, uz crvenog džina Aldebarana.'
        },
        'Canis Major': {
            name: 'Veliki pas (Canis Major)',
            family: 'Orion',
            description: 'Sazviježđe u kojem se nalazi Sirijus, najsjajnija zvijezda na noćnom nebu.'
        }
    },
    stars: {
        'Sirius': {
            name: 'Sirijus',
            description: 'Najsjajnija zvijezda noćnog neba. To je binarni zvjezdani sistem u sazviježđu Veliki pas.'
        },
        'Canopus': {
            name: 'Kanopus',
            description: 'Druga najsjajnija zvijezda noćnog neba, često korištena za navigaciju svemirskih letjelica.'
        },
        'Arcturus': {
            name: 'Arktur',
            description: 'Najsjajnija zvijezda sjeverne nebeske polulopte, narandžasti džin u sazviježđu Volar.'
        },
        'Vega': {
            name: 'Vega',
            description: 'Najsjajnija zvijezda u sazviježđu Lira i prva zvijezda poslije Sunca koja je fotografisana.'
        },
        'Capella': {
            name: 'Kapela',
            description: 'Šesta najsjajnija zvijezda na noćnom nebu i najsjajnija u sazviježđu Kočijaš.'
        },
        'Rigel': {
            name: 'Rigel',
            description: 'Plavo-bijeli superdžin u sazviježđu Orion, koji zrači preko 120.000 puta više svjetlosti od Sunca.'
        },
        'Procyon': {
            name: 'Prokion',
            description: 'Najsjajnija zvijezda u Malom psu, binarni sistem udaljen samo 11,46 svjetlosnih godina.'
        },
        'Betelgeuse': {
            name: 'Betelgez',
            description: 'Crveni superdžin u Orionu koji se nalazi u završnoj fazi svog života i završit će kao supernova.'
        },
        'Achernar': {
            name: 'Ahernar',
            description: 'Najsjajnija zvijezda u sazviježđu Eridan, poznata po izuzetno brzoj rotaciji koja ju je spljoštila.'
        },
        'Hadar': {
            name: 'Hadar',
            description: 'Poznat i kao Beta Kentauri, trostruki zvjezdani sistem u Kentauru.'
        },
        'Altair': {
            name: 'Altair',
            description: 'Najsjajnija zvijezda u sazviježđu Orao, poznata po brzoj ekvatorskoj rotaciji.'
        },
        'Acrux': {
            name: 'Akruks',
            description: 'Najsjajnija zvijezda u Južnom krstu, višestruki zvjezdani sistem udaljen 320 svjetlosnih godina.'
        },
        'Aldebaran': {
            name: 'Aldebaran',
            description: 'Narandžasti džin u Biku koji predstavlja plameno oko bika, najsjajnija zvijezda u tom sazviježđu.'
        },
        'Spica': {
            name: 'Spika',
            description: 'Najsjajnija zvijezda u sazviježđu Djevica, spektroskopska binarna zvijezda.'
        },
        'Antares': {
            name: 'Antares',
            description: 'Crveni superdžin i srce sazviježđa Škorpija, jedna od najvećih zvijezda vidljivih golim okom.'
        },
        'Pollux': {
            name: 'Poluks',
            description: 'Narandžasti džin u Blizancima oko kojeg kruži potvrđena vansolarna planeta divovskih razmjera.'
        },
        'Fomalhaut': {
            name: 'Fomalhaut',
            description: 'Najsjajnija zvijezda u Južnoj ribi, poznata po svom krhotinskom disku koji podsjeća na "Sauronovo oko".'
        },
        'Deneb': {
            name: 'Deneb',
            description: 'Plavo-bijeli superdžin u Labudu, jedna od najsjajnijih poznatih zvijezda u Mliječnom putu.'
        },
        'Regulus': {
            name: 'Regul',
            description: 'Najsjajnija zvijezda u Lavu koja predstavlja srce Lava, četvorostruki zvjezdani sistem.'
        },
        'Polaris': {
            name: 'Sjevernjača (Polaris)',
            description: 'Zvijezda smještena gotovo tačno na sjevernom nebeskom polu, vjekovni orijentir moreplovaca.'
        }
    }
};
