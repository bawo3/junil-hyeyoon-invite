import { kv } from '@vercel/kv';

const DATE_KEY = 'wedding_date';

/* 예식 일자 저장
   { year, month, day, hour, minute, dayOfWeek, time } */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* 예식 일자 조회 */
  if (req.method === 'GET') {
    const data = (await kv.get(DATE_KEY)) || null;
    return res.json(data);
  }

  /* 예식 일자 저장 (덮어쓰기) */
  if (req.method === 'PUT') {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: '잘못된 데이터입니다' });
    }
    await kv.set(DATE_KEY, data);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
