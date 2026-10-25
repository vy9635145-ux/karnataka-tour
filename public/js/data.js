// Sample data for demonstration only.
// Sample data for demonstration. Costs are rough per-person/day estimates in INR.
// cats: historical, hill, waterfall, beach, wildlife, temple, adventure, city
const D = (o) => o;

const destinations = [
  D({ id: 'hampi', name: 'Hampi', region: 'Vijayanagara district', cats: ['historical', 'temple', 'adventure'], rating: 4.9, cost: 1800, kw: 'hampi,temple', lat: 15.335, lng: 76.46, trending: true,
    desc: 'The boulder-strewn capital of the Vijayanagara Empire and a UNESCO World Heritage Site.',
    history: 'Hampi flourished between the 14th and 16th centuries as one of the richest cities in the world. After the Battle of Talikota in 1565 it was sacked, leaving the magnificent ruins seen today.',
    attractions: ['Virupaksha Temple', 'Vittala Temple & Stone Chariot', 'Hemakuta Hill', 'Lotus Mahal', 'Matanga Hill sunrise'],
    best: 'October to February', reach: 'Nearest railhead Hosapete (13 km). Nearest airport Hubballi (~140 km) or Ballari (~60 km).',
    nearby: ['badami', 'pattadakal', 'chitradurga'], food: ['Jolada rotti with ennegayi', 'Mirchi bajji', 'Riverside café thalis'],
    tips: ['Rent a bicycle or scooter', 'Carry water and a hat', 'Start early to beat the heat'] }),
  D({ id: 'mysuru', name: 'Mysuru Palace', region: 'Mysuru', cats: ['historical', 'city'], rating: 4.8, cost: 2200, kw: 'mysore,palace', lat: 12.3052, lng: 76.6552, trending: true,
    desc: 'The dazzling Amba Vilas Palace, centrepiece of the famous Dasara festival.',
    history: 'The current palace was completed in 1912 for the Wadiyar dynasty. Mysuru has been a seat of Karnataka culture, silk and sandalwood for centuries.',
    attractions: ['Mysore Palace illumination', 'Chamundi Hills', 'Devaraja Market', 'Brindavan Gardens', 'St Philomena’s Church'],
    best: 'September to March (Dasara in Oct)', reach: 'Direct trains and buses from Bengaluru (3 hrs). Nearest airport Mysuru.',
    nearby: ['shivanasamudra', 'bandipur', 'coorg'], food: ['Mysore pak', 'Mysore masala dosa', 'Bisi bele bath'],
    tips: ['Visit on Sunday evenings for the lit-up palace', 'Cameras are not allowed inside'] }),
  D({ id: 'bengaluru', name: 'Bengaluru', region: 'Bengaluru Urban', cats: ['city', 'historical'], rating: 4.5, cost: 3000, kw: 'bangalore,vidhana,soudha', lat: 12.9716, lng: 77.5946, trending: false,
    desc: 'The Garden City – a cosmopolitan blend of parks, palaces, breweries and tech culture.',
    history: 'Founded by Kempe Gowda in 1537, Bengaluru grew under Tipu Sultan and the British Cantonment into India’s technology capital.',
    attractions: ['Lalbagh Botanical Garden', 'Bangalore Palace', 'Cubbon Park', 'Vidhana Soudha', 'Bull Temple'],
    best: 'October to February', reach: 'Kempegowda International Airport, major railhead and bus hub.',
    nearby: ['nandihills', 'mysuru', 'shivanasamudra'], food: ['Masala dosa at CTR', 'Filter coffee', 'Ragi mudde'],
    tips: ['Use the metro to avoid traffic', 'Book weekend restaurants early'] }),
  D({ id: 'coorg', name: 'Coorg (Kodagu)', region: 'Kodagu', cats: ['hill', 'waterfall', 'adventure'], rating: 4.8, cost: 2800, kw: 'coorg,coffee,plantation', lat: 12.4244, lng: 75.7382, trending: true,
    desc: 'The “Scotland of India” – coffee estates, misty hills and Kodava culture.',
    history: 'Ruled by the Haleri dynasty before British annexation in 1834, Coorg is home to the proud Kodava community and martial traditions.',
    attractions: ['Abbey Falls', 'Raja’s Seat', 'Dubare Elephant Camp', 'Talakaveri', 'Namdroling Monastery'],
    best: 'October to March', reach: 'Road from Bengaluru (~260 km) or Mysuru (~120 km). Nearest airport Mangaluru/Mysuru.',
    nearby: ['mysuru', 'bandipur', 'chikkamagaluru'], food: ['Pandi curry with akki rotti', 'Kadambuttu', 'Coorg coffee'],
    tips: ['Monsoon roads can be slippery', 'Stay at a plantation homestay'] }),
  D({ id: 'chikkamagaluru', name: 'Chikkamagaluru', region: 'Chikkamagaluru', cats: ['hill', 'adventure', 'temple'], rating: 4.7, cost: 2400, kw: 'chikmagalur,mountains', lat: 13.3161, lng: 75.772, trending: true,
    desc: 'Coffee’s birthplace in India, with Mullayanagiri – the state’s highest peak.',
    history: 'Legend says Baba Budan smuggled seven coffee beans here from Yemen in the 1600s, starting India’s coffee story.',
    attractions: ['Mullayanagiri trek', 'Baba Budangiri', 'Hebbe Falls', 'Kemmangundi', 'Coffee estate walks'],
    best: 'September to March', reach: 'Road from Bengaluru (~245 km). Railhead at Kadur/Birur.',
    nearby: ['jog', 'coorg', 'udupi'], food: ['Malnad chicken curry', 'Akki rotti', 'Estate-fresh coffee'],
    tips: ['Carry a light jacket', 'Book jeeps for Hebbe Falls in advance'] }),
  D({ id: 'jog', name: 'Jog Falls', region: 'Shivamogga', cats: ['waterfall', 'adventure'], rating: 4.7, cost: 1600, kw: 'jog,falls,waterfall', lat: 14.2292, lng: 74.8123, trending: false,
    desc: 'One of India’s tallest plunge waterfalls, thundering 253 m down the Sharavathi river.',
    history: 'The Sharavathi river falls in four distinct cascades – Raja, Rani, Roarer and Rocket – and has inspired travellers since colonial days.',
    attractions: ['Viewpoint of the four cascades', 'Steps to the base', 'Linganamakki Dam', 'Sharavathi Valley'],
    best: 'July to October (monsoon)', reach: 'Road from Shivamogga (~100 km). Nearest railhead Talguppa.',
    nearby: ['murudeshwar', 'gokarna', 'chikkamagaluru'], food: ['Neer dosa', 'Malnad thali', 'Kori rotti'],
    tips: ['The falls are strongest after heavy rain', 'Wear grippy shoes'] }),
  D({ id: 'gokarna', name: 'Gokarna', region: 'Uttara Kannada', cats: ['beach', 'temple', 'adventure'], rating: 4.7, cost: 1900, kw: 'gokarna,beach', lat: 14.5479, lng: 74.3188, trending: true,
    desc: 'A sacred temple town with laid-back beaches like Om, Kudle and Half Moon.',
    history: 'Gokarna is a centuries-old pilgrimage town, home of the Mahabaleshwar Temple that houses the Atmalinga.',
    attractions: ['Om Beach', 'Kudle Beach', 'Mahabaleshwar Temple', 'Beach trek Gokarna–Paradise', 'Mirjan Fort'],
    best: 'October to March', reach: 'Gokarna Road railhead (~10 km). Nearest airport Goa (Dabolim ~140 km).',
    nearby: ['murudeshwar', 'dandeli', 'jog'], food: ['Fresh seafood thali', 'Banana pancakes', 'Coconut water'],
    tips: ['Swim only in marked areas', 'Dress modestly in temple town'] }),
  D({ id: 'murudeshwar', name: 'Murudeshwar', region: 'Uttara Kannada', cats: ['beach', 'temple'], rating: 4.6, cost: 1700, kw: 'murudeshwar,shiva,temple', lat: 14.0944, lng: 74.4849, trending: false,
    desc: 'Home to one of the world’s tallest Shiva statues beside the Arabian Sea.',
    history: 'The Murudeshwar Temple is associated with the Atmalinga legend; the 123-ft Shiva statue was completed in 2008.',
    attractions: ['Shiva statue', 'Raja Gopura lift', 'Murudeshwar Beach', 'Netrani Island (scuba)'],
    best: 'October to February', reach: 'Murudeshwar railway station on the Konkan line.',
    nearby: ['gokarna', 'jog', 'udupi'], food: ['Fish fry', 'Kane rava fry', 'Prawn gassi'],
    tips: ['Visit at sunset', 'Netrani trips run in fair weather only'] }),
  D({ id: 'badami', name: 'Badami', region: 'Bagalkot', cats: ['historical', 'temple', 'adventure'], rating: 4.6, cost: 1500, kw: 'badami,cave,temple', lat: 15.9149, lng: 75.6767, trending: false,
    desc: 'Rock-cut cave temples carved into red sandstone cliffs above Agastya Lake.',
    history: 'Badami (Vatapi) was the capital of the early Chalukyas in the 6th–8th centuries, pioneering Dravida and Nagara temple styles.',
    attractions: ['Badami Cave Temples', 'Agastya Lake', 'Bhutanatha Temples', 'Badami Fort', 'Mahakuta'],
    best: 'October to March', reach: 'Badami railhead on the Hubballi–Solapur line; bus from Hubballi/Bagalkot.',
    nearby: ['pattadakal', 'hampi', 'chitradurga'], food: ['Jolada rotti & ennegayi', 'Dharwad peda', 'Shenga holige'],
    tips: ['Climb caves in the morning', 'Hire a local guide for the carvings'] }),
  D({ id: 'pattadakal', name: 'Pattadakal', region: 'Bagalkot', cats: ['historical', 'temple'], rating: 4.5, cost: 1400, kw: 'pattadakal,temple', lat: 15.9489, lng: 75.8153, trending: false,
    desc: 'A UNESCO World Heritage cluster where Chalukyan temple architecture reached its peak.',
    history: 'Pattadakal was the coronation site of Chalukyan kings. Ten temples blend northern Nagara and southern Dravida styles.',
    attractions: ['Virupaksha Temple', 'Sangameshwara Temple', 'Papanatha Temple', 'Jain Narayana Temple'],
    best: 'October to March', reach: '~22 km from Badami by road; Badami is the nearest railhead.',
    nearby: ['badami', 'hampi', 'chitradurga'], food: ['Jolada rotti', 'Girmit', 'Sajjige'],
    tips: ['Combine with Aihole in one day', 'Visit at golden hour for photos'] }),
  D({ id: 'udupi', name: 'Udupi', region: 'Udupi', cats: ['temple', 'beach', 'city'], rating: 4.5, cost: 1700, kw: 'udupi,krishna,temple', lat: 13.3409, lng: 74.7421, trending: false,
    desc: 'Famed for its Krishna Temple, the birthplace of the Udupi cuisine tradition.',
    history: 'The Sri Krishna Matha was established by Madhvacharya in the 13th century and is known for the Kanakana Kindi window.',
    attractions: ['Sri Krishna Temple', 'Malpe Beach', 'St Mary’s Island', 'Kaup Lighthouse', 'Manipal'],
    best: 'October to March', reach: 'Udupi railhead on the Konkan line; ~60 km from Mangaluru airport.',
    nearby: ['murudeshwar', 'chikkamagaluru', 'gokarna'], food: ['Masala dosa', 'Neer dosa', 'Gadbad ice cream'],
    tips: ['Try the temple’s free midday meal', 'Boats to St Mary’s run from Malpe'] }),
  D({ id: 'nandihills', name: 'Nandi Hills', region: 'Chikkaballapur', cats: ['hill', 'adventure'], rating: 4.4, cost: 900, kw: 'nandi,hills,sunrise', lat: 13.3702, lng: 77.6835, trending: true,
    desc: 'A quick sunrise escape above the clouds, just outside Bengaluru.',
    history: 'Once a summer retreat of Tipu Sultan, the hill fort of Nandidurga still holds his old stone structures.',
    attractions: ['Sunrise viewpoint', 'Tipu’s Drop', 'Bhoga Nandeeshwara Temple', 'Cycling & paragliding'],
    best: 'October to February (clear mornings)', reach: '~60 km from Bengaluru; own vehicle or early bus.',
    nearby: ['bengaluru', 'shivanasamudra'], food: ['Breakfast at Muddenahalli', 'Hot tea & bajji'],
    tips: ['Leave by 3:30 AM for sunrise', 'Book entry slots online on weekends'] }),
  D({ id: 'dandeli', name: 'Dandeli', region: 'Uttara Kannada', cats: ['wildlife', 'adventure'], rating: 4.5, cost: 2600, kw: 'dandeli,forest,river', lat: 15.2606, lng: 74.6195, trending: false,
    desc: 'White-water rafting, kayaking and Kali Tiger Reserve safaris.',
    history: 'Dandeli grew as a timber town and today fronts the Dandeli–Anshi Tiger Reserve in the Western Ghats.',
    attractions: ['Kali river rafting', 'Jungle safari', 'Syntheri Rocks', 'Supa Dam', 'Kavala Caves'],
    best: 'October to May (rafting best Oct–Feb)', reach: 'Nearest railhead Alnavar; road from Hubballi (~80 km).',
    nearby: ['gokarna', 'jog', 'badami'], food: ['Malvani fish thali', 'Local jowar rotti'],
    tips: ['Rafting may pause in heavy monsoon', 'Book camps with safety certification'] }),
  D({ id: 'bandipur', name: 'Bandipur National Park', region: 'Chamarajanagar', cats: ['wildlife'], rating: 4.6, cost: 3200, kw: 'bandipur,tiger,safari', lat: 11.6661, lng: 76.6287, trending: false,
    desc: 'A leading tiger reserve in the Nilgiri Biosphere with elephants, gaurs and leopards.',
    history: 'Once a Mysore royal hunting preserve, Bandipur became a Project Tiger reserve in 1973.',
    attractions: ['Forest department safari', 'Gopalaswamy Hills', 'Watch-tower sightings', 'Nagarhole nearby'],
    best: 'October to May', reach: '~220 km from Bengaluru; ~80 km from Mysuru by road.',
    nearby: ['mysuru', 'coorg'], food: ['Resort buffets', 'Local ragi dishes'],
    tips: ['Book safaris early', 'Wear muted colours'] }),
  D({ id: 'chitradurga', name: 'Chitradurga Fort', region: 'Chitradurga', cats: ['historical', 'adventure'], rating: 4.5, cost: 1300, kw: 'chitradurga,fort', lat: 14.2251, lng: 76.3985, trending: false,
    desc: 'A massive stone fortress of seven concentric walls snaking across granite hills.',
    history: 'Strengthened by the Nayakas of Chitradurga, the fort resisted sieges for centuries and is linked to the heroine Onake Obavva.',
    attractions: ['Seven fortified walls', 'Hidimbeshwara Temple', 'Onake Obavva’s hole', 'Gopala Swamy Honda'],
    best: 'October to February', reach: 'Chitradurga is on NH48, ~200 km from Bengaluru; railhead in town.',
    nearby: ['hampi', 'badami', 'bengaluru'], food: ['Ragi mudde with saaru', 'Local dhabha meals'],
    tips: ['Arrive before 10 AM', 'Wear sturdy shoes for the climb'] }),
  D({ id: 'shivanasamudra', name: 'Shivanasamudra Falls', region: 'Chamarajanagar', cats: ['waterfall', 'temple'], rating: 4.4, cost: 1100, kw: 'shivanasamudra,waterfall,cauvery', lat: 12.2939, lng: 77.1688, trending: false,
    desc: 'Twin Cauvery falls – Gaganachukki and Bharachukki – with Asia’s early hydro-power history.',
    history: 'The 1902 hydroelectric plant here was among the earliest in Asia, powering the Kolar Gold Fields.',
    attractions: ['Gaganachukki Falls', 'Bharachukki Falls', 'Coracle rides', 'Talakadu temples'],
    best: 'July to November', reach: '~130 km from Bengaluru; ~75 km from Mysuru by road.',
    nearby: ['mysuru', 'bengaluru', 'bandipur'], food: ['Local meals at Malavalli', 'Roadside corn'],
    tips: ['Check water levels before going', 'Coracle rides depend on flow'] })
];

