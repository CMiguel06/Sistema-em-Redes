README — Demo Interativa da Contagem Regressiva Binária (BCP)
Sumário

Esta demo ilustra o Binary Countdown Protocol (BCP), um método determinístico de arbitragem de acesso ao meio em redes/barramentos partilhados com nível dominante/recessivo (open-collector/open-drain). Cada estação anuncia o seu ID binário do MSB→LSB; a cada bit, o barramento apresenta o nível dominante sempre que alguma estação o transmite. Quem colocou o nível recessivo e observa o dominante perde a arbitragem. O processo repete-se bit a bit até sobrar um vencedor (a estação com prioridade efetiva segundo a polaridade).

Com 1 dominante vence o ID numericamente mais alto; com 0 dominante vence o ID numericamente mais baixo.

Funcionalidades

Alterar número de bits (2–16).

Selecionar a polaridade (1 domina 0 ou 0 domina 1).

Editar os IDs binários das estações (interface em linha, validação 0/1).

Passo-a-passo (Avançar 1 bit) e Auto-play com controlo de velocidade.

Linha temporal do nível no barramento (MSB→LSB) e narração dos eventos.

Indicação clara de eliminação por bit e vencedor.

Conceitos-chave (BCP em 60s)

Meio partilhado com nível dominante (wired-OR/AND).

IDs únicos por estação (mesmo comprimento em bits).

Arbitragem MSB→LSB em janelas sincronizadas.

Perda imediata quando a estação transmite recessivo mas lê dominante.

Sem colisões na contenção; tempo de arbitragem O(nBits), independente do nº de estações.

Trade-offs: sobrecarga de arbitragem (n bits) e possível fome de estações de baixa prioridade (mitigar com rotação/ageing de prioridades).

Cenários de utilização

Barramentos industriais/automotivos: prioridades rígidas e previsibilidade temporal.

Backplanes / multiprocessador: concessão do bus sem colisões.

Interfaces multi‑mestre: meios com níveis dominante/recessivo, com deteção de perda de arbitragem on‑the‑fly.

Como utilizar a demo

Clica Iniciar (a arbitragem começa no bit mais significativo).

Usa Avançar 1 bit para observar eliminação por bit, ou ativa Auto.

Ajusta Número de bits e Nível dominante conforme o cenário que pretendes demonstrar.

Edita IDs para, por exemplo, reproduzir o caso: D=1110, A=1101, B=1010, C=0111 (vence D com 1 dominante).

Personalização

IDs e nº de estações: usa o botão + Adicionar estação e/ou o campo de edição binária.

Cores: a paleta está no topo do ficheiro (array palette).

Mensagens/UI: a narração e rótulos são strings PT‑PT passíveis de ajuste.
