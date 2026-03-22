// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
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

// Health Monitoring Keys
const HEALTH_PROFILE_KEY = 'carenet_health_profile';
const HEALTH_OBSERVATIONS_KEY = 'carenet_health_observations';
const HEALTH_ALERTS_KEY = 'carenet_health_alerts';
const HEALTH_HISTORY_KEY = 'carenet_health_history';

// Service Types Configuration
const SERVICE_TYPES = {
    'medical': { name: 'Medical Appointment', price: 45, icon: '🏥', description: 'Accompany to doctor visits, hospital appointments, or medical procedures' },
    'medication': { name: 'Medication Management', price: 35, icon: '💊', description: 'Help organize, remind, and administer medications safely' },
    'personal_care': { name: 'Personal Care & Hygiene', price: 40, icon: '🧴', description: 'Assistance with bathing, dressing, grooming, and personal hygiene' },
    'meal_prep': { name: 'Meal Preparation', price: 35, icon: '🍳', description: 'Prepare nutritious meals, help with eating, and meal planning' },
    'house_cleaning': { name: 'House Cleaning', price: 30, icon: '🧹', description: 'Light cleaning, tidying, laundry, and household organization' },
    'errands': { name: 'Shopping & Errands', price: 30, icon: '🛒', description: 'Grocery shopping, picking up prescriptions, post office runs' },
    'transportation': { name: 'Transportation', price: 25, icon: '🚗', description: 'Safe transportation to appointments, shopping, or social activities' },
    'companionship': { name: 'Companionship & Chat', price: 25, icon: '💬', description: 'Friendly conversation, emotional support, and social interaction' },
    'tech_help': { name: 'Technology Help', price: 30, icon: '📱', description: 'Help with smartphones, computers, smart home devices, and online services' },
    'gardening': { name: 'Gardening & Yard Work', price: 35, icon: '🌱', description: 'Light gardening, plant care, and outdoor maintenance' },
    'pet_care': { name: 'Pet Care', price: 25, icon: '🐕', description: 'Feed, walk, and care for pets while owner is away' },
    'light_repairs': { name: 'Light Repairs', price: 40, icon: '🔧', description: 'Basic home repairs, bulb changes, and minor maintenance' },
    'social_activities': { name: 'Social Activities', price: 30, icon: '🎭', description: 'Accompany to community events, classes, or social gatherings' },
    'reading': { name: 'Reading & Storytelling', price: 25, icon: '📖', description: 'Read books, newspapers, or share stories and memories' },
    'exercise': { name: 'Light Exercise & Mobility', price: 35, icon: '🏃‍♂️', description: 'Gentle exercises, walking assistance, and mobility support' },
    'memory_games': { name: 'Memory Games & Activities', price: 30, icon: '🧠', description: 'Cognitive games, puzzles, and memory-enhancing activities' },
    'mail_bills': { name: 'Mail & Bill Management', price: 25, icon: '📬', description: 'Sort mail, pay bills, and manage important paperwork' },
    'laundry': { name: 'Laundry & Ironing', price: 30, icon: '👔', description: 'Wash, dry, fold clothes and light ironing' },
    'plant_care': { name: 'Plant Care', price: 20, icon: '🌿', description: 'Water plants, light gardening, and indoor plant maintenance' }
};

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

// ========== HEALTH MONITORING FUNCTIONS ==========

// Health Risk Levels and Colors
const HEALTH_RISK_LEVELS = {
    'low': { label: '🟢 Low Risk', color: 'bg-green-100', borderColor: 'border-green-300', textColor: 'text-green-800' },
    'moderate': { label: '🟡 Moderate Risk', color: 'bg-yellow-100', borderColor: 'border-yellow-300', textColor: 'text-yellow-800' },
    'high': { label: '🔴 High Risk', color: 'bg-red-100', borderColor: 'border-red-300', textColor: 'text-red-800' },
    'critical': { label: '⚠️ Critical Risk', color: 'bg-orange-100', borderColor: 'border-orange-300', textColor: 'text-orange-800' }
};

// Health Alert Types
const HEALTH_ALERT_TYPES = {
    'allergy': { name: 'Allergy', icon: '⚠️', color: 'bg-purple-100 border-purple-300' },
    'medication': { name: 'Medication Schedule', icon: '💊', color: 'bg-blue-100 border-blue-300' },
    'condition': { name: 'Medical Condition', icon: '🏥', color: 'bg-red-100 border-red-300' },
    'emergency': { name: 'Emergency Contact', icon: '📞', color: 'bg-orange-100 border-orange-300' },
    'physical_limitation': { name: 'Physical Limitation', icon: '🚫', color: 'bg-yellow-100 border-yellow-300' }
};

