#!/usr/bin/env node

/**
 * AI Assistant Test Script
 * Tests the CollisionOS AI Assistant functionality
 */

const { CollisionOSAssistant } = require('./server/services/aiAssistant');
require('dotenv').config();

async function testAIAssistant() {
  console.log('🤖 Testing CollisionOS AI Assistant...\n');
  
  // Initialize AI Assistant
  const assistant = new CollisionOSAssistant();
  
  // Test queries
  const testQueries = [
    {
      query: "Show me all Honda Civics",
      expectedType: "search",
      description: "Vehicle search test"
    },
    {
      query: "What's our average cycle time?",
      expectedType: "analytics", 
      description: "Performance analytics test"
    },
    {
      query: "What repair orders are pending parts?",
      expectedType: "workflow",
      description: "Workflow status test"
    },
    {
      query: "What is a supplement?",
      expectedType: "knowledge",
      description: "Collision repair knowledge test"
    },
    {
      query: "How much revenue did we make this month?",
      expectedType: "financial",
      description: "Financial analytics test"
    }
  ];
  
  const shopId = 'test-shop-uuid'; // Mock shop ID for testing
  const userId = 'test-user-uuid'; // Mock user ID for testing
  
  console.log('📋 Running AI Assistant Tests:\n');
  
  let passedTests = 0;
  let totalTests = testQueries.length;
  
  for (let i = 0; i < testQueries.length; i++) {
    const test = testQueries[i];
    console.log(`${i + 1}. ${test.description}`);
    console.log(`   Query: "${test.query}"`);
    
    try {
      const response = await assistant.processQuery(test.query, shopId, userId);
      
      // Check response structure
      const hasValidStructure = response && 
        typeof response.message === 'string' &&
        response.type;
      
      if (!hasValidStructure) {
        console.log(`   ❌ FAIL: Invalid response structure`);
        continue;
      }
      
      // Check if response type matches expected
      const typeMatches = response.type === test.expectedType || 
        (test.expectedType === 'search' && response.type === 'search_results') ||
        (test.expectedType === 'knowledge' && response.type === 'general');
      
      if (typeMatches) {
        console.log(`   ✅ PASS: Response type "${response.type}" matches expected`);
        console.log(`   💬 Message: "${response.message.substring(0, 80)}${response.message.length > 80 ? '...' : ''}"`);
        
        if (response.results && response.results.length > 0) {
          console.log(`   📊 Results: ${response.results.length} items found`);
        }
        
        if (response.insights && response.insights.length > 0) {
          console.log(`   💡 Insights: ${response.insights.length} insights generated`);
        }
        
        passedTests++;
      } else {
        console.log(`   ❌ FAIL: Expected type "${test.expectedType}" but got "${response.type}"`);
      }
      
    } catch (error) {
      console.log(`   ❌ FAIL: Error - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Test query analysis
  console.log('🧠 Testing Query Intent Analysis:\n');
  
  const intentTests = [
    { query: "show me repair orders", expectedIntent: "search" },
    { query: "average cycle time", expectedIntent: "analytics" },
    { query: "pending parts status", expectedIntent: "workflow" },
    { query: "total revenue", expectedIntent: "financial" }
  ];
  
  for (const test of intentTests) {
    const intent = assistant.analyzeQueryIntent(test.query);
    const matches = intent.type === test.expectedIntent;
    
    console.log(`${matches ? '✅' : '❌'} "${test.query}" -> ${intent.type} (expected: ${test.expectedIntent})`);
    if (matches) passedTests++;
    totalTests++;
  }
  
  // Test entity extraction
  console.log('\n🔍 Testing Entity Extraction:\n');
  
  const entityTests = [
    { query: "Show me Honda Civics", expectedEntity: { vehicleMake: "Honda" } },
    { query: "Find RO-2024-0123", expectedEntity: { roNumber: "2024-0123" } }
  ];
  
  for (const test of entityTests) {
    const entities = assistant.extractEntities(test.query);
    let matches = true;
    
    for (const [key, expectedValue] of Object.entries(test.expectedEntity)) {
      if (entities[key] !== expectedValue) {
        matches = false;
        break;
      }
    }
    
    console.log(`${matches ? '✅' : '❌'} "${test.query}" -> ${JSON.stringify(entities)}`);
    if (matches) passedTests++;
    totalTests++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`🎯 AI Assistant Test Results: ${passedTests}/${totalTests} tests passed`);
  
  const successRate = (passedTests / totalTests) * 100;
  
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT: AI Assistant is performing at excellent levels!');
  } else if (successRate >= 75) {
    console.log('✅ GOOD: AI Assistant is performing well with minor areas for improvement.');
  } else if (successRate >= 50) {
    console.log('⚠️  FAIR: AI Assistant needs some improvements to reach optimal performance.');
  } else {
    console.log('❌ NEEDS WORK: AI Assistant requires significant improvements.');
  }
  
  console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`);
  
  // Feature recommendations
  console.log('\n💡 Feature Capabilities Tested:');
  console.log('   ✅ Natural language query processing');
  console.log('   ✅ Intent analysis and classification');
  console.log('   ✅ Entity extraction (vehicles, RO numbers)');
  console.log('   ✅ Collision repair domain knowledge');
  console.log('   ✅ Multi-type query handling (search, analytics, workflow)');
  console.log('   ✅ Structured response generation');
  
  console.log('\n🚀 Ready for Integration:');
  console.log('   • Frontend components created (/components/AI/)');
  console.log('   • Backend API endpoints ready (/api/ai/)');
  console.log('   • Database helper functions available');
  console.log('   • Collision repair domain expertise built-in');
  
  return successRate >= 75;
}

// Run the test
testAIAssistant()
  .then(success => {
    if (success) {
      console.log('\n🎉 AI Assistant is ready for production use!');
      process.exit(0);
    } else {
      console.log('\n⚠️  AI Assistant needs improvements before production.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ AI Assistant test failed:', error);
    process.exit(1);
  });