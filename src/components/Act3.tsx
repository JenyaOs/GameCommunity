import { useState } from 'react';
import TypeWriter from './TypeWriter';

/* ───── TYPES ───── */
type StakeholderName = 'arkady' | 'semyon' | 'lenochka';
type Quadrant = 'hi-hi' | 'hi-lo' | 'lo-hi' | 'lo-lo';

interface StakeholderPlacement {
  arkady?: Quadrant;
  semyon?: Quadrant;
  lenochka?: Quadrant;
}

const CORRECT_PLACEMENT: Record<StakeholderName, Quadrant> = {
  arkady: 'hi-lo',   // Влияние↑ Интерес↓
  semyon: 'hi-hi',   // Влияние↑ Интерес↑
  lenochka: 'lo-hi', // Влияние↓ Интерес↑
};

const STAKEHOLDER_INFO: Record<StakeholderName, { name: string; desc: string; emoji: string }> = {
  arkady: { name: 'Аркадий Петрович', desc: 'Гендиректор. Подписывает бюджеты.', emoji: '👔' },
  semyon: { name: 'Семён Игоревич', desc: 'Руководитель продаж. Главный заказчик.', emoji: '📊' },
  lenochka: { name: 'Леночка', desc: 'Менеджер по клиентам. Энтузиаст CRM.', emoji: '💁‍♀️' },
};

/* ───── QUIZ ───── */
interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; text: string }[];
  correctSingle?: string;
  correctMulti?: string[];
  multiSelect?: boolean;
  explanation: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Почему нейросети и 20 кастомных полей невозможны в рамках проекта?',
    multiSelect: true,
    options: [
      { label: 'А', text: 'Клиент принципиально против инноваций' },
      { label: 'Б', text: 'Сервер слабый (2 Гб ОЗУ) — не потянет ИИ' },
      { label: 'В', text: 'В команде нет ML-специалистов' },
      { label: 'Г', text: 'Бюджет минимальный — не хватит на доработку' },
      { label: 'Д', text: 'Срок 4 месяца — не успеем реализовать' },
    ],
    correctMulti: ['Б', 'Г', 'Д'],
    explanation: 'Сервер 2 ГБ ОЗУ не потянет ИИ, бюджет минимальный, а 4 месяца — слишком мало для таких фич.',
  },
  {
    id: 'q2',
    question: 'Что является критическим блокером проекта?',
    options: [
      { label: 'А', text: 'Отсутствие детального ТЗ' },
      { label: 'Б', text: 'Ограничение серверных ресурсов (2 Гб ОЗУ)' },
      { label: 'В', text: 'Нежелание команды работать с новой CRM' },
      { label: 'Г', text: 'Отсутствие лицензий на ПО' },
    ],
    correctSingle: 'Б',
    explanation: 'Сервер с 2 Гб ОЗУ — главное техническое ограничение, определяющее архитектуру решения.',
  },
  {
    id: 'q3',
    question: 'Какая стратегия управления стейкхолдерами оптимальна?',
    options: [
      { label: 'А', text: 'Полностью игнорировать пожелания Леночки' },
      { label: 'Б', text: 'Реализовать абсолютно всё, что просит Семён' },
      { label: 'В', text: 'Баланс: критические требования + 2–3 поля для Леночки' },
      { label: 'Г', text: 'Передать проект другой команде' },
    ],
    correctSingle: 'В',
    explanation: 'Баланс интересов: выполняем жёсткие требования, но даём Леночке 2–3 кастомных поля для лояльности.',
  },
  {
    id: 'q4',
    question: 'Какое решение для MVP оптимально?',
    options: [
      { label: 'А', text: 'Облачная CRM с ИИ, срок 6 месяцев' },
      { label: 'Б', text: 'Локальная CRM, 3 месяца, в рамках бюджета' },
      { label: 'В', text: 'Покупка готового коробочного решения' },
      { label: 'Г', text: 'Отказ от проекта' },
    ],
    correctSingle: 'Б',
    explanation: 'Локальная CRM на своём сервере, 3 месяца с запасом, вписывается в бюджет и ресурсы.',
  },
];

