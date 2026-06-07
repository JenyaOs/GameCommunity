// Leaderboard persistence. Currently backed by localStorage as a stand-in DB.
// TODO: заменить localStorage на fetch POST запрос к реальному API при подключении бэкенда.

export const LEADERBOARD_KEY = 'monolit_leaderboard';
const MAX_ENTRIES = 50;

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  grade: string;
  date: string; // ISO timestamp
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is LeaderboardEntry =>
        e && typeof e.name === 'string' && typeof e.score === 'number',
    );
  } catch {
    return [];
  }
}

// Sort by score desc; on a tie the earlier submission ranks higher.
export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

export function saveResult(result: {
  name: string;
  score: number;
  grade: string;
}): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: result.name.trim() || 'Аноним',
    score: result.score,
    grade: result.grade,
    date: new Date().toISOString(),
  };

  let entries = loadLeaderboard();
  entries.push(entry);
  // Cap storage: drop the oldest entries beyond the limit.
  if (entries.length > MAX_ENTRIES) {
    entries = entries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_ENTRIES);
  }

  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // Storage may be unavailable (private mode / quota) — fail silently.
  }

  return entry;
}
