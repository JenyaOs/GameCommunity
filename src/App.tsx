import { useState, useCallback } from 'react';
import NameScreen from './components/NameScreen';
import { Crossword, Cipher } from './components/Act1';
import Act2 from './components/Act2';
import Act3 from './components/Act3';
import Results from './components/Results';
import TypeWriter from './components/TypeWriter';

type Screen =
  | 'name'
  | 'act1-intro'
  | 'act1-crossword'
  | 'act1-cipher'
  | 'act2-intro'
  | 'act2'
  | 'act3-intro'
  | 'act3'
  | 'results';

interface GameState {
  playerName: string;
  mode: 'online' | 'office';
  scores: {
    act1Card1: number;
    act1Card2: number;
    act2: number;
    act3: number;
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('name');
  const [game, setGame] = useState<GameState>({
    playerName: 'Детектив N13',
    mode: 'online',
    scores: { act1Card1: 0, act1Card2: 0, act2: 0, act3: 0 },
  });
  const [introReady, setIntroReady] = useState(false);

  const handleStart = useCallback((name: string, mode: 'online' | 'office') => {
    setGame((g) => ({ ...g, playerName: name, mode }));
    setScreen('act1-intro');
    setIntroReady(false);
  }, []);

  const handleAct1Card1 = useCallback((pts: number) => {
    setGame((g) => ({ ...g, scores: { ...g.scores, act1Card1: pts } }));
    setScreen('act1-cipher');
  }, []);

  const handleAct1Card2 = useCallback((pts: number) => {
    setGame((g) => ({ ...g, scores: { ...g.scores, act1Card2: pts } }));
    setScreen('act2-intro');
    setIntroReady(false);
  }, []);

  const handleAct2 = useCallback((pts: number) => {
    setGame((g) => ({ ...g, scores: { ...g.scores, act2: pts } }));
    setScreen('act3-intro');
    setIntroReady(false);
  }, []);

  const handleAct3 = useCallback((pts: number) => {
    setGame((g) => ({ ...g, scores: { ...g.scores, act3: pts } }));
    setScreen('results');
  }, []);

  const totalScore =
    game.scores.act1Card1 + game.scores.act1Card2 + game.scores.act2 + game.scores.act3;

  /* ─── RENDER ACT INTROS ─── */
  const renderActIntro = (
    actNum: number,
    title: string,
    description: string,
    points: string,
    emoji: string,
    nextScreen: Screen
  ) => (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(to right, #1e241e 0%, #2f3d25 40%, #455535 100%)'}}
    >
      <div className="max-w-lg w-full text-center page-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 text-sm text-cream/50">
          <span>🕵️ {game.playerName}</span>
          <span>Баллы: {totalScore}</span>
        </div>

        <div className="text-6xl mb-4">{emoji}</div>
        <div className="text-xs text-orange tracking-[0.3em] uppercase mb-2">Акт {actNum}</div>
        <h2 className="text-3xl font-bold text-cream mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h2>
        <div className="h-0.5 w-20 bg-orange mx-auto mb-4" />
        <div className="text-cream/70 text-sm mb-2">
          <TypeWriter text={description} speed={20} onDone={() => setIntroReady(true)} />
        </div>
        <div className="text-xs text-gray-det mb-6">Возможные баллы: {points}</div>

        {introReady && (
          <button
            onClick={() => setScreen(nextScreen)}
            className="bg-orange hover:bg-orange-dark text-white px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange/30 page-fade-in"
          >
            Приступить →
          </button>
        )}
      </div>
    </div>
  );

  /* ─── WRAPPER ─── */
  const renderGameScreen = (content: React.ReactNode) => (
    <div
      className="min-h-screen py-6 px-4 film-grain"
      style={{ 
  background: `linear-gradient(to right, #1e241e 0%, #2f3d25 40%, #455535 100%)` 
}}
    >
      {/* Top HUD */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between text-sm text-cream/60">
        <div className="flex items-center gap-2">
          <span>🕵️</span>
          <span>{game.playerName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs">
            {game.mode === 'office' ? '🏢 Офис-квест' : '🌐 Онлайн'}
          </span>
          <div className="score-badge text-sm">{totalScore}</div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">{content}</div>
    </div>
  );

  /* ─── SCREEN ROUTER ─── */
  switch (screen) {
    case 'name':
      return <NameScreen onStart={handleStart} />;

    case 'act1-intro':
      return renderActIntro(
        1,
        'Сбор улик',
        'На месте происшествия обнаружены две карточки с зашифрованными данными. Разгадайте их, чтобы получить доступ к материалам дела.',
        '2 балла',
        '🔍',
        'act1-crossword'
      );

    case 'act1-crossword':
      return renderGameScreen(<Crossword onComplete={handleAct1Card1} mode={game.mode} />);

    case 'act1-cipher':
      return renderGameScreen(<Cipher onComplete={handleAct1Card2} mode={game.mode} />);

    case 'act2-intro':
      return renderActIntro(
        2,
        'Доска улик',
        'Время допросить свидетелей и собрать доказательства. Найдите ключевые требования в показаниях, классифицируйте их и соберите MVP.',
        'до 9 баллов',
        '📋',
        'act2'
      );

    case 'act2':
      return renderGameScreen(<Act2 onComplete={handleAct2} mode={game.mode} />);

    case 'act3-intro':
      return renderActIntro(
        3,
        'Экспертиза',
        'Финальный этап. Постройте матрицу стейкхолдеров, определите блокеры и предложите оптимальное решение. От ваших ответов зависит судьба проекта.',
        '5 баллов',
        '🔬',
        'act3'
      );

    case 'act3':
      return renderGameScreen(<Act3 onComplete={handleAct3} mode={game.mode} />);

    case 'results':
      return <Results playerName={game.playerName} scores={game.scores} />;

    default:
      return null;
  }
}