/* ───── COMPONENT ───── */
type Phase = 'matrix' | 'q1' | 'q2' | 'q3' | 'q4' | 'done';

interface Act3Props {
  onComplete: (points: number) => void;
  mode: 'online' | 'office';
}

export default function Act3({ onComplete, mode: _mode }: Act3Props) {
  const [phase, setPhase] = useState<Phase>('matrix');
  const [placements, setPlacements] = useState<StakeholderPlacement>({});
  const [selectedPerson, setSelectedPerson] = useState<StakeholderName | null>(null);
  const [matrixChecked, setMatrixChecked] = useState(false);
  const [matrixCorrect, setMatrixCorrect] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Set<string>>>({});
  const [quizChecked, setQuizChecked] = useState<Record<string, boolean>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [introReady, setIntroReady] = useState(false);

  const handleQuadrantClick = (quad: Quadrant) => {
    if (selectedPerson && !matrixChecked) {
      setPlacements((prev) => ({ ...prev, [selectedPerson]: quad }));
      setSelectedPerson(null);
    }
  };

  const checkMatrix = () => {
    const correct =
      placements.arkady === CORRECT_PLACEMENT.arkady &&
      placements.semyon === CORRECT_PLACEMENT.semyon &&
      placements.lenochka === CORRECT_PLACEMENT.lenochka;
    setMatrixChecked(true);
    setMatrixCorrect(correct);
    if (correct) setTotalPoints((p) => p + 1);
  };

  const toggleQuizOption = (qId: string, label: string, multi: boolean) => {
    if (quizChecked[qId]) return;
    setQuizAnswers((prev) => {
      const current = new Set(prev[qId] || []);
      if (multi) {
        if (current.has(label)) current.delete(label);
        else current.add(label);
      } else {
        current.clear();
        current.add(label);
      }
      return { ...prev, [qId]: current };
    });
  };

  const checkQuiz = (q: QuizQuestion) => {
    const answers = quizAnswers[q.id] || new Set<string>();
    let correct = false;
    if (q.multiSelect && q.correctMulti) {
      correct =
        answers.size === q.correctMulti.length &&
        q.correctMulti.every((a) => answers.has(a));
    } else if (q.correctSingle) {
      correct = answers.size === 1 && answers.has(q.correctSingle);
    }
    setQuizChecked((prev) => ({ ...prev, [q.id]: true }));
    if (correct) setTotalPoints((p) => p + 1);
    return correct;
  };

  const PHASE_MAP: Record<string, Phase> = { q1: 'q2', q2: 'q3', q3: 'q4', q4: 'done' };

  const renderQuiz = (q: QuizQuestion) => {
    const answers = quizAnswers[q.id] || new Set<string>();
    const checked = quizChecked[q.id];
    const isCorrectAnswer = (label: string) => {
      if (q.multiSelect) return q.correctMulti?.includes(label);
      return q.correctSingle === label;
    };

    return (
      <div className="page-fade-in">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">❓</span>
          <div>
            <p className="font-bold text-navy">{q.question}</p>
            {q.multiSelect && (
              <p className="text-xs text-navy-det mt-1">Выберите несколько вариантов</p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {q.options.map((opt) => {
            let cls = 'quiz-option';
            if (answers.has(opt.label)) cls += ' selected';
            if (checked) {
              if (isCorrectAnswer(opt.label)) cls = 'quiz-option correct';
              else if (answers.has(opt.label)) cls = 'quiz-option wrong';
            }
            return (
              <div
                key={opt.label}
                className={cls}
                onClick={() => toggleQuizOption(q.id, opt.label, !!q.multiSelect)}
              >
                <span className="font-bold text-orange mr-2">{opt.label}.</span>
                <span className="text-sm text-navy">{opt.text}</span>
              </div>
            );
          })}
        </div>

        {!checked ? (
          <div className="text-center">
            <button
              onClick={() => checkQuiz(q)}
              disabled={answers.size === 0}
              className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark disabled:opacity-40"
            >
              Ответить ✓
            </button>
          </div>
        ) : (
          <div className="page-fade-in">
            <div className={`rounded-lg p-3 mb-4 ${
              (q.multiSelect ? q.correctMulti?.every(a => answers.has(a)) && answers.size === q.correctMulti?.length : answers.has(q.correctSingle!))
                ? 'bg-green-50 border border-green-thread'
                : 'bg-red-50 border border-red-thread'
            }`}>
              <p className="text-sm text-navy">
                <strong>
                  {(q.multiSelect
                    ? q.correctMulti?.every(a => answers.has(a)) && answers.size === q.correctMulti?.length
                    : answers.has(q.correctSingle!))
                    ? '✅ Верно! +1 балл'
                    : `❌ Неверно. Правильный ответ: ${q.multiSelect ? q.correctMulti?.join(', ') : q.correctSingle}`}
                </strong>
              </p>
              <p className="text-xs text-navy/70 mt-1">{q.explanation}</p>
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  const next = PHASE_MAP[q.id];
                  if (next) setPhase(next as Phase);
                }}
                className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark"
              >
                {q.id === 'q4' ? 'Завершить экспертизу →' : 'Следующий вопрос →'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getPersonInQuadrant = (quad: Quadrant): StakeholderName | undefined => {
    return (Object.entries(placements) as [StakeholderName, Quadrant][]).find(
      ([, q]) => q === quad
    )?.[0];
  };

  const renderQuadrant = (quad: Quadrant, label: string, strategy: string) => {
    const person = getPersonInQuadrant(quad);
    const isCorrectPlacement = matrixChecked && person && CORRECT_PLACEMENT[person] === quad;
    const isWrongPlacement = matrixChecked && person && CORRECT_PLACEMENT[person] !== quad;

    return (
      <div
        className={`matrix-quadrant rounded-lg cursor-pointer ${
          selectedPerson && !matrixChecked ? 'highlight' : ''
        } ${isCorrectPlacement ? 'bg-green-50 border-green-thread' : ''} ${isWrongPlacement ? 'bg-red-50 border-red-thread' : ''}`}
        onClick={() => handleQuadrantClick(quad)}
      >
        <div className="text-xs text-navy-det text-center mb-1">{label}</div>
        <div className="text-[10px] text-navy/50 text-center mb-2">{strategy}</div>
        {person && (
          <div className="bg-white rounded px-3 py-1.5 shadow-sm text-center page-fade-in">
            <span className="text-lg">{STAKEHOLDER_INFO[person].emoji}</span>
            <div className="text-xs font-bold text-navy">{STAKEHOLDER_INFO[person].name}</div>
          </div>
        )}
      </div>
    );
  };

  if (phase === 'done') {
    return (
      <div className="paper-bg rounded-lg p-6 md:p-8 max-w-2xl mx-auto shadow-xl text-center page-fade-in">
        <div className="stamp stamp-appear mb-6">ЭКСПЕРТИЗА ЗАВЕРШЕНА</div>
        <p className="text-2xl font-bold text-navy mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Набрано в Акте 3: {totalPoints}/5 баллов
        </p>
        <div className="space-y-1 text-sm text-navy/70 mb-6">
          <p>Матрица стейкхолдеров: {matrixCorrect ? '✅ +1' : '❌ 0'}</p>
          {QUESTIONS.map((q) => {
            const answers = quizAnswers[q.id] || new Set<string>();
            const correct = q.multiSelect
              ? q.correctMulti?.every(a => answers.has(a)) && answers.size === q.correctMulti?.length
              : answers.has(q.correctSingle!);
            return <p key={q.id}>Вопрос {q.id.replace('q', '')}: {correct ? '✅ +1' : '❌ 0'}</p>;
          })}
        </div>
        <button
          onClick={() => onComplete(totalPoints)}
          className="bg-orange text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-orange-dark"
        >
          Закрыть дело 📁
        </button>
      </div>
    );
  }

  return (
    <div className="paper-bg rounded-lg p-4 md:p-8 max-w-3xl mx-auto shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🔬</span>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Акт 3: Экспертиза
        </h2>
        <span className="ml-auto score-badge">{totalPoints}</span>
      </div>

      {/* MATRIX */}
      {phase === 'matrix' && (
        <>
          <div className="text-sm text-navy-det mb-4">
            <TypeWriter
              text="Постройте матрицу стейкхолдеров. Определите уровень влияния и интереса каждого участника. Кликните на персонажа, затем на нужный квадрант."
              speed={20}
              onDone={() => setIntroReady(true)}
            />
          </div>

          {introReady && (
            <div className="page-fade-in">
              {/* Person chips */}
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {(Object.keys(STAKEHOLDER_INFO) as StakeholderName[]).map((key) => {
                  const placed = !!placements[key];
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                        selectedPerson === key
                          ? 'bg-orange text-white shadow-lg'
                          : placed
                          ? 'bg-green-100 border-2 border-green-thread'
                          : 'bg-cream-dark border-2 border-navy/20 hover:border-orange'
                      }`}
                      onClick={() => !matrixChecked && setSelectedPerson(key === selectedPerson ? null : key)}
                    >
                      <span className="text-xl">{STAKEHOLDER_INFO[key].emoji}</span>
                      <div>
                        <div className="text-sm font-bold">{STAKEHOLDER_INFO[key].name}</div>
                        <div className="text-xs opacity-70">{STAKEHOLDER_INFO[key].desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPerson && (
                <p className="text-center text-sm text-orange mb-3">
                  Выбран: {STAKEHOLDER_INFO[selectedPerson].emoji} {STAKEHOLDER_INFO[selectedPerson].name} — кликните на квадрант ↓
                </p>
              )}

              {/* Matrix grid */}
              <div className="max-w-lg mx-auto mb-6">
                <div className="text-center text-xs text-navy/60 mb-1">← Интерес →</div>
                <div className="flex">
                  <div className="flex flex-col justify-center mr-2">
                    <div className="text-xs text-navy/60 transform -rotate-90 whitespace-nowrap">← Влияние →</div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {renderQuadrant('hi-lo', 'В↑ И↓', 'Удовлетворять')}
                    {renderQuadrant('hi-hi', 'В↑ И↑', 'Управлять тесно')}
                    {renderQuadrant('lo-lo', 'В↓ И↓', 'Мониторить')}
                    {renderQuadrant('lo-hi', 'В↓ И↑', 'Информировать')}
                  </div>
                </div>
              </div>

              {/* Check / Next */}
              {!matrixChecked ? (
                <div className="text-center">
                  <button
                    onClick={checkMatrix}
                    disabled={!placements.arkady || !placements.semyon || !placements.lenochka}
                    className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark disabled:opacity-40"
                  >
                    Проверить расстановку ✓
                  </button>
                </div>
              ) : (
                <div className="text-center page-fade-in">
                  <div className={`rounded-lg p-3 mb-4 inline-block ${matrixCorrect ? 'bg-green-50 border border-green-thread' : 'bg-red-50 border border-red-thread'}`}>
                    <p className="text-sm text-navy">
                      {matrixCorrect
                        ? '✅ Матрица верна! +1 балл'
                        : `❌ Есть ошибки. Правильно: Аркадий В↑И↓, Семён В↑И↑, Леночка В↓И↑`}
                    </p>
                  </div>
                  <br />
                  <button
                    onClick={() => setPhase('q1')}
                    className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark mt-2"
                  >
                    К вопросам экспертизы →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* QUIZ QUESTIONS */}
      {phase === 'q1' && renderQuiz(QUESTIONS[0])}
      {phase === 'q2' && renderQuiz(QUESTIONS[1])}
      {phase === 'q3' && renderQuiz(QUESTIONS[2])}
      {phase === 'q4' && renderQuiz(QUESTIONS[3])}
    </div>
  );
}
