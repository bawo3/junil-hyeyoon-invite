import { kv } from '@vercel/kv';

const RSVP_KEY = 'rsvp_responses';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* 전체 목록 조회 */
  if (req.method === 'GET') {
    const list = (await kv.get(RSVP_KEY)) || [];
    return res.json(list);
  }

  /* 응답 1건 추가 */
  if (req.method === 'POST') {
    const entry = req.body;
    if (!entry || !entry.name || !entry.side || !entry.attend) {
      return res.status(400).json({ error: '필수 항목이 누락되었습니다' });
    }
    const list = (await kv.get(RSVP_KEY)) || [];
    list.push(entry);
    await kv.set(RSVP_KEY, list);
    return res.json({ ok: true });
  }

  /* 개별 삭제: DELETE /api/rsvp?id=123 / 전체 초기화: DELETE /api/rsvp */
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (id) {
      const list = (await kv.get(RSVP_KEY)) || [];
      const filtered = list.filter(r => String(r.id) !== String(id));
      await kv.set(RSVP_KEY, filtered);
    } else {
      await kv.set(RSVP_KEY, []);
    }
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
