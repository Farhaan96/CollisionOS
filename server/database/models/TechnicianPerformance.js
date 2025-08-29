const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const TechnicianPerformance = sequelize.define('TechnicianPerformance', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shopId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      }
    },
    technicianId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Performance period
    reportingPeriod: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annually'),
      allowNull: false,
      defaultValue: 'weekly'
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    // Productivity metrics
    hoursWorked: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    billableHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    flaggedHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    productiveHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    overtimeHours: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    utilizationRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    // Efficiency and velocity
    overallEfficiency: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    averageVelocity: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    velocityTrend: {
      type: DataTypes.ENUM('improving', 'stable', 'declining'),
      allowNull: true
    },
    // Job and task completion
    jobsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    stagesCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tasksCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    averageJobCompletionTime: {
      type: DataTypes.INTEGER, // minutes
      allowNull: true
    },
    onTimeDeliveryRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    // Quality metrics
    qualityScore: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    qualityTrend: {
      type: DataTypes.ENUM('improving', 'stable', 'declining'),
      allowNull: true
    },
    firstTimeRightRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    reworkCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reworkRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    customerComplaintCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    inspectionPassRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    // Cost performance
    laborCostGenerated: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    materialCostIncurred: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    revenueGenerated: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    profitGenerated: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    costPerHour: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    revenuePerHour: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    profitMargin: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    // Safety and compliance
    safetyIncidents: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    safetyScore: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    complianceViolations: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    trainingHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00
    },
    certificationsEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Attendance and punctuality
    daysWorked: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    daysAbsent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tardyCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    attendanceRate: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    punctualityScore: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    // Skill development
    skillRating: {
      type: DataTypes.JSONB,
      defaultValue: {} // skill_code -> rating
    },
    skillImprovement: {
      type: DataTypes.JSONB,
      defaultValue: {} // skill_code -> improvement_percentage
    },
    specializations: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of specialization codes
    },
    crossTrainingProgress: {
      type: DataTypes.JSONB,
      defaultValue: {} // department -> progress_percentage
    },
    // Customer satisfaction
    customerRating: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    customerFeedbackCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    positiveReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    negativeReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    customerSatisfactionTrend: {
      type: DataTypes.ENUM('improving', 'stable', 'declining'),
      allowNull: true
    },
    // Equipment and resource utilization
    equipmentUtilization: {
      type: DataTypes.JSONB,
      defaultValue: {} // equipment_id -> hours_used
    },
    toolsUsed: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of tool codes
    },
    bayUtilization: {
      type: DataTypes.JSONB,
      defaultValue: {} // bay_number -> hours_used
    },
    resourceEfficiency: {
      type: DataTypes.DECIMAL(5, 2), // percentage
      allowNull: true
    },
    // Teamwork and collaboration
    mentorshipHours: {
      type: DataTypes.DECIMAL(6, 2),
      defaultValue: 0.00
    },
    apprenticesSupported: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    knowledgeSharingContributions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    teamworkScore: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    leadershipScore: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    // Goals and targets
    monthlyTarget: {
      type: DataTypes.JSONB,
      defaultValue: {} // Various target metrics
    },
    targetAchievement: {
      type: DataTypes.JSONB,
      defaultValue: {} // Achievement percentage per target
    },
    bonusEligible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    bonusAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    // Performance ranking
    rankInShop: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rankInDepartment: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    percentileRank: {
      type: DataTypes.DECIMAL(5, 2), // 0-100
      allowNull: true
    },
    // Improvement areas
    strengthAreas: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of strength categories
    },
    improvementAreas: {
      type: DataTypes.JSONB,
      defaultValue: [] // Array of areas needing improvement
    },
    developmentPlan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    coachingNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Supervisor feedback
    supervisorRating: {
      type: DataTypes.DECIMAL(3, 1), // 1.0 to 5.0
      allowNull: true
    },
    supervisorComments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastReviewDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextReviewDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // System calculated fields
    overallScore: {
      type: DataTypes.DECIMAL(5, 2), // Composite performance score
      allowNull: true
    },
    performanceGrade: {
      type: DataTypes.ENUM('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'),
      allowNull: true
    },
    trendDirection: {
      type: DataTypes.ENUM('improving', 'stable', 'declining'),
      allowNull: true
    },
    // Metadata
    calculatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    dataVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // System fields
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'technician_performance',
    timestamps: true,
    indexes: [
      {
        fields: ['shopId']
      },
      {
        fields: ['technicianId']
      },
      {
        fields: ['reportingPeriod']
      },
      {
        fields: ['periodStart']
      },
      {
        fields: ['periodEnd']
      },
      {
        fields: ['overallScore']
      },
      {
        fields: ['performanceGrade']
      },
      {
        fields: ['rankInShop']
      },
      {
        fields: ['qualityScore']
      },
      {
        fields: ['overallEfficiency']
      },
      {
        fields: ['utilizationRate']
      },
      {
        fields: ['customerRating']
      },
      {
        fields: ['safetyScore']
      },
      {
        fields: ['calculatedAt']
      },
      {
        name: 'technician_period_unique',
        unique: true,
        fields: ['technicianId', 'reportingPeriod', 'periodStart']
      },
      {
        name: 'shop_performance_ranking',
        fields: ['shopId', 'reportingPeriod', 'overallScore']
      },
      {
        name: 'quality_performance',
        fields: ['shopId', 'qualityScore', 'firstTimeRightRate']
      },
      {
        name: 'productivity_metrics',
        fields: ['shopId', 'overallEfficiency', 'utilizationRate', 'revenuePerHour']
      }
    ],
    hooks: {
      beforeCreate: (performance) => {
        // Calculate derived metrics
        if (performance.hoursWorked > 0) {
          performance.utilizationRate = ((performance.productiveHours / performance.hoursWorked) * 100).toFixed(2);
          
          if (performance.laborCostGenerated > 0) {
            performance.costPerHour = (performance.laborCostGenerated / performance.hoursWorked).toFixed(2);
          }
          
          if (performance.revenueGenerated > 0) {
            performance.revenuePerHour = (performance.revenueGenerated / performance.hoursWorked).toFixed(2);
          }
        }
        
        // Calculate profit margin
        if (performance.revenueGenerated > 0) {
          performance.profitMargin = ((performance.profitGenerated / performance.revenueGenerated) * 100).toFixed(2);
        }
        
        // Calculate rework rate
        if (performance.stagesCompleted > 0) {
          performance.reworkRate = ((performance.reworkCount / performance.stagesCompleted) * 100).toFixed(2);
        }
        
        // Calculate attendance rate
        const totalDays = performance.daysWorked + performance.daysAbsent;
        if (totalDays > 0) {
          performance.attendanceRate = ((performance.daysWorked / totalDays) * 100).toFixed(2);
        }
        
        // Calculate overall performance score
        performance.overallScore = calculateOverallScore(performance);
        performance.performanceGrade = calculatePerformanceGrade(performance.overallScore);
      },
      beforeUpdate: (performance) => {
        // Recalculate derived metrics if base values changed
        const productivityFields = ['hoursWorked', 'productiveHours', 'laborCostGenerated', 'revenueGenerated'];
        if (productivityFields.some(field => performance.changed(field))) {
          if (performance.hoursWorked > 0) {
            performance.utilizationRate = ((performance.productiveHours / performance.hoursWorked) * 100).toFixed(2);
            
            if (performance.laborCostGenerated > 0) {
              performance.costPerHour = (performance.laborCostGenerated / performance.hoursWorked).toFixed(2);
            }
            
            if (performance.revenueGenerated > 0) {
              performance.revenuePerHour = (performance.revenueGenerated / performance.hoursWorked).toFixed(2);
            }
          }
        }
        
        // Recalculate profit margin
        if (performance.changed('revenueGenerated') || performance.changed('profitGenerated')) {
          if (performance.revenueGenerated > 0) {
            performance.profitMargin = ((performance.profitGenerated / performance.revenueGenerated) * 100).toFixed(2);
          }
        }
        
        // Recalculate overall score
        const scoreFields = ['qualityScore', 'overallEfficiency', 'utilizationRate', 'customerRating', 'safetyScore'];
        if (scoreFields.some(field => performance.changed(field))) {
          performance.overallScore = calculateOverallScore(performance);
          performance.performanceGrade = calculatePerformanceGrade(performance.overallScore);
        }
        
        // Update calculation timestamp
        performance.calculatedAt = new Date();
      }
    }
  });

  // Instance methods
  TechnicianPerformance.prototype.getPerformanceColor = function() {
    const colors = {
      'A+': '#27AE60', 'A': '#2ECC71', 'A-': '#58D68D',
      'B+': '#F39C12', 'B': '#F1C40F', 'B-': '#F4D03F',
      'C+': '#E67E22', 'C': '#E74C3C', 'C-': '#EC7063',
      'D': '#C0392B', 'F': '#922B21'
    };
    return colors[this.performanceGrade] || '#95A5A6';
  };

  TechnicianPerformance.prototype.isTopPerformer = function() {
    return ['A+', 'A', 'A-'].includes(this.performanceGrade);
  };

  TechnicianPerformance.prototype.needsImprovement = function() {
    return ['C-', 'D', 'F'].includes(this.performanceGrade);
  };

  TechnicianPerformance.prototype.getStrengths = function() {
    return this.strengthAreas || [];
  };

  TechnicianPerformance.prototype.getImprovementAreas = function() {
    return this.improvementAreas || [];
  };

  TechnicianPerformance.prototype.getSkillRatings = function() {
    return this.skillRating || {};
  };

  TechnicianPerformance.prototype.getTrendSummary = function() {
    return {
      velocity: this.velocityTrend,
      quality: this.qualityTrend,
      customerSatisfaction: this.customerSatisfactionTrend,
      overall: this.trendDirection
    };
  };

  TechnicianPerformance.prototype.getProductivityMetrics = function() {
    return {
      utilizationRate: this.utilizationRate,
      efficiency: this.overallEfficiency,
      velocity: this.averageVelocity,
      revenuePerHour: this.revenuePerHour,
      costPerHour: this.costPerHour,
      profitMargin: this.profitMargin
    };
  };

  TechnicianPerformance.prototype.getQualityMetrics = function() {
    return {
      qualityScore: this.qualityScore,
      firstTimeRightRate: this.firstTimeRightRate,
      reworkRate: this.reworkRate,
      inspectionPassRate: this.inspectionPassRate,
      customerComplaintCount: this.customerComplaintCount,
      customerRating: this.customerRating
    };
  };

  TechnicianPerformance.prototype.isEligibleForBonus = function() {
    return this.bonusEligible && this.bonusAmount > 0;
  };

  TechnicianPerformance.prototype.getRankingSummary = function() {
    return {
      shopRank: this.rankInShop,
      departmentRank: this.rankInDepartment,
      percentile: this.percentileRank,
      grade: this.performanceGrade,
      overallScore: this.overallScore
    };
  };

  return TechnicianPerformance;
};