const filters = [
  { id: 'all', label: 'All' }, { id: 'historical', label: 'Historical' }, { id: 'hill', label: 'Hill Stations' },
  { id: 'waterfall', label: 'Waterfalls' }, { id: 'beach', label: 'Beaches' }, { id: 'wildlife', label: 'Wildlife' },
  { id: 'temple', label: 'Temples' }, { id: 'adventure', label: 'Adventure' }, { id: 'budget', label: 'Budget-friendly' }
];

const BUDGET_LIMIT = 1800; // ₹/person/day treated as budget-friendly

const getDest = (id) => destinations.find((d) => d.id === id);
const matchesFilter = (d, f) =>
  f === 'all' ? true : f === 'budget' ? d.cost <= BUDGET_LIMIT : d.cats.includes(f);

// Sample blog content for demonstration.
const blogCategories = ['All', 'Heritage', 'Nature', 'Coast', 'Food', 'Tips'];

const blogs = [
  { slug: 'hampi-in-two-days', title: 'Hampi in Two Days: A Sunrise-to-Sunset Plan', category: 'Heritage', author: 'Karnataka Tour', date: '2026-08-12', read: 6, kw: 'hampi,ruins',
    excerpt: 'How to see the Virupaksha Temple, Vittala complex and the best sunset points without burning out.',
    body: ['Hampi rewards slow travel, but two days can still deliver the highlights. Begin at Virupaksha Temple when the morning light hits the gopuram, then walk down the old Hampi Bazaar.',
      'On day two, cross to Vittala Temple early and see the stone chariot before the crowds. Spend the afternoon around the Royal Enclosure and the Lotus Mahal.',
      'End with sunset from Matanga Hill. Carry water, wear a hat and rent a bicycle – distances add up.'] },
  { slug: 'coorg-coffee-trails', title: 'Coorg’s Coffee Trails: Estates, Falls and Homestays', category: 'Nature', author: 'Karnataka Tour', date: '2026-07-03', read: 5, kw: 'coorg,coffee',
    excerpt: 'A slow guide to plantation walks, Abbey Falls and Kodava food.',
    body: ['Coorg is best explored on foot. Many homestays offer guided plantation walks where you can see coffee, pepper and cardamom growing together.',
      'Visit Abbey Falls after rain, drive up to Raja’s Seat for sunset and try pandi curry with kadambuttu for dinner.',
      'Monsoon is lush but roads can be tricky; winter brings the best weather.'] },
  { slug: 'gokarna-beach-trek', title: 'Gokarna’s Beach Trek: Kudle to Paradise', category: 'Coast', author: 'Karnataka Tour', date: '2026-06-18', read: 4, kw: 'gokarna,beach',
    excerpt: 'Hop across five beaches in a single scenic day.',
    body: ['Start at Om Beach and walk south over cliff paths to Half Moon and Paradise. The trail is easy but sun exposure is high.',
      'Carry water, wear sandals with grip and keep your phone in a dry bag. Finish with seafood at a shack on Kudle.'] }
];
const getBlog = (slug) => blogs.find((b) => b.slug === slug);

