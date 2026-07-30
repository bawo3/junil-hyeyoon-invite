const KAKAO_REST_KEY = process.env.KAKAO_REST_API_KEY;

/* 주소 → 좌표 변환 (카카오 로컬 주소 검색 API 프록시)
   REST API 키가 브라우저에 노출되지 않도록 서버(Vercel Function)에서 호출 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const address = (req.query.address || '').trim();
  if (!address) {
    return res.status(400).json({ error: '주소를 입력해 주세요' });
  }
  if (!KAKAO_REST_KEY) {
    return res.status(500).json({ error: 'KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다' });
  }

  try {
    const kakaoRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
    );
    if (!kakaoRes.ok) {
      const errText = await kakaoRes.text().catch(() => '');
      return res.status(502).json({ error: `카카오 API 오류 (${kakaoRes.status}) ${errText}` });
    }
    const data = await kakaoRes.json();
    const doc = data.documents && data.documents[0];
    if (!doc) {
      return res.status(404).json({ error: '주소를 찾을 수 없습니다. 주소를 더 정확히 입력해 보세요' });
    }
    return res.json({
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x),
      matchedAddress: (doc.road_address && doc.road_address.address_name) ||
                       (doc.address && doc.address.address_name) || address,
      count: (data.meta && data.meta.total_count) || 1,
    });
  } catch (e) {
    return res.status(500).json({ error: '주소 검색 중 오류가 발생했습니다: ' + e.message });
  }
}
