/* Sincronização opcional da mesa compartilhada. O mapa local continua funcionando sem sala. */
(() => {
    const API = 'https://antonieta-mapa-compartilhado.carlos-oliver201714.chatgpt.site';
    const roomId = new URLSearchParams(location.search).get('room');
    const masterToken = location.hash.match(/^#master=([a-f0-9]{64})$/)?.[1] || '';
    const validRoom = /^[a-f0-9-]{36}$/.test(roomId || '');
    const isViewer = validRoom && !masterToken;
    const isMaster = validRoom && Boolean(masterToken);
    let revision = 0;
    let pendingState = null;
    let saveTimer = null;
    let saving = false;

    function roomUrl(id = roomId) { return `${API}/api/rooms/${id}`; }
    function mapUrl(id, token = '') {
        const url = new URL(location.href);
        url.search = `?room=${encodeURIComponent(id)}`;
        url.hash = token ? `master=${token}` : '';
        return url.href;
    }
    function links() {
        return validRoom ? { viewer: mapUrl(roomId), master: mapUrl(roomId, masterToken) } : null;
    }
    async function request(url, options = {}) {
        const response = await fetch(url, { cache: 'no-store', ...options });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Erro HTTP ${response.status}`);
        return data;
    }
    function report(message) {
        const status = document.getElementById('syncStatus');
        if (status) status.textContent = message;
    }
    async function fetchRoom() {
        return request(roomUrl());
    }
    async function init() {
        if (!validRoom) {
            if (location.protocol === 'https:') {
                try {
                    const active = await request(`${API}/api/active-room`);
                    if (active.roomId) {
                        location.replace(mapUrl(active.roomId));
                        return false;
                    }
                } catch (error) {
                    report(`Mesa compartilhada indisponível: ${error.message}`);
                }
            }
            return null;
        }
        if (isViewer) {
            document.body.classList.add('shared-viewer');
        }
        try {
            if (isMaster) await request(`${roomUrl()}/master`, {
                headers: { authorization: `Bearer ${masterToken}` }
            });
            const remote = await fetchRoom();
            revision = remote.revision;
            report(isMaster ? 'Mesa compartilhada: mestre conectado' : 'Mesa compartilhada: visualização');
            if (isViewer) setInterval(poll, 1500);
            return remote.state;
        } catch (error) {
            report(`Sem conexão com a mesa: ${error.message}`);
            if (isViewer) setInterval(poll, 3000);
            return null;
        }
    }
    async function poll() {
        try {
            const remote = await fetchRoom();
            if (remote.revision <= revision) return;
            revision = remote.revision;
            localStorage.setItem('antonieta-map-state-v1', JSON.stringify(remote.state));
            location.reload();
        } catch (error) {
            report(`Aguardando conexão: ${error.message}`);
        }
    }
    function save(state) {
        if (!isMaster) return;
        pendingState = state;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flush, 250);
    }
    async function replace(state) {
        if (!isMaster) throw new Error('Abra o link do mestre para restaurar o mapa compartilhado.');
        clearTimeout(saveTimer);
        pendingState = null;
        while (saving) await new Promise(resolve => setTimeout(resolve, 50));
        const result = await request(roomUrl(), {
            method: 'PUT',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${masterToken}` },
            body: JSON.stringify({ state })
        });
        revision = result.revision;
        localStorage.setItem('antonieta-map-state-v1', JSON.stringify(state));
        report('Mesa compartilhada: backup restaurado');
    }
    async function flush() {
        if (saving || !pendingState) return;
        saving = true;
        let failed = false;
        const state = pendingState;
        pendingState = null;
        try {
            const result = await request(roomUrl(), {
                method: 'PUT',
                headers: { 'content-type': 'application/json', authorization: `Bearer ${masterToken}` },
                body: JSON.stringify({ state })
            });
            revision = result.revision;
            report('Mesa compartilhada: alterações salvas');
        } catch (error) {
            failed = true;
            pendingState = pendingState || state;
            report(`Falha ao sincronizar: ${error.message}`);
            setTimeout(flush, 3000);
        } finally {
            saving = false;
            if (pendingState && !failed) setTimeout(flush, 0);
        }
    }
    async function upload(blob, id = roomId, token = masterToken) {
        const response = await request(`${roomUrl(id)}/assets`, {
            method: 'POST',
            headers: { 'content-type': blob.type || 'application/octet-stream', authorization: `Bearer ${token}` },
            body: blob
        });
        return response.url;
    }
    async function create(state, resolveLocalAsset, creationToken) {
        if (location.protocol !== 'https:') {
            throw new Error('Abra o mapa pelo site publicado em HTTPS para gerar links compartilháveis.');
        }
        if (!/^[a-f0-9]{64}$/.test(creationToken || '')) {
            throw new Error('Informe a chave de criação da mesa.');
        }
        const created = await request(`${API}/api/rooms`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${creationToken}` },
            body: JSON.stringify({ state: { version: 1 } })
        });
        const assetUrls = new Map();
        async function convert(value) {
            if (typeof value === 'string' && (value.startsWith('idb-asset:') || /^data:(image|audio|video)\//i.test(value))) {
                if (!assetUrls.has(value)) {
                    const blob = value.startsWith('idb-asset:')
                        ? await resolveLocalAsset(value)
                        : await fetch(value).then(response => response.blob());
                    if (!blob) throw new Error('Uma imagem local não pôde ser encontrada.');
                    assetUrls.set(value, await upload(blob, created.roomId, created.masterToken));
                }
                return assetUrls.get(value);
            }
            if (Array.isArray(value)) return Promise.all(value.map(convert));
            if (value && typeof value === 'object') {
                const entries = await Promise.all(Object.entries(value).map(async ([key, item]) => [key, await convert(item)]));
                return Object.fromEntries(entries);
            }
            return value;
        }
        const sharedState = await convert(state);
        await request(roomUrl(created.roomId), {
            method: 'PUT',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${created.masterToken}` },
            body: JSON.stringify({ state: sharedState })
        });
        localStorage.setItem('antonieta-map-state-v1', JSON.stringify(sharedState));
        const result = { viewer: mapUrl(created.roomId), master: mapUrl(created.roomId, created.masterToken) };
        sessionStorage.setItem('antonieta-new-shared-room', JSON.stringify(result));
        location.assign(result.master);
    }

    window.AntonietaMapSync = { init, save, replace, upload, create, links, isMaster, isViewer, hasRoom: validRoom };
})();