// Basic local translations (main nav, buttons, headings). Falls back to English.
const translations = {
  en: {
    nav_home: 'Home', nav_explore: 'Explore', nav_planner: 'Trip Planner', nav_budget: 'Budget',
    nav_blog: 'Blog', nav_about: 'About', nav_contact: 'Contact',
    hero_title: 'Discover the Many Worlds of Karnataka',
    hero_sub: 'Ancient ruins, misty hills, golden beaches and royal palaces – all in one state.',
    search_ph: 'Search Hampi, Coorg, Gokarna…', search: 'Search', explore_btn: 'Explore Karnataka',
    popular: 'Popular Destinations', trending: 'Trending Tourist Places', historical: 'Historical Places',
    hills: 'Hill Stations & Waterfalls', beaches: 'Beaches & Wildlife', experiences: 'Featured Travel Experiences',
    weekend: 'Recommended Weekend Trips', guides: 'Karnataka Travel Guides', blog: 'From the Travel Blog',
    newsletter: 'Get Karnataka travel tips in your inbox', subscribe: 'Subscribe', email: 'Your email',
    explore_more: 'Explore More', view_all: 'View all', all: 'All', no_results: 'No destinations match your search.',
    plan_trip: 'Plan a Trip', calc: 'Calculate', total: 'Estimated total', per_person: 'Per person',
    read_more: 'Read more', send: 'Send', ask_ph: 'Ask about Karnataka…', assistant: 'Karnataka Travel Assistant',
    reviews: 'Reviews & Ratings', submit_review: 'Submit review', gallery: 'Gallery', related: 'Related Destinations',
    footer_tag: 'Your guide to the best of Karnataka, India.',
    nav_login: 'Login', nav_signup: 'Sign up', nav_logout: 'Logout', nav_profile: 'My Dashboard',
    ak_title: 'About Karnataka', ak_sub: 'History, land, language and culture – in one journey.', ak_history: 'History', ak_geo: 'Geography', ak_lang: 'Language', ak_culture: 'Culture & Food',
    tr_title: 'Language Translator', tr_sub: 'Translate travel phrases between 35+ languages – instantly.', tr_from: 'From', tr_to: 'To', tr_auto: 'Auto detect', tr_btn: 'Translate', tr_ph: 'Type or paste text here…', tr_out: 'Translation', tr_copy: 'Copy', tr_speak: 'Listen', tr_clear: 'Clear'
  },
  hi: {
    nav_home: 'होम', nav_explore: 'खोजें', nav_planner: 'यात्रा योजना', nav_budget: 'बजट',
    nav_blog: 'ब्लॉग', nav_about: 'हमारे बारे में', nav_contact: 'संपर्क',
    hero_title: 'कर्नाटक की अनेक दुनियाओं को जानें',
    hero_sub: 'प्राचीन खंडहर, धुंध भरी पहाड़ियाँ, सुनहरे समुद्र तट और शाही महल – सब एक ही राज्य में।',
    search_ph: 'हम्पी, कूर्ग, गोकर्ण खोजें…', search: 'खोजें', explore_btn: 'कर्नाटक देखें',
    popular: 'लोकप्रिय स्थान', trending: 'ट्रेंडिंग पर्यटन स्थल', historical: 'ऐतिहासिक स्थल',
    hills: 'हिल स्टेशन और झरने', beaches: 'समुद्र तट और वन्यजीव', experiences: 'विशेष यात्रा अनुभव',
    weekend: 'सप्ताहांत यात्राएँ', guides: 'कर्नाटक यात्रा गाइड', blog: 'यात्रा ब्लॉग से',
    newsletter: 'कर्नाटक यात्रा सुझाव पाएँ', subscribe: 'सदस्यता लें', email: 'आपका ईमेल',
    explore_more: 'और देखें', view_all: 'सभी देखें', all: 'सभी', no_results: 'कोई स्थान नहीं मिला।',
    plan_trip: 'यात्रा की योजना', calc: 'गणना करें', total: 'अनुमानित कुल', per_person: 'प्रति व्यक्ति',
    read_more: 'और पढ़ें', send: 'भेजें', ask_ph: 'कर्नाटक के बारे में पूछें…', assistant: 'कर्नाटक यात्रा सहायक',
    reviews: 'समीक्षाएँ और रेटिंग', submit_review: 'समीक्षा भेजें', gallery: 'गैलरी', related: 'संबंधित स्थान',
    footer_tag: 'कर्नाटक के बेहतरीन स्थलों के लिए आपका गाइड।',
    nav_login: 'लॉगिन', nav_signup: 'साइन अप', nav_logout: 'लॉगआउट', nav_profile: 'मेरा डैशबोर्ड',
    ak_title: 'कर्नाटक के बारे में', ak_sub: 'इतिहास, भूगोल, भाषा और संस्कृति – एक ही सफ़र में।', ak_history: 'इतिहास', ak_geo: 'भूगोल', ak_lang: 'भाषा', ak_culture: 'संस्कृति और खान-पान',
    tr_title: 'भाषा अनुवादक', tr_sub: '35+ भाषाओं के बीच यात्रा के वाक्य तुरंत अनुवाद करें।', tr_from: 'से', tr_to: 'में', tr_auto: 'स्वतः पहचानें', tr_btn: 'अनुवाद करें', tr_ph: 'यहाँ टेक्स्ट लिखें या पेस्ट करें…', tr_out: 'अनुवाद', tr_copy: 'कॉपी', tr_speak: 'सुनें', tr_clear: 'साफ़ करें'
  },
  kn: {
    nav_home: 'ಮುಖಪುಟ', nav_explore: 'ಅನ್ವೇಷಿಸಿ', nav_planner: 'ಪ್ರವಾಸ ಯೋಜನೆ', nav_budget: 'ಬಜೆಟ್',
    nav_blog: 'ಬ್ಲಾಗ್', nav_about: 'ನಮ್ಮ ಬಗ್ಗೆ', nav_contact: 'ಸಂಪರ್ಕ',
    hero_title: 'ಕರ್ನಾಟಕದ ಹಲವು ಲೋಕಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
    hero_sub: 'ಪ್ರಾಚೀನ ಅವಶೇಷಗಳು, ಮಂಜಿನ ಬೆಟ್ಟಗಳು, ಚಿನ್ನದ ಕಡಲತೀರಗಳು ಮತ್ತು ರಾಜ ಅರಮನೆಗಳು – ಒಂದೇ ರಾಜ್ಯದಲ್ಲಿ.',
    search_ph: 'ಹಂಪಿ, ಕೊಡಗು, ಗೋಕರ್ಣ ಹುಡುಕಿ…', search: 'ಹುಡುಕಿ', explore_btn: 'ಕರ್ನಾಟಕ ಅನ್ವೇಷಿಸಿ',
    popular: 'ಜನಪ್ರಿಯ ತಾಣಗಳು', trending: 'ಟ್ರೆಂಡಿಂಗ್ ಪ್ರವಾಸಿ ತಾಣಗಳು', historical: 'ಐತಿಹಾಸಿಕ ತಾಣಗಳು',
    hills: 'ಗಿರಿಧಾಮಗಳು ಮತ್ತು ಜಲಪಾತಗಳು', beaches: 'ಕಡಲತೀರ ಮತ್ತು ವನ್ಯಜೀವಿ', experiences: 'ವಿಶೇಷ ಪ್ರವಾಸ ಅನುಭವಗಳು',
    weekend: 'ವಾರಾಂತ್ಯ ಪ್ರವಾಸಗಳು', guides: 'ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಮಾರ್ಗದರ್ಶಿ', blog: 'ಪ್ರವಾಸ ಬ್ಲಾಗ್',
    newsletter: 'ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಸಲಹೆಗಳನ್ನು ಪಡೆಯಿರಿ', subscribe: 'ಚಂದಾದಾರರಾಗಿ', email: 'ನಿಮ್ಮ ಇಮೇಲ್',
    explore_more: 'ಇನ್ನಷ್ಟು ನೋಡಿ', view_all: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ', all: 'ಎಲ್ಲಾ', no_results: 'ಯಾವುದೇ ತಾಣ ಸಿಗಲಿಲ್ಲ.',
    plan_trip: 'ಪ್ರವಾಸ ಯೋಜಿಸಿ', calc: 'ಲೆಕ್ಕ ಹಾಕಿ', total: 'ಅಂದಾಜು ಒಟ್ಟು', per_person: 'ಪ್ರತಿ ವ್ಯಕ್ತಿಗೆ',
    read_more: 'ಇನ್ನಷ್ಟು ಓದಿ', send: 'ಕಳುಹಿಸಿ', ask_ph: 'ಕರ್ನಾಟಕದ ಬಗ್ಗೆ ಕೇಳಿ…', assistant: 'ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಸಹಾಯಕ',
    reviews: 'ವಿಮರ್ಶೆಗಳು ಮತ್ತು ರೇಟಿಂಗ್', submit_review: 'ವಿಮರ್ಶೆ ಸಲ್ಲಿಸಿ', gallery: 'ಗ್ಯಾಲರಿ', related: 'ಸಂಬಂಧಿತ ತಾಣಗಳು',
    footer_tag: 'ಕರ್ನಾಟಕದ ಅತ್ಯುತ್ತಮ ತಾಣಗಳಿಗೆ ನಿಮ್ಮ ಮಾರ್ಗದರ್ಶಿ.',
    nav_login: 'ಲಾಗಿನ್', nav_signup: 'ಸೈನ್ ಅಪ್', nav_logout: 'ಲಾಗ್‌ಔಟ್', nav_profile: 'ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    ak_title: 'ಕರ್ನಾಟಕದ ಬಗ್ಗೆ', ak_sub: 'ಇತಿಹಾಸ, ಭೂಗೋಳ, ಭಾಷೆ ಮತ್ತು ಸಂಸ್ಕೃತಿ – ಒಂದೇ ಪಯಣದಲ್ಲಿ.', ak_history: 'ಇತಿಹಾಸ', ak_geo: 'ಭೂಗೋಳ', ak_lang: 'ಭಾಷೆ', ak_culture: 'ಸಂಸ್ಕೃತಿ ಮತ್ತು ಆಹಾರ',
    tr_title: 'ಭಾಷಾ ಅನುವಾದಕ', tr_sub: '35+ ಭಾಷೆಗಳ ನಡುವೆ ಪ್ರವಾಸದ ವಾಕ್ಯಗಳನ್ನು ತಕ್ಷಣ ಅನುವಾದಿಸಿ.', tr_from: 'ಇಂದ', tr_to: 'ಗೆ', tr_auto: 'ಸ್ವಯಂ ಪತ್ತೆ', tr_btn: 'ಅನುವಾದಿಸಿ', tr_ph: 'ಇಲ್ಲಿ ಪಠ್ಯ ಬರೆಯಿರಿ ಅಥವಾ ಅಂಟಿಸಿ…', tr_out: 'ಅನುವಾದ', tr_copy: 'ನಕಲಿಸಿ', tr_speak: 'ಕೇಳಿ', tr_clear: 'ಅಳಿಸಿ'
  }
};