// Helper function to calculate overall performance score
function calculateOverallScore(performance) {
  let score = 0;
  let factors = 0;
  
  // Quality (30% weight)
  if (performance.qualityScore) {
    score += (performance.qualityScore / 5.0) * 30;
    factors += 30;
  }
  
  // Efficiency (25% weight)
  if (performance.overallEfficiency) {
    score += (performance.overallEfficiency / 100.0) * 25;
    factors += 25;
  }
  
  // Utilization (20% weight)
  if (performance.utilizationRate) {
    score += (performance.utilizationRate / 100.0) * 20;
    factors += 20;
  }
  
  // Customer satisfaction (15% weight)
  if (performance.customerRating) {
    score += (performance.customerRating / 5.0) * 15;
    factors += 15;
  }
  
  // Safety (10% weight)
  if (performance.safetyScore) {
    score += (performance.safetyScore / 5.0) * 10;
    factors += 10;
  }
  
  return factors > 0 ? (score / factors * 100).toFixed(2) : null;
}

// Helper function to calculate performance grade
function calculatePerformanceGrade(score) {
  if (!score) return null;
  
  const numScore = parseFloat(score);
  
  if (numScore >= 97) return 'A+';
  if (numScore >= 93) return 'A';
  if (numScore >= 90) return 'A-';
  if (numScore >= 87) return 'B+';
  if (numScore >= 83) return 'B';
  if (numScore >= 80) return 'B-';
  if (numScore >= 77) return 'C+';
  if (numScore >= 73) return 'C';
  if (numScore >= 70) return 'C-';
  if (numScore >= 60) return 'D';
  return 'F';
}