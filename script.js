// script.js - VERSÃO ATUALIZADA COM NITROFLARE COMPLETO
// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBLPLXCc6JRfP43xDjL2j-GWwtMYLLY3Gk",
  authDomain: "cametaflix-5f7a1.firebaseapp.com",
  projectId: "cametaflix-5f7a1",
  storageBucket: "cametaflix-5f7a1.firebasestorage.app",
  messagingSenderId: "369794733568",
  appId: "1:369794733568:web:641ddcd55a5669a24ceae5"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos da DOM
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const mainScreen = document.getElementById('main-screen');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const adminPanelLink = document.getElementById('admin-panel-link');
const adminPanel = document.getElementById('admin-panel');
const contentGrid = document.getElementById('content-grid');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const videoTitle = document.getElementById('video-title');
const videoDescription = document.getElementById('video-description');
const closeModal = document.querySelector('.close-modal');
const addContentBtn = document.getElementById('add-content-btn');
const addContentForm = document.getElementById('add-content-form');
const contentForm = document.getElementById('content-form');
const viewUsersBtn = document.getElementById('view-users-btn');
const manageContentBtn = document.getElementById('manage-content-btn');
const usersList = document.getElementById('users-list');
const manageContent = document.getElementById('manage-content');
const usersTableBody = document.getElementById('users-table-body');
const contentTableBody = document.getElementById('content-table-body');
const featuredSection = document.getElementById('featured');
const featuredTitle = document.getElementById('featured-title');
const featuredDescription = document.getElementById('featured-description');
const playFeaturedBtn = document.getElementById('play-featured');
const infoFeaturedBtn = document.getElementById('info-featured');
const infoModal = document.getElementById('info-modal');
const closeInfoModal = document.querySelector('.close-info-modal');
const infoTitle = document.getElementById('info-title');
const infoDescription = document.getElementById('info-description');
const infoCategory = document.getElementById('info-category');
const infoDate = document.getElementById('info-date');
const loading = document.getElementById('loading');
const uploadContentBtn = document.getElementById('upload-content-btn');
const uploadSection = document.getElementById('upload-section');
const uploadForm = document.getElementById('upload-form');
const videoFileInput = document.getElementById('video-file');
const fileInfo = document.querySelector('.file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');

// Elementos do Captcha
const captchaModal = document.getElementById('captcha-modal');
const captchaWidget = document.getElementById('captcha-widget');
const submitCaptchaBtn = document.getElementById('submit-captcha');
const cancelCaptchaBtn = document.getElementById('cancel-captcha');
const closeCaptchaModal = document.querySelector('.close-captcha-modal');

// Variáveis globais
let currentUser = null;
let isAdmin = false;
let currentContent = [];
let featuredContent = null;
let allUsers = [];

// Configuração do Nitroflare
const nitroflareConfig = {
    userHash: "97fd8146ef9f8b25a61dc2221eda0155ba3f1935", // ATUALIZE COM SEU HASH
    apiBase: "https://nitroflare.com/api/v2",
    uploadGetServer: "http://nitroflare.com/plugins/fileupload/getServer"
};

// Variáveis para controle do captcha
let currentCaptchaResolver = null;
let currentFileId = null;
let recaptchaWidgetId = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
goToRegister.addEventListener('click', () => switchScreen('register'));
goToLogin.addEventListener('click', () => switchScreen('login'));
logoutBtn.addEventListener('click', handleLogout);
closeModal.addEventListener('click', () => videoModal.classList.add('hidden'));
closeInfoModal.addEventListener('click', () => infoModal.classList.add('hidden'));

// Botões do painel admin
addContentBtn.addEventListener('click', () => toggleAdminSection('add-content'));
uploadContentBtn.addEventListener('click', () => toggleAdminSection('upload'));
viewUsersBtn.addEventListener('click', () => toggleAdminSection('users'));
manageContentBtn.addEventListener('click', () => toggleAdminSection('manage-content'));

// Forms
contentForm.addEventListener('submit', handleAddContent);
uploadForm.addEventListener('submit', handleNitroflareUpload);

// Conteúdo
playFeaturedBtn.addEventListener('click', playFeaturedContent);
infoFeaturedBtn.addEventListener('click', showFeaturedInfo);

// File input
videoFileInput.addEventListener('change', displayFileInfo);

// Captcha
submitCaptchaBtn.addEventListener('click', handleCaptchaSubmit);
cancelCaptchaBtn.addEventListener('click', handleCaptchaCancel);
closeCaptchaModal.addEventListener('click', () => captchaModal.classList.add('hidden'));

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === videoModal) videoModal.classList.add('hidden');
    if (e.target === infoModal) infoModal.classList.add('hidden');
    if (e.target === captchaModal) captchaModal.classList.add('hidden');
});

