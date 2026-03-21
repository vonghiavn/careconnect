// API Configuration
// Auto-detect API URL: use environment variable or auto-detect from current domain
const getApiBaseUrl = () => {
    // For development: http://localhost:8000 frontend talks to http://localhost:5000 backend
    // For production: same domain serves both frontend and backend
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost && window.location.port === '8000') {
        // Local development: frontend on 8000, backend on 5000
        return 'http://localhost:5000/api';
    } else {
        // Production: same domain for both
        return window.location.origin + '/api';
    }
};

const getSocketUrl = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost && window.location.port === '8000') {
        // Local development
        return 'http://localhost:5000';
    } else {
        // Production: same domain
        return window.location.origin;
    }
};

const API_BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'carenet_token';
const USER_KEY = 'carenet_user';
const ROLE_KEY = 'carenet_role';
const ACCEPTED_TASKS_KEY = 'carenet_accepted_tasks';
const USER_REQUESTS_KEY = 'carenet_user_requests';
const TOTAL_EARNINGS_KEY = 'carenet_total_earnings';
const COMPLETED_TASKS_KEY = 'carenet_completed_tasks';
const VOLUNTEER_RATINGS_KEY = 'carenet_volunteer_ratings';
const VOLUNTEER_HISTORY_KEY = 'carenet_volunteer_history';
const REQUESTS_PAGE_KEY = 'carenet_requests_page';
const AVAILABLE_TASKS_PAGE_KEY = 'carenet_available_tasks_page';
const MY_TASKS_PAGE_KEY = 'carenet_my_tasks_page';
const HISTORY_PAGE_KEY = 'carenet_history_page';
const ITEMS_PER_PAGE = 5;

function getScopedKey(key) {
    const user = getCurrentUser();
    return user ? `${key}_${user.username}` : key;
}

// Socket.IO Configuration
let socket = null;

// ========== DATA MANAGEMENT ==========

function getTotalEarnings() {
    const key = getScopedKey(TOTAL_EARNINGS_KEY);
    const earnings = localStorage.getItem(key);
    return earnings ? parseFloat(earnings) : 0;
}

function setTotalEarnings(amount) {
    const key = getScopedKey(TOTAL_EARNINGS_KEY);
    localStorage.setItem(key, amount.toString());
}

function addEarnings(amount) {
    const current = getTotalEarnings();
    setTotalEarnings(current + amount);
}

function getEarningsForVolunteer(volunteerUsername) {
    if (!volunteerUsername) return 0;
    const key = `${TOTAL_EARNINGS_KEY}_${volunteerUsername}`;
    const earnings = localStorage.getItem(key);
    return earnings ? parseFloat(earnings) : 0;
}

function setEarningsForVolunteer(volunteerUsername, amount) {
    if (!volunteerUsername) return;
    const key = `${TOTAL_EARNINGS_KEY}_${volunteerUsername}`;
    localStorage.setItem(key, amount.toString());
}

function addEarningsForVolunteer(volunteerUsername, amount) {
    if (!volunteerUsername) return;
    const current = getEarningsForVolunteer(volunteerUsername);
    setEarningsForVolunteer(volunteerUsername, current + amount);
}

function getCompletedTasks() {
    const key = getScopedKey(COMPLETED_TASKS_KEY);
    const completed = localStorage.getItem(key);
    return completed ? parseInt(completed) : 0;
}

function setCompletedTasks(count) {
    const key = getScopedKey(COMPLETED_TASKS_KEY);
    localStorage.setItem(key, count.toString());
}

function incrementCompletedTasks() {
    const current = getCompletedTasks();
    setCompletedTasks(current + 1);
}

function getVolunteerRatings() {
    const ratings = localStorage.getItem(VOLUNTEER_RATINGS_KEY);
    return ratings ? JSON.parse(ratings) : {};
}

function setVolunteerRatings(ratings) {
    localStorage.setItem(VOLUNTEER_RATINGS_KEY, JSON.stringify(ratings));
}

function getVolunteerHistory(username) {
    const target = username || getCurrentUser()?.username;
    if (!target) return [];
    const key = `${VOLUNTEER_HISTORY_KEY}_${target}`;
    const history = localStorage.getItem(key);
    return history ? JSON.parse(history) : [];
}

function setVolunteerHistory(username, history) {
    const target = username || getCurrentUser()?.username;
    if (!target) return;
    const key = `${VOLUNTEER_HISTORY_KEY}_${target}`;
    localStorage.setItem(key, JSON.stringify(history));
}

function addVolunteerHistoryEntry(username, entry) {
    const target = username || getCurrentUser()?.username;
    if (!target) return;
    const history = getVolunteerHistory(target);
    history.unshift(entry); // latest first
    setVolunteerHistory(target, history);
}

