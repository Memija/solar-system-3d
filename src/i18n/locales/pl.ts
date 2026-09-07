import { TranslationSchema } from '../types';

export const pl: TranslationSchema = {
    ui: {
        simDate: '⏱ DATA SYMULACJI:',
        radarToggle: 'Przełącz radar minimapy (M)',
        controlsToggle: 'Przełącz panel sterowania',
        languageToggle: 'Zmień język',
        orbiting: '(krąży wokół: {planet})',
        jumpToDate: 'Przejdź do aktywnej daty ({date})',
        close: 'Zamknij',
        help: 'Pomoc'
    },
    categories: {
        star: '🌟 Gwiazdy',
        planet: '🪐 Planety',
        moon: '🌕 Księżyce',
        constellation: '🌌 Gwiazdozbiory',
        comet: '☄️ Komety',
        spacecraft: '🛰️ Sondy kosmiczne'
    },
    controls: {
        simulationFolder: 'Symulacja',
        environmentFolder: 'Otoczenie',
        cameraFolder: 'Sterowanie kamerą',
        toolsFolder: 'Narzędzia',
        realisticScale: 'Rzeczywista skala',
        showMinimap: 'Pokaż minimapę',
        timeSpeed: 'Prędkość czasu',
        speedPreset: 'Ustawienie prędkości',
        speedPresets: {
            realTime: 'Czas rzeczywisty (1:1)',
            oneHourPerSec: '1 godzina / sek',
            oneDayPerSec: '1 dzień / sek (Realistyczna)',
            oneWeekPerSec: '1 tydzień / sek',
            oneMonthPerSec: '1 miesiąc / sek',
            paused: 'Wstrzymana',
            custom: 'Własna'
        },
        pause: 'Wstrzymaj',
        resume: 'Wznów',
        showOrbits: 'Pokaż orbity',
        showMoons: 'Pokaż księżyce',
        showAsteroids: 'Pokaż asteroidy',
        showKuiperBelt: 'Pokaż Pas Kuipera',
        showDwarfPlanets: 'Pokaż planety karłowate',
        showComets: 'Pokaż komety',
        showSpacecraft: 'Pokaż sondy kosmiczne',
        showMeteors: 'Pokaż meteory',
        showTrails: 'Pokaż ślady orbit',
        habitableZone: 'Ekosfera (Strefa życia)',
        eclipticGrid: 'Siatka ekliptyki',
        enableBloom: 'Włącz poświatę (Bloom)',
        realisticLighting: 'Realistyczne oświetlenie',
        showAxes: 'Pokaż osie współrzędnych',
        attachCamera: 'Podążaj za obiektem',
        viewFromSurface: 'Widok z powierzchni',
        freeCamera: 'Swobodna kamera',
        measureDistance: 'Zmierz odległość',
        cinematicTour: 'Wędrówka filmowa',
        tourSpeed: 'Prędkość wędrówki',
        tooltips: {
            pauseResume: 'Kliknij, aby wstrzymać lub wznowić czas symulacji (lub naciśnij spację).',
            speedPreset: 'Wybierz standardowe realistyczne tempo astronomiczne lub prędkość własną.',
            timeSpeed: 'Dostosuj tempo upływu czasu symulacji. 1 dzień/sek to skalibrowana realistyczna prędkość obserwacji.',
            realisticScale: 'Włącza rzeczywiste odległości orbitalne i skaluje ciała niebieskie proporcjonalnie do bezmiaru kosmosu.',
            showTrails: 'Rysuje linie trajektorii i ślady za poruszającymi się ciałami niebieskimi.',
            habitableZone: 'Obszar wokół gwiazdy, w którym panują warunki umożliwiające istnienie ciekłej wody na powierzchni.',
            eclipticGrid: 'Siatka współrzędnych odzwierciedlająca płaszczyznę orbity Ziemi wokół Słońca.',
            enableBloom: 'Efekt wizualny sprawiający, że jasne źródła światła i gwiazdy emitują intensywną poświatę.',
            realisticLighting: 'Wykorzystuje rendering fizyczny (PBR) do symulacji naturalnego rozpraszania światła słonecznego.',
            showAxes: 'Wyświetla osie przestrzenne X (czerwona), Y (zielona) i Z (niebieska).',
            measureDistance: 'Włącz pomiar odległości, a następnie kliknij dwa obiekty w scenie 3D, aby obliczyć dystans między nimi.'
        }
    },
    modal: {
        badges: {
            celestialBody: 'CIAŁO NIEBIESKIE',
            missionDossier: 'DOKUMENTACJA MISJI',
            cometTelemetry: 'TELEMETRIA KOMETY',
            constellation: 'GWIAZDOZBÓR',
            stellarDossier: 'DOKUMENTACJA GWIAZDY',
            lunarTelemetry: 'TELEMETRIA KSIĘŻYCA',
            stellarCore: 'JĄDRO GWIEZDNE',
            planetaryDossier: 'DOKUMENTACJA PLANETY'
        },
        labels: {
            type: 'Typ',
            radius: 'Promień',
            distance: 'Odległość',
            period: 'Okres orbitalny',
            axialTilt: 'Nachylenie osi',
            semiMajorAxis: 'Półoś wielka',
            eccentricity: 'Mimośród',
            rightAsc: 'Rektascensja',
            declination: 'Deklinacja',
            stars: 'Główne gwiazdy',
            brightest: 'Najjaśniejsza',
            area: 'Powierzchnia',
            family: 'Rodzina',
            spacecraftType: 'Pojazd kosmiczny'
        },
        tooltipTitles: {
            spacecraft: 'Sonda / Statek kosmiczny',
            rightAsc: 'Rektascensja (RA)',
            declination: 'Deklinacja (Dec)',
            radius: 'Promień',
            distance: 'Odległość orbitalna',
            semiMajorAxis: 'Półoś wielka',
            eccentricity: 'Mimośród',
            period: 'Okres orbitalny',
            axialTilt: 'Nachylenie osi',
            stars: 'Główne gwiazdy',
            brightest: 'Najjaśniejsza gwiazda',
            area: 'Zajmowany obszar',
            family: 'Grupa gwiazdozbiorów'
        },
        tooltips: {
            spacecraft: 'Sztuczny pojazd zaprojektowany do działania i eksploracji przestrzeni kosmicznej.',
            rightAsc: 'Współrzędna astronomiczna odpowiadająca długości geograficznej na Ziemi, mierzona w godzinach gwiazdowych.',
            declination: 'Współrzędna astronomiczna odpowiadająca szerokości geograficznej na Ziemi, mierzona na północ (+) lub południe (-) od równika niebieskiego.',
            radiusEarth: 'Promień planety w odniesieniu do promienia Ziemi (R⊕).',
            distSun: 'Średnia odległość od Słońca w jednostkach astronomicznych (AU).',
            distPlanet: 'Średnia odległość od planety macierzystej.',
            orbitSun: 'Czas potrzebny na wykonanie jednego pełnego obiegu wokół Słońca.',
            orbitPlanet: 'Czas potrzebny na wykonanie jednego pełnego obiegu wokół planety macierzystej.',
            axialTilt: 'Kąt między osią obrotu a płaszczyzną orbity.',
            semiMajorAxis: 'Połowa najdłuższej średnicy orbity eliptycznej.',
            eccentricity: 'Stopień odchylenia orbity od kołowości (0 oznacza idealne koło).',
            cometPeriod: 'Czas potrzebny na wykonanie jednego pełnego obiegu komety wokół Słońca.',
            constellationStars: 'Główne gwiazdy tworzące rozpoznawalny zarys gwiazdozbioru.',
            brightestStar: 'Najjaśniejsza gwiazda znajdująca się w tym gwiazdozbiorze.',
            constellationArea: 'Całkowita powierzchnia sfery niebieskiej zajmowana przez gwiazdozbiór (w stopniach kwadratowych).',
            constellationFamily: 'Tradycyjna grupa powiązanych gwiazdozbiorów.'
        },
        resourcesHeader: 'Telemetria i źródła',
        noDescription: 'Brak szczegółowego opisu w bazach telemetrii.',
        audioGuide: 'Słuchaj',
        audioPlaying: 'Odtwarzanie...',
        periodUnits: {
            year: 'lat',
            month: 'mies.',
            day: 'dni'
        }
    },
    popups: {
        trueScaleTitle: 'Rzeczywista skala Układu Słonecznego',
        trueScaleDesc: 'Oglądasz teraz Układ Słoneczny w jego rzeczywistych proporcjach. Planety są renderowane w ich rzeczywistej wielkości względem olbrzymich odległości kosmicznych. Ponieważ kosmos jest w przeważającej mierze pusty, planety wyglądają jak mikroskopijne punkty na tle swoich orbit. Wskaźniki pomagają w ich odnalezieniu.',
        meteorsTitle: 'Meteory',
        meteorsDesc: 'Obserwujesz meteory w pobliżu Ziemi. Meteor to świecący ślad na niebie powstały w wyniku wpadnięcia meteoroidu w ziemską atmosferę z ogromną prędkością. Wskutek tarcia o powietrze ulega on rozgrzaniu i spaleniu, tworząc efekt spadającej gwiazdy.'
    },
    datepicker: {
        months: [
            'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
            'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
        ],
        weekdays: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'],
        bc: 'p.n.e.',
        ad: 'n.e.',
        century: 'Wiek',
        decade: 'Dekada',
        year: 'Rok'
    },
    bodies: {
        Sun: {
            name: 'Słońce',
            description: 'Słońce to gwiazda centralna Układu Słonecznego. Jest niemal idealną kulą gorącej plazmy, rozgrzaną do białości przez reakcje fuzji jądrowej wodoru w hel zachodzące w jej jądrze, emitującą życiodajne światło i ciepło.'
        },
        Mercury: {
            name: 'Merkury',
            description: 'Merkury to najmniejsza i znajdująca się najbliżej Słońca planeta Układu Słonecznego. Jej obieg wokół Słońca trwa zaledwie 87,97 ziemskich dni – najkrócej ze wszystkich planet.'
        },
        Venus: {
            name: 'Wenus',
            description: 'Wenus to druga planeta od Słońca. Posiada najgęstszą atmosferę spośród planet skalistych, składającą się w ponad 96% z dwutlenku węgla, co wywołuje skrajny efekt cieplarniany z temperaturą powierzchni sięgającą 465°C.'
        },
        Earth: {
            name: 'Ziemia',
            description: 'Ziemia to trzecia planeta od Słońca i jedyny znany obiekt we wszechświecie, na którym rozwinęło się życie. Około 71% jej powierzchni pokrywa woda, a przed wiatrem słonecznym chroni ją silne pole magnetyczne.'
        },
        Moon: {
            name: 'Księżyc',
            description: 'Księżyc to jedyny naturalny satelita Ziemi. Jest piątym co do wielkości księżycem w Układzie Słonecznym i największym w stosunku do rozmiarów planety, wokół której krąży.'
        },
        Mars: {
            name: 'Mars',
            description: 'Mars to czwarta planeta od Słońca. Nazywany "Czerwoną Planetą" z powodu tlenków żelaza pokrywających jego powierzchnię, jest domem dla najwyższego wulkanu (Olympus Mons) i najgłębszych kanionów w Układzie Słonecznym.'
        },
        Phobos: {
            name: 'Fobos',
            description: 'Fobos to wewnętrzny i większy z dwóch naturalnych satelitów Marsa. Ma nieregularny kształt i krąży na skrajnie niskiej wysokości nad powierzchnią planety.'
        },
        Deimos: {
            name: 'Deimos',
            description: 'Deimos to mniejszy i zewnętrzny księżyc Marsa, pokryty grubą warstwą regolitu wygładzającą jego kratery uderzeniowe.'
        },
        Jupiter: {
            name: 'Jowisz',
            description: 'Jowisz to piąta planeta od Słońca i największa w Układzie Słonecznym. Ten gazowy olbrzym ma masę ponad dwa i pół razy większą niż wszystkie pozostałe planety razem wzięte oraz słynną Wielką Czerwoną Plamę.'
        },
        Io: {
            name: 'Io',
            description: 'Io to najbardziej wewnętrzny z czterech galileuszowych księżyców Jowisza. Z ponad 400 czynnymi wulkanami jest najbardziej aktywnym geologicznie ciałem w całym Układzie Słonecznym.'
        },
        Europa: {
            name: 'Europa',
            description: 'Europa to najmniejszy z księżyców galileuszowych Jowisza. Pod jej gładką lodową skorupą kryje się ocean ciekłej wody, który może stwarzać warunki do istnienia pozaziemskiego życia.'
        },
        Ganymede: {
            name: 'Ganimedes',
            description: 'Ganimedes to największy i najbardziej masywny księżyc w Układzie Słonecznym, przewyższający rozmiarami planetę Merkury. Jako jedyny znany księżyc generuje własne pole magnetyczne.'
        },
        Callisto: {
            name: 'Kallisto',
            description: 'Kallisto to drugi co do wielkości księżyc Jowisza. Jego pradawna powierzchnia należy do najbardziej pokrytych kraterami obiektów w Układzie Słonecznym.'
        },
        Saturn: {
            name: 'Saturn',
            description: 'Saturn to szósta planeta od Słońca i druga pod względem wielkości. Zasłynął ze swojego spektakularnego i skomplikowanego systemu pierścieni złożonych z cząstek lodu i skał.'
        },
        Mimas: {
            name: 'Mimas',
            description: 'Mimas to księżyc Saturna znany z ogromnego krateru uderzeniowego Herschel, przez który do złudzenia przypomina "Gwiazdę Śmierci".'
        },
        Enceladus: {
            name: 'Enceladus',
            description: 'Enceladus to lodowy księżyc Saturna odbijający niemal 100% światła słonecznego. Na jego biegunie południowym gejzery wyrzucają w przestrzeń kosmiczną pióropusze pary wodnej i cząstek organicznych.'
        },
        Titan: {
            name: 'Tytan',
            description: 'Tytan to największy księżyc Saturna i drugi w Układzie Słonecznym. Jest jedynym znanym księżycem z gęstą atmosferą i stabilnymi powierzchniowymi jeziorami ciekłych węglowodorów.'
        },
        Iapetus: {
            name: 'Japet',
            description: 'Japet to księżyc Saturna wyróżniający się niezwykłym, dwubarwnym ubarwieniem: jedna z jego półkul jest ciemna jak węgiel, a druga jasna jak śnieg.'
        },
        Uranus: {
            name: 'Uran',
            description: 'Uran to siódma planeta od Słońca. Oś obrotu tego lodowego olbrzyma jest nachylona pod kątem aż 97,77 stopnia, przez co planeta zdaje się toczyć po swojej orbicie.'
        },
        Neptune: {
            name: 'Neptun',
            description: 'Neptun to ósma i najdalsza planeta Układu Słonecznego. Błękitny lodowy olbrzym słynie z najpotężniejszych wiatrów w Układzie Słonecznym, przekraczających 2100 km/h.'
        },
        Triton: {
            name: 'Tryton',
            description: 'Tryton to największy księżyc Neptuna i jedyny wielki księżyc w Układzie Słonecznym poruszający się po orbicie wstecznej, przeciwnie do kierunku obrotu planety.'
        },
        Pluto: {
            name: 'Pluton',
            description: 'Pluton to planeta karłowata w Pasie Kuipera za orbitą Neptuna. Był pierwszym i największym odkrytym obiektem w tym odległym lodowym pierścieniu.'
        },
        Charon: {
            name: 'Charon',
            description: 'Charon to największy z pięciu księżyców Plutona. Ze względu na porównywalną masę, Pluton i Charon tworzą unikalny układ podwójny planet karłowatych.'
        },
        Ceres: {
            name: 'Ceres',
            description: 'Ceres to największy obiekt w pasie planetoid między Marsem a Jowiszem i jedyna planeta karłowata położona w wewnętrznym Układzie Słonecznym.'
        },
        Eris: {
            name: 'Eris',
            description: 'Eris to masywna planeta karłowata znajdująca się w dysku rozproszonym za Pasem Kuipera, której odkrycie zapoczątkowało nową definicję planety.'
        },
        Haumea: {
            name: 'Haumea',
            description: 'Haumea to planeta karłowata o wydłużonym, elipsoidalnym kształcie wywołanym niezwykle szybkim obrotem wokół własnej osi (doba trwa poniżej 4 godzin).'
        },
        Makemake: {
            name: 'Makemake',
            description: 'Makemake to lodowata planeta karłowata w Pasie Kuipera, pokryta zamarzniętym metanem i etanem.'
        }
    },
    spacecraft: {
        'Apollo 11': {
            name: 'Apollo 11',
            description: 'Amerykańska misja kosmiczna, podczas której Neil Armstrong i Buzz Aldrin 20 lipca 1969 roku jako pierwsi ludzie w historii postawili stopę na Księżycu.'
        },
        'Sputnik 1': {
            name: 'Sputnik 1',
            description: 'Pierwszy w historii sztuczny satelita Ziemi, wystrzelony przez Związek Radziecki 4 października 1957 roku, inaugurujący erę kosmiczną.'
        },
        'ISS': {
            name: 'Międzynarodowa Stacja Kosmiczna (ISS)',
            description: 'Największe orbitalne laboratorium badawcze na niskiej orbicie okołoziemskiej, wspólne dzieło agencji NASA, Roskosmos, JAXA, ESA i CSA.'
        },
        'Hubble Space Telescope': {
            name: 'Kosmiczny Teleskop Hubble’a',
            description: 'Legendarny teleskop kosmiczny wyniesiony na orbitę w 1990 roku, który zrewolucjonizował naszą wiedzę o wszechświecie i astrofizyce.'
        },
        'Voyager 1': {
            name: 'Voyager 1',
            description: 'Sonda kosmiczna wystrzelona przez NASA w 1977 roku. Jest najodleglejszym od Ziemi obiektem stworzonym przez człowieka, przemierzającym przestrzeń międzygwiezdną.'
        },
        'JWST': {
            name: 'Kosmiczny Teleskop Jamesa Webba (JWST)',
            description: 'Najpotężniejszy teleskop kosmiczny obserwujący wszechświat w podczerwieni z punktu Lagrange’a L2, rejestrujący światło pierwszych galaktyk.'
        },
        'Cassini-Huygens': {
            name: 'Cassini-Huygens',
            description: 'Przełomowa misja kosmiczna badająca układ Saturna, jego pierścienie i niezwykłe księżyce w latach 2004–2017.'
        },
        'Voyager 2': {
            name: 'Voyager 2',
            description: 'Jedyna sonda kosmiczna w dziejach ludzkości, która dotarła w pobliże obydwu lodowych olbrzymów: Urana i Neptuna.'
        }
    },
    comets: {
        "Halley's Comet": {
            name: 'Kometa Halleya',
            description: 'Najsłynniejsza kometa okresowa, powracająca w okolice Ziemi co 75–76 lat, obserwowana przez astronomów od ponad dwóch tysiącleci.'
        },
        'Comet Hale-Bopp': {
            name: 'Kometa Hale’a-Boppa',
            description: 'Jedna z najjaśniejszych i najdłużej obserwowanych komet XX wieku, widoczna gołym okiem przez rekordowe 18 miesięcy.'
        }
    },
    constellations: {
        'Ursa Major': {
            name: 'Wielka Niedźwiedzica (Ursa Major)',
            family: 'Ursa Major',
            description: 'Charakterystyczny gwiazdozbiór nieba północnego, zawierający popularny asteryzm Wielkiego Wozu.'
        },
        'Ursa Minor': {
            name: 'Mała Niedźwiedzica (Ursa Minor)',
            family: 'Ursa Major',
            description: 'Gwiazdozbiór nieba północnego, którego najjaśniejszą gwiazdą jest Gwiazda Polarna (Polaris).'
        },
        'Orion': {
            name: 'Orion (Myśliwy)',
            family: 'Orion',
            description: 'Jeden z najbardziej rozpoznawalnych gwiazdozbiorów nieba zimowego z jasnymi nadolbrzymami Betelgezą i Rigelem.'
        },
        'Cassiopeia': {
            name: 'Kasjopeja',
            family: 'Perseusz',
            description: 'Łatwo dostrzegalny gwiazdozbiór północny w charakterystycznym kształcie litery "W" lub "M".'
        },
        'Cygnus': {
            name: 'Łabędź (Cygnus)',
            family: 'Herkules',
            description: 'Słynny gwiazdozbiór położony w płaszczyźnie Drogi Mlecznej, zawierający Krzyż Północy i gwiazdę Deneb.'
        },
        'Scorpius': {
            name: 'Skorpion (Scorpius)',
            family: 'Zodiak',
            description: 'Wyrazisty zodiakalny gwiazdozbiór nieba południowego z rubinowym nadolbrzymem Antaresem w centrum.'
        },
        'Crux': {
            name: 'Krzyż Południa (Crux)',
            family: 'Wody Niebieskie',
            description: 'Najmniejszy ze wszystkich 88 współczesnych gwiazdozbiorów, kluczowy dla nawigacji na półkuli południowej.'
        },
        'Leo': {
            name: 'Lew (Leo)',
            family: 'Zodiak',
            description: 'Dostojny zodiakalny gwiazdozbiór nieba wiosennego z jasną gwiazdą Regulus.'
        },
        'Gemini': {
            name: 'Bliźnięta (Gemini)',
            family: 'Zodiak',
            description: 'Zodiakalny gwiazdozbiór wyróżniający się dwiema jasnymi gwiazdami: Kastorem i Polluksem.'
        },
        'Taurus': {
            name: 'Byk (Taurus)',
            family: 'Zodiak',
            description: 'Starożytny gwiazdozbiór z gromadami gwiazd Plejady i Hiady oraz czerwonym olbrzymem Aldebaranem.'
        },
        'Canis Major': {
            name: 'Wielki Pies (Canis Major)',
            family: 'Orion',
            description: 'Gwiazdozbiór zawierający Syriusza – najjaśniejszą gwiazdę całego nocnego nieba.'
        }
    },
    stars: {
        'Sirius': {
            name: 'Syriusz',
            description: 'Najjaśniejsza gwiazda nocnego nieba, układ podwójny w gwiazdozbiorze Wielkiego Psa.'
        },
        'Canopus': {
            name: 'Kanopus',
            description: 'Druga pod względem jasności gwiazda nocnego nieba, używana do orientacji sond kosmicznych.'
        },
        'Arcturus': {
            name: 'Arktur',
            description: 'Najjaśniejsza gwiazda północnej sfery niebieskiej, pomarańczowy olbrzym w Wolarzu.'
        },
        'Vega': {
            name: 'Wega',
            description: 'Najjaśniejsza gwiazda w Lutni i pierwsza gwiazda po Słońcu, którą sfotografowano.'
        },
        'Capella': {
            name: 'Kapella',
            description: 'Szósta pod względem jasności gwiazda na niebie, układ poczwórny w gwiazdozbiorze Woźnicy.'
        },
        'Rigel': {
            name: 'Rigel',
            description: 'Błękitno-biały nadolbrzym w Orionie, promieniujący ponad 120 000 razy jaśniej od Słońca.'
        },
        'Procyon': {
            name: 'Procjon',
            description: 'Najjaśniejsza gwiazda Małego Psa, układ podwójny oddalony o zaledwie 11,46 lat świetlnych.'
        },
        'Betelgeuse': {
            name: 'Betelgeza',
            description: 'Czerwony nadolbrzym w Orionie znajdujący się u schyłku swojego życia, który zakończy jako supernowa.'
        },
        'Achernar': {
            name: 'Achernar',
            description: 'Najjaśniejsza gwiazda w Erydanie, spłaszczona przez zawrotną prędkość obrotu wokół własnej osi.'
        },
        'Hadar': {
            name: 'Hadar (Beta Centauri)',
            description: 'Układ potrójny w Centaurze i drugi pod względem jasności punkt świetlny w tym gwiazdozbiorze.'
        },
        'Altair': {
            name: 'Altair',
            description: 'Najjaśniejsza gwiazda w Orle, wirująca wokół własnej osi z ogromną prędkością.'
        },
        'Acrux': {
            name: 'Acrux',
            description: 'Najjaśniejsza gwiazda w Krzyżu Południa, układ wielokrotny oddalony o 320 lat świetlnych.'
        },
        'Aldebaran': {
            name: 'Aldebaran',
            description: 'Pomarańczowy olbrzym w Byku, stanowiący płomienne oko Byka, najjaśniejsza gwiazda gwiazdozbioru.'
        },
        'Spica': {
            name: 'Kłos (Spica)',
            description: 'Najjaśniejsza gwiazda w Pannie, spektroskopowo podwójna gwiazda zmienna.'
        },
        'Antares': {
            name: 'Antares',
            description: 'Czerwony nadolbrzym i serce Skorpiona, jedna z największych gwiazd widocznych gołym okiem.'
        },
        'Pollux': {
            name: 'Polluks',
            description: 'Pomarańczowy olbrzym w Bliźniętach, wokół którego krąży potwierdzona planeta pozasłoneczna.'
        },
        'Fomalhaut': {
            name: 'Fomalhaut',
            description: 'Najjaśniejsza gwiazda w Rybie Południowej, słynąca z dysku pyłowego przypominającego "Oko Saurona".'
        },
        'Deneb': {
            name: 'Deneb',
            description: 'Błękitno-biały nadolbrzym w Łabędziu, jedna z najjaśniejszych absolutnie znanych gwiazd Galaktyki.'
        },
        'Regulus': {
            name: 'Regulus',
            description: 'Najjaśniejsza gwiazda w Lwie stanowiąca serce Lwa, poczwórny układ gwiezdny.'
        },
        'Polaris': {
            name: 'Gwiazda Polarna (Polaris)',
            description: 'Gwiazda znajdująca się niemal dokładnie na północnym biegunie niebieskim, od wieków służąca nawigatorom.'
        }
    }
};
