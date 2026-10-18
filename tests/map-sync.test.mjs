import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../map-sync.js', import.meta.url), 'utf8');
const roomId = '11111111-1111-4111-8111-111111111111';
const token = 'a'.repeat(64);

test('link do mestre migra imagem local e publica estado compartilhado', async () => {
    const calls = [];
    const stored = {};
    const location = {
        href: 'https://nilmatrix1011.github.io/antonieta-RPG/Mapa.html',
        protocol: 'https:',
        search: '', hash: '',
        assign(url) { this.destination = url; }
    };
    const context = {
        location, URL, URLSearchParams, Blob, Map, Promise,
        window: {},
        document: { getElementById: () => null },
        sessionStorage: { setItem: (key, value) => { stored[key] = value; } },
        localStorage: { setItem: (key, value) => { stored[key] = value; } },
        fetch: async (url, options = {}) => {
            calls.push({ url, options });
            if (url.endsWith('/api/rooms')) return Response.json({ roomId, masterToken: token, revision: 1 }, { status: 201 });
            if (url.endsWith('/assets')) return Response.json({ url: 'https://assets.example/old.png' }, { status: 201 });
            if (options.method === 'PUT') return Response.json({ revision: 2 });
            throw new Error(`Unexpected request: ${url}`);
        }
    };
    runInNewContext(source, context);
    const state = { version: 1, scenarios: { one: { imgBaseName: 'idb-asset:old' } } };
    await context.window.AntonietaMapSync.create(state, async () => new Blob(['png'], { type: 'image/png' }), 'b'.repeat(64));
    const published = JSON.parse(calls.find(call => call.options.method === 'PUT').options.body).state;
    assert.equal(published.scenarios.one.imgBaseName, 'https://assets.example/old.png');
    assert.equal(JSON.parse(stored['antonieta-map-state-v1']).scenarios.one.imgBaseName, 'https://assets.example/old.png');
    assert.match(location.destination, new RegExp(`room=${roomId}#master=${token}$`));
    const links = JSON.parse(stored['antonieta-new-shared-room']);
    assert.match(links.viewer, new RegExp(`room=${roomId}$`));
    assert.match(links.master, new RegExp(`#master=${token}$`));
});
