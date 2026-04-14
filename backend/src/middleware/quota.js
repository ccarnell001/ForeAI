import { pool } from '../db/index.js';

const DAILY_LIMIT = 3;

export async function checkQuota(req, res, next) {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT count FROM usage_log WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );
    const used = result.rows[0]?.count || 0;
    if (used >= DAILY_LIMIT) {
      return res.status(429).json({
        error: 'Daily limit reached',
        message: `You've used all ${DAILY_LIMIT} free analyses for today. Come back tomorrow!`,
        used,
        limit: DAILY_LIMIT,
      });
    }
    req.quotaUsed = used;
    req.quotaLimit = DAILY_LIMIT;
    next();
  } finally {
    client.release();
  }
}

export async function incrementQuota(userId) {
  await pool.query(
    `INSERT INTO usage_log (user_id, date, count)
     VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (user_id, date)
     DO UPDATE SET count = usage_log.count + 1`,
    [userId]
  );
}
