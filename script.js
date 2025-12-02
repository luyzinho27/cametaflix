// script.js - VERSÃO COMPLETA COM PLAYER UNIFICADO NETFLIX-STYLE
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

// Elementos da DOM - PLAYER UNIFICADO
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

// Elementos do player unificado
const netflixPlayer = document.getElementById('netflix-player');
const unifiedVideoPlayer = document.getElementById('unified-video-player');
const playerControls = document.getElementById('player-controls');
const playPauseBtn = document.getElementById('play-pause-btn');
const muteBtn = document.getElementById('mute-btn');
const progressBar = document.getElementById('progress-bar');
const timeDisplay = document.getElementById('time-display');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// Variáveis globais
let currentUser = null;
let isAdmin = false;
let currentContent = [];
let featuredContent = null;
let allUsers = [];
let currentPlayingContent = null;
let isPlaying = false;
let isMuted = false;
let playerInitialized = false;

// Serviços de hospedagem gratuita suportados
const SUPPORTED_SERVICES = {
  'direct': 'URL Direta',
  'google_drive': 'Google Drive',
  'youtube': 'YouTube', 
  'archive': 'Internet Archive',
  'mega': 'Mega.nz'
};

// =============================================
// INICIALIZAÇÃO E EVENT LISTENERS
// =============================================

document.addEventListener('DOMContentLoaded', initApp);
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
goToRegister.addEventListener('click', () => switchScreen('register'));
goToLogin.addEventListener('click', () => switchScreen('login'));
logoutBtn.addEventListener('click', handleLogout);
closeModal.addEventListener('click', closeVideoPlayer);
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
    if (e.target === videoModal) closeVideoPlayer();
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// Inicializar controles do player quando disponíveis
function initPlayerControls() {
    if (!playerInitialized && unifiedVideoPlayer) {
        // Event listeners para o player unificado
        unifiedVideoPlayer.addEventListener('timeupdate', updateProgress);
        unifiedVideoPlayer.addEventListener('loadedmetadata', updateTimeDisplay);
        unifiedVideoPlayer.addEventListener('play', () => {
            isPlaying = true;
            updatePlayPauseButton();
        });
        unifiedVideoPlayer.addEventListener('pause', () => {
            isPlaying = false;
            updatePlayPauseButton();
        });
        unifiedVideoPlayer.addEventListener('volumechange', updateMuteButton);
        
        // Event listeners para os botões de controle
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', togglePlayPause);
        }
        if (muteBtn) {
            muteBtn.addEventListener('click', toggleMute);
        }
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
        }
        
        // Event listener para a barra de progresso
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                if (unifiedVideoPlayer.duration) {
                    unifiedVideoPlayer.currentTime = percent * unifiedVideoPlayer.duration;
                }
            });
        }
        
        playerInitialized = true;
        console.log('✅ Controles do player inicializados');
    }
}

// =============================================
// SISTEMA DE PLAYER UNIFICADO NETFLIX-STYLE
// =============================================

// Função principal para reproduzir conteúdo
function playContent(content) {
    console.log('🎬 PLAY CONTENT CHAMADO:', content);
    currentPlayingContent = content;
    
    // Atualizar informações do modal
    videoTitle.textContent = content.title;
    videoDescription.textContent = content.description;
    
    // Mostrar modal primeiro
    videoModal.classList.remove('hidden');
    
    // Resetar player
    resetPlayer();
    
    // Aguardar um pouco para o modal renderizar e inicializar controles
    setTimeout(() => {
        initPlayerControls();
        loadVideoContent(content);
    }, 100);
}

