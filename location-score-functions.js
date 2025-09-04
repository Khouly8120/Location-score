// Location Score Dashboard - Core Functions
// Professional implementation with comprehensive functionality

// Global Variables
let currentScoreData = [];
let originalScoreData = []; // Store original unfiltered data
let displayedData = [];
let historicalData = [];
let benchmarkData = {};
let currentView = 'table';
let currentTab = 'currentScores';
// Indexed data by month (YYYY-MM) and clinic for real month filtering & averaging
let monthClinicMap = {}; // { 'YYYY-MM': { [clinicName]: clinicRecord } }

// Utility: parse a sheet date consistently in local time
function parseSheetDate(value) {
    if (!value) return null;
    // If already a Date
    if (value instanceof Date) return value;
    const str = String(value).trim();
    // Match YYYY-MM-DD or YYYY/M/D variants
    const isoLike = str.match(/^\s*(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})\s*$/);
    if (isoLike) {
        const y = parseInt(isoLike[1], 10);
        const m = parseInt(isoLike[2], 10);
        const d = parseInt(isoLike[3], 10);
        return new Date(y, m - 1, d); // Local time
    }
    // Try MM/DD/YYYY or M/D/YYYY (local)
    const usLike = str.match(/^\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s*$/);
    if (usLike) {
        const m = parseInt(usLike[1], 10);
        const d = parseInt(usLike[2], 10);
        const y = parseInt(usLike[3], 10);
        return new Date(y, m - 1, d);
    }
    // Fallback to Date parser (may be locale-dependent)
    const fallback = new Date(str);
    return isNaN(fallback) ? null : fallback;
}

