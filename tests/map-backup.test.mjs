import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../map-backup.js', import.meta.url), 'utf8');
const context = { window: {}, Map, Set, Promise, Date, Object, JSON };
runInNewContext(source, context);
const { create, restore } = context.window.AntonietaMapBackup;

test('backup JSON incorpora mídia local e remota e restaura as referências em outro computador', async () => {
    const state = {
        version: 1,
        scenarios: { room: { imgBaseName: 'idb-asset:day', imgNightName: 'Mapa de antonieta noite.png' } },
        events: { room: [{ content: 'https://example.com/media/scene', audioContent: 'idb-asset:day' }] }
    };
    const read = [];
    const backup = await create(state, async reference => {
        read.push(reference);
        return reference.startsWith('idb-asset:') ? 'data:image/png;base64,AAAA' : 'data:audio/mpeg;base64,BBBB';
    });
    assert.equal(backup.format, 'antonieta-map-backup');
    assert.deepEqual(read, ['idb-asset:day', 'https://example.com/media/scene']);
    assert.equal(backup.state.scenarios.room.imgNightName, 'Mapa de antonieta noite.png');
    const writes = [];
    const restored = await restore(JSON.parse(JSON.stringify(backup)), async dataUrl => {
        writes.push(dataUrl);
        return `idb-asset:restored-${writes.length}`;
    });
    assert.equal(restored.scenarios.room.imgBaseName, 'idb-asset:restored-1');
    assert.equal(restored.events.room[0].audioContent, 'idb-asset:restored-1');
    assert.equal(restored.events.room[0].content, 'idb-asset:restored-2');
    assert.equal(restored.scenarios.room.imgNightName, 'Mapa de antonieta noite.png');
    assert.equal(writes.length, 2);
});

test('restauração rejeita backup sem arquivo de mídia', async () => {
    await assert.rejects(
        restore({ format: 'antonieta-map-backup', version: 1, state: { version: 1, scenarios: { room: { imgBaseName: 'idb-asset:missing' } } }, assets: {} }, async () => 'unused'),
        /Mídia não encontrada/
    );
});

test('JSON de estado versionado do Git abre com imagens locais', async () => {
    const state = { version: 1, scenarios: { city: { imgBaseName: 'Mapa de antonieta dia.png' } } };
    const restored = await restore(state, async () => { throw new Error('não deveria carregar mídia'); });
    assert.equal(restored.scenarios.city.imgBaseName, 'Mapa de antonieta dia.png');
});
