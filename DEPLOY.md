# Deploy do LearnWay

Como o projeto vai para a nuvem e como a esteira funciona depois disso.
**Custo total: zero.** Nenhum passo aqui exige plano pago ou depósito.

```
                        git push origin main
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
   mexeu em learnway-api/**              mexeu em learnway-web/**
              │                                     │
      GitHub Actions                       Cloudflare Pages
   build da imagem ARM64                   npm ci && ng build
   push → GHCR                                     │
   ssh → docker compose up                         │
              │                                     │
      ┌───────▼─────────────┐             ┌────────▼────────┐
      │  Oracle Cloud (VM)  │             │  Pages (CDN)    │
      │  Caddy → TLS grátis │◄─── /api ───│  learnway-web   │
      │  learnway-api       │             └─────────────────┘
      └───────┬─────────────┘
              │
        ┌─────▼─────┐
        │   Neon    │  (já existe, não muda nada)
        └───────────┘
```

**Por que Oracle e não Google Cloud?** O Cloud Run seria mais simples, mas o Google
exige no Brasil um pré-pagamento de R$ 150 para liberar o faturamento. A Oracle
oferece uma VM *Always Free* de verdade — e ainda melhor: ela nunca dorme, então
**não existe cold start**. Se você resolver a questão do cartão no Google, o caminho
do Cloud Run continua pronto em
[`deploy-backend-cloudrun.yml`](.github/workflows/deploy-backend-cloudrun.yml).

---

## O que já foi verificado nesta máquina

Estas partes estão testadas de verdade — não são promessa:

| Verificação | Resultado |
| --- | --- |
| Imagem Docker **ARM64** constrói | ✅ `Arch=arm64` |
| Aplicação roda em ARM | ✅ `aarch64`, boot OK, 99 libs no lugar |
| API ponta a ponta em ARM | ✅ registro → JWT → `/api/topics` (8 trilhas) |
| Contêiner respeita a variável `PORT` | ✅ |
| Boot com 1 vCPU / 1 GB | ✅ **~12 s** |
| `/actuator/health` | ✅ `{"status":"UP"}` |
| Flyway do zero | ✅ 17 migrations, 8 trilhas / 54 lições / 126 questões / 270 flashcards |
| `curl` existe na imagem base | ✅ (o healthcheck do compose depende disso) |
| Build do frontend com a troca de ambiente | ✅ nenhum `localhost` no bundle |
| `.env` real fora do git | ✅ ignorado; só o `.env.example` é versionado |

E o que **não** funciona, medido aqui: com 512 MB e 0.1 de CPU (plano grátis do
Render) a aplicação **não terminou de subir em 20 minutos**. Por isso a VM da Oracle,
que dá 4 núcleos e 24 GB.

---

## Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta na [Oracle Cloud](https://www.oracle.com/br/cloud/free/) — pede cartão só para
  verificação de identidade (autorização de ~US$ 1, estornada). **Não há
  pré-pagamento.**