// Data Management Functions
async function loadDashboardData() {
    try {
        showLoading("Loading clinic data...");
        
        console.log('🔍 Checking data source configuration...');
        console.log('📊 Data Sheet URL:', DASHBOARD_CONFIG.dataSheetUrl);
        console.log('🎯 Benchmark Sheet URL:', DASHBOARD_CONFIG.benchmarkSheetUrl);
        
        // Validate Google Sheets URLs
        const isValidDataUrl = DASHBOARD_CONFIG.dataSheetUrl && 
                              DASHBOARD_CONFIG.dataSheetUrl !== 'YOUR_GOOGLE_SHEET_DATA_URL_HERE' &&
                              DASHBOARD_CONFIG.dataSheetUrl.includes('docs.google.com');
                              
        const isValidBenchmarkUrl = DASHBOARD_CONFIG.benchmarkSheetUrl && 
                                   DASHBOARD_CONFIG.benchmarkSheetUrl !== 'YOUR_GOOGLE_SHEET_BENCHMARK_URL_HERE' &&
                                   DASHBOARD_CONFIG.benchmarkSheetUrl.includes('docs.google.com');
        
        if (isValidDataUrl && isValidBenchmarkUrl) {
            // Force real data loading - always use Google Sheets data
            console.log('✅ Loading REAL data from Google Sheets...');
            await loadRealData();
            
            // Verify that real data was loaded successfully
            const hasRealData = currentScoreData.length > 0 && 
                               currentScoreData[0].lastUpdated && 
                               Object.keys(benchmarkData).length > 0;
            
            if (hasRealData) {
                console.log('✅ Real data loaded successfully');
                updateTimestamp('Data loaded from Google Sheets');
            } else {
                console.warn('⚠️ Real data load attempt failed or returned empty data');
                throw new Error('Failed to load real data from Google Sheets');
            }
        } else {
            console.warn('⚠️ Google Sheets URLs not configured properly, falling back to sample data');
            console.log('Expected format: https://docs.google.com/spreadsheets/...');
            await loadSampleData();
        }
        
        console.log(`📈 Loaded data for ${currentScoreData.length} clinics`);
        
        // Log data source confirmation with detailed information
        if (currentScoreData.length > 0) {
            const firstClinic = currentScoreData[0];
            console.log('🏥 First clinic data sample:', {
                name: firstClinic.clinic,
                overallScore: firstClinic.overallScore,
                hasRealData: !!firstClinic.lastUpdated,
                dataSource: firstClinic.lastUpdated ? 'Google Sheets' : 'Sample Data',
                financialMetrics: firstClinic.financial,
                operationalMetrics: firstClinic.operational
            });
        }
        
        return true;
    } catch (error) {
        console.error("❌ Error loading dashboard data:", error);
        console.log('🔄 Falling back to sample data due to error...');
        try {
            await loadSampleData();
            updateTimestamp('Using sample data (Google Sheets data failed to load)');
            console.log('✅ Sample data loaded as fallback');
        } catch (fallbackError) {
            console.error('❌ Even sample data failed to load:', fallbackError);
            throw new Error("Failed to load any clinic data: " + error.message);
        }
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
    
    // Build monthly index: for each month, keep the latest row per clinic
    monthClinicMap = {}; // reset
    rawClinicData.forEach(row => {
        const clinicName = (row.Clinic || '').trim();
        if (!clinicName) return;
        const date = parseSheetDate(row.Date);
        if (isNaN(date)) return;
        // Build month key in local time to avoid UTC shifting (e.g., Aug 1 local -> Jul 31 UTC)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthClinicMap[monthKey]) monthClinicMap[monthKey] = {};
        const existing = monthClinicMap[monthKey][clinicName];
        if (!existing || date > existing.lastUpdated) {
            // Process and score this row for month snapshot
            const processedClinic = processClinicData(row);
            const calculatedScores = calculateClinicScores(processedClinic);
            monthClinicMap[monthKey][clinicName] = {
                clinic: clinicName,
                lastUpdated: date,
                ...processedClinic,
                ...calculatedScores,
                trend: generateTrendData(),
                historicalData: generateHistoricalData(12)
            };
        }
    });
    
    // Determine the latest month available and use it as the default snapshot
    const monthKeys = Object.keys(monthClinicMap).sort(); // lexicographic works for YYYY-MM
    const latestMonthKey = monthKeys.length ? monthKeys[monthKeys.length - 1] : null;
    if (!latestMonthKey) {
        console.warn('No valid month data found in Google Sheets.');
    }
    
    // Log available months for debugging
    if (monthKeys.length) {
        console.log(`📅 Available months: ${monthKeys.join(', ')}`);
        console.log(`🗓️ Using latest month snapshot: ${latestMonthKey}`);
    }
     
    // Use the latest month snapshot for currentScoreData
    currentScoreData = latestMonthKey ? Object.values(monthClinicMap[latestMonthKey]) : [];
     
    // Sort by overall score
    currentScoreData.sort((a, b) => b.overallScore - a.overallScore);
     
    // Update ranks
    currentScoreData.forEach((clinic, index) => {
        clinic.rank = index + 1;
    });
     
    // Store original data for filtering
    originalScoreData = [...currentScoreData];
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
    
    // Debug logging for clinic score calculation
    const clinicName = rawData.clinic || 'Unknown Clinic';
    const debugInfo = {
        clinicName: clinicName,
        categories: {},
        overallCalculation: [],
        benchmarkSource: Object.keys(benchmarkData).length > 0 ? 'Google Sheets' : 'Default Config'
    };
    
    console.log(`🏥 Starting score calculation for: ${clinicName}`);
    console.log(`📊 Using benchmark source: ${debugInfo.benchmarkSource}`);
    
    // Validate that rawData has the expected structure
    if (!rawData) {
        console.error(`❌ Invalid clinic data for ${clinicName}: Data is null or undefined`);
        return {
            overallScore: 0,
            categoryScores: {},
            scoreLevel: 'critical',
            performanceRating: 'Critical',
            error: 'Invalid clinic data'
        };
    }
    
    // Calculate category scores
    Object.keys(SCORING_CONFIG.categories).forEach(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        let categoryScore = 0;
        let totalWeight = 0;
        let validMetricsCount = 0;
        
        const categoryDebug = {
            categoryName: category.name,
            categoryWeight: category.weight,
            metrics: [],
            rawCategoryScore: 0,
            finalCategoryScore: 0,
            missingMetrics: []
        };
        
        // Validate that the category exists in rawData
        if (!rawData[categoryKey]) {
            console.warn(`⚠️ Missing category ${categoryKey} in clinic data for ${clinicName}`);
            categoryDebug.error = `Missing category data`;
        }
        
        Object.keys(category.metrics).forEach(metricKey => {
            const metric = category.metrics[metricKey];
            const rawScore = rawData[categoryKey] ? rawData[categoryKey][metricKey] : null;
            
            // Detailed metric debug object
            const metricDebug = {
                metricName: metric.name,
                metricKey: metricKey,
                rawValue: rawScore,
                weight: metric.weight,
                higherIsBetter: metric.higherIsBetter
            };
            
            if (rawScore !== null && rawScore !== undefined) {
                // CRITICAL FIX: Use benchmark data from Google Sheets for targets
                const targetValue = benchmarkData[categoryKey] && benchmarkData[categoryKey][metricKey] !== undefined ? 
                    benchmarkData[categoryKey][metricKey] : metric.target;
                
                // Create metric object with correct target from Google Sheets
                const metricWithBenchmark = {
                    ...metric,
                    target: targetValue
                };
                
                // Update debug info
                metricDebug.target = targetValue;
                metricDebug.targetSource = benchmarkData[categoryKey] && benchmarkData[categoryKey][metricKey] !== undefined ? 
                    'Google Sheets' : 'Config Default';
                
                // Calculate normalized score
                let normalizedScore = normalizeScore(rawScore, metricWithBenchmark);
                const weightedScore = normalizedScore * metric.weight;
                
                // Update metrics
                categoryScore += weightedScore;
                totalWeight += metric.weight;
                validMetricsCount++;
                
                // Update debug info
                metricDebug.normalizedScore = normalizedScore;
                metricDebug.weightedScore = weightedScore;
                
                // Log any problematic scores
                if (normalizedScore < 50 || Math.abs(rawScore - targetValue) < 1 && normalizedScore < 95) {
                    console.warn(`⚠️ Potential scoring issue for ${clinicName} - ${metric.name}: ` +
                               `Raw: ${rawScore}, Target: ${targetValue}, Score: ${normalizedScore}`);
                }
            } else {
                // Missing metric data
                metricDebug.error = 'Missing data';
                metricDebug.normalizedScore = 0;
                metricDebug.weightedScore = 0;
                categoryDebug.missingMetrics.push(metricKey);
                
                console.warn(`⚠️ Missing metric data for ${clinicName} - ${metric.name}`);
            }
            
            categoryDebug.metrics.push(metricDebug);
        });
        
        // Calculate weighted average for category
        const finalCategoryScore = totalWeight > 0 ? Math.round(categoryScore / totalWeight) : 0;
        categoryScores[categoryKey] = finalCategoryScore;
        
        // Update category debug info
        categoryDebug.rawCategoryScore = categoryScore;
        categoryDebug.totalWeight = totalWeight;
        categoryDebug.finalCategoryScore = finalCategoryScore;
        categoryDebug.validMetricsCount = validMetricsCount;
        categoryDebug.totalMetrics = Object.keys(category.metrics).length;
        
        debugInfo.categories[categoryKey] = categoryDebug;
        
        // Add to overall score
        const categoryContribution = finalCategoryScore * category.weight;
        totalWeightedScore += categoryContribution;
        
        debugInfo.overallCalculation.push({
            category: category.name,
            categoryScore: finalCategoryScore,
            categoryWeight: category.weight,
            contribution: categoryContribution,
            validMetrics: `${validMetricsCount}/${Object.keys(category.metrics).length}`
        });
        
        console.log(`📊 ${category.name}: ${finalCategoryScore} (weight: ${Math.round(category.weight * 100)}%, contribution: ${Math.round(categoryContribution)}, metrics: ${validMetricsCount}/${Object.keys(category.metrics).length})`);
    });
    
    const overallScore = Math.round(totalWeightedScore);
    
    // Update overall debug info
    debugInfo.totalWeightedScore = totalWeightedScore;
    debugInfo.finalOverallScore = overallScore;
    debugInfo.timestamp = new Date().toISOString();
    
    console.log(`🎯 Overall Score for ${clinicName}: ${overallScore}`);
    console.log('📋 Detailed calculation:', debugInfo);
    
    // Store calculation details in a global variable for debugging
    if (!window.scoreCalculationHistory) {
        window.scoreCalculationHistory = {};
    }
    window.scoreCalculationHistory[clinicName] = debugInfo;
    
    return {
        overallScore,
        categoryScores,
        scoreLevel: getScoreLevel(overallScore),
        performanceRating: getPerformanceRating(overallScore),
        calculationTimestamp: new Date().toISOString()
    };
}

