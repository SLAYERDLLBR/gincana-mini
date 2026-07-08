# 🎮 Gincana Educativa Multiplayer

Gincana em tempo real para sala de aula (crianças de 6 a 11 anos), em duas equipes — 🔵 Azul vs 🔴 Vermelha.

Este repositório tem **dois modos**, no mesmo projeto:

| | `apps/web` + `apps/server` (**Modo LAN**) | `apps/web-online` (**Modo Online**) |
|---|---|---|
| Onde roda | Computador do professor, rede local, sem internet | Hospedado (Netlify), com URL pública |
| Tempo real | Socket.IO (instantâneo) | Consulta a cada 1-1.5s (quase instantâneo) |
| Banco de dados | PostgreSQL (histórico de partidas) | Netlify Blobs (sem histórico entre partidas) |
| Uso recomendado | Sala com Wi-Fi local, sem depender de internet | Turma acessando de qualquer lugar, com internet |

## Modo Online (`apps/web-online`) — deploy no Netlify

Essa versão não precisa de servidor, Docker ou banco de dados: tudo roda como funções do Next.js na Netlify, com o estado de cada sala guardado no Netlify Blobs.

```bash
cd apps/web-online
npm install
npx netlify-cli deploy --build --prod
```

O comando acima vai abrir o navegador pra você logar na Netlify (ou criar uma conta gratuita) e perguntar se quer criar um site novo — depois disso, ele builda e publica sozinho, e te dá a URL pública (algo como `https://gincana-educativa.netlify.app` ou parecido, você pode renomear o site nas configurações do Netlify pra deixar a URL mais curta).

## Modo LAN (`apps/web` + `apps/server`) — uso local em sala

## Pré-requisitos

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para rodar o PostgreSQL local) — ou um PostgreSQL já instalado na máquina
- Todos os dispositivos (professor + alunos) na **mesma rede Wi-Fi**

## Como rodar

```bash
# 1. Instalar as dependências de todo o monorepo
npm install

# 2. Subir o banco de dados PostgreSQL local
docker compose up -d

# 3. Configurar variáveis de ambiente
cp .env.example apps/server/.env
cp .env.example apps/web/.env.local
# edite os dois arquivos deixando só a seção correspondente a cada app

# 4. Gerar o Prisma Client e criar as tabelas
npm run db:migrate --workspace=apps/server

# 5. Popular o banco com as 72 perguntas de exemplo
npm run db:seed --workspace=apps/server

# 6. Rodar o servidor (Socket.IO) — em um terminal
npm run dev:server

# 7. Rodar o frontend Next.js — em outro terminal
npm run dev:web
```

Abra `http://localhost:3000` no computador do professor. Para os alunos entrarem pelo celular/tablet, descubra o IP local do computador do professor (`ipconfig` no Windows ou `ifconfig`/`ip a` no Mac/Linux, algo como `192.168.0.x`) e acesse `http://SEU-IP:3000` nos outros aparelhos — todos precisam estar na mesma rede Wi-Fi.

> Antes de subir para produção/GitHub, troque `NEXT_PUBLIC_SOCKET_URL` em `apps/web/.env.local` para o IP local do servidor (não `localhost`), para que os celulares dos alunos consigam se conectar ao servidor Socket.IO.

## Estrutura do projeto

Veja `arquitetura-gincana-educativa.md` (documento de planejamento já aprovado) para o detalhamento completo de arquitetura, modelagem do banco, eventos Socket.IO e plano de fases (esse documento descreve o Modo LAN, que foi o desenho original).

```
apps/server       → domínio, use cases, Prisma, Socket.IO (Modo LAN, Node.js)
apps/web          → Next.js 14, cliente Socket.IO (Modo LAN)
apps/web-online   → Next.js 14 self-contained, API routes + Netlify Blobs (Modo Online)
packages/shared-types → tipos compartilhados entre server e web (usado só pelo Modo LAN)
```

## Limitações do Modo Online

Como não há um servidor de verdade nem timers de servidor, o `apps/web-online` usa um modelo diferente do LAN:

- A virada de pergunta/revelação acontece "sob consulta" (quando alguém consulta o estado depois do tempo esgotado), não por um timer ativo — na prática isso significa até ~1 segundo de atraso, imperceptível na maioria dos casos.
- Sem controle de concorrência: se dois alunos responderem no exato mesmo milissegundo, existe uma chance mínima de uma resposta sobrescrever a outra no armazenamento. Para turmas de até ~40 alunos isso raramente é um problema.
- Não há painel do professor nem histórico entre partidas nessa versão (o estado de cada sala é temporário).


## Decisões de design tomadas (sem resposta sua ainda)

Como o projeto foi aprovado antes de eu confirmar alguns detalhes com você, tomei estas decisões — revise e me avise se quiser mudar algo:

1. **Servidor separado do Next.js** (Express + Socket.IO em `apps/server`, na porta 3333) em vez de um custom server dentro do Next — mais alinhado com Clean Architecture.
2. **Banco de perguntas de exemplo**: como você não enviou um banco pronto, criei 72 perguntas (4 categorias × 6 idades × 3 dificuldades) para o projeto já funcionar de ponta a ponta. Vale a pena revisar o conteúdo e completar com mais perguntas antes de usar em aula.
3. **Adaptação por idade**: como todos os jogadores respondem à mesma pergunta ao mesmo tempo (placar de equipe compartilhado), a "idade-alvo" da partida é a média de idade dos jogadores da sala — não é individual por jogador. Isso está documentado no código (`iniciarPartida.ts`).
4. **Alternativas embaralhadas a cada rodada**, para a resposta certa nunca cair sempre na mesma posição.

## Limitação conhecida (Modo LAN)

No Modo LAN, se um jogador atualizar a página (F5) durante o lobby ou a partida, ele perde a conexão com a sala (o identificador do jogador é o ID do socket, que muda a cada reconexão). O Modo Online já não tem esse problema, pois usa um ID de jogador salvo no navegador (sessionStorage) em vez do ID da conexão.

## Licença

MIT — veja o arquivo `LICENSE`. Uso livre para fins educacionais.

