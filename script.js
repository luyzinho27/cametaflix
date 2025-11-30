// script.js - VERSÃO CORRIGIDA COM SISTEMA DE PLAYER SIMPLIFICADO
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
const infoSource = document.getElementById('info-source');
const loading = document.getElementById('loading');

// Variáveis globais
let currentUser = null;
let isAdmin = false;
let currentContent = [];
let featuredContent = null;
let allUsers = [];
let currentPlayingContent = null;

// Serviços de hospedagem gratuita suportados
const SUPPORTED_SERVICES = {
  'direct': 'URL Direta',
  'google_drive': 'Google Drive',
  'youtube': 'YouTube', 
  'archive': 'Internet Archive',
  'mega': 'Mega.nz'
};

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
viewUsersBtn.addEventListener('click', () => toggleAdminSection('users'));
manageContentBtn.addEventListener('click', () => toggleAdminSection('manage-content'));

// Forms
contentForm.addEventListener('submit', handleAddContent);

// Conteúdo
playFeaturedBtn.addEventListener('click', playFeaturedContent);
infoFeaturedBtn.addEventListener('click', showFeaturedInfo);

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === videoModal) videoModal.classList.add('hidden');
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// Inicialização da aplicação
function initApp() {
    console.log('🚀 Iniciando aplicação...');
    showLoading();
    
    // Observador de estado de autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            userEmail.textContent = user.email;
            console.log('✅ Usuário logado:', user.email);
            
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
                    showMessage('Erro ao carregar usuário: ' + error.message, 'error');
                });
        } else {
            currentUser = null;
            console.log('❌ Nenhum usuário logado');
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
    
    // Configurar instruções de fonte
    setupSourceInstructions();
}

