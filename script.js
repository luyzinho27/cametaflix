// script.js - VERSÃO COMPLETA CORRIGIDA PARA TODAS AS FONTES
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
// SISTEMA DE PROCESSAMENTO DE URLs - CORRIGIDO
// =============================================

// Processar URL baseada no tipo de fonte
function processVideoUrl(videoUrl, sourceType) {
    console.log(`🔧 Processando ${sourceType}:`, videoUrl);
    
    switch(sourceType) {
        case 'google_drive':
            return processGoogleDriveUrl(videoUrl);
            
        case 'youtube':
            return processYouTubeUrl(videoUrl);
            
        case 'archive':
            return processArchiveUrl(videoUrl);
            
        case 'mega':
            return processMegaUrl(videoUrl);
            
        case 'direct':
            return processDirectUrl(videoUrl);
            
        default:
            return videoUrl;
    }
}

// Processar URL do Google Drive
function processGoogleDriveUrl(url) {
    try {
        // Padrão 1: https://drive.google.com/file/d/FILE_ID/view
        if (url.includes('/file/d/')) {
            const fileId = url.split('/file/d/')[1].split('/')[0];
            const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            console.log('✅ Google Drive - File ID encontrado:', fileId);
            return directUrl;
        }
        
        // Padrão 2: https://drive.google.com/open?id=FILE_ID
        if (url.includes('drive.google.com/open?id=')) {
            const fileId = url.split('id=')[1];
            const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            console.log('✅ Google Drive - File ID encontrado (open):', fileId);
            return directUrl;
        }
        
        // Padrão 3: Já é um link direto
        if (url.includes('uc?export=download')) {
            console.log('✅ Google Drive - Link direto detectado');
            return url;
        }
        
        console.log('❌ Google Drive - URL não reconhecida');
        return url;
        
    } catch (error) {
        console.error('Erro ao processar Google Drive URL:', error);
        return url;
    }
}

// Processar URL do YouTube
function processYouTubeUrl(url) {
    try {
        let videoId = '';
        
        // Padrão 1: https://www.youtube.com/watch?v=VIDEO_ID
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        }
        // Padrão 2: https://youtu.be/VIDEO_ID
        else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        }
        // Padrão 3: https://www.youtube.com/embed/VIDEO_ID
        else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('/embed/')[1].split('?')[0];
        }
        // Padrão 4: https://www.youtube.com/v/VIDEO_ID
        else if (url.includes('youtube.com/v/')) {
            videoId = url.split('/v/')[1].split('?')[0];
        }
        
        if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
            console.log('✅ YouTube - Video ID encontrado:', videoId);
            return embedUrl;
        }
        
        console.log('❌ YouTube - URL não reconhecida');
        return url;
        
    } catch (error) {
        console.error('Erro ao processar YouTube URL:', error);
        return url;
    }
}

// Processar URL do Internet Archive
function processArchiveUrl(url) {
    try {
        // URLs do Internet Archive geralmente funcionam diretamente
        // Mas podemos melhorar para links específicos
        
        // Se for uma página de detalhes, tentar encontrar o link direto do vídeo
        if (url.includes('/details/') && !url.includes('/format:')) {
            // Adicionar parâmetro para formato de vídeo
            if (!url.includes('?output=format')) {
                url += '?output=format';
            }
        }
        
        console.log('✅ Internet Archive - URL processada');
        return url;
        
    } catch (error) {
        console.error('Erro ao processar Archive URL:', error);
        return url;
    }
}

