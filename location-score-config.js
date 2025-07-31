// Location Score Dashboard Configuration
// Professional scoring system with evidence-based weights

const DASHBOARD_CONFIG = {
    // Google Sheets URLs - Replace with your actual published CSV URLs
    dataSheetUrl: 'YOUR_GOOGLE_SHEET_DATA_URL_HERE',
    benchmarkSheetUrl: 'YOUR_GOOGLE_SHEET_BENCHMARK_URL_HERE',
    
    // Refresh intervals (in milliseconds)
    dataRefreshInterval: 300000, // 5 minutes
    chartRefreshInterval: 60000,  // 1 minute
    
    // Performance thresholds
    scoreThresholds: {
        excellent: 90,
        good: 80,
        average: 70,
        poor: 60,
        critical: 0
    },
    
    // Industry benchmarks (can be overridden by Google Sheets data)
    industryBenchmarks: {
        financial: {
            netProfitPercent: 15,
            revenueCycle: 85,
            operatingExpenseRatio: 75,
            payerMixOptimization: 80
        },
        operational: {
            utilizationRate: 85,
            newPatientPercent: 20,
            patientVisitAverage: 12,
            scheduleAdherence: 90,
            documentationTimeliness: 95,
            targetVisitsPercent: 90
        },
        patientExperience: {
            patientSatisfactionScores: 90,
            patientRetentionRate: 85,
            patientComplaints: 5 // Lower is better
        },
        staffing: {
            turnoverRates: 15, // Lower is better
            employeeEngagement: 80,
            employeeSatisfaction: 85,
            employeeLifespan: 24 // months
        }
    }
};

// Comprehensive scoring configuration with evidence-based weights
const SCORING_CONFIG = {
    categories: {
        financial: {
            name: 'Financial Performance',
            weight: 0.30, // 30% - Critical for sustainability
            color: '#e74c3c',
            icon: '💰',
            description: 'Revenue, profitability, and financial efficiency metrics',
            metrics: {
                netProfitPercent: {
                    name: 'Net Profit Margin %',
                    weight: 0.35,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Percentage of revenue remaining after all expenses',
                    target: 15,
                    benchmarkSource: 'Industry standard for healthcare facilities'
                },
                revenueCycle: {
                    name: 'Revenue Cycle Efficiency',
                    weight: 0.25,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Efficiency of billing and collection processes',
                    target: 85,
                    benchmarkSource: 'Healthcare Financial Management Association'
                },
                operatingExpenseRatio: {
                    name: 'Operating Expense Ratio',
                    weight: 0.25,
                    higherIsBetter: false,
                    unit: '%',
                    description: 'Operating expenses as percentage of revenue',
                    target: 75,
                    benchmarkSource: 'Healthcare industry benchmarks'
                },
                payerMixOptimization: {
                    name: 'Payer Mix Optimization',
                    weight: 0.15,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Optimization of insurance payer mix for maximum reimbursement',
                    target: 80,
                    benchmarkSource: 'Revenue cycle best practices'
                }
            }
        },
        operational: {
            name: 'Operational Efficiency & Productivity',
            weight: 0.35, // 35% - Highest weight due to direct impact on performance
            color: '#f39c12',
            icon: '⚡',
            description: 'Efficiency, productivity, and operational excellence metrics',
            metrics: {
                utilizationRate: {
                    name: 'Therapist Utilization Rate',
                    weight: 0.20,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Percentage of available therapist time utilized for patient care',
                    target: 85,
                    benchmarkSource: 'Physical therapy industry standards'
                },
                newPatientPercent: {
                    name: 'New Patient Acquisition %',
                    weight: 0.15,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Percentage of new patients relative to total patient volume',
                    target: 20,
                    benchmarkSource: 'Healthcare growth metrics'
                },
                patientVisitAverage: {
                    name: 'Average Visits per Episode',
                    weight: 0.15,
                    higherIsBetter: true,
                    unit: 'visits',
                    description: 'Average number of visits per patient episode of care',
                    target: 12,
                    benchmarkSource: 'Clinical effectiveness studies'
                },
                scheduleAdherence: {
                    name: 'Schedule Adherence Rate',
                    weight: 0.20,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Percentage of scheduled appointments kept (inverse of no-show rate)',
                    target: 90,
                    benchmarkSource: 'Healthcare scheduling best practices'
                },
                documentationTimeliness: {
                    name: 'Documentation Compliance',
                    weight: 0.15,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Percentage of patient documentation completed within required timeframe',
                    target: 95,
                    benchmarkSource: 'Regulatory compliance standards'
                },
                targetVisitsPercent: {
                    name: 'Visit Target Achievement',
                    weight: 0.15,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Percentage of monthly visit targets achieved',
                    target: 90,
                    benchmarkSource: 'Operational performance standards'
                }
            }
        },
        patientExperience: {
            name: 'Patient Experience & Outcomes',
            weight: 0.25, // 25% - Critical for reputation and retention
            color: '#2ecc71',
            icon: '😊',
            description: 'Patient satisfaction, outcomes, and experience quality metrics',
            metrics: {
                patientSatisfactionScores: {
                    name: 'Patient Satisfaction Score',
                    weight: 0.40,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Overall patient satisfaction rating from surveys',
                    target: 90,
                    benchmarkSource: 'CAHPS and industry patient satisfaction benchmarks'
                },
                patientRetentionRate: {
                    name: 'Patient Retention Rate',
                    weight: 0.35,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Percentage of patients completing their full treatment plan',
                    target: 85,
                    benchmarkSource: 'Patient engagement studies'
                },
                patientComplaints: {
                    name: 'Patient Complaints Rate',
                    weight: 0.25,
                    higherIsBetter: false,
                    unit: '%',
                    description: 'Percentage of patients filing formal complaints',
                    target: 5,
                    benchmarkSource: 'Healthcare quality indicators'
                }
            }
        },
        staffing: {
            name: 'Staffing & HR Metrics',
            weight: 0.10, // 10% - Important but lower direct impact on immediate performance
            color: '#9b59b6',
            icon: '👥',
            description: 'Human resources, staff satisfaction, and retention metrics',
            metrics: {
                turnoverRates: {
                    name: 'Staff Turnover Rate',
                    weight: 0.30,
                    higherIsBetter: false,
                    unit: '%',
                    description: 'Annual staff turnover rate',
                    target: 15,
                    benchmarkSource: 'Healthcare HR benchmarks'
                },
                employeeEngagement: {
                    name: 'Employee Engagement Score',
                    weight: 0.25,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Employee engagement survey results',
                    target: 80,
                    benchmarkSource: 'Gallup workplace engagement studies'
                },
                employeeSatisfaction: {
                    name: 'Employee Satisfaction Score',
                    weight: 0.25,
                    higherIsBetter: true,
                    unit: '%',
                    description: 'Overall employee satisfaction rating',
                    target: 85,
                    benchmarkSource: 'Healthcare workplace satisfaction studies'
                },
                employeeLifespan: {
                    name: 'Average Employee Tenure',
                    weight: 0.20,
                    higherIsBetter: true,
                    unit: 'months',
                    description: 'Average length of employment for current staff',
                    target: 24,
                    benchmarkSource: 'Healthcare retention analytics'
                }
            }
        }
    },
    
    // Scoring methodology
    scoringMethod: {
        type: 'weighted_average',
        normalization: 'min_max', // Normalize scores to 0-100 scale
        outlierHandling: 'cap', // Cap extreme values at 5th and 95th percentiles
        missingDataHandling: 'exclude' // Exclude metrics with missing data from calculation
    },
    
    // Alert thresholds for performance monitoring
    alertThresholds: {
        critical: {
            overallScore: 60,
            categoryScore: 50,
            description: 'Immediate attention required'
        },
        warning: {
            overallScore: 75,
            categoryScore: 70,
            description: 'Performance monitoring needed'
        },
        target: {
            overallScore: 85,
            categoryScore: 80,
            description: 'Target performance level'
        }
    },
    
    // Trend analysis configuration
    trendAnalysis: {
        minimumDataPoints: 3,
        trendThreshold: 5, // Minimum change percentage to consider significant
        seasonalityAdjustment: true,
        forecastPeriods: 3 // Number of future periods to forecast
    }
};

