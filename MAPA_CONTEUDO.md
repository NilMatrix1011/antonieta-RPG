# Conteúdo do mapa da Antonieta

Este inventário descreve o estado inicial publicado do mapa. As posições são porcentagens da imagem: **esquerda × topo**.

## Onde cada dado fica

| Conteúdo | Arquivo ou campo |
| --- | --- |
| Página que exibe o mapa e carrega o estado inicial | `Mapa_RPG_Mansão_dos_Macrados.html` |
| Cenários criados, pontos, eventos, personagens e posições | `map-state.js` |
| Imagens, GIFs e vídeos novos | `map-assets/` |
| GIFs de personagens já existentes no projeto | `Idle_rotations_8dir (2).gif`, `(3).gif`, `(4).gif` e `(5).gif` na raiz |
| Página com as abas do mapa e da Arena | `index.html` |

Em `map-state.js`, `scenarios` guarda os cenários criados, `scenarioLinks` guarda os pontos que levam a outros cenários, `events` guarda os pontos de eventos, e `charsData` guarda os personagens. `enemies` está vazio neste estado. As mídias são referenciadas pelo caminho relativo ao HTML. O navegador pode manter alterações particulares em `localStorage` (`antonieta-map-state-v1`); quando existe um estado local válido, ele é carregado no lugar deste estado inicial.

Os pontos sozinhos preservam títulos, destinos e posições. As mídias de `map-assets/` precisam acompanhar `map-state.js` para que imagens e vídeos apareçam em outros navegadores. Os quatro eventos de porta não usam mídia própria.

## Cenários criados

| Cenário | ID em `scenarios` | Imagem principal | Imagem noturna |
| --- | --- | --- | --- |
| Corredor do castigo | `scenario_1790956625708_u69ra6` | `map-assets/asset_1790956625703_z087wlrd5e.png` | — |
| Beco | `scenario_1791237320458_gsbc14` | `map-assets/asset_1791237320453_7gieb7ph36n.png` | — |
| Olhos atentos | `scenario_1791237461841_68y4zz` | `map-assets/asset_1791237461820_36botcpkmkd.png` | — |
| Delegacia | `scenario_1791239433224_4nqx9q` | `map-assets/asset_1791239433220_jo5kfx7qct.png` | — |
| Orfanato do terror | `scenario_1791240005156_al33dg` | `map-assets/asset_1791240005153_9qmuh3c90mb.png` | — |
| Andar 2 | `scenario_1791254476498_3jtvhc` | `map-assets/asset_1791254476491_hw1apd3cj8c.png` | — |
| Quarto do tempo | `scenario_1791404709646_6w88q3` | `map-assets/asset_1791404709641_vmpmhv7s34.png` | — |
| Antiga prefeitura | `scenario_1791406050478_72nlwx` | `map-assets/asset_1791406050439_watyj25snx.png` | `map-assets/asset_1791406050474_x5r5qt5df18.png` |
| Rua do padre | `scenario_1791406721210_grz30h` | `map-assets/asset_1791406721002_kwg27srhnx.png` | `map-assets/asset_1791406721205_c9ctkzupxhd.png` |
| Casa do padre | `scenario_1791407067108_znh3wm` | `map-assets/asset_1791407067073_x7xofeuqhe.png` | `map-assets/asset_1791407067104_e1k17ouvktj.png` |
| Quarto do padre | `scenario_1791408630855_n9o6nq` | `map-assets/asset_1791408630820_20d7h8nqb9u.png` | `map-assets/asset_1791408630851_7lq6m2emosa.png` |
| Museo | `scenario_1791506635833_chkpv4` | `map-assets/asset_1791506635741_dqxgjqsskc8.png` | — |
| Museu | `scenario_1791507147324_qdq6hv` | `map-assets/asset_1791507147280_e0b2g8qz6vs.png` | — |

## Pontos que levam a outros cenários

