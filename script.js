// script.js - VERSÃO COMPLETA COM TODOS OS SERVIÇOS DE HOSPEDAGEM
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
let currentVideoElement = null;
let currentIframeElement = null;
let netflixPlayer = null;

// Serviços de hospedagem gratuita suportados
const SUPPORTED_SERVICES = {
  'direct': 'URL Direta',
  'google_drive': 'Google Drive',
  'youtube': 'YouTube', 
  'archive': 'Internet Archive',
  'mega': 'Mega.nz',
  'nitroflare': 'Nitro Flare',
  'terabox': 'Terabox',
  'four_shared': '4shared',
  'playbook': 'Playbook',
  'telegram': 'Telegram'
};

// Event Listeners
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

// =============================================
// SISTEMA DE THUMBNAILS MELHORADO
// =============================================

// Função para processar thumbnails de diferentes fontes
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
        case 'nitroflare':
            return `https://via.placeholder.com/300x450/1a1a2a/FFFF99?text=NITRO+FLARE`;
        case 'terabox':
            return `https://via.placeholder.com/300x450/1a1a2a/0088cc?text=TERABOX`;
        case 'four_shared':
            return `https://via.placeholder.com/300x450/1a1a2a/FFFFFF?text=4SHARED`;
        case 'playbook':
            return `https://via.placeholder.com/300x450/1a1a2a/4267B2?text=PLAYBOOK`;
        case 'telegram':
            return `https://via.placeholder.com/300x450/1a1a2a/0088cc?text=TELEGRAM`;
        default:
            return url; // Retorna original se não souber processar
    }
}

// Verificar se é URL direta de imagem
function isDirectImageUrl(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
}

// Processar thumbnail do Google Drive
function processGoogleDriveThumbnail(url) {
    const fileId = getGoogleDriveId(url);
    if (fileId) {
        // Google Drive oferece thumbnails em diferentes tamanhos
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w300`;
    }
    return url;
}

// Processar thumbnail do Mega.nz (limitações - usar placeholder)
function processMegaThumbnail(url) {
    const megaInfo = extractMegaInfo(url);
    if (megaInfo) {
        // Mega.nz não fornece thumbnails públicas, usar placeholder baseado no tipo
        return `https://via.placeholder.com/300x450/1a1a2a/FFFFFF?text=MEGA+${megaInfo.fileType || 'VIDEO'}`;
    }
    return 'https://via.placeholder.com/300x450/1a1a2a/FFFFFF?text=MEGA+VIDEO';
}

// Ícone para cada tipo de fonte (usado apenas para admin)
function getSourceIcon(sourceType) {
    const icons = {
        'youtube': 'youtube',
        'google_drive': 'google-drive',
        'mega': 'cloud',
        'direct': 'link',
        'archive': 'archive',
        'nitroflare': 'bolt',
        'terabox': 'box',
        'four_shared': 'share-alt',
        'playbook': 'book',
        'telegram': 'paper-plane'
    };
    return icons[sourceType] || 'video';
}

// =============================================
// FUNÇÕES DE EXTRAÇÃO PARA NOVOS SERVIÇOS
// =============================================

