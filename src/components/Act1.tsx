import { useState, useRef, useEffect, useCallback } from 'react';
import TypeWriter from './TypeWriter';

/* ───────── CROSSWORD ───────── */
const WORDS = ['ДОСКА', 'ЕСЛИ', 'ЛИЦО', 'ОПРОС'];
const CLUES = [
  '«Канбан-___» — инструмент визуализации задач',
  'Ключевое слово условия, IF по-русски',
  'Заинтересованное ___ проекта (стейкхолдер)',
  'Метод сбора требований у пользователей',
];
const GRID_COLS = 5;
const GRID_ROWS = 4;

interface CrosswordProps {
  onComplete: (points: number) => void;
  mode: 'online' | 'office';
}

export function Crossword({ onComplete, mode }: CrosswordProps) {
  const [grid, setGrid] = useState<string[][]>(
    Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(''))
  );
  const [solved, setSolved] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [officeCode, setOfficeCode] = useState('');
  const [introReady, setIntroReady] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null))
  );

  const isEmptyCell = (r: number, c: number) => {
    const wordLen = WORDS[r].length;
    return c >= wordLen;
  };

  const handleChange = (row: number, col: number, val: string) => {
    const ch = val.toUpperCase().replace(/[^А-ЯЁ]/g, '').slice(-1);
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = ch;
    setGrid(newGrid);

    if (ch && col < GRID_COLS - 1 && !isEmptyCell(row, col + 1)) {
      inputRefs.current[row][col + 1]?.focus();
    }
  };

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !grid[row][col] && col > 0) {
      inputRefs.current[row][col - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && col < GRID_COLS - 1 && !isEmptyCell(row, col + 1)) {
      inputRefs.current[row][col + 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && col > 0) {
      inputRefs.current[row][col - 1]?.focus();
    }
    if (e.key === 'ArrowDown' && row < GRID_ROWS - 1 && !isEmptyCell(row + 1, col)) {
      inputRefs.current[row + 1][col]?.focus();
    }
    if (e.key === 'ArrowUp' && row > 0) {
      inputRefs.current[row - 1][col]?.focus();
    }
  };

  const checkSolution = useCallback(() => {
    for (let r = 0; r < GRID_ROWS; r++) {
      const word = WORDS[r];
      for (let c = 0; c < word.length; c++) {
        if (grid[r][c] !== word[c]) return false;
      }
    }
    return true;
  }, [grid]);

  useEffect(() => {
    if (checkSolution() && !solved) {
      setSolved(true);
      setTimeout(() => setShowKey(true), 500);
    }
  }, [grid, checkSolution, solved]);

  const handleOfficeSubmit = () => {
    if (officeCode.toUpperCase() === 'ДЕЛО') {
      setSolved(true);
      setShowKey(true);
    }
  };

  const keyWord = grid.map((row) => row[0]).join('');
  const isKeyCorrect = keyWord === 'ДЕЛО';

  return (
    <div className="paper-bg rounded-lg p-6 md:p-8 max-w-2xl mx-auto shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📋</span>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Карточка №1: Стенограмма допроса
        </h2>
      </div>

      <div className="text-sm text-gray-det mb-6">
        <TypeWriter
          text="На столе обнаружена стенограмма с пропущенными словами. Заполните кроссворд — ключевое слово по вертикали откроет следующую улику."
          speed={20}
          onDone={() => setIntroReady(true)}
        />
      </div>

      {introReady && (
        <div className="page-fade-in">
          {mode === 'office' ? (
            <div className="text-center py-8">
              <p className="text-navy mb-4">Найдите постер «Стенограмма» в офисе, решите кроссворд и введите ключевое слово:</p>
              <div className="flex items-center justify-center gap-3">
                <input
                  type="text"
                  value={officeCode}
                  onChange={(e) => setOfficeCode(e.target.value)}
                  placeholder="Ключевое слово"
                  className="border-2 border-navy/30 rounded px-4 py-2 text-center text-navy font-bold uppercase bg-white focus:outline-none focus:border-orange"
                  style={{ fontFamily: 'var(--font-typewriter)' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleOfficeSubmit()}
                />
                <button onClick={handleOfficeSubmit} className="bg-orange text-white px-4 py-2 rounded font-bold hover:bg-orange-dark">
                  →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Clues */}
              <div className="mb-6 space-y-2">
                {CLUES.map((clue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="font-bold text-orange min-w-[24px]">{i + 1}.</span>
                    <span className="text-navy/80">{clue} ({WORDS[i].length} букв)</span>
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex justify-center mb-4">
                <div className="inline-block">
                  <div className="text-xs text-orange font-bold text-center mb-1">▼ КЛЮЧ</div>
                  {WORDS.map((word, row) => (
                    <div key={row} className="flex gap-1 mb-1">
                      {Array.from({ length: GRID_COLS }).map((_, col) => {
                        if (isEmptyCell(row, col)) {
                          return <div key={col} className="w-[44px] h-[44px]" />;
                        }
                        const isCorrect = grid[row][col] === word[col];
                        const isKey = col === 0;
                        return (
                          <input
                            key={col}
                            ref={(el) => { inputRefs.current[row][col] = el; }}
                            type="text"
                            value={grid[row][col]}
                            onChange={(e) => handleChange(row, col, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(row, col, e)}
                            className={`crossword-cell ${isCorrect && grid[row][col] ? 'correct' : ''} ${isKey ? 'key-column' : ''}`}
                            maxLength={1}
                            disabled={solved}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key word display */}
              <div className="text-center mt-4">
                <div className="text-sm text-gray-det mb-1">Ключевое слово (столбец 1):</div>
                <div className={`text-2xl font-bold tracking-[0.5em] ${isKeyCorrect ? 'text-green-thread' : 'text-navy/40'}`}>
                  {keyWord || '____'}
                </div>
              </div>
            </>
          )}

          {/* Success */}
          {showKey && (
            <div className="mt-6 text-center page-fade-in">
              <div className="stamp stamp-appear mb-4">РАЗГАДАНО</div>
              <p className="text-green-700 font-bold mb-2">🔑 Ключевое слово: ДЕЛО</p>
              <p className="text-sm text-gray-det mb-4">+1 балл за разгаданную стенограмму</p>
              <button
                onClick={() => onComplete(1)}
                className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark transition-all"
              >
                Следующая улика →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────── CIPHER ───────── */
const CIPHER_CLUES = [
  { code: '659', hint: 'Одна цифра верная и на своём месте', emoji: '🟢' },
  { code: '641', hint: 'Все цифры неверные', emoji: '🔴' },
  { code: '268', hint: 'Две цифры верные, но не на своих местах', emoji: '🟡' },
  { code: '917', hint: 'Одна цифра верная, но не на своём месте', emoji: '🟡' },
  { code: '758', hint: 'Одна цифра верная, но не на своём месте', emoji: '🟡' },
];

interface CipherProps {
  onComplete: (points: number) => void;
  mode: 'online' | 'office';
}

export function Cipher({ onComplete, mode }: CipherProps) {
  const [digits, setDigits] = useState(['', '', '']);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = d;
    setDigits(newDigits);
    if (d && idx < 2) digitRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.focus();
    }
  };

  const checkCode = () => {
    const code = digits.join('');
    setAttempts((a) => a + 1);
    if (code === '829') {
      setSolved(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="paper-bg rounded-lg p-6 md:p-8 max-w-2xl mx-auto shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🔐</span>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Карточка №2: Техартефакт
        </h2>
      </div>

      <div className="text-sm text-gray-det mb-6">
        <TypeWriter
          text={
            mode === 'office'
              ? 'Найдите постер с сейфом в офисе и введите трёхзначный код из подсказки.'
              : 'Обнаружен зашифрованный сейф с документами. Подберите трёхзначный код, используя подсказки. Каждая подсказка говорит, сколько цифр угадано и на месте ли они.'
          }
          speed={20}
          onDone={() => setIntroReady(true)}
        />
      </div>

      {introReady && (
        <div className="page-fade-in">
          {mode === 'office' ? (
            <div className="mb-6 rounded-lg border border-orange/20 bg-orange/5 p-4 text-center">
              <p className="text-navy text-sm font-bold mb-2"></p>
              <p className="text-xs text-gray-det">Введите код доступа</p>
            </div>
          ) : (
            /* Clues */
            <div className="mb-6 space-y-3">
              {CIPHER_CLUES.map((clue, i) => (
                <div key={i} className="flex items-center gap-3 bg-navy/5 rounded-lg p-3">
                  <div className="flex gap-1">
                    {clue.code.split('').map((d, j) => (
                      <span key={j} className="inline-flex items-center justify-center w-10 h-10 bg-navy text-cream rounded font-bold text-lg">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-navy/80">
                    {clue.emoji} {clue.hint}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Code input */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-det mb-3">Введите код:</div>
            <div className={`inline-flex gap-2 ${error ? 'phrase-wrong' : ''}`}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { digitRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-14 h-16 border-3 border-navy/30 rounded-lg text-center text-2xl font-bold text-navy bg-white focus:outline-none focus:border-orange"
                  style={{ fontFamily: 'var(--font-typewriter)' }}
                  maxLength={1}
                  disabled={solved}
                />
              ))}
            </div>
            {!solved && (
              <div className="mt-4">
                <button
                  onClick={checkCode}
                  disabled={digits.some((d) => !d)}
                  className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Проверить 🔓
                </button>
                {attempts > 0 && !solved && (
                  <p className="text-red-thread text-sm mt-2">Неверный код. Попыток: {attempts}</p>
                )}
              </div>
            )}
          </div>

          {/* Success */}
          {solved && (
            <div className="mt-6 text-center page-fade-in">
              <div className="stamp stamp-appear mb-4">ВСКРЫТО</div>
              <p className="text-green-700 font-bold mb-2">🔑 Код сейфа: 829</p>
              <p className="text-sm text-gray-det mb-4">+1 балл за разгаданный артефакт</p>
              <button
                onClick={() => onComplete(1)}
                className="bg-orange text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-dark transition-all"
              >
                Перейти к доске улик →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
