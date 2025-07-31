// Location Score Dashboard - Core Functions
// Professional implementation with comprehensive functionality

// Global Variables
let currentScoreData = [];
let displayedData = [];
let historicalData = [];
let benchmarkData = {};
let currentView = 'table';
let currentTab = 'currentScores';

// Data Management Functions
async function loadDashboardData() {
    try {
        showLoading("Loading clinic data...");
        
        // In production, replace this with actual Google Sheets data fetching
        if (DASHBOARD_CONFIG.dataSheetUrl && DASHBOARD_CONFIG.dataSheetUrl !== 'YOUR_GOOGLE_SHEET_DATA_URL_HERE') {
            await loadRealData();
        } else {
            await loadSampleData();
        }
        
        console.log(`Loaded data for ${currentScoreData.length} clinics`);
        return true;
    } catch (error) {
        console.error("Error loading dashboard data:", error);
        throw new Error("Failed to load clinic data: " + error.message);
    }
}

async function loadRealData() {
    // Fetch data from Google Sheets
    const [dataResponse, benchmarkResponse] = await Promise.all([
        fetch(DASHBOARD_CONFIG.dataSheetUrl),
        fetch(DASHBOARD_CONFIG.benchmarkSheetUrl)
    ]);
    
    if (!dataResponse.ok || !benchmarkResponse.ok) {
        throw new Error("Failed to fetch data from Google Sheets");
    }
    
    const dataText = await dataResponse.text();
    const benchmarkText = await benchmarkResponse.text();
    
    // Parse the CSV data
    const rawClinicData = parseCSVData(dataText);
    const rawBenchmarkData = parseCSVData(benchmarkText);
    
    // Process benchmark data (your format has metrics as columns)
    benchmarkData = processBenchmarkData(rawBenchmarkData);
    
    // Process clinic data and calculate scores
    currentScoreData = rawClinicData.map(clinic => {
        const processedClinic = processClinicData(clinic);
        const calculatedScores = calculateClinicScores(processedClinic);
        
        return {
            clinic: clinic.Clinic,
            lastUpdated: new Date(clinic.Date),
            ...processedClinic,
            ...calculatedScores,
            trend: generateTrendData(),
            historicalData: generateHistoricalData(12)
        };
    });
    
    // Sort by overall score
    currentScoreData.sort((a, b) => b.overallScore - a.overallScore);
    
    // Update ranks
    currentScoreData.forEach((clinic, index) => {
        clinic.rank = index + 1;
    });
}

async function loadSampleData() {
    showLoading("Generating sample data...");
    
    currentScoreData = SAMPLE_CLINICS.map((clinicName, index) => {
        const rawScores = generateSampleScores();
        const calculatedScores = calculateClinicScores(rawScores);
        
        return {
            clinic: clinicName,
            ...rawScores,
            ...calculatedScores,
            lastUpdated: new Date(),
            trend: generateTrendData(),
            historicalData: generateHistoricalData(12) // 12 months of data
        };
    });
    
    // Sort by overall score and assign ranks
    currentScoreData.sort((a, b) => b.overallScore - a.overallScore);
    currentScoreData.forEach((clinic, index) => {
        clinic.rank = index + 1;
    });
    
    displayedData = [...currentScoreData];
}

function generateSampleScores() {
    const scores = {};
    
    Object.keys(SCORING_CONFIG.categories).forEach(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        scores[categoryKey] = {};
        
        Object.keys(category.metrics).forEach(metricKey => {
            const metric = category.metrics[metricKey];
            // Generate realistic scores with some variation around targets
            const target = metric.target || 80;
            const variation = Math.random() * 30 - 15; // ±15 points variation
            let score = Math.max(0, Math.min(100, target + variation));
            
            // Add some realistic distribution
            if (Math.random() < 0.1) score = Math.max(0, score - 20); // 10% chance of poor performance
            if (Math.random() < 0.1) score = Math.min(100, score + 15); // 10% chance of excellent performance
            
            scores[categoryKey][metricKey] = Math.round(score);
        });
    });
    
    return scores;
}

