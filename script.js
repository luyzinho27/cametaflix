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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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
const usersList = document.getElementById('users-list');
const usersTableBody = document.getElementById('users-table-body');
const featuredSection = document.getElementById('featured');
const featuredTitle = document.getElementById('featured-title');
const featuredDescription = document.getElementById('featured-description');
const playFeaturedBtn = document.getElementById('play-featured');
const infoFeaturedBtn = document.getElementById('info-featured');

// Variáveis globais
let currentUser = null;
let isAdmin = false;
let currentContent = [];
let featuredContent = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
goToRegister.addEventListener('click', () => switchScreen('register'));
goToLogin.addEventListener('click', () => switchScreen('login'));
logoutBtn.addEventListener('click', handleLogout);
closeModal.addEventListener('click', () => videoModal.classList.add('hidden'));
addContentBtn.addEventListener('click', () => {
    addContentForm.classList.toggle('hidden');
    usersList.classList.add('hidden');
});
viewUsersBtn.addEventListener('click', () => {
    usersList.classList.toggle('hidden');
    addContentForm.classList.add('hidden');
    if (!usersList.classList.contains('hidden')) {
        loadUsers();
    }
});
contentForm.addEventListener('submit', handleAddContent);
playFeaturedBtn.addEventListener('click', playFeaturedContent);

// Inicialização da aplicação
function initApp() {
    // Observador de estado de autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            userEmail.textContent = user.email;
            checkUserRole(user.uid);
            switchScreen('main');
            loadContent();
        } else {
            currentUser = null;
            switchScreen('login');
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
}

// Funções de autenticação
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showMessage('Login realizado com sucesso!', 'success');
        })
        .catch(error => {
            showMessage('Erro no login: ' + error.message, 'error');
        });
}

function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            
            // Verificar se é o primeiro usuário (admin)
            return db.collection('users').get().then(snapshot => {
                const userRole = snapshot.empty ? 'admin' : 'user';
                
                // Salvar informações do usuário no Firestore
                return db.collection('users').doc(user.uid).set({
                    email: user.email,
                    role: userRole,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        })
        .then(() => {
            showMessage('Cadastro realizado com sucesso!', 'success');
        })
        .catch(error => {
            showMessage('Erro no cadastro: ' + error.message, 'error');
        });
}

function handleLogout() {
    auth.signOut();
    showMessage('Logout realizado com sucesso!', 'success');
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
                    showMessage('Você está logado como administrador', 'success');
                } else {
                    adminPanelLink.classList.add('hidden');
                    adminPanel.classList.add('hidden');
                    showMessage('Login realizado com sucesso!', 'success');
                }
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

// Carregar conteúdo
function loadContent() {
    db.collection('content').get()
        .then(querySnapshot => {
            currentContent = [];
            contentGrid.innerHTML = '';
            
            querySnapshot.forEach(doc => {
                const content = doc.data();
                content.id = doc.id;
                currentContent.push(content);
                
                // Criar elemento de conteúdo
                const contentItem = document.createElement('div');
                contentItem.className = 'content-item';
                contentItem.innerHTML = `
                    <img src="${content.thumbnail}" alt="${content.title}">
                    <div class="content-info">
                        <h4>${content.title}</h4>
                        <p>${content.description.substring(0, 100)}...</p>
                    </div>
                `;
                
                contentItem.addEventListener('click', () => playContent(content));
                contentGrid.appendChild(contentItem);
            });
            
            // Definir conteúdo em destaque (primeiro da lista ou aleatório)
            if (currentContent.length > 0) {
                featuredContent = currentContent[0];
                updateFeaturedContent();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar conteúdo:', error);
        });
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
    }
}

// Reproduzir conteúdo
function playContent(content) {
    videoTitle.textContent = content.title;
    videoDescription.textContent = content.description;
    
    // Aqui você precisaria adaptar para obter o vídeo do Nitroflare
    // Por enquanto, usaremos um vídeo de exemplo
    videoPlayer.src = content.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    
    videoModal.classList.remove('hidden');
    videoPlayer.play();
}

// Adicionar conteúdo (admin)
function handleAddContent(e) {
    e.preventDefault();
    
    if (!isAdmin) {
        showMessage('Apenas administradores podem adicionar conteúdo.', 'error');
        return;
    }
    
    const title = document.getElementById('content-title').value;
    const description = document.getElementById('content-description').value;
    const thumbnail = document.getElementById('content-thumbnail').value;
    const videoUrl = document.getElementById('content-video-url').value;
    const category = document.getElementById('content-category').value;
    
    db.collection('content').add({
        title,
        description,
        thumbnail,
        videoUrl,
        category,
        addedBy: currentUser.uid,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        showMessage('Conteúdo adicionado com sucesso!', 'success');
        contentForm.reset();
        loadContent();
    })
    .catch(error => {
        showMessage('Erro ao adicionar conteúdo: ' + error.message, 'error');
    });
}

// Carregar lista de usuários (admin)
function loadUsers() {
    if (!isAdmin) return;
    
    db.collection('users').get()
        .then(querySnapshot => {
            usersTableBody.innerHTML = '';
            
            querySnapshot.forEach(doc => {
                const user = doc.data();
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td>${user.createdAt ? user.createdAt.toDate().toLocaleDateString('pt-BR') : 'N/A'}</td>
                `;
                
                usersTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
        });
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
        messageDiv.remove();
    }, 5000);
}

// Navegação
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remover classe active de todos os links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Adicionar classe active ao link clicado
        this.classList.add('active');
        
        const target = this.id;
        
        if (target === 'admin-panel-link') {
            adminPanel.classList.toggle('hidden');
        } else {
            adminPanel.classList.add('hidden');
            
            // Filtrar conteúdo por categoria
            if (target === 'home-link') {
                document.getElementById('section-title').textContent = 'Recomendados para Você';
                loadContent();
            } else if (target === 'movies-link') {
                document.getElementById('section-title').textContent = 'Filmes';
                filterContentByCategory('filmes');
            } else if (target === 'series-link') {
                document.getElementById('section-title').textContent = 'Séries';
                filterContentByCategory('series');
            }
        }
    });
});

// Filtrar conteúdo por categoria
function filterContentByCategory(category) {
    contentGrid.innerHTML = '';
    
    const filteredContent = currentContent.filter(item => item.category === category);
    
    if (filteredContent.length === 0) {
        contentGrid.innerHTML = '<p>Nenhum conteúdo encontrado nesta categoria.</p>';
        return;
    }
    
    filteredContent.forEach(content => {
        const contentItem = document.createElement('div');
        contentItem.className = 'content-item';
        contentItem.innerHTML = `
            <img src="${content.thumbnail}" alt="${content.title}">
            <div class="content-info">
                <h4>${content.title}</h4>
                <p>${content.description.substring(0, 100)}...</p>
            </div>
        `;
        
        contentItem.addEventListener('click', () => playContent(content));
        contentGrid.appendChild(contentItem);
    });

}
