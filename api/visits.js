import { kv } from '@vercel/kv';

/* 청첩장 방문자 수 카운팅
   - KV 키 wedding_visits 에 숫자 하나만 저장(원자적 증가 kv.incr 사용).
   - POST: +1 하고 새 값 반환 (청첩장 페이지가 브라우저당 1회만 호출 → 대략 '방문자 수')
   - GET : 현재 값 반환 (result.html에서 표시) */
const VISITS_KEY = 'wedding_visits';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* 현재 방문자 수 조회 */
  if (req.method === 'GET') {
    const count = (await kv.get(VISITS_KEY)) || 0;
    return res.json({ count });
  }

  /* 방문 1건 증가 (원자적) */
  if (req.method === 'POST') {
    try {
      const count = await kv.incr(VISITS_KEY);
      return res.json({ count });
    } catch (e) {
      console.error('방문자 카운트 실패:', e);
      return res.status(500).json({ error: '카운트 실패' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
