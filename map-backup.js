(() => {
    'use strict';
    const MEDIA_KEYS = new Set(['imgBaseName', 'imgNightName', 'imgBlackoutName', 'gif', 'image', 'content', 'assetContent', 'audioContent']);
    const portableUrl = value => /^(?:idb-asset:|https?:\/\/)/i.test(value);
    const embeddedMedia = value => /^data:(?:image|audio|video)\//i.test(value);

    function assertState(state) {
        if (!state || typeof state !== 'object' || Array.isArray(state) || state.version !== 1) {
            throw new Error('Estado do mapa incompatível.');
        }
    }

    function collectMedia(value, key = '', found = new Set()) {
        if (typeof value === 'string' && MEDIA_KEYS.has(key) && portableUrl(value)) found.add(value);
        else if (Array.isArray(value)) value.forEach(item => collectMedia(item, '', found));
        else if (value && typeof value === 'object') Object.entries(value).forEach(([name, item]) => collectMedia(item, name, found));
        return found;
    }

    async function create(state, readMedia) {
        assertState(state);
        const snapshot = JSON.parse(JSON.stringify(state));
        const assets = Object.create(null);
        for (const reference of collectMedia(snapshot)) {
            const dataUrl = await readMedia(reference);
            if (!embeddedMedia(dataUrl)) throw new Error(`Mídia ausente no backup: ${reference}`);
            assets[reference] = dataUrl;
        }
        return { format: 'antonieta-map-backup', version: 1, exportedAt: new Date().toISOString(), state: snapshot, assets };
    }

    async function restore(backup, saveMedia) {
        if (!backup || backup.version !== 1 || (backup.state && backup.format !== 'antonieta-map-backup')) {
            throw new Error('Arquivo JSON incompatível com o mapa.');
        }
        const state = backup.state || backup;
        assertState(state);
        const assets = backup.assets && typeof backup.assets === 'object' && !Array.isArray(backup.assets) ? backup.assets : {};
        const cache = new Map();
        async function convert(value, key = '') {
            if (typeof value === 'string' && MEDIA_KEYS.has(key) && (portableUrl(value) || embeddedMedia(value))) {
                let dataUrl = value;
                if (portableUrl(value)) {
                    if (!Object.hasOwn(assets, value)) throw new Error(`Mídia não encontrada no backup: ${value}`);
                    dataUrl = assets[value];
                }
                if (!embeddedMedia(dataUrl)) throw new Error(`Mídia inválida no backup: ${value}`);
                if (!cache.has(dataUrl)) cache.set(dataUrl, Promise.resolve(saveMedia(dataUrl)));
                return cache.get(dataUrl);
            }
            if (Array.isArray(value)) return Promise.all(value.map(item => convert(item)));
            if (value && typeof value === 'object') {
                const entries = await Promise.all(Object.entries(value).map(async ([name, item]) => [name, await convert(item, name)]));
                return Object.fromEntries(entries);
            }
            return value;
        }
        return convert(state);
    }

    window.AntonietaMapBackup = { create, restore };
})();
