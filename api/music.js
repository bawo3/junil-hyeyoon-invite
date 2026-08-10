import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

/* 배경음악 설정 저장
   { file: "bgm.mp3", enabled: true }
   - mp3 파일 자체는 music 폴더의 정적 파일이라 여기(KV)에는 "파일명 + on/off"만 저장한다.
     → 파일을 base64로 KV에 넣는 방식과 달리 1MB 한도 문제가 없고, 정적 파일이라 CDN으로 빠르게 스트리밍된다.
   - GET 시 music 폴더를 훑어 재생 가능한 mp3 목록(available)도 함께 돌려줘 photo.html 드롭다운을 채운다. */
const MUSIC_KEY = 'wedding_music';
const AUDIO_EXT = ['.mp3', '.m4a', '.ogg', '.wav', '.aac'];

/* music 폴더의 오디오 파일 목록을 최선을 다해 읽는다.
   Vercel 서버리스 환경마다 경로가 조금씩 달라 여러 후보 경로를 순서대로 시도하고,
   못 읽으면 빈 배열을 돌려준다(그래도 photo.html에서 파일명 직접 입력으로 저장 가능). */
function listMusicFiles() {
  const candidates = [
    path.join(process.cwd(), 'music'),
    path.join(process.cwd(), 'public', 'music'),
    '/var/task/music',
  ];
  for (const dir of candidates) {
    try {
      const files = fs.readdirSync(dir)
        .filter(f => AUDIO_EXT.includes(path.extname(f).toLowerCase()))
        .sort();
      if (files.length) return files;
    } catch (e) {
      /* 이 후보 경로엔 없음 — 다음 경로 시도 */
    }
  }
  return [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  /* 배경음악 설정 조회 (+ 폴더의 파일 목록) */
  if (req.method === 'GET') {
    const saved = (await kv.get(MUSIC_KEY)) || {};
    return res.json({
      file: typeof saved.file === 'string' ? saved.file : '',
      enabled: !!saved.enabled,
      volume: typeof saved.volume === 'number' ? saved.volume : 15,   /* 최대 볼륨 %, 기본 15 */
      available: listMusicFiles(),
    });
  }

  /* 배경음악 설정 저장 (덮어쓰기) */
  if (req.method === 'PUT') {
    const body = req.body || {};
    let volume = Number(body.volume);
    if (!isFinite(volume)) volume = 15;
    volume = Math.max(0, Math.min(100, Math.round(volume)));   /* 0~100%로 제한 */
    const data = {
      file: typeof body.file === 'string' ? body.file.trim() : '',
      enabled: !!body.enabled,
      volume,
    };
    await kv.set(MUSIC_KEY, data);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
