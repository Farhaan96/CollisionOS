# Third-Party Integrations Guide

This guide covers the comprehensive third-party API integrations implemented in CollisionOS, including insurance companies, parts suppliers, and the underlying integration framework.

## Overview

CollisionOS supports robust third-party integrations with:

- **Insurance Companies**: Claims submission, estimate approvals, status updates
- **Parts Suppliers**: Catalog search, pricing comparison, order management
- **Real-time Updates**: Webhook handling for instant notifications

## Architecture

### Integration Framework

The `IntegrationFramework` provides the foundation for all third-party integrations:

- **Robust Error Handling**: Automatic retry logic with exponential backoff
- **Rate Limiting**: Configurable request throttling and queue management
- **Authentication Support**: Multiple auth types (API Key, OAuth, Basic, Custom)
- **Webhook Processing**: Secure signature verification and event handling
- **Health Monitoring**: Automatic health checks and status reporting

### Key Components

```
server/services/
├── integrationFramework.js     # Core integration framework
├── insuranceIntegration.js     # Insurance provider integrations
├── partsSupplierIntegration.js # Parts supplier integrations
└── realtimeService.js          # Real-time update broadcasting
```

## Insurance Integrations

### Supported Providers

#### Mitchell International
- **Authentication**: OAuth 2.0
- **Features**: Claims submission, estimate approval, status updates
- **Data Format**: Structured JSON with Mitchell-specific schema

#### CCC Information Services
- **Authentication**: API Key
- **Features**: Claims processing, estimate management
- **Data Format**: REST API with CCC data model

#### Audatex
- **Authentication**: Basic Authentication
- **Features**: Estimate submission, status tracking
- **Data Format**: XML-based communication

### Usage Examples

#### Register Insurance Provider

```javascript
// Register Mitchell provider
POST /api/integrations/insurance/providers
{
  "name": "Mitchell Production",
  "type": "mitchell",
  "credentials": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "accessToken": "your-access-token"
  }
}
```

#### Submit Insurance Claim

```javascript
POST /api/integrations/insurance/claims
{
  "provider": "Mitchell Production",
  "claimData": {
    "policyNumber": "POL-123456789",
    "dateOfLoss": "2024-01-15T10:30:00Z",
    "damageDescription": "Front-end collision with significant damage to bumper, hood, and headlight assembly",
    "customerInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "555-123-4567",
      "email": "john.doe@email.com",
      "address": "123 Main Street, Anytown, ST 12345"
    },
    "vehicleInfo": {
      "vin": "1HGBH41JXMN109186",
      "year": 2021,
      "make": "Honda",
      "model": "Accord",
      "mileage": 25000
    },
    "lossLocation": "Intersection of Main St & Oak Ave",
    "jobId": "job-uuid-here"
  }
}
```

#### Submit Estimate for Approval

```javascript
POST /api/integrations/insurance/estimates
{
  "provider": "Mitchell Production",
  "estimateData": {
    "claimNumber": "CLM-789012345",
    "totalAmount": 5500.00,
    "laborTotal": 2800.00,
    "partsTotal": 2200.00,
    "miscTotal": 500.00,
    "repairItems": [
      {
        "lineNumber": 1,
        "description": "Replace front bumper cover",
        "laborHours": 3.5,
        "laborRate": 65.00,
        "partsAmount": 450.00,
        "operationType": "replace"
      },
      {
        "lineNumber": 2,
        "description": "Paint front bumper cover",
        "laborHours": 2.0,
        "laborRate": 65.00,
        "partsAmount": 120.00,
        "operationType": "paint"
      }
    ],
    "jobId": "job-uuid-here"
  }
}
```

## Parts Supplier Integrations

### Supported Suppliers

#### LKQ Corporation
- **Authentication**: API Key
- **Features**: OEM, Aftermarket, and Recycled parts search
- **Specialties**: Extensive recycled parts inventory

#### Genuine Parts Company (GPC)
- **Authentication**: OAuth 2.0
- **Features**: Aftermarket parts catalog, pricing
- **Specialties**: NAPA Auto Parts network

#### AutoZone Commercial
- **Authentication**: Custom API Key
- **Features**: Vehicle-specific parts search
- **Specialties**: Commercial accounts, fast delivery

#### Hollander Interchange
- **Authentication**: Basic Authentication
- **Features**: Parts interchange lookup
- **Specialties**: Alternative parts identification

### Usage Examples

#### Search Parts Across Suppliers