// Processar URL do Mega.nz
function processMegaUrl(url) {
    try {
        // Para Mega.nz, precisamos usar um proxy ou conversor
        if (url.includes('mega.nz/') || url.includes('mega.co.nz/')) {
            // Extrair o file ID do Mega
            const megaMatch = url.match(/mega\.nz\/(file|folder)\/([^#]+)#?([^#]*)/);
            if (megaMatch) {
                const fileId = megaMatch[2];
                console.log('✅ Mega.nz - File ID encontrado:', fileId);
                
                // Usar serviço público para converter
                // IMPORTANTE: Em produção, implemente seu próprio backend para isso
                const convertedUrl = `https://megaserver.com/converter?url=${encodeURIComponent(url)}`;
                showMessage('Mega.nz: Processando link...', 'info');
                return convertedUrl;
            }
        }
        
        console.log('❌ Mega.nz - URL não reconhecida');
        return url;
        
    } catch (error) {
        console.error('Erro ao processar Mega.nz URL:', error);
        return url;
    }
}

// Processar URL Direta
function processDirectUrl(url) {
    try {
        // Para URLs diretas, verificar se é um arquivo de vídeo
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m3u8'];
        const isVideoFile = videoExtensions.some(ext => url.toLowerCase().includes(ext));
        
        if (isVideoFile) {
            console.log('✅ URL Direta - Arquivo de vídeo detectado');
            return url;
        } else {
            console.log('⚠️ URL Direta - Pode não ser um arquivo de vídeo');
            showMessage('Verifique se a URL aponta para um arquivo de vídeo válido', 'warning');
            return url;
        }
        
    } catch (error) {
        console.error('Erro ao processar URL direta:', error);
        return url;
    }
}

// Função principal para reproduzir conteúdo - VERSÃO CORRIGIDA
function playContent(content) {
    showLoading();
    currentPlayingContent = content;
    
    try {
        videoTitle.textContent = content.title;
        videoDescription.textContent = content.description;
        
        // Processar URL baseada no tipo de fonte
        const processedUrl = processVideoUrl(content.videoUrl, content.sourceType);
        
        console.log('🎬 Reproduzindo:', content.title);
        console.log('🔗 URL original:', content.videoUrl);
        console.log('🔗 URL processada:', processedUrl);
        console.log('📋 Tipo de fonte:', content.sourceType);
        
        // Limpar o player primeiro
        videoPlayer.innerHTML = '';
        
        // Configurar o player baseado no tipo de conteúdo
        if (content.sourceType === 'youtube') {
            // Para YouTube, usar iframe
            setupYouTubePlayer(processedUrl, content);
        } else if (content.sourceType === 'archive') {
            // Para Internet Archive, tentar diferentes métodos
            setupArchivePlayer(processedUrl, content);
        } else {
            // Para outros tipos, usar elemento video normal
            setupVideoPlayer(processedUrl, content);
        }
        
        videoModal.classList.remove('hidden');
        showMessage('Conteúdo carregado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao reproduzir vídeo:', error);
        showMessage('Erro ao carregar o vídeo: ' + error.message, 'error');
        setupFallbackPlayer(content);
    } finally {
        hideLoading();
    }
}

// Configurar player do YouTube
function setupYouTubePlayer(url, content) {
    videoPlayer.innerHTML = `
        <iframe 
            src="${url}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
            style="width: 100%; height: 100%;">
        </iframe>
    `;
}

// Configurar player do Internet Archive
function setupArchivePlayer(url, content) {
    // Tentar primeiro com iframe
    videoPlayer.innerHTML = `
        <iframe 
            src="${url}" 
            frameborder="0" 
            allowfullscreen
            style="width: 100%; height: 100%;">
            Seu navegador não suporta iframes. 
            <a href="${content.videoUrl}" target="_blank">Abrir no Internet Archive</a>
        </iframe>
    `;
    
    // Fallback após 3 segundos se não carregar
    setTimeout(() => {
        const iframe = videoPlayer.querySelector('iframe');
        if (iframe && !iframe.contentWindow) {
            setupVideoPlayer(url, content);
        }
    }, 3000);
}

// Configurar player de vídeo padrão
function setupVideoPlayer(url, content) {
    videoPlayer.innerHTML = `
        <video 
            controls 
            controlsList="nodownload"
            style="width: 100%; height: 100%;"
            onerror="handleVideoError(this)"
            onloadstart="handleVideoLoadStart(this)"
            oncanplay="handleVideoCanPlay(this)">
            <source src="${url}" type="video/mp4">
            <source src="${url}" type="video/webm">
            <source src="${url}" type="video/ogg">
            Seu navegador não suporta o elemento de vídeo.
            <br>
            <a href="${content.videoUrl}" target="_blank" style="color: #008000;">
                Tentar abrir link diretamente
            </a>
        </video>
    `;
    
    // Tentar reproduzir automaticamente após um delay
    setTimeout(() => {
        const videoElement = videoPlayer.querySelector('video');
        if (videoElement) {
            videoElement.play().catch(e => {
                console.log('Reprodução automática bloqueada:', e);
                showMessage('Clique no vídeo para iniciar a reprodução', 'info');
            });
        }
    }, 1000);
}

// Configurar fallback quando tudo falhar
function setupFallbackPlayer(content) {
    videoPlayer.innerHTML = `
        <div style="padding: 40px; text-align: center; color: white; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; color: #ffa500;"></i>
            <h3>Não foi possível carregar o vídeo</h3>
            <p>O player não conseguiu reproduzir este conteúdo automaticamente.</p>
            <div style="margin-top: 20px;">
                <button onclick="openLinkInNewTab('${content.videoUrl}')" 
                        style="padding: 12px 24px; background: var(--gradient-primary); border: none; border-radius: 5px; color: white; cursor: pointer; margin: 5px;">
                    <i class="fas fa-external-link-alt"></i> Abrir em Nova Aba
                </button>
                <button onclick="testVideoUrl('${content.videoUrl}', '${content.sourceType}')" 
                        style="padding: 12px 24px; background: var(--gradient-secondary); border: none; border-radius: 5px; color: white; cursor: pointer; margin: 5px;">
                    <i class="fas fa-video"></i> Testar URL
                </button>
            </div>
            <div style="margin-top: 15px; font-size: 0.9rem; color: #b3b3b3;">
                <p><strong>URL:</strong> ${content.videoUrl}</p>
                <p><strong>Tipo:</strong> ${SUPPORTED_SERVICES[content.sourceType]}</p>
            </div>
        </div>
    `;
    videoModal.classList.remove('hidden');
}

// Manipular eventos de vídeo
function handleVideoError(videoElement) {
    console.error('❌ Erro no elemento de vídeo:', videoElement.error);
    showMessage('Erro ao carregar o vídeo. Tentando método alternativo...', 'error');
    setupFallbackPlayer(currentPlayingContent);
}

function handleVideoLoadStart(videoElement) {
    console.log('📥 Vídeo começando a carregar...');
    showMessage('Carregando vídeo...', 'info');
}

function handleVideoCanPlay(videoElement) {
    console.log('✅ Vídeo pronto para reprodução');
    showMessage('Vídeo carregado com sucesso!', 'success');
}

// Funções auxiliares
function openLinkInNewTab(url) {
    window.open(url, '_blank');
}

function testVideoUrl(url, sourceType) {
    console.log('🧪 Testando URL:', url);
    console.log('📋 Tipo:', sourceType);
    
    const processedUrl = processVideoUrl(url, sourceType);
    console.log('🔗 URL processada:', processedUrl);
    
    showMessage('Testando URL em nova aba...', 'info');
    window.open(processedUrl, '_blank');
}

// Mostrar instruções de fonte
function showSourceInstructions(sourceType) {
    const instructions = {
        'google_drive': `
            <div class="source-instructions">
                <h4><i class="fab fa-google-drive"></i> Instruções do Google Drive:</h4>
                <ol>
                    <li>Faça upload do vídeo para o Google Drive</li>
                    <li>Clique com botão direito → "Compartilhar"</li>
                    <li>Selecione "Qualquer pessoa com o link pode ver"</li>
                    <li>Cole o link completo (ex: https://drive.google.com/file/d/SEU_FILE_ID/view)</li>
                    <li><strong>Dica:</strong> Funciona melhor com arquivos MP4</li>
                </ol>
            </div>
        `,
        'mega': `
            <div class="source-instructions">
                <h4><i class="fas fa-cloud"></i> Instruções do Mega.nz:</h4>
                <ol>
                    <li>Faça upload para o Mega.nz</li>
                    <li>Clique em "Compartilhar" e copie o link</li>
                    <li>Cole o link completo do Mega</li>
                    <li><strong>Nota:</strong> Links do Mega podem requerer confirmação manual</li>
                </ol>
            </div>
        `,
        'youtube': `
            <div class="source-instructions">
                <h4><i class="fab fa-youtube"></i> Instruções do YouTube:</h4>
                <ol>
                    <li>Use o link completo do vídeo do YouTube</li>
                    <li>Funciona com vídeos públicos e não-listados</li>
                    <li>Formatos suportados:
                        <ul>
                            <li>https://www.youtube.com/watch?v=CODIGO</li>
                            <li>https://youtu.be/CODIGO</li>
                            <li>https://www.youtube.com/embed/CODIGO</li>
                        </ul>
                    </li>
                </ol>
            </div>
        `,
        'archive': `
            <div class="source-instructions">
                <h4><i class="fas fa-archive"></i> Instruções do Internet Archive:</h4>
                <ol>
                    <li>Encontre o vídeo no archive.org</li>
                    <li>Copie a URL da página do vídeo</li>
                    <li>Cole o link completo</li>
                    <li><strong>Exemplo:</strong> https://archive.org/details/NOME_DO_VIDEO</li>
                </ol>
            </div>
        `,
        'direct': `
            <div class="source-instructions">
                <h4><i class="fas fa-link"></i> Instruções para URL Direta:</h4>
                <ol>
                    <li>Use links diretos para arquivos de vídeo</li>
                    <li>O arquivo deve estar publicamente acessível</li>
                    <li>Formatos suportados: MP4, WebM, OGG</li>
                    <li><strong>Exemplo:</strong> https://exemplo.com/video.mp4</li>
                    <li><strong>Importante:</strong> O servidor deve permitir CORS</li>
                </ol>
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
    .source-instructions ol {
        padding-left: 20px;
        color: var(--text-secondary);
    }
    .source-instructions li {
        margin-bottom: 5px;
        line-height: 1.4;
    }
    .source-instructions ul {
        padding-left: 20px;
        margin-top: 5px;
    }
    .source-instructions strong {
        color: var(--text-color);
    }
`;
document.head.appendChild(style);
