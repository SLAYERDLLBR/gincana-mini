# Deploy no Netlify (Modo Online)

## Via GitHub (recomendado)

1. Este repositório já está configurado para deploy automático no Netlify
2. Vá em [Netlify](https://app.netlify.com) e faça login
3. Clique em "New site from Git"
4. Selecione este repositório (gincana-educativa)
5. Confirm as configurações de build (devem estar já corretas)
6. Clique em "Deploy"

Pronto! Sua URL estará em https://[seu-site].netlify.app

## Via CLI (se tiver Node.js)

```bash
cd apps/web-online
npm install
npx netlify-cli deploy --build --prod
```

Qualquer dúvida, veja o README.md na raiz do projeto.
