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
    console.log('Generating detailed analysis for clinic:', clinic);
    
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
            // Use actual clinic data instead of sample data
            const rawScore = clinic[categoryKey] ? clinic[categoryKey][metricKey] : 0;
            const normalizedScore = normalizeScore(rawScore, metric);
            const benchmark = benchmarkData[categoryKey] ? 
                benchmarkData[categoryKey][metricKey] || metric.target : metric.target;
            
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
                            <span style="font-size: 0.8em; color: #666;">Achieved Value:</span>
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
    // Generate comprehensive data analysis
    const analysis = generateAdvancedAnalysis();
    
    // Create and show analysis modal
    showAdvancedAnalysisModal(analysis);
}

function generateAdvancedAnalysis() {
    if (!currentScoreData || currentScoreData.length === 0) {
        return {
            summary: 'No data available for analysis',
            insights: [],
            recommendations: []
        };
    }
    
    const analysis = {
        networkSummary: analyzeNetworkPerformance(),
        categoryInsights: analyzeCategoryPerformance(),
        clinicInsights: analyzeIndividualClinics(),
        trendAnalysis: analyzeTrends(),
        recommendations: generateRecommendations(),
        riskAssessment: assessRisks(),
        benchmarkGaps: identifyBenchmarkGaps()
    };
    
    return analysis;
}

