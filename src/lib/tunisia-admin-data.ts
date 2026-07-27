// Auto-generated from Open Admin Data (CC-BY-4.0)
// https://github.com/open-admin-data/tunisia-administrative-divisions
// 24 governorates, 264 delegations

export const tunisianGovernorates = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Kef",
  "Siliana",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Gabès",
  "Médenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kebili"
] as const

export type TunisianGovernorate = (typeof tunisianGovernorates)[number]

export const delegationByGovernorate: Record<TunisianGovernorate, readonly string[]> = {
  "Sousse": [
    "Akouda",
    "Bouficha",
    "Enfidha",
    "Hammam Sousse",
    "Hergla",
    "Kalaa Kebira",
    "Kalaa Sghira",
    "Kondar",
    "M'Saken",
    "Sidi Bou Ali",
    "Sidi El Heni",
    "Sousse Jaouhara",
    "Sousse Médina",
    "Sousse Riadh",
    "Sousse Sidi Abdelhamid",
    "Zaouia Ksiba Thraya"
  ],
  "Monastir": [
    "Bekalta",
    "Bembla",
    "Beni Hassen",
    "Jammel",
    "Ksar Hellal",
    "Ksibet El Mediouni",
    "Moknine",
    "Monastir",
    "Ouerdanine",
    "Sahline",
    "Sayada-Lamta-Bou Hjar",
    "Teboulba",
    "Zeramdine"
  ],
  "Mahdia": [
    "Boumerdès",
    "Chebba",
    "Chorbane",
    "El Jem",
    "Hbira",
    "Ksour Essef",
    "Mahdia",
    "Melloulech",
    "Ouled Chamekh",
    "Sidi Alouane",
    "Souassi"
  ],
  "Sfax": [
    "Agareb",
    "Bir Ali Ben Khélifa",
    "El Amra",
    "El Ghraiba",
    "Hencha",
    "Jebeniana",
    "Kerkennah",
    "Mahres",
    "Menzel Chaker",
    "Sakiet Eddaier",
    "Sakiet Ezzit",
    "Sfax Médina",
    "Sfax Ouest",
    "Sfax Sud",
    "Skhira",
    "Thyna"
  ],
  "Kairouan": [
    "Alaa",
    "Bouhajla",
    "Chebika",
    "Chrarda",
    "Haffouz",
    "Hajeb El Ayoun",
    "Kairouan Nord",
    "Kairouan Sud",
    "Nasrallah",
    "Oueslatia",
    "Sbikha"
  ],
  "Kasserine": [
    "Ayoun",
    "Ezzouhour",
    "Feriana",
    "Foussana",
    "Hassi El Ferid",
    "Hidra",
    "Jedeliane",
    "Kasserine Nord",
    "Kasserine Sud",
    "Majel Belabbes",
    "Sbeitla",
    "Sbiba",
    "Thala"
  ],
  "Sidi Bouzid": [
    "Bir El Hfay",
    "Jelma",
    "Mazzouna",
    "Meknassi",
    "Menzel Bouzaiene",
    "Ouled Haffouz",
    "Regueb",
    "Sabalat Ouled Asker",
    "Sidi Ali Ben Aoun",
    "Sidi Bouzid Est",
    "Sidi Bouzid Ouest",
    "Souk Jedid"
  ],
  "Tunis": [
    "Bab Bhar",
    "Bab Souika",
    "Bardo",
    "Carthage",
    "Cité El Khadra",
    "El Menzah",
    "El Ouardia",
    "El Tahrir",
    "Ezzouhour",
    "Hrairia",
    "Jebel Jelloud",
    "Kabaria",
    "La Goulette",
    "La Marsa",
    "Le Kram",
    "Médina",
    "Omrane",
    "Omrane Supérieur",
    "Sidi El Béchir",
    "Sidi Hassine",
    "Sijoumi"
  ],
  "Ariana": [
    "Ariana Médina",
    "Ettadhamen",
    "Kalaat El Andalous",
    "Mnihla",
    "Raoued",
    "Sidi Thabet",
    "Soukra"
  ],
  "Ben Arous": [
    "Ben Arous",
    "Boumhel",
    "El Mourouj",
    "Ezzahra",
    "Fouchana",
    "Hammam Chott",
    "Hammam Lif",
    "M'Hamdia",
    "Mégrine",
    "Mornag",
    "Nouvelle Médina",
    "Radès"
  ],
  "Manouba": [
    "Borj El Amri",
    "Douar Hicher",
    "El Battan",
    "Jedaida",
    "Manouba",
    "Mornaguia",
    "Oued Ellil",
    "Tebourba"
  ],
  "Nabeul": [
    "Beni Khalled",
    "Beni Khiar",
    "Bou Argoub",
    "Dar Chaabane El Fehri",
    "El Mida",
    "Grombalia",
    "Hammam Ghezaz",
    "Hammamet",
    "Haouaria",
    "Kelibia",
    "Korba",
    "Menzel Bouzelfa",
    "Menzel Temime",
    "Nabeul",
    "Soliman",
    "Takelsa"
  ],
  "Zaghouan": [
    "Bir Mchergua",
    "Fahs",
    "Nadhour",
    "Saouaf",
    "Zaghouan",
    "Zriba"
  ],
  "Bizerte": [
    "Bizerte Nord",
    "Bizerte Sud",
    "El Alia",
    "Ghar El Melh",
    "Ghazala",
    "Jarzouna",
    "Joumine",
    "Mateur",
    "Menzel Bourguiba",
    "Menzel Jemil",
    "Ras Jebel",
    "Sejnane",
    "Tinja",
    "Utique"
  ],
  "Béja": [
    "Amdoun",
    "Béja Nord",
    "Béja Sud",
    "Goubellat",
    "Mejez El Bab",
    "Nefza",
    "Téboursouk",
    "Testour",
    "Thibar"
  ],
  "Jendouba": [
    "Aïn Draham",
    "Balta Bou Aouane",
    "Bousalem",
    "Fernana",
    "Ghardimaou",
    "Jendouba Nord",
    "Jendouba Sud",
    "Oued Mliz",
    "Tabarka"
  ],
  "Kef": [
    "Dahmani",
    "Es Sers",
    "Jerissa",
    "Kalaa Khesba",
    "Kalaat Senan",
    "Kef Est",
    "Kef Ouest",
    "Ksour",
    "Nebeur",
    "Sakiet Sidi Youssef",
    "Tajerouine"
  ],
  "Siliana": [
    "Bargou",
    "Bouarada",
    "Bourouis",
    "El Krib",
    "Gaafour",
    "Kesra",
    "Laroussa",
    "Makthar",
    "Rouhia",
    "Siliana Nord",
    "Siliana Sud"
  ],
  "Gabès": [
    "Gabès Médina",
    "Gabès Ouest",
    "Gabès Sud",
    "Ghannouch",
    "Hamma",
    "Mareth",
    "Matmata",
    "Matmata Nouvelle",
    "Menzel Habib",
    "Metouia"
  ],
  "Médenine": [
    "Ben Guerdane",
    "Beni Khedache",
    "Djerba Ajim",
    "Djerba Midoun",
    "Houmt Souk",
    "Médenine Nord",
    "Médenine Sud",
    "Sidi Makhlouf",
    "Zarzis"
  ],
  "Tataouine": [
    "Bir Lahmar",
    "Dhiba",
    "Ghomrassen",
    "Remada",
    "Samar",
    "Tataouine Nord",
    "Tataouine Sud"
  ],
  "Gafsa": [
    "Belkhir",
    "Gafsa Nord",
    "Gafsa Sud",
    "Guetar",
    "Ksar",
    "Mdhilla",
    "Metlaoui",
    "Oum Larais",
    "Redeyef",
    "Sened",
    "Sidi Aich"
  ],
  "Tozeur": [
    "Degueche",
    "Hazoua",
    "Nefta",
    "Tamaghza",
    "Tozeur"
  ],
  "Kebili": [
    "Douz Nord",
    "Douz Sud",
    "Faouar",
    "Kebili Nord",
    "Kebili Sud",
    "Souk El Ahed"
  ]
} as const

