# Gincana Educativa Online

Versão completamente hospedada (sem servidor, sem banco de dados) que roda no Netlify.

## Deploy rápido

### Opção 1: GitHub + Netlify (recomendado, automático)

1. Este repositório já está configurado para Netlify
2. Abra https://app.netlify.com/sites/gincana-educativa
3. Seu site está em: **https://gincana-educativa.netlify.app** ✅

### Opção 2: Fazer deploy localmente

```bash
cd apps/web-online
npm install
npm run build
npx netlify-cli deploy --prod
```

## Como jogar

1. Abra a URL no navegador
2. Professor clica "Criar servidor"
3. Alunos clicam "Entrar no servidor" e digitam o código da sala
4. Professor inicia a partida e joga!

Mais detalhes no `README.md` da raiz do projeto.