function generateTrendData() {
    const trends = ['improving', 'declining', 'stable'];
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const changePercent = trend === 'stable' ? 0 : (Math.random() * 10 + 1) * (trend === 'improving' ? 1 : -1);
    
    return {
        direction: trend,
        changePercent: Math.round(changePercent * 10) / 10,
        period: 'vs. last month'
    };
}

function generateHistoricalData(months) {
    const data = [];
    const baseScore = 70 + Math.random() * 20; // Base score between 70-90
    
    for (let i = months; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        // Add some realistic variation and trends
        const trendFactor = (months - i) * 0.5; // Slight improvement over time
        const randomVariation = (Math.random() - 0.5) * 10;
        const score = Math.max(0, Math.min(100, baseScore + trendFactor + randomVariation));
        
        data.push({
            date: date.toISOString().split('T')[0],
            score: Math.round(score)
        });
    }
    
    return data;
}

// Score Calculation Functions
function calculateClinicScores(rawData) {
    const categoryScores = {};
    let totalWeightedScore = 0;
    
    // Calculate category scores
    Object.keys(SCORING_CONFIG.categories).forEach(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        let categoryScore = 0;
        let totalWeight = 0;
        
        Object.keys(category.metrics).forEach(metricKey => {
            const metric = category.metrics[metricKey];
            const rawScore = rawData[categoryKey] ? rawData[categoryKey][metricKey] : null;
            
            if (rawScore !== null && rawScore !== undefined) {
                let normalizedScore = normalizeScore(rawScore, metric);
                categoryScore += normalizedScore * metric.weight;
                totalWeight += metric.weight;
            }
        });
        
        // Calculate weighted average for category
        categoryScores[categoryKey] = totalWeight > 0 ? Math.round(categoryScore / totalWeight) : 0;
        
        // Add to overall score
        totalWeightedScore += categoryScores[categoryKey] * category.weight;
    });
    
    const overallScore = Math.round(totalWeightedScore);
    
    return {
        overallScore,
        categoryScores,
        scoreLevel: getScoreLevel(overallScore),
        performanceRating: getPerformanceRating(overallScore)
    };
}

function normalizeScore(rawScore, metric) {
    // Normalize score to 0-100 scale based on metric characteristics
    if (metric.higherIsBetter === false) {
        // For metrics where lower is better (e.g., turnover rate, complaints)
        const target = metric.target || 50;
        const maxAcceptable = target * 2; // Assume double the target is the worst acceptable
        return Math.max(0, Math.min(100, 100 - ((rawScore - target) / (maxAcceptable - target)) * 100));
    } else {
        // For metrics where higher is better
        const target = metric.target || 80;
        const minAcceptable = target * 0.5; // Assume half the target is minimum acceptable
        return Math.max(0, Math.min(100, ((rawScore - minAcceptable) / (target - minAcceptable)) * 100));
    }
}

function getScoreLevel(score) {
    const thresholds = DASHBOARD_CONFIG.scoreThresholds;
    if (score >= thresholds.excellent) return 'excellent';
    if (score >= thresholds.good) return 'good';
    if (score >= thresholds.average) return 'average';
    if (score >= thresholds.poor) return 'poor';
    return 'critical';
}

function getPerformanceRating(score) {
    const level = getScoreLevel(score);
    const ratings = {
        excellent: 'Outstanding Performance',
        good: 'Above Average Performance',
        average: 'Meets Expectations',
        poor: 'Below Expectations',
        critical: 'Needs Immediate Attention'
    };
    return ratings[level];
}

// UI Population Functions
function populateInitialData() {
    displayedData = [...currentScoreData];
    populateClinicOptions();
    updateSummaryCards(displayedData);
    populateTable(displayedData);
    populateCardView(displayedData);
    populateRankingView(displayedData);
    populateCategoryBreakdown();
    populatePerformanceAnalysis();
    updateLastUpdated();
}