function addVolunteerRating(volunteerUsername, rating) {
    const ratings = getVolunteerRatings();
    if (!ratings[volunteerUsername]) {
        ratings[volunteerUsername] = { total: 0, count: 0 };
    }
    ratings[volunteerUsername].total += parseFloat(rating);
    ratings[volunteerUsername].count += 1;
    setVolunteerRatings(ratings);
}

function getVolunteerAverageRating(volunteerUsername) {
    const ratings = getVolunteerRatings();
    if (ratings[volunteerUsername] && ratings[volunteerUsername].count > 0) {
        return (ratings[volunteerUsername].total / ratings[volunteerUsername].count).toFixed(1);
    }
    return '5.0';
}

function getCurrentPage() {
    const page = localStorage.getItem(REQUESTS_PAGE_KEY);
    return page ? parseInt(page) : 1;
}

function setCurrentPage(page) {
    localStorage.setItem(REQUESTS_PAGE_KEY, page.toString());
}

// Pagination helpers for volunteer dashboard
function getVolunteerPage(pageKey) {
    const page = localStorage.getItem(pageKey);
    return page ? parseInt(page) : 1;
}

function setVolunteerPage(pageKey, page) {
    localStorage.setItem(pageKey, page.toString());
}

function getPaginatedItems(items, pageKey) {
    const currentPage = getVolunteerPage(pageKey);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return {
        items: items.slice(startIndex, endIndex),
        currentPage: currentPage,
        totalPages: Math.ceil(items.length / ITEMS_PER_PAGE),
        totalItems: items.length
    };
}

function renderPaginationButtons(paginationContainerId, pageKey, totalPages) {
    const container = document.getElementById(paginationContainerId);
    if (!container) return;
    
    const currentPage = getVolunteerPage(pageKey);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">${i}</button>`;
        } else {
            html += `<button onclick="goToVolunteerPage('${pageKey}', ${i})" class="px-4 py-2 border-2 border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">${i}</button>`;
        }
    }
    
    container.innerHTML = html;
}

function goToVolunteerPage(pageKey, page) {
    setVolunteerPage(pageKey, page);
    loadVolunteerDashboard();
}

function getAcceptedTasks() {
    const key = getScopedKey(ACCEPTED_TASKS_KEY);
    const tasks = localStorage.getItem(key);
    return tasks ? JSON.parse(tasks) : [];
}

function setAcceptedTasks(tasks) {
    const key = getScopedKey(ACCEPTED_TASKS_KEY);
    localStorage.setItem(key, JSON.stringify(tasks));
}

function addAcceptedTask(task) {
    const tasks = getAcceptedTasks();
    tasks.push(task);
    setAcceptedTasks(tasks);
}

function removeAcceptedTask(taskId) {
    const tasks = getAcceptedTasks();
    setAcceptedTasks(tasks.filter(t => t.id !== taskId));
}

function getAllRequests() {
    const requests = localStorage.getItem(USER_REQUESTS_KEY);
    return requests ? JSON.parse(requests) : [];
}

function setAllRequests(requests) {
    localStorage.setItem(USER_REQUESTS_KEY, JSON.stringify(requests));
}

function getUserRequests() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    const allRequests = getAllRequests();

    if (currentUser.role === 'volunteer') {
        // Volunteers see all pending requests
        return allRequests;
    }

    // Elderly/family see only their own requests
    return allRequests.filter(req => req.elderly_username === currentUser.username);
}

function addUserRequest(request) {
    const requests = getAllRequests();
    requests.push(request);
    setAllRequests(requests);
}

function updateUserRequest(requestId, updates) {
    const requests = getAllRequests();
    const updatedRequests = requests.map(req => 
        req.id === requestId ? {...req, ...updates} : req
    );
    setAllRequests(updatedRequests);
}

// Initialize Socket.IO connection
function initSocket() {
    socket = io(getSocketUrl(), {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// ========== STATE MANAGEMENT ==========

function isLoggedIn() {
    return localStorage.getItem(USER_KEY) !== null;
}

function getCurrentUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
}

function getCurrentRole() {
    return localStorage.getItem(ROLE_KEY);
}

function login(username, password, role) {
    // Any username and password works - just store the role and username
    const user = {
        username: username,
        email: username + '@careconnect.local',
        role: role
    };
    
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(ROLE_KEY, role);
    localStorage.setItem(TOKEN_KEY, 'demo-token-' + Date.now());
    
    return user;
}

function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    location.reload();
}

// ========== UI NAVIGATION ==========

function showLanding() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('userGreeting').textContent = 'Welcome';
    document.getElementById('userGreeting').classList.add('hidden');
    document.getElementById('navLogout').classList.add('hidden');
}

