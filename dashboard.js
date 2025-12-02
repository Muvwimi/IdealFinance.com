// Management Dashboard JavaScript for Ideal Finance

// Global variables
let currentUser = null;
let authToken = null;
let dashboardData = {};
let clientsData = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupEventListeners();
    checkAdminAccess();
});

// Initialize dashboard
function initializeDashboard() {
    // Check if user is logged in and has admin access
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        
        // Verify admin access
        if (currentUser.userType === 'admin' || currentUser.userType === 'manager') {
            loadDashboardData();
        } else {
            showNotification('Access denied. Admin privileges required.', 'error');
            setTimeout(() => {
                window.location.href = 'portal.html';
            }, 2000);
        }
    } else {
        showNotification('Please login to access the dashboard', 'error');
        setTimeout(() => {
            window.location.href = 'portal.html';
        }, 2000);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Filter buttons
    document.getElementById('apply-filters').addEventListener('click', applyFilters);
    
    // Search input
    document.getElementById('client-search').addEventListener('input', debounce(applyFilters, 300));
    
    // Filter dropdowns
    document.getElementById('client-status-filter').addEventListener('change', applyFilters);
    document.getElementById('loan-type-filter').addEventListener('change', applyFilters);
}

// Check admin access
function checkAdminAccess() {
    if (!currentUser || (currentUser.userType !== 'admin' && currentUser.userType !== 'manager')) {
        showNotification('Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = 'portal.html';
        }, 2000);
        return false;
    }
    return true;
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load analytics data
        const analyticsResponse = await fetch('/api/dashboard/analytics', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            dashboardData = analyticsData;
            updateMetrics(analyticsData);
            initializeCharts(analyticsData);
        }
        
        // Load clients data
        const clientsResponse = await fetch('/api/loans/status', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (clientsResponse.ok) {
            const clientsData = await clientsResponse.json();
            this.clientsData = clientsData.loans || [];
            populateClientsTable(this.clientsData);
        }
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// Update key metrics
function updateMetrics(data) {
    // Total loans
    const totalLoans = data.totalLoans?.total || 0;
    document.getElementById('total-loans').textContent = `ZMW ${parseFloat(totalLoans).toLocaleString()}`;
    
    // Total clients
    const totalClients = data.totalUsers || 0;
    document.getElementById('total-clients').textContent = totalClients.toLocaleString();
    
    // Repayment rate (mock data for now)
    document.getElementById('repayment-rate').textContent = '98.5%';
    
    // Monthly growth (mock data for now)
    document.getElementById('monthly-growth').textContent = '15.2%';
}

// Initialize charts
function initializeCharts(data) {
    initializePortfolioChart(data);
    initializePerformanceChart(data);
}

// Initialize portfolio chart
function initializePortfolioChart(data) {
    const chartDom = document.getElementById('portfolio-chart');
    const myChart = echarts.init(chartDom);
    
    // Process data for chart
    const statusData = data.loansByStatus || [];
    const chartData = statusData.map(item => ({
        name: item.status.toUpperCase(),
        value: parseInt(item.count)
    }));
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            textStyle: {
                fontSize: 12
            }
        },
        series: [
            {
                name: 'Loan Status',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['60%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '18',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: chartData,
                color: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']
            }
        ]
    };
    
    myChart.setOption(option);
    
    // Make chart responsive
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// Initialize performance chart
function initializePerformanceChart(data) {
    const chartDom = document.getElementById('performance-chart');
    const myChart = echarts.init(chartDom);
    
    // Process monthly data
    const monthlyData = data.monthlyLoans || [];
    const months = monthlyData.map(item => {
        const date = new Date(item.month);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }).reverse();
    
    const loanCounts = monthlyData.map(item => parseInt(item.count)).reverse();
    const loanAmounts = monthlyData.map(item => parseFloat(item.total)).reverse();
    
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            }
        },
        legend: {
            data: ['Number of Loans', 'Total Amount'],
            textStyle: {
                fontSize: 12
            }
        },
        xAxis: [
            {
                type: 'category',
                data: months,
                axisPointer: {
                    type: 'shadow'
                },
                axisLabel: {
                    fontSize: 11
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: 'Count',
                position: 'left',
                axisLabel: {
                    fontSize: 11
                }
            },
            {
                type: 'value',
                name: 'Amount (ZMW)',
                position: 'right',
                axisLabel: {
                    fontSize: 11,
                    formatter: function(value) {
                        return value >= 1000000 ? (value / 1000000) + 'M' : value >= 1000 ? (value / 1000) + 'K' : value;
                    }
                }
            }
        ],
        series: [
            {
                name: 'Number of Loans',
                type: 'bar',
                data: loanCounts,
                itemStyle: {
                    color: '#3b82f6'
                }
            },
            {
                name: 'Total Amount',
                type: 'line',
                yAxisIndex: 1,
                data: loanAmounts,
                itemStyle: {
                    color: '#10b981'
                },
                lineStyle: {
                    width: 3
                }
            }
        ]
    };
    
    myChart.setOption(option);
    
    // Make chart responsive
    window.addEventListener('resize', function() {
        myChart.resize();
    });
}