/* Shopping ideas per destination (sample guidance for the Trip Planner). */
const SHOP = {
  hampi: ['Hampi Bazaar handicrafts', 'Lambani embroidery bags & mirror-work', 'Stone & wood carvings', 'Banana-fibre products'],
  mysuru: ['Mysore silk sarees', 'Sandalwood oil & soaps', 'Mysore Pak sweets', 'Rosewood inlay items', 'Incense sticks (agarbatti)'],
  bengaluru: ['Commercial Street clothes', 'Chickpet silk & sarees', 'Cubbon Road / MG Road shopping', 'Filter coffee powder'],
  coorg: ['Fresh coffee powder', 'Pepper, cardamom & vanilla', 'Homemade honey', 'Kodava handicrafts'],
  chikkamagaluru: ['Estate-fresh coffee', 'Spices & pepper', 'Local honey', 'Cashew & areca products'],
  jog: ['Local honey & spices', 'Areca-leaf plates & crafts', 'Sagara-region wood crafts'],
  gokarna: ['Beach-street handicrafts', 'Cashews & dry fruits', 'Rudraksha & puja items', 'Handmade jewellery'],
  murudeshwar: ['Shell & coastal crafts', 'Cashews', 'Temple-street souvenirs'],
  badami: ['Ilkal sarees (from nearby Ilkal)', 'Khana fabric blouse pieces', 'Local handloom', 'Spices & jaggery'],
  pattadakal: ['Ilkal sarees', 'Khana fabric', 'Local handloom'],
  udupi: ['Udupi cotton sarees', 'Banana & jackfruit chips', 'Brass lamps & utensils', 'Temple-street souvenirs'],
  nandihills: ['Seasonal fruits (grapes, strawberries)', 'Doddaballapur silk (nearby)', 'Local snacks'],
  dandeli: ['Bamboo & cane crafts', 'Local honey & spices'],
  bandipur: ['Forest-produce honey', 'Sandalwood items from nearby Mysuru', 'Handloom souvenirs'],
  chitradurga: ['Molakalmuru sarees', 'Local handloom', 'Fort-side souvenirs'],
  shivanasamudra: ['Kollegal / Mysuru silk', 'Local snacks & fruits']
};

