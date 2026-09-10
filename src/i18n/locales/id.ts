import { TranslationSchema } from '../types';

export const id: TranslationSchema = {
    ui: {
        simDate: '⏱ WAKTU SIMULASI:',
        radarToggle: 'Alihkan Radar Minimap (M)',
        controlsToggle: 'Alihkan Kontrol Simulasi',
        languageToggle: 'Ganti Bahasa',
        orbiting: '(mengorbit {planet})',
        jumpToDate: 'Lompat ke Tanggal Aktif ({date})',
        close: 'Tutup',
        help: 'Bantuan',
        audioAmbience: 'Ambien Audio Kosmik (S)',
        audioAmbienceAria: 'Alihkan audio kosmik',
        telemetry: 'Telemetri Kinerja (P)',
        telemetryAria: 'Alihkan telemetri mesin',
        keyboardShortcuts: 'Pintasan Keyboard (? / H)',
        keyboardShortcutsAria: 'Lihat pintasan keyboard',
        astrophotography: 'Tangkapan Astrofotografi (K)',
        astrophotographyAria: 'Ambil tangkapan layar resolusi tinggi',
        speedPause: 'Klik untuk Jeda / Lanjutkan (Spasi)',
        utcTime: 'Waktu Universal (UTC)',
        liveRealTime: 'Waktu Nyata Fisik Aktif (1:1)'
    },
    categories: {
        star: '🌟 Bintang',
        planet: '🪐 Planet',
        moon: '🌕 Bulan / Satelit',
        constellation: '🌌 Rasi Bintang',
        comet: '☄️ Komet',
        spacecraft: '🛰️ Wahana Antariksa'
    },
    controls: {
        simulationFolder: 'Simulasi',
        environmentFolder: 'Lingkungan',
        cameraFolder: 'Kontrol Kamera',
        toolsFolder: 'Alat',
        realisticScale: 'Skala Realistis',
        showMinimap: 'Tampilkan Minimap',
        timeSpeed: 'Kecepatan Waktu',
        speedPreset: 'Preset Kecepatan',
        speedPresets: {
            realTime: 'Waktu Nyata (1:1)',
            oneHourPerSec: '1 jam / dtk',
            oneDayPerSec: '1 hari / dtk (Realistis)',
            oneWeekPerSec: '1 minggu / dtk',
            oneMonthPerSec: '1 bulan / dtk',
            paused: 'Jeda',
            custom: 'Kustom'
        },
        pause: 'Jeda',
        resume: 'Lanjutkan',
        showOrbits: 'Tampilkan Orbit',
        showMoons: 'Tampilkan Satelit',
        showAsteroids: 'Tampilkan Asteroid',
        showKuiperBelt: 'Tampilkan Sabuk Kuiper',
        showDwarfPlanets: 'Tampilkan Planet Kerdil',
        showComets: 'Tampilkan Komet',
        showSpacecraft: 'Tampilkan Wahana Antariksa',
        showMeteors: 'Tampilkan Meteor',
        showTrails: 'Tampilkan Jejak Orbit',
        habitableZone: 'Zona Layak Huni',
        eclipticGrid: 'Kisi Ekliptika',
        enableBloom: 'Aktifkan Efek Cahaya (Bloom)',
        realisticLighting: 'Pencahayaan Realistis',
        showAxes: 'Tampilkan Sumbu',
        attachCamera: 'Kunci Kamera ke Objek',
        viewFromSurface: 'Pandangan dari Permukaan',
        freeCamera: 'Kamera Bebas',
        measureDistance: 'Ukur Jarak',
        cinematicTour: 'Tur Sinematik',
        tourSpeed: 'Kecepatan Tur',
        tooltips: {
            pauseResume: 'Klik untuk menjeda atau melanjutkan waktu simulasi (atau tekan Spasi).',
            speedPreset: 'Pilih laju waktu astronomis realistis standar atau kecepatan kustom.',
            timeSpeed: 'Sesuaikan laju waktu simulasi. 1 hari/dtk adalah kecepatan pengamatan realistis yang terkalibrasi.',
            realisticScale: 'Mengalihkan ke jarak orbit realistis dan menyesuaikan ukuran benda langit sesuai skala jarak astronomis sebenarnya.',
            showTrails: 'Menampilkan jejak lintasan orbit di belakang benda langit saat bergerak.',
            habitableZone: 'Wilayah di sekitar bintang di mana suhu memungkinkan air berbentuk cair di permukaan planet.',
            eclipticGrid: 'Kisi koordinat yang mewakili bidang orbit Bumi mengelilingi Matahari.',
            enableBloom: 'Efek pasca-pemrosesan yang membuat objek terang berpendar berkilau.',
            realisticLighting: 'Menggunakan rendering berbasis fisik untuk mensimulasikan interaksi cahaya realistis pada permukaan planet.',
            showAxes: 'Menampilkan sumbu koordinat X (merah), Y (hijau), dan Z (biru) untuk orientasi spasial.',
            measureDistance: 'Aktifkan Pengukuran Jarak, lalu klik dua benda langit di adegan 3D untuk mengukur jarak di antara keduanya.'
        }
    },
    modal: {
        badges: {
            celestialBody: 'BENDA LANGIT',
            missionDossier: 'BERKAS MISI',
            cometTelemetry: 'TELEMETRI KOMET',
            constellation: 'RASI BINTANG',
            stellarDossier: 'BERKAS BINTANG',
            lunarTelemetry: 'TELEMETRI SATELIT',
            stellarCore: 'INTI BINTANG',
            planetaryDossier: 'BERKAS PLANET'
        },
        labels: {
            type: 'Tipe',
            radius: 'Jari-jari',
            distance: 'Jarak',
            period: 'Periode Orbit',
            axialTilt: 'Kemiringan Sumbu',
            semiMajorAxis: 'Sumbu Semi-Mayor',
            eccentricity: 'Eksentrisitas',
            rightAsc: 'Asensio Rekta',
            declination: 'Deklinasi',
            stars: 'Bintang Utama',
            brightest: 'Terterang',
            area: 'Luas Area',
            family: 'Keluarga',
            spacecraftType: 'Wahana Antariksa'
        },
        tooltipTitles: {
            spacecraft: 'Wahana Antariksa',
            rightAsc: 'Asensio Rekta (RA)',
            declination: 'Deklinasi (Dec)',
            radius: 'Jari-jari',
            distance: 'Jarak Orbit',
            semiMajorAxis: 'Sumbu Semi-Mayor',
            eccentricity: 'Eksentrisitas',
            period: 'Periode Orbit',
            axialTilt: 'Kemiringan Sumbu',
            stars: 'Bintang Utama',
            brightest: 'Bintang Terterang',
            area: 'Luas Area',
            family: 'Keluarga Rasi Bintang'
        },
        tooltips: {
            spacecraft: 'Kendaraan buatan yang dirancang untuk beroperasi di luar angkasa.',
            rightAsc: 'Koordinat langit yang setara dengan garis bujur di Bumi, diukur dalam jam sideris.',
            declination: 'Koordinat langit yang setara dengan garis lintang di Bumi, diukur ke utara (+) atau selatan (-) khatulistiwa langit.',
            radiusEarth: 'Jari-jari planet relatif terhadap Bumi.',
            distSun: 'Jarak rata-rata dari Matahari dalam Satuan Astronomi (AU).',
            distPlanet: 'Jarak rata-rata dari planet induk.',
            orbitSun: 'Waktu yang dibutuhkan untuk menyelesaikan satu orbit penuh mengelilingi Matahari.',
            orbitPlanet: 'Waktu yang dibutuhkan untuk menyelesaikan satu orbit penuh mengelilingi planet induk.',
            axialTilt: 'Sudut antara sumbu rotasi dan bidang orbit.',
            semiMajorAxis: 'Setengah dari diameter terpanjang orbit elips.',
            eccentricity: 'Penyimpangan orbit dari bentuk lingkaran (0 adalah lingkaran sempurna).',
            cometPeriod: 'Waktu yang dibutuhkan komet untuk satu revolusi mengelilingi Matahari.',
            constellationStars: 'Jumlah bintang utama pembentuk pola asterisma.',
            brightestStar: 'Bintang paling bercahaya dalam rasi bintang ini.',
            constellationArea: 'Total area kubah langit yang dicakup oleh rasi bintang ini.',
            constellationFamily: 'Pengelompokan rasi bintang menurut tradisi astronomi.'
        },
        resourcesHeader: 'Telemetri & Sumber Daya',
        noDescription: 'Tidak ada deskripsi terperinci yang tersedia dalam basis data telemetri.',
        audioGuide: 'Dengarkan',
        audioPlaying: 'Memutar...',
        audioGuideTitle: 'Narasi Panduan Audio',
        audioGuideStop: 'Hentikan Narasi',
        audioGuideAria: 'Dengarkan panduan audio langit',
        audioGuidePlayingAria: 'Hentikan narasi panduan audio',
        prevImageAria: 'Gambar sebelumnya',
        nextImageAria: 'Gambar berikutnya',
        periodUnits: {
            year: 'thn',
            month: 'bln',
            day: 'hr'
        }
    },
    shortcuts: {
        title: 'Pintasan Keyboard Observatorium',
        navTitle: 'Navigasi & Fokus Cepat',
        mercuryToNeptune: 'Merkurius ke Neptunus',
        pluto: 'Pluto (Planet Kerdil)',
        sun: 'Matahari (Inti Surya)',
        resetView: 'Skala Nyata / Atur Ulang Tampilan',
        timeTitle: 'Waktu & Simulasi',
        pauseResume: 'Jeda / Lanjutkan Simulasi',
        warpSpeed: 'Kurangi / Tambah Kecepatan Simulasi',
        cinematicTour: 'Tur Sinematik Berpemandu',
        toolsTitle: 'Lapisan Langit & Alat',
        orbits: 'Alihkan Orbit Planet',
        minimap: 'Alihkan Radar Minimap',
        constellations: 'Alihkan Rasi Bintang',
        audio: 'Alihkan Ambien Audio Kosmik',
        telemetry: 'Alihkan HUD Telemetri',
        snapshot: 'Tangkapan Astrofotografi',
        fullscreen: 'Tampilan Layar Penuh',
        help: 'Buka Panduan Pintasan Ini',
        esc: 'Tutup Dialog / Lepaskan Target'
    },
    popups: {
        trueScaleTitle: 'Skala Sebenarnya Tata Surya',
        trueScaleDesc: 'Anda sekarang melihat Tata Surya pada skala sejatinya. Planet-planet dirender pada ukuran fisik sebenarnya relatif terhadap jarak antariksa yang luar biasa luas. Karena ruang angkasa sebagian besar hampa, planet akan terlihat sangat kecil bagaikan titik dibandingkan orbitnya. Penunjuk telah diaktifkan untuk membantu menemukan lokasinya.',
        meteorsTitle: 'Meteor',
        meteorsDesc: 'Anda sekarang mengamati fenomena meteor di dekat Bumi. Meteor adalah kilatan cahaya di langit yang terjadi saat meteoroid menabrak atmosfer Bumi dengan kecepatan tinggi. Gesekan dengan udara menyebabkannya memanas dan terbakar menjadi kilatan cahaya yang menakjubkan.'
    },
    datepicker: {
        months: [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ],
        weekdays: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        bc: 'SM',
        ad: 'M',
        century: 'Abad',
        decade: 'Dekade',
        year: 'Tahun',
        historicalEvents: 'Peristiwa Bersejarah...'
    },
    loading: {
        boot: 'Memulai Observatorium',
        subtitle: 'Observatorium Astronomi Luar Angkasa',
        core: 'MENGINISIALISASI INTI OBSERVATORIUM...',
        ephemerides: 'MENGKALIBRASI EFEMERIS BENDA LANGIT...',
        surfaces: 'MENSINTESIS PERMUKAAN PLANET...',
        controls: 'MENGONFIGURASI KONTROL OBSERVATORIUM...',
        acquiring: 'MEMPEROLEH ASTROFOTOGRAFI RESOLUSI TINGGI...',
        calibrating: 'MENGKALIBRASI SHADER ATMOSFER...',
        streaming: 'MEMUAT TEKSTUR LUAR ANGKASA...',
        synchronizing: 'MENYELARASKAN ORBIT LANGIT...',
        loaded: 'ASET TELAH DIMUAT',
        ready: 'SISTEM BEROPERASI • OBSERVATORIUM SIAP',
        standby: 'SIAGA',
        connecting: 'MENGHUBUNGKAN',
        assets: 'ASET',
        online: 'ONLINE',
        tagBoot: 'BOOT',
        tagCalibrating: 'KALIBRASI',
        tagSynthesizing: 'SINTESIS',
        tagConfiguring: 'KONFIGURASI'
    },
    bodies: {
        Sun: {
            name: 'Matahari',
            description: 'Matahari adalah bintang di pusat Tata Surya. Bola plasma panas yang hampir bulat sempurna ini menghasilkan energi melalui fusi nuklir hidrogen menjadi helium di intinya, memancarkan cahaya dan radiasi panas yang menopang kehidupan di Bumi.'
        },
        Mercury: {
            name: 'Merkurius',
            description: 'Merkurius adalah planet terkecil di Tata Surya dan yang paling dekat dengan Matahari. Orbitnya mengelilingi Matahari hanya berlangsung 87,97 hari Bumi, tercepat di antara semua planet.'
        },
        Venus: {
            name: 'Venus',
            description: 'Venus adalah planet kedua dari Matahari. Memiliki atmosfer terpadat di antara planet kebumian yang terdiri lebih dari 96% karbon dioksida, menghasilkan efek rumah kaca ekstrem dengan suhu permukaan mencapai 465°C.'
        },
        Earth: {
            name: 'Bumi',
            description: 'Bumi adalah planet ketiga dari Matahari dan satu-satunya objek astronomi yang diketahui menampung kehidupan. Sekitar 71% permukaannya tertutup air dan dilindungi oleh magnetosfer yang kuat.'
        },
        Moon: {
            name: 'Bulan',
            description: 'Bulan adalah satu-satunya satelit alami Bumi. Merupakan satelit terbesar kelima di Tata Surya dan terbesar relatif terhadap ukuran planet induknya.'
        },
        Mars: {
            name: 'Mars',
            description: 'Mars adalah planet keempat dari Matahari dan planet terkecil kedua di Tata Surya. Disebut "Planet Merah" karena limpahan besi oksida di permukaannya, Mars memiliki gunung berapi terbesar (Olympus Mons) dan ngarai terdalam di Tata Surya.'
        },
        Phobos: {
            name: 'Phobos',
            description: 'Phobos adalah satelit alami terdalam dan terbesar dari dua bulan Mars. Berbentuk tidak beraturan dan mengorbit sangat dekat dengan permukaan Mars.'
        },
        Deimos: {
            name: 'Deimos',
            description: 'Deimos adalah satelit alami terluar dan lebih kecil dari Mars. Memiliki permukaan berkawah halus tertutup lapisan regolit tebal.'
        },
        Jupiter: {
            name: 'Yupiter',
            description: 'Yupiter adalah planet kelima dari Matahari dan yang terbesar di Tata Surya. Raksasa gas ini memiliki massa lebih dari dua setengah kali massa semua planet lain digabungkan dan memiliki Bintik Merah Raksasa legendaris.'
        },
        Io: {
            name: 'Io',
            description: 'Io adalah satelit terdekat dari empat bulan Galileo Yupiter. Dengan lebih dari 400 gunung berapi aktif, Io adalah objek paling aktif secara geologis di seluruh Tata Surya.'
        },
        Europa: {
            name: 'Europa',
            description: 'Europa adalah satelit Galileo terkecil yang mengorbit Yupiter. Permukaannya tersusun dari lapisan es halus dengan lautan air cair bawah tanah yang menjadi target utama pencarian kehidupan luar angkasa.'
        },
        Ganymede: {
            name: 'Ganimede',
            description: 'Ganimede adalah bulan terbesar dan paling masif di Tata Surya, bahkan lebih besar daripada planet Merkurius. Merupakan satu-satunya bulan yang memiliki medan magnet internal sendiri.'
        },
        Callisto: {
            name: 'Kalisto',
            description: 'Kalisto adalah bulan terbesar kedua Yupiter. Permukaannya merupakan salah satu bentang alam paling purba dan paling penuh kawah di Tata Surya.'
        },
        Saturn: {
            name: 'Saturnus',
            description: 'Saturnus adalah planet keenam dari Matahari dan terbesar kedua di Tata Surya. Sangat terkenal karena sistem cincin spektakuler yang membentang ribuan kilometer namun hanya setebal beberapa puluh meter.'
        },
        Mimas: {
            name: 'Mimas',
            description: 'Mimas adalah bulan Saturnus yang terkenal dengan kawah tabrakan raksasa Herschel, membuatnya menyerupai stasiun luar angkasa "Death Star".'
        },
        Enceladus: {
            name: 'Enseladus',
            description: 'Enseladus adalah bulan es Saturnus yang memantulkan hampir 100% sinar matahari. Di kutub selatannya terdapat geiser kriovulkanik aktif yang menyemburkan uap air dan senyawa organik ke ruang angkasa.'
        },
        Titan: {
            name: 'Titan',
            description: 'Titan adalah bulan terbesar Saturnus dan terbesar kedua di Tata Surya. Merupakan satu-satunya bulan dengan atmosfer tebal dan cairan stabil berupa danau hidrokarbon di permukaannya.'
        },
        Iapetus: {
            name: 'Iapetus',
            description: 'Iapetus adalah bulan Saturnus yang unik dengan kontras dua warna dramatis: satu belahan gelap pekat bagai batu bara dan belahan lainnya terang cemerlang bagai salju.'
        },
        Uranus: {
            name: 'Uranus',
            description: 'Uranus adalah planet ketujuh dari Matahari. Raksasa es ini memiliki keunikan poros rotasi yang miring ekstrem sebesar 97,77 derajat, berotasi seolah menggelinding di bidang orbitnya.'
        },
        Neptune: {
            name: 'Neptunus',
            description: 'Neptunus adalah planet kedelapan dan terjauh di Tata Surya. Raksasa es berwarna biru pekat ini memiliki angin terkuat di Tata Surya dengan kecepatan melampaui 2.100 km/jam.'
        },
        Triton: {
            name: 'Triton',
            description: 'Triton adalah satelit terbesar Neptunus dan satu-satunya bulan besar di Tata Surya yang mengorbit secara retrograd (berlawanan arah dengan rotasi planet induknya).'
        },
        Pluto: {
            name: 'Pluto',
            description: 'Pluto adalah planet kerdil di Sabuk Kuiper. Merupakan objek pertama dan terbesar yang ditemukan di wilayah Sabuk Kuiper di luar orbit Neptunus.'
        },
        Charon: {
            name: 'Karon',
            description: 'Karon adalah satelit terbesar dari lima satelit alami Pluto. Ukurannya yang besar relatif terhadap Pluto membuat keduanya sering dianggap sebagai sistem planet kerdil biner.'
        },
        Ceres: {
            name: 'Ceres',
            description: 'Ceres adalah objek terbesar di sabuk asteroid antara Mars dan Yupiter, serta satu-satunya planet kerdil yang berada di Tata Surya bagian dalam.'
        },
        Eris: {
            name: 'Eris',
            description: 'Eris adalah salah satu planet kerdil paling masif di Tata Surya, terletak di piringan tersebar di luar Sabuk Kuiper.'
        },
        Haumea: {
            name: 'Haumea',
            description: 'Haumea adalah planet kerdil berbentuk elipsoid memanjang akibat rotasinya yang luar biasa cepat, menyelesaikan satu putaran dalam waktu kurang dari 4 jam.'
        },
        Makemake: {
            name: 'Makemake',
            description: 'Makemake adalah planet kerdil di Sabuk Kuiper dengan permukaan sangat dingin yang dilapisi metana dan etana beku.'
        }
    },
    spacecraft: {
        'Apollo 11': {
            name: 'Apollo 11',
            description: 'Misi luar angkasa Amerika Serikat yang pertama kali mendaratkan manusia di Bulan pada 20 Juli 1969, dipimpin oleh Neil Armstrong dan Buzz Aldrin.'
        },
        'Sputnik 1': {
            name: 'Sputnik 1',
            description: 'Satelit buatan pertama di dunia yang diluncurkan oleh Uni Soviet pada 4 Oktober 1957, menandai dimulainya Era Antariksa manusia.'
        },
        'ISS': {
            name: 'Stasiun Luar Angkasa Internasional (ISS)',
            description: 'Laboratorium penelitian modular terbesar di orbit rendah Bumi, hasil kolaborasi multinasional antara NASA, Roscosmos, JAXA, ESA, dan CSA.'
        },
        'ISS (International Space Station)': {
            name: 'Stasiun Luar Angkasa Internasional (ISS)',
            description: 'Laboratorium penelitian modular terbesar di orbit rendah Bumi, hasil kolaborasi multinasional antara NASA, Roscosmos, JAXA, ESA, dan CSA.'
        },
        'Hubble Space Telescope': {
            name: 'Teleskop Luar Angkasa Hubble',
            description: 'Teleskop luar angkasa legendaris yang diluncurkan pada tahun 1990 dan terus beroperasi, merevolusi pemahaman astronomi modern tentang alam semesta.'
        },
        'Voyager 1': {
            name: 'Voyager 1',
            description: 'Wahana penjelajah antariksa NASA yang diluncurkan pada 1977. Merupakan objek buatan manusia terjauh dari Bumi yang kini menjelajahi ruang antarbintang.'
        },
        'JWST': {
            name: 'Teleskop Luar Angkasa James Webb (JWST)',
            description: 'Teleskop astronomi inframerah paling canggih yang mengorbit titik Lagrange L2 Matahari-Bumi, mampu mengamati galaksi-galaksi terawal di alam semesta.'
        },
        'James Webb Space Telescope': {
            name: 'Teleskop Luar Angkasa James Webb (JWST)',
            description: 'Teleskop astronomi inframerah paling canggih yang mengorbit titik Lagrange L2 Matahari-Bumi, mampu mengamati galaksi-galaksi terawal di alam semesta.'
        },
        'Cassini-Huygens': {
            name: 'Cassini-Huygens',
            description: 'Misi wahana antariksa eksplorasi sistem Saturnus yang mempelajari cincin, atmosfer, dan bulan-bulan Saturnus secara mendalam antara 2004 dan 2017.'
        },
        'Cassini': {
            name: 'Cassini-Huygens',
            description: 'Misi wahana antariksa eksplorasi sistem Saturnus yang mempelajari cincin, atmosfer, dan bulan-bulan Saturnus secara mendalam antara 2004 dan 2017.'
        },
        'Voyager 2': {
            name: 'Voyager 2',
            description: 'Satu-satunya wahana antariksa yang pernah mengunjungi kedua raksasa es Tata Surya: Uranus dan Neptunus.'
        }
    },
    comets: {
        "Halley's Comet": {
            name: 'Komet Halley',
            description: 'Komet periodik paling terkenal yang kembali mendekati Bumi setiap 75–76 tahun, telah tercatat dalam sejarah pengamatan astronomi selama lebih dari dua milenium.'
        },
        'Comet Hale-Bopp': {
            name: 'Komet Hale-Bopp',
            description: 'Salah satu komet paling terang dan paling banyak diamati pada abad ke-20, dapat terlihat dengan mata telanjang selama rekor 18 bulan berturut-turut.'
        },
        'Hale-Bopp': {
            name: 'Komet Hale-Bopp',
            description: 'Salah satu komet paling terang dan paling banyak diamati pada abad ke-20, dapat terlihat dengan mata telanjang selama rekor 18 bulan berturut-turut.'
        }
    },
    constellations: {
        'Ursa Major': {
            name: 'Ursa Mayor (Beruang Besar)',
            family: 'Ursa Major',
            description: 'Rasi bintang belahan utara yang memuat asterisma terkenal Biduk Besar (Big Dipper).'
        },
        'Ursa Major (Big Dipper)': {
            name: 'Ursa Mayor (Beruang Besar)',
            family: 'Ursa Major',
            description: 'Rasi bintang belahan utara yang memuat asterisma terkenal Biduk Besar (Big Dipper).'
        },
        'Ursa Minor': {
            name: 'Ursa Minor (Beruang Kecil)',
            family: 'Ursa Major',
            description: 'Rasi bintang utara yang memuat Polaris (Bintang Kutub Utara), pemandu navigasi maritim sepanjang zaman.'
        },
        'Ursa Minor (Little Dipper)': {
            name: 'Ursa Minor (Beruang Kecil)',
            family: 'Ursa Major',
            description: 'Rasi bintang utara yang memuat Polaris (Bintang Kutub Utara), pemandu navigasi maritim sepanjang zaman.'
        },
        'Orion': {
            name: 'Orion (Sang Pemburu)',
            family: 'Orion',
            description: 'Salah satu rasi bintang paling menonjol dan mudah dikenali di langit malam, memuat bintang maharaksasa Betelgeuse dan Rigel.'
        },
        'Cassiopeia': {
            name: 'Kasiopia',
            family: 'Perseus',
            description: 'Rasi bintang utara yang khas berbentuk huruf "W" atau "M" yang terbentuk dari lima bintang terang.'
        },
        'Cygnus': {
            name: 'Cygnus (Sang Angsa)',
            family: 'Hercules',
            description: 'Rasi bintang ikonik di sepanjang bidang Bima Sakti, memuat asterisma Salib Utara dan bintang maharaksasa Deneb.'
        },
        'Cygnus (The Swan)': {
            name: 'Cygnus (Sang Angsa)',
            family: 'Hercules',
            description: 'Rasi bintang ikonik di sepanjang bidang Bima Sakti, memuat asterisma Salib Utara dan bintang maharaksasa Deneb.'
        },
        'Scorpius': {
            name: 'Scorpius (Kalajengking)',
            family: 'Zodiak',
            description: 'Rasi bintang zodiak megah di langit selatan dengan bintang maharaksasa merah Antares sebagai jantungnya.'
        },
        'Crux': {
            name: 'Crux (Pari / Salib Selatan)',
            family: 'Perairan Langit',
            description: 'Rasi bintang terkecil dari 88 rasi modern, menjadi penunjuk arah selatan sejati yang sangat penting bagi navigasi maritim Nusantara.'
        },
        'Crux (Southern Cross)': {
            name: 'Crux (Pari / Salib Selatan)',
            family: 'Perairan Langit',
            description: 'Rasi bintang terkecil dari 88 rasi modern, menjadi penunjuk arah selatan sejati yang sangat penting bagi navigasi maritim Nusantara.'
        },
        'Leo': {
            name: 'Leo (Singa)',
            family: 'Zodiak',
            description: 'Rasi bintang zodiak agung yang mudah dikenali melalui pola sabit dan bintang terang Regulus.'
        },
        'Gemini': {
            name: 'Gemini (Si Kembar)',
            family: 'Zodiak',
            description: 'Rasi bintang zodiak yang ditandai oleh dua bintang terang kembar: Castor dan Pollux.'
        },
        'Taurus': {
            name: 'Taurus (Banteng)',
            family: 'Zodiak',
            description: 'Rasi bintang kuno yang memuat gugus bintang Pleiades dan Hyades di dekat bintang raksasa merah Aldebaran.'
        },
        'Canis Major': {
            name: 'Canis Major (Anjing Besar)',
            family: 'Orion',
            description: 'Rasi bintang yang memuat Sirius, bintang paling terang di seluruh langit malam Bumi.'
        }
    },
    stars: {
        'Sirius': {
            name: 'Sirius',
            description: 'Bintang paling terang di langit malam Bumi, merupakan sistem bintang biner di rasi Canis Major.'
        },
        'Canopus': {
            name: 'Kanopus',
            description: 'Bintang paling terang kedua di langit malam, sering digunakan sebagai acuan navigasi pesawat antariksa.'
        },
        'Arcturus': {
            name: 'Arcturus',
            description: 'Bintang paling terang di belahan langit utara, raksasa oranye di rasi Boötes.'
        },
        'Vega': {
            name: 'Vega',
            description: 'Bintang paling terang di rasi Lyra, bintang pertama selain Matahari yang pernah difoto oleh manusia.'
        },
        'Capella': {
            name: 'Kapela',
            description: 'Sistem empat bintang di rasi Auriga dan bintang paling terang keenam di langit malam.'
        },
        'Rigel': {
            name: 'Rigel',
            description: 'Bintang maharaksasa biru-putih di rasi Orion, memancarkan kecerahan lebih dari 120.000 kali Matahari kita.'
        },
        'Procyon': {
            name: 'Procyon',
            description: 'Bintang paling terang di rasi Canis Minor, sistem biner berjarak hanya 11,46 tahun cahaya dari Bumi.'
        },
        'Betelgeuse': {
            name: 'Betelgeuse',
            description: 'Maharaksasa merah semireguler di rasi Orion yang berada di tahap akhir evolusi bintang dan akan meledak sebagai supernova.'
        },
        'Achernar': {
            name: 'Achernar',
            description: 'Bintang paling terang di rasi Eridanus, dikenal dengan kecepatan rotasi luar biasa cepat yang membuatnya pipih.'
        },
        'Hadar': {
            name: 'Hadar (Beta Centauri)',
            description: 'Sistem tiga bintang di rasi Centaurus dan titik cahaya kedua paling terang di rasi tersebut.'
        },
        'Altair': {
            name: 'Altair',
            description: 'Bintang paling terang di rasi Aquila yang berotasi sangat cepat pada ekuatornya.'
        },
        'Acrux': {
            name: 'Acrux',
            description: 'Bintang paling terang di rasi Crux (Pari / Salib Selatan), sistem multi-bintang berjarak 320 tahun cahaya.'
        },
        'Aldebaran': {
            name: 'Aldebaran',
            description: 'Bintang raksasa merah di rasi Taurus yang tampak bagai mata berapi sang Banteng.'
        },
        'Spica': {
            name: 'Spika',
            description: 'Bintang paling terang di rasi Virgo, merupakan bintang biner spektroskopik variabel.'
        },
        'Antares': {
            name: 'Antares',
            description: 'Maharaksasa merah yang menjadi jantung rasi Scorpius, salah satu bintang terbesar yang terlihat dengan mata telanjang.'
        },
        'Pollux': {
            name: 'Poluks',
            description: 'Bintang raksasa oranye di rasi Gemini yang memiliki planet ekstrasurya raksasa yang terkonfirmasi.'
        },
        'Fomalhaut': {
            name: 'Fomalhaut',
            description: 'Bintang terang di Piscis Austrinus yang terkenal memiliki piringan debu sirkumstelat menyerupai "Mata Sauron".'
        },
        'Deneb': {
            name: 'Deneb',
            description: 'Maharaksasa biru-putih di rasi Cygnus, salah satu bintang dengan luminositas intrinsik terbesar yang terlihat dari Bumi.'
        },
        'Regulus': {
            name: 'Regulus',
            description: 'Bintang paling terang di rasi Leo yang merupakan sistem empat bintang berotasi sangat cepat.'
        },
        'Polaris': {
            name: 'Polaris (Bintang Kutub)',
            description: 'Bintang Kutub Utara yang terletak tepat di atas poros rotasi langit utara Bumi, pemandu navigasi purba.'
        }
    }
};