```javascript
POST /api/integrations/parts/search
{
  "searchCriteria": {
    "query": "front bumper cover",
    "vehicleInfo": {
      "vin": "1HGBH41JXMN109186",
      "year": 2021,
      "make": "Honda",
      "model": "Accord",
      "engine": "2.0L"
    },
    "category": "body",
    "partType": "oem",
    "location": "12345",
    "maxDistance": 50
  },
  "providers": ["LKQ", "GPC", "AutoZone"]
}
```

#### Compare Prices

```javascript
POST /api/integrations/parts/pricing/compare
{
  "partNumbers": [
    "HO1000245",
    "HO1000246",
    "HO1002118"
  ],
  "providers": ["LKQ", "GPC", "Hollander"]
}
```

#### Create Order with Best Price Strategy

```javascript
POST /api/integrations/parts/orders
{
  "orderData": {
    "items": [
      {
        "partNumber": "HO1000245",
        "quantity": 1,
        "description": "2021 Honda Accord Front Bumper Cover"
      }
    ],
    "shippingAddress": {
      "name": "Collision Repair Shop",
      "address": "456 Business Blvd",
      "city": "Anytown",
      "state": "ST",
      "zipCode": "12345",
      "phone": "555-987-6543"
    },
    "urgency": "standard",
    "specialInstructions": "Deliver to rear loading dock"
  },
  "strategy": "best_price"
}
```

## Webhook Integration

### Setting Up Webhooks

Webhooks provide real-time updates from integration providers. Configure webhook endpoints in your provider dashboards:

```
https://your-domain.com/api/integrations/webhooks/{provider}/{eventType}
```

### Supported Webhook Events

#### Insurance Webhooks
- `claim_status_update`: Claim approval/denial notifications
- `estimate_approval`: Estimate approval with authorized amounts
- `payment_issued`: Payment processing notifications

#### Parts Supplier Webhooks
- `order_status_update`: Shipping and delivery updates
- `price_update`: Real-time pricing changes
- `availability_update`: Stock level changes

### Example Webhook Payload

```javascript
// Insurance claim status update
{
  "claimNumber": "CLM-789012345",
  "status": "approved",
  "approvedAmount": 5500.00,
  "adjustorNotes": "Approved as submitted",
  "updatedAt": "2024-01-16T14:30:00Z"
}

// Parts order status update
{
  "orderNumber": "ORD-123456789",
  "status": "shipped",
  "trackingNumber": "1Z999AA1234567890",
  "carrier": "UPS",
  "estimatedDelivery": "2024-01-18T17:00:00Z",
  "items": [
    {
      "partNumber": "HO1000245",
      "quantity": 1,
      "status": "shipped"
    }
  ]
}
```

## Error Handling and Resilience

### Retry Logic

All integrations implement exponential backoff retry logic:

```javascript
// Default retry configuration
{
  "retryAttempts": 3,
  "initialDelay": 1000,      // 1 second
  "maxDelay": 30000,         // 30 seconds
  "retryOnStatus": [408, 409, 429, 500, 502, 503, 504]
}
```

### Rate Limiting

Configurable rate limiting prevents API quota exhaustion:

```javascript
{
  "rateLimitDelay": 1000,    // 1 second between requests
  "burstLimit": 10,          // Maximum concurrent requests
  "requestsPerMinute": 60    // Overall rate limit
}
```

### Error Types

- **ValidationError**: Invalid request data
- **AuthenticationError**: Invalid credentials
- **RateLimitError**: API quota exceeded
- **APIError**: Provider-specific errors
- **NetworkError**: Connection issues

## Configuration Management

### Environment Variables

```bash
# Insurance Providers
MITCHELL_CLIENT_ID=your_mitchell_client_id
MITCHELL_CLIENT_SECRET=your_mitchell_client_secret
MITCHELL_BASE_URL=https://api.mitchell.com/v1

CCC_API_KEY=your_ccc_api_key
CCC_BASE_URL=https://api.cccis.com/v2

AUDATEX_USERNAME=your_audatex_username
AUDATEX_PASSWORD=your_audatex_password
AUDATEX_BASE_URL=https://api.audatex.com/v1

# Parts Suppliers
LKQ_API_KEY=your_lkq_api_key
LKQ_BASE_URL=https://api.lkq.com/v1

GPC_CLIENT_ID=your_gpc_client_id
GPC_CLIENT_SECRET=your_gpc_client_secret
GPC_BASE_URL=https://api.genpt.com/v2

AUTOZONE_API_KEY=your_autozone_api_key
AUTOZONE_BASE_URL=https://commercial-api.autozone.com/v1

HOLLANDER_USERNAME=your_hollander_username
HOLLANDER_PASSWORD=your_hollander_password
HOLLANDER_BASE_URL=https://api.hollander.com/v1

# Webhook Security
WEBHOOK_SECRET=your_webhook_secret_key
```