// Resetar player para estado inicial
function resetPlayer() {
    if (unifiedVideoPlayer) {
        unifiedVideoPlayer.pause();
        unifiedVideoPlayer.src = '';
        unifiedVideoPlayer.load();
        isPlaying = false;
        updatePlayPauseButton();
        if (progressBar) progressBar.style.width = '0%';
        if (timeDisplay) timeDisplay.textContent = '0:00 / 0:00';
    }
    
    // Esconder player unificado e mostrar placeholder
    if (netflixPlayer) netflixPlayer.style.display = 'none';
    if (playerControls) playerControls.style.display = 'none';
    
    const placeholder = document.getElementById('video-placeholder');
    if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
            <div class="loading-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #e50914; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <h3>Preparando player...</h3>
            <p style="color: #ccc;">Por favor aguarde...</p>
        `;
    }
}

// Carregar conteúdo no player unificado
function loadVideoContent(content) {
    const placeholder = document.getElementById('video-placeholder');
    
    console.log('📦 Carregando conteúdo:', content.sourceType);
    console.log('🔗 URL:', content.videoUrl);
    
    // Mostrar que está processando
    if (placeholder) {
        placeholder.innerHTML = `
            <div class="loading-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #e50914; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px;"></div>
            <h3>Processando ${content.sourceType}...</h3>
            <p style="color: #ccc;">Por favor aguarde...</p>
        `;
    }

    // Processar baseado no tipo
    switch(content.sourceType) {
        case 'youtube':
            processYouTube(content.videoUrl);
            break;
        case 'google_drive':
            processGoogleDrive(content.videoUrl);
            break;
        case 'direct':
            processDirectVideo(content.videoUrl);
            break;
        case 'archive':
            processArchive(content.videoUrl);
            break;
        case 'mega':
            // SEMPRE usar o player experimental para Mega.nz
            processMega(content.videoUrl);
            break;
        default:
            processDirectVideo(content.videoUrl);
    }
}

// Processar YouTube - Converter para URL direta via proxy
function processYouTube(url) {
    console.log('🔧 Processando YouTube...');
    
    const videoId = getYouTubeId(url);
    if (!videoId) {
        showError('ID do YouTube não encontrado', url, 'YouTube');
        return;
    }
    
    // Tentar usar serviço de proxy CORS para obter stream direto
    const proxyUrl = `https://cors-anywhere.herokuapp.com/https://www.youtube.com/watch?v=${videoId}`;
    
    // URL alternativa de stream (pode não funcionar para todos os vídeos)
    const streamUrl = `https://yewtu.be/latest_version?id=${videoId}&itag=22`;
    
    unifiedVideoPlayer.src = streamUrl;
    unifiedVideoPlayer.load();
    
    unifiedVideoPlayer.oncanplay = () => {
        showPlayer();
        unifiedVideoPlayer.play().catch(e => {
            console.log('⚠️ Autoplay bloqueado, mas vídeo carregado');
            showPlayer();
        });
    };
    
    unifiedVideoPlayer.onerror = () => {
        // Fallback para iframe se stream direto falhar
        fallbackToIframe(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=0`);
    };
}

// Processar Google Drive - Tentar obter link direto
function processGoogleDrive(url) {
    console.log('🔧 Processando Google Drive...');
    
    const fileId = getGoogleDriveId(url);
    if (!fileId) {
        showError('ID do Google Drive não encontrado', url, 'Google Drive');
        return;
    }
    
    // URL direta para download (pode funcionar para alguns vídeos)
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    unifiedVideoPlayer.src = directUrl;
    unifiedVideoPlayer.load();
    
    unifiedVideoPlayer.oncanplay = () => {
        showPlayer();
        unifiedVideoPlayer.play().catch(e => {
            console.log('⚠️ Autoplay bloqueado');
            showPlayer();
        });
    };
    
    unifiedVideoPlayer.onerror = () => {
        // Fallback para iframe de preview
        fallbackToIframe(`https://drive.google.com/file/d/${fileId}/preview`);
    };
}

// Processar vídeo direto
function processDirectVideo(url) {
    console.log('🔧 Processando vídeo direto...');
    
    unifiedVideoPlayer.src = url;
    unifiedVideoPlayer.load();
    
    unifiedVideoPlayer.oncanplay = () => {
        showPlayer();
        unifiedVideoPlayer.play().catch(e => {
            console.log('⚠️ Autoplay bloqueado');
            showPlayer();
        });
    };
    
    unifiedVideoPlayer.onerror = () => {
        showError('Vídeo direto não pôde ser carregado', url, 'Vídeo Direto');
    };
}

// Processar Mega.nz - SEMPRE USAR PLAYER EXPERIMENTAL POR PADRÃO
function processMega(url) {
    console.log('🔧 Processando Mega.nz...');
    
    const megaInfo = extractMegaInfo(url);
    
    if (!megaInfo) {
        showError('Link do Mega.nz inválido', url, 'Mega.nz');
        return;
    }
    
    // SEMPRE usar o embed experimental por padrão
    const embedUrl = `https://mega.nz/embed/${megaInfo.fileId}${megaInfo.key ? `#${megaInfo.key}` : ''}`;
    
    // Esconder player unificado e usar iframe do Mega
    if (netflixPlayer) netflixPlayer.style.display = 'none';
    if (playerControls) playerControls.style.display = 'none';
    
    const videoContainer = document.getElementById('video-container');
    const placeholder = document.getElementById('video-placeholder');
    
    if (videoContainer) {
        videoContainer.innerHTML = `
            <iframe 
                id="mega-iframe"
                src="${embedUrl}"
                width="100%" 
                height="100%" 
                frameborder="0" 
                allowfullscreen
                style="border: none; position: absolute; top: 0; left: 0;"
                onload="console.log('✅ Mega.nz embed carregado')">
            </iframe>
        `;
    }
    
    if (placeholder) placeholder.style.display = 'none';
}

// Processar Archive.org
function processArchive(url) {
    console.log('🔧 Processando Internet Archive...');
    
    // Tentar encontrar link de vídeo direto na página do Archive
    if (url.includes('archive.org/details/')) {
        const videoId = url.split('/details/')[1].split('/')[0];
        const directUrl = `https://archive.org/download/${videoId}/${videoId}.mp4`;
        
        unifiedVideoPlayer.src = directUrl;
        unifiedVideoPlayer.load();
        
        unifiedVideoPlayer.oncanplay = () => {
            showPlayer();
            unifiedVideoPlayer.play().catch(e => {
                console.log('⚠️ Autoplay bloqueado');
                showPlayer();
            });
        };
        
        unifiedVideoPlayer.onerror = () => {
            // Fallback para página original
            fallbackToIframe(url);
        };
    } else {
        fallbackToIframe(url);
    }
}

// Fallback para iframe (quando stream direto não funciona)
function fallbackToIframe(embedUrl) {
    console.log('🔄 Usando fallback iframe:', embedUrl);
    
    // Esconder player unificado
    if (netflixPlayer) netflixPlayer.style.display = 'none';
    if (playerControls) playerControls.style.display = 'none';
    
    const videoContainer = document.getElementById('video-container');
    const placeholder = document.getElementById('video-placeholder');
    
    if (videoContainer) {
        videoContainer.innerHTML = `
            <iframe 
                src="${embedUrl}"
                width="100%" 
                height="100%" 
                frameborder="0" 
                allowfullscreen
                style="border: none; position: absolute; top: 0; left: 0;"
                onload="if(placeholder) placeholder.style.display='none';">
            </iframe>
        `;
    }
    
    if (placeholder) placeholder.style.display = 'none';
}

// Mostrar player unificado
function showPlayer() {
    const placeholder = document.getElementById('video-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    if (netflixPlayer) netflixPlayer.style.display = 'block';
    if (playerControls) playerControls.style.display = 'block';
    updatePlayPauseButton();
}

// =============================================
// CONTROLES DO PLAYER UNIFICADO
// =============================================

function togglePlayPause() {
    if (unifiedVideoPlayer && unifiedVideoPlayer.src) {
        if (isPlaying) {
            unifiedVideoPlayer.pause();
        } else {
            unifiedVideoPlayer.play().catch(e => {
                console.log('Erro ao reproduzir:', e);
            });
        }
        isPlaying = !isPlaying;
        updatePlayPauseButton();
    }
}

function updatePlayPauseButton() {
    if (playPauseBtn) {
        const icon = playPauseBtn.querySelector('i');
        if (icon) {
            icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
        }
    }
}

function toggleMute() {
    if (unifiedVideoPlayer && unifiedVideoPlayer.src) {
        isMuted = !isMuted;
        unifiedVideoPlayer.muted = isMuted;
        updateMuteButton();
    }
}

function updateMuteButton() {
    if (muteBtn) {
        const icon = muteBtn.querySelector('i');
        if (icon) {
            icon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        }
    }
}

function toggleFullscreen() {
    const videoContainer = document.getElementById('video-container');
    if (videoContainer) {
        if (!document.fullscreenElement) {
            if (videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen();
            } else if (videoContainer.webkitRequestFullscreen) {
                videoContainer.webkitRequestFullscreen();
            } else if (videoContainer.msRequestFullscreen) {
                videoContainer.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
}

function updateProgress() {
    if (unifiedVideoPlayer && unifiedVideoPlayer.src && unifiedVideoPlayer.duration && progressBar) {
        const progress = (unifiedVideoPlayer.currentTime / unifiedVideoPlayer.duration) * 100;
        progressBar.style.width = `${progress}%`;
        updateTimeDisplay();
    }
}

function updateTimeDisplay() {
    if (unifiedVideoPlayer && unifiedVideoPlayer.src && unifiedVideoPlayer.duration && timeDisplay) {
        const currentTime = formatTime(unifiedVideoPlayer.currentTime);
        const totalTime = formatTime(unifiedVideoPlayer.duration);
        timeDisplay.textContent = `${currentTime} / ${totalTime}`;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// =============================================
// SISTEMA DE THUMBNAILS (SEM BADGES PARA USUÁRIOS COMUNS)
// =============================================

function processThumbnailUrl(url, sourceType) {
    console.log('🖼️ Processando thumbnail:', url, sourceType);
    
    // Se já for uma URL direta de imagem, retorna como está
    if (isDirectImageUrl(url)) {
        return url;
    }
    
    // Processar baseado no tipo de fonte
    switch(sourceType) {
        case 'google_drive':
            return processGoogleDriveThumbnail(url);
        case 'mega':
            return processMegaThumbnail(url);
        default:
            return url;
    }
}

function isDirectImageUrl(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
}

function processGoogleDriveThumbnail(url) {
    const fileId = getGoogleDriveId(url);
    if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`;
    }
    return url;
}

function processMegaThumbnail(url) {
    return 'https://via.placeholder.com/300x450/1a1a2a/FFFFFF?text=MEGA+VIDEO';
}

function getSourceIcon(sourceType) {
    const icons = {
        'youtube': 'youtube',
        'google_drive': 'google-drive',
        'mega': 'cloud',
        'direct': 'link',
        'archive': 'archive'
    };
    return icons[sourceType] || 'video';
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

function getYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function getGoogleDriveId(url) {
    const regex = /\/d\/([^\/]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function extractMegaInfo(url) {
    try {
        console.log('🔍 Analisando URL do Mega:', url);
        
        const patterns = [
            /mega\.nz\/(file|folder)\/([^#]+)#([^#\s]+)/,
            /mega\.nz\/(file|folder)\/([^#\s?]+)/,
            /mega\.nz\/(file|folder)\/([^#\s?]+)\?/
        ];
        
        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const type = match[1];
                const fileId = match[2];
                const key = match[3] || null;
                
                console.log('✅ Mega.nz detectado:', { type, fileId, key });
                
                return {
                    type: type,
                    fileId: fileId,
                    key: key,
                    filename: extractFilenameFromUrl(url),
                    fileType: 'Vídeo',
                    directUrl: `https://mega.nz/${type}/${fileId}${key ? `#${key}` : ''}`
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao extrair info do Mega:', error);
        return null;
    }
}

function extractFilenameFromUrl(url) {
    try {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        const cleanName = lastPart.split('?')[0].split('#')[0];
        return cleanName.length > 30 ? cleanName.substring(0, 30) + '...' : cleanName;
    } catch (error) {
        return 'Arquivo do Mega.nz';
    }
}

function showError(message, url, sourceType) {
    console.log('❌ ERRO:', message);
    
    const videoContainer = document.getElementById('video-container');
    const placeholder = document.getElementById('video-placeholder');
    
    const errorHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; padding: 30px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #ff6b6b; margin-bottom: 20px;"></i>
            <h2 style="color: #ff6b6b; margin-bottom: 15px;">Erro ao Carregar</h2>
            <p style="font-size: 1.2rem; margin-bottom: 10px;">${message}</p>
            <p style="color: #ccc; margin-bottom: 5px;"><strong>Tipo:</strong> ${sourceType}</p>
            <p style="color: #999; font-size: 0.9rem; word-break: break-all; max-width: 600px; margin-bottom: 30px;">
                <strong>URL:</strong> ${url}
            </p>
            
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                <button onclick="openLinkDirectly('${url}')" 
                        style="padding: 15px 25px; background: #4CAF50; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-external-link-alt"></i> Abrir Link Original
                </button>
                
                <button onclick="testInNewTab('${url}')" 
                        style="padding: 15px 25px; background: #2196F3; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-video"></i> Testar em Nova Aba
                </button>
            </div>
        </div>
    `;
    
    if (placeholder) {
        placeholder.innerHTML = errorHTML;
    } else if (videoContainer) {
        videoContainer.innerHTML = errorHTML;
    }
}

// =============================================
// SISTEMA PRINCIPAL DA APLICAÇÃO
// =============================================

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
    
    // Inicializar controles do player
    setTimeout(initPlayerControls, 1000);
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
                
                // Adicionar/remover classe no body para controlar visibilidade dos badges
                if (isAdmin) {
                    document.body.classList.add('admin-logged-in');
                    adminPanelLink.classList.remove('hidden');
                } else {
                    document.body.classList.remove('admin-logged-in');
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

// Criar item de conteúdo (SEM BADGES PARA USUÁRIOS COMUNS)
function createContentItem(content) {
    const contentItem = document.createElement('div');
    contentItem.className = 'content-item';
    
    // Processar thumbnail baseado na fonte do conteúdo
    const processedThumbnail = processThumbnailUrl(content.thumbnail, content.sourceType);
    
    // SOMENTE ADMIN vê o badge de fonte
    const sourceBadge = isAdmin ? `
        <div class="content-source-badge">
            <i class="fas fa-${getSourceIcon(content.sourceType)}"></i>
            ${SUPPORTED_SERVICES[content.sourceType] || content.sourceType}
        </div>
    ` : '';
    
    contentItem.innerHTML = `
        <img src="${processedThumbnail}" alt="${content.title}" 
             onerror="this.src='https://via.placeholder.com/300x450/333333/FFFFFF?text=Imagem+Não+Disponível'">
        <div class="content-info">
            <h4>${content.title}</h4>
            <p>${content.description.substring(0, 80)}...</p>
            ${sourceBadge}
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
        playContent(content);
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
        // Processar thumbnail para a seção em destaque também
        const processedThumbnail = processThumbnailUrl(featuredContent.thumbnail, featuredContent.sourceType);
        featuredSection.style.backgroundImage = `linear-gradient(to top, var(--bg-darker) 0%, transparent 60%), url('${processedThumbnail}')`;
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

// Mostrar instruções de fonte
function showSourceInstructions(sourceType) {
    const instructions = {
        'google_drive': `
            <div class="source-instructions">
                <h4><i class="fab fa-google-drive"></i> Google Drive:</h4>
                <p><strong>Link do vídeo:</strong> https://drive.google.com/file/d/FILE_ID/view</p>
                <p><strong>Thumbnail:</strong> Use o mesmo link do vídeo ou link direto de imagem</p>
                <p><strong>Verifique:</strong> Arquivo compartilhado como "Qualquer pessoa com o link pode ver"</p>
            </div>
        `,
        'youtube': `
            <div class="source-instructions">
                <h4><i class="fab fa-youtube"></i> YouTube:</h4>
                <p><strong>Link do vídeo:</strong> Qualquer link do YouTube</p>
                <p><strong>Thumbnail:</strong> Use thumbnails do YouTube ou imagens personalizadas</p>
                <p><strong>Exemplos de vídeo:</strong></p>
                <ul>
                    <li>https://www.youtube.com/watch?v=CODIGO</li>
                    <li>https://youtu.be/CODIGO</li>
                </ul>
            </div>
        `,
        'mega': `
            <div class="source-instructions">
                <h4><i class="fas fa-cloud"></i> Mega.nz:</h4>
                <p><strong>Formatos suportados:</strong></p>
                <ul>
                    <li>https://mega.nz/file/FILE_ID#FILE_KEY</li>
                    <li>https://mega.nz/folder/FOLDER_ID#FOLDER_KEY</li>
                </ul>
                <p><strong>Thumbnail:</strong> Use imagens de outras fontes (Mega não fornece thumbnails públicas)</p>
                <p><strong>Limitações:</strong></p>
                <ul>
                    <li>Não suporta reprodução direta em players</li>
                    <li>Requer interação manual do usuário</li>
                    <li>Recomendado para downloads</li>
                    <li>Thumbnails serão substituídas por placeholders</li>
                </ul>
            </div>
        `,
        'direct': `
            <div class="source-instructions">
                <h4><i class="fas fa-link"></i> URL Direta:</h4>
                <p><strong>Vídeo:</strong> Link direto para MP4, WebM, etc.</p>
                <p><strong>Thumbnail:</strong> Link direto para JPG, PNG, etc.</p>
                <p><strong>Exemplo vídeo:</strong> https://site.com/video.mp4</p>
                <p><strong>Exemplo thumbnail:</strong> https://site.com/thumb.jpg</p>
            </div>
        `,
        'archive': `
            <div class="source-instructions">
                <h4><i class="fas fa-archive"></i> Internet Archive:</h4>
                <p><strong>Vídeo:</strong> URL completa da página do vídeo</p>
                <p><strong>Thumbnail:</strong> Use thumbnails do Archive ou imagens personalizadas</p>
                <p><strong>Exemplo:</strong> https://archive.org/details/NOME_DO_VIDEO</p>
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

// =============================================
// FUNÇÕES DE ADMINISTRAÇÃO
// =============================================

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

// =============================================
// FUNÇÕES DE UTILIDADE
// =============================================

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
    if (currentScreen) {
        currentScreen.insertBefore(messageDiv, currentScreen.firstChild);
    }
    
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

// Função para fechar o player corretamente
function closeVideoPlayer() {
    console.log('🔒 Fechando player de vídeo...');
    
    // Parar vídeo
    if (unifiedVideoPlayer) {
        unifiedVideoPlayer.pause();
        unifiedVideoPlayer.src = '';
    }
    
    // Esconder modal
    videoModal.classList.add('hidden');
    
    // Resetar container
    const videoContainer = document.getElementById('video-container');
    if (videoContainer) {
        videoContainer.innerHTML = `
            <div id="netflix-player" style="width: 100%; height: 100%; display: none;">
                <video id="unified-video-player" style="width: 100%; height: 100%;" controls>
                    Seu navegador não suporta o elemento de vídeo.
                </video>
                <div id="player-controls" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 20px; display: none;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <button id="play-pause-btn" style="background: white; border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <i class="fas fa-play" style="color: black;"></i>
                        </button>
                        <button id="mute-btn" style="background: transparent; border: 1px solid white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <div style="flex: 1; background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; position: relative; cursor: pointer;">
                            <div id="progress-bar" style="position: absolute; left: 0; top: 0; height: 100%; background: red; width: 0%; border-radius: 2px;"></div>
                        </div>
                        <span id="time-display" style="color: white; font-size: 14px;">0:00 / 0:00</span>
                        <button id="fullscreen-btn" style="background: transparent; border: 1px solid white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; margin-left: auto;">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div id="video-placeholder" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; padding: 20px; background: #000;">
                <div class="loading-spinner"></div>
                <h3>Preparando o player...</h3>
            </div>
        `;
    }
    
    // Resetar controles
    playerInitialized = false;
    currentPlayingContent = null;
    console.log('✅ Player fechado e limpo');
}

// =============================================
// FUNÇÕES GLOBAIS
// =============================================

// Funções de ação para uso no HTML
window.openLinkDirectly = function(url) {
    window.open(url, '_blank');
    showMessage('Abrindo link original...', 'info');
};

window.testInNewTab = function(url) {
    window.open(url, '_blank');
    showMessage('Testando em nova aba...', 'info');
};

window.copyUrl = function(url) {
    navigator.clipboard.writeText(url).then(() => {
        showMessage('URL copiada com sucesso!', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('URL copiada!', 'success');
    });
};

// Funções de administração globais
window.editUserRole = editUserRole;
window.deleteUser = deleteUser;
window.editContent = editContent;
window.deleteContent = deleteContent;

// Inicializar controles do player após carregamento completo
window.addEventListener('load', () => {
    setTimeout(initPlayerControls, 1500);
});
