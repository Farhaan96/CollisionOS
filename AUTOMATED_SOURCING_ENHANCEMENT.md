# Automated Parts Sourcing Enhancement for CollisionOS

## Overview

This enhancement adds comprehensive automated parts sourcing capabilities to the CollisionOS BMS processing pipeline, enabling real-time vendor integration, intelligent parts classification, and automated purchase order generation during BMS file ingestion.

## Key Features

### 🔧 Enhanced BMS Processing Pipeline
- **Real-time Vendor Integration**: Automatically queries multiple suppliers during BMS processing
- **Intelligent Parts Classification**: Advanced part type detection (OEM, Aftermarket, Recycled)
- **VIN-Based Enhancement**: Automatic vehicle decoding for precise parts matching
- **Smart Business Rules**: Insurance company requirements and pricing strategies

### 📊 Automated Sourcing Workflow
- **Multi-Vendor Querying**: Parallel API calls with configurable timeouts
- **Pricing Comparison**: Real-time price analysis across suppliers
- **Lead Time Prediction**: Estimated delivery dates for each part
- **Availability Checking**: Stock verification before recommendation

### 🚀 Purchase Order Automation
- **Auto-PO Generation**: Creates purchase orders based on optimal vendor selection
- **Approval Workflows**: High-value items flagged for manual approval
- **Vendor-Specific Formatting**: Tailored PO formats for each supplier
- **Markup Application**: Automated pricing with category-based markups

## Architecture

### Core Services

#### 1. AutomatedPartsSourcingService
Main orchestration service for parts sourcing workflow.

**Key Methods:**
- `processAutomatedPartsSourcing()` - Main entry point for sourcing workflow
- `classifyAndNormalizePart()` - Intelligent part classification
- `checkVendorAvailability()` - Multi-vendor availability checking
- `selectBestVendor()` - Business rule-based vendor selection

#### 2. BMSValidationService
Comprehensive validation for automated processing.

**Validation Levels:**
- **Critical**: Must-pass rules for data integrity
- **Warning**: Issues that don't prevent processing but need attention
- **Info**: Data completeness and optimization suggestions

#### 3. VINDecodingService
Enhanced VIN decoding with fallback mechanisms.

**Features:**
- NHTSA API integration with fallback
- Pattern-based VIN analysis
- Vehicle specification enhancement
- Parts compatibility hints

#### 4. Enhanced BMSService
Extended with automated sourcing integration.

**New Methods:**
- `processBMSWithAutomatedSourcing()` - BMS processing with sourcing
- `generateSourcingRecommendations()` - UI-friendly recommendations
- `formatSourcedPartsForUI()` - Structured sourcing data
- `generatePORecommendations()` - Purchase order suggestions

### API Endpoints

#### `/api/automated-sourcing/process-bms`
Process BMS file with automated parts sourcing.

**Request:**
```javascript
// Form data with XML file
{
  bmsFile: File,
  enableAutomatedSourcing: boolean,
  enhanceWithVinDecoding: boolean,
  generateAutoPO: boolean,
  vendorTimeout: number,
  approvalThreshold: number,
  baseMarkup: number,
  preferredVendors: string[]
}
```

**Response:**
```javascript
{
  success: boolean,
  data: {
    importId: string,
    customer: Object,
    vehicle: Object,
    automatedSourcing: {
      enabled: boolean,
      success: boolean,
      results: Array,
      statistics: Object,
      recommendations: Object
    },
    sourcedParts: Array,
    purchaseOrderRecommendations: Array
  }
}
```

#### `/api/automated-sourcing/validate-bms`
Validate BMS data for automated sourcing readiness.

#### `/api/automated-sourcing/decode-vin`
Decode VIN for enhanced vehicle information.

#### `/api/automated-sourcing/source-parts`
Run automated sourcing on extracted parts data.

## Implementation Details

### Parts Classification Logic