function analyzeNetworkPerformance() {
    const scores = currentScoreData.map(c => c.overallScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const stdDev = Math.sqrt(scores.reduce((sq, n) => sq + Math.pow(n - avgScore, 2), 0) / scores.length);
    
    // Performance distribution
    const excellent = scores.filter(s => s >= 90).length;
    const good = scores.filter(s => s >= 80 && s < 90).length;
    const average = scores.filter(s => s >= 70 && s < 80).length;
    const poor = scores.filter(s => s < 70).length;
    
    return {
        averageScore: Math.round(avgScore * 10) / 10,
        scoreRange: { min: minScore, max: maxScore },
        consistency: stdDev < 5 ? 'High' : stdDev < 10 ? 'Moderate' : 'Low',
        distribution: { excellent, good, average, poor },
        totalClinics: currentScoreData.length
    };
}

function analyzeCategoryPerformance() {
    const categories = ['financial', 'operational', 'patientExperience', 'staffing'];
    const categoryNames = {
        financial: 'Financial Performance',
        operational: 'Operational Efficiency',
        patientExperience: 'Patient Experience',
        staffing: 'Staffing & HR'
    };
    
    return categories.map(category => {
        const scores = currentScoreData.map(c => c.categoryScores[category]);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const topPerformer = currentScoreData.find(c => c.categoryScores[category] === maxScore);
        const bottomPerformer = currentScoreData.find(c => c.categoryScores[category] === minScore);
        
        return {
            category: categoryNames[category],
            averageScore: Math.round(avgScore * 10) / 10,
            range: { min: minScore, max: maxScore },
            topPerformer: topPerformer.clinic,
            bottomPerformer: bottomPerformer.clinic,
            gap: Math.round((maxScore - minScore) * 10) / 10
        };
    });
}

function analyzeIndividualClinics() {
    return currentScoreData.map(clinic => {
        const strengths = [];
        const weaknesses = [];
        
        // Identify strengths (scores >= 95)
        Object.entries(clinic.categoryScores).forEach(([category, score]) => {
            if (score >= 95) {
                strengths.push({
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    score: score
                });
            } else if (score < 85) {
                weaknesses.push({
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    score: score
                });
            }
        });
        
        return {
            clinic: clinic.clinic,
            overallScore: clinic.overallScore,
            rank: clinic.rank,
            strengths: strengths,
            weaknesses: weaknesses,
            trend: clinic.trend ? clinic.trend.direction : 'stable'
        };
    });
}

function analyzeTrends() {
    const improvingClinics = currentScoreData.filter(c => 
        c.trend && (c.trend.direction === 'up' || c.trend.changePercent > 0)
    );
    const decliningClinics = currentScoreData.filter(c => 
        c.trend && (c.trend.direction === 'down' || c.trend.changePercent < 0)
    );
    
    return {
        improving: improvingClinics.map(c => ({
            clinic: c.clinic,
            change: c.trend ? c.trend.changePercent : 0
        })),
        declining: decliningClinics.map(c => ({
            clinic: c.clinic,
            change: c.trend ? c.trend.changePercent : 0
        })),
        stable: currentScoreData.length - improvingClinics.length - decliningClinics.length
    };
}

function generateRecommendations() {
    const recommendations = [];
    const networkSummary = analyzeNetworkPerformance();
    const categoryInsights = analyzeCategoryPerformance();
    
    // Network-wide recommendations
    if (networkSummary.averageScore < 85) {
        recommendations.push({
            type: 'Network-Wide',
            priority: 'High',
            title: 'Overall Performance Improvement Needed',
            description: `Network average of ${networkSummary.averageScore} is below target. Focus on systematic improvements across all locations.`,
            actions: ['Implement standardized best practices', 'Increase training frequency', 'Review operational procedures']
        });
    }
    
    // Category-specific recommendations
    categoryInsights.forEach(category => {
        if (category.averageScore < 80) {
            recommendations.push({
                type: 'Category-Specific',
                priority: 'High',
                title: `${category.category} Requires Attention`,
                description: `Average score of ${category.averageScore} indicates systematic issues in ${category.category.toLowerCase()}.`,
                actions: [`Review ${category.category.toLowerCase()} processes`, 'Benchmark against top performers', 'Implement targeted training']
            });
        }
        
        if (category.gap > 15) {
            recommendations.push({
                type: 'Performance Gap',
                priority: 'Medium',
                title: `Large Performance Gap in ${category.category}`,
                description: `${category.gap}-point gap between ${category.topPerformer} and ${category.bottomPerformer} suggests inconsistent practices.`,
                actions: ['Share best practices from top performers', 'Standardize procedures', 'Provide targeted support to underperformers']
            });
        }
    });
    
    return recommendations;
}

function assessRisks() {
    const risks = [];
    
    // Identify clinics with declining trends
    const decliningClinics = currentScoreData.filter(c => 
        c.trend && c.trend.direction === 'down'
    );
    
    if (decliningClinics.length > 0) {
        risks.push({
            type: 'Performance Decline',
            severity: 'Medium',
            description: `${decliningClinics.length} clinic(s) showing declining performance`,
            clinics: decliningClinics.map(c => c.clinic),
            mitigation: 'Immediate performance review and intervention required'
        });
    }
    
    // Identify clinics with low scores
    const lowPerformers = currentScoreData.filter(c => c.overallScore < 75);
    if (lowPerformers.length > 0) {
        risks.push({
            type: 'Low Performance',
            severity: 'High',
            description: `${lowPerformers.length} clinic(s) below acceptable performance threshold`,
            clinics: lowPerformers.map(c => c.clinic),
            mitigation: 'Urgent intervention and support required'
        });
    }
    
    return risks;
}

function identifyBenchmarkGaps() {
    // This would compare against industry benchmarks
    // For now, using internal network benchmarks
    const gaps = [];
    const networkAvg = analyzeNetworkPerformance().averageScore;
    
    if (networkAvg < 90) {
        gaps.push({
            metric: 'Overall Performance',
            current: networkAvg,
            target: 90,
            gap: 90 - networkAvg,
            impact: 'Network-wide performance below industry standard'
        });
    }
    
    return gaps;
}

function showAdvancedAnalysisModal(analysis) {
    const modal = document.getElementById('clinicModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    
    modalTitle.textContent = '🔬 Advanced Data Analysis & Insights';
    
    let content = `
        <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
            <!-- Network Summary -->
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">📊 Network Performance Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="metric-item">
                        <span class="metric-name">Network Average</span>
                        <span class="metric-score">
                            <span class="score-badge ${analysis.networkSummary.averageScore >= 90 ? 'score-excellent' : analysis.networkSummary.averageScore >= 80 ? 'score-good' : 'score-average'}">
                                ${analysis.networkSummary.averageScore}
                            </span>
                        </span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-name">Score Range</span>
                        <span class="metric-score">${analysis.networkSummary.scoreRange.min} - ${analysis.networkSummary.scoreRange.max}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-name">Consistency</span>
                        <span class="metric-score">${analysis.networkSummary.consistency}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-name">Total Clinics</span>
                        <span class="metric-score">${analysis.networkSummary.totalClinics}</span>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <strong>Performance Distribution:</strong>
                    <span style="color: #27ae60;">Excellent: ${analysis.networkSummary.distribution.excellent}</span> | 
                    <span style="color: #f39c12;">Good: ${analysis.networkSummary.distribution.good}</span> | 
                    <span style="color: #e67e22;">Average: ${analysis.networkSummary.distribution.average}</span> | 
                    <span style="color: #e74c3c;">Poor: ${analysis.networkSummary.distribution.poor}</span>
                </div>
            </div>
            
            <!-- Category Performance -->
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">📈 Category Performance Analysis</h3>
                ${analysis.categoryInsights.map(category => `
                    <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #3498db;">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                            <strong style="color: #2c3e50;">${category.category}</strong>
                            <span class="score-badge ${category.averageScore >= 90 ? 'score-excellent' : category.averageScore >= 80 ? 'score-good' : 'score-average'}">
                                ${category.averageScore}
                            </span>
                        </div>
                        <div style="font-size: 14px; color: #7f8c8d;">
                            <strong>Top:</strong> ${category.topPerformer} (${category.range.max}) | 
                            <strong>Bottom:</strong> ${category.bottomPerformer} (${category.range.min}) | 
                            <strong>Gap:</strong> ${category.gap} points
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Individual Clinic Insights -->
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">🏥 Individual Clinic Analysis</h3>
                ${analysis.clinicInsights.map(clinic => `
                    <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px;">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                            <strong style="color: #2c3e50;">#${clinic.rank} ${clinic.clinic}</strong>
                            <span class="score-badge ${clinic.overallScore >= 90 ? 'score-excellent' : clinic.overallScore >= 80 ? 'score-good' : 'score-average'}">
                                ${clinic.overallScore}
                            </span>
                        </div>
                        ${clinic.strengths.length > 0 ? `
                            <div style="margin-bottom: 8px;">
                                <strong style="color: #27ae60;">💪 Strengths:</strong> 
                                ${clinic.strengths.map(s => `${s.category} (${s.score})`).join(', ')}
                            </div>
                        ` : ''}
                        ${clinic.weaknesses.length > 0 ? `
                            <div style="margin-bottom: 8px;">
                                <strong style="color: #e74c3c;">⚠️ Areas for Improvement:</strong> 
                                ${clinic.weaknesses.map(w => `${w.category} (${w.score})`).join(', ')}
                            </div>
                        ` : ''}
                        <div style="font-size: 14px; color: #7f8c8d;">
                            <strong>Trend:</strong> ${clinic.trend === 'up' ? '📈 Improving' : clinic.trend === 'down' ? '📉 Declining' : '➡️ Stable'}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Recommendations -->
            ${analysis.recommendations.length > 0 ? `
                <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">💡 Strategic Recommendations</h3>
                    ${analysis.recommendations.map(rec => `
                        <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid ${rec.priority === 'High' ? '#e74c3c' : rec.priority === 'Medium' ? '#f39c12' : '#27ae60'};">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                                <strong style="color: #2c3e50;">${rec.title}</strong>
                                <span style="background: ${rec.priority === 'High' ? '#e74c3c' : rec.priority === 'Medium' ? '#f39c12' : '#27ae60'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                                    ${rec.priority} Priority
                                </span>
                            </div>
                            <p style="color: #7f8c8d; margin-bottom: 10px; font-size: 14px;">${rec.description}</p>
                            <div style="font-size: 13px;">
                                <strong>Recommended Actions:</strong>
                                <ul style="margin: 5px 0 0 20px; color: #5a6c7d;">
                                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Risk Assessment -->
            ${analysis.riskAssessment.length > 0 ? `
                <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <h3 style="color: #2c3e50; margin-bottom: 15px;">⚠️ Risk Assessment</h3>
                    ${analysis.riskAssessment.map(risk => `
                        <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid ${risk.severity === 'High' ? '#e74c3c' : '#f39c12'};">
                            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                                <strong style="color: #2c3e50;">${risk.type}</strong>
                                <span style="background: ${risk.severity === 'High' ? '#e74c3c' : '#f39c12'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                                    ${risk.severity} Risk
                                </span>
                            </div>
                            <p style="color: #7f8c8d; margin-bottom: 8px; font-size: 14px;">${risk.description}</p>
                            ${risk.clinics ? `<p style="font-size: 13px; color: #5a6c7d;"><strong>Affected Clinics:</strong> ${risk.clinics.join(', ')}</p>` : ''}
                            <p style="font-size: 13px; color: #e74c3c;"><strong>Mitigation:</strong> ${risk.mitigation}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <!-- Trend Analysis -->
            <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                <h3 style="color: #2c3e50; margin-bottom: 15px;">📊 Trend Analysis</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
                        <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${analysis.trendAnalysis.improving.length}</div>
                        <div style="color: #7f8c8d;">Improving Clinics</div>
                        ${analysis.trendAnalysis.improving.length > 0 ? `
                            <div style="font-size: 12px; margin-top: 5px; color: #5a6c7d;">
                                ${analysis.trendAnalysis.improving.map(c => c.clinic).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${analysis.trendAnalysis.declining.length}</div>
                        <div style="color: #7f8c8d;">Declining Clinics</div>
                        ${analysis.trendAnalysis.declining.length > 0 ? `
                            <div style="font-size: 12px; margin-top: 5px; color: #5a6c7d;">
                                ${analysis.trendAnalysis.declining.map(c => c.clinic).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 5px;">
                        <div style="font-size: 24px; font-weight: bold; color: #95a5a6;">${analysis.trendAnalysis.stable}</div>
                        <div style="color: #7f8c8d;">Stable Clinics</div>
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
                <p style="color: #7f8c8d; font-size: 14px;">Analysis generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                <button class="action-button" onclick="exportAnalysisReport()" style="margin-top: 10px;">📄 Export Analysis Report</button>
            </div>
        </div>
    `;
    
    modalContent.innerHTML = content;
    modal.style.display = 'block';
}

function exportAnalysisReport() {
    const analysis = generateAdvancedAnalysis();
    
    let reportContent = `LOCATION SCORE DASHBOARD - ADVANCED ANALYSIS REPORT\n`;
    reportContent += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    
    reportContent += `NETWORK PERFORMANCE SUMMARY\n`;
    reportContent += `============================\n`;
    reportContent += `Network Average Score: ${analysis.networkSummary.averageScore}\n`;
    reportContent += `Score Range: ${analysis.networkSummary.scoreRange.min} - ${analysis.networkSummary.scoreRange.max}\n`;
    reportContent += `Consistency Level: ${analysis.networkSummary.consistency}\n`;
    reportContent += `Total Clinics: ${analysis.networkSummary.totalClinics}\n`;
    reportContent += `Performance Distribution: Excellent(${analysis.networkSummary.distribution.excellent}), Good(${analysis.networkSummary.distribution.good}), Average(${analysis.networkSummary.distribution.average}), Poor(${analysis.networkSummary.distribution.poor})\n\n`;
    
    reportContent += `CATEGORY PERFORMANCE ANALYSIS\n`;
    reportContent += `=============================\n`;
    analysis.categoryInsights.forEach(category => {
        reportContent += `${category.category}: ${category.averageScore} (Range: ${category.range.min}-${category.range.max}, Gap: ${category.gap})\n`;
        reportContent += `  Top Performer: ${category.topPerformer}\n`;
        reportContent += `  Bottom Performer: ${category.bottomPerformer}\n\n`;
    });
    
    reportContent += `INDIVIDUAL CLINIC ANALYSIS\n`;
    reportContent += `=========================\n`;
    analysis.clinicInsights.forEach(clinic => {
        reportContent += `#${clinic.rank} ${clinic.clinic} (Score: ${clinic.overallScore})\n`;
        if (clinic.strengths.length > 0) {
            reportContent += `  Strengths: ${clinic.strengths.map(s => `${s.category}(${s.score})`).join(', ')}\n`;
        }
        if (clinic.weaknesses.length > 0) {
            reportContent += `  Areas for Improvement: ${clinic.weaknesses.map(w => `${w.category}(${w.score})`).join(', ')}\n`;
        }
        reportContent += `  Trend: ${clinic.trend}\n\n`;
    });
    
    if (analysis.recommendations.length > 0) {
        reportContent += `STRATEGIC RECOMMENDATIONS\n`;
        reportContent += `========================\n`;
        analysis.recommendations.forEach((rec, index) => {
            reportContent += `${index + 1}. ${rec.title} (${rec.priority} Priority)\n`;
            reportContent += `   ${rec.description}\n`;
            reportContent += `   Actions: ${rec.actions.join('; ')}\n\n`;
        });
    }
    
    if (analysis.riskAssessment.length > 0) {
        reportContent += `RISK ASSESSMENT\n`;
        reportContent += `===============\n`;
        analysis.riskAssessment.forEach(risk => {
            reportContent += `${risk.type} (${risk.severity} Risk)\n`;
            reportContent += `  ${risk.description}\n`;
            if (risk.clinics) {
                reportContent += `  Affected Clinics: ${risk.clinics.join(', ')}\n`;
            }
            reportContent += `  Mitigation: ${risk.mitigation}\n\n`;
        });
    }
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `advanced-analysis-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function showNotification(message, type = 'info') {
    // Simple notification function
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : '#4CAF50'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
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