/** Maps delegation name → governorate for search */
export const delegationToGovernorate: Record<string, TunisianGovernorate> = {
  "Sousse Médina": "Sousse",
  "Sousse Riadh": "Sousse",
  "Sousse Jaouhara": "Sousse",
  "Sousse Sidi Abdelhamid": "Sousse",
  "Hammam Sousse": "Sousse",
  "Akouda": "Sousse",
  "Kalaa Kebira": "Sousse",
  "Sidi Bou Ali": "Sousse",
  "Hergla": "Sousse",
  "Enfidha": "Sousse",
  "Bouficha": "Sousse",
  "Kondar": "Sousse",
  "Sidi El Heni": "Sousse",
  "M'Saken": "Sousse",
  "Kalaa Sghira": "Sousse",
  "Zaouia Ksiba Thraya": "Sousse",
  "Monastir": "Monastir",
  "Ouerdanine": "Monastir",
  "Sahline": "Monastir",
  "Zeramdine": "Monastir",
  "Beni Hassen": "Monastir",
  "Jammel": "Monastir",
  "Bembla": "Monastir",
  "Moknine": "Monastir",
  "Bekalta": "Monastir",
  "Teboulba": "Monastir",
  "Ksar Hellal": "Monastir",
  "Ksibet El Mediouni": "Monastir",
  "Sayada-Lamta-Bou Hjar": "Monastir",
  "Mahdia": "Mahdia",
  "Boumerdès": "Mahdia",
  "Ouled Chamekh": "Mahdia",
  "Chorbane": "Mahdia",
  "Hbira": "Mahdia",
  "Souassi": "Mahdia",
  "El Jem": "Mahdia",
  "Chebba": "Mahdia",
  "Melloulech": "Mahdia",
  "Sidi Alouane": "Mahdia",
  "Ksour Essef": "Mahdia",
  "Sfax Médina": "Sfax",
  "Sfax Ouest": "Sfax",
  "Sakiet Ezzit": "Sfax",
  "Sakiet Eddaier": "Sfax",
  "Sfax Sud": "Sfax",
  "Thyna": "Sfax",
  "Agareb": "Sfax",
  "Jebeniana": "Sfax",
  "El Amra": "Sfax",
  "Hencha": "Sfax",
  "Menzel Chaker": "Sfax",
  "El Ghraiba": "Sfax",
  "Bir Ali Ben Khélifa": "Sfax",
  "Skhira": "Sfax",
  "Mahres": "Sfax",
  "Kerkennah": "Sfax",
  "Kairouan Nord": "Kairouan",
  "Kairouan Sud": "Kairouan",
  "Chebika": "Kairouan",
  "Sbikha": "Kairouan",
  "Oueslatia": "Kairouan",
  "Haffouz": "Kairouan",
  "Alaa": "Kairouan",
  "Hajeb El Ayoun": "Kairouan",
  "Nasrallah": "Kairouan",
  "Chrarda": "Kairouan",
  "Bouhajla": "Kairouan",
  "Kasserine Nord": "Kasserine",
  "Kasserine Sud": "Kasserine",
  "Ezzouhour": "Tunis",
  "Hassi El Ferid": "Kasserine",
  "Sbeitla": "Kasserine",
  "Sbiba": "Kasserine",
  "Jedeliane": "Kasserine",
  "Ayoun": "Kasserine",
  "Thala": "Kasserine",
  "Hidra": "Kasserine",
  "Foussana": "Kasserine",
  "Feriana": "Kasserine",
  "Majel Belabbes": "Kasserine",
  "Sidi Bouzid Ouest": "Sidi Bouzid",
  "Sidi Bouzid Est": "Sidi Bouzid",
  "Jelma": "Sidi Bouzid",
  "Sabalat Ouled Asker": "Sidi Bouzid",
  "Bir El Hfay": "Sidi Bouzid",
  "Sidi Ali Ben Aoun": "Sidi Bouzid",
  "Menzel Bouzaiene": "Sidi Bouzid",
  "Meknassi": "Sidi Bouzid",
  "Souk Jedid": "Sidi Bouzid",
  "Mazzouna": "Sidi Bouzid",
  "Regueb": "Sidi Bouzid",
  "Ouled Haffouz": "Sidi Bouzid",
  "Carthage": "Tunis",
  "Médina": "Tunis",
  "Bab Bhar": "Tunis",
  "Bab Souika": "Tunis",
  "Omrane": "Tunis",
  "Omrane Supérieur": "Tunis",
  "El Tahrir": "Tunis",
  "El Menzah": "Tunis",
  "Cité El Khadra": "Tunis",
  "Bardo": "Tunis",
  "Sijoumi": "Tunis",
  "Hrairia": "Tunis",
  "Sidi Hassine": "Tunis",
  "El Ouardia": "Tunis",
  "Kabaria": "Tunis",
  "Sidi El Béchir": "Tunis",
  "Jebel Jelloud": "Tunis",
  "La Goulette": "Tunis",
  "Le Kram": "Tunis",
  "La Marsa": "Tunis",
  "Ariana Médina": "Ariana",
  "Soukra": "Ariana",
  "Raoued": "Ariana",
  "Kalaat El Andalous": "Ariana",
  "Sidi Thabet": "Ariana",
  "Ettadhamen": "Ariana",
  "Mnihla": "Ariana",
  "Ben Arous": "Ben Arous",
  "Nouvelle Médina": "Ben Arous",
  "El Mourouj": "Ben Arous",
  "Hammam Lif": "Ben Arous",
  "Hammam Chott": "Ben Arous",
  "Boumhel": "Ben Arous",
  "Ezzahra": "Ben Arous",
  "Radès": "Ben Arous",
  "Mégrine": "Ben Arous",
  "M'Hamdia": "Ben Arous",
  "Fouchana": "Ben Arous",
  "Mornag": "Ben Arous",
  "Manouba": "Manouba",
  "Douar Hicher": "Manouba",
  "Oued Ellil": "Manouba",
  "Mornaguia": "Manouba",
  "Borj El Amri": "Manouba",
  "Jedaida": "Manouba",
  "Tebourba": "Manouba",
  "El Battan": "Manouba",
  "Nabeul": "Nabeul",
  "Dar Chaabane El Fehri": "Nabeul",
  "Beni Khiar": "Nabeul",
  "Korba": "Nabeul",
  "Menzel Temime": "Nabeul",
  "El Mida": "Nabeul",
  "Kelibia": "Nabeul",
  "Hammam Ghezaz": "Nabeul",
  "Haouaria": "Nabeul",
  "Takelsa": "Nabeul",
  "Soliman": "Nabeul",
  "Menzel Bouzelfa": "Nabeul",
  "Beni Khalled": "Nabeul",
  "Grombalia": "Nabeul",
  "Bou Argoub": "Nabeul",
  "Hammamet": "Nabeul",
  "Zaghouan": "Zaghouan",
  "Zriba": "Zaghouan",
  "Bir Mchergua": "Zaghouan",
  "Fahs": "Zaghouan",
  "Nadhour": "Zaghouan",
  "Saouaf": "Zaghouan",
  "Bizerte Nord": "Bizerte",
  "Jarzouna": "Bizerte",
  "Bizerte Sud": "Bizerte",
  "Sejnane": "Bizerte",
  "Joumine": "Bizerte",
  "Mateur": "Bizerte",
  "Ghazala": "Bizerte",
  "Menzel Bourguiba": "Bizerte",
  "Tinja": "Bizerte",
  "Utique": "Bizerte",
  "Ghar El Melh": "Bizerte",
  "Menzel Jemil": "Bizerte",
  "El Alia": "Bizerte",
  "Ras Jebel": "Bizerte",
  "Béja Nord": "Béja",
  "Béja Sud": "Béja",
  "Amdoun": "Béja",
  "Nefza": "Béja",
  "Téboursouk": "Béja",
  "Thibar": "Béja",
  "Testour": "Béja",
  "Goubellat": "Béja",
  "Mejez El Bab": "Béja",
  "Jendouba Sud": "Jendouba",
  "Jendouba Nord": "Jendouba",
  "Bousalem": "Jendouba",
  "Tabarka": "Jendouba",
  "Aïn Draham": "Jendouba",
  "Fernana": "Jendouba",
  "Ghardimaou": "Jendouba",
  "Oued Mliz": "Jendouba",
  "Balta Bou Aouane": "Jendouba",
  "Kef Ouest": "Kef",
  "Kef Est": "Kef",
  "Nebeur": "Kef",
  "Sakiet Sidi Youssef": "Kef",
  "Tajerouine": "Kef",
  "Kalaat Senan": "Kef",
  "Kalaa Khesba": "Kef",
  "Jerissa": "Kef",
  "Ksour": "Kef",
  "Dahmani": "Kef",
  "Es Sers": "Kef",
  "Siliana Nord": "Siliana",
  "Siliana Sud": "Siliana",
  "Bouarada": "Siliana",
  "Gaafour": "Siliana",
  "El Krib": "Siliana",
  "Bourouis": "Siliana",
  "Makthar": "Siliana",
  "Rouhia": "Siliana",
  "Kesra": "Siliana",
  "Bargou": "Siliana",
  "Laroussa": "Siliana",
  "Gabès Médina": "Gabès",
  "Gabès Ouest": "Gabès",
  "Gabès Sud": "Gabès",
  "Ghannouch": "Gabès",
  "Metouia": "Gabès",
  "Menzel Habib": "Gabès",
  "Hamma": "Gabès",
  "Matmata": "Gabès",
  "Matmata Nouvelle": "Gabès",
  "Mareth": "Gabès",
  "Médenine Nord": "Médenine",
  "Médenine Sud": "Médenine",
  "Beni Khedache": "Médenine",
  "Ben Guerdane": "Médenine",
  "Zarzis": "Médenine",
  "Houmt Souk": "Médenine",
  "Djerba Midoun": "Médenine",
  "Djerba Ajim": "Médenine",
  "Sidi Makhlouf": "Médenine",
  "Tataouine Nord": "Tataouine",
  "Tataouine Sud": "Tataouine",
  "Samar": "Tataouine",
  "Bir Lahmar": "Tataouine",
  "Ghomrassen": "Tataouine",
  "Dhiba": "Tataouine",
  "Remada": "Tataouine",
  "Gafsa Nord": "Gafsa",
  "Sidi Aich": "Gafsa",
  "Ksar": "Gafsa",
  "Gafsa Sud": "Gafsa",
  "Oum Larais": "Gafsa",
  "Redeyef": "Gafsa",
  "Metlaoui": "Gafsa",
  "Mdhilla": "Gafsa",
  "Guetar": "Gafsa",
  "Belkhir": "Gafsa",
  "Sened": "Gafsa",
  "Tozeur": "Tozeur",
  "Degueche": "Tozeur",
  "Tamaghza": "Tozeur",
  "Nefta": "Tozeur",
  "Hazoua": "Tozeur",
  "Kebili Sud": "Kebili",
  "Kebili Nord": "Kebili",
  "Souk El Ahed": "Kebili",
  "Douz Nord": "Kebili",
  "Douz Sud": "Kebili",
  "Faouar": "Kebili"
}