```javascript
const classifyPartType = (description, partNumber, existingType) => {
  // OEM Indicators
  const oemIndicators = ['genuine', 'original', 'oem', 'factory'];
  
  // Aftermarket Indicators  
  const aftermarketIndicators = ['aftermarket', 'replacement', 'compatible'];
  
  // Recycled Indicators
  const recycledIndicators = ['used', 'recycled', 'salvage', 'lkq'];
  
  // Classification logic with safety-first approach
  // Defaults to OEM for safety-critical parts
};
```

### Vendor Selection Algorithm

```javascript
const selectBestVendor = (vendorResults, part, options) => {
  // Scoring factors:
  // - Price competitiveness (40% weight)
  // - Vendor reliability (30% weight)  
  // - Lead time (20% weight)
  // - Part quality/type preference (10% weight)
  
  return {
    recommended: boolean,
    vendor: Object,
    alternatives: Array,
    reasoningFactors: Object
  };
};
```

### Business Rules Engine

```javascript
const applyInsuranceRules = (claim, insuranceCompany) => {
  const rules = {
    'State Farm': {
      requiresPhotos: true,
      supplementThreshold: 500,
      preferredVendors: ['LKQ', 'Keystone'],
      laborRateMax: 58,
      allowAlternativeParts: true
    }
    // Additional insurance company rules...
  };
  
  return applyRules(claim, rules[insuranceCompany]);
};
```

## Usage Examples

### Basic BMS Processing with Automated Sourcing

```javascript
const bmsService = new BMSService();

const result = await bmsService.processBMSWithAutomatedSourcing(
  xmlContent,
  { fileName: 'estimate.xml', userId: 'user123' },
  {
    enableAutomatedSourcing: true,
    enhanceWithVinDecoding: true,
    generateAutoPO: true,
    vendorTimeout: 2000,
    preferredVendors: ['oem_direct', 'aftermarket_premium'],
    approvalThreshold: 1000,
    baseMarkup: 0.25
  }
);

console.log('Sourced Parts:', result.sourcedParts.length);
console.log('PO Recommendations:', result.purchaseOrderRecommendations.length);
```

### Standalone Parts Sourcing

```javascript
const automatedSourcing = new AutomatedPartsSourcingService();

const parts = [
  {
    description: 'Front Bumper Cover',
    partNumber: '84044368',
    quantity: 1,
    partCost: 385.00
  }
];

const vehicleInfo = {
  vin: '1G1BC5SM5H7123456',
  year: 2017,
  make: 'Chevrolet',
  model: 'Malibu'
};

const results = await automatedSourcing.processAutomatedPartsSourcing(
  parts,
  vehicleInfo,
  { generatePO: true }
);

console.log('Sourcing Success Rate:', results.statistics.sourcingSuccessRate);
```

### VIN Decoding

```javascript
const vinDecoder = new VINDecodingService();

const decodedData = await vinDecoder.decodeVIN('1G1BC5SM5H7123456');

console.log('Make:', decodedData.make);
console.log('Model:', decodedData.model);
console.log('Year:', decodedData.year);
console.log('Parts Compatibility:', decodedData.partsCompatibility);
```

## Configuration

### Environment Variables

```bash
# Vendor API Configuration
NHTSA_VIN_API_ENABLED=true
VENDOR_TIMEOUT_MS=2000
VENDOR_CACHE_TTL_MS=900000

# Business Rules
DEFAULT_MARKUP_PERCENTAGE=25
APPROVAL_THRESHOLD_USD=1000
MAX_VENDOR_QUERIES=5

# Performance Settings
PARTS_BATCH_SIZE=10
MAX_PROCESSING_TIME_MS=30000
```

### Vendor Configuration

```javascript
const vendorConfig = {
  oem_direct: {
    name: 'OEM Direct',
    type: 'OEM',
    priority: 1,
    timeout: 2000,
    reliability: 0.95
  },
  aftermarket_premium: {
    name: 'Premium Aftermarket',
    type: 'Aftermarket',  
    priority: 2,
    timeout: 1500,
    reliability: 0.92
  }
  // Additional vendor configurations...
};
```

## Performance Metrics

