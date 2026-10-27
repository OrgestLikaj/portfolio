/**
 * Shërbimet juridike.
 *
 * Përmbajtja është draft fillestar dhe përshkruan fusha të përgjithshme.
 * Para publikimit, avokati duhet të konfirmojë fushat dhe shembujt që
 * përputhen me praktikën e tij/saj reale. Hiqni çdo shembull që nuk ofrohet.
 */

export interface Service {
  slug: string;
  title: string;
  /** Titulli për <title> dhe kërkimet. */
  seoTitle: string;
  metaDescription: string;
  /** Përshkrim i shkurtër për kartat. */
  summary: string;
  /** Paragrafë hyrës për faqen e shërbimit. */
  intro: string[];
  /** Situata ku shërbimi mund të jetë i dobishëm. */
  situations: string[];
  /** Si mund të ndihmojë avokati. */
  assistance: string[];
  related: string[];
}

export const services: Service[] = [
  {
    slug: 'ceshtje-penale',
    title: 'Çështje penale',
    seoTitle: 'Avokat për çështje penale',
    metaDescription:
      'Asistencë dhe mbrojtje ligjore në çështje penale në Shqipëri: këshillim, ndjekje e procedimit dhe përfaqësim në gjykatë, me konfidencialitet të plotë.',
    summary:
      'Asistencë ligjore dhe mbrojtje gjatë procedimit penal, me vëmendje ndaj të drejtave tuaja në çdo fazë.',
    intro: [
      'Përfshirja në një procedim penal është ndër situatat më të rënda që mund të përjetojë një person. Në këto momente, këshillimi i hershëm dhe i kujdesshëm ka rëndësi të veçantë.',
      'Ofroj asistencë ligjore në fazat e procedimit penal ku lejohet pjesëmarrja e mbrojtësit, duke ju shpjeguar qartë të drejtat, mundësitë dhe rreziqet që lidhen me çështjen tuaj.',
    ],
    situations: [
      'Jeni thirrur nga policia ose nga prokuroria për t’u pyetur.',
      'Jeni person nën hetim ose i pandehur në një procedim penal.',
      'Ndaj jush ose një personi të afërm është caktuar një masë sigurimi.',
      'Jeni dëmtuar nga një vepër penale dhe dëshironi të njihni të drejtat tuaja në procedim.',
      'Dëshironi të ankimoni një vendim të marrë në një procedim penal.',
    ],
    assistance: [
      'Shpjegim i qartë i situatës procedurale dhe i të drejtave tuaja.',
      'Asistencë gjatë veprimeve procedurale ku lejohet prania e mbrojtësit.',
      'Përgatitje e kërkesave, parashtresave dhe ankimeve.',
      'Përfaqësim në seancat gjyqësore.',
      'Informim i rregullt për ecurinë e çështjes.',
    ],
    related: ['perfaqesim-gjyqesor', 'konsulence-juridike'],
  },
  {
    slug: 'ceshtje-civile',
    title: 'Çështje civile',
    seoTitle: 'Avokat për çështje civile',
    metaDescription:
      'Këshillim dhe përfaqësim ligjor në mosmarrëveshje civile në Shqipëri: kontrata, pronë, detyrime, dëmshpërblim dhe trashëgimi.',
    summary:
      'Zgjidhje e mosmarrëveshjeve civile që lidhen me kontratat, pronën, detyrimet dhe çështje të tjera personale.',
    intro: [
      'Mosmarrëveshjet civile prekin shpesh pronën, detyrimet kontraktore dhe marrëdhëniet familjare ose personale. Ato kërkojnë analizë të kujdesshme të fakteve, të dokumenteve dhe të rrugëve ligjore në dispozicion.',
      'Synimi im është t’ju ndihmoj të kuptoni pozicionin tuaj ligjor dhe të zgjidhni rrugën më të përshtatshme, qoftë përmes marrëveshjes, qoftë në gjykatë.',
    ],
    situations: [
      'Mosmarrëveshje për pronësinë, kufijtë ose përdorimin e një pasurie të paluajtshme.',
      'Mospërmbushje e një kontrate ose e një detyrimi për pagesë.',
      'Kërkesë për shpërblimin e një dëmi të shkaktuar.',
      'Çështje trashëgimie dhe ndarje pasurie.',
      'Çështje familjare, si zgjidhja e martesës ose detyrimi për ushqim.',
    ],
    assistance: [
      'Vlerësim i dokumenteve dhe i pretendimeve të palëve.',
      'Negocim dhe përpjekje për zgjidhje me marrëveshje, kur është e mundur.',
      'Hartim i padive, kundërpadive dhe akteve të tjera procedurale.',
      'Përfaqësim para gjykatës në të gjitha fazat e gjykimit.',
    ],
    related: ['perfaqesim-gjyqesor', 'ceshtje-tregtare-dhe-biznesi', 'konsulence-juridike'],
  },
  {
    slug: 'ceshtje-administrative',
    title: 'Çështje administrative',
    seoTitle: 'Avokat për çështje administrative',
    metaDescription:
      'Asistencë ligjore në procedura dhe mosmarrëveshje administrative në Shqipëri: ankim ndaj akteve administrative, gjoba, leje dhe përfaqësim në gjykatë.',
    summary:
      'Asistencë në procedurat administrative dhe në kundërshtimin e akteve të organeve publike.',
    intro: [
      'Vendimet e organeve publike ndikojnë drejtpërdrejt në të drejtat dhe interesat tuaja, qoftë kur bëhet fjalë për leje e licenca, për gjoba, apo për marrëdhënie pune në administratën publike.',
      'Ju ndihmoj të vlerësoni ligjshmërinë e një akti administrativ dhe mundësitë për ta kundërshtuar atë, pranë organit kompetent ose në gjykatë.',
    ],
    situations: [
      'Keni marrë një gjobë ose sanksion administrativ që e konsideroni të padrejtë.',
      'Një kërkesë për leje, licencë ose autorizim është refuzuar ose ka mbetur pa përgjigje.',
      'Dëshironi të ankimoni një vendim të një institucioni publik.',
      'Keni një mosmarrëveshje që lidhet me marrëdhënien e punës në shërbimin civil.',
    ],
    assistance: [
      'Analizë e aktit administrativ dhe e mjeteve ligjore për ta kundërshtuar.',
      'Përgatitje e ankimit administrativ pranë organit kompetent.',
      'Përfaqësim në gjykatën administrative, kur çështja e kërkon dhe ligji e lejon.',
      'Komunikim me institucionet në emrin tuaj, në bazë të autorizimit.',
    ],
    related: ['perfaqesim-gjyqesor', 'konsulence-juridike'],
  },
  {
    slug: 'ceshtje-tregtare-dhe-biznesi',
    title: 'Çështje tregtare dhe biznesi',
    seoTitle: 'Avokat për çështje tregtare dhe biznesi',
    metaDescription:
      'Këshillim ligjor për biznese dhe sipërmarrës në Shqipëri: kontrata tregtare, shoqëri tregtare, mosmarrëveshje biznesi dhe arkëtim detyrimesh.',
    summary:
      'Këshillim për sipërmarrës dhe shoqëri tregtare, nga kontratat e përditshme deri te mosmarrëveshjet tregtare.',
    intro: [
      'Për sipërmarrësit dhe shoqëritë tregtare, vendimet e mira ligjore merren përpara se të lindë problemi. Një kontratë e hartuar me kujdes mund të parandalojë mosmarrëveshje të kushtueshme.',
      'Ofroj këshillim dhe asistencë në çështje që lidhen me veprimtarinë e përditshme të biznesit, me kontratat dhe me mosmarrëveshjet tregtare.',
    ],
    situations: [
      'Hartim ose rishikim i një kontrate me klientë, furnitorë ose partnerë.',
      'Themelim i një shoqërie tregtare dhe përgatitje e akteve themeluese.',
      'Mosmarrëveshje ndërmjet ortakëve ose me partnerë tregtarë.',
      'Arkëtim i detyrimeve të papaguara.',
      'Pyetje ligjore që lindin gjatë veprimtarisë së përditshme të biznesit.',
    ],
    assistance: [
      'Hartim dhe rishikim kontratash, me shpjegim të qartë të rreziqeve.',
      'Këshillim për strukturën dhe dokumentet e shoqërisë.',
      'Negocim me palët e tjera dhe përpjekje për zgjidhje jashtëgjyqësore.',
      'Përfaqësim në mosmarrëveshje tregtare para gjykatës.',
    ],
    related: ['ceshtje-civile', 'konsulence-juridike', 'perfaqesim-gjyqesor'],
  },
  {
    slug: 'perfaqesim-gjyqesor',
    title: 'Përfaqësim gjyqësor',
    seoTitle: 'Përfaqësim gjyqësor',
    metaDescription:
      'Përfaqësim gjyqësor në Shqipëri: përgatitje e çështjes, hartim i akteve procedurale dhe pjesëmarrje në seanca para gjykatave dhe organeve kompetente.',
    summary:
      'Përfaqësim para gjykatave dhe organeve kompetente, me përgatitje të kujdesshme në çdo fazë të procesit.',
    intro: [
      'Kur një mosmarrëveshje kalon në gjykatë, përgatitja e kujdesshme dhe ndjekja e vazhdueshme e çështjes janë thelbësore.',
      'Ju përfaqësoj para gjykatave dhe organeve të tjera kompetente, në masën që lejohet nga ligji dhe nga autorizimi që më jepni, duke ju mbajtur të informuar për çdo hap.',
    ],
    situations: [
      'Keni marrë një padi ose një njoftim nga gjykata.',
      'Dëshironi të ngrini padi për të mbrojtur një të drejtë.',
      'Keni nevojë të ankimoni një vendim gjyqësor.',
      'Keni nevojë për përfaqësim në një seancë gjyqësore të caktuar.',
    ],
    assistance: [
      'Vlerësim paraprak i çështjes dhe i provave në dispozicion.',
      'Hartim i padisë, i parashtresave dhe i akteve të tjera procedurale.',
      'Pjesëmarrje në seanca dhe ndjekje e procesit në çdo fazë.',
      'Informim i rregullt për ecurinë dhe për hapat e mëtejshëm.',
    ],
    related: ['ceshtje-civile', 'ceshtje-penale', 'ceshtje-administrative'],
  },
  {
    slug: 'konsulence-juridike',
    title: 'Konsulencë juridike',
    seoTitle: 'Konsulencë juridike',
    metaDescription:
      'Konsulencë juridike për individë dhe biznese në Shqipëri: vlerësim paraprak i çështjes, shpjegim i të drejtave dhe detyrimeve, orientim për hapat e mëtejshëm.',
    summary:
      'Vlerësim paraprak i pyetjes suaj ligjore dhe orientim i qartë për të drejtat, detyrimet dhe hapat e mundshëm.',
    intro: [
      'Shpesh, një bisedë e hershme me një avokat ju ndihmon të shmangni probleme më të mëdha më vonë.',
      'Konsulenca juridike ju jep një pamje të qartë të të drejtave dhe detyrimeve tuaja, si dhe të mundësive që keni në dispozicion, që të merrni vendime të informuara.',
    ],
    situations: [
      'Para nënshkrimit të një kontrate ose të një dokumenti të rëndësishëm.',
      'Kur keni marrë një shkresë zyrtare dhe nuk e dini si të veproni.',
      'Kur dëshironi të dini nëse keni bazë për të ngritur një pretendim.',
      'Kur një biznes ka nevojë për mbështetje ligjore të vazhdueshme.',
    ],
    assistance: [
      'Vlerësim paraprak i pyetjes suaj ligjore.',
      'Shpjegim i qartë, pa terma teknikë të panevojshëm.',
      'Orientim për hapat e mundshëm dhe për rreziqet përkatëse.',
      'Opinion ligjor me shkrim, kur kërkohet.',
    ],
    related: ['ceshtje-civile', 'ceshtje-tregtare-dhe-biznesi', 'ceshtje-administrative'],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

/** Opsionet për fushën "Shërbimi" në formularë. */
export const serviceOptions: { value: string; label: string }[] = [
  ...services.map((s) => ({ value: s.slug, label: s.title })),
  { value: 'tjeter', label: 'Tjetër / nuk e di ende' },
];