function showLogin() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('navbar').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('landingPage').classList.add('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    
    // Show navbar greeting
    const user = getCurrentUser();
    document.getElementById('userGreeting').textContent = `Welcome, ${user.username}!`;
    document.getElementById('userGreeting').classList.remove('hidden');
    document.getElementById('navLogout').classList.remove('hidden');
    
    loadUserDashboard();
    initSocket();
}

function loadUserDashboard() {
    const role = getCurrentRole();
    
    // Reset pagination to page 1 when loading dashboard
    setCurrentPage(1);
    
    // Hide all dashboards
    document.getElementById('familyDash').classList.add('hidden');
    document.getElementById('volunteerDash').classList.add('hidden');
    document.getElementById('elderlyDash').classList.add('hidden');
    
    // Show appropriate dashboard
    // Note: "elderly" role now includes both elderly persons and family members
    if (role === 'elderly') {
        document.getElementById('familyDash').classList.remove('hidden');
        loadFamilyDashboard();
    } else if (role === 'volunteer') {
        document.getElementById('volunteerDash').classList.remove('hidden');
        loadVolunteerDashboard();
    }
}

// ========== FAMILY DASHBOARD ==========

function loadFamilyDashboard() {
    // Get user requests from localStorage
    let userRequests = getUserRequests();
    // Sort by newest first (reverse order by timestamp or ID)
    userRequests = userRequests.reverse();
    const completedCount = userRequests.filter(req => req.status === 'completed').length;
    
    document.getElementById('statTotalRequests').textContent = userRequests.length;
    document.getElementById('statCompleted').textContent = completedCount;
    
    // Service pricing
    const servicePricing = {
        'medical': '$45',
        'errands': '$30',
        'companionship': '$25'
    };
    
    // Pagination
    const currentPage = getCurrentPage();
    const totalPages = Math.ceil(userRequests.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedRequests = userRequests.slice(startIndex, endIndex);
    
    const requestsList = document.getElementById('requestsList');
    const paginationDiv = document.getElementById('requestsPagination');
    
    if (userRequests.length === 0) {
        requestsList.innerHTML = `<div class="text-center py-8"><p class="text-gray-500 text-lg">No requests yet</p><p class="text-gray-400">Create your first request above</p></div>`;
        if (paginationDiv) paginationDiv.innerHTML = '';
    } else {
        requestsList.innerHTML = paginatedRequests.map(req => {
            const serviceEmoji = req.service_type === 'medical' ? '🏥' : 
                                req.service_type === 'errands' ? '🛒' : '💬';
            const statusColor = req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                               req.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                               'bg-green-100 text-green-800';
            const pricing = servicePricing[req.service_type] || '$0';
            const volunteerDisplay = req.volunteer_username ? `${req.volunteer_username} ⭐ ${req.volunteer_rating || '5.0'}` : 'Awaiting volunteer';
            
            return `
                <div class="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-lg font-bold">${serviceEmoji} ${req.service_type.charAt(0).toUpperCase() + req.service_type.slice(1)}</h3>
                            <p class="text-gray-600">Address: ${req.address}</p>
                            <p class="text-gray-600">Volunteer: ${volunteerDisplay}</p>
                            <p class="text-emerald-600 font-bold mt-2">Price: ${pricing}</p>
                        </div>
                        <span class="px-4 py-2 rounded-full text-sm font-semibold ${statusColor}">
                            ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600">📅 ${new Date(req.preferred_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                    <div class="flex gap-2 mt-3">
                        ${req.status === 'completed' ? `<button onclick="showRateAndTip('${req.id}')" class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 font-semibold transition">Rate & Tip</button>` : ''}
                        ${req.status === 'pending' ? `
                            <button onclick="editRequest('${req.id}')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold transition">Edit</button>
                            <button onclick="cancelRequest('${req.id}')" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition">Cancel</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Render pagination
        if (totalPages > 1 && paginationDiv) {
            let paginationHTML = '<div class="flex justify-center gap-2 mt-6">';
            for (let i = 1; i <= totalPages; i++) {
                const isActive = i === currentPage;
                paginationHTML += `
                    <button onclick="goToPage(${i})" class="px-4 py-2 rounded font-semibold ${isActive ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} transition">
                        ${i}
                    </button>
                `;
            }
            paginationHTML += '</div>';
            paginationDiv.innerHTML = paginationHTML;
        }
    }
    
    // Render personal info
    renderFamilyPersonalInfo();
}

function goToPage(pageNumber) {
    setCurrentPage(pageNumber);
    loadFamilyDashboard();
    // Scroll to requests section
    document.getElementById('requestsList').scrollIntoView({ behavior: 'smooth' });
}

// ========== VOLUNTEER DASHBOARD ==========

function loadVolunteerDashboard() {
    // Demo stats
    const acceptedTasks = getAcceptedTasks();
    const userRequests = getUserRequests();
    const currentUser = getCurrentUser();
    
    // Filter pending requests - exclude ones canceled by current volunteer
    const pendingRequests = userRequests.filter(req => 
        req.status === 'pending' && (!req.canceled_by || req.canceled_by !== currentUser.username)
    );
    
    const totalEarnings = getTotalEarnings();
    const completedTasksCount = getCompletedTasks();
    const volunteerRating = getVolunteerAverageRating(currentUser.username);
    
    document.getElementById('statAvailable').textContent = pendingRequests.length;
    document.getElementById('statVolunteerCompleted').textContent = completedTasksCount;
    document.getElementById('statRating').textContent = volunteerRating;
    document.getElementById('statTips').textContent = '$' + totalEarnings.toFixed(2);
    
    // Display pending requests from service users in Available Tasks with pagination
    const availableList = document.getElementById('availableTasksList');
    if (pendingRequests.length === 0) {
        availableList.innerHTML = '<div class="text-center py-8"><p class="text-gray-500 text-lg">No tasks available right now</p><p class="text-gray-400">Check back soon when new requests come in!</p></div>';
        renderPaginationButtons('availableTasksPagination', AVAILABLE_TASKS_PAGE_KEY, 0);
    } else {
        const paginated = getPaginatedItems(pendingRequests, AVAILABLE_TASKS_PAGE_KEY);
        availableList.innerHTML = paginated.items.map(request => {
            const serviceEmoji = request.service_type === 'medical' ? '🏥' : 
                                request.service_type === 'errands' ? '🛒' : '💬';
            const servicePricing = {
                'medical': '$45',
                'errands': '$30',
                'companionship': '$25'
            };
            const timeStr = new Date(request.preferred_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'});
            
            return `
                <div class="p-6 border-2 border-blue-200 rounded-lg hover:shadow-md transition bg-blue-50">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold">${serviceEmoji} ${request.service_type.charAt(0).toUpperCase() + request.service_type.slice(1)}</h3>
                            <p class="text-blue-700 font-semibold mt-2">👤 Service User: ${request.elderly_username || 'Unknown'}</p>
                            <p class="text-gray-600 mt-2">${request.description || 'No description provided'}</p>
                            <div class="flex flex-col gap-2 mt-3 text-sm text-gray-600">
                                <span>📍 ${request.address}</span>
                                <span>🕒 ${timeStr}</span>
                                <span class="text-emerald-600 font-bold">💰 ${servicePricing[request.service_type] || '$0'}</span>
                            </div>
                            <span class="inline-block mt-3 px-3 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">🆕 NEW REQUEST</span>
                        </div>
                        <div class="flex gap-2 whitespace-nowrap flex-col">
                            <button onclick="detailRequest('${request.id}')" class="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                                Details
                            </button>
                            <button onclick="acceptRequest('${request.id}', '${request.service_type}', '${request.preferred_date}', '${request.address}')" class="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        renderPaginationButtons('availableTasksPagination', AVAILABLE_TASKS_PAGE_KEY, paginated.totalPages);
    }
    
    // Display accepted tasks in "My Tasks" with pagination
    const myTasksList = document.getElementById('myTasksList');
    if (acceptedTasks.length === 0) {
        myTasksList.innerHTML = '<p class="text-center py-8 text-gray-500">No active tasks</p>';
        renderPaginationButtons('myTasksPagination', MY_TASKS_PAGE_KEY, 0);
    } else {
        const paginated = getPaginatedItems(acceptedTasks, MY_TASKS_PAGE_KEY);
        myTasksList.innerHTML = paginated.items.map(task => `
            <div class="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-bold">${task.elderly_name}</h3>
                        <p class="text-gray-600">${task.service_type.charAt(0).toUpperCase() + task.service_type.slice(1)} Service</p>
                        <p class="text-green-700 font-semibold mt-2">⏰ ${new Date(task.preferredTime).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                        <p class="text-gray-600 text-sm mt-2">📍 ${task.address}</p>
                    </div>
                    <div class="flex gap-2 whitespace-nowrap">
                        <button onclick="completeTask('${task.id}')" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                            Mark Complete
                        </button>
                        <button onclick="cancelTask('${task.id}')" class="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        renderPaginationButtons('myTasksPagination', MY_TASKS_PAGE_KEY, paginated.totalPages);
    }

    renderVolunteerHistory();
    renderVolunteerPersonalInfo();
}

function renderVolunteerHistory() {
    const history = getVolunteerHistory();
    const historyList = document.getElementById('volunteerHistoryList');
    if (!historyList) return;

    if (!history || history.length === 0) {
        historyList.innerHTML = '<div class="text-center py-8"><p class="text-gray-500 text-lg">No history yet</p><p class="text-gray-400">Complete tasks or receive tips to see history entries.</p></div>';
        renderPaginationButtons('historyPagination', HISTORY_PAGE_KEY, 0);
        return;
    }

    const paginated = getPaginatedItems(history, HISTORY_PAGE_KEY);
    historyList.innerHTML = paginated.items.map(item => {
        let desc = '';
        if (item.type === 'completed') {
            desc = `✅ Completed ${item.serviceType} task (Earned $${item.amount.toFixed(2)})`;
        } else if (item.type === 'canceled') {
            desc = `❌ Canceled ${item.serviceType} task (Reason: ${item.reason || 'n/a'})`;
        } else if (item.type === 'tip') {
            desc = `💰 Tip received $${item.amount.toFixed(2)} from ${item.from}`;
        }

        return `
            <div class="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p class="text-sm text-gray-700">${desc}</p>
                <p class="text-xs text-gray-500 mt-1">${new Date(item.timestamp).toLocaleString()}</p>
            </div>
        `;
    }).join('');
    renderPaginationButtons('historyPagination', HISTORY_PAGE_KEY, paginated.totalPages);
}

// ========== ELDERLY DASHBOARD ==========

function loadElderlyDashboard() {
    document.getElementById('nextApptDate').textContent = 'March 25, 2024';
    document.getElementById('nextApptType').textContent = '🏥 Medical Appointment';
    document.getElementById('currentCaregiver').textContent = 'Jane Smith';
    document.getElementById('caregiverRating').textContent = '⭐ 4.8 stars';
    
    const careHistory = [
        {
            date: 'March 20, 2024',
            type: 'medical',
            caregiver: 'John Doe',
            rating: '5.0'
        },
        {
            date: 'March 18, 2024',
            type: 'errands',
            caregiver: 'Sarah Miller',
            rating: '4.9'
        }
    ];
    
    const historyDiv = document.getElementById('careHistory');
    historyDiv.innerHTML = careHistory.map(item => `
        <div class="p-4 border-l-4 border-emerald-500 bg-emerald-50 rounded">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold">${item.type === 'medical' ? '🏥 Medical' : '🛒 Errands'}</p>
                    <p class="text-gray-600 text-sm">Caregiver: ${item.caregiver}</p>
                    <p class="text-gray-500 text-sm">${item.date}</p>
                </div>
                <span class="text-yellow-500">⭐ ${item.rating}</span>
            </div>
        </div>
    `).join('');
}

// ========== ACTION HANDLERS ==========

function acceptRequest(requestId, serviceType, preferredTime, address) {
    // Find the request
    const userRequests = getUserRequests();
    const request = userRequests.find(req => req.id === requestId);
    const currentUser = getCurrentUser();
    
    if (!request) {
        alert('❌ Request not found');
        return;
    }
    
    // Service pricing
    const servicePricing = {
        'medical': 45,
        'errands': 30,
        'companionship': 25
    };
    
    const earnAmount = servicePricing[serviceType] || 0;
    
    // Add to accepted tasks with earning amount
    const task = {
        id: requestId,
        elderly_name: 'Service Request',
        service_type: serviceType,
        preferredTime: preferredTime,
        address: address,
        request_id: requestId,
        earn: earnAmount
    };
    addAcceptedTask(task);
    
    // Update request status to in_progress and store volunteer username
    const allRequests = getAllRequests();
    const updatedRequests = allRequests.map(req => 
        req.id === requestId ? {...req, status: 'in_progress', volunteer_username: currentUser.username} : req
    );
    setAllRequests(updatedRequests);
    
    alert('✅ Task accepted! The request has been moved to "My Tasks".');
    loadVolunteerDashboard();
}

function detailRequest(requestId) {
    const userRequests = getUserRequests();
    const request = userRequests.find(req => req.id === requestId);
    
    if (!request) {
        alert('❌ Request not found');
        return;
    }
    
    const details = `
📋 SERVICE REQUEST DETAILS
═══════════════════════════
Type: ${request.service_type.toUpperCase()}
Address: ${request.address}
Time: ${new Date(request.preferred_date).toLocaleString()}
Description: ${request.description}
Status: ${request.status}
    `;
    alert(details);
}

function completeTask(taskId) {
    const acceptedTasks = getAcceptedTasks();
    const task = acceptedTasks.find(t => t.id === taskId);
    const currentUser = getCurrentUser();
    
    // Add earnings when task is completed
    if (task && task.earn) {
        addEarnings(task.earn);
    }
    
    // Add volunteer history completed entry
    if (task) {
        addVolunteerHistoryEntry(null, {
            type: 'completed',
            taskId: task.id,
            serviceType: task.service_type,
            amount: task.earn || 0,
            timestamp: new Date().toISOString(),
            label: `Completed ${task.service_type} task`
        });
    }

    // Increment completed tasks count
    incrementCompletedTasks();
    
    // If this task has a request_id, mark the request as completed
    if (task && task.request_id) {
        const allRequests = getAllRequests();
        const updatedRequests = allRequests.map(req => 
            req.id === task.request_id ? {...req, status: 'completed', volunteer_username: currentUser.username} : req
        );
        setAllRequests(updatedRequests);
    }
    
    removeAcceptedTask(taskId);
    alert('✅ Task marked as complete! Completed count increased.');
    loadVolunteerDashboard();
}

function cancelTask(taskId) {
    const reason = prompt('❌ Please provide a reason for cancelling this task:', '');
    if (reason === null) {
        return; // User clicked Cancel
    }
    if (reason.trim() === '') {
        alert('❌ Please provide a reason for cancellation');
        return;
    }
    
    const acceptedTasks = getAcceptedTasks();
    const task = acceptedTasks.find(t => t.id === taskId);
    const currentUser = getCurrentUser();
    
    // Add volunteer history canceled entry
    if (task) {
        addVolunteerHistoryEntry(null, {
            type: 'canceled',
            taskId: task.id,
            serviceType: task.service_type,
            reason,
            timestamp: new Date().toISOString(),
            label: `Canceled ${task.service_type} task`
        });
    }

    // If this task has a request_id, mark the request as canceled with volunteer info
    if (task && task.request_id) {
        const allRequests = getAllRequests();
        const updatedRequests = allRequests.map(req => 
            req.id === task.request_id ? {
                ...req, 
                status: 'canceled',
                canceled_by: currentUser.username,
                canceled_date: new Date().toISOString(),
                canceled_reason: reason
            } : req
        );
        setAllRequests(updatedRequests);
    }
    
    removeAcceptedTask(taskId);
    alert('❌ Task cancelled successfully.\n\nCancellation reason: ' + reason);
    loadVolunteerDashboard();
}

function showRateAndTip(requestId) {
    const allRequests = getAllRequests();
    const request = allRequests.find(req => req.id === requestId);

    if (!request) {
        alert('❌ Request not found');
        return;
    }

    if (!request.volunteer_username) {
        alert('❌ No volunteer assigned to this request');
        return;
    }

    document.getElementById('rateTipRequestId').value = requestId;
    document.getElementById('rateTipRating').value = request.volunteer_rating || 5;
    document.getElementById('rateTipAmount').value = 0;

    document.getElementById('rateTipModal').classList.remove('hidden');
    document.getElementById('rateTipModal').classList.add('flex');
    
    initStarRating();
}

function closeRateTipModal() {
    document.getElementById('rateTipModal').classList.add('hidden');
    document.getElementById('rateTipModal').classList.remove('flex');
}

function setStarRating(stars) {
    document.getElementById('rateTipRating').value = stars;
    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach((btn, index) => {
        if (index < stars) {
            btn.style.color = '#fcd34d';
        } else {
            btn.style.color = '#000000';
        }
    });
}

function initStarRating() {
    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
        btn.style.color = '#000000';
    });
    setStarRating(5);
}

function saveRateTip(event) {
    event.preventDefault();

    const requestId = document.getElementById('rateTipRequestId').value;
    const rating = parseFloat(document.getElementById('rateTipRating').value);
    const tipAmount = parseFloat(document.getElementById('rateTipAmount').value);

    if (!requestId || isNaN(rating) || rating < 1 || rating > 5) {
        alert('Please enter a valid rating (1-5).');
        return;
    }

    if (isNaN(tipAmount) || tipAmount < 0) {
        alert('Please enter a valid tip amount.');
        return;
    }

    const allRequests = getAllRequests();
    const request = allRequests.find(req => req.id === requestId);
    if (!request) {
        alert('Request not found.');
        closeRateTipModal();
        return;
    }

    addVolunteerRating(request.volunteer_username, rating);

    if (tipAmount > 0) {
        addEarningsForVolunteer(request.volunteer_username, tipAmount);
        addVolunteerHistoryEntry(request.volunteer_username, {
            type: 'tip',
            requestId,
            from: getCurrentUser()?.username || 'unknown',
            amount: tipAmount,
            timestamp: new Date().toISOString(),
            label: `Tip received $${tipAmount.toFixed(2)}`
        });
    }

    const updatedRequests = allRequests.map(req => req.id === requestId ? {...req, volunteer_rating: rating} : req);
    setAllRequests(updatedRequests);

    closeRateTipModal();
    loadFamilyDashboard();
    alert('✅ Rating and tip saved.');
}


function editRequest(requestId) {
    const allRequests = getAllRequests();
    const request = allRequests.find(req => req.id === requestId);

    if (!request) {
        alert('❌ Request not found');
        return;
    }

    if (request.status !== 'pending') {
        alert('❌ Only pending requests can be edited');
        return;
    }

    // Show modal and pre-fill values
    document.getElementById('editRequestId').value = requestId;
    document.getElementById('editServiceType').value = request.service_type;
    const [datePart, timePart] = request.preferred_date.split('T');
    document.getElementById('editPreferredDate').value = datePart;
    document.getElementById('editPreferredTime').value = timePart ? timePart.slice(0,5) : '';
    document.getElementById('editAddress').value = request.address;
    document.getElementById('editDescription').value = request.description || '';

    document.getElementById('editRequestModal').classList.remove('hidden');
    document.getElementById('editRequestModal').classList.add('flex');
}

function closeEditModal() {
    document.getElementById('editRequestModal').classList.add('hidden');
    document.getElementById('editRequestModal').classList.remove('flex');
}

function saveEditRequest(event) {
    event.preventDefault();

    const requestId = document.getElementById('editRequestId').value;
    const serviceType = document.getElementById('editServiceType').value;
    const date = document.getElementById('editPreferredDate').value;
    const time = document.getElementById('editPreferredTime').value;
    const address = document.getElementById('editAddress').value.trim();
    const description = document.getElementById('editDescription').value.trim();

    if (!serviceType || !date || !time || !address) {
        alert('Please fill in all required fields.');
        return;
    }

    const allRequests = getAllRequests();
    const updatedRequests = allRequests.map(req => req.id === requestId ? {
        ...req,
        service_type: serviceType,
        preferred_date: `${date}T${time}`,
        address,
        description
    } : req);

    setAllRequests(updatedRequests);
    closeEditModal();
    alert('✅ Request successfully updated');
    loadFamilyDashboard();
}

function cancelRequest(requestId) {
    const userRequests = getUserRequests();
    const request = userRequests.find(req => req.id === requestId);
    
    if (!request) {
        alert('❌ Request not found');
        return;
    }
    
    if (request.status !== 'pending') {
        alert('❌ You can only cancel pending requests');
        return;
    }
    
    const confirmed = confirm('Are you sure you want to cancel this request? This action cannot be undone.');
    if (confirmed) {
        // Remove the request from global request store
        const allRequests = getAllRequests();
        const updatedRequests = allRequests.filter(req => req.id !== requestId);
        setAllRequests(updatedRequests);
        
        alert('❌ Request cancelled successfully.');
        loadFamilyDashboard();
    }
}

// ========== PERSONAL INFORMATION ==========

function getFamilyPersonalInfo() {
    const key = getScopedKey('personal_info_family');
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function setFamilyPersonalInfo(info) {
    const key = getScopedKey('personal_info_family');
    localStorage.setItem(key, JSON.stringify(info));
}

function getVolunteerPersonalInfo() {
    const key = getScopedKey('personal_info_volunteer');
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function setVolunteerPersonalInfo(info) {
    const key = getScopedKey('personal_info_volunteer');
    localStorage.setItem(key, JSON.stringify(info));
}

function editFamilyPersonalInfo() {
    const existing = getFamilyPersonalInfo();
    if (existing) {
        alert('Personal information has been saved and cannot be edited.');
        return;
    }
    document.getElementById('familyPersonalInfoModal').classList.remove('hidden');
    document.getElementById('familyPersonalInfoModal').classList.add('flex');
}

function closeFamilyPersonalInfoModal() {
    document.getElementById('familyPersonalInfoModal').classList.add('hidden');
    document.getElementById('familyPersonalInfoModal').classList.remove('flex');
}

function editVolunteerPersonalInfo() {
    const existing = getVolunteerPersonalInfo();
    if (existing) {
        alert('Personal information has been saved and cannot be edited.');
        return;
    }
    document.getElementById('volunteerPersonalInfoModal').classList.remove('hidden');
    document.getElementById('volunteerPersonalInfoModal').classList.add('flex');
}

function closeVolunteerPersonalInfoModal() {
    document.getElementById('volunteerPersonalInfoModal').classList.add('hidden');
    document.getElementById('volunteerPersonalInfoModal').classList.remove('flex');
}

function renderFamilyPersonalInfo() {
    const info = getFamilyPersonalInfo();
    const container = document.getElementById('familyPersonalInfo');
    
    if (!info) {
        container.innerHTML = `
            <div class="text-center py-8">
                <button onclick="editFamilyPersonalInfo()" class="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition">
                    Add Personal Information
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-600">Full Name</label>
                    <p class="text-lg font-semibold text-gray-900">${info.fullName}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Phone</label>
                    <p class="text-lg text-gray-900">${info.phone}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Email</label>
                    <p class="text-lg text-gray-900">${info.email}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Address</label>
                    <p class="text-lg text-gray-900">${info.address}</p>
                </div>
                <p class="text-xs text-gray-500 mt-4">ℹ️ Information is saved and cannot be edited</p>
            </div>
        `;
    }
}

function renderVolunteerPersonalInfo() {
    const info = getVolunteerPersonalInfo();
    const container = document.getElementById('volunteerPersonalInfo');
    
    if (!info) {
        container.innerHTML = `
            <div class="text-center py-8">
                <button onclick="editVolunteerPersonalInfo()" class="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition">
                    Add Personal Information
                </button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-600">Full Name</label>
                    <p class="text-lg font-semibold text-gray-900">${info.fullName}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Phone</label>
                    <p class="text-lg text-gray-900">${info.phone}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Email</label>
                    <p class="text-lg text-gray-900">${info.email}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Address</label>
                    <p class="text-lg text-gray-900">${info.address}</p>
                </div>
                <p class="text-xs text-gray-500 mt-4">ℹ️ Information is saved and cannot be edited</p>
            </div>
        `;
    }
}

// ========== EVENT LISTENERS ==========

document.getElementById('getStartedBtn')?.addEventListener('click', showLogin);

document.getElementById('backToLanding')?.addEventListener('click', showLanding);

document.getElementById('loginFormElement')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const role = document.getElementById('loginRole').value;
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!role) {
        alert('Please select a role first');
        return;
    }
    
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }
    
    // Login with any credentials
    login(username, password, role);
    showDashboard();
});

document.getElementById('navLogout')?.addEventListener('click', logout);

document.getElementById('rateTipForm')?.addEventListener('submit', saveRateTip);
document.getElementById('editRequestForm')?.addEventListener('submit', saveEditRequest);

document.getElementById('createRequestForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const serviceType = document.getElementById('serviceType').value;
    const date = document.getElementById('preferredDate').value;
    const time = document.getElementById('preferredTime').value;
    const address = document.getElementById('requestAddress').value;
    const description = document.getElementById('requestDescription').value;
    
    if (!serviceType) {
        alert('Please select a service type');
        return;
    }
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    if (!time) {
        alert('Please select a time');
        return;
    }
    
    if (!address) {
        alert('Please enter the address for the service location');
        return;
    }
    
    // Create request object with combined datetime
    const preferredDateTime = date + 'T' + time;
    const currentUser = getCurrentUser();
    const request = {
        id: 'req-' + Date.now(),
        service_type: serviceType,
        preferred_date: preferredDateTime,
        address: address,
        description: description,
        status: 'pending',
        elderly_username: currentUser.username,
        volunteer_username: null,
        volunteer_rating: null
    };
    
    // Add to user requests
    addUserRequest(request);
    
    console.log('Request created:', request);
    
    alert('✅ Care request submitted! A volunteer will be matched within 60 seconds.');
    
    document.getElementById('createRequestForm').reset();
    loadFamilyDashboard();
});

document.getElementById('familyPersonalInfoForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = document.getElementById('familyFullName').value;
    const phone = document.getElementById('familyPhone').value;
    const email = document.getElementById('familyEmail').value;
    const address = document.getElementById('familyAddress').value;
    
    setFamilyPersonalInfo({ fullName, phone, email, address });
    closeFamilyPersonalInfoModal();
    renderFamilyPersonalInfo();
    alert('✅ Personal information saved successfully!');
});

document.getElementById('volunteerPersonalInfoForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = document.getElementById('volunteerFullName').value;
    const phone = document.getElementById('volunteerPhone').value;
    const email = document.getElementById('volunteerEmail').value;
    const address = document.getElementById('volunteerAddress').value;
    
    setVolunteerPersonalInfo({ fullName, phone, email, address });
    closeVolunteerPersonalInfoModal();
    renderVolunteerPersonalInfo();
    alert('✅ Personal information saved successfully!');
});

// ========== INITIALIZATION ==========

function initApp() {
    if (isLoggedIn()) {
        showDashboard();
    } else {
        showLanding();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// ========== CROSS-TAB SYNCHRONIZATION ==========
// Sync data when changes happen in other tabs
window.addEventListener('storage', (event) => {
    // Check if the changed key is a CareNet data key
    if (event.key && event.key.includes('carenet')) {
        console.log('📡 Syncing data from another tab...', event.key);
        
        // Only refresh if user is logged in and in dashboard
        if (isLoggedIn() && !document.getElementById('landingPage').classList.contains('hidden') === false) {
            const role = getCurrentRole();
            
            // Refresh the appropriate dashboard
            if (role === 'volunteer') {
                loadVolunteerDashboard();
            } else if (role === 'elderly') {
                loadFamilyDashboard();
            }
        }
    }
});


