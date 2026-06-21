import { useState, useEffect } from 'react';

// Дата открытия игры: 26 июня 2026, 00:00 по Москве
const LAUNCH_DATE = new Date('2026-06-26T00:00:00+03:00').getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = Date.now();
  const diff = LAUNCH_DATE - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);

      // Когда таймер дойдёт до нуля — перезагрузим страницу,
      // чтобы отобразилась игра
      if (newTime.days === 0 && newTime.hours === 0 && 
          newTime.minutes === 0 && newTime.seconds === 0) {
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at center, #142d54 0%, #0B1D3A 70%)',
      }}
    >
      <div className="max-w-2xl w-full text-center">
        {/* Логотип / Заголовок */}
        <div className="mb-8">
          <div className="text-xs text-gray-det tracking-[0.3em] uppercase mb-3">
            C7 Analytics Bureau
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold text-cream mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            📁 Дело «Монолит»
          </h1>
          <div className="h-0.5 w-24 bg-orange mx-auto my-4" />
          <p className="text-cream/70 text-lg">
            Расследование скоро начнётся
          </p>
        </div>

        {/* Таймер */}
        <div className="grid grid-cols-4 gap-3 md:gap-6 mb-10">
          <TimeBlock value={timeLeft.days} label="Дней" />
          <TimeBlock value={timeLeft.hours} label="Часов" />
          <TimeBlock value={timeLeft.minutes} label="Минут" />
          <TimeBlock value={timeLeft.seconds} label="Секунд" />
        </div>

        {/* Штамп "Совершенно секретно" */}
        <div className="inline-block border-2 border-orange/50 px-6 py-2 rotate-[-3deg] mb-8">
          <div className="text-orange text-xs tracking-[0.3em] uppercase font-bold">
            Совершенно секретно
          </div>
        </div>

        {/* Описание */}
        <div className="bg-cream/5 backdrop-blur-sm rounded-lg p-6 mb-8">
          <p className="text-cream/80 text-sm md:text-base leading-relaxed">
            Детектив, материалы дела ещё засекречены. 
            Подготовьте свои аналитические навыки — 
            <span className="text-orange font-bold"> 26 июня 2026 года</span> мы начинаем расследование 
            самого запутанного монолита в истории C7 Analytics Bureau.
          </p>
        </div>

        {/* Информация */}
        <div className="text-cream/40 text-xs space-y-1">
          <p>⚡ Следите за обновлениями</p>
          <p>© 2026 C7 Analytics Bureau</p>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-cream/5 backdrop-blur-sm rounded-lg p-3 md:p-5 border border-cream/10">
      <div
        className="text-3xl md:text-5xl font-bold text-orange tabular-nums"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-cream/60 text-xs md:text-sm mt-2 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
