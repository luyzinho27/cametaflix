# CametaFlix - Plataforma de Streaming

Uma plataforma moderna de streaming integrada com Nitroflare para upload e reprodução de conteúdo.

## 🚀 Funcionalidades

### Para Usuários
- **Cadastro e Login** seguro com Firebase Authentication
- **Navegação** por categorias (Filmes e Séries)
- **Reprodução** de conteúdo diretamente da plataforma
- **Interface** moderna e responsiva

### Para Administradores
- **Upload automático** para Nitroflare
- **Gerenciamento** de usuários e conteúdo
- **Painel administrativo** completo
- **Integração total** com API Nitroflare

## 🔧 Integração Nitroflare

### Upload Automático
- Upload direto de arquivos de vídeo para o Nitroflare
- Progresso em tempo real
- Salva automaticamente no banco de dados

### Reprodução Inteligente
- Detecta automaticamente URLs do Nitroflare
- Obtém links de download reais via API
- Suporte a downloads gratuitos (com captcha) e premium
- Fallback para URLs diretas

### Sistema de Captcha
- Modal integrado para resolução de reCAPTCHA
- Processo automático de download em 2 etapas
- Feedback visual para o usuário

## 🛠 Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Auth, Firestore)
- **Storage**: Nitroflare API
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Roboto)

## 📦 Instalação

1. Clone o repositório
2. Configure o Firebase no `script.js`
3. Atualize o `userHash` do Nitroflare
4. Abra `index.html` em um servidor web

## ⚙ Configuração

### Firebase
Edite as configurações no `script.js`:
```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  // ... outras configurações
};