| Origem | Ponto | Destino | Esquerda × topo |
| --- | --- | --- | --- |
| Cidade de Antonieta e Arredores | Antiga prefeitura | Antiga prefeitura | 41.376% × 72.337% |
| Cidade de Antonieta e Arredores | Rua do padre | Rua do padre | 20.443% × 17.583% |
| Centro de Nova Capital | Beco | Beco | 46.788% × 40.329% |
| Centro de Nova Capital | Olhos atentos | Olhos atentos | 64.671% × 35.016% |
| Centro de Nova Capital | Delegacia | Delegacia | 77.664% × 50.148% |
| Centro de Nova Capital | Orfanato do terror | Orfanato do terror | 92.018% × 72.572% |
| Centro de Nova Capital | Museo | Museo | 68.948% × 25.341% |
| Escola Estadual Antônio Macrado | Corredor do castigo | Corredor do castigo | 51.588% × 13.797% |
| Subsolo da igreja | Porta suja de lama | andar_6 | 84.679% × 8.203% |
| Subsolo da igreja | Porta com nevoa saindo por baixo | Mansão dos Macrados, 2º andar | 13.976% × 8.496% |
| Orfanato do terror | Andar 2 | Andar 2 | 42.367% × 19.125% |
| Andar 2 | Quarto do tempo | Quarto do tempo | 88.184% × 23.179% |
| Rua do padre | Casa do padre | Casa do padre | 45.802% × 55.204% |
| Casa do padre | Quarto do padre | Quarto do padre | 70.443% × 3.343% |
| Museo | Museu | Museu | 55.670% × 57.648% |

## Pontos de eventos

| Cenário | Ponto | Conteúdo | Esquerda × topo |
| --- | --- | --- | --- |
| Mapa Mundi | Vista antes do caos | `map-assets/asset_1790897644376_ytgd751jvt.png` | 23.161% × 66.977% |
| Mapa Mundi | A chegada tão esperada | `map-assets/asset_1790954522302_6zfh8bl6dyi.png` | 11.942% × 49.575% |
| Mapa Mundi | Uma ajudinha sempre é bem vinda | `map-assets/asset_1790955324594_a22gazvzei.png` | 47.342% × 58.644% |
| Mapa Mundi | Pra onde eles foram? | `map-assets/asset_1790955354417_hoehq2tlbp5.png` | 45.189% × 56.625% |
| Cidade de Antonieta e Arredores | Boa resposta | `map-assets/asset_1790967535111_7rhr36c1u0f.mp4` | 50.126% × 81.748% |
| Centro de Nova Capital | Olha ele ai | `map-assets/asset_1790885867670_uf0bhx51hvj.png` | 54.620% × 67.402% |
| Escola Estadual Antônio Macrado | Quem é ela ? | `map-assets/asset_1790957617259_u3xs2qkeezi.png` | 77.366% × 23.043% |
| Labirinto da Mansão | Uma estranha alavanca | `map-assets/asset_1791406180255_9xrpfj676ps.mp4` | 58.063% × 47.871% |
| Mansão dos Macrados, 1º andar | Porta macabra | Porta interativa | 81.269% × 56.266% |
| Mansão dos Macrados, 1º andar | cofrre | `map-assets/asset_1791403504326_268ki95a817.png` | 92.513% × 73.376% |
| Corredor do castigo | Eu ja imaginava | `map-assets/asset_1791408165731_h8zzgrpvh65.mp4` | 50.108% × 40.751% |
| Corredor do castigo | Porta | Porta interativa | 48.732% × 34.374% |
| Delegacia | caixa de provas | `map-assets/asset_1791405350219_qpxjco8vu8.png` | 22.057% × 70.294% |
| Delegacia | caixa de provas | `map-assets/asset_1791405415499_mpwzkij8rs.png` | 2.141% × 95.693% |
| Orfanato do terror | Sem serventia | `map-assets/asset_1791254575728_ztsvndycbyh.mp4` | 11.682% × 29.521% |
| Orfanato do terror | Porta macabra | Porta interativa | 13.286% × 35.133% |
| Andar 2 | Porta do quarto | Porta interativa | 84.364% × 30.039% |
| Quarto do tempo | O homem do tempo | `map-assets/asset_1791406843020_x6jn6tof95d.png` | 23.576% × 44.903% |
| Quarto do padre | Caminho do pecado | `map-assets/asset_1791408740777_gjah3zo2fio.mp4` | 50.679% × 46.774% |
| Museu | Uma estranha conhecida | `map-assets/asset_1791507177536_uy9z6ddxt4.png` | 22.177% × 65.193% |

## Personagens no mapa

| Cenário | Nome | GIF | Esquerda × topo |
| --- | --- | --- | --- |
| Mansão dos Macrados, 2º andar | Investigador | `Idle_rotations_8dir (3).gif` | 72.87% × 58.77% |
| Mansão dos Macrados, 2º andar | Investigador | `Idle_rotations_8dir (4).gif` | 74.81% × 57.47% |
| Mansão dos Macrados, 2º andar | Investigador | `Idle_rotations_8dir (2).gif` | 70.93% × 54.65% |
| Mansão dos Macrados, 2º andar | Investigador | `Idle_rotations_8dir (5).gif` | 76.48% × 59.04% |
| Mansão dos Macrados, 2º andar | Investigador | `map-assets/asset_1790966563991_0o8g1j71941p.gif` | 70.71% × 56.83% |
