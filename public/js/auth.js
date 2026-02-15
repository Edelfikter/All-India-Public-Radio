// Auth state management
let currentUser = null;

function initAuth() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  
  if (token && username) {
    currentUser = { username, token };
    updateAuthUI();
  }
}

function updateAuthUI() {
  const userInfo = document.getElementById('userInfo');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const createStationBtn = document.getElementById('createStationBtn');

  if (currentUser) {
    if (userInfo) userInfo.textContent = `👤 ${currentUser.username}`;
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (createStationBtn) createStationBtn.style.display = 'block';
  } else {
    if (userInfo) userInfo.textContent = '';
    if (loginBtn) loginBtn.style.display = 'block';
    if (registerBtn) registerBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (createStationBtn) createStationBtn.style.display = 'none';
  }
}

function showLoginModal() {
  document.getElementById('loginModal').classList.add('active');
  document.getElementById('loginError').textContent = '';
}

function showRegisterModal() {
  document.getElementById('registerModal').classList.add('active');
  document.getElementById('registerError').textContent = '';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

async function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password';
    return;
  }

  try {
    const response = await authAPI.login(username, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    localStorage.setItem('userId', response.userId);
    currentUser = { username: response.username, token: response.token };
    updateAuthUI();
    closeModal('loginModal');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
  } catch (error) {
    errorEl.textContent = error.message || 'Login failed';
  }
}

async function register() {
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const errorEl = document.getElementById('registerError');

  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password';
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters';
    return;
  }

  try {
    const response = await authAPI.register(username, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    localStorage.setItem('userId', response.userId);
    currentUser = { username: response.username, token: response.token };
    updateAuthUI();
    closeModal('registerModal');
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
  } catch (error) {
    errorEl.textContent = error.message || 'Registration failed';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
  currentUser = null;
  updateAuthUI();
  if (window.location.pathname.includes('/station/')) {
    window.location.href = '/';
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
