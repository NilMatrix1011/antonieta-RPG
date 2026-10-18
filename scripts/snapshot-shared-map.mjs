import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const api = 'https://antonieta-mapa-compartilhado.carlos-oliver201714.chatgpt.site';
const activeResponse = await fetch(`${api}/api/active-room`);
if (!activeResponse.ok) throw new Error(`Falha ao localizar a mesa: HTTP ${activeResponse.status}`);
const { roomId } = await activeResponse.json();
if (!roomId) throw new Error('Nenhuma mesa compartilhada está ativa.');
const roomResponse = await fetch(`${api}/api/rooms/${roomId}`);
if (!roomResponse.ok) throw new Error(`Falha ao ler a mesa: HTTP ${roomResponse.status}`);
const { state, revision } = await roomResponse.json();
if (!state || state.version !== 1) throw new Error('Estado remoto incompatível.');

const mediaKeys = new Set(['imgBaseName', 'imgNightName', 'imgBlackoutName', 'gif', 'image', 'content', 'assetContent', 'audioContent']);
const extensions = new Map([
  ['image/png', '.png'], ['image/jpeg', '.jpg'], ['image/webp', '.webp'], ['image/gif', '.gif'],
  ['video/mp4', '.mp4'], ['video/webm', '.webm'], ['audio/mpeg', '.mp3'],
  ['audio/ogg', '.ogg'], ['audio/wav', '.wav'], ['audio/mp4', '.m4a']
]);
const media = new Map();
await mkdir(resolve(root, 'map-assets'), { recursive: true });

async function localize(value, key = '') {
  if (typeof value === 'string') {
    if (!mediaKeys.has(key) || !/^(?:https?:\/\/|data:|idb-asset:)/i.test(value)) return value;
    if (value.startsWith('idb-asset:')) throw new Error(`Mídia só existe neste navegador: ${value}. Exporte um backup JSON pelo mapa.`);
    if (!media.has(value)) {
      media.set(value, (async () => {
        const response = await fetch(value);
        if (!response.ok) throw new Error(`Falha ao baixar mídia ${value}: HTTP ${response.status}`);
        const type = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
        const extension = extensions.get(type);
        if (!extension) throw new Error(`Formato de mídia não reconhecido: ${type || 'desconhecido'}`);
        const filename = `shared_${createHash('sha256').update(value).digest('hex').slice(0, 20)}${extension}`;
        await writeFile(resolve(root, 'map-assets', filename), Buffer.from(await response.arrayBuffer()));
        return `map-assets/${filename}`;
      })());
    }
    return media.get(value);
  }
  if (Array.isArray(value)) return Promise.all(value.map(item => localize(item)));
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value).map(async ([name, item]) => [name, await localize(item, name)]));
    return Object.fromEntries(entries);
  }
  return value;
}

const snapshot = await localize(state);
await writeFile(resolve(root, 'map-state.json'), JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
await writeFile(resolve(root, 'map-state-live.js'), `window.ANTONIETA_DEFAULT_MAP_STATE = ${JSON.stringify(snapshot, null, 2)};\n`, 'utf8');
console.log(`Mesa ${roomId}, revisão ${revision}: ${media.size} mídia(s) salvas em map-assets; JSON e estado local atualizados.`);
