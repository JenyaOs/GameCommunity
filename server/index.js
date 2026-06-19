import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 4000;

// Подключение к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }, // Timeweb требует SSL
});

pool.on('connect', () => {
  console.log('✅ Подключено к PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к БД:', err);
});

app.use(cors());
app.use(express.json());

// 📥 Получить таблицу лидеров (топ-50)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, score, grade, date 
       FROM leaderboard 
       ORDER BY score DESC, date ASC 
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка загрузки таблицы:', err);
    res.status(500).json({ error: 'Не удалось загрузить таблицу' });
  }
});

// 📤 Сохранить результат
app.post('/api/leaderboard', async (req, res) => {
  const { name, score, grade } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Имя обязательно' });
  }
  if (typeof score !== 'number' || score < 0 || score > 16) {
    return res.status(400).json({ error: 'Некорректный счёт' });
  }
  if (typeof grade !== 'string') {
    return res.status(400).json({ error: 'Некорректный грейд' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO leaderboard (name, score, grade, date) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, name, score, grade, date`,
      [name.trim().slice(0, 50), score, grade]
    );

    const entry = result.rows[0];
    console.log(`✅ Сохранён результат: ${entry.name} (${entry.score} баллов)`);

    res.status(201).json(entry);
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    res.status(500).json({ error: 'Не удалось сохранить результат' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

app.listen(PORT, () => {
  console.log(`🚀 API запущен на http://localhost:${PORT}`);
  console.log(`📊 База данных: ${process.env.DB_NAME}`);
});
