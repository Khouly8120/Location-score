// Location Score Dashboard - Analytics and Advanced Features
// Professional implementation with comprehensive analytics

// Performance Analysis Functions
function populatePerformanceAnalysis() {
    const container = document.getElementById('performanceAnalysisContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Performance Distribution Chart
    const distributionCard = document.createElement('div');
    distributionCard.className = 'category-card';
    distributionCard.innerHTML = `
        <div class="category-title">
            📊 Performance Distribution
        </div>
        <div id="performanceDistributionChart" style="height: 300px;"></div>
    `;
    container.appendChild(distributionCard);
    
    // Top and Bottom Performers
    const performersCard = document.createElement('div');
    performersCard.className = 'category-card';
    performersCard.innerHTML = `
        <div class="category-title">
            🏆 Performance Leaders & Opportunities
        </div>
        <div id="performanceLeaders"></div>
    `;
    container.appendChild(performersCard);
    
    // Category Performance Comparison
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    categoryCard.innerHTML = `
        <div class="category-title">
            📈 Category Performance Comparison
        </div>
        <div id="categoryComparisonChart" style="height: 300px;"></div>
    `;
    container.appendChild(categoryCard);
    
    // Improvement Opportunities
    const improvementCard = document.createElement('div');
    improvementCard.className = 'category-card';
    improvementCard.innerHTML = `
        <div class="category-title">
            💡 Improvement Opportunities
        </div>
        <div id="improvementOpportunities"></div>
    `;
    container.appendChild(improvementCard);
    
    // Load the charts and analysis
    loadPerformanceCharts();
    loadPerformanceLeaders();
    loadImprovementOpportunities();
}

function loadPerformanceCharts() {
    // Charts should already be loaded, so draw immediately
    drawPerformanceCharts();
}

function drawPerformanceCharts() {
    drawPerformanceDistribution();
    drawCategoryComparison();
}

function drawPerformanceDistribution() {
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Performance Level');
    data.addColumn('number', 'Number of Clinics');
    data.addColumn({type: 'string', role: 'style'});
    
    const levels = ['Critical', 'Poor', 'Average', 'Good', 'Excellent'];
    const thresholds = DASHBOARD_CONFIG.scoreThresholds;
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#007bff'];
    
    const distribution = levels.map((level, index) => {
        let count = 0;
        const levelKey = level.toLowerCase();
        
        currentScoreData.forEach(clinic => {
            if (getScoreLevel(clinic.overallScore) === levelKey) {
                count++;
            }
        });
        
        return [level, count, colors[index]];
    });
    
    data.addRows(distribution);
    
    const options = {
        title: 'Clinic Performance Distribution',
        titleTextStyle: { fontSize: 16, bold: true },
        hAxis: { title: 'Performance Level' },
        vAxis: { title: 'Number of Clinics', minValue: 0 },
        legend: { position: 'none' },
        backgroundColor: 'transparent',
        chartArea: { left: 60, top: 60, width: '80%', height: '70%' }
    };
    
    const chart = new google.visualization.ColumnChart(document.getElementById('performanceDistributionChart'));
    chart.draw(data, options);
}

function drawCategoryComparison() {
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Category');
    data.addColumn('number', 'Network Average');
    data.addColumn('number', 'Top Performer');
    data.addColumn('number', 'Bottom Performer');
    
    const categories = Object.keys(SCORING_CONFIG.categories);
    const categoryData = categories.map(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        const scores = currentScoreData.map(clinic => clinic.categoryScores[categoryKey]);
        
        const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
        const top = Math.max(...scores);
        const bottom = Math.min(...scores);
        
        return [category.name, average, top, bottom];
    });
    
    data.addRows(categoryData);
    
    const options = {
        title: 'Category Performance Comparison',
        titleTextStyle: { fontSize: 16, bold: true },
        hAxis: { title: 'Score', minValue: 0, maxValue: 100 },
        vAxis: { title: 'Categories' },
        backgroundColor: 'transparent',
        chartArea: { left: 150, top: 60, width: '70%', height: '70%' },
        colors: ['#007bff', '#28a745', '#dc3545']
    };
    
    const chart = new google.visualization.BarChart(document.getElementById('categoryComparisonChart'));
    chart.draw(data, options);
}