### Target Performance
- **BMS Processing**: <30 seconds for 100 parts
- **Vendor Response**: <2 seconds per vendor
- **Sourcing Success Rate**: >95% for standard parts
- **Cache Hit Rate**: >80% for repeated VIN lookups

### Monitoring
- Processing time tracking
- Vendor response time monitoring  
- Success rate analytics
- Error rate tracking
- Cache performance metrics

## Testing

### Test Suite
Run comprehensive automated sourcing tests:

```bash
# Run all automated sourcing tests
npm test -- server/test/automatedSourcing.test.js

# Run performance benchmarks
npm test -- server/test/automatedSourcing.test.js --grep "Performance"

# Run validation tests
npm test -- server/test/automatedSourcing.test.js --grep "Validation"
```

### Manual Testing
Execute the test script to validate functionality:

```bash
node scripts/test-automated-sourcing.js
```

Expected output:
```
🔧 Testing Automated Parts Sourcing Enhancement
============================================================
✅ Services initialized successfully

📍 Test 1: VIN Decoding Service
----------------------------------------
Testing VIN: 1G1BC5SM5H7123456
VIN Validation: ✅ Valid
Manufacturer: Chevrolet
Year: 2017
WMI: 1G1

📍 Test 2: Sample Parts Sourcing
----------------------------------------
Processing 3 parts for sourcing...
⏱️  Processing time: 1245ms
📊 Success: true
📈 Results: 3 parts processed
📋 Statistics: {
  "totalParts": 3,
  "successfullySourced": 3,
  "sourcingSuccessRate": "100.0%",
  "requiresApproval": 1
}
```

## Integration Points

### Existing Systems
- **Parts Service**: Enhanced with sourcing capabilities
- **Vendor Management**: Integrated vendor selection
- **Purchase Order System**: Automated PO generation
- **Mobile App**: Real-time sourcing status updates

### Database Schema
New tables added:
- `sourcing_results` - Historical sourcing data
- `vendor_responses` - Vendor API response cache
- `vin_cache` - Decoded VIN information
- `sourcing_metrics` - Performance tracking

## Error Handling & Fallbacks

### Vendor Failures
- **Timeout Handling**: Graceful degradation with shorter timeouts
- **Fallback Vendors**: Secondary vendor options
- **Manual Override**: User can manually select vendors

### VIN Decoding Failures
- **Pattern Matching**: Basic info extraction from VIN structure
- **Manual Input**: User can provide vehicle details
- **Database Lookup**: Historical VIN data cache

### Network Issues
- **Retry Logic**: Exponential backoff for failed requests
- **Offline Mode**: Process without sourcing data
- **Cache Utilization**: Use cached data when available

## Security Considerations

### API Security
- **Rate Limiting**: Prevent vendor API abuse
- **Authentication**: Secure vendor API credentials
- **Data Encryption**: Sensitive data protection

### Data Privacy
- **PII Handling**: Customer data protection
- **Audit Logging**: Track all sourcing activities
- **Compliance**: Meet industry data requirements

## Future Enhancements

### Planned Features
- **AI-Powered Recommendations**: Machine learning for vendor selection
- **Real-Time Inventory**: Live stock level integration
- **Price History Analysis**: Trend-based pricing decisions
- **Supplier Performance Analytics**: Vendor KPI dashboards

### Integration Opportunities
- **ERP Systems**: Direct integration with shop management
- **Accounting Software**: Automated invoice processing
- **CRM Systems**: Customer notification automation
- **Inventory Management**: Stock level synchronization

## Support & Maintenance

### Monitoring & Alerts
- Performance degradation alerts
- Vendor API failure notifications
- High error rate warnings
- Cache expiration reminders

### Regular Maintenance
- Vendor configuration updates
- Performance optimization reviews
- Error rate analysis
- User feedback integration

---

**Implementation Status**: ✅ Complete  
**Testing Status**: ✅ Comprehensive test suite implemented  
**Documentation Status**: ✅ Complete  
**Production Ready**: ✅ Ready for deployment  

For technical support or questions about this enhancement, please refer to the test scripts and comprehensive documentation provided.