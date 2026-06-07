import { useState, useEffect, useRef } from 'react';
import TypeWriter from './TypeWriter';
import {
  loadLeaderboard,
  saveResult,
  sortLeaderboard,
  type LeaderboardEntry,
} from '../utils/leaderboard';

interface ResultsProps {
  playerName: string;
  scores: {
    act1Card1: number;
    act1Card2: number;
    act2: number;
    act3: number;
  };
}

const TOTAL_MAX = 16;

const GRADES = [
  { min: 13, max: 16, title: 'Senior Analyst', emoji: '🏆', color: 'text-amber-500', desc: 'Вы — настоящий мастер требований. Монолит раскрыт полностью!' },
  { min: 8, max: 12, title: 'Middle Analyst', emoji: '🥈', color: 'text-gray-400', desc: 'Хорошая работа! Ещё немного практики — и вы станете Senior.' },
  { min: 0, max: 7, title: 'Junior Analyst', emoji: '📝', color: 'text-orange', desc: 'Все с чего-то начинают. Повторите дело — и вы справитесь лучше!' },
];

export default function Results({ playerName, scores }: ResultsProps) {
  const total = scores.act1Card1 + scores.act1Card2 + scores.act2 + scores.act3;
  const grade = GRADES.find((g) => total >= g.min && total <= g.max) || GRADES[2];
  const [showDetails, setShowDetails] = useState(false);
  const [showGrade, setShowGrade] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const savedRef = useRef(false);

  // Persist the player's result once the final grade is revealed.
  useEffect(() => {
    if (!showGrade || savedRef.current) return;
    savedRef.current = true;
    const entry = saveResult({ name: playerName, score: total, grade: grade.title });
    setCurrentEntryId(entry.id);
    setEntries(sortLeaderboard(loadLeaderboard()));
  }, [showGrade, playerName, total, grade.title]);

  useEffect(() => {
    if (!showDetails) return;
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setAnimatedScore(current);
      if (current >= total) {
        clearInterval(interval);
        setTimeout(() => setShowGrade(true), 500);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [showDetails, total]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #142d54 0%, #0B1D3A 70%)' }}>
      <div className="max-w-lg w-full">
        {/* Case file */}
        <div className="paper-bg rounded-lg p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-xs text-gray-det tracking-[0.3em] uppercase mb-2">Дело «Монолит»</div>
            <h1 className="text-2xl font-bold text-navy mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              📁 Дело закрыто
            </h1>
            <div className="h-0.5 w-24 bg-orange mx-auto my-3" />
            <p className="text-sm text-gray-det">
              <TypeWriter
                text={`Детектив ${playerName} завершил расследование.`}
                speed={30}
                onDone={() => setTimeout(() => setShowDetails(true), 500)}
              />
            </p>
          </div>

          {showDetails && (
            <div className="page-fade-in">
              {/* Score breakdown */}
              <div className="bg-cream-dark/50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-navy text-sm mb-3">📊 Результаты расследования:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-navy/80">Акт 1 — Стенограмма</span>
                    <span className={`font-bold ${scores.act1Card1 > 0 ? 'text-green-700' : 'text-red-thread'}`}>
                      {scores.act1Card1}/1
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-navy/80">Акт 1 — Техартефакт</span>
                    <span className={`font-bold ${scores.act1Card2 > 0 ? 'text-green-700' : 'text-red-thread'}`}>
                      {scores.act1Card2}/1
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-navy/80">Акт 2 — Доска улик</span>
                    <span className={`font-bold ${scores.act2 > 0 ? 'text-green-700' : 'text-red-thread'}`}>
                      {scores.act2}/9
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-navy/80">Акт 3 — Экспертиза</span>
                    <span className={`font-bold ${scores.act3 > 0 ? 'text-green-700' : 'text-red-thread'}`}>
                      {scores.act3}/5
                    </span>
                  </div>
                  <div className="border-t border-navy/10 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-navy">ИТОГО</span>
                       <span className="font-bold text-2xl text-orange">{animatedScore}/{TOTAL_MAX}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="scale-bar h-6">
                  <div
                    className={`scale-fill ${total >= 13 ? 'scale-ok' : total >= 8 ? 'scale-warn' : 'scale-danger'}`}
                    style={{ width: `${(Math.min(total, TOTAL_MAX) / TOTAL_MAX) * 100}%`, transition: 'width 1.5s ease' }}
                  />
                </div>
                <div className="flex justify-between text-xs text-navy/50 mt-1">
                  <span>0</span>
                  <span className="text-red-thread">Junior (0-7)</span>
                  <span className="text-orange">Middle (8-12)</span>
                  <span className="text-green-700">Senior (13-16)</span>
                  <span>{TOTAL_MAX}</span>
                </div>
              </div>

              {/* Grade */}
              {showGrade && (
                <div className="text-center page-fade-in">
                  <div className="stamp stamp-appear mb-4">{grade.title}</div>
                  <div className="text-5xl mb-2">{grade.emoji}</div>
                  <h2 className={`text-2xl font-bold mb-2 ${grade.color}`} style={{ fontFamily: 'var(--font-display)' }}>
                    {grade.title}
                  </h2>
                  <p className="text-sm text-navy/70 mb-6">{grade.desc}</p>

                  {/* Badge */}
                  <div className="badge max-w-xs mx-auto mb-6">
                    <div className="text-xs text-amber-900/60 tracking-[0.2em] uppercase mb-1">Присвоен грейд</div>
                    <div className="text-lg font-bold text-amber-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                      {grade.emoji} {grade.title.toUpperCase()}
                    </div>
                    <div className="text-sm text-amber-900/70">{playerName}</div>
                    <div className="text-xs text-amber-900/50 mt-1">Баллов: {total}/{TOTAL_MAX}</div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setShowLeaderboard(true)}
                      className="bg-navy text-cream px-6 py-3 rounded-lg font-bold text-lg hover:bg-navy-light transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                      🏆 Посмотреть таблицу лидеров
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-orange text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-orange-dark transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange/30"
                    >
                      🔄 Начать заново
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showLeaderboard && (
          <Leaderboard
            entries={entries}
            currentEntryId={currentEntryId}
            onClose={() => setShowLeaderboard(false)}
          />
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-cream/30 text-xs">
          C7 Analytics Bureau • Дело «Монолит» • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

/* ───────── LEADERBOARD ───────── */
const RANK_CLASS = ['rank-gold', 'rank-silver', 'rank-bronze'];
const MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentEntryId: string | null;
  onClose: () => void;
}

function Leaderboard({ entries, currentEntryId, onClose }: LeaderboardProps) {
  const top = entries.slice(0, 10);
  const currentRank = entries.findIndex((e) => e.id === currentEntryId);
  const currentInTop = top.some((e) => e.id === currentEntryId);

  return (
    <section id="leaderboard-screen" className="dossier mt-6 page-fade-in">
      <div className="dossier-header">
        <div className="text-xs text-orange tracking-[0.3em] uppercase mb-1">Совершенно секретно</div>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          🗂 Досье лучших агентов
        </h2>
      </div>

      {top.length === 0 ? (
        <p className="text-center text-cream/60 py-6 text-sm">Пока нет завершённых расследований.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Место</th>
                <th className="text-left">Имя детектива</th>
                <th>Баллы</th>
                <th className="text-left">Звание</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {top.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`${i < 3 ? RANK_CLASS[i] : ''} ${entry.id === currentEntryId ? 'row-current' : ''}`}
                >
                  <td className="text-center font-bold">{i < 3 ? MEDALS[i] : i + 1}</td>
                  <td>{entry.name}</td>
                  <td className="text-center font-bold">{entry.score}</td>
                  <td>{entry.grade}</td>
                  <td className="text-center whitespace-nowrap text-xs">{formatDate(entry.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentRank >= 0 && !currentInTop && (
        <p className="text-center text-cream/70 text-sm mt-3">
          Ваш результат — <span className="text-orange font-bold">{currentRank + 1}-е место</span> из {entries.length}.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <button
          onClick={() => window.location.reload()}
          className="bg-orange text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-dark transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange/30"
        >
          🔍 Начать новое расследование
        </button>
        <button
          onClick={onClose}
          className="border-2 border-cream/40 text-cream px-6 py-3 rounded-lg font-bold hover:bg-cream/10 transition-all"
        >
          ⬅ Назад к результатам
        </button>
      </div>
    </section>
  );
}