// Sample clinic data for demonstration (replace with actual data source)
const SAMPLE_CLINICS = [
    'Allerton Clinic',
    'Bronx Clinic', 
    'Brooklyn Clinic',
    'Manhattan Clinic',
    'Queens Clinic',
    'Staten Island Clinic',
    'Westchester Clinic',
    'Long Island Clinic',
    'New Jersey Clinic',
    'Connecticut Clinic'
];

// Performance improvement recommendations
const IMPROVEMENT_RECOMMENDATIONS = {
    financial: {
        low: [
            'Review and optimize billing processes',
            'Implement revenue cycle management best practices',
            'Analyze payer mix and negotiate better rates',
            'Reduce operational inefficiencies',
            'Implement cost control measures'
        ],
        medium: [
            'Fine-tune pricing strategies',
            'Optimize staff productivity',
            'Review vendor contracts and expenses',
            'Implement financial reporting automation'
        ],
        high: [
            'Maintain current financial performance',
            'Explore growth opportunities',
            'Consider expansion or new services'
        ]
    },
    operational: {
        low: [
            'Implement scheduling optimization software',
            'Provide staff training on efficiency best practices',
            'Review and streamline clinical workflows',
            'Implement patient flow optimization',
            'Upgrade documentation systems'
        ],
        medium: [
            'Fine-tune scheduling algorithms',
            'Implement advanced analytics for capacity planning',
            'Optimize staff allocation and scheduling',
            'Enhance patient communication systems'
        ],
        high: [
            'Share best practices with other locations',
            'Mentor underperforming locations',
            'Lead pilot programs for new initiatives'
        ]
    },
    patientExperience: {
        low: [
            'Implement patient feedback system',
            'Provide customer service training for all staff',
            'Review and improve facility environment',
            'Implement patient communication protocols',
            'Address common patient complaints systematically'
        ],
        medium: [
            'Enhance patient education programs',
            'Implement patient portal and digital services',
            'Optimize appointment scheduling experience',
            'Improve follow-up care processes'
        ],
        high: [
            'Become a patient experience center of excellence',
            'Share best practices across network',
            'Implement advanced patient engagement technologies'
        ]
    },
    staffing: {
        low: [
            'Conduct comprehensive staff satisfaction survey',
            'Implement employee recognition programs',
            'Review compensation and benefits packages',
            'Provide professional development opportunities',
            'Improve management training and communication'
        ],
        medium: [
            'Enhance career development pathways',
            'Implement flexible scheduling options',
            'Improve work-life balance initiatives',
            'Strengthen team building activities'
        ],
        high: [
            'Become an employer of choice in the region',
            'Implement advanced HR analytics',
            'Lead workforce development initiatives'
        ]
    }
};

// Export configuration for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DASHBOARD_CONFIG,
        SCORING_CONFIG,
        SAMPLE_CLINICS,
        IMPROVEMENT_RECOMMENDATIONS
    };
}
