/* ============================================================
   site.js — بيانات العلامة، الهيرو، الإحصاءات، الفوتر
   ============================================================ */

export const site = {
  brand: { ar: 'نيورا', en: 'NEURA' },
  tagline: {
    ar: 'شرح التقنية بشكل يخطف العين',
    en: 'Tech, explained beautifully',
  },
  hero: {
    ar: {
      eyebrow: 'موقع تعليمي تفاعلي — عربي / English',
      titleTop: 'خُد جولة جوه',
      titleGrad: 'عقل الآلة',
      titleBottom: 'وافهمها من جوّا',
      lead:
        '٨ فصول تفاعلية تشرح الذكاء الاصطناعي والبرمجة من الصفر: تعبث بالشبكة العصبية بيدك، تقطّع الكلام لآلة، وتشوف النموذج اللغوي بيفكر إزاي — خطوة بخطوة وبالعربي.',
      ctaPrimary: 'ابدأ الجولة',
      ctaSecondary: 'شوف المحاور',
      stats: [
        { n: 8, s: 'فصول تفاعلية' },
        { n: 9, s: 'تجارب حيّة' },
        { n: 45, prefix: '≈ ', s: 'دقيقة تعليم' },
        { n: 2, s: 'لغتان' },
      ],
      orbHint: 'اسحب الفقاعة… شبكة عصبية حقيقية بتتدرّب قدامك',
      chips: [
        { k: 'hidden layers', v: '2' },
        { k: 'params', v: '3.2K' },
        { k: 'loss', v: '0.041' },
        { k: 'device', v: 'GPU' },
      ],
    },
    en: {
      eyebrow: 'Interactive learning site — English / عربي',
      titleTop: 'Take a tour inside',
      titleGrad: "the machine's mind",
      titleBottom: 'and actually get it',
      lead:
        'Eight interactive chapters that explain AI and programming from scratch: poke a neural network with your finger, split text into machine pieces, and watch a language model think — step by step.',
      ctaPrimary: 'Start the tour',
      ctaSecondary: 'See the chapters',
      stats: [
        { n: 8, s: 'interactive chapters' },
        { n: 9, s: 'live demos' },
        { n: 45, prefix: '≈ ', s: 'minutes of learning' },
        { n: 2, s: 'languages' },
      ],
      orbHint: 'Drag the orb… that is a real network learning in your browser',
      chips: [
        { k: 'hidden layers', v: '2' },
        { k: 'params', v: '3.2K' },
        { k: 'loss', v: '0.041' },
        { k: 'device', v: 'GPU' },
      ],
    },
  },
  footer: {
    ar: {
      about:
        'نيورا موقع تعليمي تفاعلي: نشرح الذكاء الاصطناعي والبرمجة بأمثلة تلمسها بإيدك، عشان الفهم يثبت مش ينسى.',
      cols: [
        { title: 'الفصول', links: [{ label: 'الشبكات العصبية', href: '#neural' }, { label: 'النماذج اللغوية', href: '#attention' }, { label: 'البرمجة', href: '#code' }, { label: 'خريطة التعلّم', href: '#roadmap' }] },
        { title: 'الموقع', links: [{ label: 'الاختبار السريع', href: '#quiz' }, { label: 'أسئلة شائعة', href: '#faq' }, { label: 'المحاور', href: '#chapters' }, { label: 'أعلى الصفحة', href: '#top' }] },
      ],
      newsTitle: 'خد الفصول الجديدة على بريدك',
      newsPlaceholder: 'بريدك الإلكتروني',
      newsBtn: 'اشترك',
      newsOk: 'تمام! حسابك اتسجّل محليًا وهنوصلك أول فصل جديد.',
      newsBad: 'اكتب بريد إلكتروني صحيح الأول 🙂',
      rights: 'صُنع بشغف · كل الحقوق محفوظة',
      shareLink: '🔗 انسخ رابط الموقع',
      madeWith: 'مبني بـ HTML/CSS/JS وبس — بدون أي مكتبات خارجية',
    },
    en: {
      about:
        'NEURA is an interactive learning site: we explain AI and programming with demos you can touch, so understanding actually sticks.',
      cols: [
        { title: 'Chapters', links: [{ label: 'Neural networks', href: '#neural' }, { label: 'Language models', href: '#attention' }, { label: 'Programming', href: '#code' }, { label: 'Learning map', href: '#roadmap' }] },
        { title: 'Site', links: [{ label: 'Quick quiz', href: '#quiz' }, { label: 'FAQ', href: '#faq' }, { label: 'Chapters', href: '#chapters' }, { label: 'Back to top', href: '#top' }] },
      ],
      newsTitle: 'Get new chapters by email',
      newsPlaceholder: 'you@example.com',
      newsBtn: 'Subscribe',
      newsOk: 'Nice! Saved locally — we will ping you with chapter one.',
      newsBad: 'Please enter a valid email first 🙂',
      rights: 'Made with care · All rights reserved',
      shareLink: '🔗 Copy site link',
      madeWith: 'Built with plain HTML/CSS/JS — zero external libraries',
    },
  },
};

export const socials = [
  {
    label: 'Email',
    href: 'mailto:hello@neura.example',
    path: 'M3 7l9 6 9-6M3 7v10h18V7H3Z',
  },
  {
    label: 'GitHub',
    href: 'https://github.com',
    path: 'M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.9c0 .3.2.6.7.5A10 10 0 0 0 12 2Z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    path: 'M21.6 7.2s-.2-1.4-.8-2c-.7-.8-1.6-.8-2-.9C16.9 4.1 12 4.1 12 4.1h0s-4.9 0-6.8.2c-.4.1-1.3.1-2 .9-.6.6-.8 2-.8 2S2.2 8.8 2.2 10.5v1.6c0 1.6.2 3.3.2 3.3s.2 1.4.8 2c.7.8 1.7.8 2.1.9 1.9.2 6.7.2 6.7.2s4.9 0 6.8-.2c.4-.1 1.3-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.6c0-1.7-.2-3.3-.2-3.3ZM10 14.6V8.9l5.2 2.9-5.2 2.8Z',
  },
];
