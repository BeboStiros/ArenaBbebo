/* ============================================================
   quiz.js — اختبار سريع (٥ أسئلة) بنسختين عربي/إنجليزي
   ============================================================ */

export const quiz = {
  ar: [
    {
      q: 'إيه اللي بيتخزن فيه «التعلّم» جوه الشبكة العصبية؟',
      opts: ['أسماء الملفات', 'الأوزان والقيم الانحيازية', 'لون الخط', 'الشاشة'],
      correct: 1,
      why: 'التعلّم كله معنى في تعديل الأوزان والانحيازات خلال التدريب، مفيش مكان تاني.',
    },
    {
      q: 'ليه بنقسّم النص لـ «وحدات (Tokens)» قبل ما النموذج يقرأه؟',
      opts: ['عشان يبقى أطول', 'عشان نحوله لأرقام يقدر يشتغل عليها', 'عشان الترجمة', 'عشان الجرافيك'],
      correct: 1,
      why: 'النموذج بيشتغل بالأرقام فقط، والتقطيع بيوفر قاموس صغير مرن يقدر يمثل أي كلمة جديدة.',
    },
    {
      q: 'آلية «الانتباه (Attention)» بتعمل إيه بالظبط؟',
      opts: [
        'بتزوّد سرعة الإنترنت',
        'بتحدد أي كلمات تانية مهمة لفهم الكلمة الحالية',
        'بتترجم النص فورًا',
        'بتخزّن الملفات',
      ],
      correct: 1,
      why: 'الانتباه بيوزّع أوزان ارتباط بين الكلمة وباقي الكلمات، وهو ده اللي بيديها سياقها.',
    },
    {
      q: 'لو خطوة التعلّم (Learning rate) كبيرة جدًا، إيه اللي بيحصل عادة؟',
      opts: ['النموذج بيتعلم أسرع وينجح', 'التدريب بيتخبط ومش بيستقر', 'النموذج يتعطل', 'البيانات تتمسح'],
      correct: 1,
      why: 'الخطوة الكبيرة بتخلي الأوزان تقفز حول الحل أو تبعد عنه — وده اسمه Divergence.',
    },
    {
      q: 'أضمن تعامل مع رقم مهم جابه نموذج لغوي؟',
      opts: [
        'أصدّقه لأنه بيتكلم بثقة',
        'أتحقق منه من مصدر مستقل',
        'أسأله يكرر نفس الجواب',
        'أنسخه وأنا مغمض',
      ],
      correct: 1,
      why: 'الطمأنة مش دليل. التحقق من مصدر مستقل هو الحل الوحيد لعمل النماذج بأمان.',
    },
  ],
  en: [
    {
      q: 'Where does a neural network actually store its “learning”?',
      opts: ['In file names', 'In weights and biases', 'In the font colour', 'On the screen'],
      correct: 1,
      why: 'Learning means adjusting weights and biases during training — there is nowhere else.',
    },
    {
      q: 'Why do we split text into tokens before a model reads it?',
      opts: ['To make it longer', 'To turn it into numbers the model can compute with', 'To translate it', 'For graphics'],
      correct: 1,
      why: 'Models work with numbers only; sub-word tokens keep the dictionary small yet flexible.',
    },
    {
      q: 'What does the attention mechanism actually do?',
      opts: [
        'Speeds up your internet',
        'Decides which other words matter for the current one',
        'Translates instantly',
        'Stores files',
      ],
      correct: 1,
      why: 'Attention assigns relevance weights between tokens — that is what gives a word its context.',
    },
    {
      q: 'If the learning rate is far too large, what usually happens?',
      opts: ['The model learns faster and wins', 'Training oscillates and fails to converge', 'The model crashes', 'The data is deleted'],
      correct: 1,
      why: 'Huge steps send weights bouncing around the optimum — the classic divergence failure.',
    },
    {
      q: 'What is the safest way to handle an important number a language model gave you?',
      opts: [
        'Trust it because it sounded confident',
        'Verify it against an independent source',
        'Ask it to repeat the same answer',
        'Copy it with your eyes closed',
      ],
      correct: 1,
      why: 'Fluency is not evidence. Independent verification is the only safe workflow.',
    },
  ],
};
