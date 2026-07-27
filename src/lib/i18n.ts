export type Lang = 'fr' | 'ar' | 'en'

export const LANGUAGES: { code: Lang; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
]

type TranslationMap = Record<string, Record<Lang, string>>

const translations: TranslationMap = {
  'app.title': {
    fr: 'STEG Cut Tracker',
    ar: 'متعقب انقطاع التيار',
    en: 'STEG Cut Tracker',
  },
  'app.subtitle': {
    fr: 'Tunisie',
    ar: 'تونس',
    en: 'Tunisia',
  },
  'stats.active': {
    fr: 'Actives',
    ar: 'نشطة',
    en: 'Active',
  },
  'stats.zones': {
    fr: 'Zones',
    ar: 'المناطق',
    en: 'Zones',
  },
  'report.button': {
    fr: 'Signaler une coupure',
    ar: 'الإبلاغ عن انقطاع',
    en: 'Report Power Cut',
  },
  'report.title': {
    fr: 'Signaler une coupure',
    ar: 'الإبلاغ عن انقطاع',
    en: 'Report Power Cut',
  },
  'report.gps': {
    fr: 'Utiliser ma position',
    ar: 'استخدام موقعي',
    en: 'Use my location',
  },
  'report.locating': {
    fr: 'Localisation en cours...',
    ar: 'جاري تحديد الموقع...',
    en: 'Detecting your location...',
  },
  'report.gps.desc': {
    fr: 'Détection automatique',
    ar: 'تحديد تلقائي',
    en: 'Auto-detect position',
  },
  'report.manual': {
    fr: 'Choisir sur la carte',
    ar: 'اختيار يدوي',
    en: 'Choose manually',
  },
  'report.manual.desc': {
    fr: 'Sélectionner gouvernorat et délégation',
    ar: 'اختيار الولاية والمعتمدية',
    en: 'Select governorate and delegation',
  },
  'report.select.gov': {
    fr: 'Gouvernorat',
    ar: 'الولاية',
    en: 'Governorate',
  },
  'report.select.deleg': {
    fr: 'Délégation',
    ar: 'المعتمدية',
    en: 'Delegation',
  },
  'report.submit': {
    fr: 'Envoyer',
    ar: 'إرسال',
    en: 'Submit Report',
  },
  'report.success.title': {
    fr: 'Signalement envoyé !',
    ar: 'تم الإرسال!',
    en: 'Report Submitted!',
  },
  'report.success.desc': {
    fr: 'Votre signalement est maintenant visible sur la carte.',
    ar: 'تم نشر بلاغك على الخريطة',
    en: 'Your report is now live on the map.',
  },
  'report.submitting': {
    fr: 'Envoi en cours...',
    ar: 'جاري الإرسال...',
    en: 'Submitting...',
  },
  'report.loc.error': {
    fr: 'Géolocalisation indisponible',
    ar: 'تحديد الموقع غير متاح',
    en: 'Geolocation not available',
  },
  'report.fill': {
    fr: 'Veuillez remplir tous les champs requis.',
    ar: 'يرجى ملء جميع الحقول المطلوبة',
    en: 'Please fill all required fields.',
  },
  'report.gps.detected': {
    fr: 'Gouvernorat détecté automatiquement depuis votre position',
    ar: 'تم تحديد الولاية تلقائياً من موقعك',
    en: 'Governorate auto-detected from your location',
  },
  'report.change.gov': {
    fr: 'Ce n\'est pas le bon gouvernorat ?',
    ar: 'الولاية غير صحيحة؟',
    en: 'Wrong governorate?',
  },
  'report.deleg.optional': {
    fr: 'Délégation (optionnel)',
    ar: 'المعتمدية (اختياري)',
    en: 'Delegation (optional)',
  },
  'toast.submitted': {
    fr: 'Signalement envoyé avec succès !',
    ar: 'تم الإبلاغ بنجاح!',
    en: 'Report submitted successfully!',
  },
  'peak.warning': {
    fr: 'Période à risque (12h-17h) — Risque accru de délestage',
    ar: 'فترة خطر (12-5 مساءً) — زيادة خطر انقطاع التيار',
    en: 'High-risk window (12PM-5PM) — Increased chance of outages',
  },
  'peak.badge': {
    fr: 'Charge élevée',
    ar: 'حمولة عالية',
    en: 'High Load Risk',
  },
  'map.all': {
    fr: 'Tous',
    ar: 'الكل',
    en: 'All',
  },
  'map.legend.many': {
    fr: '10+ signalements',
    ar: '10+ بلاغات',
    en: '10+ reports',
  },
  'map.legend.several': {
    fr: '5–9 signalements',
    ar: '5–9 بلاغات',
    en: '5–9 reports',
  },
  'map.legend.few': {
    fr: '1–4 signalements',
    ar: '1–4 بلاغات',
    en: '1–4 reports',
  },
  'search.placeholder': {
    fr: 'Rechercher gouvernorat ou délégation...',
    ar: 'البحث عن ولاية أو معتمدية...',
    en: 'Search governorate or delegation...',
  },
  'search.filtering': {
    fr: 'Filtrage actif — seules les coupures de cette zone sont affichées',
    ar: 'تصفية نشطة — يتم عرض انقطاعات هذه المنطقة فقط',
    en: 'Filter active — only outages in this area are shown',
  },
  'passive.title': {
    fr: 'Détection automatique',
    ar: 'كشف تلقائي',
    en: 'Automatic detection',
  },
  'passive.desc': {
    fr: 'Aidez à détecter les coupures via des signaux anonymes (connectivité). Aucune donnée personnelle.',
    ar: 'ساعد في كشف الانقطاعات عبر إشارات مجهولة (الاتصال). لا بيانات شخصية.',
    en: 'Help detect outages via anonymous connectivity signals. No personal data stored.',
  },
  'passive.enable': {
    fr: 'Activer',
    ar: 'تفعيل',
    en: 'Enable',
  },
  'passive.later': {
    fr: 'Plus tard',
    ar: 'لاحقاً',
    en: 'Later',
  },
  'sidebar.quick': {
    fr: 'Zones populaires',
    ar: 'مناطق شائعة',
    en: 'Popular areas',
  },
  'sidebar.feed': {
    fr: 'Signalements en direct',
    ar: 'بلاغات مباشرة',
    en: 'Live reports',
  },
  'sidebar.noFeed': {
    fr: 'Aucun signalement récent.',
    ar: 'لا توجد بلاغات حديثة.',
    en: 'No recent reports.',
  },
  'elevator.risk.title': {
    fr: 'Risque ascenseur',
    ar: 'خطر المصعد',
    en: 'Elevator Risk',
  },
  'elevator.risk.low': {
    fr: 'Faible — usage normal',
    ar: 'منخفض — استخدام عادي',
    en: 'Low — normal usage',
  },
  'elevator.risk.medium': {
    fr: 'Modéré — soyez vigilant',
    ar: 'متوسط — كن حذراً',
    en: 'Medium — stay alert',
  },
  'elevator.risk.high': {
    fr: 'Élevé — évitez si possible',
    ar: 'مرتفع — تجنب إن أمكن',
    en: 'High — avoid if possible',
  },
  'elevator.risk.critical': {
    fr: 'Critique — pic 12h–14h',
    ar: 'حرج — ذروة 12–14',
    en: 'Critical — peak 12–2PM',
  },
  'elevator.risk.desc': {
    fr: 'Pendant les coupures, évitez les ascenseurs aux heures de pointe.',
    ar: 'أثناء الانقطاعات، تجنب المصاعد في ساعات الذروة.',
    en: 'During outages, avoid elevators during peak hours.',
  },
  'report.step1': {
    fr: 'Comment souhaitez-vous partager votre position ?',
    ar: 'كيف تريد مشاركة موقعك؟',
    en: 'How would you like to share your location?',
  },
  'report.next': {
    fr: 'Continuer',
    ar: 'متابعة',
    en: 'Continue',
  },
  'report.back': {
    fr: 'Retour',
    ar: 'رجوع',
    en: 'Back',
  },
  'report.confirm.title': {
    fr: 'Confirmer le signalement',
    ar: 'تأكيد البلاغ',
    en: 'Confirm report',
  },
  'stats.ranking': {
    fr: 'Classement par gouvernorat',
    ar: 'ترتيب الولايات',
    en: 'Governorate ranking',
  },
  'stats.timeline': {
    fr: 'Activité sur 24h',
    ar: 'النشاط خلال 24 ساعة',
    en: '24-hour activity',
  },
  'stats.sources': {
    fr: 'Sources des signalements',
    ar: 'مصادر البلاغات',
    en: 'Report sources',
  },
  'stats.recent': {
    fr: 'Signalements récents',
    ar: 'بلاغات حديثة',
    en: 'Recent reports',
  },
  'stats.period': {
    fr: 'Dernières 24 heures',
    ar: 'آخر 24 ساعة',
    en: 'Last 24 hours',
  },
  'stats.total': {
    fr: 'Total actif',
    ar: 'الإجمالي النشط',
    en: 'Total active',
  },
  'stats.peak': {
    fr: 'Pic horaire',
    ar: 'ذروة الساعة',
    en: 'Peak hour',
  },
  'stats.empty': {
    fr: 'Aucune donnée récente disponible.',
    ar: 'لا توجد بيانات حديثة.',
    en: 'No recent outage data available.',
  },
  'map.legend.severity': {
    fr: 'Gravité',
    ar: 'الخطورة',
    en: 'Severity',
  },
  'map.legend.report': {
    fr: 'Signalement individuel',
    ar: 'بلاغ فردي',
    en: 'Individual report',
  },
  'map.loading': {
    fr: 'Chargement de la carte...',
    ar: 'جاري تحميل الخريطة...',
    en: 'Loading map...',
  },
  'map.empty.title': {
    fr: 'Aucune coupure active',
    ar: 'لا توجد انقطاعات نشطة',
    en: 'No active outages',
  },
  'map.empty.desc': {
    fr: 'Aucune coupure signalée dans les dernières 24h.',
    ar: 'لا توجد انقطاعات مبلغ عنها في آخر 24 ساعة.',
    en: 'No outages reported in the last 24 hours.',
  },
  'map.empty.filtered.title': {
    fr: 'Aucune coupure dans cette zone',
    ar: 'لا انقطاع في هذه المنطقة',
    en: 'No outages in this area',
  },
  'map.empty.filtered.desc': {
    fr: '{count} coupure(s) ailleurs en Tunisie. Affichez toutes les zones.',
    ar: '{count} انقطاع(ات) في مناطق أخرى. اعرض كل المناطق.',
    en: '{count} outage(s) elsewhere in Tunisia. Show all areas.',
  },
  'map.empty.showall': {
    fr: 'Afficher tout',
    ar: 'عرض الكل',
    en: 'Show all',
  },
  'map.fetching': {
    fr: 'Récupération des données',
    ar: 'جاري جلب البيانات',
    en: 'Fetching outage data',
  },
  'map.severity.high': {
    fr: 'Élevée',
    ar: 'عالية',
    en: 'High',
  },
  'map.severity.medium': {
    fr: 'Moyenne',
    ar: 'متوسطة',
    en: 'Medium',
  },
  'map.severity.low': {
    fr: 'Faible',
    ar: 'منخفضة',
    en: 'Low',
  },
  'map.reports': {
    fr: 'signalements',
    ar: 'بلاغات',
    en: 'reports',
  },
  'map.zone': {
    fr: 'Zone',
    ar: 'المنطقة',
    en: 'Zone',
  },
  'map.latest': {
    fr: 'Dernier',
    ar: 'آخر',
    en: 'Latest',
  },
  'map.ago': {
    fr: 'il y a',
    ar: 'منذ',
    en: 'ago',
  },
  'map.via': {
    fr: 'via',
    ar: 'عبر',
    en: 'via',
  },
  'stats.title': {
    fr: 'Statistiques',
    ar: 'إحصائيات',
    en: 'Statistics',
  },
  'stats.live': {
    fr: 'En direct',
    ar: 'مباشر',
    en: 'Live',
  },
  'stats.min.ago': {
    fr: 'min',
    ar: 'دقيقة',
    en: 'min',
  },
  'confirm.button': {
    fr: 'Moi aussi',
    ar: 'أنا أيضًا',
    en: 'Me too',
  },
  'confirm.confirmed': {
    fr: 'Confirmé !',
    ar: 'تم التأكيد!',
    en: 'Confirmed!',
  },
  'confirm.count': {
    fr: 'confirmations',
    ar: 'تأكيدات',
    en: 'confirmations',
  },
  'dispute.button': {
    fr: 'Faux signalement',
    ar: 'بلاغ خاطئ',
    en: 'False report',
  },
  'dispute.done': {
    fr: 'Signalé !',
    ar: 'تم الإبلاغ!',
    en: 'Flagged!',
  },
  'dispute.removed': {
    fr: 'Supprimé !',
    ar: 'تمت الإزالة!',
    en: 'Removed!',
  },
  'nearby.title': {
    fr: 'Coupure active à proximité',
    ar: 'انقطاع نشط بالقرب منك',
    en: 'Active outage nearby',
  },
  'nearby.away': {
    fr: 'km',
    ar: 'كم',
    en: 'km away',
  },
  'admin.title': {
    fr: 'Administration',
    ar: 'الإدارة',
    en: 'Admin',
  },
  'admin.password': {
    fr: 'Mot de passe',
    ar: 'كلمة المرور',
    en: 'Password',
  },
  'admin.signin': {
    fr: 'Connexion',
    ar: 'تسجيل الدخول',
    en: 'Sign In',
  },
  'admin.signout': {
    fr: 'Déconnexion',
    ar: 'تسجيل الخروج',
    en: 'Sign Out',
  },
  'admin.restored': {
    fr: 'Rétabli',
    ar: 'تم الإصلاح',
    en: 'Restored',
  },
  'admin.reopen': {
    fr: 'Ré-ouvrir',
    ar: 'إعادة فتح',
    en: 'Re-open',
  },
  'admin.delete': {
    fr: 'Supprimer',
    ar: 'حذف',
    en: 'Delete',
  },
  'admin.refresh': {
    fr: 'Actualiser',
    ar: 'تحديث',
    en: 'Refresh',
  },
}

export function t(key: string, lang: Lang): string {
  return translations[key]?.[lang] ?? key
}

export function useT(lang: Lang) {
  return (key: string) => t(key, lang)
}