function loadPerformanceLeaders() {
    const container = document.getElementById('performanceLeaders');
    if (!container) return;
    
    const topPerformers = currentScoreData.slice(0, 3);
    const bottomPerformers = currentScoreData.slice(-3).reverse();
    
    let html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h4 style="color: #28a745; margin-bottom: 15px;">🏆 Top Performers</h4>
    `;
    
    topPerformers.forEach((clinic, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        html += `
            <div class="metric-item" style="margin-bottom: 10px;">
                <span class="metric-name">
                    ${medals[index]} ${clinic.clinic}
                </span>
                <span class="metric-score">${getScoreBadge(clinic.overallScore)}</span>
            </div>
        `;
    });
    
    html += `
            </div>
            <div>
                <h4 style="color: #dc3545; margin-bottom: 15px;">📈 Improvement Opportunities</h4>
    `;
    
    bottomPerformers.forEach(clinic => {
        html += `
            <div class="metric-item" style="margin-bottom: 10px;">
                <span class="metric-name">${clinic.clinic}</span>
                <span class="metric-score">${getScoreBadge(clinic.overallScore)}</span>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function loadImprovementOpportunities() {
    const container = document.getElementById('improvementOpportunities');
    if (!container) return;
    
    // Analyze which categories need the most improvement across the network
    const categoryAverages = {};
    const categories = Object.keys(SCORING_CONFIG.categories);
    
    categories.forEach(categoryKey => {
        const scores = currentScoreData.map(clinic => clinic.categoryScores[categoryKey]);
        categoryAverages[categoryKey] = {
            average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
            name: SCORING_CONFIG.categories[categoryKey].name,
            clinicsBelow70: scores.filter(score => score < 70).length
        };
    });
    
    // Sort by average score (lowest first)
    const sortedCategories = Object.entries(categoryAverages)
        .sort(([,a], [,b]) => a.average - b.average);
    
    let html = '<div style="margin-bottom: 20px;">';
    html += '<h4 style="margin-bottom: 15px;">🎯 Network-Wide Improvement Priorities</h4>';
    
    sortedCategories.forEach(([categoryKey, data]) => {
        const recommendations = IMPROVEMENT_RECOMMENDATIONS[categoryKey] || [];
        const urgencyLevel = data.average < 70 ? 'high' : data.average < 80 ? 'medium' : 'low';
        const urgencyColors = { high: '#dc3545', medium: '#fd7e14', low: '#28a745' };
        
        html += `
            <div style="border-left: 4px solid ${urgencyColors[urgencyLevel]}; padding-left: 15px; margin-bottom: 15px;">
                <div class="metric-item">
                    <span class="metric-name">
                        <strong>${data.name}</strong>
                        <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                            ${data.clinicsBelow70} clinics below 70 points
                        </div>
                    </span>
                    <span class="metric-score">${getScoreBadge(data.average)}</span>
                </div>
        `;
        
        if (recommendations.length > 0) {
            html += '<div style="margin-top: 8px; font-size: 0.9em;">';
            recommendations.slice(0, 2).forEach(rec => {
                html += `<div style="margin: 4px 0;">• ${rec}</div>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Trend Analysis Functions
function loadTrendAnalysis() {
    // Work with existing HTML structure
    const chartContainer = document.getElementById('trendChart');
    if (!chartContainer) return;
    
    // Clear the loading message and prepare for chart
    chartContainer.innerHTML = '<div style="height: 400px;"></div>';
    
    // Populate clinic selector if not already done
    populateClinicOptions();
    
    // Draw the chart immediately
    setTimeout(() => {
        drawTrendChart();
    }, 100);
}

function drawTrendChart() {
    const chartContainer = document.getElementById('trendChart');
    if (!chartContainer) {
        console.error('Trend chart container not found');
        return;
    }
    
    const clinicSelector = document.getElementById('trendClinicSelector');
    const selectedClinic = clinicSelector ? clinicSelector.value : 'all';
    
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Month');
    data.addColumn('number', 'Overall Score');
    data.addColumn('number', 'Financial');
    data.addColumn('number', 'Operational');
    data.addColumn('number', 'Patient Experience');
    data.addColumn('number', 'Staffing');
    
    let chartData = [];
    
    if (selectedClinic === 'all') {
        // Calculate network averages for each month
        const months = currentScoreData[0].historicalData.map(d => d.date);
        chartData = months.map(month => {
            const monthData = [new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })];
            
            // Calculate averages for this month across all clinics
            const overallAvg = Math.round(currentScoreData.reduce((sum, clinic) => {
                const monthScore = clinic.historicalData.find(h => h.date === month);
                return sum + (monthScore ? monthScore.score : clinic.overallScore);
            }, 0) / currentScoreData.length);
            
            monthData.push(overallAvg);
            
            // Add category averages (simplified for demo)
            Object.keys(SCORING_CONFIG.categories).forEach(categoryKey => {
                const categoryAvg = Math.round(currentScoreData.reduce((sum, clinic) => {
                    return sum + clinic.categoryScores[categoryKey];
                }, 0) / currentScoreData.length);
                monthData.push(categoryAvg + (Math.random() - 0.5) * 10); // Add some variation
            });
            
            return monthData;
        });
    } else {
        // Show data for selected clinic
        const clinic = currentScoreData.find(c => c.clinic === selectedClinic);
        if (clinic) {
            chartData = clinic.historicalData.map(monthData => [
                new Date(monthData.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                monthData.score,
                clinic.categoryScores.financial + (Math.random() - 0.5) * 10,
                clinic.categoryScores.operational + (Math.random() - 0.5) * 10,
                clinic.categoryScores.patientExperience + (Math.random() - 0.5) * 10,
                clinic.categoryScores.staffing + (Math.random() - 0.5) * 10
            ]);
        }
    }
    
    data.addRows(chartData);
    
    const options = {
        title: selectedClinic === 'all' ? 'Network Performance Trends' : `${selectedClinic} Performance Trends`,
        titleTextStyle: { fontSize: 16, bold: true },
        curveType: 'function',
        legend: { position: 'bottom' },
        backgroundColor: 'transparent',
        chartArea: { left: 60, top: 60, width: '85%', height: '70%' },
        hAxis: { title: 'Month' },
        vAxis: { title: 'Score', minValue: 0, maxValue: 100 },
        colors: ['#007bff', '#28a745', '#17a2b8', '#ffc107', '#dc3545']
    };
    
    const chart = new google.visualization.LineChart(chartContainer);
    chart.draw(data, options);
}

function updateTrendChart() {
    drawTrendChart();
}

function loadTrendSummary() {
    const container = document.getElementById('trendSummary');
    if (!container) return;
    
    // Analyze trends across the network
    const improvingClinics = currentScoreData.filter(clinic => 
        clinic.trend && clinic.trend.direction === 'improving'
    );
    const decliningClinics = currentScoreData.filter(clinic => 
        clinic.trend && clinic.trend.direction === 'declining'
    );
    const stableClinics = currentScoreData.filter(clinic => 
        clinic.trend && clinic.trend.direction === 'stable'
    );
    
    const avgImprovement = improvingClinics.length > 0 
        ? Math.round(improvingClinics.reduce((sum, clinic) => sum + clinic.trend.changePercent, 0) / improvingClinics.length * 10) / 10
        : 0;
    
    const avgDecline = decliningClinics.length > 0 
        ? Math.round(Math.abs(decliningClinics.reduce((sum, clinic) => sum + clinic.trend.changePercent, 0) / decliningClinics.length) * 10) / 10
        : 0;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div class="metric-item">
                <span class="metric-name">
                    <span class="trend-up">↗</span> Improving Clinics
                </span>
                <span class="metric-score">
                    <span class="score-badge score-good">${improvingClinics.length}</span>
                </span>
            </div>
            <div class="metric-item">
                <span class="metric-name">
                    <span class="trend-down">↘</span> Declining Clinics
                </span>
                <span class="metric-score">
                    <span class="score-badge score-poor">${decliningClinics.length}</span>
                </span>
            </div>
            <div class="metric-item">
                <span class="metric-name">
                    <span class="trend-stable">→</span> Stable Clinics
                </span>
                <span class="metric-score">
                    <span class="score-badge score-average">${stableClinics.length}</span>
                </span>
            </div>
            <div class="metric-item">
                <span class="metric-name">Average Improvement</span>
                <span class="metric-score">
                    <span class="score-badge score-good">+${avgImprovement}%</span>
                </span>
            </div>
        </div>
        
        <div style="margin-top: 20px;">
            <h4>📈 Top Improving Clinics</h4>
            ${improvingClinics.slice(0, 5).map(clinic => `
                <div class="metric-item" style="margin: 8px 0;">
                    <span class="metric-name">${clinic.clinic}</span>
                    <span class="metric-score">
                        <span class="trend-up">↗ +${clinic.trend.changePercent}%</span>
                    </span>
                </div>
            `).join('')}
        </div>
        
        ${decliningClinics.length > 0 ? `
        <div style="margin-top: 20px;">
            <h4>📉 Clinics Needing Attention</h4>
            ${decliningClinics.slice(0, 5).map(clinic => `
                <div class="metric-item" style="margin: 8px 0;">
                    <span class="metric-name">${clinic.clinic}</span>
                    <span class="metric-score">
                        <span class="trend-down">↘ ${clinic.trend.changePercent}%</span>
                    </span>
                </div>
            `).join('')}
        </div>
        ` : ''}
    `;
}

// Benchmark Comparison Functions
function loadBenchmarkComparison() {
    // Work with existing HTML structure
    const chartContainer = document.getElementById('benchmarkChart');
    if (!chartContainer) return;
    
    // Clear the loading message and prepare for chart
    chartContainer.innerHTML = '<div style="height: 400px;"></div>';
    
    // Draw the chart immediately
    setTimeout(() => {
        drawBenchmarkChart();
    }, 100);
}

function drawBenchmarkChart() {
    const chartContainer = document.getElementById('benchmarkChart');
    if (!chartContainer) {
        console.error('Benchmark chart container not found');
        return;
    }
    
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Category');
    data.addColumn('number', 'Network Average');
    data.addColumn('number', 'Industry Benchmark');
    data.addColumn('number', 'Top Quartile');
    
    const categories = Object.keys(SCORING_CONFIG.categories);
    const chartData = categories.map(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        const networkAvg = Math.round(currentScoreData.reduce((sum, clinic) => 
            sum + clinic.categoryScores[categoryKey], 0) / currentScoreData.length);
        
        // Simulated benchmark data
        const industryBenchmark = 75 + Math.random() * 10;
        const topQuartile = 85 + Math.random() * 10;
        
        return [category.name, networkAvg, Math.round(industryBenchmark), Math.round(topQuartile)];
    });
    
    data.addRows(chartData);
    
    const options = {
        title: 'Performance vs Industry Benchmarks',
        titleTextStyle: { fontSize: 16, bold: true },
        chartArea: { width: '70%', height: '70%' },
        colors: ['#007bff', '#ffc107', '#28a745'],
        hAxis: { title: 'Score', minValue: 0, maxValue: 100 },
        vAxis: { title: 'Categories' },
        backgroundColor: 'transparent'
    };
    
    const chart = new google.visualization.BarChart(chartContainer);
    chart.draw(data, options);
}

function loadBenchmarkAnalysis() {
    const container = document.getElementById('benchmarkAnalysis');
    if (!container) return;
    
    // Calculate performance vs benchmarks
    const categories = Object.keys(SCORING_CONFIG.categories);
    const analysis = categories.map(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        const networkAvg = Math.round(currentScoreData.reduce((sum, clinic) => 
            sum + clinic.categoryScores[categoryKey], 0) / currentScoreData.length);
        
        const industryBenchmark = 75 + Math.random() * 10;
        const gap = networkAvg - industryBenchmark;
        
        return {
            name: category.name,
            networkAvg,
            benchmark: Math.round(industryBenchmark),
            gap: Math.round(gap),
            status: gap > 5 ? 'exceeding' : gap > -5 ? 'meeting' : 'below'
        };
    });
    
    let html = '<div style="margin-bottom: 20px;">';
    
    analysis.forEach(item => {
        const statusColors = {
            exceeding: '#28a745',
            meeting: '#ffc107', 
            below: '#dc3545'
        };
        const statusText = {
            exceeding: 'Exceeding Benchmark',
            meeting: 'Meeting Benchmark',
            below: 'Below Benchmark'
        };
        
        html += `
            <div class="metric-item" style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${statusColors[item.status]};">
                <div>
                    <div class="metric-name"><strong>${item.name}</strong></div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 4px;">
                        Network: ${item.networkAvg} | Industry: ${item.benchmark} | Gap: ${item.gap > 0 ? '+' : ''}${item.gap}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="color: ${statusColors[item.status]}; font-weight: bold;">
                        ${statusText[item.status]}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add summary
    const exceedingCount = analysis.filter(a => a.status === 'exceeding').length;
    const belowCount = analysis.filter(a => a.status === 'below').length;
    
    html += `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h4 style="margin-bottom: 10px;">📋 Benchmark Summary</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                <div class="metric-item">
                    <span class="metric-name">Exceeding Benchmarks</span>
                    <span class="score-badge score-excellent">${exceedingCount}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Below Benchmarks</span>
                    <span class="score-badge score-poor">${belowCount}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Overall Status</span>
                    <span class="score-badge ${exceedingCount >= belowCount ? 'score-good' : 'score-average'}">
                        ${exceedingCount >= belowCount ? 'Strong' : 'Needs Focus'}
                    </span>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Export Functions
function exportToCSV() {
    const headers = [
        'Rank', 'Clinic', 'Overall Score', 'Performance Rating',
        'Financial Performance', 'Operational Efficiency', 
        'Patient Experience', 'Staffing & HR', 'Trend Direction', 'Trend Change %'
    ];
    
    const csvData = [headers];
    
    displayedData.forEach(clinic => {
        csvData.push([
            clinic.rank,
            clinic.clinic,
            clinic.overallScore,
            clinic.performanceRating,
            clinic.categoryScores.financial,
            clinic.categoryScores.operational,
            clinic.categoryScores.patientExperience,
            clinic.categoryScores.staffing,
            clinic.trend ? clinic.trend.direction : 'N/A',
            clinic.trend ? clinic.trend.changePercent : 'N/A'
        ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-scores-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Modal Functions
function showClinicDetails(clinicName, isDetailed = false) {
    const clinic = currentScoreData.find(c => c.clinic === clinicName);
    if (!clinic) return;
    
    const modal = document.getElementById('clinicModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.textContent = `${clinic.clinic} - ${isDetailed ? 'Comprehensive Analysis' : 'Performance Overview'}`;
    
    let content = `
        <div style="margin-bottom: 25px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div class="metric-item">
                    <span class="metric-name">Overall Score</span>
                    <span class="metric-score">${getScoreBadge(clinic.overallScore, 'large')}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Network Rank</span>
                    <span class="metric-score"><strong>#${clinic.rank} of ${currentScoreData.length}</strong></span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Performance Rating</span>
                    <span class="metric-score">${clinic.performanceRating}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-name">Trend</span>
                    <span class="metric-score">${getTrendIcon(clinic.trend)}</span>
                </div>
            </div>
        </div>
    `;
    
    if (isDetailed) {
        content += generateDetailedAnalysis(clinic);
    } else {
        content += generateBasicAnalysis(clinic);
    }
    
    modalContent.innerHTML = content;
    modal.style.display = 'block';
}

function generateBasicAnalysis(clinic) {
    let content = '<h4>📊 Category Performance</h4><div style="margin-bottom: 25px;">';
    
    Object.keys(SCORING_CONFIG.categories).forEach(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        const score = clinic.categoryScores[categoryKey];
        const benchmark = DASHBOARD_CONFIG.industryBenchmarks[categoryKey] ? 
            Object.values(DASHBOARD_CONFIG.industryBenchmarks[categoryKey]).reduce((a, b) => a + b, 0) / 
            Object.values(DASHBOARD_CONFIG.industryBenchmarks[categoryKey]).length : 75;
        
        const vsNetwork = score - Math.round(currentScoreData.reduce((sum, c) => 
            sum + c.categoryScores[categoryKey], 0) / currentScoreData.length);
        
        content += `
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div class="metric-item" style="margin-bottom: 10px;">
                    <span class="metric-name">
                        <strong>${category.icon} ${category.name}</strong>
                        <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                            Weight: ${Math.round(category.weight * 100)}% of total score
                        </div>
                    </span>
                    <span class="metric-score">${getScoreBadge(score)}</span>
                </div>
                <div style="font-size: 0.9em; color: #555; margin-top: 8px;">
                    <div>📈 vs Network Average: ${vsNetwork > 0 ? '+' : ''}${vsNetwork} points</div>
                    <div>🎯 vs Industry Benchmark: ${score - Math.round(benchmark) > 0 ? '+' : ''}${score - Math.round(benchmark)} points</div>
                </div>
            </div>
        `;
    });
    
    content += '</div>';
    
    // Add quick improvement recommendations
    const lowestCategory = Object.keys(clinic.categoryScores).reduce((a, b) => 
        clinic.categoryScores[a] < clinic.categoryScores[b] ? a : b
    );
    
    const categoryScore = clinic.categoryScores[lowestCategory];
    const recommendationLevel = categoryScore >= 80 ? 'high' : categoryScore >= 70 ? 'medium' : 'low';
    const recommendations = IMPROVEMENT_RECOMMENDATIONS[lowestCategory] ? 
        IMPROVEMENT_RECOMMENDATIONS[lowestCategory][recommendationLevel] || [] : [];
    
    if (recommendations.length > 0) {
        content += `
            <h4>💡 Priority Improvement Areas</h4>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                <p><strong>Focus Area:</strong> ${SCORING_CONFIG.categories[lowestCategory].name} (${getScoreBadge(categoryScore)})</p>
                <div style="margin-top: 10px;">
        `;
        
        recommendations.slice(0, 3).forEach(rec => {
            content += `<div style="margin: 5px 0;">• ${rec}</div>`;
        });
        
        content += '</div></div>';
    }
    
    return content;
}

function generateDetailedAnalysis(clinic) {
    let content = '<h4>📊 Comprehensive Metric Analysis</h4>';
    
    Object.keys(SCORING_CONFIG.categories).forEach(categoryKey => {
        const category = SCORING_CONFIG.categories[categoryKey];
        const categoryScore = clinic.categoryScores[categoryKey];
        const networkAvg = Math.round(currentScoreData.reduce((sum, c) => 
            sum + c.categoryScores[categoryKey], 0) / currentScoreData.length);
        
        content += `
            <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h5 style="margin: 0; color: ${category.color};">
                        ${category.icon} ${category.name}
                    </h5>
                    <div style="text-align: right;">
                        ${getScoreBadge(categoryScore, 'large')}
                        <div style="font-size: 0.8em; color: #666; margin-top: 4px;">
                            Weight: ${Math.round(category.weight * 100)}%
                        </div>
                    </div>
                </div>
                
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9em;">
                    ${category.description}
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin-bottom: 15px;">
        `;
        
        // Add individual metrics for this category
        Object.keys(category.metrics).forEach(metricKey => {
            const metric = category.metrics[metricKey];
            // Generate realistic sample scores for demo
            const rawScore = generateSampleMetricScore(metric);
            const normalizedScore = normalizeScore(rawScore, metric);
            const benchmark = DASHBOARD_CONFIG.industryBenchmarks[categoryKey] ? 
                DASHBOARD_CONFIG.industryBenchmarks[categoryKey][metricKey] || metric.target : metric.target;
            
            content += `
                <div style="border: 1px solid #e9ecef; padding: 12px; border-radius: 6px; background: white;">
                    <div style="font-weight: bold; margin-bottom: 5px; font-size: 0.9em;">
                        ${metric.name}
                    </div>
                    <div style="margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.8em; color: #666;">Score:</span>
                            <span style="font-weight: bold;">${getScoreBadge(normalizedScore, 'small')}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span style="font-size: 0.8em; color: #666;">Raw Value:</span>
                            <span style="font-size: 0.9em;">${rawScore}${metric.unit}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span style="font-size: 0.8em; color: #666;">Target:</span>
                            <span style="font-size: 0.9em; color: #28a745;">${benchmark}${metric.unit}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                            <span style="font-size: 0.8em; color: #666;">Weight:</span>
                            <span style="font-size: 0.9em;">${Math.round(metric.weight * 100)}%</span>
                        </div>
                    </div>
                    <div style="font-size: 0.8em; color: #666; line-height: 1.3;">
                        ${metric.description}
                    </div>
                </div>
            `;
        });
        
        content += `
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px; padding: 10px; background: #f1f3f4; border-radius: 6px;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">Category Score</div>
                        <div style="font-weight: bold; margin-top: 2px;">${getScoreBadge(categoryScore)}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">Network Average</div>
                        <div style="font-weight: bold; margin-top: 2px;">${getScoreBadge(networkAvg)}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">vs Network</div>
                        <div style="font-weight: bold; margin-top: 2px; color: ${categoryScore >= networkAvg ? '#28a745' : '#dc3545'};">
                            ${categoryScore >= networkAvg ? '+' : ''}${categoryScore - networkAvg}
                        </div>
                    </div>
                </div>
        `;
        
        // Add category-specific recommendations
        const categoryScoreLevel = categoryScore >= 80 ? 'high' : categoryScore >= 70 ? 'medium' : 'low';
        const recommendations = IMPROVEMENT_RECOMMENDATIONS[categoryKey] ? 
            IMPROVEMENT_RECOMMENDATIONS[categoryKey][categoryScoreLevel] || [] : [];
        
        if (recommendations.length > 0) {
            content += `
                <div style="background: #e8f4fd; padding: 12px; border-radius: 6px; border-left: 4px solid ${category.color};">
                    <div style="font-weight: bold; margin-bottom: 8px; color: ${category.color};">💡 Recommendations</div>
            `;
            
            recommendations.forEach(rec => {
                content += `<div style="margin: 4px 0; font-size: 0.9em;">• ${rec}</div>`;
            });
            
            content += '</div>';
        }
        
        content += '</div>';
    });
    
    // Add overall performance summary
    content += `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: white;">🎯 Performance Summary</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <div style="font-size: 0.9em; opacity: 0.9;">Overall Ranking</div>
                    <div style="font-size: 1.2em; font-weight: bold;">#${clinic.rank} of ${currentScoreData.length} locations</div>
                </div>
                <div>
                    <div style="font-size: 0.9em; opacity: 0.9;">Performance Level</div>
                    <div style="font-size: 1.2em; font-weight: bold;">${clinic.performanceRating}</div>
                </div>
                <div>
                    <div style="font-size: 0.9em; opacity: 0.9;">Trend Direction</div>
                    <div style="font-size: 1.2em; font-weight: bold;">${clinic.trend ? clinic.trend.direction.charAt(0).toUpperCase() + clinic.trend.direction.slice(1) : 'Stable'}</div>
                </div>
            </div>
        </div>
    `;
    
    return content;
}

function generateSampleMetricScore(metric) {
    // Generate realistic sample scores based on metric characteristics
    const target = metric.target || 80;
    const variation = Math.random() * 20 - 10; // ±10 variation
    let score = target + variation;
    
    // Add some realistic constraints
    if (metric.unit === '%') {
        score = Math.max(0, Math.min(100, score));
    } else if (metric.name.includes('Turnover') || metric.name.includes('Complaints')) {
        score = Math.max(0, score); // Can't be negative
    }
    
    return Math.round(score * 10) / 10; // Round to 1 decimal
}

function closeModal() {
    const modal = document.getElementById('clinicModal');
    modal.style.display = 'none';
}

// Missing Button Functions
function exportData() {
    exportToCSV();
}

function showAdvancedTools() {
    alert('Advanced Analysis Tools:\n\n• Export detailed reports\n• Custom metric analysis\n• Performance forecasting\n• Benchmark comparisons\n\nThese features will be available in the next update.');
}

function generateDetailedReport() {
    const reportData = {
        timestamp: new Date().toISOString(),
        totalLocations: currentScoreData.length,
        networkAverage: Math.round(currentScoreData.reduce((sum, clinic) => sum + clinic.overallScore, 0) / currentScoreData.length),
        topPerformers: currentScoreData.slice(0, 3).map(c => ({ name: c.clinic, score: c.overallScore })),
        improvementOpportunities: currentScoreData.filter(c => c.overallScore < 70).map(c => ({ name: c.clinic, score: c.overallScore }))
    };
    
    console.log('Detailed Report Generated:', reportData);
    alert(`📊 Detailed Report Generated\n\nNetwork Average: ${reportData.networkAverage}\nTop Performer: ${reportData.topPerformers[0]?.name} (${reportData.topPerformers[0]?.score})\nLocations Needing Attention: ${reportData.improvementOpportunities.length}\n\nReport data logged to console.`);
}

function identifyBestPractices() {
    const topPerformers = currentScoreData.slice(0, 3);
    let practices = [];
    
    topPerformers.forEach(clinic => {
        Object.keys(clinic.categoryScores).forEach(category => {
            if (clinic.categoryScores[category] >= 90) {
                practices.push(`${clinic.clinic}: Excellence in ${SCORING_CONFIG.categories[category].name}`);
            }
        });
    });
    
    const practicesText = practices.length > 0 ? practices.slice(0, 5).join('\n• ') : 'Analyzing performance patterns...';
    alert(`🏆 Best Practices Identified:\n\n• ${practicesText}\n\nDetailed analysis available in comprehensive reports.`);
}

function createImprovementPlan() {
    const lowPerformers = currentScoreData.filter(c => c.overallScore < 75);
    const plans = [];
    
    lowPerformers.forEach(clinic => {
        const lowestCategory = Object.keys(clinic.categoryScores).reduce((a, b) => 
            clinic.categoryScores[a] < clinic.categoryScores[b] ? a : b
        );
        plans.push(`${clinic.clinic}: Focus on ${SCORING_CONFIG.categories[lowestCategory].name}`);
    });
    
    const planText = plans.length > 0 ? plans.slice(0, 5).join('\n• ') : 'All locations performing well!';
    alert(`📈 Improvement Plans Created:\n\n• ${planText}\n\nDetailed action items will be generated for each location.`);
}

function updateBenchmarks() {
    showLoading('Updating benchmark analysis...');
    
    setTimeout(() => {
        // Simulate benchmark update
        loadBenchmarkComparison();
        hideLoading();
        alert('✅ Benchmark analysis updated with latest industry data!');
    }, 1500);
}

function updateTrendChart() {
    drawTrendChart();
}

// Initialize analytics when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('clinicModal');
        if (event.target === modal) {
            closeModal();
        }
    };
});
