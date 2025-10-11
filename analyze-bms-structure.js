#!/usr/bin/env node

/**
 * BMS Structure Analyzer
 * Analyzes the structure of BMS XML files to understand the data format
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

class BMSStructureAnalyzer {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logEntry);
  }

  analyzeBMSFile(filePath, testName) {
    this.log(`Analyzing BMS file: ${testName}`);
    
    try {
      // Read the XML file
      const xmlContent = fs.readFileSync(filePath, 'utf8');
      this.log(`File size: ${xmlContent.length} characters`);
      
      // Parse the XML with detailed options
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        parseAttributeValue: true,
        parseTagValue: true,
        parseTrueNumberOnly: false,
        arrayMode: false,
        trimValues: true,
        removeNSPrefix: false,
        processEntities: true
      });
      
      const jsonObj = parser.parse(xmlContent);
      
      // Analyze the structure
      const structure = this.analyzeStructure(jsonObj);
      
      this.log(`✅ ${testName} analyzed successfully`);
      this.log(`   - Root elements: ${Object.keys(jsonObj).join(', ')}`);
      this.log(`   - Structure depth: ${structure.maxDepth}`);
      this.log(`   - Key sections found: ${structure.sections.join(', ')}`);
      
      return {
        file: testName,
        status: 'success',
        structure: structure,
        sample: this.extractSampleData(jsonObj)
      };
      
    } catch (error) {
      this.log(`❌ ${testName} analysis failed: ${error.message}`, 'error');
      return {
        file: testName,
        status: 'failed',
        error: error.message
      };
    }
  }

  analyzeStructure(obj, depth = 0, path = '') {
    const structure = {
      maxDepth: depth,
      sections: [],
      sample: {}
    };

    if (typeof obj !== 'object' || obj === null) {
      return structure;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (key === 'VehicleDamageEstimateAddRq' || key.includes('Estimate') || key.includes('Damage')) {
        structure.sections.push(key);
      }

      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          structure.sections.push(`${key}[]`);
          if (value.length > 0) {
            const itemStructure = this.analyzeStructure(value[0], depth + 1, currentPath);
            structure.maxDepth = Math.max(structure.maxDepth, itemStructure.maxDepth);
          }
        } else {
          const childStructure = this.analyzeStructure(value, depth + 1, currentPath);
          structure.maxDepth = Math.max(structure.maxDepth, childStructure.maxDepth);
        }
      }
    }

    return structure;
  }

  extractSampleData(obj) {
    const sample = {};
    
    // Look for common BMS elements
    const commonElements = [
      'CustomerInfo', 'VehicleInfo', 'PartsInfo', 'LaborInfo', 
      'EstimateInfo', 'InsuranceInfo', 'DocumentInfo', 'RefClaimNum'
    ];

    for (const element of commonElements) {
      if (this.findElement(obj, element)) {
        sample[element] = this.findElement(obj, element);
      }
    }

    return sample;
  }

  findElement(obj, elementName) {
    if (typeof obj !== 'object' || obj === null) {
      return null;
    }

    if (obj[elementName]) {
      return obj[elementName];
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        const found = this.findElement(value, elementName);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  async runAnalysis() {
    this.log('🔍 Starting BMS Structure Analysis...\n');
    
    const bmsFiles = [
      { path: 'Example BMS/593475061.xml', name: 'BMS File 1 (593475061)' },
      { path: 'Example BMS/599540605.xml', name: 'BMS File 2 (599540605)' },
      { path: 'Example BMS/602197685.xml', name: 'BMS File 3 (602197685)' }
    ];

    for (const file of bmsFiles) {
      if (fs.existsSync(file.path)) {
        const result = this.analyzeBMSFile(file.path, file.name);
        this.results.push(result);
      } else {
        this.log(`⚠️ File not found: ${file.path}`, 'warn');
      }
    }

    // Generate detailed report
    console.log('\n' + '='.repeat(80));
    console.log('🔍 BMS STRUCTURE ANALYSIS RESULTS');
    console.log('='.repeat(80));
    
    this.results.forEach(result => {
      if (result.status === 'success') {
        console.log(`\n📁 ${result.file}:`);
        console.log(`   Structure Depth: ${result.structure.maxDepth}`);
        console.log(`   Key Sections: ${result.structure.sections.join(', ')}`);
        
        if (Object.keys(result.sample).length > 0) {
          console.log(`   Sample Data Found:`);
          Object.entries(result.sample).forEach(([key, value]) => {
            console.log(`     - ${key}: ${typeof value === 'object' ? Object.keys(value).join(', ') : 'Found'}`);
          });
        }
      } else {
        console.log(`\n❌ ${result.file}: ${result.error}`);
      }
    });

    console.log('\n' + '='.repeat(80));
    this.log('🎉 BMS structure analysis completed!');
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new BMSStructureAnalyzer();
  analyzer.runAnalysis();
}

module.exports = BMSStructureAnalyzer;
