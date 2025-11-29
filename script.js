// script.js
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

// Variáveis globais
let currentUser = null;
let isAdmin = false;
let currentContent = [];
let featuredContent = null;
let allUsers = [];
let nitroflareUserHash = "aa9201c9437878583820ba04bd16c94f8729ff6da"; // Hash do exemplo - substitua se necessário

// Função alternativa com proxy CORS (se necessário)
async function getUploadServerWithProxy() {
    try {
        // Usando um proxy CORS público (exemplo)
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const targetUrl = 'http://nitroflare.com/plugins/fileupload/getServer';
        
        const response = await fetch(proxyUrl + targetUrl);
        return await response.text();
    } catch (error) {
        // Fallback para requisição direta
        const response = await fetch('http://nitroflare.com/plugins/fileupload/getServer');
        return await response.text();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
goToRegister.addEventListener('click', () => switchScreen('register'));
goToLogin.addEventListener('click', () => switchScreen('login'));
logoutBtn.addEventListener('click', handleLogout);
closeModal.addEventListener('click', () => videoModal.classList.add('hidden'));
closeInfoModal.addEventListener('click', () => infoModal.classList.add('hidden'));
addContentBtn.addEventListener('click', () => toggleAdminSection('add-content'));
viewUsersBtn.addEventListener('click', () => toggleAdminSection('users'));
manageContentBtn.addEventListener('click', () => toggleAdminSection('manage-content'));
contentForm.addEventListener('submit', handleAddContent);
playFeaturedBtn.addEventListener('click', playFeaturedContent);
infoFeaturedBtn.addEventListener('click', showFeaturedInfo);

// Fechar modal ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === videoModal) videoModal.classList.add('hidden');
    if (e.target === infoModal) infoModal.classList.add('hidden');
});


// Adicione estes event listeners
document.getElementById('upload-content-btn').addEventListener('click', () => toggleAdminSection('upload'));
document.getElementById('upload-form').addEventListener('submit', handleNitroflareUpload);

// Atualize a função toggleAdminSection para incluir a seção de upload
function toggleAdminSection(section) {
    addContentForm.classList.add('hidden');
    usersList.classList.add('hidden');
    manageContent.classList.add('hidden');
    uploadSection.classList.add('hidden');
    
    switch(section) {
        case 'add-content':
            addContentForm.classList.remove('hidden');
            break;
        case 'users':
            usersList.classList.remove('hidden');
            loadUsers();
            break;
        case 'manage-content':
            manageContent.classList.remove('hidden');
            loadContentForManagement();
            break;
        case 'upload':
            uploadSection.classList.remove('hidden');
            break;
    }
}

// Função principal de upload para Nitroflare
async function handleNitroflareUpload(e) {
    e.preventDefault();
    
    if (!isAdmin) {
        showMessage('Apenas administradores podem fazer upload.', 'error');
        return;
    }

    const fileInput = document.getElementById('video-file');
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    const thumbnail = document.getElementById('upload-thumbnail').value;
    const category = document.getElementById('upload-category').value;
    
    // Validações
    if (!fileInput.files.length) {
        showMessage('Por favor, selecione um arquivo de vídeo.', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('video/')) {
        showMessage('Por favor, selecione um arquivo de vídeo válido.', 'error');
        return;
    }
    
    // Validar tamanho do arquivo (limite de 500MB para exemplo)
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
    
    // Mostrar progresso
    uploadProgress.classList.remove('hidden');
    
    try {
        // Passo 1: Obter servidor de upload
        updateProgress(10, 'Obtendo servidor de upload...');
        const serverResponse = await fetch('http://nitroflare.com/plugins/fileupload/getServer');
        const targetUrl = await serverResponse.text();
        
        if (!targetUrl.startsWith('http')) {
            throw new Error('Resposta inválida do servidor de upload');
        }
        
        // Passo 2: Preparar formulário para upload
        updateProgress(30, 'Preparando upload...');
        const formData = new FormData();
        formData.append('user', nitroflareUserHash);
        formData.append('files', file);
        
        // Passo 3: Fazer upload usando XMLHttpRequest para suporte a progresso
        updateProgress(50, 'Fazendo upload do arquivo...');
        
        const uploadResult = await uploadWithProgress(targetUrl, formData, (progress) => {
            const uploadPercent = 50 + (progress * 0.4); // 50% a 90%
            updateProgress(uploadPercent, `Upload: ${Math.round(progress)}%`);
        });
        
        // Passo 4: Processar resposta
        updateProgress(90, 'Processando resposta...');
        const result = JSON.parse(uploadResult);
        
        if (result && result.files && result.files.length > 0) {
            const uploadedFile = result.files[0];
            
            // Passo 5: Salvar no Firestore
            updateProgress(95, 'Salvando informações...');
            await saveContentToFirestore(title, description, thumbnail, uploadedFile.url, category);
            
            updateProgress(100, 'Upload concluído com sucesso!');
            showMessage('Upload realizado e conteúdo adicionado com sucesso!', 'success');
            
            // Limpar formulário
            document.getElementById('upload-form').reset();
            uploadProgress.classList.add('hidden');
            
            // Recarregar conteúdo
            setTimeout(() => {
                loadContent();
                hideLoading();
            }, 1000);
            
        } else {
            throw new Error('Resposta inválida do servidor de upload');
        }
        
    } catch (error) {
        uploadProgress.classList.add('hidden');
        throw error;
    }
}

// Função para upload com acompanhamento de progresso
function uploadWithProgress(url, formData, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                onProgress(percentComplete);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                resolve(xhr.responseText);
            } else {
                reject(new Error(`Upload falhou com status: ${xhr.status}`));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Erro de conexão durante o upload'));
        });
        
        xhr.open('POST', url);
        xhr.send(formData);
    });
}

