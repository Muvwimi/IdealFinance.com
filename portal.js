// Client Portal JavaScript for Ideal Finance

// Global variables
let currentUser = null;
let authToken = null;
let userLoans = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializePortal();
    setupEventListeners();
    checkStoredAuth();
});

// Initialize portal
function initializePortal() {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        showDashboard();
    } else {
        showAuthSection();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Auth form switches
    document.getElementById('show-register').addEventListener('click', () => {
        showRegistrationForm();
    });
    
    document.getElementById('show-login').addEventListener('click', () => {
        showLoginForm();
    });
    
    // Login and registration
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('register-btn').addEventListener('click', handleRegistration);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Loan application
    document.getElementById('new-loan-btn').addEventListener('click', showLoanModal);
    document.getElementById('close-loan-modal').addEventListener('click', hideLoanModal);
    
    // Loan application steps
    document.getElementById('next-step-1').addEventListener('click', () => goToStep(2));
    document.getElementById('next-step-2').addEventListener('click', () => goToStep(3));
    document.getElementById('prev-step-2').addEventListener('click', () => goToStep(1));
    document.getElementById('prev-step-3').addEventListener('click', () => goToStep(2));
    document.getElementById('submit-loan').addEventListener('click', submitLoanApplication);
    
    // Payment modal
    document.getElementById('make-payment-btn').addEventListener('click', showPaymentModal);
    document.getElementById('close-payment-modal').addEventListener('click', hidePaymentModal);
    document.getElementById('submit-payment').addEventListener('click', submitPayment);
    
    // View reports
    document.getElementById('view-reports-btn').addEventListener('click', () => {
        showNotification('Reports feature coming soon!', 'info');
    });
}

// Show authentication section
function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

// Show dashboard
function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // Update user name
    document.getElementById('user-name').textContent = currentUser.firstName || 'Client';
    
    // Load user data
    loadUserLoans();
    loadRecentActivity();
    generatePaymentCalendar();
}

// Show registration form
function showRegistrationForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

// Show login form
function showLoginForm() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

// Handle login
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store authentication data
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Login successful!', 'success');
            showDashboard();
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Handle registration
async function handleRegistration() {
    const firstName = document.getElementById('register-firstname').value;
    const lastName = document.getElementById('register-lastname').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    
    if (!firstName || !lastName || !email || !password) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                phone,
                password,
                userType: 'client'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store authentication data
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Registration successful!', 'success');
            showDashboard();
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Handle logout
function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    showNotification('Logged out successfully', 'success');
    showAuthSection();
}

// Load user's loans
async function loadUserLoans() {
    try {
        const response = await fetch('/api/loans/status', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            userLoans = data.loans || [];
            displayLoansList();
            populatePaymentLoanSelect();
        } else {
            showNotification('Failed to load loans', 'error');
        }
    } catch (error) {
        console.error('Load loans error:', error);
        showNotification('Failed to load loans', 'error');
    }
}