function normalizeScore(rawScore, metric) {
    // Normalize score to 0-100 scale based on metric characteristics
    if (rawScore === undefined || rawScore === null || isNaN(parseFloat(rawScore))) {
        console.error(`❌ Invalid raw score for metric ${metric.name || 'unknown'}: ${rawScore}`);
        return 0; // Return 0 for invalid scores
    }
    
    // Ensure rawScore is a number
    rawScore = parseFloat(rawScore);
    
    // Ensure target is valid
    const target = metric.target || 80;
    if (isNaN(target) || target <= 0) {
        console.error(`❌ Invalid target for metric ${metric.name || 'unknown'}: ${metric.target}`);
        return 0; // Return 0 for invalid targets
    }
    
    // Debug logging for score calculation
    const debugInfo = {
        metricName: metric.name || 'unnamed metric',
        rawScore: rawScore,
        target: target,
        higherIsBetter: metric.higherIsBetter,
        unit: metric.unit || '%'
    };
    
    let calculatedScore;
    
    // Check if higherIsBetter is explicitly defined
    if (metric.higherIsBetter === undefined) {
        console.warn(`⚠️ Metric ${metric.name || 'unnamed'} does not have higherIsBetter defined, defaulting to true`);
        metric.higherIsBetter = true;
    }
    
    if (metric.higherIsBetter === false) {
        // For metrics where lower is better (e.g., turnover rate, complaints, operating expenses)
        if (rawScore <= target) {
            // If at or below target, score is 100
            calculatedScore = 100;
            debugInfo.calculation = `At/below target: ${rawScore} <= ${target} = 100%`;
        } else {
            // Score decreases as value goes above target
            // Use a reasonable range: target to target*2 maps to 100 to 0
            const maxAcceptable = target * 2;
            calculatedScore = Math.max(0, 100 - ((rawScore - target) / (maxAcceptable - target)) * 100);
            debugInfo.calculation = `Above target: 100 - ((${rawScore} - ${target}) / (${maxAcceptable} - ${target})) * 100 = ${calculatedScore}`;
            debugInfo.maxAcceptable = maxAcceptable;
            calculatedScore = Math.round(calculatedScore * 10) / 10; // Round to 1 decimal
        }
    } else {
        // For metrics where higher is better
        if (rawScore >= target) {
            // If at or above target, score is 100
            calculatedScore = 100;
            debugInfo.calculation = `At/above target: ${rawScore} >= ${target} = 100%`;
        } else {
            // Score increases proportionally as value approaches target
            // Use target as 100%, and 50% of target as 0%
            const minAcceptable = target * 0.5;
            calculatedScore = Math.max(0, ((rawScore - minAcceptable) / (target - minAcceptable)) * 100);
            debugInfo.calculation = `Below target: ((${rawScore} - ${minAcceptable}) / (${target} - ${minAcceptable})) * 100 = ${calculatedScore}`;
            debugInfo.minAcceptable = minAcceptable;
            calculatedScore = Math.round(calculatedScore * 10) / 10; // Round to 1 decimal
        }
    }
    
    // Final validation to ensure score is within 0-100 range
    calculatedScore = Math.max(0, Math.min(100, calculatedScore));
    debugInfo.finalScore = calculatedScore;
    
    // Always log problematic scores (very low or edge cases)
    const isProblematicScore = calculatedScore < 20 || 
                              (Math.abs(rawScore - target) < 1 && calculatedScore < 95) ||
                              isNaN(calculatedScore);
    
    // Log detailed calculation for debugging
    if (window.DEBUG_SCORING || 
        isProblematicScore || 
        (metric.name && (metric.name.includes('Schedule') || 
                        metric.name.includes('Operating') || 
                        metric.name.includes('Turnover') || 
                        metric.name.includes('Patient')))) {
        console.log('🔍 Score Calculation Debug:', debugInfo);
    }
    
    // Final safety check
    if (isNaN(calculatedScore)) {
        console.error(`❌ Score calculation resulted in NaN for ${metric.name || 'unknown metric'}`);
        return 0;
    }
    
    return calculatedScore;
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
    const clinicName = rawClinic.Clinic || 'Unknown Clinic';
    
    console.log(`📝 Processing raw data for: ${clinicName}`);
    console.log('📊 Raw clinic data from Google Sheets:', rawClinic);
    
    // Helper function to safely parse numeric values
    const safeParseFloat = (value, defaultValue = 0) => {
        if (value === undefined || value === null || value === '') {
            console.warn(`⚠️ Missing value for clinic ${clinicName}, using default: ${defaultValue}`);
            return defaultValue;
        }
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
            console.warn(`⚠️ Invalid numeric value in clinic data: "${value}", using default: ${defaultValue}`);
            return defaultValue;
        }
        return parsed;
    };
    
    const processedData = {
        clinic: clinicName,
        financial: {
            netProfitPercent: safeParseFloat(rawClinic.Net_Profit_Percent),
            revenueCycle: safeParseFloat(rawClinic.Revenue_Cycle_Efficiency),
            operatingExpenseRatio: safeParseFloat(rawClinic.Operating_Expense_Ratio),
            payerMixOptimization: safeParseFloat(rawClinic.Payer_Mix_Optimization)
        },
        operational: {
            utilizationRate: safeParseFloat(rawClinic.Therapist_Utilization_Rate),
            newPatientPercent: safeParseFloat(rawClinic.New_Patient_Percentage),
            patientVisitAverage: safeParseFloat(rawClinic.Patient_Visit_Average),
            scheduleAdherence: safeParseFloat(rawClinic.Schedule_Adherence_Rate),
            documentationTimeliness: safeParseFloat(rawClinic.Documentation_Timeliness),
            targetVisitsPercent: safeParseFloat(rawClinic.Target_Visits_Achievement)
        },
        patientExperience: {
            patientSatisfactionScores: safeParseFloat(rawClinic.Patient_Satisfaction_Score),
            patientEngagementRate: safeParseFloat(rawClinic.Patient_Engagement_Rate),
            patientComplaints: safeParseFloat(rawClinic.Patient_Complaints)
        },
        staffing: {
            turnoverRates: safeParseFloat(rawClinic.Staff_Turnover_Rate),
            employeeEngagement: safeParseFloat(rawClinic.Employee_Engagement),
            employeeSatisfaction: safeParseFloat(rawClinic.Employee_Satisfaction),
            employeeLifespan: safeParseFloat(rawClinic.Employee_Tenure_Months)
        }
    };
    
    // Validate that all required metrics are present
    const missingMetrics = [];
    
    // Check for missing critical metrics
    Object.keys(processedData).forEach(category => {
        if (typeof processedData[category] === 'object') {
            Object.keys(processedData[category]).forEach(metric => {
                if (processedData[category][metric] === 0) {
                    missingMetrics.push(`${category}.${metric}`);
                }
            });
        }
    });
    
    if (missingMetrics.length > 0) {
        console.warn(`⚠️ Clinic ${clinicName} is missing data for metrics: ${missingMetrics.join(', ')}`);
    }
    
    console.log('🔄 Processed clinic data:', processedData);
    
    // Log specific metrics that were mentioned as problematic
    console.log('🔍 Key metrics check:');
    console.log(`  - Schedule Adherence: ${rawClinic.Schedule_Adherence_Rate} -> ${processedData.operational.scheduleAdherence}`);
    console.log(`  - Operating Expense Ratio: ${rawClinic.Operating_Expense_Ratio} -> ${processedData.financial.operatingExpenseRatio}`);
    console.log(`  - Staff Turnover Rate: ${rawClinic.Staff_Turnover_Rate} -> ${processedData.staffing.turnoverRates}`);
    console.log(`  - Patient Engagement Rate: ${rawClinic.Patient_Engagement_Rate} -> ${processedData.patientExperience.patientEngagementRate}`);
    
    return processedData;
}