// Configurar instruções de fonte
function setupSourceInstructions() {
    const sourceTypeSelect = document.getElementById('content-source-type');
    if (sourceTypeSelect) {
        sourceTypeSelect.addEventListener('change', function() {
            showSourceInstructions(this.value);
        });
        // Mostrar instruções iniciais
        showSourceInstructions(sourceTypeSelect.value);
    }
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
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
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
        .then((userCredential) => {
            console.log('✅ Login bem-sucedido:', userCredential.user.email);
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

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            
            // Verificar se é o primeiro usuário
            return db.collection('users').get().then(snapshot => {
                let hasAdmin = false;
                snapshot.forEach(doc => {
                    if (doc.data().role === 'admin') {
                        hasAdmin = true;
                    }
                });
                
                const userRole = !hasAdmin ? 'admin' : 'user';
                
                const userData = {
                    email: user.email,
                    role: userRole,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                return db.collection('users').doc(user.uid).set(userData);
            });
        })
        .then(() => {
            showMessage('Cadastro realizado com sucesso!', 'success');
            hideLoading();
            
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                switchScreen('login');
            }, 2000);
        })
        .catch(error => {
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
    db.collection('users').doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                isAdmin = userData.role === 'admin';
                
                if (isAdmin) {
                    adminPanelLink.classList.remove('hidden');
                } else {
                    adminPanelLink.classList.add('hidden');
                    adminPanel.classList.add('hidden');
                }
                
                // Atualizar último login
                db.collection('users').doc(uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        })
        .catch(error => {
            console.error('Erro ao verificar papel:', error);
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
            <p>${content.description.substring(0, 80)}...</p>
        </div>
    `;
    
    contentItem.addEventListener('click', () => showContentOptions(content));
    contentGrid.appendChild(contentItem);
}

// Mostrar opções do conteúdo
function showContentOptions(content) {
    if (isAdmin) {
        showAdminContentOptions(content);
    } else {
        showContentInfo(content);
    }
}

// Mostrar informações do conteúdo
function showContentInfo(content) {
    infoTitle.textContent = content.title;
    infoDescription.textContent = content.description;
    infoCategory.textContent = content.category === 'filmes' ? 'Filme' : 'Série';
    infoSource.textContent = SUPPORTED_SERVICES[content.sourceType] || content.sourceType;
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

// =============================================
// SISTEMA DE REPRODUÇÃO SIMPLIFICADO - CORRIGIDO
// =============================================

// Função principal para reproduzir conteúdo
function playContent(content) {
    showLoading();
    currentPlayingContent = content;
    
    try {
        videoTitle.textContent = content.title;
        videoDescription.textContent = content.description;
        
        console.log('🎬 Reproduzindo:', content.title);
        console.log('🔗 URL:', content.videoUrl);
        console.log('📋 Tipo:', content.sourceType);
        
        // Limpar o player primeiro
        videoPlayer.innerHTML = '';
        
        // Processar URL baseada no tipo de fonte
        const processedUrl = processVideoUrl(content.videoUrl, content.sourceType);
        
        // Criar player baseado no tipo de fonte
        if (content.sourceType === 'youtube') {
            createYouTubePlayer(processedUrl);
        } else {
            createVideoPlayer(processedUrl, content);
        }
        
        videoModal.classList.remove('hidden');
        showMessage('Carregando vídeo...', 'info');
        
    } catch (error) {
        console.error('Erro ao reproduzir vídeo:', error);
        showMessage('Erro ao carregar o vídeo', 'error');
        createFallbackPlayer(content);
    } finally {
        hideLoading();
    }
}

// Processar URL para diferentes fontes
function processVideoUrl(url, sourceType) {
    console.log(`🔧 Processando ${sourceType}:`, url);
    
    switch(sourceType) {
        case 'google_drive':
            return processGoogleDriveUrl(url);
            
        case 'youtube':
            return processYouTubeUrl(url);
            
        case 'archive':
            return url; // Internet Archive funciona diretamente
            
        case 'mega':
            return url; // Mega precisa de tratamento especial
            
        case 'direct':
            return url; // URLs diretas funcionam como estão
            
        default:
            return url;
    }
}

// Processar Google Drive
function processGoogleDriveUrl(url) {
    // Converter link de visualização para link de download
    if (url.includes('/file/d/')) {
        const fileId = url.split('/file/d/')[1].split('/')[0];
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
}

// Processar YouTube
function processYouTubeUrl(url) {
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('/embed/')[1].split('?')[0];
    }
    
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    
    return url;
}

// Criar player do YouTube
function createYouTubePlayer(url) {
    videoPlayer.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background: #000;">
            <iframe 
                src="${url}"
                width="100%" 
                height="100%" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                style="max-width: 100%; max-height: 100%;">
            </iframe>
        </div>
    `;
}

// Criar player de vídeo padrão
function createVideoPlayer(url, content) {
    videoPlayer.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #000; position: relative;">
            <video 
                id="main-video-player"
                controls 
                controlsList="nodownload"
                style="width: 100%; height: 100%; max-width: 100%; max-height: 100%;"
                onloadeddata="handleVideoLoaded()"
                onerror="handleVideoError()"
                onwaiting="handleVideoWaiting()"
                onplaying="handleVideoPlaying()">
                <source src="${url}" type="video/mp4">
                <source src="${url}" type="video/webm">
                Seu navegador não suporta o elemento de vídeo.
            </video>
            <div id="video-status" style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px;">
                Carregando...
            </div>
            <div id="video-fallback" style="display: none; text-align: center; color: white; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Não foi possível carregar o vídeo</p>
                <button onclick="openInNewTab('${content.videoUrl}')" 
                        style="padding: 10px 20px; background: #008000; border: none; border-radius: 5px; color: white; cursor: pointer; margin-top: 10px;">
                    <i class="fas fa-external-link-alt"></i> Abrir em Nova Aba
                </button>
            </div>
        </div>
    `;
    
    // Tentar carregar o vídeo
    setTimeout(() => {
        const video = document.getElementById('main-video-player');
        if (video) {
            video.load();
            video.play().catch(e => {
                console.log('Autoplay bloqueado:', e);
                updateVideoStatus('Clique para reproduzir');
            });
        }
    }, 500);
}

// Criar fallback quando o vídeo não carrega
function createFallbackPlayer(content) {
    videoPlayer.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #1a1a1a; color: white; text-align: center; padding: 40px;">
            <i class="fas fa-video-slash" style="font-size: 4rem; margin-bottom: 20px; color: #ff3333;"></i>
            <h3 style="margin-bottom: 15px;">Não foi possível carregar o vídeo</h3>
            <p style="margin-bottom: 10px; color: #b3b3b3;">Tente uma das opções abaixo:</p>
            
            <div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap; justify-content: center;">
                <button onclick="openInNewTab('${content.videoUrl}')" 
                        style="padding: 12px 24px; background: #008000; border: none; border-radius: 5px; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-external-link-alt"></i> Abrir Link Original
                </button>
                
                <button onclick="testVideoSource('${content.videoUrl}', '${content.sourceType}')" 
                        style="padding: 12px 24px; background: #000080; border: none; border-radius: 5px; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-video"></i> Testar Fonte
                </button>
                
                <button onclick="copyVideoUrl('${content.videoUrl}')" 
                        style="padding: 12px 24px; background: #555; border: none; border-radius: 5px; color: white; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-copy"></i> Copiar URL
                </button>
            </div>
            
            <div style="margin-top: 25px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 5px; text-align: left; max-width: 500px;">
                <h4 style="margin-bottom: 10px; color: #008000;">Informações do Vídeo:</h4>
                <p><strong>URL:</strong> <span style="color: #b3b3b3; font-size: 12px; word-break: break-all;">${content.videoUrl}</span></p>
                <p><strong>Tipo:</strong> ${SUPPORTED_SERVICES[content.sourceType]}</p>
                <p><strong>Problemas comuns:</strong></p>
                <ul style="text-align: left; color: #b3b3b3; font-size: 12px;">
                    <li>Link não público ou sem permissão de visualização</li>
                    <li>Formato de vídeo não suportado pelo navegador</li>
                    <li>Problemas de CORS no servidor de origem</li>
                </ul>
            </div>
        </div>
    `;
    videoModal.classList.remove('hidden');
}

// Funções de controle de vídeo
function handleVideoLoaded() {
    console.log('✅ Vídeo carregado');
    updateVideoStatus('Pronto para reproduzir');
}

function handleVideoError() {
    console.log('❌ Erro no vídeo');
    updateVideoStatus('Erro ao carregar');
    
    // Mostrar fallback após 2 segundos
    setTimeout(() => {
        const fallback = document.getElementById('video-fallback');
        const video = document.getElementById('main-video-player');
        if (fallback && video) {
            video.style.display = 'none';
            fallback.style.display = 'block';
        }
    }, 2000);
}

function handleVideoWaiting() {
    updateVideoStatus('Buffering...');
}

function handleVideoPlaying() {
    updateVideoStatus('Reproduzindo');
    setTimeout(() => {
        const status = document.getElementById('video-status');
        if (status) status.style.display = 'none';
    }, 3000);
}

function updateVideoStatus(message) {
    const status = document.getElementById('video-status');
    if (status) {
        status.textContent = message;
        status.style.display = 'block';
    }
}

// Funções auxiliares
function openInNewTab(url) {
    window.open(url, '_blank');
}

function testVideoSource(url, sourceType) {
    console.log('🧪 Testando fonte:', url);
    const processedUrl = processVideoUrl(url, sourceType);
    window.open(processedUrl, '_blank');
    showMessage('Abrindo fonte em nova aba para teste...', 'info');
}

function copyVideoUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showMessage('URL copiada para a área de transferência!', 'success');
    }).catch(() => {
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('URL copiada!', 'success');
    });
}