// Display loans list
function displayLoansList() {
    const loansList = document.getElementById('loans-list');
    
    if (userLoans.length === 0) {
        loansList.innerHTML = `
            <div class="text-center py-8">
                <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p class="text-gray-600">No loans found. Apply for your first loan to get started!</p>
            </div>
        `;
        return;
    }
    
    loansList.innerHTML = userLoans.map(loan => `
        <div class="border border-gray-200 rounded-lg p-4 mb-4">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-semibold text-gray-900">Loan #${loan.id}</h4>
                    <p class="text-sm text-gray-600">Applied ${new Date(loan.created_at).toLocaleDateString()}</p>
                </div>
                <span class="loan-status status-${loan.status}">${loan.status.toUpperCase()}</span>
            </div>
            
            <div class="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                    <span class="text-gray-600">Amount:</span>
                    <span class="font-semibold">ZMW ${parseFloat(loan.loan_amount).toLocaleString()}</span>
                </div>
                <div>
                    <span class="text-gray-600">Term:</span>
                    <span class="font-semibold">${loan.loan_term} months</span>
                </div>
                <div>
                    <span class="text-gray-600">Rate:</span>
                    <span class="font-semibold">${loan.interest_rate}%</span>
                </div>
                <div>
                    <span class="text-gray-600">Monthly:</span>
                    <span class="font-semibold">ZMW ${parseFloat(loan.monthly_payment).toFixed(2)}</span>
                </div>
                <div>
                    <span class="text-gray-600">Purpose:</span>
                    <span class="font-semibold">${loan.purpose || 'Not specified'}</span>
                </div>
                <div>
                    <span class="text-gray-600">Total:</span>
                    <span class="font-semibold">ZMW ${parseFloat(loan.total_payment).toLocaleString()}</span>
                </div>
            </div>
            
            ${loan.status === 'approved' ? `
                <div class="mt-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-600">Repayment Progress</span>
                        <span class="text-sm font-semibold">65%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 65%"></div>
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Populate payment loan select
function populatePaymentLoanSelect() {
    const select = document.getElementById('payment-loan-select');
    const approvedLoans = userLoans.filter(loan => loan.status === 'approved');
    
    select.innerHTML = '<option value="">Select a loan</option>' + 
        approvedLoans.map(loan => `
            <option value="${loan.id}">Loan #${loan.id} - ZMW ${parseFloat(loan.loan_amount).toLocaleString()}</option>
        `).join('');
}

// Load recent activity
function loadRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    
    // Mock recent activity data
    const activities = [
        {
            type: 'payment',
            description: 'Monthly payment of ZMW 470.73 received',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            status: 'completed'
        },
        {
            type: 'loan',
            description: 'Loan application #12345 submitted',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            status: 'pending'
        },
        {
            type: 'payment',
            description: 'Monthly payment of ZMW 470.73 received',
            date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000), // 32 days ago
            status: 'completed'
        }
    ];
    
    activityContainer.innerHTML = activities.map(activity => `
        <div class="flex items-center p-3 bg-gray-50 rounded-lg">
            <div class="w-10 h-10 rounded-full flex items-center justify-center mr-4 ${getActivityColor(activity.type)}">
                ${getActivityIcon(activity.type)}
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">${activity.description}</p>
                <p class="text-xs text-gray-500">${activity.date.toLocaleDateString()}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}">${activity.status.toUpperCase()}</span>
        </div>
    `).join('');
}

// Helper functions for activity display
function getActivityColor(type) {
    switch (type) {
        case 'payment': return 'bg-green-100 text-green-600';
        case 'loan': return 'bg-blue-100 text-blue-600';
        default: return 'bg-gray-100 text-gray-600';
    }
}

function getActivityIcon(type) {
    switch (type) {
        case 'payment':
            return '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"></path></svg>';
        case 'loan':
            return '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"></path></svg>';
        default:
            return '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'failed': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Generate payment calendar
function generatePaymentCalendar() {
    const calendar = document.getElementById('payment-calendar');
    const monthElement = document.getElementById('calendar-month');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthElement.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Generate calendar days
    let calendarHTML = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day"></div>';
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === now.toDateString();
        const isDueDate = day === 15 || day === 30; // Mock due dates
        const isPaid = isDueDate && day < now.getDate(); // Mock paid status
        const isOverdue = isDueDate && day < now.getDate() - 5; // Mock overdue
        
        let classes = 'calendar-day';
        if (isDueDate && isOverdue) classes += ' overdue';
        else if (isDueDate && isPaid) classes += ' paid';
        else if (isDueDate) classes += ' due';
        if (isToday) classes += ' ring-2 ring-blue-500';
        
        calendarHTML += `<div class="${classes}">${day}</div>`;
    }
    
    calendar.innerHTML = calendarHTML;
}

// Loan application modal functions
function showLoanModal() {
    document.getElementById('loan-modal').classList.remove('hidden');
    
    // Check if there's pre-filled data from the calculator
    const loanData = localStorage.getItem('loanApplication');
    if (loanData) {
        const data = JSON.parse(loanData);
        document.getElementById('app-loan-amount').value = data.amount;
        document.getElementById('app-loan-term').value = data.term;
        localStorage.removeItem('loanApplication');
    }
    
    // Pre-fill user information
    if (currentUser) {
        document.getElementById('app-firstname').value = currentUser.firstName || '';
        document.getElementById('app-lastname').value = currentUser.lastName || '';
        document.getElementById('app-email').value = currentUser.email || '';
        document.getElementById('app-phone').value = currentUser.phone || '';
    }
}

function hideLoanModal() {
    document.getElementById('loan-modal').classList.add('hidden');
    resetLoanForm();
}

function resetLoanForm() {
    // Reset to step 1
    document.querySelectorAll('.loan-step').forEach(step => step.classList.add('hidden'));
    document.getElementById('loan-step-1').classList.remove('hidden');
    
    // Reset step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index === 0) step.classList.add('active');
    });
    
    document.querySelectorAll('.step-line').forEach(line => {
        line.classList.remove('completed');
    });
    
    // Clear form
    document.getElementById('loan-step-1').querySelectorAll('input, select').forEach(input => {
        input.value = '';
    });
}