function processBenchmarkData(rawBenchmarkData) {
    // Convert your benchmark format (metrics as columns) to dashboard format
    console.log('🎯 Processing benchmark data from Google Sheets');
    console.log('📊 Raw benchmark data:', rawBenchmarkData);
    
    const processed = {};
    
    // Helper function to safely parse numeric values with defaults from config
    const safeParseFloat = (value, defaultValue) => {
        if (value === undefined || value === null || value === '') {
            console.warn(`⚠️ Missing benchmark value, using default: ${defaultValue}`);
            return defaultValue;
        }
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
            console.warn(`⚠️ Invalid numeric benchmark value: "${value}", using default: ${defaultValue}`);
            return defaultValue;
        }
        return parsed;
    };
    
    if (rawBenchmarkData.length > 0) {
        const benchmarkRow = rawBenchmarkData[0]; // Assuming first row has the benchmarks
        console.log('🎯 Using benchmark row:', benchmarkRow);
        
        // Validate that the benchmark data has the expected columns
        const requiredColumns = [
            'Net_Profit_Percent', 'Revenue_Cycle_Efficiency', 'Operating_Expense_Ratio', 'Payer_Mix_Optimization',
            'Therapist_Utilization_Rate', 'New_Patient_Percentage', 'Patient_Visit_Average', 'Schedule_Adherence_Rate',
            'Documentation_Timeliness', 'Target_Visits_Achievement', 'Patient_Satisfaction_Score',
            'Patient_Engagement_Rate', 'Patient_Complaints', 'Staff_Turnover_Rate',
            'Employee_Engagement', 'Employee_Satisfaction', 'Employee_Tenure_Months'
        ];
        
        const missingColumns = requiredColumns.filter(col => !(col in benchmarkRow));
        if (missingColumns.length > 0) {
            console.error(`❌ Missing required benchmark columns: ${missingColumns.join(', ')}`);
            console.warn('⚠️ Using default values for missing columns from DASHBOARD_CONFIG');
        }
        
        processed.financial = {
            netProfitPercent: safeParseFloat(benchmarkRow.Net_Profit_Percent, DASHBOARD_CONFIG.industryBenchmarks.financial.netProfitPercent),
            revenueCycle: safeParseFloat(benchmarkRow.Revenue_Cycle_Efficiency, DASHBOARD_CONFIG.industryBenchmarks.financial.revenueCycle),
            operatingExpenseRatio: safeParseFloat(benchmarkRow.Operating_Expense_Ratio, DASHBOARD_CONFIG.industryBenchmarks.financial.operatingExpenseRatio),
            payerMixOptimization: safeParseFloat(benchmarkRow.Payer_Mix_Optimization, DASHBOARD_CONFIG.industryBenchmarks.financial.payerMixOptimization)
        };
        
        processed.operational = {
            utilizationRate: safeParseFloat(benchmarkRow.Therapist_Utilization_Rate, DASHBOARD_CONFIG.industryBenchmarks.operational.utilizationRate),
            newPatientPercent: safeParseFloat(benchmarkRow.New_Patient_Percentage, DASHBOARD_CONFIG.industryBenchmarks.operational.newPatientPercent),
            patientVisitAverage: safeParseFloat(benchmarkRow.Patient_Visit_Average, DASHBOARD_CONFIG.industryBenchmarks.operational.patientVisitAverage),
            scheduleAdherence: safeParseFloat(benchmarkRow.Schedule_Adherence_Rate, DASHBOARD_CONFIG.industryBenchmarks.operational.scheduleAdherence),
            documentationTimeliness: safeParseFloat(benchmarkRow.Documentation_Timeliness, DASHBOARD_CONFIG.industryBenchmarks.operational.documentationTimeliness),
            targetVisitsPercent: safeParseFloat(benchmarkRow.Target_Visits_Achievement, DASHBOARD_CONFIG.industryBenchmarks.operational.targetVisitsPercent)
        };
        
        processed.patientExperience = {
            patientSatisfactionScores: safeParseFloat(benchmarkRow.Patient_Satisfaction_Score, DASHBOARD_CONFIG.industryBenchmarks.patientExperience.patientSatisfactionScores),
            patientEngagementRate: safeParseFloat(benchmarkRow.Patient_Engagement_Rate, DASHBOARD_CONFIG.industryBenchmarks.patientExperience.patientRetentionRate),
            patientComplaints: safeParseFloat(benchmarkRow.Patient_Complaints, DASHBOARD_CONFIG.industryBenchmarks.patientExperience.patientComplaints)
        };
        
        processed.staffing = {
            turnoverRates: safeParseFloat(benchmarkRow.Staff_Turnover_Rate, DASHBOARD_CONFIG.industryBenchmarks.staffing.turnoverRates),
            employeeEngagement: safeParseFloat(benchmarkRow.Employee_Engagement, DASHBOARD_CONFIG.industryBenchmarks.staffing.employeeEngagement),
            employeeSatisfaction: safeParseFloat(benchmarkRow.Employee_Satisfaction, DASHBOARD_CONFIG.industryBenchmarks.staffing.employeeSatisfaction),
            employeeLifespan: safeParseFloat(benchmarkRow.Employee_Tenure_Months, DASHBOARD_CONFIG.industryBenchmarks.staffing.employeeLifespan)
        };
        
        console.log('🔄 Processed benchmark data:', processed);
        
        // Log key benchmark values
        console.log('🔍 Key benchmark targets:');
        console.log(`  - Schedule Adherence Target: ${processed.operational.scheduleAdherence}`);
        console.log(`  - Operating Expense Ratio Target: ${processed.financial.operatingExpenseRatio}`);
        console.log(`  - Staff Turnover Rate Target: ${processed.staffing.turnoverRates}`);
        console.log(`  - Patient Engagement Rate Target: ${processed.patientExperience.patientEngagementRate}`);
    } else {
        console.warn('⚠️ No benchmark data found, using default values from config');
        
        // Use default values from config
        processed.financial = { ...DASHBOARD_CONFIG.industryBenchmarks.financial };
        processed.operational = { ...DASHBOARD_CONFIG.industryBenchmarks.operational };
        processed.patientExperience = { 
            ...DASHBOARD_CONFIG.industryBenchmarks.patientExperience,
            // Ensure we use patientEngagementRate instead of patientRetentionRate
            patientEngagementRate: DASHBOARD_CONFIG.industryBenchmarks.patientExperience.patientRetentionRate
        };
        processed.staffing = { ...DASHBOARD_CONFIG.industryBenchmarks.staffing };
        
        console.log('🔄 Using default benchmark data from config:', processed);
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

// Populate month filter with actual months from data
function populateMonthFilter() {
    // Populate from monthClinicMap to include historical months from the sheet
    const monthFilter = document.getElementById('monthFilter');
    if (!monthFilter) return;
    const keys = Object.keys(monthClinicMap).sort(); // lexicographic works for YYYY-MM
    monthFilter.innerHTML = '<option value="all">All Months</option>';
    keys.forEach(key => {
        const [y, m] = key.split('-').map(n => parseInt(n, 10));
        const date = new Date(y, (m || 1) - 1, 1); // Local time construction
        const display = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        const option = document.createElement('option');
        option.value = key;
        option.textContent = display;
        monthFilter.appendChild(option);
    });
}

// Filter by actual month from data
function filterByActualMonth() {
    const selectedMonth = document.getElementById('monthFilter').value;
    const multiMonthSetting = document.getElementById('multiMonthFilter').value;
    
    if (selectedMonth === 'all') {
        // Use latest snapshot or apply multi-month averaging across real months
        if (multiMonthSetting === 'single') {
            updateDashboardWithFilteredData(originalScoreData || currentScoreData);
            updateTimestamp('All Months (latest snapshot)');
        } else {
            applyMultiMonthAveraging(multiMonthSetting);
        }
        return;
    }
    
    // Specific month selected: use real snapshot from monthClinicMap
    const monthDataMap = monthClinicMap[selectedMonth] || {};
    let monthData = Object.values(monthDataMap);
    monthData.sort((a, b) => b.overallScore - a.overallScore);
    monthData.forEach((clinic, idx) => clinic.rank = idx + 1);
    
    updateDashboardWithFilteredData(monthData);
    updateTimestamp(`Filtered by: ${getMonthDisplayName(selectedMonth)}`);
}

// Handle multi-month averaging
function applyMultiMonthAveraging(setting) {
    // Determine how many months to average
    let monthCount;
    switch (setting) {
        case 'last2': monthCount = 2; break;
        case 'last3': monthCount = 3; break;
        case 'last6': monthCount = 6; break;
        case 'all': monthCount = 12; break; // cap at 12
        default: monthCount = 1;
    }
    
    // Collect available months (newest first) and pick the latest N
    const keys = Object.keys(monthClinicMap).sort((a, b) => b.localeCompare(a));
    const selectedKeys = keys.slice(0, monthCount);
    if (selectedKeys.length === 0) {
        updateDashboardWithFilteredData(originalScoreData || currentScoreData);
        return;
    }
    
    // Build averaged dataset per clinic across selected months
    const clinicNames = new Set();
    selectedKeys.forEach(key => {
        Object.keys(monthClinicMap[key] || {}).forEach(name => clinicNames.add(name));
    });
    
    const averaged = [];
    clinicNames.forEach(name => {
        // Gather entries for this clinic across months (if present)
        const entries = selectedKeys
            .map(key => monthClinicMap[key] && monthClinicMap[key][name])
            .filter(Boolean);
        if (entries.length === 0) return;
        
        const avgOverall = Math.round(entries.reduce((s, e) => s + e.overallScore, 0) / entries.length);
        const avgCategoryScores = {};
        const categoryKeys = Object.keys(SCORING_CONFIG.categories);
        categoryKeys.forEach(catKey => {
            const vals = entries.map(e => e.categoryScores && e.categoryScores[catKey]).filter(v => typeof v === 'number');
            avgCategoryScores[catKey] = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
        });
        
        // Use the most recent lastUpdated available
        const latestEntry = entries.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
        averaged.push({
            clinic: name,
            lastUpdated: latestEntry.lastUpdated,
            categoryScores: avgCategoryScores,
            overallScore: avgOverall,
            scoreLevel: getScoreLevel(avgOverall),
            performanceRating: getPerformanceRating(avgOverall),
            trend: latestEntry.trend || generateTrendData(),
            historicalData: latestEntry.historicalData || generateHistoricalData(12)
        });
    });
    
    averaged.sort((a, b) => b.overallScore - a.overallScore);
    averaged.forEach((c, i) => c.rank = i + 1);
    
    updateDashboardWithFilteredData(averaged);
    updateTimestamp(`${selectedKeys.length}-month average applied`);
}

// Initialize the month filter with actual data
function initializeMonthFilter() {
    // Populate month filter with actual months from data
    populateMonthFilter();
    
    // Set default to show all months
    const monthFilter = document.getElementById('monthFilter');
    const multiMonthFilter = document.getElementById('multiMonthFilter');
    
    if (monthFilter) monthFilter.value = 'all';
    if (multiMonthFilter) multiMonthFilter.value = 'single';
}

function getPeriodDescription(period) {
    switch (period) {
        case 'current': return 'Current Month';
        case 'lastMonth': return 'Last Month';
        case 'last3Months': return 'Last 3 Months';
        case 'last6Months': return 'Last 6 Months';
        case 'ytd': return 'Year to Date';
        case 'custom': 
            const start = document.getElementById('startDate').value;
            const end = document.getElementById('endDate').value;
            return `${start} to ${end}`;
        default: return 'All Time';
    }
}

function updateDashboardWithFilteredData(filteredData) {
    // Update all dashboard views with the filtered data
    populateTable(filteredData);
    populateCardView(filteredData);
    populateRankingView(filteredData);
    updateSummaryCards(filteredData);
    
    // Update charts if they exist
    if (typeof updateCharts === 'function') {
        updateCharts(filteredData);
    }
    
    console.log(`Dashboard updated with ${filteredData.length} clinics for selected time period`);
}

// Monthly calculation utility functions
function getMonthsDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function applyMonthlyAveraging(clinicData, monthCount, startDate, endDate) {
    // Apply averaging simulation for multiple months
    // In a real scenario, this would average actual historical data
    const averagingFactor = Math.max(0.95, 1 - (monthCount * 0.01)); // Slight variation for longer periods
    
    return clinicData.map(clinic => {
        const avgOverallScore = Math.round(clinic.overallScore * averagingFactor);
        const avgCategoryScores = {};
        
        // Average category scores
        if (clinic.categoryScores) {
            Object.keys(clinic.categoryScores).forEach(category => {
                avgCategoryScores[category] = Math.round(clinic.categoryScores[category] * averagingFactor);
            });
        }
        
        return {
            ...clinic,
            overallScore: avgOverallScore,
            categoryScores: avgCategoryScores,
            timePeriod: `${startDate.toISOString().slice(0, 7)} to ${endDate.toISOString().slice(0, 7)}`,
            monthsAveraged: monthCount,
            isAveraged: true
        };
    });
}

// Data validation functions
function validateScore(score) {
    const num = parseFloat(score);
    return isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
}

function validateClinicData(clinic) {
    if (!clinic) return null;
    return {
        ...clinic,
        overallScore: validateScore(clinic.overallScore),
        rank: parseInt(clinic.rank) || 0
    };
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

function updateTimestamp(message) {
    const element = document.getElementById('lastUpdated');
    if (element) {
        element.textContent = `${message} | ${new Date().toLocaleString()}`;
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