// Inicialização da aplicação
function initApp() {
    showLoading();
    
    // Observador de estado de autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            userEmail.textContent = user.email;
            
            // Garantir que o usuário existe no Firestore
            ensureUserInFirestore(user.uid)
                .then(() => {
                    checkUserRole(user.uid);
                    switchScreen('main');
                    loadContent();
                    hideLoading();
                })
                .catch(error => {
                    console.error('Erro ao garantir usuário no Firestore:', error);
                    hideLoading();
                });
        } else {
            currentUser = null;
            switchScreen('login');
            hideLoading();
        }
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Configurar navegação
    setupNavigation();
}

// Garantir que usuário existe no Firestore
function ensureUserInFirestore(uid) {
    return db.collection('users').doc(uid).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('📝 Criando documento para usuário faltante:', uid);
                
                const user = auth.currentUser;
                return db.collection('users').get().then(snapshot => {
                    const userRole = snapshot.size === 0 ? 'admin' : 'user';
                    
                    const userData = {
                        email: user.email,
                        role: userRole,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                        autoCreated: true
                    };
                    
                    return db.collection('users').doc(uid).set(userData);
                });
            }
            return doc;
        });
}

// Configurar navegação
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe active de todos os links
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            
            // Adicionar classe active ao link clicado
            this.classList.add('active');
            
            const target = this.id;
            handleNavigation(target);
        });
    });
}

// Funções de autenticação
function handleLogin(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showMessage('Login realizado com sucesso!', 'success');
        })
        .catch(error => {
            hideLoading();
            showMessage('Erro no login: ' + error.message, 'error');
        });
}

function handleRegister(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    console.log('🚀 Iniciando cadastro para:', email);

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            console.log('✅ Usuário criado na Authentication:', user.uid);
            
            // Verificar se é o primeiro usuário
            return db.collection('users').get().then(snapshot => {
                console.log('📊 Total de usuários no Firestore:', snapshot.size);
                
                // Verificar se já existe algum admin
                let hasAdmin = false;
                snapshot.forEach(doc => {
                    if (doc.data().role === 'admin') {
                        hasAdmin = true;
                    }
                });
                
                const userRole = !hasAdmin ? 'admin' : 'user';
                console.log('🎯 Papel atribuído:', userRole);
                
                const userData = {
                    email: user.email,
                    role: userRole,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                console.log('💾 Salvando no Firestore...');
                return db.collection('users').doc(user.uid).set(userData);
            });
        })
        .then(() => {
            console.log('🎉 Cadastro completo! Usuário salvo no Firestore.');
            showMessage('Cadastro realizado com sucesso!', 'success');
            hideLoading();
            
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                switchScreen('login');
            }, 2000);
        })
        .catch(error => {
            console.error('💥 Erro completo no cadastro:', error);
            hideLoading();
            showMessage('Erro no cadastro: ' + error.message, 'error');
        });
}

function handleLogout() {
    showLoading();
    auth.signOut()
        .then(() => {
            showMessage('Logout realizado com sucesso!', 'success');
            hideLoading();
        })
        .catch(error => {
            showMessage('Erro ao fazer logout: ' + error.message, 'error');
            hideLoading();
        });
}

// Verificar papel do usuário
function checkUserRole(uid) {
    console.log('🔍 Verificando papel do usuário:', uid);
    
    db.collection('users').doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                console.log('📄 Dados encontrados:', userData);
                
                isAdmin = userData.role === 'admin';
                console.log('👑 É admin?', isAdmin);
                
                if (isAdmin) {
                    console.log('✅ Mostrando painel admin');
                    adminPanelLink.classList.remove('hidden');
                    showMessage('Você está logado como administrador', 'success');
                } else {
                    console.log('❌ Escondendo painel admin');
                    adminPanelLink.classList.add('hidden');
                    adminPanel.classList.add('hidden');
                    showMessage('Login realizado com sucesso!', 'success');
                }
                
                // Atualizar último login
                db.collection('users').doc(uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        })
        .catch(error => {
            console.error('💥 Erro ao verificar papel:', error);
        });
}

// Alternar entre telas
function switchScreen(screen) {
    loginScreen.classList.remove('active');
    registerScreen.classList.remove('active');
    mainScreen.classList.remove('active');

    if (screen === 'login') {
        loginScreen.classList.add('active');
    } else if (screen === 'register') {
        registerScreen.classList.add('active');
    } else if (screen === 'main') {
        mainScreen.classList.add('active');
    }
}

// Navegação principal
function handleNavigation(target) {
    adminPanel.classList.add('hidden');
    
    switch(target) {
        case 'home-link':
            document.getElementById('section-title').innerHTML = '<i class="fas fa-star"></i> Recomendados para Você';
            loadContent();
            break;
        case 'movies-link':
            document.getElementById('section-title').innerHTML = '<i class="fas fa-film"></i> Filmes';
            filterContentByCategory('filmes');
            break;
        case 'series-link':
            document.getElementById('section-title').innerHTML = '<i class="fas fa-tv"></i> Séries';
            filterContentByCategory('series');
            break;
        case 'admin-panel-link':
            adminPanel.classList.remove('hidden');
            toggleAdminSection('add-content');
            break;
    }
}

