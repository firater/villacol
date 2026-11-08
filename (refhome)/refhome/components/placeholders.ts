import { refMedia } from "../media";

const { heroMain } = refMedia;

export const railItems = [
  { label: "Kalkan Old Town", tally: "120", visual: heroMain.src },
  { label: "Patara Exclusive", tally: "45", visual: heroMain.src },
  { label: "Kaş Peninsula", tally: "82", visual: heroMain.src },
  { label: "İslamlar Village", tally: "34", visual: heroMain.src },
  { label: "Fethiye Center", tally: "210", visual: heroMain.src },
  { label: "Üzümlü Valley", tally: "15", visual: heroMain.src },
  { label: "Side Ancient", tally: "22", visual: heroMain.src },
  { label: "Olympos Treehouse", tally: "10", visual: heroMain.src },
  { label: "Dalaman River", tally: "28", visual: heroMain.src },
];

export const dealTabs = [
  { key: "a", caption: "7 Gece Kal 6 Öde" },
  { key: "b", caption: "Erken Rezervasyon" },
  { key: "c", caption: "İndirim Avantajları" },
];

const snap = heroMain.src;

export const dealTiles = [
  {
    title: "Lüks Villa Sahil 1",
    area: "kas",
    badge: "%15 İNDİRİM",
    snaps: [snap, snap],
    nightly: "5,000",
    score: "4.9",
    guests: 2,
    beds: 1,
    sq: 140,
    when: "12 Şub",
  },
  {
    title: "Lüks Villa Sahil 7",
    area: "uzumlu",
    badge: "7 AL 6 ÖDE",
    snaps: [snap, snap],
    nightly: "11,000",
    score: "4.8",
    guests: 6,
    beds: 1,
    sq: 140,
    when: "Hemen Müsait",
  },
];

export const pickTabs = ["muhafazakar", "balayi", "deniz-manzarali", "luks"];

export const pickTiles = [
  {
    title: "Lüks Villa Sahil 1",
    area: "kas",
    snaps: [snap, snap, snap],
    nightly: "5,000",
    unit: "TRY",
    people: 2,
    rooms: 1,
    chipA: "1 GECE BEDAVA",
    chipB: null as string | null,
  },
  {
    title: "Lüks Villa Sahil 2",
    area: "kalkan",
    snaps: [snap, snap],
    nightly: "6,000",
    unit: "TRY",
    people: 3,
    rooms: 2,
    chipA: null,
    chipB: "ERKEN REZ. %15",
  },
  {
    title: "Lüks Villa Sahil 3",
    area: "fethiye",
    snaps: [snap],
    nightly: "7,000",
    unit: "TRY",
    people: 4,
    rooms: 3,
    chipA: null,
    chipB: null,
  },
];

export const perkSlides = [
  {
    heading: "Doğrulanmış Villalar",
    blurb: "Her villayı yerinde inceliyor ve videolarla doğruluyoruz. Sürprizlere yer yok!",
    visual: heroMain.src,
  },
  {
    heading: "12 Taksite Varan Ödeme",
    blurb: "Tatilinizi şimdi planlayın, taksit seçenekleriyle bütçenizi yormadan ödeyin.",
    visual: heroMain.src,
  },
  {
    heading: "Yerel Rehber Uygulaması",
    blurb: "Konaklamanız boyunca size özel dijital rehberinizle en iyi restoranları keşfedin.",
    visual: heroMain.src,
  },
];

export const qaBlocks = [
  {
    q: "Rezervasyon Süreci Nasıl İşliyor?",
    a: "Cimri Villa'da lüks tatiliniz bir tıkla başlar. Beğendiğiniz villayı seçtikten sonra uzman ekibimiz tüm detayları şeffaflık politikamız dahilinde ve en iyi fiyat garantisi ile sizlere sunar.",
  },
  {
    q: "Villa Doğrulama Standartlarınız Nelerdir?",
    a: "Portföyümüzdeki her villa, yerinde doğrulama sürecinden geçer. Ekiplerimiz villayı bizzat ziyaret ederek mekanın ve özelliklerinin gerçekliğini tesciller.",
  },
  {
    q: "Esnek Ödeme ve Taksit Seçenekleri",
    a: "Konforunuz bizim için öncelikli. Sadece ön ödeme ile rezervasyon yapablilirsiniz. 12 aya varan taksit seçenekleri ve güvenli ödeme altyapımız tatilinizi planlayabilirsiniz.",
  },
  {
    q: "Muhafazakar ve Korunaklı Villalar",
    a: "Muhafazakar ve balayı villalarımızda dış dünyadan tamamen izole, size özel bir yaşam alanı garanti ediyoruz. Detaylı bilgi için villa sayfalarındaki editörlerimizin muhafazakarlık oranı notlarını inceleyebilirsiniz.",
  },
  {
    q: "Gizlilik ve Güvenlik Protokolleri",
    a: "Muhafazakar ve balayı villalarımızda dış dünyadan tamamen izole, size özel bir yaşam alanı garanti ediyoruz.",
  },
];
