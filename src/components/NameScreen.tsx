import { useState } from 'react';
import TypeWriter from './TypeWriter';

interface NameScreenProps {
  onStart: (name: string, mode: 'online' | 'office') => void;
}

export default function NameScreen({ onStart }: NameScreenProps) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'online' | 'office'>('online');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ 
  background: `radial-gradient(ellipse at center, var(--color-navy-light) 0%, var(--color-navy) 70%)` 
}}>
      <div className="max-w-lg w-full page-fade-in">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-gray-det text-sm tracking-[0.3em] uppercase mb-2">🔍 C7 Analytics Bureau</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="text-orange">Детектив</span>{' '}
            <span className="text-cream">Требований</span>
          </h1>
          <div className="text-xl text-cream/80 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Дело «Монолит»
          </div>
          <div className="h-0.5 w-32 bg-orange mx-auto mb-6" />
          <div className="text-gray-det text-sm">
            <TypeWriter
              text="Поступило новое дело. Клиент хочет CRM-систему. Ваша задача — собрать требования, отделить важное от хотелок и защитить MVP. Удачи, детектив."
              speed={25}
              onDone={() => setShowForm(true)}
            />
          </div>
        </div>

        {/* Badge & Form */}
        {showForm && (
          <div className="page-fade-in">
            <div className="badge max-w-sm mx-auto mb-6">
              <div className="text-xs text-amber-900/60 tracking-[0.2em] uppercase mb-1">Удостоверение</div>
              <div className="text-lg font-bold text-amber-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                ДЕТЕКТИВ-АНАЛИТИК
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-14 bg-amber-800/20 rounded border border-amber-800/30 flex items-center justify-center text-2xl">
                  🕵️
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Детектив N13"
                    className="w-full bg-cream/80 border-2 border-amber-800/30 rounded px-3 py-2 text-amber-900 font-bold text-center focus:outline-none focus:border-orange"
                    style={{ fontFamily: 'var(--font-typewriter)' }}
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="text-xs text-amber-900/50">Бюро аналитики • {new Date().getFullYear()}</div>
            </div>

            {/* Mode toggle */}
            <div className="flex justify-center mb-6">
              <div className="mode-toggle">
                <button
                  className={mode === 'online' ? 'active' : ''}
                  onClick={() => setMode('online')}
                >
                  🌐 Онлайн
                </button>
                <button
                  className={mode === 'office' ? 'active' : ''}
                  onClick={() => setMode('office')}
                >
                  🏢 Офис-квест
                </button>
              </div>
            </div>

            {mode === 'office' && (
              <p className="text-center text-gray-det text-xs mb-4">
                В режиме «Офис-квест» некоторые задания нужно решить, сканируя QR-коды в офисе.
              </p>
            )}

            {/* Start button */}
            <div className="text-center">
              <button
                onClick={() => onStart(name.trim() || 'Детектив N13', mode)}
                className="bg-orange hover:bg-orange-dark text-white px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange/30"
              >
                Открыть дело 📁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