function goToStep(stepNumber) {
    // Validate current step before proceeding
    if (stepNumber === 2 && !validateStep1()) return;
    if (stepNumber === 3 && !validateStep2()) return;
    
    // Hide all steps
    document.querySelectorAll('.loan-step').forEach(step => step.classList.add('hidden'));
    
    // Show target step
    document.getElementById(`loan-step-${stepNumber}`).classList.remove('hidden');
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });
    
    // Update step lines
    document.querySelectorAll('.step-line').forEach((line, index) => {
        line.classList.remove('completed');
        if (index + 1 < stepNumber) {
            line.classList.add('completed');
        }
    });
    
    // Populate summary if going to step 3
    if (stepNumber === 3) {
        populateLoanSummary();
    }
}

function validateStep1() {
    const amount = document.getElementById('app-loan-amount').value;
    const term = document.getElementById('app-loan-term').value;
    const purpose = document.getElementById('app-loan-purpose').value;
    
    if (!amount || !term || !purpose) {
        showNotification('Please fill in all loan details', 'error');
        return false;
    }
    
    if (parseFloat(amount) < 1000 || parseFloat(amount) > 50000) {
        showNotification('Loan amount must be between ZMW 1,000 and ZMW 50,000', 'error');
        return false;
    }
    
    return true;
}

function validateStep2() {
    const firstName = document.getElementById('app-firstname').value;
    const lastName = document.getElementById('app-lastname').value;
    const email = document.getElementById('app-email').value;
    const phone = document.getElementById('app-phone').value;
    const income = document.getElementById('app-income').value;
    const employment = document.getElementById('app-employment').value;
    
    if (!firstName || !lastName || !email || !phone || !income || !employment) {
        showNotification('Please fill in all personal information', 'error');
        return false;
    }
    
    return true;
}

function populateLoanSummary() {
    const summary = document.getElementById('loan-summary');
    const amount = document.getElementById('app-loan-amount').value;
    const term = document.getElementById('app-loan-term').value;
    const purpose = document.getElementById('app-loan-purpose').value;
    const firstName = document.getElementById('app-firstname').value;
    const lastName = document.getElementById('app-lastname').value;
    const email = document.getElementById('app-email').value;
    const phone = document.getElementById('app-phone').value;
    const income = document.getElementById('app-income').value;
    const employment = document.getElementById('app-employment').value;
    
    // Calculate loan details
    const principal = parseFloat(amount);
    const loanTerm = parseInt(term);
    const annualRate = 0.12; // 12% annual rate
    const monthlyRate = annualRate / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / (Math.pow(1 + monthlyRate, loanTerm) - 1);
    const totalPayment = monthlyPayment * loanTerm;
    const totalInterest = totalPayment - principal;
    
    summary.innerHTML = `
        <div class="grid md:grid-cols-2 gap-4">
            <div>
                <h5 class="font-medium text-gray-900 mb-2">Applicant Information</h5>
                <p class="text-sm text-gray-600">Name: ${firstName} ${lastName}</p>
                <p class="text-sm text-gray-600">Email: ${email}</p>
                <p class="text-sm text-gray-600">Phone: ${phone}</p>
                <p class="text-sm text-gray-600">Monthly Income: ZMW ${parseFloat(income).toLocaleString()}</p>
                <p class="text-sm text-gray-600">Employment: ${employment}</p>
            </div>
            <div>
                <h5 class="font-medium text-gray-900 mb-2">Loan Details</h5>
                <p class="text-sm text-gray-600">Amount: ZMW ${principal.toLocaleString()}</p>
                <p class="text-sm text-gray-600">Term: ${loanTerm} months</p>
                <p class="text-sm text-gray-600">Purpose: ${purpose}</p>
                <p class="text-sm text-gray-600">Monthly Payment: ZMW ${monthlyPayment.toFixed(2)}</p>
                <p class="text-sm text-gray-600">Total Interest: ZMW ${totalInterest.toFixed(2)}</p>
                <p class="text-sm text-gray-600">Total Payment: ZMW ${totalPayment.toFixed(2)}</p>
            </div>
        </div>
    `;
}

