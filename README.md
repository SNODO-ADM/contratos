# SNODO Contracts — página de entrada

Endereço oficial: **https://snodo-adm.github.io/contratos/**

Esta pasta contém **somente** a página de entrada (sem código do sistema, sem dados e sem credenciais).
Ela abre o SNODO Contracts (Google Apps Script) e controla a atualização de versão:
a versão nova fica disponível e cada usuário só passa a usá-la ao clicar em **Atualizar agora**.

- `config.json` — IDs das implantações dos canais `atual` e `anterior` (não são sigilosos: fazem parte da URL pública do app).
- `canal.js` — regra de escolha do canal (testada no repositório principal).
- `portal.js` / `portal.css` / `index.html` — página de entrada; `manifest.webmanifest` e ícones — instalação como app.

Código-fonte e documentação: repositório privado `SNODO-ADM/snodo-contracts` (pasta `portal/`, que é a fonte desta página).
Para usar domínio próprio no futuro (ex.: `contratos.snodo.com.br`), ver `docs/DEPLOYMENT.md` do repositório principal.
