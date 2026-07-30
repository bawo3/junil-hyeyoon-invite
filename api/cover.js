import { kv } from '@vercel/kv';

const COVER_KEY = 'wedding_cover';

/* 커버 최상단 메인 사진 저장
   { photo } — 값이 없으면 청첩장은 기존 배경 영상을 그대로 보여줌 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* 커버 사진 조회 */
  if (req.method === 'GET') {
    const data = (await kv.get(COVER_KEY)) || null;
    return res.json(data);
  }

  /* 커버 사진 저장 (덮어쓰기) */
  if (req.method === 'PUT') {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: '잘못된 데이터입니다' });
    }
    await kv.set(COVER_KEY, data);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