export const governorateCenters: Record<TunisianGovernorate, { lat: number; lng: number; zoom: number }> = {
  "Tunis": {
    "lat": 36.818,
    "lng": 10.213,
    "zoom": 10
  },
  "Ariana": {
    "lat": 36.968,
    "lng": 10.122,
    "zoom": 10
  },
  "Ben Arous": {
    "lat": 36.63,
    "lng": 10.211,
    "zoom": 10
  },
  "Manouba": {
    "lat": 36.766,
    "lng": 9.83,
    "zoom": 10
  },
  "Nabeul": {
    "lat": 36.697,
    "lng": 10.675,
    "zoom": 10
  },
  "Zaghouan": {
    "lat": 36.332,
    "lng": 10.047,
    "zoom": 10
  },
  "Bizerte": {
    "lat": 37.035,
    "lng": 9.639,
    "zoom": 10
  },
  "Béja": {
    "lat": 36.747,
    "lng": 9.201,
    "zoom": 10
  },
  "Jendouba": {
    "lat": 36.68,
    "lng": 8.755,
    "zoom": 10
  },
  "Kef": {
    "lat": 36.034,
    "lng": 8.724,
    "zoom": 10
  },
  "Siliana": {
    "lat": 35.969,
    "lng": 9.354,
    "zoom": 10
  },
  "Sousse": {
    "lat": 35.974,
    "lng": 10.389,
    "zoom": 10
  },
  "Monastir": {
    "lat": 35.605,
    "lng": 10.722,
    "zoom": 10
  },
  "Mahdia": {
    "lat": 35.34,
    "lng": 10.605,
    "zoom": 10
  },
  "Sfax": {
    "lat": 34.724,
    "lng": 10.336,
    "zoom": 10
  },
  "Kairouan": {
    "lat": 35.579,
    "lng": 9.834,
    "zoom": 10
  },
  "Kasserine": {
    "lat": 35.209,
    "lng": 8.858,
    "zoom": 10
  },
  "Sidi Bouzid": {
    "lat": 34.88,
    "lng": 9.525,
    "zoom": 10
  },
  "Gabès": {
    "lat": 33.776,
    "lng": 9.794,
    "zoom": 10
  },
  "Médenine": {
    "lat": 32.99,
    "lng": 11.285,
    "zoom": 10
  },
  "Tataouine": {
    "lat": 31.738,
    "lng": 9.768,
    "zoom": 10
  },
  "Gafsa": {
    "lat": 34.434,
    "lng": 8.791,
    "zoom": 10
  },
  "Tozeur": {
    "lat": 33.982,
    "lng": 8.066,
    "zoom": 10
  },
  "Kebili": {
    "lat": 33.339,
    "lng": 8.702,
    "zoom": 10
  }
}

