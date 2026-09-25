export type Language = "en" | "sw";

export const translations = {
  en: {
    // Navigation / Tabs
    nav_chat: "AI Assistant",
    nav_academic_resources: "Academic Resources",
    nav_timetable: "Timetable & Schedule",
    nav_documents: "Documents & Files",
    nav_notices: "Campus Notices",
    nav_tickets: "Support Tickets",
    nav_analytics: "Analytics & Usage",
    nav_settings: "Settings",
    nav_profile: "My Profile",
    nav_portal: "Portal Sync",

    // User Badge / Account Types
    account_student: "Student Account",
    account_lecturer: "Lecturer Account",
    account_parent: "Parent Account",
    account_dept: "Department Account",
    account_admin: "Admin Account",

    // Quick Action & Header Buttons
    new_chat: "New Chat",
    search_placeholder: "Search official campus documents, notices, or schedules...",
    sign_out: "Sign Out",
    linked_portal: "Portal Linked",
    link_portal: "Link Portal",
    notifications: "Notifications",

    // Chat Interface
    chat_title: "KiliGuide Smart Assistant",
    chat_subtitle: "Instant verified campus assistance in English & Kiswahili",
    chat_input_placeholder: "Ask anything about courses, fees, exams, timetables, or campus services...",
    listening: "Listening...",
    send: "Send",
    stop: "Stop",
    clear_chat: "Clear Chat",
    escalate_ticket: "Escalate to Department",
    export_chat: "Export Chat Log",
    ai_disclaimer: "Answers are grounded in official campus documentation.",
    no_messages: "Ask a question to start your conversation with KiliGuide.",
    quick_prompts_title: "Suggested Questions",

    // Quick Prompts
    prompt_fee_structure: "What is the fee payment deadline and structure for this semester?",
    prompt_timetable: "Show my class timetable and upcoming lectures for today.",
    prompt_hostels: "How do I apply for on-campus student hostel accommodation?",
    prompt_exam_rules: "What are the university exam regulation rules and grading criteria?",

    // Academic Resources Module
    academic_resources_title: "Academic Resources Hub",
    academic_resources_subtitle: "Access verified course outlines, lecture slides, past exam papers, and revision notes.",
    search_resources: "Search past papers, notes, or course codes...",
    all_categories: "All Categories",
    cat_lecture_notes: "Lecture Notes",
    cat_past_papers: "Past Papers",
    cat_course_outlines: "Course Outlines",
    cat_revision_guides: "Revision Guides",
    cat_reference_books: "Reference Books",
    upload_resource: "Upload Resource",
    no_resources: "No academic resources found matching your search criteria.",

    // Timetable & Schedule
    timetable_title: "Class Timetable & Deadlines",
    timetable_subtitle: "Automatic schedule extraction and lecture alerts.",
    upload_timetable_pdf: "Upload Timetable PDF",
    extracting_timetable: "Analyzing & Extracting Timetable...",
    todays_classes: "Today's Schedule",
    weekly_view: "Weekly View",
    no_classes_today: "No classes scheduled for today.",
    room: "Room",
    venue: "Venue",
    lecturer: "Lecturer",
    time: "Time",
    unit: "Unit / Course",

    // Documents
    documents_title: "Campus Knowledge Base & Files",
    documents_subtitle: "Official university policies, forms, prospectuses, and department guides.",
    search_documents: "Search official campus documents...",
    download: "Download",
    view_document: "View Document",
    no_documents: "No campus documents uploaded yet.",

    // Notices
    notices_title: "Official Campus Notices & Bulletins",
    notices_subtitle: "Important announcements directly from university departments.",
    search_notices: "Search notices by keyword or department...",
    published_on: "Published on",
    read_more: "Read Full Notice",
    no_notices: "No notices published at this moment.",

    // Support Tickets
    tickets_title: "Help Desk & Department Support",
    tickets_subtitle: "Track inquiries escalated to university administration or department heads.",
    create_ticket: "Create Support Ticket",
    ticket_subject: "Subject / Topic",
    ticket_desc: "Detailed Description of Issue",
    select_department: "Select Target Department",
    status_open: "Open",
    status_in_progress: "In Progress",
    status_resolved: "Resolved",
    status_closed: "Closed",
    view_ticket: "View Ticket Conversation",
    no_tickets: "You haven't submitted any support tickets yet.",

    // Settings
    settings_title: "Settings & Preferences",
    settings_subtitle: "Customize your KiliGuide experience, language, and privacy preferences.",
    section_language: "Language & UI Localization",
    section_language_desc: "Choose the preferred language for KiliGuide interface and AI communication.",
    lang_en: "English (US / UK)",
    lang_sw: "Kiswahili (East Africa)",
    section_accessibility: "Accessibility & Motion",
    reduce_motion: "Reduce Interface Animations",
    auto_read: "Automatically Read AI Responses Aloud",
    section_privacy: "Data & Privacy Controls",
    privacy_desc: "Manage stored session data, account connection, and privacy settings.",
    delete_timetables: "Delete Uploaded Timetables",
    delete_account: "Delete Account Permanently",
    custom_instructions_title: "AI Personalization & Custom Instructions",
    custom_instructions_desc: "Add specific background details (e.g. course code, study habits) for KiliGuide AI to remember.",
    save_changes: "Save Settings",

    // Profile Tab
    profile_title: "Student Profile",
    profile_subtitle: "Your campus identity and registered academic account details.",
    full_name: "Full Name",
    email_address: "Email Address",
    institution: "Institution / University",
    department: "Department / Major",
    academic_year: "Academic Year",

    // Common UI buttons
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    loading: "Loading...",
  },

  sw: {
    // Navigation / Tabs
    nav_chat: "Msaidizi wa AI",
    nav_academic_resources: "Rasilimali za Masomo",
    nav_timetable: "Ratiba ya Vipindi",
    nav_documents: "Nyaraka na Mafaili",
    nav_notices: "Matangazo ya Chuo",
    nav_tickets: "Tiketi za Msaada",
    nav_analytics: "Takwimu na Matumizi",
    nav_settings: "Mipangilio",
    nav_profile: "Profaili Yangu",
    nav_portal: "Usawazishaji wa Tovuti",

    // User Badge / Account Types
    account_student: "Akaunti ya Mwanafunzi",
    account_lecturer: "Akaunti ya Mhadhiri",
    account_parent: "Akaunti ya Mzazi",
    account_dept: "Akaunti ya Idara",
    account_admin: "Akaunti ya Msimamizi",

    // Quick Action & Header Buttons
    new_chat: "Mazungumzo Mapya",
    search_placeholder: "Tafuta nyaraka rasmi za chuo, matangazo, au ratiba...",
    sign_out: "Ondoka (Sign Out)",
    linked_portal: "Tovuti Imeunganishwa",
    link_portal: "Unganisha Tovuti",
    notifications: "Arifa",

    // Chat Interface
    chat_title: "Msaidizi Mfawidhi wa KiliGuide",
    chat_subtitle: "Msaada wa papo hapo wa chuo uliothibitishwa kwa Kiingereza na Kiswahili",
    chat_input_placeholder: "Uliza chochote kuhusu kozi, ada, mtihani, ratiba, au huduma za chuo...",
    listening: "Inasikiliza...",
    send: "Tuma",
    stop: "Acha",
    clear_chat: "Futa Mazungumzo",
    escalate_ticket: "Wasilisha Idarani",
    export_chat: "Pakua Mazungumzo",
    ai_disclaimer: "Majibu yanatoka kwenye nyaraka rasmi za chuo.",
    no_messages: "Uliza swali ili kuanza mazungumzo na KiliGuide.",
    quick_prompts_title: "Maswali Yanayoulizwa Sana",

    // Quick Prompts
    prompt_fee_structure: "Tarehe ya mwisho ya kulipa ada na mchanganuo wa ada muhula huu ni gani?",
    prompt_timetable: "Nionyeshe ratiba yangu ya vipindi na mihadhara ya leo.",
    prompt_hostels: "Ninawezaje kuomba nafasi ya bweni au hosteli za chuo?",
    prompt_exam_rules: "Sheria na kanuni za mitihani ya chuo na viwango vya maksi ni zipi?",

    // Academic Resources Module
    academic_resources_title: "Kituo cha Rasilimali za Masomo",
    academic_resources_subtitle: "Pata muhtasari wa kozi, maelezo ya mihadhara, mitihani iliyopita, na miongozo ya marudio.",
    search_resources: "Tafuta mitihani iliyopita, maelezo, au msimbo wa kozi...",
    all_categories: "Aina Zote",
    cat_lecture_notes: "Maelezo ya Mihadhara",
    cat_past_papers: "Mitihani Iliyopita",
    cat_course_outlines: "Muhtasari wa Kozi",
    cat_revision_guides: "Miongozo ya Marudio",
    cat_reference_books: "Vitabu vya Marejeleo",
    upload_resource: "Pakia Rasilimali",
    no_resources: "Hakuna rasilimali za masomo zilizopatikana kulingana na utafutaji wako.",

    // Timetable & Schedule
    timetable_title: "Ratiba ya Vipindi na Tarehe Muhimu",
    timetable_subtitle: "Uchambuzi wa kiotomatiki wa ratiba na arifa za mihadhara.",
    upload_timetable_pdf: "Pakia PDF ya Ratiba",
    extracting_timetable: "Inachambua na Kutoa Ratiba...",
    todays_classes: "Vipindi vya Leo",
    weekly_view: "Ratiba ya Wiki",
    no_classes_today: "Hakuna vipindi vilivyopangwa leo.",
    room: "Chumba",
    venue: "EnEO",
    lecturer: "Mhadhiri",
    time: "Muda",
    unit: "Somo / Kozi",

    // Documents
    documents_title: "Maktaba ya Nyaraka za Chuo",
    documents_subtitle: "Miongozo rasmi ya chuo, fomu, vifaa vya habari, na nyaraka za idara.",
    search_documents: "Tafuta nyaraka rasmi za chuo...",
    download: "Pakua",
    view_document: "Tazama Document",
    no_documents: "Bado hakuna nyaraka za chuo zilizopakiwa.",

    // Notices
    notices_title: "Matangazo Rasmi ya Chuo",
    notices_subtitle: "Taarifa muhimu za papo hapo kutoka idara mbalimbali za chuo.",
    search_notices: "Tafuta matangazo kwa neno kuu au idara...",
    published_on: "Ilichapishwa tarehe",
    read_more: "Soma Tangazo Zima",
    no_notices: "Hakuna matangazo yaliyochapishwa kwa sasa.",

    // Support Tickets
    tickets_title: "Dawati la Msaada na Huduma za Idara",
    tickets_subtitle: "Fuatilia maswali na maombi yaliyotumwa kwa uongozi wa chuo au wakuu wa idara.",
    create_ticket: "Tengeneza Tiketi ya Msaada",
    ticket_subject: "Mada / Kichwa",
    ticket_desc: "Maelezo ya Kina ya Swala Lako",
    select_department: "Chagua Idara Husika",
    status_open: "Inashughulikiwa",
    status_in_progress: "Inaendelea",
    status_resolved: "Imetatuliwa",
    status_closed: "Imefungwa",
    view_ticket: "Tazama Mazungumzo ya Tiketi",
    no_tickets: "Bado hujatuma tiketi yoyote ya msaada.",

    // Settings
    settings_title: "Mipangilio na Mapendeleo",
    settings_subtitle: "Boresha matumizi yako ya KiliGuide, lugha, na mipangilio ya faragha.",
    section_language: "Lugha na Ufsiri wa Mfumo",
    section_language_desc: "Chagua lugha unayopendelea kwa muonekano wa KiliGuide na majibu ya AI.",
    lang_en: "Kiingereza (English)",
    lang_sw: "Kiswahili (East Africa)",
    section_accessibility: "Upatikanaji na Mwendo",
    reduce_motion: "Punguza Michoro na Mwendo kwenye Mfumo",
    auto_read: "Soma Majibu ya AI kwa Sauti Kiotomatiki",
    section_privacy: "Udhibiti wa Data na Faragha",
    privacy_desc: "Dhibiti data zilizohifadhiwa, muunganisho wa akaunti, na mipangilio ya faragha.",
    delete_timetables: "Futa Ratiba Zilizopakiwa",
    delete_account: "Futa Akaunti Kabisa",
    custom_instructions_title: "Ubinafsishaji wa AI na Maagizo Maalum",
    custom_instructions_desc: "Ongeza maelezo maalum (k.m. msimbo wa kozi, tabia za masomo) ili KiliGuide AI ikukumbuke.",
    save_changes: "Hifadhi Mipangilio",

    // Profile Tab
    profile_title: "Profaili ya Mwanafunzi",
    profile_subtitle: "Kitambulisho chako cha chuo na maelezo ya akaunti ya masomo.",
    full_name: "Jina Buche",
    email_address: "Anwani ya Barua Pepe",
    institution: "Taasisi / Chuo Kikuu",
    department: "Idara / Kozi Kuu",
    academic_year: "Mwaka wa Masomo",

    // Common UI buttons
    cancel: "Ghairi",
    confirm: "Thibitisha",
    save: "Hifadhi",
    delete: "Futa",
    edit: "Hariri",
    close: "Funga",
    loading: "Inapakia...",
  }
} as const;

export function getTranslation(lang: Language | string) {
  const selectedLang = (lang === "sw" ? "sw" : "en") as Language;
  return translations[selectedLang];
}

export function t(key: keyof typeof translations.en, lang: Language | string): string {
  const selectedLang = (lang === "sw" ? "sw" : "en") as Language;
  return translations[selectedLang][key] || translations.en[key] || key;
}
