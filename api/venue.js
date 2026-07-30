import { kv } from '@vercel/kv';

const VENUE_KEY = 'wedding_venue';

/* 예식장 정보 저장
   { name, hall, address, lat, lng, photo } */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* 예식장 정보 조회 */
  if (req.method === 'GET') {
    const data = (await kv.get(VENUE_KEY)) || null;
    return res.json(data);
  }

  /* 예식장 정보 저장 (덮어쓰기) */
  if (req.method === 'PUT') {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: '잘못된 데이터입니다' });
    }
    await kv.set(VENUE_KEY, data);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