- Conta na [Cloudflare](https://dash.cloudflare.com) — não pede cartão
- Conta no [DuckDNS](https://www.duckdns.org) — login com GitHub, não pede nada

**Tempo total:** ~1 h, boa parte esperando a nuvem provisionar.

> **A ordem importa.** O push do código é o gatilho da esteira, então ele fica lá na
> Parte 5 — depois que a VM já existe. Seguindo nesta ordem, a primeira execução do
> workflow já passa.

---

## Parte 1 — Repositório vazio no GitHub

Aqui você só **cria** o repositório. Nada de push ainda.

Em <https://github.com/new>:

| Campo | Valor |
| --- | --- |
| Repository name | `learnway` |
| Visibilidade | **Public** (deixa a imagem no GHCR pública, e a VM baixa sem senha) |
| Add a README | **desmarcado** |
| Add .gitignore | **None** |

O repositório precisa nascer vazio: o projeto já tem histórico próprio, e um README
criado pelo GitHub causaria conflito no primeiro push.

> Se preferir **Private**, funciona igual, mas a VM vai precisar autenticar para
> baixar a imagem — veja *Repositório privado* na seção final.

---

## Parte 2 — A VM na Oracle Cloud

### 2.1 Criar a conta

<https://www.oracle.com/br/cloud/free/> → *Start for free*.

Escolha a **região mais próxima** (`Brazil East (São Paulo)` ou `Brazil Southeast
(Vinhedo)`). **A região não pode ser trocada depois.**

### 2.2 Criar a instância

Menu ☰ → *Compute* → *Instances* → **Create instance**.

| Campo | Valor |
| --- | --- |
| Name | `learnway` |
| Image | **Canonical Ubuntu 22.04** |
| Shape | *Change shape* → **Ampere** → `VM.Standard.A1.Flex` |
| OCPUs | `2` |
| Memory | `12 GB` |

> **Pedi 2 núcleos e 12 GB, metade da cota, de propósito.** A cota Always Free é 4
> OCPU / 24 GB, mas pedir tudo aumenta muito a chance de bater em *"Out of host
> capacity"*. Sobra folga enorme para esta aplicação, e você ainda pode expandir
> depois.

Em *Add SSH keys*, escolha **Generate a key pair for me** e **baixe a chave privada** —
ela não aparece de novo. Salve como `~/.ssh/learnway_oracle`.

Clique em **Create**.

> ### Se aparecer "Out of host capacity"
> É o pedreiro do Always Free: a capacidade ARM esgota nas regiões populares. Opções,
> em ordem de eficácia:
> 1. **Tente de novo em horários diferentes** — costuma liberar de madrugada.
> 2. **Reduza para 1 OCPU / 6 GB** — sobra para esta aplicação e é bem mais fácil de
>    conseguir.
> 3. **Tente a outra região do Brasil** (São Paulo ↔ Vinhedo) ao criar a conta.
>
> Não desista no primeiro erro; é normal levar algumas tentativas.

Quando a instância ficar *Running*, anote o **Public IP address**.

### 2.3 Abrir as portas 80 e 443

**Este é o passo que mais gente esquece** — e o sintoma é confuso: a VM responde ao
SSH mas o site nunca carrega. São **duas** camadas de firewall, e as duas precisam ser
abertas.

**Camada 1 — a nuvem.** Na página da instância → *Primary VNIC* → clique na **subnet**
→ *Security Lists* → a lista padrão → **Add Ingress Rules**. Adicione duas:

| Source CIDR | IP Protocol | Destination Port |
| --- | --- | --- |
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

**Camada 2 — o Ubuntu.** A imagem da Oracle vem com regras de `iptables` que bloqueiam
tudo além do SSH. Isso é feito no passo 2.4, já conectado na VM.

### 2.4 Conectar e preparar a máquina

```bash
chmod 600 ~/.ssh/learnway_oracle
ssh -i ~/.ssh/learnway_oracle ubuntu@SEU_IP_PUBLICO
```

Já dentro da VM:

```bash
# Abrir as portas no firewall local (a segunda camada) e tornar permanente.
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# Docker.
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Usar docker sem sudo (precisa reconectar depois).
sudo usermod -aG docker ubuntu
exit
```

Reconecte e confirme:

```bash
ssh -i ~/.ssh/learnway_oracle ubuntu@SEU_IP_PUBLICO
docker run --rm hello-world     # tem que funcionar sem sudo
```

---

## Parte 3 — Domínio e HTTPS

**Por que precisa de domínio.** O frontend fica no Cloudflare Pages, servido por
HTTPS. Um site HTTPS **não pode** chamar uma API por HTTP — o navegador bloqueia como
*mixed content*. E certificado TLS não é emitido para endereço IP. Logo: domínio.

O DuckDNS resolve isso de graça e em dois minutos.

1. Entre em <https://www.duckdns.org> com sua conta do GitHub.
2. Crie um subdomínio, ex.: `learnway-api` → vira `learnway-api.duckdns.org`.
3. No campo **current ip**, coloque o IP público da VM e clique em *update ip*.

Confirme que propagou:

```bash
nslookup learnway-api.duckdns.org      # deve devolver o IP da VM
```

> Se você já tem um domínio próprio, use-o: crie um registro `A` apontando para o IP
> da VM. O resto é idêntico.

---

## Parte 4 — Subir a stack na VM

Ainda conectado por SSH:

```bash
mkdir -p ~/learnway && cd ~/learnway
```

Crie os três arquivos. O conteúdo está no repositório, na pasta
[`deploy/`](deploy/) — copie e cole:

**`docker-compose.yml`** → conteúdo de [`deploy/docker-compose.yml`](deploy/docker-compose.yml)

**`Caddyfile`** → conteúdo de [`deploy/Caddyfile`](deploy/Caddyfile), trocando o
domínio e o e-mail pelos seus:

```
learnway-api.duckdns.org {
	tls seuemail@exemplo.com
	...
```

**`api.env`** → conteúdo de [`deploy/api.env.example`](deploy/api.env.example), com os
valores reais do seu `learnway-api/.env` local. Depois:

```bash
chmod 600 api.env      # só você lê
```

> Deixe `CORS_ALLOWED_ORIGINS` e os `OAUTH_*` com um valor provisório por enquanto —
> você ajusta na Parte 6, quando souber a URL do frontend.

Agora suba pela primeira vez, apontando para uma imagem qualquer só para o Caddy
emitir o certificado:

```bash
echo "API_IMAGE=ghcr.io/SEU_USUARIO/learnway/learnway-api:latest" > .env
docker compose up -d caddy
docker compose logs -f caddy      # espere "certificate obtained successfully"
```

Se o certificado saiu, o mais difícil acabou. Confirme de fora da VM:

```bash
curl -I https://learnway-api.duckdns.org      # deve responder (502 é esperado, a API ainda não subiu)
```

---

## Parte 5 — Ligar a esteira

### 5.1 Chave SSH para o GitHub Actions

Use uma chave **separada** da sua pessoal — assim dá para revogar só a do CI se
precisar. Na sua máquina:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/learnway_deploy -N "" -C "github-actions"
cat ~/.ssh/learnway_deploy.pub
```

Copie a saída e, **na VM**, autorize:

```bash
echo "COLE_A_CHAVE_PUBLICA_AQUI" >> ~/.ssh/authorized_keys
```

### 5.2 Cadastrar os segredos no GitHub

Repositório → **Settings › Secrets and variables › Actions › New repository secret**:

| Nome | Valor |
| --- | --- |
| `VM_HOST` | o IP público da VM |
| `VM_USER` | `ubuntu` |
| `VM_SSH_KEY` | conteúdo de `~/.ssh/learnway_deploy` (a chave **privada**, inteira, incluindo as linhas `BEGIN`/`END`) |

### 5.3 Primeiro push — é aqui que a esteira roda

```bash
cd c:/Users/Pichau/Desktop/learnway

# Rede de segurança: deve listar SÓ .env.example, api.env.example,
# environment.ts e environment.prod.ts.
# Se aparecer "learnway-api/.env", PARE.
git status --porcelain | grep -i env

git add -A
git commit -m "LearnWay: aplicação completa + esteira de deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/learnway.git
git push -u origin main
```

Acompanhe na aba **Actions** (~5 min: o build ARM é rápido porque o Maven roda no x86
do runner e só o runtime é ARM).

Ao terminar, confirme:

```bash
curl https://learnway-api.duckdns.org/actuator/health      # → {"status":"UP"}
```

### 5.4 Deixar a imagem pública (repositório público)

Na primeira execução o GHCR cria o pacote como privado. Vá em
**github.com/SEU_USUARIO?tab=packages** → `learnway-api` → *Package settings* →
*Change visibility* → **Public**. Assim a VM baixa sem autenticação.

---

## Parte 6 — Frontend no Cloudflare Pages

### 6.1 Criar o projeto

<https://dash.cloudflare.com> → **Workers & Pages › Create › Pages › Connect to Git** →
repositório `learnway`.

| Campo | Valor |
| --- | --- |
| Framework preset | `None` |
| **Root directory** | `learnway-web` |
| Build command | `npm ci && npm run build` |
| **Build output directory** | `dist/learnway-web/browser` |

Em *Environment variables*, adicione `NODE_VERSION` = `22`.

A URL sai como `https://learnway-xxx.pages.dev` — anote.

> O [`learnway-web/public/_redirects`](learnway-web/public/_redirects) já está no
> repositório: é ele que faz `/trilha`, `/perfil` e o F5 funcionarem em vez de 404.

### 6.2 Apontar o frontend para o backend

Edite [`learnway-web/src/environments/environment.prod.ts`](learnway-web/src/environments/environment.prod.ts):

```ts
apiOrigin: 'https://learnway-api.duckdns.org',
```

### 6.3 Liberar o frontend no backend

Na VM, edite `~/learnway/api.env` com a URL real do Pages:

```bash
CORS_ALLOWED_ORIGINS=https://learnway-xxx.pages.dev
OAUTH_FRONTEND_REDIRECT=https://learnway-xxx.pages.dev/oauth/callback
OAUTH_FAILURE_REDIRECT=https://learnway-xxx.pages.dev/entrar?error=oauth
```

```bash
cd ~/learnway && docker compose up -d --force-recreate api
```

### 6.4 Login social (só se você usa)

Os provedores validam a URL de retorno:

- **Google** — <https://console.cloud.google.com/apis/credentials> → seu OAuth client →
  *Authorized redirect URIs* → `https://learnway-api.duckdns.org/login/oauth2/code/google`
- **GitHub** — <https://github.com/settings/developers> → seu OAuth App →
  *Authorization callback URL* → `https://learnway-api.duckdns.org/login/oauth2/code/github`

Descomente as quatro variáveis correspondentes no `api.env` e recrie o contêiner.

```bash
git add -A && git commit -m "frontend: aponta para o backend em produção" && git push
```

---

## O dia a dia depois disso

```bash
# mexeu no backend
git add . && git commit -m "corrige X" && git push
# → Actions compila ARM, publica no GHCR, entra por SSH e sobe. ~5 min.
#   O workflow só declara sucesso depois que /actuator/health responde.

# mexeu no frontend
git add . && git commit -m "ajusta Y" && git push
# → Cloudflare Pages reconstrói. ~2 min.
```

**Migrations**: o Flyway roda no boot. Adicionar um `V18__algo.sql` e dar push já
aplica no Neon. Se falhar, o healthcheck do deploy não passa e o workflow acusa erro.

**Voltar uma versão** (na VM):

```bash
cd ~/learnway
echo "API_IMAGE=ghcr.io/SEU_USUARIO/learnway/learnway-api:SHA_ANTIGO" > .env
docker compose up -d
```

**Ver logs**:

```bash
ssh -i ~/.ssh/learnway_oracle ubuntu@SEU_IP
cd ~/learnway && docker compose logs -f api
```

---

## Custos

| Recurso | Cota gratuita | Situação |
| --- | --- | --- |
| Oracle VM Ampere A1 | 4 OCPU / 24 GB **para sempre** | usando 2 / 12 GB |
| Oracle — tráfego | 10 TB/mês | irrisório |
| Oracle — disco | 200 GB | ~50 GB |
| GitHub Actions | 2.000 min/mês (ilimitado se público) | ~5 min por deploy |
| GHCR | ilimitado para pacote público | — |
| Cloudflare Pages | ilimitado | — |
| DuckDNS | grátis | — |
| Neon | 0,5 GB | já em uso |

**Zero cold start**: a VM nunca dorme. A única lentidão eventual é o Neon acordando
a compute depois de uns minutos parado, o que a aplicação já trata (`connect-retries`
no Flyway e timeout generoso no Hikari).

> A Oracle pode recuperar instâncias Always Free **ociosas** (CPU < 10% por 7 dias
> seguidos). Um site com uso real não corre esse risco; se ficar meses sem ninguém
> acessar, pode acontecer.

---

## Se der errado

| Sintoma | Causa provável |
| --- | --- |
| SSH funciona, mas o site não abre | as portas 80/443 — faltou **uma das duas** camadas da Parte 2.3 |
| Caddy não emite certificado | DNS ainda não propagou, ou a porta 80 está fechada (o Let's Encrypt valida por ela) |
| `502 Bad Gateway` | a API não subiu: `docker compose logs api` |
| API não inicia | quase sempre `DATABASE_URL`; confira o formato JDBC e o `?sslmode=require` |
| Actions falha no passo de SSH | `VM_SSH_KEY` incompleta (precisa das linhas `BEGIN`/`END`) ou a pública não foi para o `authorized_keys` |
| `denied` ao baixar a imagem na VM | pacote do GHCR ainda privado — Parte 5.4 |
| Frontend carrega mas a API dá erro de CORS | `CORS_ALLOWED_ORIGINS` diferente da origem real (atenção ao `https://` e à ausência de barra final) |
| F5 em `/trilha` dá 404 | *Build output directory* errado no Pages |
| Login social volta para `localhost` | `OAUTH_FRONTEND_REDIRECT` ainda aponta para a máquina local |

### Repositório privado

Se o repositório for privado, a imagem no GHCR também é. Autorize a VM uma vez:

```bash
# GitHub → Settings → Developer settings → Personal access tokens (classic)
# → escopo: read:packages
echo "SEU_TOKEN" | docker login ghcr.io -u SEU_USUARIO --password-stdin
```

### Diagnóstico rápido na VM

```bash
cd ~/learnway
docker compose ps                    # o que está de pé
docker compose logs --tail 50 api    # erros da aplicação
docker compose logs --tail 30 caddy  # erros de certificado
curl -fsS localhost:8080/actuator/health   # a API responde localmente?
sudo iptables -L INPUT -n | grep -E "80|443"   # o firewall local está aberto?
```
