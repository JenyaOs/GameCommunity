const API_URL = 'https://jenyaos-gamecommunity-6f15.twc1.net.timeweb.app/api/leaderboard';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  grade: string;
  date: string;
}

export async function loadLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Не удалось загрузить таблицу');
    return await res.json();
  } catch (err) {
    console.error('Ошибка загрузки таблицы лидеров:', err);
    return [];
  }
}

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

export async function saveResult(result: {
  name: string;
  score: number;
  grade: string;
}): Promise<LeaderboardEntry | null> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    if (!res.ok) throw new Error('Не удалось сохранить результат');
    return await res.json();
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    return null;
  }
}