// Função para salvar conteúdo no Firestore após upload
async function saveContentToFirestore(title, description, thumbnail, videoUrl, category) {
    const contentData = {
        title,
        description,
        thumbnail,
        videoUrl,
        category,
        addedBy: currentUser.uid,
        addedAt: firebase.firestore.FieldValue.serverTimestamp(),
        source: 'nitroflare',
        uploadDate: new Date().toISOString()
    };
    
    await db.collection('content').add(contentData);
}

// Função para atualizar a barra de progresso
function updateProgress(percent, text) {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

// Função alternativa para upload direto (sem Nitroflare) - para fallback
async function handleDirectUpload(e) {
    e.preventDefault();
    
    if (!isAdmin) {
        showMessage('Apenas administradores podem fazer upload.', 'error');
        return;
    }

    const fileInput = document.getElementById('video-file');
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    const thumbnail = document.getElementById('upload-thumbnail').value;
    const category = document.getElementById('upload-category').value;
    
    if (!fileInput.files.length) {
        showMessage('Por favor, selecione um arquivo de vídeo.', 'error');
        return;
    }
    
    // Para upload direto, você precisaria de um servidor próprio
    // Esta é uma implementação simplificada
    showMessage('Upload direto requer configuração de servidor próprio.', 'warning');
}

// Função para obter informações do arquivo antes do upload
function displayFileInfo() {
    const fileInput = document.getElementById('video-file');
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileInfo.innerHTML = `
            <strong>Informações do Arquivo:</strong><br>
            Nome: ${file.name}<br>
            Tamanho: ${(file.size / (1024 * 1024)).toFixed(2)} MB<br>
            Tipo: ${file.type}
        `;
        
        // Remove info anterior se existir
        const existingInfo = document.querySelector('.file-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        fileInput.parentNode.appendChild(fileInfo);
    }
}

// Adicione este event listener para mostrar informações do arquivo
document.getElementById('video-file').addEventListener('change', displayFileInfo);

// Função para testar a conexão com a API do Nitroflare
async function testNitroflareConnection() {
    try {
        showLoading();
        const response = await fetch('http://nitroflare.com/plugins/fileupload/getServer');
        const serverUrl = await response.text();
        
        if (serverUrl && serverUrl.startsWith('http')) {
            showMessage('Conexão com Nitroflare estabelecida com sucesso!', 'success');
        } else {
            showMessage('Resposta inesperada da API do Nitroflare', 'warning');
        }
    } catch (error) {
        showMessage('Erro ao conectar com Nitroflare: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Adicione um botão de teste de conexão se necessário
function addConnectionTestButton() {
    const testBtn = document.createElement('button');
    testBtn.type = 'button';
    testBtn.className = 'btn-secondary';
    testBtn.textContent = 'Testar Conexão Nitroflare';
    testBtn.onclick = testNitroflareConnection;
    
    const uploadSection = document.getElementById('upload-section');
    uploadSection.querySelector('form').appendChild(testBtn);
}

// Inicializar a seção de upload quando o admin fizer login
function initUploadSection() {
    // Esta função pode ser chamada após o login do admin
    addConnectionTestButton();
}

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
            });
    } else {
        currentUser = null;
        switchScreen('login');
    }
    hideLoading();
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

    // Navegação entre seções
    setupNavigation();
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
            return firebase.firestore().collection('users').get().then(snapshot => {
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
                // FORÇAR a criação com .set() em vez de .add()
                return firebase.firestore().collection('users').doc(user.uid).set(userData);
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


function ensureUserInFirestore(uid) {
    return firebase.firestore().collection('users').doc(uid).get()
        .then(doc => {
            if (!doc.exists) {
                console.log('📝 Criando documento para usuário faltante:', uid);
                
                const user = firebase.auth().currentUser;
                const userData = {
                    email: user.email,
                    role: 'user', // Por padrão é user
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                    autoCreated: true
                };
                
                return firebase.firestore().collection('users').doc(uid).set(userData);
            }
            return doc;
        });
}

function checkUserRole(uid) {
    db.collection('users').doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                isAdmin = userData.role === 'admin';
                
                if (isAdmin) {
                    adminPanelLink.classList.remove('hidden');
                    showMessage('Você está logado como administrador', 'success');
                } else {
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
            console.error('Erro ao verificar papel do usuário:', error);
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
            document.getElementById('section-title').textContent = 'Recomendados para Você';
            loadContent();
            break;
        case 'movies-link':
            document.getElementById('section-title').textContent = 'Filmes';
            filterContentByCategory('filmes');
            break;
        case 'series-link':
            document.getElementById('section-title').textContent = 'Séries';
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
    // Esconder todas as seções
    addContentForm.classList.add('hidden');
    usersList.classList.add('hidden');
    manageContent.classList.add('hidden');
    
    // Mostrar a seção selecionada
    switch(section) {
        case 'add-content':
            addContentForm.classList.remove('hidden');
            break;
        case 'users':
            usersList.classList.remove('hidden');
            loadUsers();
            break;
        case 'manage-content':
            manageContent.classList.remove('hidden');
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
        <img src="${content.thumbnail}" alt="${content.title}" onerror="this.src='https://via.placeholder.com/300x450/333333/FFFFFF?text=Imagem+Não+Disponível'">
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
        featuredSection.style.backgroundImage = `linear-gradient(to top, var(--bg-dark) 0%, transparent 50%), url('${featuredContent.thumbnail}')`;
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

// Reproduzir conteúdo
function playContent(content) {
    videoTitle.textContent = content.title;
    videoDescription.textContent = content.description;
    
    // Verificar se é uma URL do Nitroflare ou URL direta de vídeo
    let videoSource = content.videoUrl;
    
    // Se for URL do Nitroflare, precisaríamos de uma solução específica
    // Por enquanto, usamos URLs diretas de vídeo para demonstração
    if (content.videoUrl.includes('nitroflare')) {
        showMessage('Conteúdo do Nitroflare - Integração específica necessária', 'warning');
        // Aqui você implementaria a lógica específica para Nitroflare
        videoSource = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }
    
    videoPlayer.src = videoSource;
    videoModal.classList.remove('hidden');
    videoPlayer.play().catch(e => {
        console.error('Erro ao reproduzir vídeo:', e);
        showMessage('Erro ao reproduzir vídeo. Verifique a URL.', 'error');
    });
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

// Carregar lista de usuários (admin)
function loadUsers() {
    if (!isAdmin) return;
    showLoading();
    
    db.collection('users').orderBy('createdAt', 'desc').get()
        .then(querySnapshot => {
            usersTableBody.innerHTML = '';
            allUsers = [];
            
            if (querySnapshot.empty) {
                usersTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum usuário cadastrado</td></tr>';
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
                    <td>${user.role}</td>
                    <td>${user.createdAt ? user.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td class="action-buttons">
                        ${user.role !== 'admin' ? `<button class="btn-danger btn-small" onclick="deleteUser('${user.id}')">Excluir</button>` : '<span class="text-secondary">Admin</span>'}
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
                contentTableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum conteúdo cadastrado</td></tr>';
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
                    <td>${content.category === 'filmes' ? 'Filme' : 'Série'}</td>
                    <td>${content.addedAt ? content.addedAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                    <td class="action-buttons">
                        <button class="btn-secondary btn-small" onclick="editContent('${content.id}')">Editar</button>
                        <button class="btn-danger btn-small" onclick="deleteContent('${content.id}')">Excluir</button>
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
    // Implementação básica de edição - poderia ser expandida
    const content = currentContent.find(c => c.id === contentId);
    if (content) {
        document.getElementById('content-title').value = content.title;
        document.getElementById('content-description').value = content.description;
        document.getElementById('content-thumbnail').value = content.thumbnail;
        document.getElementById('content-video-url').value = content.videoUrl;
        document.getElementById('content-category').value = content.category;
        
        // Scroll para o formulário
        addContentForm.classList.remove('hidden');
        usersList.classList.add('hidden');
        manageContent.classList.add('hidden');
        addContentForm.scrollIntoView({ behavior: 'smooth' });
        
        showMessage('Preencha os campos e clique em "Adicionar Conteúdo" para atualizar. Nota: Esta é uma demonstração - em produção, implemente a edição completa.', 'warning');
    }
}

// Mostrar mensagens
function showMessage(message, type) {
    // Remove mensagens anteriores
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;
    
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

// Loading functions
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

// Inicializar dados de exemplo se necessário
function initializeSampleData() {
    // Esta função pode ser usada para adicionar dados de exemplo
    // Remova ou adapte conforme necessário
}

// Prevenir envio de formulário com Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const target = e.target;
        if (target.form && target.type !== 'textarea') {
            e.preventDefault();
        }
    }
});


