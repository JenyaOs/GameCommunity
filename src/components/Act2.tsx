import { useState, useCallback } from 'react';
import TypeWriter from './TypeWriter';

/* ───────── TYPES ───────── */
interface Sticker {
  id: number;
  text: string;
  color: string;
  rotation: number;
  found: boolean;
  damaged?: boolean;
}

type Zone = 'hard' | 'wish' | 'trash' | 'unassigned';

const CORRECT_ZONES: Record<number, Zone> = {
  1: 'hard', 2: 'hard', 3: 'hard', 4: 'wish', 5: 'wish',
  6: 'hard', 7: 'hard', 8: 'hard', 9: 'hard',
};

const STICKER_COLORS = ['sticker-yellow', 'sticker-pink', 'sticker-blue', 'sticker-green', 'sticker-orange'];
const ROTATIONS = [-3, 2, -1.5, 3, -2, 1, -2.5, 2.5, -1];

const INITIAL_STICKERS: Sticker[] = [
  { id: 1, text: 'Окупаемость за полгода', color: STICKER_COLORS[0], rotation: ROTATIONS[0], found: false },
  { id: 2, text: 'Никаких валютных подписок', color: STICKER_COLORS[1], rotation: ROTATIONS[1], found: false },
  { id: 3, text: 'Бюджет минимальный', color: STICKER_COLORS[2], rotation: ROTATIONS[2], found: false },
  { id: 4, text: 'ИИ-генерация писем', color: STICKER_COLORS[3], rotation: ROTATIONS[3], found: false },
  { id: 5, text: '20 кастомных полей', color: STICKER_COLORS[4], rotation: ROTATIONS[4], found: false },
  { id: 6, text: 'Данные только на своём сервере', color: STICKER_COLORS[0], rotation: ROTATIONS[5], found: false },
  { id: 7, text: 'Сервер слабый (2 Гб ОЗУ)', color: STICKER_COLORS[1], rotation: ROTATIONS[6], found: false },
  { id: 8, text: 'Срок: 4 месяца', color: STICKER_COLORS[2], rotation: ROTATIONS[7], found: false, damaged: true },
];

/* ───────── INTERVIEW TEXTS ───────── */
interface PhraseSegment {
  text: string;
  isClue: boolean;
  stickerId?: number;
  isDecoy?: boolean;
}

const ARKADY_TEXT: PhraseSegment[] = [
  { text: 'Сядьте. У меня пять минут. CRM? Ладно, слушайте. Мне нужна ', isClue: false },
  { text: 'окупаемость за полгода', isClue: true, stickerId: 1 },
  { text: ' — это не обсуждается. Мы только что закончили ', isClue: false },
  { text: 'ремонт переговорной', isClue: false, isDecoy: true },
  { text: ', денег нет. ', isClue: false },
  { text: 'Никаких валютных подписок', isClue: true, stickerId: 2 },
  { text: ' — только рубли, и точка. И ещё: ', isClue: false },
  { text: 'бюджет минимальный', isClue: true, stickerId: 3 },
  { text: '. Кофе? ', isClue: false },
  { text: 'На третьем этаже автомат', isClue: false, isDecoy: true },
  { text: ', сами разберётесь. Всё, идите.', isClue: false },
];

const LENOCHKA_TEXT: PhraseSegment[] = [
  { text: 'Ой, как здорово что вы пришли! Я ', isClue: false },
  { text: 'обожаю наши корпоративы', isClue: false, isDecoy: true },
  { text: '! Но по работе: мне бы ', isClue: false },
  { text: 'ИИ-генерацию писем', isClue: true, stickerId: 4 },
  { text: ' — клиентов много, не успеваю. А ещё нужно хотя бы ', isClue: false },
  { text: '20 кастомных полей', isClue: true, stickerId: 5 },
  { text: ' для карточки клиента. Кстати, ', isClue: false },
  { text: 'у нас такие красивые виды из окна', isClue: false, isDecoy: true },
  { text: '!', isClue: false },
];

