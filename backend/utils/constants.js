const VERIFICATION_QUESTIONS = [
  { id: 1, question: 'Mexanika-riyaziyyat fakültəsi hansı korpusda yerləşir?', answer: '3' },
  { id: 2, question: 'Tətbiqi riyaziyyat və kibernetika fakültəsi hansı korpusda yerləşir?', answer: '3' },
  { id: 3, question: 'Fizika fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { id: 4, question: 'Kimya fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { id: 5, question: 'Biologiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { id: 6, question: 'Ekologiya və torpaqşünaslıq fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { id: 7, question: 'Coğrafiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { id: 8, question: 'Geologiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { id: 9, question: 'Filologiya fakültəsi hansı korpusda yerləşir?', answer: '1' },
  { id: 10, question: 'Tarix fakültəsi hansı korpusda yerləşir?', answer: '3' },
  { id: 11, question: 'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi hansı korpusda yerləşir?', answer: '1' },
  { id: 12, question: 'Hüquq fakültəsi hansı korpusda yerləşir?', answer: '1' },
  { id: 13, question: 'Jurnalistika fakültəsi hansı korpusda yerləşir?', answer: '2' },
  { id: 14, question: 'İnformasiya və sənəd menecmenti fakültəsi hansı korpusda yerləşir?', answer: '2' },
  { id: 15, question: 'Şərqşünaslıq fakültəsi hansı korpusda yerləşir?', answer: '2' },
  { id: 16, question: 'Sosial elmlər və psixologiya fakültəsi hansı korpusda yerləşir?', answer: '2' }
];

const ANSWER_OPTIONS = ['1', '2', '3', 'əsas'];

const FACULTIES = [
  'Mexanika-riyaziyyat fakültəsi',
  'Tətbiqi riyaziyyat və kibernetika fakültəsi',
  'Fizika fakültəsi',
  'Kimya fakültəsi',
  'Biologiya fakültəsi',
  'Ekologiya və torpaqşünaslıq fakültəsi',
  'Coğrafiya fakültəsi',
  'Geologiya fakültəsi',
  'Filologiya fakültəsi',
  'Tarix fakültəsi',
  'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi',
  'Hüquq fakültəsi',
  'Jurnalistika fakültəsi',
  'İnformasiya və sənəd menecmenti fakültəsi',
  'Şərqşünaslıq fakültəsi',
  'Sosial elmlər və psixologiya fakültəsi'
];

const DEGREES = ['Bakalavr', 'Magistr', 'Doktorantura'];

function getRandomQuestions(count = 3) {
  const shuffled = [...VERIFICATION_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function validateAnswers(answers) {
  let correctCount = 0;
  
  answers.forEach(answer => {
    const question = VERIFICATION_QUESTIONS.find(q => q.id === answer.questionId);
    if (question && question.answer === answer.answer) {
      correctCount++;
    }
  });

  return correctCount >= 2;
}

module.exports = {
  VERIFICATION_QUESTIONS,
  ANSWER_OPTIONS,
  FACULTIES,
  DEGREES,
  getRandomQuestions,
  validateAnswers
};