// Extrair informações do link Mega.nz
function extractMegaInfo(url) {
    try {
        console.log('🔍 Analisando URL do Mega:', url);
        
        // Padrões comuns do Mega.nz
        const patterns = [
            /mega\.nz\/(file|folder)\/([^#]+)#([^#\s]+)/, // Com chave
            /mega\.nz\/(file|folder)\/([^#\s?]+)/,        // Sem chave
            /mega\.nz\/(file|folder)\/([^#\s?]+)\?/       // Com parâmetros
        ];
        
        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const type = match[1]; // file ou folder
                const fileId = match[2];
                const key = match[3] || null;
                
                console.log('✅ Mega.nz detectado:', { type, fileId, key });
                
                // Determinar tipo de arquivo baseado na URL
                let fileType = 'Vídeo';
                if (url.match(/\.(mp4|avi|mkv|mov|wmv)$/i)) fileType = 'Vídeo';
                else if (url.match(/\.(jpg|jpeg|png|gif)$/i)) fileType = 'Imagem';
                else if (url.match(/\.(mp3|wav|flac)$/i)) fileType = 'Áudio';
                
                return {
                    type: type,
                    fileId: fileId,
                    key: key,
                    filename: extractFilenameFromUrl(url),
                    fileType: fileType,
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

// Extrair informações do Nitro Flare
function extractNitroFlareInfo(url) {
    try {
        // Nitro Flare padrão: https://nitroflare.com/view/FILE_ID/filename.ext
        const match = url.match(/nitroflare\.com\/view\/([^\/]+)/);
        if (match) {
            return {
                fileId: match[1],
                filename: url.split('/').pop(),
                service: 'nitroflare',
                directUrl: url
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao extrair info do Nitro Flare:', error);
        return null;
    }
}

// Extrair informações do Terabox
function extractTeraboxInfo(url) {
    try {
        // Terabox padrão: https://terabox.com/s/FILE_ID
        const match = url.match(/terabox\.com\/s\/([^\/\?]+)/);
        if (match) {
            return {
                fileId: match[1],
                service: 'terabox',
                embedUrl: `https://www.terabox.com/sharing/embed?surl=${match[1]}`,
                directUrl: url
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao extrair info do Terabox:', error);
        return null;
    }
}

// Extrair informações do 4shared
function extractFourSharedInfo(url) {
    try {
        // 4shared padrão: https://www.4shared.com/video/FILE_ID/filename
        const match = url.match(/4shared\.com\/(video|file)\/([^\/]+)/);
        if (match) {
            return {
                fileId: match[2],
                type: match[1],
                service: 'four_shared',
                embedUrl: `https://www.4shared.com/embed/${match[2]}`,
                directUrl: url
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao extrair info do 4shared:', error);
        return null;
    }
}

// Extrair informações do Playbook (Facebook)
function extractPlaybookInfo(url) {
    try {
        // Playbook (Facebook) - extrair ID da apresentação
        const match = url.match(/facebook\.com\/[^\/]+\/posts\/([^\/\?]+)/) || 
                     url.match(/fb\.watch\/([^\/\?]+)/) ||
                     url.match(/facebook\.com\/[^\/]+\/videos\/([^\/\?]+)/);
        
        if (match) {
            return {
                videoId: match[1],
                service: 'playbook',
                embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`,
                directUrl: url
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao extrair info do Playbook:', error);
        return null;
    }
}

// Extrair informações do Telegram
function extractTelegramInfo(url) {
    try {
        // Telegram padrão: t.me/c/CHANNEL_ID/MESSAGE_ID ou t.me/username/MESSAGE_ID
        const match = url.match(/t\.me\/(?:c\/(\d+)\/(\d+)|(\w+)\/(\d+))/);
        if (match) {
            if (match[1] && match[2]) {
                // Canal privado
                return {
                    channelId: match[1],
                    messageId: match[2],
                    service: 'telegram',
                    isPrivate: true,
                    directUrl: url
                };
            } else if (match[3] && match[4]) {
                // Canal público
                return {
                    username: match[3],
                    messageId: match[4],
                    service: 'telegram',
                    isPrivate: false,
                    directUrl: url
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Erro ao extrair info do Telegram:', error);
        return null;
    }
}

// Tentar extrair nome do arquivo da URL
function extractFilenameFromUrl(url) {
    try {
        // Tenta encontrar o nome após o último /
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        
        // Remove parâmetros e fragments
        const cleanName = lastPart.split('?')[0].split('#')[0];
        
        // Se for muito longo, trunca
        return cleanName.length > 30 ? cleanName.substring(0, 30) + '...' : cleanName;
    } catch (error) {
        return 'Arquivo do Mega.nz';
    }
}

// =============================================
// SISTEMA DE VÍDEO COM PLAYER UNIFICADO
// =============================================

function playContent(content) {
    console.log('🎬 PLAY CONTENT CHAMADO:', content);
    currentPlayingContent = content;
    
    // Atualizar informações do modal
    document.getElementById('video-title').textContent = content.title;
    document.getElementById('video-description').textContent = content.description;
    
    // Mostrar modal primeiro
    const videoModal = document.getElementById('video-modal');
    videoModal.classList.remove('hidden');
    
    // Usar o player unificado para todas as fontes
    loadInUnifiedPlayer(content);
}

function loadVideoContent(content) {
    console.log('🎬 Carregando conteúdo via player unificado:', content.sourceType);
    
    // Limpar elementos anteriores
    cleanupVideoElements();
    
    // Usar o player unificado para todas as fontes
    loadInUnifiedPlayer(content);
}

// Função para carregar conteúdo no player unificado
function loadInUnifiedPlayer(content) {
    console.log('🎬 Carregando no player unificado:', content);
    
    const videoContainer = document.getElementById('video-container');
    const placeholder = document.getElementById('video-placeholder');
    
    // Limpar container
    videoContainer.innerHTML = '';
    
    // Processar baseado no tipo de fonte
    switch(content.sourceType) {
        case 'mega':
            loadMegaInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'youtube':
            loadYouTubeInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'google_drive':
            loadGoogleDriveInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'direct':
            loadDirectVideoInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'archive':
            loadArchiveInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'nitroflare':
            loadNitroFlareInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'terabox':
            loadTeraboxInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'four_shared':
            loadFourSharedInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'playbook':
            loadPlaybookInUnifiedPlayer(content, videoContainer);
            break;
            
        case 'telegram':
            loadTelegramInUnifiedPlayer(content, videoContainer);
            break;
            
        default:
            // Fallback para iframe genérico
            loadGenericInUnifiedPlayer(content, videoContainer);
    }
}

// Mega.nz no player unificado (SEMPRE USA EMBED DIRETO)
function loadMegaInUnifiedPlayer(content, container) {
    console.log('🔧 Processando Mega.nz no player unificado...');
    
    const megaInfo = extractMegaInfo(content.videoUrl);
    
    if (!megaInfo) {
        showError('Link do Mega.nz inválido', container, null, content.videoUrl, 'Mega.nz');
        return;
    }
    
    // SEMPRE usar o embed do Mega (padrão)
    const embedUrl = `https://mega.nz/embed/${megaInfo.fileId}${megaInfo.key ? `#${megaInfo.key}` : ''}`;
    
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <iframe 
                    src="${embedUrl}"
                    frameborder="0"
                    allowfullscreen
                    class="mega-iframe"
                    style="width: 100%; height: 100%;"
                    onload="console.log('✅ Embed Mega carregado')"
                    onerror="showEmbedError(this, '${content.videoUrl}', 'Mega.nz')">
                </iframe>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// YouTube no player unificado
function loadYouTubeInUnifiedPlayer(content, container) {
    console.log('🔧 Processando YouTube no player unificado...');
    
    const videoId = getYouTubeId(content.videoUrl);
    
    if (!videoId) {
        showError('ID do YouTube não encontrado', container, null, content.videoUrl, 'YouTube');
        return;
    }
    
    // URL do embed com parâmetros para esconder controles nativos
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=0&showinfo=0`;
    
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <iframe 
                    src="${embedUrl}"
                    frameborder="0"
                    allowfullscreen
                    class="youtube-iframe"
                    style="width: 100%; height: 100%;"
                    onload="console.log('✅ YouTube embed carregado')"
                    onerror="showEmbedError(this, '${content.videoUrl}', 'YouTube')">
                </iframe>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Google Drive no player unificado
function loadGoogleDriveInUnifiedPlayer(content, container) {
    console.log('🔧 Processando Google Drive no player unificado...');
    
    const fileId = getGoogleDriveId(content.videoUrl);
    
    if (!fileId) {
        showError('ID do Google Drive não encontrado', container, null, content.videoUrl, 'Google Drive');
        return;
    }
    
    const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <iframe 
                    src="${embedUrl}"
                    frameborder="0"
                    allowfullscreen
                    class="gdrive-iframe"
                    style="width: 100%; height: 100%;"
                    onload="console.log('✅ Google Drive embed carregado')"
                    onerror="showEmbedError(this, '${content.videoUrl}', 'Google Drive')">
                </iframe>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Vídeo direto no player unificado
function loadDirectVideoInUnifiedPlayer(content, container) {
    console.log('🔧 Processando vídeo direto no player unificado...');
    
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <video 
                    id="direct-video-player"
                    class="video-element"
                    controls
                    autoplay
                    style="width: 100%; height: 100%; background: #000;">
                    <source src="${content.videoUrl}" type="video/mp4">
                    <source src="${content.videoUrl}" type="video/webm">
                    Seu navegador não suporta o elemento de vídeo.
                </video>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <div class="progress-container">
                            <div class="progress-bar" onclick="seekVideoDirect(this, event)">
                                <div class="progress-fill"></div>
                                <div class="progress-handle"></div>
                            </div>
                            <div class="time-display">
                                <span class="current-time">00:00</span>
                                <span class="duration">00:00</span>
                            </div>
                        </div>
                        
                        <div class="control-buttons">
                            <button class="control-btn play-btn" onclick="togglePlayDirect()" title="Reproduzir/Pausar">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="control-btn volume-btn" onclick="toggleVolumeSlider()" title="Volume">
                                <i class="fas fa-volume-up"></i>
                            </button>
                            <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Configurar eventos para vídeo direto
    const videoElement = document.getElementById('direct-video-player');
    setupDirectVideoEvents(videoElement);
}

// Archive no player unificado
function loadArchiveInUnifiedPlayer(content, container) {
    console.log('🔧 Processando Internet Archive no player unificado...');
    
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <iframe 
                    src="${content.videoUrl}"
                    frameborder="0"
                    allowfullscreen
                    class="archive-iframe"
                    style="width: 100%; height: 100%;"
                    onload="console.log('✅ Archive embed carregado')"
                    onerror="showEmbedError(this, '${content.videoUrl}', 'Internet Archive')">
                </iframe>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Nitro Flare no player unificado
function loadNitroFlareInUnifiedPlayer(content, container) {
    console.log('🔧 Processando Nitro Flare...');
    
    const nitroInfo = extractNitroFlareInfo(content.videoUrl);
    
    if (!nitroInfo) {
        showError('Link do Nitro Flare inválido', container, null, content.videoUrl, 'Nitro Flare');
        return;
    }
    
    // Nitro Flare não tem player nativo, então oferecemos opções
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; padding: 30px; background: linear-gradient(135deg, #1a1a2a 0%, #0a0a1a 100%);">
                    <i class="fas fa-bolt" style="font-size: 4rem; color: #FFFF99; margin-bottom: 20px;"></i>
                    <h2 style="color: #FFFF99; margin-bottom: 15px;">Arquivo Nitro Flare</h2>
                    
                    <div style="background: rgba(255, 255, 153, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 25px; max-width: 500px; border: 1px solid rgba(255, 255, 153, 0.3);">
                        <p style="margin-bottom: 10px;"><strong>Arquivo:</strong> ${nitroInfo.filename || 'Não identificado'}</p>
                        <p style="word-break: break-all; font-size: 0.9rem; color: #ccc;">
                            <strong>URL:</strong> ${content.videoUrl}
                        </p>
                    </div>
                    
                    <p style="color: #b3b3b3; margin-bottom: 25px; max-width: 600px;">
                        O Nitro Flare não possui player de vídeo integrado. Escolha uma opção abaixo:
                    </p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; width: 100%; max-width: 600px; margin-bottom: 25px;">
                        <button onclick="downloadNitroFlareFile('${content.videoUrl}')" 
                                style="padding: 15px; background: linear-gradient(135deg, #FF0000 0%, #ff3333 100%); border: none; border-radius: 8px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: all 0.3s;">
                            <i class="fas fa-download" style="font-size: 1.5rem;"></i>
                            <div>
                                <strong>Download Direto</strong>
                                <div style="font-size: 0.8rem; opacity: 0.9;">Assistir localmente</div>
                            </div>
                        </button>
                        
                        <button onclick="openNitroFlareLink('${content.videoUrl}')" 
                                style="padding: 15px; background: linear-gradient(135deg, #000080 0%, #3333aa 100%); border: none; border-radius: 8px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: all 0.3s;">
                            <i class="fas fa-external-link-alt" style="font-size: 1.5rem;"></i>
                            <div>
                                <strong>Abrir no Site</strong>
                                <div style="font-size: 0.8rem; opacity: 0.9;">Player do navegador</div>
                            </div>
                        </button>
                        
                        <button onclick="tryVideoStream('${content.videoUrl}')" 
                                style="padding: 15px; background: linear-gradient(135deg, #008000 0%, #00cc00 100%); border: none; border-radius: 8px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: all 0.3s;">
                            <i class="fas fa-play-circle" style="font-size: 1.5rem;"></i>
                            <div>
                                <strong>Tentar Stream</strong>
                                <div style="font-size: 0.8rem; opacity: 0.9;">Experimental</div>
                            </div>
                        </button>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 10px; max-width: 600px;">
                        <h4 style="color: #FFFF99; margin-bottom: 15px;">💡 Informações:</h4>
                        <ul style="text-align: left; color: #b3b3b3; line-height: 1.6; font-size: 0.9rem;">
                            <li>Nitro Flare é principalmente um serviço de download</li>
                            <li>Para assistir online, faça download e use um player local</li>
                            <li>Alguns navegadores podem reproduzir vídeos diretamente</li>
                            <li>Considere migrar para Mega.nz ou Google Drive para streaming</li>
                        </ul>
                    </div>
                </div>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Terabox no player unificado
function loadTeraboxInUnifiedPlayer(content, container) {
    console.log('🔧 Processando Terabox...');
    
    const teraboxInfo = extractTeraboxInfo(content.videoUrl);
    
    if (!teraboxInfo) {
        showError('Link do Terabox inválido', container, null, content.videoUrl, 'Terabox');
        return;
    }
    
    // Terabox tem player nativo via embed
    const embedUrl = teraboxInfo.embedUrl || `https://www.terabox.com/sharing/embed?surl=${teraboxInfo.fileId}`;
    
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <iframe 
                    src="${embedUrl}"
                    frameborder="0"
                    allowfullscreen
                    class="terabox-iframe"
                    style="width: 100%; height: 100%;"
                    onload="console.log('✅ Terabox embed carregado')"
                    onerror="showEmbedError(this, '${content.videoUrl}', 'Terabox')">
                </iframe>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 4shared no player unificado
function loadFourSharedInUnifiedPlayer(content, container) {
    console.log('🔧 Processando 4shared...');
    
    const fourSharedInfo = extractFourSharedInfo(content.videoUrl);
    
    if (!fourSharedInfo) {
        showError('Link do 4shared inválido', container, null, content.videoUrl, '4shared');
        return;
    }
    
    // 4shared tem player nativo via embed
    const embedUrl = fourSharedInfo.embedUrl || `https://www.4shared.com/embed/${fourSharedInfo.fileId}`;
    
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <iframe 
                    src="${embedUrl}"
                    frameborder="0"
                    allowfullscreen
                    class="fourshared-iframe"
                    style="width: 100%; height: 100%;"
                    onload="console.log('✅ 4shared embed carregado')"
                    onerror="showEmbedError(this, '${content.videoUrl}', '4shared')">
                </iframe>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Playbook no player unificado
function loadPlaybookInUnifiedPlayer(content, container) {
    console.log('🔧 Processando Playbook...');
    
    const playbookInfo = extractPlaybookInfo(content.videoUrl);
    
    if (!playbookInfo) {
        // Tenta carregar como iframe direto (Facebook tem player)
        container.innerHTML = `
            <div class="netflix-player">
                <div class="video-wrapper">
                    <iframe 
                        src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(content.videoUrl)}&show_text=false"
                        frameborder="0"
                        allowfullscreen
                        class="playbook-iframe"
                        style="width: 100%; height: 100%;"
                        onload="console.log('✅ Playbook embed carregado')"
                        onerror="showEmbedError(this, '${content.videoUrl}', 'Playbook')">
                    </iframe>
                    
                    <div class="player-controls">
                        <div class="controls-top">
                            <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <h3 class="video-title">${content.title}</h3>
                        </div>
                        
                        <div class="controls-bottom">
                            <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                                <i class="fas fa-expand"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    // Usa o embed do Facebook
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <iframe 
                    src="${playbookInfo.embedUrl}"
                    frameborder="0"
                    allowfullscreen
                    class="playbook-iframe"
                    style="width: 100%; height: 100%;"
                    onload="console.log('✅ Playbook embed carregado')"
                    onerror="showEmbedError(this, '${content.videoUrl}', 'Playbook')">
                </iframe>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Telegram no player unificado
function loadTelegramInUnifiedPlayer(content, container) {
    console.log('🔧 Processando Telegram...');
    
    const telegramInfo = extractTelegramInfo(content.videoUrl);
    
    // Telegram não tem embed oficial, então oferecemos opções
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <div style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; text-align: center; padding: 30px; background: linear-gradient(135deg, #000080 0%, #000055 100%);">
                    <i class="fab fa-telegram" style="font-size: 4rem; color: #0088cc; margin-bottom: 20px;"></i>
                    <h2 style="color: #0088cc; margin-bottom: 15px;">Conteúdo do Telegram</h2>
                    
                    <div style="background: rgba(0, 136, 204, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 25px; max-width: 500px; border: 1px solid rgba(0, 136, 204, 0.3);">
                        <p style="margin-bottom: 10px;"><strong>Título:</strong> ${content.title}</p>
                        <p style="word-break: break-all; font-size: 0.9rem; color: #ccc;">
                            <strong>URL:</strong> ${content.videoUrl}
                        </p>
                    </div>
                    
                    <p style="color: #b3b3b3; margin-bottom: 25px; max-width: 600px;">
                        O Telegram não oferece player público para embedding. Escolha uma opção:
                    </p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; width: 100%; max-width: 600px; margin-bottom: 25px;">
                        <button onclick="openTelegramLink('${content.videoUrl}')" 
                                style="padding: 15px; background: #0088cc; border: none; border-radius: 8px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: all 0.3s;">
                            <i class="fab fa-telegram" style="font-size: 1.5rem;"></i>
                            <div>
                                <strong>Abrir no Telegram</strong>
                                <div style="font-size: 0.8rem; opacity: 0.9;">Player oficial</div>
                            </div>
                        </button>
                        
                        <button onclick="tryTelegramProxy('${content.videoUrl}')" 
                                style="padding: 15px; background: linear-gradient(135deg, #000080 0%, #3333aa 100%); border: none; border-radius: 8px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: all 0.3s;">
                            <i class="fas fa-link" style="font-size: 1.5rem;"></i>
                            <div>
                                <strong>Proxy Web</strong>
                                <div style="font-size: 0.8rem; opacity: 0.9;">web.telegram.org</div>
                            </div>
                        </button>
                        
                        <button onclick="downloadTelegramVideo('${content.videoUrl}')" 
                                style="padding: 15px; background: linear-gradient(135deg, #008000 0%, #00cc00 100%); border: none; border-radius: 8px; color: white; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 10px; transition: all 0.3s;">
                            <i class="fas fa-download" style="font-size: 1.5rem;"></i>
                            <div>
                                <strong>Baixar Vídeo</strong>
                                <div style="font-size: 0.8rem; opacity: 0.9;">Assistir localmente</div>
                            </div>
                        </button>
                    </div>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 10px; max-width: 600px;">
                        <h4 style="color: #0088cc; margin-bottom: 15px;">💡 Dicas para Telegram:</h4>
                        <ul style="text-align: left; color: #b3b3b3; line-height: 1.6; font-size: 0.9rem;">
                            <li>Use o app oficial do Telegram para melhor experiência</li>
                            <li>Canais públicos são mais fáceis de acessar</li>
                            <li>Para embedding, considere usar YouTube ou Vimeo</li>
                            <li>Alguns bots do Telegram podem gerar links diretos</li>
                        </ul>
                    </div>
                </div>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Genérico no player unificado
function loadGenericInUnifiedPlayer(content, container) {
    console.log('🔧 Processando fonte genérica no player unificado...');
    
    container.innerHTML = `
        <div class="netflix-player">
            <div class="video-wrapper">
                <iframe 
                    src="${content.videoUrl}"
                    frameborder="0"
                    allowfullscreen
                    class="generic-iframe"
                    style="width: 100%; height: 100%;"
                    onload="console.log('✅ Generic embed carregado')"
                    onerror="showEmbedError(this, '${content.videoUrl}', content.sourceType)">
                </iframe>
                
                <div class="player-controls">
                    <div class="controls-top">
                        <button class="control-btn back-btn" onclick="closeVideoPlayer()" title="Voltar">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <h3 class="video-title">${content.title}</h3>
                    </div>
                    
                    <div class="controls-bottom">
                        <button class="control-btn fullscreen-btn" onclick="toggleFullscreen(this)" title="Tela Cheia">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Funções auxiliares para vídeo direto
function setupDirectVideoEvents(videoElement) {
    if (!videoElement) return;
    
    videoElement.addEventListener('loadedmetadata', function() {
        updateDirectVideoDuration(this);
    });
    
    videoElement.addEventListener('timeupdate', function() {
        updateDirectVideoProgress(this);
    });
    
    videoElement.addEventListener('play', function() {
        updateDirectVideoPlayButton(true);
    });
    
    videoElement.addEventListener('pause', function() {
        updateDirectVideoPlayButton(false);
    });
    
    // Iniciar atualização de controles
    updateDirectVideoPlayButton(!videoElement.paused);
}

function updateDirectVideoDuration(videoElement) {
    const durationElement = document.querySelector('.duration');
    if (durationElement && videoElement.duration) {
        durationElement.textContent = formatTime(videoElement.duration);
    }
}

function updateDirectVideoProgress(videoElement) {
    const progressFill = document.querySelector('.progress-fill');
    const progressHandle = document.querySelector('.progress-handle');
    const currentTimeElement = document.querySelector('.current-time');
    
    if (progressFill && progressHandle && videoElement.duration) {
        const progress = (videoElement.currentTime / videoElement.duration) * 100;
        progressFill.style.width = `${progress}%`;
        progressHandle.style.left = `${progress}%`;
    }
    
    if (currentTimeElement) {
        currentTimeElement.textContent = formatTime(videoElement.currentTime);
    }
}

function updateDirectVideoPlayButton(isPlaying) {
    const playButton = document.querySelector('.play-btn i');
    if (playButton) {
        playButton.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
}

function togglePlayDirect() {
    const videoElement = document.getElementById('direct-video-player');
    if (videoElement) {
        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
    }
}

function seekVideoDirect(progressBar, event) {
    const videoElement = document.getElementById('direct-video-player');
    if (!videoElement || !videoElement.duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const time = percent * videoElement.duration;
    
    videoElement.currentTime = time;
}

function toggleVolumeSlider() {
    const volumeSlider = document.querySelector('.volume-slider');
    if (volumeSlider) {
        volumeSlider.classList.toggle('hidden');
    }
}

// =============================================
// FUNÇÕES DE CONTROLE DO PLAYER
// =============================================

// Alternar tela cheia
function toggleFullscreen(element) {
    const player = element.closest('.netflix-player') || element.closest('.video-wrapper');
    
    if (!document.fullscreenElement) {
        if (player.requestFullscreen) {
            player.requestFullscreen();
        } else if (player.webkitRequestFullscreen) {
            player.webkitRequestFullscreen();
        } else if (player.msRequestFullscreen) {
            player.msRequestFullscreen();
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

// Formatar tempo (MM:SS ou HH:MM:SS)
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Mostrar erro de embed
function showEmbedError(iframe, url, sourceType) {
    console.error('❌ Erro no embed:', sourceType);
    
    const container = iframe.parentElement;
    if (container) {
        showError(`Erro ao carregar ${sourceType}`, container, null, url, sourceType);
    }
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

// Função para limpar elementos de vídeo anteriores
function cleanupVideoElements() {
    console.log('🧹 Limpando elementos de vídeo anteriores...');
    
    // Parar e limpar vídeo element
    if (currentVideoElement) {
        currentVideoElement.pause();
        currentVideoElement.src = '';
        currentVideoElement.load();
        currentVideoElement = null;
    }
    
    // Limpar iframe
    if (currentIframeElement) {
        currentIframeElement.src = 'about:blank';
        currentIframeElement = null;
    }
    
    // Limpar container
    const videoContainer = document.getElementById('video-container');
    if (videoContainer) {
        videoContainer.innerHTML = '';
    }
}

// Função para fechar o player corretamente
function closeVideoPlayer() {
    console.log('🔒 Fechando player de vídeo...');
    
    // Limpar elementos de vídeo
    cleanupVideoElements();
    
    // Esconder modal
    const videoModal = document.getElementById('video-modal');
    videoModal.classList.add('hidden');
    
    // Resetar conteúdo atual
    currentPlayingContent = null;
    
    console.log('✅ Player fechado e limpo');
}

// Extrair IDs de URLs
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

// Mostrar erro
function showError(message, container, placeholder, url, sourceType) {
    console.log('❌ ERRO:', message);
    
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
                
                <button onclick="copyUrl('${url}')" 
                        style="padding: 15px 25px; background: #FF9800; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 1rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-copy"></i> Copiar URL
                </button>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px; max-width: 600px;">
                <h4 style="color: #4CAF50; margin-bottom: 15px;">Possíveis Soluções:</h4>
                <ul style="text-align: left; color: #ccc; line-height: 1.6;">
                    <li>Verifique se o link está público e acessível</li>
                    <li>Teste o link diretamente no navegador</li>
                    <li>Google Drive: o arquivo precisa estar compartilhado como "Qualquer pessoa com o link pode ver"</li>
                    <li>YouTube: o vídeo pode ter restrições de incorporação</li>
                    <li>URLs diretas: o servidor precisa permitir acesso cross-origin (CORS)</li>
                </ul>
            </div>
        </div>
    `;
    
    if (placeholder) {
        placeholder.innerHTML = errorHTML;
    } else {
        container.innerHTML = errorHTML;
    }
}

// Funções de ação
function openLinkDirectly(url) {
    window.open(url, '_blank');
    showMessage('Abrindo link original...', 'info');
}

function testInNewTab(url) {
    window.open(url, '_blank');
    showMessage('Testando em nova aba...', 'info');
}

function copyUrl(url) {
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
}

// Funções para novos serviços
function downloadNitroFlareFile(url) {
    console.log('📥 Iniciando download do Nitro Flare:', url);
    window.open(url, '_blank');
    showMessage('Abrindo Nitro Flare para download...', 'info');
}

function openNitroFlareLink(url) {
    console.log('🔗 Abrindo Nitro Flare:', url);
    window.open(url, '_blank');
    showMessage('Abrindo Nitro Flare em nova aba...', 'info');
}

function tryVideoStream(url) {
    console.log('🎬 Tentando stream direto:', url);
    // Tenta abrir como vídeo direto (alguns navegadores conseguem)
    window.open(url, '_blank');
    showMessage('Tentando reprodução direta...', 'info');
}

function openTelegramLink(url) {
    console.log('🔗 Abrindo Telegram:', url);
    window.open(url, '_blank');
    showMessage('Abrindo Telegram...', 'info');
}

function tryTelegramProxy(url) {
    console.log('🔗 Tentando proxy do Telegram:', url);
    // Tenta abrir via web.telegram.org
    const proxyUrl = `https://web.telegram.org/k/#${url.replace('https://t.me/', '')}`;
    window.open(proxyUrl, '_blank');
    showMessage('Abrindo via Telegram Web...', 'info');
}

function downloadTelegramVideo(url) {
    console.log('📥 Tentando download do Telegram:', url);
    // Para Telegram, geralmente precisa usar o app
    window.open(url, '_blank');
    showMessage('Use o app do Telegram para baixar o vídeo', 'info');
}

// =============================================
// VALIDAÇÃO DE URL POR SERVIÇO
// =============================================

// Validar URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Validar URL por tipo de fonte
function validateSourceUrl(url, sourceType) {
    if (!isValidUrl(url)) {
        return false;
    }
    
    // Validações específicas por tipo de fonte
    switch(sourceType) {
        case 'nitroflare':
            return url.includes('nitroflare.com');
        case 'terabox':
            return url.includes('terabox.com');
        case 'four_shared':
            return url.includes('4shared.com');
        case 'playbook':
            return url.includes('facebook.com') || url.includes('fb.watch');
        case 'telegram':
            return url.includes('t.me');
        default:
            return true;
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

// Criar item de conteúdo (SEM BADGES PARA USUÁRIOS COMUNS)
function createContentItem(content) {
    const contentItem = document.createElement('div');
    contentItem.className = 'content-item';
    
    // Processar thumbnail baseado na fonte do conteúdo
    const processedThumbnail = processThumbnailUrl(content.thumbnail, content.sourceType);
    
    // Verificar se é admin para mostrar badge (usuários comuns não veem)
    const showBadge = isAdmin;
    
    contentItem.innerHTML = `
        <img src="${processedThumbnail}" alt="${content.title}" 
             onerror="this.src='https://via.placeholder.com/300x450/333333/FFFFFF?text=Imagem+Não+Disponível'">
        <div class="content-info">
            <h4>${content.title}</h4>
            <p>${content.description.substring(0, 80)}...</p>
            ${showBadge ? `
                <div class="content-source-badge">
                    <i class="fas fa-${getSourceIcon(content.sourceType)}"></i>
                    ${SUPPORTED_SERVICES[content.sourceType] || content.sourceType}
                </div>
            ` : ''}
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
        // Processar thumbnail para a seção em destaque também
        const processedThumbnail = processThumbnailUrl(featuredContent.thumbnail, featuredContent.sourceType);
        featuredSection.style.backgroundImage = `linear-gradient(to top, var(--fundo-escuro) 0%, transparent 60%), url('${processedThumbnail}')`;
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
                <p><strong>Observação:</strong> O player usará o embed do Mega.nz automaticamente</p>
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
        `,
        'nitroflare': `
            <div class="source-instructions">
                <h4><i class="fas fa-bolt"></i> Nitro Flare:</h4>
                <p><strong>Formato do link:</strong> https://nitroflare.com/view/FILE_ID/NOME_DO_ARQUIVO</p>
                <p><strong>Thumbnail:</strong> Use imagens externas ou screenshots</p>
                <p><strong>Observação:</strong> Nitro Flare não possui player nativo. O sistema tentará extrair o arquivo para reprodução direta.</p>
                <p><strong>Recomendação:</strong> Para melhor experiência, considere usar Mega.nz ou Google Drive.</p>
            </div>
        `,
        'terabox': `
            <div class="source-instructions">
                <h4><i class="fas fa-box"></i> Terabox:</h4>
                <p><strong>Formato do link:</strong> https://terabox.com/s/FILE_ID</p>
                <p><strong>Player nativo:</strong> Sim, o Terabox possui player de vídeo integrado</p>
                <p><strong>Thumbnail:</strong> Use thumbnails do Terabox ou imagens personalizadas</p>
                <p><strong>Compatibilidade:</strong> Excelente, suporta embedding</p>
            </div>
        `,
        'four_shared': `
            <div class="source-instructions">
                <h4><i class="fas fa-share-alt"></i> 4shared:</h4>
                <p><strong>Formato do link:</strong> https://www.4shared.com/video/FILE_ID/NOME_DO_ARQUIVO</p>
                <p><strong>Player nativo:</strong> Sim, possui player de vídeo</p>
                <p><strong>Thumbnail:</strong> Use thumbnails do 4shared ou imagens externas</p>
                <p><strong>Limitações:</strong> Requer login para arquivos grandes</p>
            </div>
        `,
        'playbook': `
            <div class="source-instructions">
                <h4><i class="fas fa-book"></i> Playbook:</h4>
                <p><strong>Formato do link:</strong> Link completo da apresentação/documento</p>
                <p><strong>Player nativo:</strong> Sim, para apresentações e documentos</p>
                <p><strong>Thumbnail:</strong> Use screenshots ou imagens relacionadas</p>
                <p><strong>Observação:</strong> Principalmente para apresentações, não apenas vídeos</p>
            </div>
        `,
        'telegram': `
            <div class="source-instructions">
                <h4><i class="fas fa-paper-plane"></i> Telegram:</h4>
                <p><strong>Formato do link:</strong> https://t.me/canal/ID_DA_MENSAGEM</p>
                <p><strong>Player nativo:</strong> Sim, possui player básico</p>
                <p><strong>Thumbnail:</strong> Use thumbnails geradas ou imagens externas</p>
                <p><strong>Limitações:</strong> Links precisam ser públicos ou do canal</p>
                <p><strong>Dica:</strong> Use o link direto da mensagem contendo o vídeo</p>
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
    
    // Validar URL específica do serviço
    if (!validateSourceUrl(videoUrl, sourceType)) {
        showMessage(`URL do ${SUPPORTED_SERVICES[sourceType]} inválida. Verifique o formato.`, 'error');
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
    .text-secondary { color: var(--texto-secundario); }
    .source-type { 
        padding: 4px 8px; 
        background: rgba(255,255,255,0.1); 
        border-radius: 4px; 
        font-size: 11px; 
    }
    .source-instructions {
        background: rgba(255, 0, 0, 0.1);
        padding: 15px;
        border-radius: var(--raio-borda-pequeno);
        border-left: 4px solid var(--vermelho-principal);
        margin: 15px 0;
        font-size: 14px;
    }
    .source-instructions h4 {
        color: var(--texto-principal);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .source-instructions p {
        margin-bottom: 8px;
        color: var(--texto-secundario);
    }
    .source-instructions ul {
        padding-left: 20px;
        color: var(--texto-secundario);
    }
    .source-instructions li {
        margin-bottom: 5px;
    }
    .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    /* Estilos para badges de fonte (APENAS ADMIN) */
    .content-source-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 10px;
        color: #FFFF99;
        display: flex;
        align-items: center;
        gap: 4px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 153, 0.3);
        z-index: 3;
    }
    
    .content-item {
        position: relative;
    }
    
    /* Player estilo Netflix */
    .netflix-player {
        width: 100%;
        height: 100%;
        background: #000;
        position: relative;
        overflow: hidden;
        border: 2px solid #000080;
        border-radius: 12px;
    }
    
    .video-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
    }
    
    .video-element {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #000;
    }
    
    /* Controles do player */
    .player-controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
        padding: 20px;
        z-index: 5;
        transition: all 0.3s;
        animation: slideIn 0.3s ease-out;
        border-top: 1px solid rgba(255, 255, 153, 0.2);
    }
    
    .player-controls.hidden {
        opacity: 0;
        pointer-events: none;
        animation: fadeIn 0.3s ease-out reverse;
    }
    
    .controls-top {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .controls-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
    }
    
    /* Botões de controle */
    .control-btn {
        background: rgba(0, 0, 128, 0.7);
        border: 2px solid rgba(255, 255, 153, 0.3);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 16px;
    }
    
    .control-btn:hover {
        background: rgba(255, 0, 0, 0.7);
        border-color: #FFFF99;
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(255, 255, 153, 0.5);
    }
    
    .back-btn {
        background: rgba(255, 0, 0, 0.8);
        border-color: rgba(255, 255, 255, 0.3);
    }
    
    .play-btn {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #FF0000 0%, #ff3333 100%);
        border: none;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    }
    
    .play-btn:hover {
        background: linear-gradient(135deg, #ff3333 0%, #FF0000 100%);
        transform: scale(1.15);
        box-shadow: 0 0 30px rgba(255, 0, 0, 0.7);
    }
    
    .play-btn i {
        font-size: 20px;
        color: white;
    }
    
    /* Barra de progresso */
    .progress-container {
        flex: 1;
        margin-right: 20px;
    }
    
    .progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        position: relative;
        cursor: pointer;
        transition: height 0.2s;
        overflow: hidden;
    }
    
    .progress-bar:hover {
        height: 6px;
    }
    
    .progress-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: linear-gradient(to right, #000080, #FF0000, #008000);
        border-radius: 2px;
        width: 0%;
        transition: width 0.1s;
    }
    
    .progress-handle {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        background: #FFFF99;
        border-radius: 50%;
        opacity: 0;
        transition: all 0.3s;
        box-shadow: 0 0 10px rgba(255, 255, 153, 0.8);
    }
    
    .progress-bar:hover .progress-handle {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.2);
    }
    
    .time-display {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .time-display span {
        font-weight: 500;
    }
    
    /* Botões laterais */
    .control-buttons {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    
    .volume-slider {
        width: 80px;
        margin-right: 10px;
        transition: all 0.3s;
    }
    
    .volume-slider.hidden {
        opacity: 0;
        pointer-events: none;
    }
    
    .volume-control {
        width: 100%;
        height: 4px;
        -webkit-appearance: none;
        background: linear-gradient(to right, #000080, #FF0000);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
    }
    
    .volume-control::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 14px;
        height: 14px;
        background: #FFFF99;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s;
        border: 2px solid #FF0000;
    }
    
    .volume-control::-webkit-slider-thumb:hover {
        transform: scale(1.3);
        box-shadow: 0 0 10px rgba(255, 255, 153, 0.8);
    }
    
    /* Título do vídeo */
    .video-title {
        color: white;
        font-size: 1.2rem;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        margin: 0;
        padding: 5px 10px;
        background: rgba(0, 0, 128, 0.3);
        border-radius: 8px;
        border-left: 3px solid #FF0000;
    }
    
    /* Iframes */
    .mega-iframe,
    .youtube-iframe,
    .gdrive-iframe,
    .archive-iframe,
    .terabox-iframe,
    .fourshared-iframe,
    .playbook-iframe,
    .generic-iframe {
        width: 100%;
        height: 100%;
        border: none;
        filter: brightness(0.95) contrast(1.1);
    }
    
    /* Ajustes para iframes dentro do player */
    .video-wrapper iframe {
        width: 100%;
        height: 100%;
    }
    
    /* Estado de tela cheia */
    .netflix-player:fullscreen {
        background: #000;
        width: 100vw;
        height: 100vh;
    }
    
    .netflix-player:fullscreen .video-wrapper {
        height: 100vh;
    }
    
    .netflix-player:fullscreen .player-controls {
        padding-bottom: 40px;
    }
    
    .netflix-player:fullscreen .control-btn {
        width: 45px;
        height: 45px;
        font-size: 18px;
    }
    
    .netflix-player:fullscreen .play-btn {
        width: 70px;
        height: 70px;
    }
    
    .netflix-player:fullscreen .play-btn i {
        font-size: 24px;
    }
    
    /* Modal de Vídeo */
    #video-modal .modal-content {
        background: #0A0A14;
        border: 3px solid #000080;
        padding: 0;
        box-shadow: 0 0 50px rgba(0, 0, 128, 0.5);
    }
    
    #video-modal .close-modal {
        position: absolute;
        top: 15px;
        right: 20px;
        background: rgba(255, 0, 0, 0.8);
        z-index: 100;
        color: white;
        border: 2px solid #FFFF99;
        transition: all 0.3s;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: bold;
    }
    
    #video-modal .close-modal:hover {
        background: #FF0000;
        border-color: white;
        transform: rotate(90deg) scale(1.1);
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
    }
    
    /* Esconder controles nativos de vídeo */
    .video-element::-webkit-media-controls {
        display: none !important;
    }
    
    /* Garantir que iframes não mostrem controles nativos */
    .mega-iframe::-webkit-media-controls,
    .youtube-iframe::-webkit-media-controls,
    .gdrive-iframe::-webkit-media-controls,
    .terabox-iframe::-webkit-media-controls,
    .fourshared-iframe::-webkit-media-controls {
        display: none !important;
    }
    
    /* Animações */
    @keyframes slideIn {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Tornar funções globais para uso no HTML
window.openLinkDirectly = openLinkDirectly;
window.testInNewTab = testInNewTab;
window.copyUrl = copyUrl;
window.editUserRole = editUserRole;
window.deleteUser = deleteUser;
window.editContent = editContent;
window.deleteContent = deleteContent;
window.toggleFullscreen = toggleFullscreen;
window.closeVideoPlayer = closeVideoPlayer;
window.togglePlayDirect = togglePlayDirect;
window.toggleVolumeSlider = toggleVolumeSlider;
window.seekVideoDirect = seekVideoDirect;
window.downloadNitroFlareFile = downloadNitroFlareFile;
window.openNitroFlareLink = openNitroFlareLink;
window.tryVideoStream = tryVideoStream;
window.openTelegramLink = openTelegramLink;
window.tryTelegramProxy = tryTelegramProxy;
window.downloadTelegramVideo = downloadTelegramVideo;