### Runtime Configuration

```javascript
// Get current configuration
GET /api/integrations/config

{
  "success": true,
  "data": {
    "supportedInsuranceProviders": ["mitchell", "ccc", "audatex"],
    "supportedPartsSuppliers": ["lkq", "gpc", "autozone", "hollander"],
    "features": {
      "realTimeUpdates": true,
      "webhookSupport": true,
      "priceComparison": true,
      "automaticOrdering": true
    },
    "rateLimits": {
      "requestsPerMinute": 60,
      "burstLimit": 10
    }
  }
}
```

## Monitoring and Health Checks

### Health Check Endpoints

```javascript
// Check all integrations
GET /api/integrations/health

// Check specific provider type
GET /api/integrations/insurance/health
GET /api/integrations/parts/health
```

### Response Format

```javascript
{
  "success": true,
  "data": {
    "insurance": {
      "Mitchell Production": {
        "status": "healthy",
        "responseTime": 245,
        "lastCheck": "2024-01-16T10:15:30Z"
      },
      "CCC Primary": {
        "status": "healthy",
        "responseTime": 189,
        "lastCheck": "2024-01-16T10:15:30Z"
      }
    },
    "partsSuppliers": {
      "LKQ": {
        "status": "healthy",
        "responseTime": 312,
        "lastCheck": "2024-01-16T10:15:30Z"
      },
      "GPC": {
        "status": "degraded",
        "responseTime": 2500,
        "lastCheck": "2024-01-16T10:15:30Z",
        "warning": "High response times"
      }
    },
    "timestamp": "2024-01-16T10:15:30Z"
  }
}
```

## Testing

### Unit Tests

```bash
# Run integration framework tests
npm run test:unit -- integrationFramework.test.js

# Run insurance integration tests
npm run test:unit -- insuranceIntegration.test.js

# Run parts supplier integration tests
npm run test:unit -- partsSupplierIntegration.test.js
```

### Integration Tests

```bash
# Run all third-party integration tests
npm run test:integration -- thirdPartyIntegrations.test.js

# Run specific integration tests
npm run test:integration -- --grep "Insurance Integration"
npm run test:integration -- --grep "Parts Supplier Integration"
```

### Mock Testing

For development and testing, use mock providers:

```javascript
// Enable mock mode
process.env.INTEGRATION_MOCK_MODE = 'true';

// Mock responses will be returned instead of actual API calls
```

## Security Best Practices

### API Key Management
- Store credentials in environment variables
- Use key rotation for long-lived integrations
- Implement least-privilege access principles

### Webhook Security
- Verify webhook signatures
- Use HTTPS endpoints only
- Implement rate limiting on webhook endpoints

### Data Protection
- Encrypt sensitive data in transit and at rest
- Log access and modifications
- Implement data retention policies

## Troubleshooting

### Common Issues

#### Authentication Failures
- Verify API credentials are correct
- Check token expiration for OAuth providers
- Ensure correct authentication method is configured

#### Rate Limiting
- Monitor API usage quotas
- Implement request caching where appropriate
- Consider upgrading API plans for higher limits

#### Timeout Issues
- Increase timeout values for slow providers
- Implement circuit breaker patterns
- Use asynchronous processing for long-running operations

### Debug Mode

Enable debug logging for detailed integration information:

```bash
DEBUG=integration:* npm start
```

## Support and Documentation

### API Documentation
- Swagger/OpenAPI specs available at `/api-docs`
- Postman collections provided for testing
- Interactive API explorer for development

### Provider Documentation
- [Mitchell API Documentation](https://api.mitchell.com/docs)
- [CCC Information Services API](https://developer.cccis.com)
- [LKQ API Documentation](https://developer.lkq.com)
- [Genuine Parts Company API](https://developer.genpt.com)

### Getting Help
- Check logs in `logs/integrations.log`
- Review health check endpoints
- Contact provider support for API-specific issues
- Submit issues to CollisionOS repository

---

*This guide covers the comprehensive third-party integration system in CollisionOS. For specific implementation details, refer to the source code and API documentation.*