/* Ideal number of days (a simple rule based on the place type). */
function idealDays(d) {
  if (d.cats.includes('wildlife')) return [2, 3];
  if (d.id === 'hampi' || d.id === 'badami') return [2, 3];
  if (d.cats.includes('hill') || d.id === 'mysuru' || d.id === 'bengaluru') return [2, 3];
  if (d.cats.includes('beach')) return [2, 3];
  if (d.cats.includes('waterfall')) return [1, 2];
  return [1, 2];
}

/* Famous food of Karnataka (home page "Famous Food" section). veg: true = vegetarian.
   kw = search word for the photo. Photo = the file named in img (folder: images/food). Replace the file with your own photo using the same name. */
const FOODS = [
  { name: 'Masala Dosa', img: 'images/food/masala-dosa.jpg', kw: 'masala dosa', emoji: '🥞', cat: 'Breakfast', veg: true, place: 'Bengaluru, Mysuru', dest: 'bengaluru', desc: 'A thin crisp dosa filled with spiced potato, served with coconut chutney and sambar.' },
  { name: 'Davangere Benne Dose', img: 'images/food/davangere-benne-dose.jpg', kw: 'benne dosa', emoji: '🧈', cat: 'Breakfast', veg: true, place: 'Davangere', desc: 'A soft, butter-rich dosa from Davangere, usually eaten with potato palya and chutney.' },
  { name: 'Bisi Bele Bath', img: 'images/food/bisi-bele-bath.jpg', kw: 'bisi bele bath', emoji: '🍲', cat: 'Meals', veg: true, place: 'Bengaluru, Mysuru', dest: 'mysuru', desc: 'Hot lentil-rice dish cooked with vegetables and a special spice mix, topped with ghee and boondi.' },
  { name: 'Ragi Mudde & Saaru', img: 'images/food/ragi-mudde-saaru.jpg', kw: 'ragi mudde', emoji: '🍡', cat: 'Meals', veg: true, place: 'Old Mysuru region', dest: 'mysuru', desc: 'Soft finger-millet balls swallowed (not chewed) with spicy saaru or greens curry – a rural staple.' },
  { name: 'Jolada Rotti & Ennegayi', img: 'images/food/jolada-rotti-ennegayi.jpg', kw: 'jowar roti', emoji: '🫓', cat: 'Meals', veg: true, place: 'Badami, Hampi, Hubballi', dest: 'badami', desc: 'Sorghum flatbread with ennegayi, a stuffed brinjal curry – the heart of North Karnataka cooking.' },
  { name: 'Mysore Pak', img: 'images/food/mysore-pak.jpg', kw: 'mysore pak', emoji: '🍯', cat: 'Sweets', veg: true, place: 'Mysuru', dest: 'mysuru', desc: 'Melt-in-mouth sweet of gram flour, ghee and sugar, said to have been created in the Mysore Palace kitchen.' },
  { name: 'Dharwad Pedha', img: 'images/food/dharwad-pedha.jpg', kw: 'pedha sweet', emoji: '🍬', cat: 'Sweets', veg: true, place: 'Dharwad', desc: 'Brown, grainy milk sweet from Dharwad with a caramelised flavour.' },
  { name: 'Maddur Vada', img: 'images/food/maddur-vada.jpg', kw: 'medu vada', emoji: '🍘', cat: 'Snacks', veg: true, place: 'Maddur (Bengaluru–Mysuru road)', desc: 'Crisp onion-rava fritters, a favourite roadside stop on the way to Mysuru.' },
  { name: 'Pandi Curry & Kadambuttu', img: 'images/food/pandi-curry-kadambuttu.jpg', kw: 'pork curry', emoji: '🍛', cat: 'Coastal & Coorg', veg: false, place: 'Coorg', dest: 'coorg', desc: 'Kodava-style pork curry with dark kachampuli vinegar, eaten with soft rice dumplings.' },
  { name: 'Neer Dosa & Fish Curry', img: 'images/food/neer-dosa-fish-curry.jpg', kw: 'neer dosa', emoji: '🐟', cat: 'Coastal & Coorg', veg: false, place: 'Mangaluru, Udupi', dest: 'udupi', desc: 'Lacy rice crepes served with spicy coconut-based coastal fish curry.' },
  { name: 'Kori Rotti', img: 'images/food/kori-rotti.jpg', kw: 'chicken curry', emoji: '🍗', cat: 'Coastal & Coorg', veg: false, place: 'Mangaluru, Udupi', dest: 'udupi', desc: 'Chicken curry poured over crisp rice wafers that soften as you eat – a Tulu-region classic.' },
  { name: 'Filter Coffee', img: 'images/food/filter-coffee.jpg', kw: 'filter coffee', emoji: '☕', cat: 'Drinks', veg: true, place: 'Bengaluru, Coorg, Chikkamagaluru', dest: 'coorg', desc: 'Strong decoction coffee made with Karnataka’s own estate beans, served frothy in a steel tumbler.' }
];