// Submit loan application
async function submitLoanApplication() {
    // Check agreements
    const termsAgreement = document.getElementById('terms-agreement').checked;
    const creditCheckAgreement = document.getElementById('credit-check-agreement').checked;
    
    if (!termsAgreement || !creditCheckAgreement) {
        showNotification('Please accept the terms and conditions', 'error');
        return;
    }
    
    // Collect form data
    const loanData = {
        loanAmount: parseFloat(document.getElementById('app-loan-amount').value),
        loanTerm: parseInt(document.getElementById('app-loan-term').value),
        interestRate: 12.0, // 12% annual rate
        purpose: document.getElementById('app-loan-purpose').value,
        monthlyPayment: 0, // Will be calculated
        totalPayment: 0 // Will be calculated
    };
    
    // Calculate payment amounts
    const principal = loanData.loanAmount;
    const term = loanData.loanTerm;
    const annualRate = loanData.interestRate / 100;
    const monthlyRate = annualRate / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    const totalPayment = monthlyPayment * term;
    
    loanData.monthlyPayment = monthlyPayment;
    loanData.totalPayment = totalPayment;
    
    try {
        const response = await fetch('/api/loans/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(loanData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Loan application submitted successfully!', 'success');
            hideLoanModal();
            loadUserLoans(); // Refresh loans list
        } else {
            showNotification(data.error || 'Failed to submit application', 'error');
        }
    } catch (error) {
        console.error('Loan application error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Payment modal functions
function showPaymentModal() {
    document.getElementById('payment-modal').classList.remove('hidden');
}

function hidePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    
    // Clear form
    document.getElementById('payment-loan-select').value = '';
    document.getElementById('payment-amount').value = '';
    document.getElementById('payment-method').value = '';
}

// Submit payment
async function submitPayment() {
    const loanId = document.getElementById('payment-loan-select').value;
    const amount = document.getElementById('payment-amount').value;
    const method = document.getElementById('payment-method').value;
    
    if (!loanId || !amount || !method) {
        showNotification('Please fill in all payment details', 'error');
        return;
    }
    
    if (parseFloat(amount) <= 0) {
        showNotification('Please enter a valid payment amount', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                loanId: parseInt(loanId),
                amount: parseFloat(amount),
                paymentMethod: method
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Payment processed successfully!', 'success');
            hidePaymentModal();
            loadRecentActivity(); // Refresh activity
        } else {
            showNotification(data.error || 'Payment failed', 'error');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Check stored authentication on page load
function checkStoredAuth() {
    // This function is called in initializePortal
    // Already handled there
}

// Notification function (reused from main.js)
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    
    // Set colors based on type
    switch (type) {
        case 'success':
            notification.className += ' bg-green-500 text-white';
            break;
        case 'error':
            notification.className += ' bg-red-500 text-white';
            break;
        case 'warning':
            notification.className += ' bg-yellow-500 text-white';
            break;
        default:
            notification.className += ' bg-blue-500 text-white';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="flex-1">${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}