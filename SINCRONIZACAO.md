# Sincronizar o mapa entre computadores

Este repositório guarda o código, `map-state.json`, `map-state-live.js` e as imagens em `map-assets/` e na raiz. O site público continua hospedado no endereço atual; o GitHub serve para copiar os arquivos do projeto entre computadores.

## Depois de editar a mesa online

No computador que tem o repositório, execute:

```powershell
node scripts/snapshot-shared-map.mjs
git add map-state.json map-state-live.js map-assets
git commit -m "Atualiza estado e imagens do mapa"
git push origin HEAD:master
```

O primeiro comando lê a mesa ativa, baixa as mídias adicionadas no navegador e atualiza o JSON e o estado inicial local. As imagens novas ficam em `map-assets/`; o `git push` envia esses arquivos ao GitHub.

## No outro computador

```powershell
git clone https://github.com/NilMatrix1011/antonieta-RPG.git
cd antonieta-RPG
```

Se o projeto já existir ali, use `git pull`. Abra `index.html` para usar o estado salvo no repositório ou acesse o site público para ver a mesa online. As imagens referenciadas pelo estado local acompanham o clone/pull.

## Backup JSON pelo navegador

No link do mestre, abra **Controles do Mestre → Baixar backup JSON**. O arquivo gerado inclui o estado da mesa e incorpora mídias que estavam no navegador ou no serviço online. No outro computador, use **Restaurar backup JSON** no link do mestre. Essa restauração substitui o estado atual da mesa.

Para versionar esse backup, coloque o arquivo JSON baixado dentro do repositório, faça `git add` e `git push`. O navegador não envia automaticamente os dados locais para o GitHub. Para backups com muitas mídias, prefira o comando de captura acima, que salva cada mídia como arquivo separado.