function populateClinicOptions() {
    const selectors = ['clinicFilter', 'trendClinicSelector'];
    
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (!select) return;
        
        // Clear existing options except "All Clinics"
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        currentScoreData.forEach(clinic => {
            const option = document.createElement('option');
            option.value = clinic.clinic;
            option.textContent = clinic.clinic;
            select.appendChild(option);
        });
    });
}

function updateSummaryCards(data) {
    const container = document.getElementById('summaryCards');
    if (!container) return;
    
    const avgScore = Math.round(data.reduce((sum, clinic) => sum + clinic.overallScore, 0) / data.length);
    const excellentCount = data.filter(clinic => clinic.overallScore >= DASHBOARD_CONFIG.scoreThresholds.excellent).length;
    const needsAttentionCount = data.filter(clinic => clinic.overallScore < DASHBOARD_CONFIG.scoreThresholds.average).length;
    const topClinic = data[0];
    const improvingCount = data.filter(clinic => clinic.trend && clinic.trend.direction === 'improving').length;
    
    container.innerHTML = `
        <div class="summary-card">
            <h3>Network Average</h3>
            <div class="number ${getScoreLevel(avgScore)}">${avgScore}</div>
            <div class="subtitle">Overall Score</div>
        </div>
        <div class="summary-card">
            <h3>Top Performers</h3>
            <div class="number excellent">${excellentCount}</div>
            <div class="subtitle">Excellent Rating (90+)</div>
        </div>
        <div class="summary-card">
            <h3>Need Attention</h3>
            <div class="number ${needsAttentionCount > 0 ? 'poor' : 'good'}">${needsAttentionCount}</div>
            <div class="subtitle">Below Average (<70)</div>
        </div>
        <div class="summary-card">
            <h3>Top Location</h3>
            <div class="number excellent" style="font-size: 1.5em;">${topClinic.clinic}</div>
            <div class="subtitle">Score: ${topClinic.overallScore}/100</div>
        </div>
        <div class="summary-card">
            <h3>Improving Locations</h3>
            <div class="number good">${improvingCount}</div>
            <div class="subtitle">Positive Trend</div>
        </div>
    `;
}

function populateTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    data.forEach(clinic => {
        const row = document.createElement('tr');
        const trendIcon = getTrendIcon(clinic.trend);
        
        row.innerHTML = `
            <td class="metric-value"><strong>#${clinic.rank}</strong></td>
            <td class="clinic-name">${clinic.clinic}</td>
            <td class="metric-value">${getScoreBadge(clinic.overallScore)}</td>
            <td class="metric-value">${getScoreBadge(clinic.categoryScores.financial)}</td>
            <td class="metric-value">${getScoreBadge(clinic.categoryScores.operational)}</td>
            <td class="metric-value">${getScoreBadge(clinic.categoryScores.patientExperience)}</td>
            <td class="metric-value">${getScoreBadge(clinic.categoryScores.staffing)}</td>
            <td class="metric-value">${trendIcon}</td>
            <td class="metric-value">
                <button class="action-button" onclick="showClinicDetails('${clinic.clinic}', false)">
                    View Details
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateCardView(data) {
    const cardView = document.getElementById('cardView');
    if (!cardView) return;
    
    cardView.innerHTML = '';
    cardView.style.display = 'grid';
    cardView.style.gridTemplateColumns = 'repeat(auto-fit, minmax(350px, 1fr))';
    cardView.style.gap = '20px';
    
    data.forEach(clinic => {
        const card = document.createElement('div');
        card.className = 'category-card';
        const trendIcon = getTrendIcon(clinic.trend);
        
        card.innerHTML = `
            <div class="category-title">
                ${clinic.clinic} 
                <span style="float: right; font-size: 0.8em; color: #666;">#${clinic.rank}</span>
            </div>
            <div style="text-align: center; margin: 15px 0;">
                ${getScoreBadge(clinic.overallScore, 'large')}
                <div style="margin-top: 8px; font-size: 0.9em; color: #666;">
                    ${clinic.performanceRating} ${trendIcon}
                </div>
            </div>
            <div class="metric-item">
                <span class="metric-name">Financial Performance</span>
                <span class="metric-score">${getScoreBadge(clinic.categoryScores.financial)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-name">Operational Efficiency</span>
                <span class="metric-score">${getScoreBadge(clinic.categoryScores.operational)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-name">Patient Experience</span>
                <span class="metric-score">${getScoreBadge(clinic.categoryScores.patientExperience)}</span>
            </div>
            <div class="metric-item">
                <span class="metric-name">Staffing & HR</span>
                <span class="metric-score">${getScoreBadge(clinic.categoryScores.staffing)}</span>
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button class="action-button" onclick="showClinicDetails('${clinic.clinic}', true)">
                    View Detailed Analysis
                </button>
            </div>
        `;
        cardView.appendChild(card);
    });
}

function populateRankingView(data) {
    const rankingView = document.getElementById('rankingView');
    if (!rankingView) return;
    
    rankingView.innerHTML = '<h3 style="margin-bottom: 20px;">Location Performance Ranking</h3>';
    
    data.forEach(clinic => {
        const rankingItem = document.createElement('div');
        rankingItem.className = 'ranking-item';
        const trendIcon = getTrendIcon(clinic.trend);
        
        rankingItem.innerHTML = `
            <div class="rank-number">${clinic.rank}</div>
            <div class="rank-clinic">${clinic.clinic}</div>
            <div style="text-align: center; margin: 0 15px;">
                <div>${clinic.performanceRating}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">${trendIcon}</div>
            </div>
            <div class="rank-score">${getScoreBadge(clinic.overallScore)}</div>
        `;
        
        rankingView.appendChild(rankingItem);
    });
}

function populateCategoryBreakdown() {
    const container = document.getElementById('categoryBreakdownContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.keys(SCORING_CONFIG.categories).forEach(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        const card = document.createElement('div');
        card.className = 'category-card';
        
        let metricsHtml = '';
        Object.keys(category.metrics).forEach(metricKey => {
            const metric = category.metrics[metricKey];
            metricsHtml += `
                <div class="metric-item">
                    <div>
                        <div class="metric-name">${metric.name}</div>
                        <div style="font-size: 0.8em; color: #888; margin-top: 2px;">
                            ${metric.description}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div class="metric-score">${Math.round(metric.weight * 100)}%</div>
                        <div class="weight-indicator">weight</div>
                    </div>
                </div>
            `;
        });
        
        card.innerHTML = `
            <div class="category-title">
                <span style="margin-right: 10px;">${category.icon}</span>
                ${category.name}
                <div style="font-size: 0.8em; font-weight: normal; color: #666; margin-top: 5px;">
                    ${Math.round(category.weight * 100)}% of total score
                </div>
            </div>
            <div style="margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 0.9em; color: #555;">
                ${category.description}
            </div>
            ${metricsHtml}
        `;
        
        container.appendChild(card);
    });
}

// Utility Functions
function getScoreBadge(score, size = 'normal') {
    const level = getScoreLevel(score);
    const sizeClass = size === 'large' ? ' style="font-size: 1.2em; padding: 8px 16px;"' : '';
    return `<span class="score-badge score-${level}"${sizeClass}>${score}</span>`;
}

function getTrendIcon(trend) {
    if (!trend) return '<span class="trend-stable">→</span>';
    
    const icons = {
        improving: '<span class="trend-up">↗</span>',
        declining: '<span class="trend-down">↘</span>',
        stable: '<span class="trend-stable">→</span>'
    };
    
    const changeText = trend.changePercent ? ` ${Math.abs(trend.changePercent)}%` : '';
    return `${icons[trend.direction]}${changeText}`;
}

function parseCSVData(csvText) {
    // Simple CSV parser - in production, use a more robust library
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        data.push(row);
    }
    
    return data;
}

function processClinicData(rawClinic) {
    // Convert your Google Sheets format to dashboard format
    return {
        financial: {
            netProfitPercent: parseFloat(rawClinic.Net_Profit_Percent) || 0,
            revenueCycle: parseFloat(rawClinic.Revenue_Cycle_Efficiency) || 0,
            operatingExpenseRatio: parseFloat(rawClinic.Operating_Expense_Ratio) || 0,
            payerMixOptimization: parseFloat(rawClinic.Payer_Mix_Optimization) || 0
        },
        operational: {
            utilizationRate: parseFloat(rawClinic.Therapist_Utilization_Rate) || 0,
            newPatientPercent: parseFloat(rawClinic.New_Patient_Percentage) || 0,
            patientVisitAverage: parseFloat(rawClinic.Patient_Visit_Average) || 0,
            scheduleAdherence: parseFloat(rawClinic.Schedule_Adherence_Rate) || 0,
            documentationTimeliness: parseFloat(rawClinic.Documentation_Timeliness) || 0,
            targetVisitsPercent: parseFloat(rawClinic.Target_Visits_Achievement) || 0
        },
        patientExperience: {
            patientSatisfactionScores: parseFloat(rawClinic.Patient_Satisfaction_Score) || 0,
            patientRetentionRate: parseFloat(rawClinic.Patient_Retention_Rate) || 0,
            patientComplaints: parseFloat(rawClinic.Patient_Complaints) || 0
        },
        staffing: {
            turnoverRates: parseFloat(rawClinic.Staff_Turnover_Rate) || 0,
            employeeEngagement: parseFloat(rawClinic.Employee_Engagement) || 0,
            employeeSatisfaction: parseFloat(rawClinic.Employee_Satisfaction) || 0,
            employeeLifespan: parseFloat(rawClinic.Employee_Tenure_Months) || 0
        }
    };
}

function processBenchmarkData(rawBenchmarkData) {
    // Convert your benchmark format (metrics as columns) to dashboard format
    const processed = {};
    
    if (rawBenchmarkData.length > 0) {
        const benchmarkRow = rawBenchmarkData[0]; // Assuming first row has the benchmarks
        
        processed.financial = {
            netProfitPercent: parseFloat(benchmarkRow.Net_Profit_Percent) || 15,
            revenueCycle: parseFloat(benchmarkRow.Revenue_Cycle_Efficiency) || 85,
            operatingExpenseRatio: parseFloat(benchmarkRow.Operating_Expense_Ratio) || 75,
            payerMixOptimization: parseFloat(benchmarkRow.Payer_Mix_Optimization) || 80
        };
        
        processed.operational = {
            utilizationRate: parseFloat(benchmarkRow.Therapist_Utilization_Rate) || 85,
            newPatientPercent: parseFloat(benchmarkRow.New_Patient_Percentage) || 20,
            patientVisitAverage: parseFloat(benchmarkRow.Patient_Visit_Average) || 12,
            scheduleAdherence: parseFloat(benchmarkRow.Schedule_Adherence_Rate) || 90,
            documentationTimeliness: parseFloat(benchmarkRow.Documentation_Timeliness) || 95,
            targetVisitsPercent: parseFloat(benchmarkRow.Target_Visits_Achievement) || 90
        };
        
        processed.patientExperience = {
            patientSatisfactionScores: parseFloat(benchmarkRow.Patient_Satisfaction_Score) || 90,
            patientRetentionRate: parseFloat(benchmarkRow.Patient_Retention_Rate) || 85,
            patientComplaints: parseFloat(benchmarkRow.Patient_Complaints) || 5
        };
        
        processed.staffing = {
            turnoverRates: parseFloat(benchmarkRow.Staff_Turnover_Rate) || 15,
            employeeEngagement: parseFloat(benchmarkRow.Employee_Engagement) || 80,
            employeeSatisfaction: parseFloat(benchmarkRow.Employee_Satisfaction) || 85,
            employeeLifespan: parseFloat(benchmarkRow.Employee_Tenure_Months) || 24
        };
    }
    
    return processed;
}

// Event Listeners
function setupEventListeners() {
    // Set up filter event listeners
    const scoreFilter = document.getElementById('scoreFilter');
    const clinicFilter = document.getElementById('clinicFilter');
    const searchInput = document.getElementById('searchInput');
    const timePeriodFilter = document.getElementById('timePeriodFilter');
    const trendTimeRange = document.getElementById('trendTimeRange');
    const trendClinicSelector = document.getElementById('trendClinicSelector');
    const benchmarkType = document.getElementById('benchmarkType');
    
    if (scoreFilter) scoreFilter.addEventListener('change', filterTable);
    if (clinicFilter) clinicFilter.addEventListener('change', filterTable);
    if (searchInput) searchInput.addEventListener('input', filterTable);
    if (timePeriodFilter) timePeriodFilter.addEventListener('change', changeTimePeriod);
    if (trendTimeRange) trendTimeRange.addEventListener('change', updateTrendChart);
    if (trendClinicSelector) trendClinicSelector.addEventListener('change', updateTrendChart);
    if (benchmarkType) benchmarkType.addEventListener('change', updateBenchmarks);
    
    // Auto-refresh data periodically
    setInterval(async () => {
        try {
            await loadDashboardData();
            populateInitialData();
            console.log("Data refreshed automatically");
        } catch (error) {
            console.error("Auto-refresh failed:", error);
        }
    }, DASHBOARD_CONFIG.dataRefreshInterval);
    
    // Update timestamp periodically
    setInterval(updateLastUpdated, 60000);
}

// Filter and Search Functions
function filterTable() {
    const scoreFilter = document.getElementById('scoreFilter').value;
    const clinicFilter = document.getElementById('clinicFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    displayedData = currentScoreData.filter(clinic => {
        const scoreMatch = scoreFilter === 'all' || getScoreLevel(clinic.overallScore) === scoreFilter;
        const clinicMatch = clinicFilter === 'all' || clinic.clinic === clinicFilter;
        const searchMatch = clinic.clinic.toLowerCase().includes(searchInput);
        return scoreMatch && clinicMatch && searchMatch;
    });
    
    // Update all views with filtered data
    populateTable(displayedData);
    populateCardView(displayedData);
    populateRankingView(displayedData);
    updateSummaryCards(displayedData);
}

function changeTimePeriod() {
    const period = document.getElementById('timePeriodFilter').value;
    console.log(`Time period changed to: ${period}`);
    // In a real implementation, this would filter data by time period
    // For now, we'll just log the change
}

// View Toggle Functions
function toggleView(view) {
    const tableView = document.getElementById('tableView');
    const cardView = document.getElementById('cardView');
    const rankingView = document.getElementById('rankingView');
    const buttons = document.querySelectorAll('.view-toggle button');
    
    // Reset all buttons
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Hide all views
    tableView.style.display = 'none';
    cardView.style.display = 'none';
    rankingView.style.display = 'none';
    
    // Show selected view and activate button
    switch(view) {
        case 'table':
            tableView.style.display = 'block';
            buttons[0].classList.add('active');
            break;
        case 'cards':
            cardView.style.display = 'grid';
            buttons[1].classList.add('active');
            break;
        case 'ranking':
            rankingView.style.display = 'block';
            buttons[2].classList.add('active');
            break;
    }
    
    currentView = view;
}

function switchTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove('active');
    }
    
    const tablinks = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove('active');
    }
    
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
    
    currentTab = tabName;
    
    // Load tab-specific content if needed
    if (tabName === 'trendAnalysis') {
        loadTrendAnalysis();
    } else if (tabName === 'benchmarkComparison') {
        loadBenchmarkComparison();
    }
}

// Utility Functions
function updateLastUpdated() {
    const element = document.getElementById('lastUpdated');
    if (element) {
        element.textContent = `Last updated: ${new Date().toLocaleString()}`;
    }
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageElement = document.getElementById('loadingMessage');
    if (overlay) {
        overlay.style.display = 'flex';
    }
    if (messageElement) {
        messageElement.textContent = message;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showError(message) {
    hideLoading();
    alert(`Error: ${message}`);
    console.error(message);
}