// Alternar seções do admin
function toggleAdminSection(section) {
    // Remover active de todos os botões e seções
    document.querySelectorAll('.admin-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
    
    // Adicionar active ao botão clicado
    switch(section) {
        case 'add-content':
            addContentBtn.classList.add('active');
            addContentForm.classList.add('active');
            break;
        case 'upload':
            uploadContentBtn.classList.add('active');
            uploadSection.classList.add('active');
            break;
        case 'users':
            viewUsersBtn.classList.add('active');
            usersList.classList.add('active');
            loadUsers();
            break;
        case 'manage-content':
            manageContentBtn.classList.add('active');
            manageContent.classList.add('active');
            loadContentForManagement();
            break;
    }
}

// Carregar conteúdo
function loadContent() {
    showLoading();
    
    db.collection('content').orderBy('addedAt', 'desc').get()
        .then(querySnapshot => {
            currentContent = [];
            contentGrid.innerHTML = '';
            
            if (querySnapshot.empty) {
                contentGrid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-film"></i>
                        <h3>Nenhum conteúdo disponível</h3>
                        <p>Adicione conteúdo através do painel de administração.</p>
                    </div>
                `;
                hideLoading();
                return;
            }
            
            querySnapshot.forEach(doc => {
                const content = {
                    id: doc.id,
                    ...doc.data()
                };
                currentContent.push(content);
                
                createContentItem(content);
            });
            
            // Definir conteúdo em destaque
            if (currentContent.length > 0) {
                featuredContent = currentContent[0];
                updateFeaturedContent();
            }
            
            hideLoading();
        })
        .catch(error => {
            hideLoading();
            console.error('Erro ao carregar conteúdo:', error);
            showMessage('Erro ao carregar conteúdo: ' + error.message, 'error');
        });
}

// Criar item de conteúdo
function createContentItem(content) {
    const contentItem = document.createElement('div');
    contentItem.className = 'content-item';
    contentItem.innerHTML = `
        <img src="${content.thumbnail}" alt="${content.title}" 
             onerror="this.src='https://via.placeholder.com/300x450/333333/FFFFFF?text=Imagem+Não+Disponível'">
        <div class="content-info">
            <h4>${content.title}</h4>
            <p>${content.description.substring(0, 100)}...</p>
        </div>
    `;
    
    contentItem.addEventListener('click', () => showContentOptions(content));
    contentGrid.appendChild(contentItem);
}

// Mostrar opções do conteúdo
function showContentOptions(content) {
    if (isAdmin) {
        // Para admin, mostrar modal de opções
        showAdminContentOptions(content);
    } else {
        // Para usuário normal, mostrar informações
        showContentInfo(content);
    }
}

// Mostrar informações do conteúdo
function showContentInfo(content) {
    infoTitle.textContent = content.title;
    infoDescription.textContent = content.description;
    infoCategory.textContent = content.category === 'filmes' ? 'Filme' : 'Série';
    infoDate.textContent = content.addedAt ? content.addedAt.toDate().toLocaleDateString('pt-BR') : 'Data não disponível';
    
    infoModal.classList.remove('hidden');
}

// Opções de conteúdo para admin
function showAdminContentOptions(content) {
    const play = confirm(`O que você deseja fazer com "${content.title}"?\n\nClique em OK para assistir ou em Cancelar para ver informações.`);
    
    if (play) {
        playContent(content);
    } else {
        showContentInfo(content);
    }
}

// Atualizar conteúdo em destaque
function updateFeaturedContent() {
    if (featuredContent) {
        featuredTitle.textContent = featuredContent.title;
        featuredDescription.textContent = featuredContent.description;
        featuredSection.style.backgroundImage = `linear-gradient(to top, var(--bg-darker) 0%, transparent 60%), url('${featuredContent.thumbnail}')`;
    }
}

// Reproduzir conteúdo em destaque
function playFeaturedContent() {
    if (featuredContent) {
        playContent(featuredContent);
    } else {
        showMessage('Nenhum conteúdo em destaque disponível', 'warning');
    }
}

// Mostrar informações do destaque
function showFeaturedInfo() {
    if (featuredContent) {
        showContentInfo(featuredContent);
    } else {
        showMessage('Nenhum conteúdo em destaque disponível', 'warning');
    }
}

// FUNÇÕES NITROFLARE - IMPLEMENTAÇÃO COMPLETA

// Verificar se é URL do Nitroflare
// FUNÇÕES NITROFLARE - IMPLEMENTAÇÃO CORRIGIDA

// Verificar se é URL do Nitroflare
function isNitroflareUrl(url) {
    return url && (url.includes('nitroflare.com') || url.includes('nitro.download'));
}

// Extrair File ID da URL do Nitroflare (CORRIGIDO)
function extractFileIdFromUrl(nitroflareUrl) {
    // Suporta ambos os formatos:
    // https://nitroflare.com/view/9F4A88DB647E025/O_Jogo_da_Imitao.mp4
    // https://nitro.download/view/9F4A88DB647E025/O_Jogo_da_Imitao.mp4
    const match = nitroflareUrl.match(/(?:nitroflare\.com|nitro\.download)\/view\/([A-Z0-9]+)/i);
    return match ? match[1] : null;
}

// Função principal para reproduzir conteúdo (CORRIGIDA)
async function playContent(content) {
    showLoading();
    
    try {
        videoTitle.textContent = content.title;
        videoDescription.textContent = content.description;
        
        let videoSource = content.videoUrl;
        
        // Se for URL do Nitroflare, obter link real de download
        if (isNitroflareUrl(content.videoUrl)) {
            showMessage('Obtendo link de download do Nitroflare...', 'info');
            
            const fileId = extractFileIdFromUrl(content.videoUrl);
            if (fileId) {
                console.log('📁 File ID encontrado:', fileId);
                
                // Primeiro verifica informações do arquivo
                const fileInfo = await getNitroflareFileInfo(fileId);
                console.log('📊 Informações do arquivo:', fileInfo);
                
                if (fileInfo.status === 'online') {
                    // Tenta obter link de download
                    videoSource = await getNitroflareDownloadLink(fileId);
                    
                    if (!videoSource) {
                        throw new Error('Não foi possível obter o link de download');
                    }
                    
                    console.log('🔗 Link de download obtido:', videoSource);
                    showMessage('Conteúdo carregado com sucesso!', 'success');
                } else {
                    throw new Error('Arquivo não está disponível online: ' + fileInfo.status);
                }
            } else {
                throw new Error('URL do Nitroflare inválida - não foi possível extrair o File ID');
            }
        }
        
        // Configurar o player
        videoPlayer.src = videoSource;
        videoPlayer.load();
        
        videoModal.classList.remove('hidden');
        
        // Tentar reproduzir automaticamente
        try {
            await videoPlayer.play();
        } catch (autoPlayError) {
            showMessage('Clique no vídeo para iniciar a reprodução.', 'info');
        }
        
    } catch (error) {
        console.error('Erro ao reproduzir vídeo:', error);
        showMessage('Erro: ' + error.message, 'error');
        
        // Fallback: tentar usar a URL original se disponível
        if (content.videoUrl && !isNitroflareUrl(content.videoUrl)) {
            videoPlayer.src = content.videoUrl;
            showMessage('Usando link alternativo...', 'warning');
        } else {
            // Se for Nitroflare e falhou, mostra informações para debug
            showMessage('Erro no Nitroflare. Verifique o console para detalhes.', 'error');
        }
    } finally {
        hideLoading();
    }
}

// API Nitroflare - Obter informações do arquivo (NOVA FUNÇÃO)
async function getNitroflareFileInfo(fileId) {
    try {
        const url = `${nitroflareConfig.apiBase}/getFileInfo?files=${fileId}`;
        console.log('🔍 Consultando informações do arquivo:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.type === 'success' && data.result && data.result[fileId]) {
            return data.result[fileId];
        } else {
            throw new Error(data.message || 'Erro ao obter informações do arquivo');
        }
    } catch (error) {
        console.error('Erro na API getFileInfo:', error);
        throw error;
    }
}

// API Nitroflare - Download Premium (ATUALIZADA)
async function getPremiumDownloadLink(fileId, userEmail = '', premiumKey = '') {
    try {
        const url = `${nitroflareConfig.apiBase}/getDownloadLink?user=${encodeURIComponent(userEmail)}&premiumKey=${encodeURIComponent(premiumKey)}&file=${fileId}`;
        console.log('👑 Tentando download premium:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.type === 'success') {
            console.log('✅ Download premium bem-sucedido:', data.result.url);
            return data.result.url;
        } else {
            console.log('❌ Download premium falhou:', data.message);
            throw new Error(data.message || 'Erro ao obter link premium');
        }
    } catch (error) {
        console.error('Erro no download premium:', error);
        throw error;
    }
}

// API Nitroflare - Download Gratuito (ATUALIZADA)
async function getFreeDownloadLink(fileId) {
    console.log('🆓 Iniciando download gratuito para:', fileId);
    
    try {
        // ETAPA 1: Obter token de download
        const step1Url = `${nitroflareConfig.apiBase}/getDownloadLink?file=${fileId}`;
        console.log('📝 Etapa 1 - Obtendo token:', step1Url);
        
        const step1Response = await fetch(step1Url);
        const step1Data = await step1Response.json();
        
        console.log('📄 Resposta etapa 1:', step1Data);
        
        if (step1Data.type !== 'success') {
            throw new Error('Erro na etapa 1: ' + (step1Data.message || 'Resposta inválida'));
        }
        
        const step1Result = step1Data.result;
        
        // Verificar se precisa de captcha
        if (step1Result.recaptchaPublic) {
            console.log('🤖 Captcha necessário - Public Key:', step1Result.recaptchaPublic);
            return await handleCaptchaDownload(step1Result, fileId);
        } else {
            console.log('🚀 Sem captcha necessário - Processando diretamente');
            return await processStep2Download(step1Result, fileId);
        }
    } catch (error) {
        console.error('Erro no download gratuito:', error);
        throw error;
    }
}

// Função principal para obter link do Nitroflare (ATUALIZADA)
async function getNitroflareDownloadLink(fileId, isPremium = false, userEmail = '', premiumKey = '') {
    try {
        console.log('🎯 Obtendo link para File ID:', fileId);
        
        if (isPremium && userEmail && premiumKey) {
            return await getPremiumDownloadLink(fileId, userEmail, premiumKey);
        } else {
            return await getFreeDownloadLink(fileId);
        }
    } catch (error) {
        console.error('❌ Erro na API Nitroflare:', error);
        throw error;
    }
}

// Processar download com captcha (ATUALIZADA)
async function handleCaptchaDownload(step1Result, fileId) {
    console.log('🔄 Iniciando processo de captcha para:', fileId);
    
    return new Promise(async (resolve, reject) => {
        try {
            currentFileId = fileId;
            showCaptchaModal(step1Result.recaptchaPublic);
            currentCaptchaResolver = { resolve, reject };
        } catch (error) {
            console.error('Erro no handleCaptchaDownload:', error);
            reject(error);
        }
    });
}

// Processar etapa 2 com captcha (ATUALIZADA)
async function processStep2WithCaptcha(step1Result, fileId, captchaResponse) {
    console.log('🔄 Processando etapa 2 com captcha');
    
    const accessParams = parseAccessLink(step1Result.accessLink);
    
    if (!accessParams) {
        throw new Error('Não foi possível processar o link de acesso');
    }
    
    console.log('🔑 Parâmetros de acesso:', accessParams);
    
    // Aguardar delay se necessário
    if (step1Result.delay && step1Result.delay > 0) {
        console.log('⏰ Aguardando delay:', step1Result.delay, 'segundos');
        showMessage(`Aguardando ${step1Result.delay} segundos...`, 'info');
        await new Promise(resolve => setTimeout(resolve, step1Result.delay * 1000));
    }
    
    // Construir URL da etapa 2
    const step2Url = `${nitroflareConfig.apiBase}/getDownloadLink?file=${accessParams.file}&startDownload=${accessParams.startDownload}&hash1=${accessParams.hash1}&hash2=${accessParams.hash2}&captcha=${encodeURIComponent(captchaResponse)}`;
    
    console.log('🔗 Etapa 2 URL:', step2Url);
    
    const step2Response = await fetch(step2Url);
    const step2Data = await step2Response.json();
    
    console.log('📄 Resposta etapa 2:', step2Data);
    
    if (step2Data.type === 'success') {
        console.log('✅ Download gratuito bem-sucedido:', step2Data.result.url);
        return step2Data.result.url;
    } else {
        throw new Error(step2Data.message || 'Erro na etapa 2 do download');
    }
}

// Processar etapa 2 sem captcha (ATUALIZADA)
async function processStep2Download(step1Result, fileId) {
    console.log('🔄 Processando etapa 2 sem captcha');
    
    const accessParams = parseAccessLink(step1Result.accessLink);
    
    if (!accessParams) {
        throw new Error('Não foi possível processar o link de acesso');
    }
    
    console.log('🔑 Parâmetros de acesso:', accessParams);
    
    // Aguardar delay
    if (step1Result.delay && step1Result.delay > 0) {
        console.log('⏰ Aguardando delay:', step1Result.delay, 'segundos');
        await new Promise(resolve => setTimeout(resolve, step1Result.delay * 1000));
    }
    
    const step2Url = `${nitroflareConfig.apiBase}/getDownloadLink?file=${accessParams.file}&startDownload=${accessParams.startDownload}&hash1=${accessParams.hash1}&hash2=${accessParams.hash2}`;
    
    console.log('🔗 Etapa 2 URL:', step2Url);
    
    const step2Response = await fetch(step2Url);
    const step2Data = await step2Response.json();
    
    console.log('📄 Resposta etapa 2:', step2Data);
    
    if (step2Data.type === 'success') {
        console.log('✅ Download direto bem-sucedido:', step2Data.result.url);
        return step2Data.result.url;
    } else {
        throw new Error(step2Data.message || 'Erro na etapa 2 do download');
    }
}

// Parser para extrair parâmetros do accessLink (ATUALIZADA)
function parseAccessLink(accessLink) {
    try {
        console.log('🔍 Parseando accessLink:', accessLink);
        
        // accessLink example: "getDownloadLink?file=000001093E06EF88&startDownload=1522516367&hash1=hash&hash2=hash"
        const paramsString = accessLink.split('?')[1];
        const params = new URLSearchParams(paramsString);
        
        const result = {
            file: params.get('file'),
            startDownload: params.get('startDownload'),
            hash1: params.get('hash1'),
            hash2: params.get('hash2')
        };
        
        console.log('✅ Parâmetros extraídos:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Erro ao parsear accessLink:', error);
        return null;
    }
}

// Adicione também esta função de debug para testar URLs
function testNitroflareUrl(url) {
    console.log('🧪 Testando URL do Nitroflare:', url);
    console.log('🔍 É URL do Nitroflare?', isNitroflareUrl(url));
    console.log('📁 File ID extraído:', extractFileIdFromUrl(url));
}

// Função de teste para desenvolvimento (chame no console)
window.testNitroflare = function(url) {
    testNitroflareUrl(url);
    const fileId = extractFileIdFromUrl(url);
    if (fileId) {
        getNitroflareFileInfo(fileId).then(console.log).catch(console.error);
    }
};

// Adicionar conteúdo (admin)
function handleAddContent(e) {
    e.preventDefault();
    showLoading();
    
    if (!isAdmin) {
        showMessage('Apenas administradores podem adicionar conteúdo.', 'error');
        hideLoading();
        return;
    }
    
    const title = document.getElementById('content-title').value;
    const description = document.getElementById('content-description').value;
    const thumbnail = document.getElementById('content-thumbnail').value;
    const videoUrl = document.getElementById('content-video-url').value;
    const category = document.getElementById('content-category').value;
    
    // Validação básica
    if (!title || !description || !thumbnail || !videoUrl || !category) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        hideLoading();
        return;
    }
    
    const contentData = {
        title,
        description,
        thumbnail,
        videoUrl,
        category,
        addedBy: currentUser.uid,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('content').add(contentData)
    .then(() => {
        showMessage('Conteúdo adicionado com sucesso!', 'success');
        contentForm.reset();
        loadContent();
        hideLoading();
    })
    .catch(error => {
        hideLoading();
        showMessage('Erro ao adicionar conteúdo: ' + error.message, 'error');
    });
}

// Upload para Nitroflare
async function handleNitroflareUpload(e) {
    e.preventDefault();
    
    if (!isAdmin) {
        showMessage('Apenas administradores podem fazer upload.', 'error');
        return;
    }

    const file = videoFileInput.files[0];
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    const thumbnail = document.getElementById('upload-thumbnail').value;
    const category = document.getElementById('upload-category').value;
    
    // Validações
    if (!file) {
        showMessage('Por favor, selecione um arquivo de vídeo.', 'error');
        return;
    }
    
    if (!file.type.startsWith('video/')) {
        showMessage('Por favor, selecione um arquivo de vídeo válido.', 'error');
        return;
    }
    
    if (file.size > 500 * 1024 * 1024) {
        showMessage('Arquivo muito grande. Máximo permitido: 500MB', 'error');
        return;
    }
    
    if (!title || !description || !thumbnail || !category) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    try {
        showLoading();
        await uploadToNitroflare(file, title, description, thumbnail, category);
    } catch (error) {
        hideLoading();
        showMessage('Erro no upload: ' + error.message, 'error');
    }
}

// Função para fazer upload para Nitroflare
async function uploadToNitroflare(file, title, description, thumbnail, category) {
    const uploadProgress = document.querySelector('.upload-progress');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const progressStatus = document.querySelector('.progress-status');
    
    uploadProgress.classList.remove('hidden');
    
    try {
        // ETAPA 1: Obter servidor de upload
        updateProgress(10, 'Conectando ao Nitroflare...', progressFill, progressText, progressStatus);
        
        const serverResponse = await fetch(nitroflareConfig.uploadGetServer);
        const targetUrl = await serverResponse.text();
        
        if (!targetUrl) {
            throw new Error('Não foi possível obter servidor de upload');
        }
        
        // ETAPA 2: Preparar formulário de upload
        updateProgress(30, 'Preparando upload...', progressFill, progressText, progressStatus);
        
        const formData = new FormData();
        formData.append('user', nitroflareConfig.userHash);
        formData.append('files', file);
        
        // ETAPA 3: Fazer upload
        updateProgress(50, 'Enviando arquivo...', progressFill, progressText, progressStatus);
        
        const uploadResponse = await fetch(targetUrl, {
            method: 'POST',
            body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        
        if (!uploadResult || !uploadResult.files || !uploadResult.files[0]) {
            throw new Error('Upload falhou - resposta inválida');
        }
        
        const uploadedFile = uploadResult.files[0];
        const nitroflareUrl = `https://nitroflare.com/view/${uploadedFile.urlCode}/${encodeURIComponent(file.name)}`;
        
        // ETAPA 4: Salvar no Firestore
        updateProgress(90, 'Salvando informações...', progressFill, progressText, progressStatus);
        
        await saveContentToFirestore(title, description, thumbnail, nitroflareUrl, category, 'nitroflare');
        
        updateProgress(100, 'Upload concluído!', progressFill, progressText, progressStatus);
        showMessage('Upload realizado e conteúdo adicionado com sucesso!', 'success');
        
        // Limpar formulário
        uploadForm.reset();
        fileInfo.classList.add('hidden');
        uploadProgress.classList.add('hidden');
        
        // Recarregar conteúdo
        setTimeout(() => {
            loadContent();
            hideLoading();
        }, 1000);
        
    } catch (error) {
        uploadProgress.classList.add('hidden');
        throw error;
    }
}

// Função para salvar conteúdo no Firestore após upload
async function saveContentToFirestore(title, description, thumbnail, videoUrl, category, source = 'manual') {
    const contentData = {
        title,
        description,
        thumbnail,
        videoUrl,
        category,
        source,
        addedBy: currentUser.uid,
        addedAt: firebase.firestore.FieldValue.serverTimestamp(),
        uploadDate: new Date().toISOString()
    };
    
    await db.collection('content').add(contentData);
}

// Atualizar progresso do upload
function updateProgress(percent, status, progressFill, progressText, progressStatus) {
    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '%';
    progressStatus.textContent = status;
}

// Mostrar informações do arquivo
function displayFileInfo() {
    const file = videoFileInput.files[0];
    
    if (file) {
        fileName.textContent = file.name;
        fileSize.textContent = `(${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        fileInfo.classList.remove('hidden');
    } else {
        fileInfo.classList.add('hidden');
    }
}

// Carregar lista de usuários (admin)
function loadUsers() {
    if (!isAdmin) return;
    showLoading();
    
    db.collection('users').orderBy('createdAt', 'desc').get()
        .then(querySnapshot => {
            usersTableBody.innerHTML = '';
            allUsers = [];
            
            if (querySnapshot.empty) {
                usersTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <i class="fas fa-users"></i>
                            <h3>Nenhum usuário cadastrado</h3>
                        </td>
                    </tr>
                `;
                hideLoading();
                return;
            }
            
            querySnapshot.forEach(doc => {
                const user = {
                    id: doc.id,
                    ...doc.data()
                };
                allUsers.push(user);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td>
                        <span class="user-role ${user.role}">${user.role}</span>
                    </td>
                    <td>${user.createdAt ? user.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td class="action-buttons">
                        <button class="btn-secondary btn-small" onclick="editUserRole('${user.id}', '${user.role}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ${user.role !== 'admin' ? `
                            <button class="btn-danger btn-small" onclick="deleteUser('${user.id}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        ` : '<span class="text-secondary">Admin Principal</span>'}
                    </td>
                `;
                
                usersTableBody.appendChild(row);
            });
            hideLoading();
        })
        .catch(error => {
            hideLoading();
            console.error('Erro ao carregar usuários:', error);
            showMessage('Erro ao carregar usuários: ' + error.message, 'error');
        });
}

// Carregar conteúdo para gerenciamento (admin)
function loadContentForManagement() {
    if (!isAdmin) return;
    showLoading();
    
    db.collection('content').orderBy('addedAt', 'desc').get()
        .then(querySnapshot => {
            contentTableBody.innerHTML = '';
            
            if (querySnapshot.empty) {
                contentTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <i class="fas fa-film"></i>
                            <h3>Nenhum conteúdo cadastrado</h3>
                        </td>
                    </tr>
                `;
                hideLoading();
                return;
            }
            
            querySnapshot.forEach(doc => {
                const content = {
                    id: doc.id,
                    ...doc.data()
                };
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${content.title}</td>
                    <td>
                        <span class="content-category ${content.category}">
                            ${content.category === 'filmes' ? 'Filme' : 'Série'}
                        </span>
                    </td>
                    <td>${content.addedAt ? content.addedAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td class="action-buttons">
                        <button class="btn-secondary btn-small" onclick="editContent('${content.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-danger btn-small" onclick="deleteContent('${content.id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </td>
                `;
                
                contentTableBody.appendChild(row);
            });
            hideLoading();
        })
        .catch(error => {
            hideLoading();
            console.error('Erro ao carregar conteúdo:', error);
            showMessage('Erro ao carregar conteúdo: ' + error.message, 'error');
        });
}

// Filtrar conteúdo por categoria
function filterContentByCategory(category) {
    contentGrid.innerHTML = '';
    
    const filteredContent = currentContent.filter(item => item.category === category);
    
    if (filteredContent.length === 0) {
        contentGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-${category === 'filmes' ? 'film' : 'tv'}"></i>
                <h3>Nenhum conteúdo encontrado</h3>
                <p>Não há ${category === 'filmes' ? 'filmes' : 'séries'} disponíveis no momento.</p>
            </div>
        `;
        return;
    }
    
    filteredContent.forEach(content => {
        createContentItem(content);
    });
}

// Funções de administração
function deleteUser(userId) {
    if (!isAdmin) return;
    
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        showLoading();
        
        // Não permitir excluir o próprio usuário admin
        if (userId === currentUser.uid) {
            hideLoading();
            showMessage('Você não pode excluir sua própria conta.', 'error');
            return;
        }
        
        db.collection('users').doc(userId).delete()
            .then(() => {
                showMessage('Usuário excluído com sucesso!', 'success');
                loadUsers();
            })
            .catch(error => {
                hideLoading();
                showMessage('Erro ao excluir usuário: ' + error.message, 'error');
            });
    }
}

function editUserRole(userId, currentRole) {
    if (!isAdmin) return;
    
    const newRole = prompt(`Alterar papel do usuário:\n\nAtual: ${currentRole}\n\nDigite "admin" ou "user":`, currentRole);
    
    if (newRole && (newRole === 'admin' || newRole === 'user')) {
        showLoading();
        
        db.collection('users').doc(userId).update({
            role: newRole
        })
        .then(() => {
            showMessage('Papel do usuário atualizado com sucesso!', 'success');
            loadUsers();
        })
        .catch(error => {
            hideLoading();
            showMessage('Erro ao atualizar papel: ' + error.message, 'error');
        });
    } else if (newRole) {
        showMessage('Papel inválido. Use "admin" ou "user".', 'error');
    }
}

function deleteContent(contentId) {
    if (!isAdmin) return;
    
    if (confirm('Tem certeza que deseja excluir este conteúdo?')) {
        showLoading();
        
        db.collection('content').doc(contentId).delete()
            .then(() => {
                showMessage('Conteúdo excluído com sucesso!', 'success');
                loadContentForManagement();
                loadContent(); // Recarregar conteúdo principal também
            })
            .catch(error => {
                hideLoading();
                showMessage('Erro ao excluir conteúdo: ' + error.message, 'error');
            });
    }
}

function editContent(contentId) {
    const content = currentContent.find(c => c.id === contentId);
    if (content) {
        // Preencher formulário de edição
        document.getElementById('content-title').value = content.title;
        document.getElementById('content-description').value = content.description;
        document.getElementById('content-thumbnail').value = content.thumbnail;
        document.getElementById('content-video-url').value = content.videoUrl;
        document.getElementById('content-category').value = content.category;
        
        // Mudar para a seção de adicionar conteúdo
        toggleAdminSection('add-content');
        
        // Scroll para o formulário
        addContentForm.scrollIntoView({ behavior: 'smooth' });
        
        showMessage('Preencha os campos e clique em "Adicionar Conteúdo" para atualizar. Nota: Em produção, implemente a edição completa.', 'warning');
    }
}

// Mostrar mensagens
function showMessage(message, type) {
    // Remove mensagens anteriores
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message message`;
    messageDiv.innerHTML = `
        <i class="fas fa-${getMessageIcon(type)}"></i>
        ${message}
    `;
    
    // Adiciona a mensagem no topo da tela atual
    const currentScreen = document.querySelector('.screen.active');
    currentScreen.insertBefore(messageDiv, currentScreen.firstChild);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

function getMessageIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'info-circle';
    }
}

// Loading functions
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

// Adicionar estilos para roles e categorias
const style = document.createElement('style');
style.textContent = `
    .user-role {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .user-role.admin {
        background: var(--gradient-primary);
        color: white;
    }
    
    .user-role.user {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
    }
    
    .content-category {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .content-category.filmes {
        background: var(--gradient-primary);
        color: white;
    }
    
    .content-category.series {
        background: var(--gradient-secondary);
        color: white;
    }
`;
document.head.appendChild(style);

// Prevenir envio de formulário com Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const target = e.target;
        if (target.form && target.type !== 'textarea') {
            e.preventDefault();
        }
    }
});

// Event listener para erros de vídeo
videoPlayer.addEventListener('error', function(e) {
    console.error('Erro no player de vídeo:', videoPlayer.error);
    
    switch(videoPlayer.error.code) {
        case videoPlayer.error.MEDIA_ERR_ABORTED:
            showMessage('Reprodução cancelada.', 'warning');
            break;
        case videoPlayer.error.MEDIA_ERR_NETWORK:
            showMessage('Erro de rede. Verifique sua conexão.', 'error');
            break;
        case videoPlayer.error.MEDIA_ERR_DECODE:
            showMessage('Formato de vídeo não suportado.', 'error');
            break;
        case videoPlayer.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            showMessage('Formato de vídeo não suportado pelo navegador.', 'error');
            break;
        default:
            showMessage('Erro ao reproduzir vídeo.', 'error');
    }
});


