import { kv } from '@vercel/kv';

const PARENTS_KEY = 'wedding_parent_phones';

/* 부모님 연락처 4명을 한 객체로 저장
   { groomFather: '010-...', groomMother: '010-...',
     brideFather: '010-...', brideMother: '010-...' } */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* 부모님 연락처 전체 조회 */
  if (req.method === 'GET') {
    const data = (await kv.get(PARENTS_KEY)) || null;
    return res.json(data);
  }

  /* 부모님 연락처 전체 저장 (덮어쓰기) */
  if (req.method === 'PUT') {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: '잘못된 데이터입니다' });
    }
    await kv.set(PARENTS_KEY, data);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