// Get health profile for elderly person
function getHealthProfile(username) {
    const key = `${HEALTH_PROFILE_KEY}_${username || getCurrentUser()?.username}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function setHealthProfile(username, profile) {
    const key = `${HEALTH_PROFILE_KEY}_${username || getCurrentUser()?.username}`;
    localStorage.setItem(key, JSON.stringify(profile));
}

// Get health observations for a specific elderly person
function getHealthObservations(elderlyUsername) {
    const key = `${HEALTH_OBSERVATIONS_KEY}_${elderlyUsername}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function addHealthObservation(elderlyUsername, observation) {
    const observations = getHealthObservations(elderlyUsername);
    observations.unshift({
        ...observation,
        id: 'obs-' + Date.now(),
        date: new Date().toISOString(),
        recordedBy: getCurrentUser()?.username
    });
    const key = `${HEALTH_OBSERVATIONS_KEY}_${elderlyUsername}`;
    localStorage.setItem(key, JSON.stringify(observations));
}

// Get health alerts for elderly person
function getHealthAlerts(elderlyUsername) {
    const key = `${HEALTH_ALERTS_KEY}_${elderlyUsername}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function addHealthAlert(elderlyUsername, alert) {
    const alerts = getHealthAlerts(elderlyUsername);
    alerts.unshift({
        ...alert,
        id: 'alert-' + Date.now(),
        createdDate: new Date().toISOString()
    });
    const key = `${HEALTH_ALERTS_KEY}_${elderlyUsername}`;
    localStorage.setItem(key, JSON.stringify(alerts));
}

function removeHealthAlert(elderlyUsername, alertId) {
    const alerts = getHealthAlerts(elderlyUsername);
    const updated = alerts.filter(a => a.id !== alertId);
    const key = `${HEALTH_ALERTS_KEY}_${elderlyUsername}`;
    localStorage.setItem(key, JSON.stringify(updated));
}

// Calculate health risk score (0-100)
function calculateHealthRiskScore(profile) {
    if (!profile) return 0;
    
    let score = 0;
    let factors = 0;
    
    // Age factor (>75 adds risk)
    if (profile.age && profile.age > 75) {
        score += Math.min((profile.age - 75) * 2, 20);
        factors += 1;
    }
    
    // Chronic conditions
    if (profile.conditions && profile.conditions.length > 0) {
        score += Math.min(profile.conditions.length * 5, 25);
        factors += 1;
    }
    
    // Medication count
    if (profile.medications && profile.medications.length > 0) {
        score += Math.min(profile.medications.length * 3, 20);
        factors += 1;
    }
    
    // Allergies
    if (profile.allergies && profile.allergies.length > 0) {
        score += Math.min(profile.allergies.length * 4, 15);
        factors += 1;
    }
    
    // Mobility issues
    if (profile.mobilityIssues) {
        score += 15;
        factors += 1;
    }
    
    // Fall risk
    if (profile.fallRisk) {
        score += 20;
        factors += 1;
    }
    
    // Recent hospitalization
    if (profile.recentHospitalization) {
        score += 15;
        factors += 1;
    }
    
    // Cognitive issues
    if (profile.cognitiveIssues) {
        score += 15;
        factors += 1;
    }
    
    // Cap at 100
    return Math.min(score, 100);
}

// Get risk level based on score
function getRiskLevel(score) {
    if (score < 20) return 'low';
    if (score < 45) return 'moderate';
    if (score < 70) return 'high';
    return 'critical';
}

// Get health status summary
function getHealthStatusSummary(profile) {
    if (!profile) return null;
    
    const score = calculateHealthRiskScore(profile);
    const level = getRiskLevel(score);
    
    return {
        score: score,
        level: level,
        riskInfo: HEALTH_RISK_LEVELS[level],
        profile: profile
    };
}

// ========== DATA MANAGEMENT ==========
function getTaskRatings() {
    const ratings = localStorage.getItem(VOLUNTEER_RATINGS_KEY);
    // Format: { requestId: { rating: 5, volunteerUsername: 'john', timestamp: '...' }, ... }
    return ratings ? JSON.parse(ratings) : {};
}

function setTaskRatings(ratings) {
    localStorage.setItem(VOLUNTEER_RATINGS_KEY, JSON.stringify(ratings));
}

// Save or update a rating for a specific task
function saveTaskRating(requestId, volunteerUsername, rating) {
    const taskRatings = getTaskRatings();
    taskRatings[requestId] = {
        rating: parseFloat(rating),
        volunteerUsername: volunteerUsername,
        timestamp: new Date().toISOString()
    };
    setTaskRatings(taskRatings);
}

// Get all ratings for a volunteer
function getVolunteerAllRatings(volunteerUsername) {
    const taskRatings = getTaskRatings();
    const volunteerRatings = Object.values(taskRatings).filter(
        rating => rating.volunteerUsername === volunteerUsername
    );
    return volunteerRatings;
}

// Calculate average rating for a volunteer
function getVolunteerAverageRating(volunteerUsername) {
    const allRatings = getVolunteerAllRatings(volunteerUsername);
    if (allRatings.length === 0) return '5.0';
    const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    return avg.toFixed(1);
}

// Helper functions for cross-user data access
function getVolunteerPersonalInfoByUsername(username) {
    if (!username) return null;
    const key = `personal_info_volunteer_${username}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function getCompletedTasksForVolunteer(username) {
    if (!username) return 0;
    const key = `completed_tasks_${username}`;
    const completed = localStorage.getItem(key);
    return completed ? parseInt(completed) : 0;
}

function incrementCompletedTasksForVolunteer(username) {
    if (!username) return;
    const current = getCompletedTasksForVolunteer(username);
    const key = `completed_tasks_${username}`;
    localStorage.setItem(key, (current + 1).toString());
}

function getFamilyPersonalInfoByUsername(username) {
    if (!username) return null;
    const key = `personal_info_family_${username}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
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
    
    // Always show first page
    if (1 === currentPage) {
        html += `<button class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">1</button>`;
    } else {
        html += `<button onclick="goToVolunteerPage('${pageKey}', 1)" class="px-4 py-2 border-2 border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">1</button>`;
    }
    
    // Show second page if exists
    if (totalPages >= 2) {
        if (2 === currentPage) {
            html += `<button class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">2</button>`;
        } else {
            html += `<button onclick="goToVolunteerPage('${pageKey}', 2)" class="px-4 py-2 border-2 border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">2</button>`;
        }
    }
    
    // If more than 4 pages, show ... after 2
    if (totalPages > 4) {
        if (currentPage > 3) {
            html += `<span class="px-2 py-2 text-gray-500">...</span>`;
        }
    }
    
    // Show pages around current page (if not first or last few)
    const startPage = Math.max(3, currentPage - 1);
    const endPage = Math.min(totalPages - 2, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
        if (i > 2 && i < totalPages - 1) {
            if (i === currentPage) {
                html += `<button class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">${i}</button>`;
            } else {
                html += `<button onclick="goToVolunteerPage('${pageKey}', ${i})" class="px-4 py-2 border-2 border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">${i}</button>`;
            }
        }
    }
    
    // If more than 4 pages, show ... before last two
    if (totalPages > 4) {
        if (currentPage < totalPages - 2) {
            html += `<span class="px-2 py-2 text-gray-500">...</span>`;
        }
    }
    
    // Show second last page if exists
    if (totalPages >= 3) {
        const secondLast = totalPages - 1;
        if (secondLast === currentPage) {
            html += `<button class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">${secondLast}</button>`;
        } else {
            html += `<button onclick="goToVolunteerPage('${pageKey}', ${secondLast})" class="px-4 py-2 border-2 border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">${secondLast}</button>`;
        }
    }
    
    // Show last page
    if (totalPages >= 2) {
        if (totalPages === currentPage) {
            html += `<button class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold">${totalPages}</button>`;
        } else {
            html += `<button onclick="goToVolunteerPage('${pageKey}', ${totalPages})" class="px-4 py-2 border-2 border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">${totalPages}</button>`;
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
    socket = io('http://localhost:5000', {
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

// ========== ACCOUNT SWITCHER ==========

const ACCOUNT_HISTORY_KEY = 'carenet_account_history';

function saveAccountToHistory(username, role) {
    let history = JSON.parse(localStorage.getItem(ACCOUNT_HISTORY_KEY) || '[]');
    
    // Remove if already exists
    history = history.filter(acc => acc.username !== username);
    
    // Add to front
    history.unshift({ username, role, timestamp: Date.now() });
    
    // Keep only last 5
    history = history.slice(0, 5);
    
    localStorage.setItem(ACCOUNT_HISTORY_KEY, JSON.stringify(history));
}

function getAccountHistory() {
    return JSON.parse(localStorage.getItem(ACCOUNT_HISTORY_KEY) || '[]');
}

function openAccountSwitcher() {
    const modal = document.getElementById('accountSwitcherModal');
    modal.classList.remove('hidden');
    
    // Render recent accounts
    const history = getAccountHistory();
    const listDiv = document.getElementById('recentAccountsList');
    
    if (history.length === 0) {
        listDiv.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No recent accounts</p>';
    } else {
        listDiv.innerHTML = history.map(acc => `
            <button onclick="quickLogin('${acc.username}', 'password', '${acc.role}')" class="w-full text-left p-3 rounded-lg hover:bg-blue-50 border border-gray-200 transition">
                <div class="font-semibold text-gray-900">${acc.role === 'volunteer' ? '🤝' : '👴'} ${acc.username}</div>
                <div class="text-xs text-gray-500">${acc.role === 'volunteer' ? 'Volunteer' : 'Family'}</div>
            </button>
        `).join('');
    }
}

function closeAccountSwitcher() {
    document.getElementById('accountSwitcherModal').classList.add('hidden');
}

function quickLogin(username, password, role) {
    const user = login(username, password, role);
    saveAccountToHistory(username, role);
    
    // Show dashboard
    showDashboard();
    
    // Update role-specific view
    if (role === 'volunteer') {
        showVolunteerDashboard();
    } else {
        showFamilyDashboard();
    }
    
    closeAccountSwitcher();
}

// ========== UI NAVIGATION ==========

function showLanding() {
    document.getElementById('landingPage').classList.remove('hidden');
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('userGreeting').textContent = 'Welcome';
    document.getElementById('userGreeting').classList.add('hidden');
    document.getElementById('navSwitchAccount').classList.add('hidden');
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
    document.getElementById('navSwitchAccount').classList.remove('hidden');
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
    
    // Service pricing - now using SERVICE_TYPES config
    const getServiceDisplay = (serviceType) => {
        const service = SERVICE_TYPES[serviceType];
        return service ? `${service.icon} ${service.name} - $${service.price}` : `${serviceType} - $0`;
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
            const service = SERVICE_TYPES[req.service_type] || { icon: '❓', name: req.service_type, price: 0 };
            const statusColor = req.status === 'pending' ? 'status-pending' :
                               req.status === 'in_progress' ? 'status-in_progress' :
                               'status-completed';

            // Get volunteer info for in_progress tasks
            let volunteerInfo = '';
            if (req.status === 'in_progress' && req.volunteer_username) {
                const volunteerPersonalInfo = getVolunteerPersonalInfoByUsername(req.volunteer_username);
                const volunteerRating = getVolunteerAverageRating(req.volunteer_username);
                const volunteerEarnings = getEarningsForVolunteer(req.volunteer_username);
                const volunteerCompleted = getCompletedTasksForVolunteer(req.volunteer_username);

                volunteerInfo = `
                    <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 class="font-semibold text-blue-900 mb-2">🤝 Volunteer Information</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="font-medium text-gray-700">Name:</p>
                                <p class="text-gray-900">${volunteerPersonalInfo?.fullName || req.volunteer_username}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-700">Phone:</p>
                                <p class="text-gray-900">${volunteerPersonalInfo?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-700">Rating:</p>
                                <p class="text-gray-900">⭐ ${volunteerRating}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-700">Total Earnings:</p>
                                <p class="text-gray-900">💰 $${volunteerEarnings.toFixed(2)}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-700">Jobs Completed:</p>
                                <p class="text-gray-900">✅ ${volunteerCompleted}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-700">Email:</p>
                                <p class="text-gray-900">${volunteerPersonalInfo?.email || 'Not provided'}</p>
                            </div>
                        </div>
                        ${volunteerPersonalInfo?.address ? `
                            <div class="mt-2">
                                <p class="font-medium text-gray-700">Address:</p>
                                <p class="text-gray-900">${volunteerPersonalInfo.address}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }

            const volunteerDisplay = req.volunteer_username ? `${req.volunteer_username} ⭐ ${req.volunteer_rating || '5.0'}` : 'Awaiting volunteer';

            return `
                <div class="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold">${service.icon} ${service.name}</h3>
                            <p class="text-gray-600">Address: ${req.address}</p>
                            <p class="text-gray-600">Volunteer: ${volunteerDisplay}</p>
                            <p class="text-emerald-600 font-bold mt-2">Price: $${service.price}</p>
                            ${volunteerInfo}
                        </div>
                        <span class="px-4 py-2 rounded-full text-sm font-semibold ${statusColor}">
                            ${req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600">📅 ${new Date(req.preferred_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                    <div class="flex gap-2 mt-3">
                        ${req.status === 'completed' && req.volunteer_username ? `
                            <button onclick="viewPerformer('${req.id}')" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold transition">👤 View Performer</button>
                            <button onclick="showRateAndTip('${req.id}')" class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 font-semibold transition">Rate & Tip</button>
                        ` : ''}
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
    
    // Render health profile
    renderFamilyHealthProfile();
    
    // Render health observations
    const currentUser = getCurrentUser();
    renderHealthObservations(currentUser.username);
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
        myTasksList.innerHTML = paginated.items.map(task => {
            // Get user info for in_progress tasks
            let userInfo = '';
            if (task.status === 'in_progress' && task.elderly_username) {
                const userPersonalInfo = getFamilyPersonalInfoByUsername(task.elderly_username);

                userInfo = `
                    <div class="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                        <h4 class="font-semibold text-green-900 mb-2">👤 Service User Information</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="font-medium text-gray-700">Name:</p>
                                <p class="text-gray-900">${userPersonalInfo?.fullName || task.elderly_name || task.elderly_username}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-700">Phone:</p>
                                <p class="text-gray-900">${userPersonalInfo?.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-700">Email:</p>
                                <p class="text-gray-900">${userPersonalInfo?.email || 'Not provided'}</p>
                            </div>
                            <div>
                                <p class="font-medium text-gray-700">Address:</p>
                                <p class="text-gray-900">${userPersonalInfo?.address || task.address}</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add health information if available
                const healthProfile = getHealthProfile(task.elderly_username);
                const healthAlerts = getHealthAlerts(task.elderly_username);
                
                if (healthProfile) {
                    const healthStatus = getHealthStatusSummary(healthProfile);
                    userInfo += `
                        <div class="mt-3 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                            <h4 class="font-semibold text-yellow-900 mb-2">🏥 Health Information</h4>
                            <div class="mb-2">
                                <p class="text-xs text-gray-600">Health Risk Score</p>
                                <p class="text-sm font-bold text-yellow-800">${healthStatus.score}/100 - ${healthStatus.riskInfo.label}</p>
                            </div>
                            ${healthProfile.conditions && healthProfile.conditions.length > 0 ? `
                                <p class="text-xs text-gray-700"><strong>Conditions:</strong> ${healthProfile.conditions.join(', ')}</p>
                            ` : ''}
                            ${healthProfile.allergies && healthProfile.allergies.length > 0 ? `
                                <p class="text-xs text-gray-700 mt-1"><strong>Allergies:</strong> ${healthProfile.allergies.join(', ')}</p>
                            ` : ''}
                        </div>
                    `;
                }
                
                // Add health alerts if any
                if (healthAlerts && healthAlerts.length > 0) {
                    userInfo += `
                        <div class="mt-3 p-4 bg-red-100 border border-red-300 rounded-lg">
                            <h4 class="font-semibold text-red-900 mb-2">⚠️ Health Alerts</h4>
                            <div class="space-y-2">
                                ${healthAlerts.slice(0, 3).map(alert => `
                                    <p class="text-xs text-red-800"><strong>${alert.type}:</strong> ${alert.description}</p>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            }

            return `
                <div class="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="text-lg font-bold">${task.elderly_name}</h3>
                            <p class="text-gray-600">${task.service_type.charAt(0).toUpperCase() + task.service_type.slice(1)} Service</p>
                            <p class="text-green-700 font-semibold mt-2">⏰ ${new Date(task.preferredTime).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                            <p class="text-gray-600 text-sm mt-2">📍 ${task.address}</p>
                            ${userInfo}
                        </div>
                        <div class="flex gap-2 whitespace-nowrap flex-col">
                            ${task.status === 'in_progress' && (task.service_type === 'medical' || task.service_type === 'medication' || task.service_type === 'personal_care') ? `
                                <button onclick="setObservationContext('${task.request_id}'); addHealthObservationUI()" class="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition text-sm">
                                    📝 Record Observation
                                </button>
                            ` : ''}
                            <button onclick="completeTask('${task.id}')" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                                Mark Complete
                            </button>
                            <button onclick="cancelTask('${task.id}')" class="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        renderPaginationButtons('myTasksPagination', MY_TASKS_PAGE_KEY, paginated.totalPages);
    }

    renderVolunteerHistory();
    renderVolunteerPersonalInfo();
}

function setObservationContext(requestId) {
    document.getElementById('observationRequestId').value = requestId;
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
        let icon = '';
        if (item.type === 'completed') {
            desc = `✅ Completed ${item.serviceType} task (Earned $${item.amount.toFixed(2)})`;
            icon = '✅';
        } else if (item.type === 'canceled') {
            desc = `❌ Canceled ${item.serviceType} task (Reason: ${item.reason || 'n/a'})`;
            icon = '❌';
        } else if (item.type === 'tip') {
            desc = `💰 Tip received $${item.amount.toFixed(2)} from ${item.from}`;
            icon = '💰';
        } else if (item.type === 'rating') {
            // Display rating with stars
            desc = `⭐ Rated ${item.rating} star${item.rating !== 1 ? 's' : ''} from ${item.from}`;
            icon = '⭐';
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

    // Get user info for this request
    const userPersonalInfo = getFamilyPersonalInfoByUsername(request.elderly_username);
    const userHealthProfile = getHealthProfile(request.elderly_username);

    const modal = document.getElementById('requestDetailModal');
    const content = document.getElementById('requestDetailContent');

    const serviceEmoji = request.service_type === 'medical' ? '🏥' :
                        request.service_type === 'errands' ? '🛒' : '💬';

    const statusColor = request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                       request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                       'bg-green-100 text-green-800';

    let healthProfileSection = '';
    if (userHealthProfile) {
        const riskLevel = userHealthProfile.fallRisk || userHealthProfile.mobilityIssues || userHealthProfile.cognitiveIssues ? 'High Risk' : 'Low Risk';
        const riskColor = riskLevel === 'High Risk' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';

        healthProfileSection = `
            <!-- Health Profile -->
            <div class="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 class="text-lg font-semibold mb-4 text-red-900">📋 Health Profile</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-sm font-medium text-gray-700">Age</p>
                        <p class="text-gray-900">${userHealthProfile.age || 'Not specified'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Blood Type</p>
                        <p class="text-gray-900">${userHealthProfile.bloodType || 'Not specified'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Risk Level</p>
                        <span class="px-2 py-1 rounded-full text-xs font-semibold ${riskColor}">${riskLevel}</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Recent Hospitalization</p>
                        <p class="text-gray-900">${userHealthProfile.recentHospitalization ? 'Yes' : 'No'}</p>
                    </div>
                </div>
                
                ${userHealthProfile.conditions && userHealthProfile.conditions.length > 0 ? `
                <div class="mb-4">
                    <p class="text-sm font-medium text-gray-700 mb-2">🏥 Chronic Conditions</p>
                    <div class="flex flex-wrap gap-2">
                        ${userHealthProfile.conditions.map(condition => `<span class="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full">${condition}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${userHealthProfile.medications && userHealthProfile.medications.length > 0 ? `
                <div class="mb-4">
                    <p class="text-sm font-medium text-gray-700 mb-2">💊 Current Medications</p>
                    <div class="space-y-1">
                        ${userHealthProfile.medications.map(med => `<p class="text-sm text-gray-900">• ${med.name} - ${med.dosage}</p>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${userHealthProfile.allergies && userHealthProfile.allergies.length > 0 ? `
                <div class="mb-4">
                    <p class="text-sm font-medium text-gray-700 mb-2">⚠️ Allergies</p>
                    <div class="flex flex-wrap gap-2">
                        ${userHealthProfile.allergies.map(allergy => `<span class="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">${allergy}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div>
                    <p class="text-sm font-medium text-gray-700 mb-2">🚫 Physical & Cognitive Limitations</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div class="flex items-center">
                            <span class="${userHealthProfile.mobilityIssues ? 'text-red-600' : 'text-green-600'}">• Mobility Issues: ${userHealthProfile.mobilityIssues ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="${userHealthProfile.fallRisk ? 'text-red-600' : 'text-green-600'}">• Fall Risk: ${userHealthProfile.fallRisk ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="${userHealthProfile.cognitiveIssues ? 'text-red-600' : 'text-green-600'}">• Cognitive Issues: ${userHealthProfile.cognitiveIssues ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        healthProfileSection = `
            <!-- No Health Profile -->
            <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 class="text-lg font-semibold mb-4 text-gray-900">📋 Health Profile</h3>
                <p class="text-gray-600">No health profile available for this user.</p>
                <p class="text-sm text-gray-500 mt-2">Health information helps provide better care.</p>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="space-y-6">
            <!-- Service Details -->
            <div class="bg-gray-50 p-6 rounded-lg">
                <h3 class="text-lg font-semibold mb-4 text-gray-900">Service Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Service Type</p>
                        <p class="text-lg font-semibold text-gray-900">${serviceEmoji} ${request.service_type.charAt(0).toUpperCase() + request.service_type.slice(1)}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-600">Status</p>
                        <span class="px-3 py-1 rounded-full text-sm font-semibold ${statusColor}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-600">Preferred Time</p>
                        <p class="text-gray-900">${new Date(request.preferred_date).toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-600">Address</p>
                        <p class="text-gray-900">${request.address}</p>
                    </div>
                </div>
                <div class="mt-4">
                    <p class="text-sm font-medium text-gray-600">Description</p>
                    <p class="text-gray-900 mt-1">${request.description || 'No description provided'}</p>
                </div>
            </div>

            <!-- Service User Information -->
            <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 class="text-lg font-semibold mb-4 text-blue-900">👤 Service User Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm font-medium text-gray-700">Name</p>
                        <p class="text-gray-900">${userPersonalInfo?.fullName || request.elderly_username || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Age</p>
                        <p class="text-gray-900">${userPersonalInfo?.age || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Gender</p>
                        <p class="text-gray-900">${userPersonalInfo?.gender || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Phone</p>
                        <p class="text-gray-900">${userPersonalInfo?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Email</p>
                        <p class="text-gray-900">${userPersonalInfo?.email || 'Not provided'}</p>
                    </div>
                    <div class="md:col-span-2">
                        <p class="text-sm font-medium text-gray-700">Address</p>
                        <p class="text-gray-900">${userPersonalInfo?.address || request.address}</p>
                    </div>
                </div>
            </div>

            ${healthProfileSection}
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeRequestDetailModal() {
    document.getElementById('requestDetailModal').classList.add('hidden');
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
    incrementCompletedTasksForVolunteer(currentUser.username);
    
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

function viewPerformer(requestId) {
    const userRequests = getUserRequests();
    const request = userRequests.find(req => req.id === requestId);

    if (!request) {
        alert('❌ Request not found');
        return;
    }

    if (!request.volunteer_username) {
        alert('❌ No volunteer assigned to this request');
        return;
    }

    // Get volunteer personal info
    const volunteerInfo = getVolunteerPersonalInfoByUsername(request.volunteer_username);
    const volunteerRating = getVolunteerAverageRating(request.volunteer_username);
    const completedTasks = getCompletedTasksForVolunteer(request.volunteer_username);

    const modal = document.getElementById('viewPerformerModal');
    const content = document.getElementById('performerInfoContent');

    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 class="text-lg font-semibold text-blue-900 mb-3">👤 Personal Information</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm font-medium text-gray-700">Full Name</p>
                        <p class="text-gray-900">${volunteerInfo?.fullName || request.volunteer_username || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Age</p>
                        <p class="text-gray-900">${volunteerInfo?.age || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Gender</p>
                        <p class="text-gray-900">${volunteerInfo?.gender || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Phone</p>
                        <p class="text-gray-900">${volunteerInfo?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700">Email</p>
                        <p class="text-gray-900">${volunteerInfo?.email || 'Not provided'}</p>
                    </div>
                    <div class="md:col-span-2">
                        <p class="text-sm font-medium text-gray-700">Address</p>
                        <p class="text-gray-900">${volunteerInfo?.address || 'Not provided'}</p>
                    </div>
                </div>
            </div>

            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 class="text-lg font-semibold text-green-900 mb-3">📊 Performance Stats</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                        <p class="text-2xl font-bold text-green-600">${volunteerRating}</p>
                        <p class="text-sm text-gray-600">⭐ Average Rating</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-green-600">${completedTasks}</p>
                        <p class="text-sm text-gray-600">✅ Tasks Completed</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-green-600">${request.volunteer_rating || 'N/A'}</p>
                        <p class="text-sm text-gray-600">⭐ Your Rating</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeViewPerformerModal() {
    document.getElementById('viewPerformerModal').classList.add('hidden');
    document.getElementById('viewPerformerModal').classList.remove('flex');
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

    // Save the rating for this specific task (supports updating existing rating)
    saveTaskRating(requestId, request.volunteer_username, rating);

    // Add history entry for rating
    addVolunteerHistoryEntry(request.volunteer_username, {
        type: 'rating',
        requestId,
        rating: rating,
        from: getCurrentUser()?.username || 'unknown',
        timestamp: new Date().toISOString(),
        label: `⭐ Rated ${rating} stars`
    });

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
    alert('✅ Rating updated! Volunteer average: ⭐ ' + getVolunteerAverageRating(request.volunteer_username) + ' stars');
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
    // Close other modals to avoid conflicts
    closeHealthProfileModal();
    
    let existing = null;
    try {
        existing = getFamilyPersonalInfo();
    } catch (error) {
        console.error('Error loading family personal info:', error);
        // Clear form for new info
        document.getElementById('familyFullName').value = '';
        document.getElementById('familyAge').value = '';
        document.getElementById('familyGender').value = '';
        document.getElementById('familyPhone').value = '';
        document.getElementById('familyEmail').value = '';
        document.getElementById('familyAddress').value = '';
        document.getElementById('familyPersonalInfoModal').classList.remove('hidden');
        document.getElementById('familyPersonalInfoModal').classList.add('flex');
        return;
    }
    
    // Load existing data into form
    if (existing) {
        document.getElementById('familyFullName').value = existing.fullName || '';
        document.getElementById('familyAge').value = existing.age || '';
        document.getElementById('familyGender').value = existing.gender || '';
        document.getElementById('familyPhone').value = existing.phone || '';
        document.getElementById('familyEmail').value = existing.email || '';
        document.getElementById('familyAddress').value = existing.address || '';
    } else {
        // Clear form for new info
        document.getElementById('familyFullName').value = '';
        document.getElementById('familyAge').value = '';
        document.getElementById('familyGender').value = '';
        document.getElementById('familyPhone').value = '';
        document.getElementById('familyEmail').value = '';
        document.getElementById('familyAddress').value = '';
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
    
    // Load existing data into form
    if (existing) {
        document.getElementById('volunteerFullName').value = existing.fullName || '';
        document.getElementById('volunteerAge').value = existing.age || '';
        document.getElementById('volunteerGender').value = existing.gender || '';
        document.getElementById('volunteerPhone').value = existing.phone || '';
        document.getElementById('volunteerEmail').value = existing.email || '';
        document.getElementById('volunteerAddress').value = existing.address || '';
    } else {
        // Clear form for new info
        document.getElementById('volunteerFullName').value = '';
        document.getElementById('volunteerAge').value = '';
        document.getElementById('volunteerGender').value = '';
        document.getElementById('volunteerPhone').value = '';
        document.getElementById('volunteerEmail').value = '';
        document.getElementById('volunteerAddress').value = '';
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
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-lg font-bold text-gray-900">Personal Information</h4>
                    <button onclick="editFamilyPersonalInfo()" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                        Edit Info
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Full Name</label>
                        <p class="text-lg font-semibold text-gray-900">${info.fullName}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Age</label>
                        <p class="text-lg text-gray-900">${info.age || 'Not provided'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Gender</label>
                        <p class="text-lg text-gray-900">${info.gender || 'Not provided'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Phone</label>
                        <p class="text-lg text-gray-900">${info.phone}</p>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Email</label>
                    <p class="text-lg text-gray-900">${info.email}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Address</label>
                    <p class="text-lg text-gray-900">${info.address}</p>
                </div>
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
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-lg font-bold text-gray-900">Personal Information</h4>
                    <button onclick="editVolunteerPersonalInfo()" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                        Edit Info
                    </button>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Full Name</label>
                        <p class="text-lg font-semibold text-gray-900">${info.fullName}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Age</label>
                        <p class="text-lg text-gray-900">${info.age || 'Not provided'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Gender</label>
                        <p class="text-lg text-gray-900">${info.gender || 'Not provided'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-600">Phone</label>
                        <p class="text-lg text-gray-900">${info.phone}</p>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Email</label>
                    <p class="text-lg text-gray-900">${info.email}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600">Address</label>
                    <p class="text-lg text-gray-900">${info.address}</p>
                </div>
            </div>
        `;
    }
}

// ========== HEALTH MONITORING UI RENDERING ==========

function editHealthProfile() {
    // Close other modals to avoid conflicts
    closeFamilyPersonalInfoModal();
    
    let existing = null;
    try {
        existing = getHealthProfile();
    } catch (error) {
        console.error('Error loading health profile:', error);
        // Clear form for new profile
        document.getElementById('healthAge').value = '';
        document.getElementById('healthBloodType').value = '';
        document.getElementById('healthConditions').value = '';
        document.getElementById('healthMedications').value = '';
        document.getElementById('healthAllergies').value = '';
        document.getElementById('healthMobility').checked = false;
        document.getElementById('healthFallRisk').checked = false;
        document.getElementById('healthCognitive').checked = false;
        document.getElementById('healthHospitalization').checked = false;
        document.getElementById('healthProfileModal').classList.remove('hidden');
        document.getElementById('healthProfileModal').classList.add('flex');
        return;
    }
    
    // Load existing data into form
    if (existing) {
        document.getElementById('healthAge').value = existing.age || '';
        document.getElementById('healthBloodType').value = existing.bloodType || '';
        document.getElementById('healthConditions').value = existing.conditions ? existing.conditions.join(', ') : '';
        document.getElementById('healthMedications').value = existing.medications ? existing.medications.map(m => `${m.name} - ${m.dosage}`).join('\n') : '';
        document.getElementById('healthAllergies').value = existing.allergies ? existing.allergies.join(', ') : '';
        document.getElementById('healthMobility').checked = existing.mobilityIssues || false;
        document.getElementById('healthFallRisk').checked = existing.fallRisk || false;
        document.getElementById('healthCognitive').checked = existing.cognitiveIssues || false;
        document.getElementById('healthHospitalization').checked = existing.recentHospitalization || false;
    } else {
        // Clear form for new profile
        document.getElementById('healthAge').value = '';
        document.getElementById('healthBloodType').value = '';
        document.getElementById('healthConditions').value = '';
        document.getElementById('healthMedications').value = '';
        document.getElementById('healthAllergies').value = '';
        document.getElementById('healthMobility').checked = false;
        document.getElementById('healthFallRisk').checked = false;
        document.getElementById('healthCognitive').checked = false;
        document.getElementById('healthHospitalization').checked = false;
    }
    
    document.getElementById('healthProfileModal').classList.remove('hidden');
    document.getElementById('healthProfileModal').classList.add('flex');
}

function closeHealthProfileModal() {
    document.getElementById('healthProfileModal').classList.add('hidden');
    document.getElementById('healthProfileModal').classList.remove('flex');
}

function renderFamilyHealthProfile() {
    const container = document.getElementById('familyHealthProfile');
    const currentUser = getCurrentUser();
    const profile = getHealthProfile(currentUser.username);
    
    if (!profile) {
        container.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow border-2 border-blue-200">
                <h3 class="text-xl font-bold mb-4 text-gray-900">📋 Health Profile</h3>
                <p class="text-gray-600 mb-4">Help volunteers understand health needs by adding a health profile.</p>
                <button onclick="editHealthProfile()" class="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition">
                    Create Health Profile
                </button>
            </div>
        `;
        return;
    }
    
    const status = getHealthStatusSummary(profile);
    const riskInfo = status.riskInfo;
    
    container.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-900">📋 Health Profile</h3>
                <button onclick="editHealthProfile()" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
                    Edit Profile
                </button>
            </div>
            
            <!-- Risk Assessment -->
            <div class="p-4 rounded-lg mb-6 ${riskInfo.color} ${riskInfo.borderColor} border-2">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-700">Health Risk Score</p>
                        <p class="text-3xl font-bold ${riskInfo.textColor}">${status.score}/100</p>
                    </div>
                    <div class="text-right">
                        <p class="text-2xl font-bold ${riskInfo.textColor}">${riskInfo.label}</p>
                        <p class="text-xs text-gray-600 mt-1">Based on health profile</p>
                    </div>
                </div>
            </div>
            
            <!-- Health Details Grid -->
            <div class="grid grid-cols-2 gap-4 mb-6">
                ${profile.age ? `
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-600 font-medium">Age</p>
                        <p class="text-lg font-semibold text-gray-900">${profile.age} years</p>
                    </div>
                ` : ''}
                ${profile.bloodType ? `
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="text-xs text-gray-600 font-medium">Blood Type</p>
                        <p class="text-lg font-semibold text-gray-900">${profile.bloodType}</p>
                    </div>
                ` : ''}
            </div>
            
            <!-- Conditions -->
            ${profile.conditions && profile.conditions.length > 0 ? `
                <div class="mb-6">
                    <h4 class="font-semibold text-gray-900 mb-2">🏥 Chronic Conditions</h4>
                    <div class="flex flex-wrap gap-2">
                        ${profile.conditions.map(c => `<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">${c}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Medications -->
            ${profile.medications && profile.medications.length > 0 ? `
                <div class="mb-6">
                    <h4 class="font-semibold text-gray-900 mb-2">💊 Current Medications</h4>
                    <div class="space-y-2">
                        ${profile.medications.map(m => `
                            <div class="flex justify-between items-start p-2 bg-blue-50 rounded">
                                <span>${m.name}</span>
                                <span class="text-xs text-gray-600">${m.dosage || 'As prescribed'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Allergies -->
            ${profile.allergies && profile.allergies.length > 0 ? `
                <div class="mb-6">
                    <h4 class="font-semibold text-gray-900 mb-2">⚠️ Allergies</h4>
                    <div class="flex flex-wrap gap-2">
                        ${profile.allergies.map(a => `<span class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">${a}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Physical Limitations -->
            ${(profile.mobilityIssues || profile.fallRisk || profile.cognitiveIssues) ? `
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-900 mb-2">🚫 Physical/Cognitive Limitations</h4>
                    <div class="space-y-1 text-sm text-gray-700">
                        ${profile.mobilityIssues ? '<p>✓ Limited mobility / Requires assistance with movement</p>' : ''}
                        ${profile.fallRisk ? '<p>✓ Fall risk / Requires supervision</p>' : ''}
                        ${profile.cognitiveIssues ? '<p>✓ Cognitive challenges / Memory issues</p>' : ''}
                    </div>
                </div>
            ` : ''}
            
            <p class="text-xs text-gray-500 mt-4">Last updated: ${new Date().toLocaleDateString()}</p>
        </div>
    `;
}

function renderHealthAlerts(elderlyUsername) {
    const container = document.getElementById('healthAlerts');
    if (!container) return;
    
    const alerts = getHealthAlerts(elderlyUsername);
    
    if (alerts.length === 0) {
        container.innerHTML = '<p class="text-center py-4 text-gray-500">No health alerts</p>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => {
        const type = HEALTH_ALERT_TYPES[alert.type] || { name: alert.type, icon: '⚠️', color: 'bg-gray-100 border-gray-300' };
        return `
            <div class="p-4 rounded-lg border-l-4 border-l-orange-500 ${type.color}">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-900">${type.icon} ${type.name}</p>
                        <p class="text-gray-700 mt-1">${alert.description}</p>
                        <p class="text-xs text-gray-600 mt-2">${new Date(alert.createdDate).toLocaleString()}</p>
                    </div>
                    ${getCurrentRole() === 'elderly' ? `
                        <button onclick="removeHealthAlert('${getCurrentUser().username}', '${alert.id}')" class="text-gray-400 hover:text-red-600">×</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderHealthObservations(elderlyUsername) {
    const container = document.getElementById('healthObservations');
    if (!container) return;
    
    const observations = getHealthObservations(elderlyUsername);
    
    if (observations.length === 0) {
        container.innerHTML = '<p class="text-center py-4 text-gray-500">No health observations yet</p>';
        return;
    }
    
    container.innerHTML = observations.slice(0, 10).map(obs => `
        <div class="p-4 bg-gray-50 rounded-lg border-l-4 border-l-emerald-500">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <p class="font-semibold text-gray-900">${obs.category}</p>
                    <p class="text-gray-700 text-sm mt-1">${obs.observation}</p>
                    ${obs.severity ? `<span class="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">${obs.severity}</span>` : ''}
                </div>
                <div class="text-right text-xs text-gray-600">
                    <p>${new Date(obs.date).toLocaleDateString()}</p>
                    <p class="text-gray-500">by ${obs.recordedBy}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function addHealthObservationUI() {
    document.getElementById('addObservationModal').classList.remove('hidden');
    document.getElementById('addObservationModal').classList.add('flex');
}

function closeAddObservationModal() {
    document.getElementById('addObservationModal').classList.add('hidden');
    document.getElementById('addObservationModal').classList.remove('flex');
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
    saveAccountToHistory(username, role);
    showDashboard();
});

document.getElementById('navLogout')?.addEventListener('click', logout);
document.getElementById('navSwitchAccount')?.addEventListener('click', openAccountSwitcher);

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
    const age = document.getElementById('familyAge').value;
    const gender = document.getElementById('familyGender').value;
    const phone = document.getElementById('familyPhone').value;
    const email = document.getElementById('familyEmail').value;
    const address = document.getElementById('familyAddress').value;

    setFamilyPersonalInfo({ fullName, age, gender, phone, email, address });
    closeFamilyPersonalInfoModal();
    renderFamilyPersonalInfo();
    alert('✅ Personal information saved successfully!');
});

document.getElementById('volunteerPersonalInfoForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = document.getElementById('volunteerFullName').value;
    const age = document.getElementById('volunteerAge').value;
    const gender = document.getElementById('volunteerGender').value;
    const phone = document.getElementById('volunteerPhone').value;
    const email = document.getElementById('volunteerEmail').value;
    const address = document.getElementById('volunteerAddress').value;

    setVolunteerPersonalInfo({ fullName, age, gender, phone, email, address });
    closeVolunteerPersonalInfoModal();
    renderVolunteerPersonalInfo();
    alert('✅ Personal information saved successfully!');
});

// Health Profile Form
document.getElementById('healthProfileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const age = document.getElementById('healthAge').value;
    const bloodType = document.getElementById('healthBloodType').value;
    
    // Get conditions (comma-separated)
    const conditionsStr = document.getElementById('healthConditions').value;
    const conditions = conditionsStr.split(',').map(c => c.trim()).filter(c => c);
    
    // Get medications
    const medicationsStr = document.getElementById('healthMedications').value;
    const medications = medicationsStr.split('\n').map(m => {
        const parts = m.split('-');
        return {
            name: parts[0].trim(),
            dosage: parts[1]?.trim() || 'As prescribed'
        };
    }).filter(m => m.name);
    
    // Get allergies (comma-separated)
    const allergiesStr = document.getElementById('healthAllergies').value;
    const allergies = allergiesStr.split(',').map(a => a.trim()).filter(a => a);
    
    // Get checkboxes
    const mobilityIssues = document.getElementById('healthMobility').checked;
    const fallRisk = document.getElementById('healthFallRisk').checked;
    const cognitiveIssues = document.getElementById('healthCognitive').checked;
    const recentHospitalization = document.getElementById('healthHospitalization').checked;
    
    const profile = {
        age: age ? parseInt(age) : null,
        bloodType: bloodType || null,
        conditions: conditions,
        medications: medications,
        allergies: allergies,
        mobilityIssues: mobilityIssues,
        fallRisk: fallRisk,
        cognitiveIssues: cognitiveIssues,
        recentHospitalization: recentHospitalization,
        createdDate: new Date().toISOString()
    };
    
    setHealthProfile(getCurrentUser().username, profile);
    closeHealthProfileModal();
    renderFamilyHealthProfile();
    alert('✅ Health profile saved successfully!');
});

// Health Observation Form
document.getElementById('addObservationForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentUser = getCurrentUser();
    const currentRequest = document.getElementById('observationRequestId')?.value;
    
    if (getCurrentRole() !== 'volunteer') {
        alert('Only volunteers can add observations');
        return;
    }
    
    // Get the request to find elderly username
    const allRequests = getAllRequests();
    const request = allRequests.find(r => r.id === currentRequest);
    
    if (!request) {
        alert('❌ Request not found');
        return;
    }
    
    const observation = {
        category: document.getElementById('obsCategory').value,
        observation: document.getElementById('obsDescription').value,
        severity: document.getElementById('obsSeverity').value || null,
        temperature: document.getElementById('obsTemperature').value || null,
        bloodPressure: document.getElementById('obsBp').value || null
    };
    
    addHealthObservation(request.elderly_username, observation);
    
    closeAddObservationModal();
    alert('✅ Health observation recorded successfully!');
    
    // Refresh volunteer dashboard
    if (getCurrentRole() === 'volunteer') {
        loadVolunteerDashboard();
    }
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

// ========== MOBILE MENU FUNCTIONALITY ==========

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');

    // Toggle mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            mobileMenu.classList.toggle('open');

            // Toggle hamburger icon animation
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans.forEach(span => span.classList.toggle('active'));
        });
    }

    // Close mobile menu when clicking on links
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.remove('open');
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans.forEach(span => span.classList.remove('active'));
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.remove('open');
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans.forEach(span => span.classList.remove('active'));
        }
    });

    // Close mobile menu on window resize if desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            mobileMenu.classList.remove('open');
            const spans = mobileMenuBtn.querySelectorAll('span');
            spans.forEach(span => span.classList.remove('active'));
        }
    });

    // Service type description tooltip
    const serviceTypeSelect = document.getElementById('serviceType');
    if (serviceTypeSelect) {
        serviceTypeSelect.addEventListener('change', function() {
            const selectedValue = this.value;
            const serviceInfo = SERVICE_TYPES[selectedValue];

            if (serviceInfo && serviceInfo.description) {
                // Show tooltip or update description display
                showServiceDescription(serviceInfo);
            }
        });
    }
});

// Show service description
function showServiceDescription(serviceInfo) {
    // Create or update description display
    let descDiv = document.getElementById('serviceDescription');
    if (!descDiv) {
        descDiv = document.createElement('div');
        descDiv.id = 'serviceDescription';
        descDiv.className = 'mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800';
        document.getElementById('serviceType').parentNode.appendChild(descDiv);
    }

    descDiv.innerHTML = `
        <div class="flex items-start gap-2">
            <span class="text-lg">${serviceInfo.icon}</span>
            <div>
                <p class="font-semibold">${serviceInfo.name}</p>
                <p class="text-blue-700">${serviceInfo.description}</p>
                <p class="font-bold text-emerald-600 mt-1">💰 $${serviceInfo.price}</p>
            </div>
        </div>
    `;

    // Animate in
    descDiv.style.opacity = '0';
    descDiv.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        descDiv.style.transition = 'all 0.3s ease';
        descDiv.style.opacity = '1';
        descDiv.style.transform = 'translateY(0)';
    }, 10);
}