// Populate clients table
function populateClientsTable(clients) {
    const tableBody = document.getElementById('clients-table-body');
    
    if (clients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    No clients found matching the current filters.
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = clients.map(client => `
        <tr>
            <td class="font-medium">#${client.id}</td>
            <td>${client.first_name || 'N/A'} ${client.last_name || ''}</td>
            <td>${client.email || 'N/A'}</td>
            <td class="font-semibold">ZMW ${parseFloat(client.loan_amount || 0).toLocaleString()}</td>
            <td><span class="status-badge status-${client.status || 'pending'}">${(client.status || 'pending').toUpperCase()}</span></td>
            <td>${client.last_payment ? new Date(client.last_payment).toLocaleDateString() : 'N/A'}</td>
            <td>
                <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick="viewClientDetails(${client.id})">
                        View
                    </button>
                    <button class="text-green-600 hover:text-green-800 text-sm font-medium" onclick="contactClient(${client.id})">
                        Contact
                    </button>
                    <button class="text-red-600 hover:text-red-800 text-sm font-medium" onclick="flagClient(${client.id})">
                        Flag
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('client-search').value.toLowerCase();
    const statusFilter = document.getElementById('client-status-filter').value;
    const typeFilter = document.getElementById('loan-type-filter').value;
    
    let filteredClients = clientsData.filter(client => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (client.first_name && client.first_name.toLowerCase().includes(searchTerm)) ||
            (client.last_name && client.last_name.toLowerCase().includes(searchTerm)) ||
            (client.email && client.email.toLowerCase().includes(searchTerm));
        
        // Status filter
        const matchesStatus = !statusFilter || client.status === statusFilter;
        
        // Type filter (mock implementation)
        const matchesType = !typeFilter || true; // Would filter by loan type if available
        
        return matchesSearch && matchesStatus && matchesType;
    });
    
    populateClientsTable(filteredClients);
}

// Client action functions
function viewClientDetails(clientId) {
    showNotification(`Viewing details for client #${clientId}`, 'info');
    // In a real implementation, this would open a detailed view modal
}

function contactClient(clientId) {
    showNotification(`Opening contact form for client #${clientId}`, 'info');
    // In a real implementation, this would open a contact form
}

function flagClient(clientId) {
    if (confirm(`Are you sure you want to flag client #${clientId}?`)) {
        showNotification(`Client #${clientId} has been flagged for review`, 'warning');
        // In a real implementation, this would update the client's status
    }
}

// Load recent activity
function loadRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    
    // Mock recent activity data for management
    const activities = [
        {
            type: 'loan_approved',
            description: 'Loan #12456 approved for Mwangala Namwawa - ZMW 15,000',
            date: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            user: 'Admin',
            status: 'completed'
        },
        {
            type: 'payment_received',
            description: 'Payment received from client #123 - ZMW 470.73',
            date: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            user: 'System',
            status: 'completed'
        },
        {
            type: 'risk_alert',
            description: 'High risk alert: Client #145 has missed 2 consecutive payments',
            date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            user: 'System',
            status: 'warning'
        },
        {
            type: 'new_application',
            description: 'New loan application submitted by Brian Mwila - ZMW 8,500',
            date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
            user: 'Client',
            status: 'pending'
        },
        {
            type: 'audit_log',
            description: 'System audit completed - All compliance checks passed',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            user: 'System',
            status: 'completed'
        }
    ];
    
    activityContainer.innerHTML = activities.map(activity => `
        <div class="flex items-center p-4 bg-gray-50 rounded-lg">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${getActivityColor(activity.type)}">
                ${getActivityIcon(activity.type)}
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">${activity.description}</p>
                <div class="flex items-center space-x-4 mt-1">
                    <p class="text-xs text-gray-500">${activity.date.toLocaleString()}</p>
                    <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}">${activity.user}</span>
                </div>
            </div>
            <span class="text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}">${activity.status.toUpperCase()}</span>
        </div>
    `).join('');
}

// Helper functions for activity display
function getActivityColor(type) {
    switch (type) {
        case 'payment_received':
        case 'loan_approved':
            return 'bg-green-100 text-green-600';
        case 'new_application':
            return 'bg-blue-100 text-blue-600';
        case 'risk_alert':
            return 'bg-red-100 text-red-600';
        case 'audit_log':
            return 'bg-purple-100 text-purple-600';
        default:
            return 'bg-gray-100 text-gray-600';
    }
}

function getActivityIcon(type) {
    switch (type) {
        case 'payment_received':
            return '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"></path></svg>';
        case 'loan_approved':
            return '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
        case 'new_application':
            return '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"></path></svg>';
        case 'risk_alert':
            return '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
        case 'audit_log':
            return '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>';
        default:
            return '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'warning':
            return 'bg-red-100 text-red-800';
        case 'info':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

// Handle logout
function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'portal.html';
    }, 1000);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    
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
    
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}