// Mostrar instruções de fonte
function showSourceInstructions(sourceType) {
    const instructions = {
        'google_drive': `
            <div class="source-instructions">
                <h4><i class="fab fa-google-drive"></i> Google Drive:</h4>
                <p><strong>Link correto:</strong> https://drive.google.com/file/d/FILE_ID/view</p>
                <p><strong>Verifique:</strong> Arquivo compartilhado publicamente</p>
            </div>
        `,
        'youtube': `
            <div class="source-instructions">
                <h4><i class="fab fa-youtube"></i> YouTube:</h4>
                <p>Qualquer link do YouTube funciona</p>
                <p><strong>Exemplos:</strong></p>
                <ul>
                    <li>https://www.youtube.com/watch?v=CODIGO</li>
                    <li>https://youtu.be/CODIGO</li>
                </ul>
            </div>
        `,
        'archive': `
            <div class="source-instructions">
                <h4><i class="fas fa-archive"></i> Internet Archive:</h4>
                <p>Cole a URL completa da página do vídeo</p>
                <p><strong>Exemplo:</strong> https://archive.org/details/NOME_DO_VIDEO</p>
            </div>
        `,
        'direct': `
            <div class="source-instructions">
                <h4><i class="fas fa-link"></i> URL Direta:</h4>
                <p>Link direto para arquivo de vídeo (MP4, WebM)</p>
                <p><strong>Exemplo:</strong> https://site.com/video.mp4</p>
            </div>
        `,
        'mega': `
            <div class="source-instructions">
                <h4><i class="fas fa-cloud"></i> Mega.nz:</h4>
                <p>Cole o link de compartilhamento do Mega</p>
                <p><strong>Nota:</strong> Pode requerer confirmação manual</p>
            </div>
        `
    };
    
    // Remover instruções anteriores
    const oldInstructions = document.querySelector('.source-instructions');
    if (oldInstructions) {
        oldInstructions.remove();
    }
    
    // Adicionar novas instruções
    if (instructions[sourceType]) {
        const formContainer = document.querySelector('.form-container');
        const urlHelp = formContainer.querySelector('.url-help');
        if (urlHelp) {
            urlHelp.insertAdjacentHTML('afterend', instructions[sourceType]);
        }
    }
}

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
    const sourceType = document.getElementById('content-source-type').value;
    
    // Validação
    if (!title || !description || !thumbnail || !videoUrl || !category || !sourceType) {
        showMessage('Por favor, preencha todos os campos.', 'error');
        hideLoading();
        return;
    }
    
    // Validar URL da thumbnail
    if (!isValidUrl(thumbnail)) {
        showMessage('URL da thumbnail inválida.', 'error');
        hideLoading();
        return;
    }
    
    // Validar URL do vídeo
    if (!isValidUrl(videoUrl)) {
        showMessage('URL do vídeo inválida.', 'error');
        hideLoading();
        return;
    }
    
    const contentData = {
        title,
        description,
        thumbnail,
        videoUrl,
        category,
        sourceType,
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

// Validar URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
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
                        <td colspan="5" class="empty-state">
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
                    <td>
                        <span class="source-type">${SUPPORTED_SERVICES[content.sourceType] || content.sourceType}</span>
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
                loadContent();
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
        document.getElementById('content-source-type').value = content.sourceType;
        
        // Mudar para a seção de adicionar conteúdo
        toggleAdminSection('add-content');
        
        // Scroll para o formulário
        addContentForm.scrollIntoView({ behavior: 'smooth' });
        
        showMessage('Preencha os campos e clique em "Adicionar Conteúdo" para atualizar.', 'warning');
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

// Adicionar estilos dinâmicos
const style = document.createElement('style');
style.textContent = `
    .text-secondary { color: var(--text-secondary); }
    .source-type { 
        padding: 4px 8px; 
        background: rgba(255,255,255,0.1); 
        border-radius: 4px; 
        font-size: 11px; 
    }
    .source-instructions {
        background: rgba(0, 0, 128, 0.1);
        padding: 15px;
        border-radius: var(--border-radius-sm);
        border-left: 4px solid var(--primary-color);
        margin: 15px 0;
        font-size: 14px;
    }
    .source-instructions h4 {
        color: var(--text-color);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .source-instructions p {
        margin-bottom: 8px;
        color: var(--text-secondary);
    }
    .source-instructions ul {
        padding-left: 20px;
        color: var(--text-secondary);
    }
    .source-instructions li {
        margin-bottom: 5px;
    }
`;
document.head.appendChild(style);
