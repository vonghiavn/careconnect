// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'carenet_token';
const USER_KEY = 'carenet_user';

// Socket.IO Configuration
let socket = null;

// Initialize Socket.IO connection
function initSocket() {
    socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    
    socket.on('request:status_updated', (data) => {
        console.log('Request status updated:', data);
        loadUserDashboard();
    });
    
    socket.on('volunteer:location_updated', (data) => {
        console.log('Volunteer location updated:', data);
    });
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication Functions
async function login(email, password) {
    const data = await apiCall('/auth/login', 'POST', {
        email,
        password
    });
    
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data.user;
}

async function register(userData) {
    const data = await apiCall('/auth/register', 'POST', userData);
    
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data.user;
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.reload();
}

// UI State Management
function showAuthSection() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
}

function getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

function isLoggedIn() {
    return localStorage.getItem(TOKEN_KEY) !== null;
}

// Initialize App
function initApp() {
    if (isLoggedIn()) {
        showDashboard();
        loadUserDashboard();
        initSocket();
    } else {
        showAuthSection();
    }
}

function loadUserDashboard() {
    const user = getCurrentUser();
    
    // Hide all dashboards
    document.getElementById('familyDash').classList.add('hidden');
    document.getElementById('volunteerDash').classList.add('hidden');
    document.getElementById('elderlyDash').classList.add('hidden');
    
    // Show appropriate dashboard
    if (user.role === 'family') {
        document.getElementById('familyDash').classList.remove('hidden');
        loadFamilyDashboard();
    } else if (user.role === 'volunteer') {
        document.getElementById('volunteerDash').classList.remove('hidden');
        loadVolunteerDashboard();
    } else if (user.role === 'elderly') {
        document.getElementById('elderlyDash').classList.remove('hidden');
    }
}

async function loadFamilyDashboard() {
    try {
        const requests = await apiCall('/requests/my-requests');
        const requestsList = document.getElementById('requestsList');
        
        if (requests.length === 0) {
            requestsList.innerHTML = '<p class="text-gray-500">Không có yêu cầu</p>';
            return;
        }
        
        requestsList.innerHTML = requests.map(req => `
            <div class="p-4 border rounded-lg">
                <div class="flex justify-between">
                    <div>
                        <h3 class="font-bold">${req.service_type}</h3>
                        <p class="text-sm text-gray-600">Trạng thái: ${req.status}</p>
                        <p class="text-sm text-gray-600">Ngày dự kiến: ${new Date(req.preferred_date).toLocaleString('vi-VN')}</p>
                    </div>
                    <span class="px-3 py-1 rounded text-sm font-semibold ${
                        req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                    }">${req.status}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading family dashboard:', error);
    }
}

async function loadVolunteerDashboard() {
    try {
        const tasks = await apiCall('/requests/my-requests');
        const myTasksList = document.getElementById('myTasksList');
        
        if (tasks.length === 0) {
            myTasksList.innerHTML = '<p class="text-gray-500">Bạn chưa nhận công việc nào</p>';
            return;
        }
        
        myTasksList.innerHTML = tasks.map(task => `
            <div class="p-4 border rounded-lg">
                <h3 class="font-bold">${task.service_type}</h3>
                <p class="text-sm text-gray-600">Trạng thái: ${task.status}</p>
                <button class="mt-2 bg-emerald-600 text-white px-4 py-1 rounded text-sm" onclick="completeTask('${task.id}')">Hoàn thành</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading volunteer dashboard:', error);
    }
}

// Form Handlers
document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        await login(
            document.getElementById('loginEmail').value,
            document.getElementById('loginPassword').value
        );
        
        loadUserDashboard();
        showDashboard();
        initSocket();
    } catch (error) {
        alert('Đăng nhập không thành công: ' + error.message);
    }
});

document.getElementById('registerFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        await register({
            first_name: document.getElementById('registerFirstName').value,
            last_name: document.getElementById('registerLastName').value,
            email: document.getElementById('registerEmail').value,
            phone: document.getElementById('registerPhone').value,
            password: document.getElementById('registerPassword').value,
            role: document.getElementById('registerRole').value,
            address: document.getElementById('registerAddress')?.value || ''
        });
        
        loadUserDashboard();
        showDashboard();
        initSocket();
    } catch (error) {
        alert('Đăng ký không thành công: ' + error.message);
    }
});

document.getElementById('createRequestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        await apiCall('/requests', 'POST', {
            elderly_id: document.getElementById('elderlyId')?.value || getCurrentUser().id,
            service_type: document.getElementById('serviceType').value,
            description: document.getElementById('requestDescription').value,
            preferred_date: document.getElementById('preferredDate').value
        });
        
        alert('Yêu cầu được gửi thành công!');
        loadFamilyDashboard();
        document.getElementById('createRequestForm').reset();
    } catch (error) {
        alert('Gửi yêu cầu không thành công: ' + error.message);
    }
});

// Navigation
document.getElementById('navHome')?.addEventListener('click', () => {
    location.href = '/';
});

document.getElementById('navDashboard')?.addEventListener('click', () => {
    if (isLoggedIn()) {
        loadUserDashboard();
    }
});

document.getElementById('navLogout')?.addEventListener('click', () => {
    logout();
});

document.getElementById('switchToRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
});

document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
});

// Initialize app on load
document.addEventListener('DOMContentLoaded', initApp);
