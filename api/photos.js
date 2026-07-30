import { kv } from '@vercel/kv';

/* 사진 저장 구조 (v2) — 무한 누적 가능
   - photo:<id>      → { src, caption, createdAt } (사진 1장)
   - gallery_index   → [id1, id2, ...] (순서 보존용 ID 배열)

   레거시 (v1) — 단일 키 배열 (현재 운영 중인 데이터)
   - gallery_photos  → [{ id, src, caption, createdAt }, ...]
   GET 시 두 소스를 합쳐 반환해 이전 사진도 그대로 보이도록 한다. */
const INDEX_KEY  = 'gallery_index';
const LEGACY_KEY = 'gallery_photos';
const photoKey   = id => `photo:${id}`;

/* 본문 크기 제한 — 사진 1장당 최대 ~8MB까지 허용 (압축 후 보통 200KB 내외) */
export const config = {
  api: {
    bodyParser: { sizeLimit: '8mb' }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* ── 전체 조회 — v2 신규 + v1 레거시 합쳐 반환 ── */
  if (req.method === 'GET') {
    const ids    = (await kv.get(INDEX_KEY))  || [];
    const legacy = (await kv.get(LEGACY_KEY)) || [];

    let newOnes = [];
    if (ids.length) {
      const keys = ids.map(photoKey);
      const photos = await kv.mget(...keys);
      newOnes = photos
        .map((p, i) => p ? { id: ids[i], ...p } : null)
        .filter(Boolean);
    }

    /* createdAt 오름차순 (등록 순서) */
    const list = [...legacy, ...newOnes].sort((a, b) => {
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return ta - tb;
    });
    return res.json(list);
  }

  /* ── 사진 1장 추가 — v2 구조로 저장 (개별 키) ── */
  if (req.method === 'POST') {
    const entry = req.body;
    if (!entry || !entry.src) {
      return res.status(400).json({ error: '이미지 데이터가 없습니다' });
    }
    const id = entry.id || Date.now();
    const photo = {
      src:       entry.src,
      caption:   entry.caption || '',
      createdAt: new Date().toISOString()
    };
    try {
      /* 사진 개별 키에 저장 — 사이즈 부담 최소 */
      await kv.set(photoKey(id), photo);
      /* 인덱스에 ID 추가 — 인덱스는 ID 배열이라 가벼움 */
      const ids = (await kv.get(INDEX_KEY)) || [];
      ids.push(id);
      await kv.set(INDEX_KEY, ids);
      return res.json({ ok: true, id });
    } catch (e) {
      console.error('KV 저장 실패:', e);
      return res.status(500).json({ error: 'KV 저장 실패: ' + (e.message || e) });
    }
  }

  /* ── 삭제 — 개별(?id=xxx) / 전체 ──
     v2 신규 + v1 레거시 모두 대응. */
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (id) {
      /* 단일 삭제 — 신규(v2) 먼저 시도 */
      const ids = (await kv.get(INDEX_KEY)) || [];
      const wasInV2 = ids.some(i => String(i) === String(id));
      if (wasInV2) {
        await kv.del(photoKey(id));
        await kv.set(INDEX_KEY, ids.filter(i => String(i) !== String(id)));
      }
      /* 레거시(v1) 배열에서도 제거 시도 */
      const legacy = (await kv.get(LEGACY_KEY)) || [];
      const legacyFiltered = legacy.filter(p => String(p.id) !== String(id));
      if (legacyFiltered.length !== legacy.length) {
        await kv.set(LEGACY_KEY, legacyFiltered);
      }
    } else {
      /* 전체 초기화 — v2 모든 키 + 인덱스 + 레거시 모두 정리 */
      const ids = (await kv.get(INDEX_KEY)) || [];
      if (ids.length) await kv.del(...ids.map(photoKey));
      await kv.set(INDEX_KEY,  []);
      await kv.set(LEGACY_KEY, []);
    }
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