const SEMYON_TEXT: PhraseSegment[] = [
  { text: 'Это серьёзный разговор. Первое и главное: ', isClue: false },
  { text: 'данные только на своём сервере', isClue: true, stickerId: 6 },
  { text: '. Без вариантов. ', isClue: false },
  { text: 'Безопасность — мой приоритет', isClue: false, isDecoy: true },
  { text: '. Да, ', isClue: false },
  { text: 'сервер слабый — 2 Гб ОЗУ', isClue: true, stickerId: 7 },
  { text: ', но для наших задач хватит. ', isClue: false },
  { text: 'Срок: 4 месяца', isClue: true, stickerId: 8 },
  { text: '... [далее текст повреждён]. Наша команда — лучшая, ', isClue: false },
  { text: 'вчера выиграли в боулинг', isClue: false, isDecoy: true },
  { text: '.', isClue: false },
];

/* ───────── ACT2 COMPONENT ───────── */
type Act2Phase = 'board' | 'budget' | 'classify' | 'mvp';

interface Act2Props {
  onComplete: (points: number) => void;
  mode: 'online' | 'office';
}

export default function Act2({ onComplete, mode }: Act2Props) {
  const [phase, setPhase] = useState<Act2Phase>('board');
  const [stickers, setStickers] = useState<Sticker[]>(INITIAL_STICKERS);
  const [toast, setToast] = useState('');
  const [budgetCode, setBudgetCode] = useState('');
  const [budgetSolved, setBudgetSolved] = useState(false);
  const [budgetError, setBudgetError] = useState(false);
  const [budgetAnswers, setBudgetAnswers] = useState(['', '', '']);
  const [zones, setZones] = useState<Record<number, Zone>>({});
  const [classifyDone, setClassifyDone] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
  const [attemptedIds, setAttemptedIds] = useState<Set<number>>(new Set());
  const [selectedSticker, setSelectedSticker] = useState<number | null>(null);
  const [mvpFeatures, setMvpFeatures] = useState<Set<number>>(new Set());
  const [actScore, setActScore] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const [showDamaged, setShowDamaged] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const foundCount = stickers.filter((s) => s.found).length;
  const allFound = foundCount >= 8;
  const hasNinthSticker = stickers.length === 9;

  const handlePhraseClick = (segment: PhraseSegment) => {
    if (segment.isDecoy) {
      showToast('🔍 Это просто деталь интерьера');
      return;
    }
    if (segment.isClue && segment.stickerId) {
      const s = stickers.find((st) => st.id === segment.stickerId);
      if (s && !s.found) {
        setStickers((prev) =>
          prev.map((st) => (st.id === segment.stickerId ? { ...st, found: true } : st))
        );
        if (s.damaged) {
          showToast('📌 Улика найдена, но стикер повреждён!');
          setTimeout(() => setShowDamaged(true), 1500);
        } else {
          showToast('📌 Улика зафиксирована на доске!');
        }
      }
    }
  };

  const handleBudgetCheck = () => {
    const code = budgetAnswers.join('');
    if (code === '422') {
      setBudgetSolved(true);
      setStickers((prev) => [
        ...prev,
        {
          id: 9,
          text: 'Бюджет не позволяет 20 полей',
          color: 'sticker-pink',
          rotation: -1,
          found: true,
        },
      ]);
      showToast('📋 Смета расшифрована! Новая улика добавлена.');
    } else {
      setBudgetError(true);
      setTimeout(() => setBudgetError(false), 1000);
    }
  };

  const goBackToBoard = () => {
    setBudgetError(false);
    setPhase('board');
  };

  const handleOfficeBoard = () => {
    if (budgetCode === '422') {
      setBudgetSolved(true);
      setStickers((prev) => {
        const allFound = prev.map((s) => ({ ...s, found: true }));
        if (allFound.length < 9) {
          return [
            ...allFound,
            { id: 9, text: 'Бюджет не позволяет 20 полей', color: 'sticker-pink', rotation: -1, found: true },
          ];
        }
        return allFound;
      });
    }
  };

  const handleZoneClick = (zone: Zone) => {
    if (selectedSticker !== null) {
      setZones((prev) => ({ ...prev, [selectedSticker]: zone }));
      setSelectedSticker(null);
    }
  };

  const checkClassification = () => {
    const foundStickers = stickers.filter((s) => s.found);
    const nextZones = { ...zones };
    const nextConfirmed = new Set(confirmedIds);
    const nextAttempted = new Set(attemptedIds);
    const returned: string[] = [];
    let firstTryAccepted = 0;
    let anyAccepted = 0;

    for (const sticker of foundStickers) {
      const placedZone = nextZones[sticker.id];
      if (!placedZone) continue;

      if (nextConfirmed.has(sticker.id)) continue;

      const isFirstTry = !nextAttempted.has(sticker.id);
      nextAttempted.add(sticker.id);

      if (placedZone === CORRECT_ZONES[sticker.id]) {
        nextConfirmed.add(sticker.id);
        anyAccepted += 1;
        if (isFirstTry) {
          firstTryAccepted += 1;
        }
      } else {
        returned.push(sticker.text);
        delete nextZones[sticker.id];
      }
    }

    if (firstTryAccepted > 0) {
      setActScore((prev) => prev + firstTryAccepted);
    }
    setZones(nextZones);
    setConfirmedIds(nextConfirmed);
    setAttemptedIds(nextAttempted);
    setSelectedSticker(null);

    if (returned.length > 0) {
      showToast(`❌ Неверные улики вернулись на доску: ${returned.length}`);
    } else if (anyAccepted > 0) {
      showToast(
        firstTryAccepted > 0
          ? `✅ Засчитано улик с 1-го раза: +${firstTryAccepted}`
          : `✅ Улики верны (без баллов, т.к. не с 1-го раза)`
      );
    } else {
      showToast('⚠️ Сначала разместите новые улики в разделы');
    }

    const allAccepted = foundStickers.every((sticker) => nextConfirmed.has(sticker.id));
    if (allAccepted && foundStickers.length > 0) {
      setClassifyDone(true);
    }
  };

  const toggleMvpFeature = (id: number) => {
    setMvpFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // MVP scale calculation: hard requirements fit within limits, wishes break them
  const featureImpact: Record<number, { budget: number; timeline: number; resources: number }> = {
    1: { budget: 5, timeline: 5, resources: 0 },   // Окупаемость за полгода
    2: { budget: 5, timeline: 0, resources: 0 },    // Никаких валютных подписок
    3: { budget: 5, timeline: 5, resources: 5 },    // Бюджет минимальный
    4: { budget: 40, timeline: 50, resources: 60 },  // ИИ-генерация писем ← ЛОМАЕТ
    5: { budget: 35, timeline: 40, resources: 25 },  // 20 кастомных полей ← ЛОМАЕТ
    6: { budget: 10, timeline: 5, resources: 15 },   // Данные на своём сервере
    7: { budget: 0, timeline: 5, resources: 10 },    // Сервер слабый
    8: { budget: 5, timeline: 10, resources: 5 },    // Срок: 4 месяца
    9: { budget: 5, timeline: 5, resources: 5 },     // Бюджет не позволяет 20 полей
  };
  let mvpBudget = 10, mvpTimeline = 10, mvpResources = 10;
  mvpFeatures.forEach((id) => {
    const impact = featureImpact[id];
    if (impact) {
      mvpBudget += impact.budget;
      mvpTimeline += impact.timeline;
      mvpResources += impact.resources;
    }
  });
  const isBroken = mvpBudget > 100 || mvpTimeline > 100 || mvpResources > 100;

  /* ─── RENDER ─── */
  const renderInterviewText = (segments: PhraseSegment[], character: string, avatar: string) => (
    <div className="bg-cream-dark/50 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{avatar}</span>
        <span className="font-bold text-navy text-sm">{character}</span>
      </div>
      <p className="text-sm text-navy/90 leading-relaxed">
        {segments.map((seg, i) => {
          if (seg.isClue || seg.isDecoy) {
            const found = seg.stickerId ? stickers.find((s) => s.id === seg.stickerId)?.found : false;
            return (
              <span
                key={i}
                className={`${found ? 'phrase-found' : 'phrase-clickable'} ${seg.isDecoy ? 'phrase-clickable' : ''}`}
                onClick={() => !found && handlePhraseClick(seg)}
              >
                {seg.text}
              </span>
            );
          }
          return <span key={i}>{seg.text}</span>;
        })}
      </p>
    </div>
  );

  const renderSticker = (s: Sticker, clickable = false) => (
    <div
      key={s.id}
      className={`sticker ${s.color} ${s.damaged && !budgetSolved ? 'sticker-damaged' : ''} ${selectedSticker === s.id ? 'ring-2 ring-orange' : ''} ${!s.found ? 'opacity-30' : ''}`}
      style={{ transform: `rotate(${s.rotation}deg)` }}
      onClick={() => clickable && s.found && setSelectedSticker(s.id === selectedSticker ? null : s.id)}
    >
      <div className="pin" />
      <span className="text-xs">{s.damaged && !budgetSolved ? 'Срок: ??? (повреждён)' : s.text}</span>
    </div>
  );

  const renderScaleBar = (label: string, value: number, icon: string) => {
    const pct = Math.min(value, 130);
    const cls = value > 100 ? 'scale-overflow' : value > 75 ? 'scale-danger' : value > 50 ? 'scale-warn' : 'scale-ok';
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs text-navy/70 mb-1">
          <span>{icon} {label}</span>
          <span className={value > 100 ? 'text-red-thread font-bold' : ''}>{value > 100 ? '⚠️ ПЕРЕГРУЗКА' : `${value}%`}</span>
        </div>
        <div className="scale-bar">
          <div className={`scale-fill ${cls}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="paper-bg rounded-lg p-4 md:p-8 max-w-4xl mx-auto shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📋</span>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Акт 2: Доска улик
        </h2>
        <span className="ml-auto text-sm text-gray-det">
          Найдено улик: {foundCount}/{stickers.length}
        </span>
      </div>

      {/* ─── PHASE: BOARD ─── */}
      {phase === 'board' && (
        <>
          <div className="text-sm text-gray-det mb-4">
            <TypeWriter
              text="Изучите показания свидетелей. Кликните на ключевые фразы — они станут уликами на доске. Осторожно: не всё, что говорят, важно для дела!"
              speed={20}
              onDone={() => setIntroReady(true)}
            />
          </div>

          {introReady && (
            <div className="page-fade-in">
              {mode === 'office' && (
                <div className="mb-5 rounded-lg border border-orange/20 bg-orange/5 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-navy font-bold text-sm mb-1">Офисный режим</p>
                      <p className="text-xs text-gray-det">Кликайте по фразам в текстах и вводите код сметы из QR.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={budgetCode}
                        onChange={(e) => setBudgetCode(e.target.value)}
                        placeholder="Код сметы"
                        className="border-2 border-navy/30 rounded px-4 py-2 text-center text-navy font-bold bg-white focus:outline-none focus:border-orange w-32"
                        style={{ fontFamily: 'var(--font-typewriter)' }}
                      />
                      <button onClick={handleOfficeBoard} className="bg-orange text-white px-4 py-2 rounded font-bold hover:bg-orange-dark">
                        →
                      </button>
                    </div>
                  </div>
                  {budgetSolved && <p className="text-xs text-green-700 mt-2">Код сметы принят. Повреждённый стикер восстановлен.</p>}
                </div>
              )}

              {/* Interviews */}
              {renderInterviewText(ARKADY_TEXT, 'Аркадий Петрович — Генеральный директор', '👔')}
              {renderInterviewText(LENOCHKA_TEXT, 'Леночка — Менеджер по клиентам', '💁‍♀️')}
              {renderInterviewText(SEMYON_TEXT, 'Семён Игоревич — Руководитель продаж', '📊')}

              {/* Evidence Board */}
              <div className="evidence-board p-4 mt-6">
                <div className="text-cream/60 text-xs text-center mb-3">📌 ДОСКА УЛИК</div>
                <div className="flex flex-wrap gap-3 justify-center min-h-[80px]">
                  {stickers.filter((s) => s.found).map((s) => renderSticker(s))}
                  {foundCount === 0 && (
                    <p className="text-cream/30 text-sm py-6">Кликайте по ключевым фразам в показаниях...</p>
                  )}
                </div>
              </div>

              {/* Damaged sticker prompt */}
              {showDamaged && !budgetSolved && (
                <div className="mt-4 bg-orange/10 border-2 border-orange/30 rounded-lg p-4 page-fade-in">
                  <p className="text-sm text-navy font-bold mb-2">
                    ⚠️ Стикер «Срок» повреждён! Нужна карточка «Бюджетная смета»
                  </p>
                  <button
                    onClick={() => setPhase('budget')}
                    className="bg-orange text-white px-4 py-2 rounded font-bold text-sm hover:bg-orange-dark"
                  >
                    Открыть карточку сметы 📄
                  </button>
                </div>
              )}

              {/* Proceed to classification */}
              {allFound && budgetSolved && hasNinthSticker && (
                <div className="mt-4 text-center page-fade-in">
                  <p className="text-green-700 font-bold mb-3">✅ Все улики собраны! ({stickers.filter(s => s.found).length} шт.)</p>
                  <button
                    onClick={() => setPhase('classify')}
                    className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark"
                  >
                    Классифицировать улики →
                  </button>
                </div>
              )}

              {/* Show hint when most stickers found but not all */}
              {foundCount > 0 && foundCount < 8 && !showDamaged && (
                <div className="mt-4 text-center">
                  <p className="text-navy/60 text-xs">Найдено {foundCount} из 8 улик. Ищите ключевые фразы в показаниях...</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── PHASE: BUDGET ─── */}
      {phase === 'budget' && (
        <div className="page-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🧾</span>
            <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Карточка №3: Бюджетная смета
            </h3>
          </div>
          <p className="text-sm text-navy-det mb-6">
            Чтобы восстановить повреждённый стикер, ответьте на три вопроса. Ответы — цифры из уже найденных улик.
          </p>

          <div className="space-y-4 max-w-md mx-auto">
            {[
              { q: 'Сколько месяцев до аудита (срок проекта)?', hint: 'Из улики о сроке', correct: '4' },
              { q: 'Сколько Гб ОЗУ свободно на сервере?', hint: 'Из улики о сервере', correct: '2' },
              { q: 'Сумма цифр числа кастомных полей?', hint: '2+0 = ?', correct: '2' },
            ].map((item, i) => (
              <div key={i} className="bg-cream-dark/50 rounded-lg p-4">
                <p className="text-sm text-navy font-bold mb-1">{item.q}</p>
                {(i !== 2 || mode === 'office') && (
                  <p className="text-xs text-navy-det mb-2">💡 Подсказка: {item.hint}</p>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetAnswers[i]}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setBudgetAnswers((prev) => {
                      const n = [...prev];
                      n[i] = v;
                      return n;
                    });
                  }}
                  className="w-16 h-10 border-2 border-navy/30 rounded text-center text-navy font-bold bg-white focus:outline-none focus:border-orange"
                  style={{ fontFamily: 'var(--font-typewriter)' }}
                  disabled={budgetSolved}
                />
              </div>
            ))}
          </div>

          <div className={`text-center mt-6 ${budgetError ? 'phrase-wrong' : ''}`}>
            {!budgetSolved ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleBudgetCheck}
                  disabled={budgetAnswers.some((a) => !a)}
                  className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark disabled:opacity-40"
                >
                  Ввести код сметы 🔑
                </button>
                <button
                  onClick={goBackToBoard}
                  className="border-2 border-navy/30 text-navy px-6 py-2 rounded-lg font-bold hover:bg-navy/5"
                >
                  ⬅ Вернуться к доске улик
                </button>
              </div>
            ) : (
              <div className="page-fade-in">
                <div className="stamp stamp-appear mb-4">ПОДТВЕРЖДЕНО</div>
                <p className="text-green-700 font-bold mb-2">Код сметы: 422</p>
                <p className="text-sm text-navy mb-2">Стикер восстановлен: <strong>Срок: 4 месяца</strong></p>
                <p className="text-sm text-orange font-bold mb-4">Новая улика: «Бюджет не позволяет 20 полей»</p>
                <button
                  onClick={() => setPhase('board')}
                  className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark"
                >
                  Вернуться к доске →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PHASE: CLASSIFY ─── */}
      {phase === 'classify' && !classifyDone && (
        <div className="page-fade-in">
          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            📊 Классификация улик
          </h3>
          <p className="text-sm text-navy-det mb-4">
            Кликните на стикер, затем на нужную зону. Распределите все улики.
          </p>

          {/* Stickers to classify */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {stickers.filter((s) => s.found).map((s) => (
              <div
                key={s.id}
                className={`sticker ${s.color} ${confirmedIds.has(s.id) ? 'opacity-95 ring-2 ring-green-thread' : 'cursor-pointer'} ${selectedSticker === s.id ? 'ring-3 ring-orange scale-105' : ''}`}
                style={{ transform: `rotate(${s.rotation}deg)` }}
                onClick={() => {
                  if (confirmedIds.has(s.id)) return;
                  setSelectedSticker(s.id === selectedSticker ? null : s.id);
                }}
              >
                <span className="text-xs">{s.text}</span>
                {confirmedIds.has(s.id) && <span className="ml-1 text-xs text-green-700">✓</span>}
                {zones[s.id] && !confirmedIds.has(s.id) && (
                  <span className="ml-1 text-xs">
                    {zones[s.id] === 'hard' ? '🔴' : zones[s.id] === 'wish' ? '🔵' : '⚫'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {selectedSticker && (
            <p className="text-center text-sm text-orange mb-3">
              Выбрано: «{stickers.find((s) => s.id === selectedSticker)?.text}» — кликните на зону ↓
            </p>
          )}

          {/* Drop zones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div
              className={`drop-zone drop-zone-hard ${selectedSticker ? 'active cursor-pointer' : ''}`}
              onClick={() => handleZoneClick('hard')}
            >
              <div className="text-center">
                <div className="text-red-thread font-bold text-sm mb-2">🔴 Жёсткие требования</div>
                <div className="text-xs text-navy-det">Обязательно в MVP</div>
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  {stickers.filter((s) => s.found && zones[s.id] === 'hard').map((s) => (
                    <span key={s.id} className="text-xs bg-red-100 px-2 py-1 rounded">{s.text}</span>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={`drop-zone drop-zone-wish ${selectedSticker ? 'active cursor-pointer' : ''}`}
              onClick={() => handleZoneClick('wish')}
            >
              <div className="text-center">
                <div className="text-blue-600 font-bold text-sm mb-2">🔵 Пожелания</div>
                <div className="text-xs text-navy-det">Хорошо бы, но не критично</div>
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  {stickers.filter((s) => s.found && zones[s.id] === 'wish').map((s) => (
                    <span key={s.id} className="text-xs bg-blue-100 px-2 py-1 rounded">{s.text}</span>
                  ))}
                </div>
              </div>
            </div>
            <div
              className={`drop-zone drop-zone-trash ${selectedSticker ? 'active cursor-pointer' : ''}`}
              onClick={() => handleZoneClick('trash')}
            >
              <div className="text-center">
                <div className="text-navy-det font-bold text-sm mb-2">⚫ Мусор</div>
                <div className="text-xs text-navy-det">Не относится к делу</div>
                <div className="mt-2 flex flex-wrap gap-1 justify-center">
                  {stickers.filter((s) => s.found && zones[s.id] === 'trash').map((s) => (
                    <span key={s.id} className="text-xs bg-gray-200 px-2 py-1 rounded">{s.text}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={checkClassification}
              className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark"
            >
              Проверить классификацию ✓
            </button>
          </div>
        </div>
      )}

      {/* Classification done */}
      {phase === 'classify' && classifyDone && (
        <div className="page-fade-in text-center py-6">
          <div className="stamp stamp-appear mb-4">КЛАССИФИЦИРОВАНО</div>
          <p className="text-green-700 font-bold mb-2">
            +{actScore} {actScore === 1 ? 'балл' : 'баллов'} за верно отнесённые улики
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto my-4 text-sm">
            <div className="bg-red-50 rounded-lg p-3">
              <div className="font-bold text-red-thread mb-1">🔴 Жёсткие (7)</div>
              {stickers.filter((s) => CORRECT_ZONES[s.id] === 'hard' && s.found).map((s) => (
                <div key={s.id} className="text-xs text-navy/70">• {s.text}</div>
              ))}
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="font-bold text-blue-600 mb-1">🔵 Пожелания (2)</div>
              {stickers.filter((s) => CORRECT_ZONES[s.id] === 'wish' && s.found).map((s) => (
                <div key={s.id} className="text-xs text-navy/70">• {s.text}</div>
              ))}
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="font-bold text-navy-det mb-1">⚫ Мусор (0)</div>
              <div className="text-xs text-navy/40">Пусто</div>
            </div>
          </div>
          <button
            onClick={() => setPhase('mvp')}
            className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark mt-3"
          >
            Калькулятор MVP →
          </button>
        </div>
      )}

      {/* ─── PHASE: MVP ─── */}
      {phase === 'mvp' && (
        <div className="page-fade-in">
          <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            ⚖️ Калькулятор MVP
          </h3>
          <p className="text-sm text-navy-det mb-4">
            Переключайте фичи и смотрите, как они влияют на ресурсы. «20 полей» и «ИИ» ломают баланс!
          </p>

          {/* Scales */}
          <div className="max-w-md mx-auto mb-6 bg-cream-dark/50 rounded-lg p-4">
            {renderScaleBar('Бюджет', mvpBudget, '💰')}
            {renderScaleBar('Сроки', mvpTimeline, '⏱️')}
            {renderScaleBar('Ресурсы (сервер)', mvpResources, '💻')}
          </div>

          {isBroken && (
            <div className="text-center mb-4 page-fade-in">
              <div className="text-red-thread font-bold text-sm bg-red-50 rounded-lg p-3 inline-block">
                💥 Шкалы перегружены! Уберите «ИИ» или «20 полей» из MVP.
              </div>
            </div>
          )}

          {/* Feature toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6 max-w-lg mx-auto">
            {stickers.filter((s) => s.found).map((s) => {
              const isOn = mvpFeatures.has(s.id);
              const isWish = CORRECT_ZONES[s.id] === 'wish';
              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    isOn
                      ? isWish
                        ? 'bg-red-100 border-2 border-red-thread'
                        : 'bg-green-100 border-2 border-green-thread'
                      : 'bg-cream-dark/30 border-2 border-transparent'
                  }`}
                  onClick={() => toggleMvpFeature(s.id)}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                    isOn ? (isWish ? 'bg-red-thread border-red-thread text-white' : 'bg-green-thread border-green-thread text-white') : 'border-navy-det'
                  }`}>
                    {isOn && '✓'}
                  </div>
                  <span className="text-xs text-navy">
                    {s.text} {isWish && '⚠️'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={() => onComplete(actScore)}
              className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark"
            >
              Перейти к экспертизе →
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