export const governorateKeywords: Record<TunisianGovernorate, string[]> = {
  "Tunis": [
    "tunis",
    "تونس"
  ],
  "Ariana": [
    "ariana",
    "أريانة",
    "aryana"
  ],
  "Ben Arous": [
    "ben arous",
    "بن عروس"
  ],
  "Manouba": [
    "manouba",
    "manubah",
    "منوبة"
  ],
  "Nabeul": [
    "nabeul",
    "نابل"
  ],
  "Zaghouan": [
    "zaghouan",
    "زغوان"
  ],
  "Bizerte": [
    "bizerte",
    "بنزرت"
  ],
  "Béja": [
    "béja",
    "beja",
    "باجة"
  ],
  "Jendouba": [
    "jendouba",
    "جندوبة"
  ],
  "Kef": [
    "kef",
    "le kef",
    "الكاف"
  ],
  "Siliana": [
    "siliana",
    "سليانة"
  ],
  "Kairouan": [
    "kairouan",
    "القيروان"
  ],
  "Kasserine": [
    "kasserine",
    "kassérine",
    "القصرين"
  ],
  "Sidi Bouzid": [
    "sidi bouzid",
    "sidi bou zid",
    "سيدي بوزيد"
  ],
  "Sousse": [
    "sousse",
    "سوسة"
  ],
  "Monastir": [
    "monastir",
    "المنستير"
  ],
  "Mahdia": [
    "mahdia",
    "المهدية"
  ],
  "Sfax": [
    "sfax",
    "صفاقس"
  ],
  "Gabès": [
    "gabès",
    "gabes",
    "قابس"
  ],
  "Médenine": [
    "médenine",
    "medenine",
    "مدنين"
  ],
  "Tataouine": [
    "tataouine",
    "تطاوين"
  ],
  "Gafsa": [
    "gafsa",
    "قفصة"
  ],
  "Tozeur": [
    "tozeur",
    "توزر"
  ],
  "Kebili": [
    "kebili",
    "قبلي"
  ]
}
