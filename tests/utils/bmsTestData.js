/**
 * BMS Test Data Utilities
 * Helper functions for creating test BMS XML files and mock data
 */

export function createMockBMSFile(options = {}) {
  const {
    includeAllSections = false,
    validData = true,
    customerName = 'John Doe',
    vehicleYear = 2020,
    vehicleMake = 'Honda',
    vehicleModel = 'Civic',
    vin = 'JH4KA8260PC123456',
    claimNumber = 'CLM123456',
    includeWarnings = false,
    manyDamageLines = false,
    damageLineCount = manyDamageLines ? 50 : 5
  } = options;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<VehicleDamageEstimateAddRq xmlns="http://www.cieca.com/BMS">
  <RqUID>test-uuid-${Date.now()}</RqUID>
  <RefClaimNum>${claimNumber}</RefClaimNum>
  
  <DocumentInfo>
    <BMSVer>5.2.22</BMSVer>
    <DocumentType>E</DocumentType>
    <DocumentID>TEST-DOC-${Date.now()}</DocumentID>
    <VendorCode>M</VendorCode>
    <DocumentStatus>C</DocumentStatus>
    <CreateDateTime>${new Date().toISOString()}</CreateDateTime>
    <TransmitDateTime>${new Date().toISOString()}</TransmitDateTime>
    <CurrencyInfo>
      <CurCode>CAD</CurCode>
      <BaseCurCode>CAD</BaseCurCode>
      <CurRate>1.0</CurRate>
    </CurrencyInfo>
  </DocumentInfo>

  <AdminInfo>
    <PolicyHolder>
      <Party>
        <PersonInfo>
          <PersonName>
            <FirstName>${customerName.split(' ')[0]}</FirstName>
            <LastName>${customerName.split(' ')[1] || 'Doe'}</LastName>
          </PersonName>
          <Communications>
            <CommQualifier>AL</CommQualifier>
            <Address>
              <Address1>123 Test Street</Address1>
              <City>Test City</City>
              <StateProvince>BC</StateProvince>
              <PostalCode>V6B 1A1</PostalCode>
            </Address>
          </Communications>
        </PersonInfo>
        <ContactInfo>
          <Communications>
            <CommQualifier>HP</CommQualifier>
            <CommPhone>604-555-0123</CommPhone>
          </Communications>
          <Communications>
            <CommQualifier>EM</CommQualifier>
            <CommEmail>test@example.com</CommEmail>
          </Communications>
        </ContactInfo>
      </Party>
    </PolicyHolder>
    
    ${includeAllSections ? `
    <InsuranceCompany>
      <Party>
        <OrgInfo>
          <CompanyName>Test Insurance Company</CompanyName>
        </OrgInfo>
      </Party>
    </InsuranceCompany>
    
    <Estimator>
      <Party>
        <PersonInfo>
          <PersonName>
            <FirstName>Test</FirstName>
            <LastName>Estimator</LastName>
          </PersonName>
        </PersonInfo>
        <ContactInfo>
          <Communications>
            <CommQualifier>EM</CommQualifier>
            <CommEmail>estimator@testshop.com</CommEmail>
          </Communications>
        </ContactInfo>
      </Party>
    </Estimator>
    ` : ''}
  </AdminInfo>

  <ClaimInfo>
    <ClaimNum>${claimNumber}</ClaimNum>
    <PolicyInfo>
      <PolicyNum>POL-${Date.now()}</PolicyNum>
      <CoverageInfo>
        <Coverage>
          <CoverageCategory>Collision</CoverageCategory>
          <DeductibleInfo>
            <DeductibleStatus>A</DeductibleStatus>
            <DeductibleAmt>500.00</DeductibleAmt>
          </DeductibleInfo>
        </Coverage>
      </CoverageInfo>
    </PolicyInfo>
    <LossInfo>
      <Facts>
        <LossDateTime>${new Date().toISOString()}</LossDateTime>
        <DamageMemo>Front end collision damage</DamageMemo>
        <LossMemo>Vehicle struck another vehicle</LossMemo>
      </Facts>
    </LossInfo>
  </ClaimInfo>

  <VehicleInfo>
    <VINInfo>
      <VIN>
        <VINNum>${vin}</VINNum>
      </VIN>
    </VINInfo>
    <License>
      <LicensePlateNum>ABC123</LicensePlateNum>
      <LicensePlateStateProvince>BC</LicensePlateStateProvince>
    </License>
    <VehicleDesc>
      <ModelYear>${vehicleYear}</ModelYear>
      <MakeCode>HON</MakeCode>
      <MakeDesc>${vehicleMake}</MakeDesc>
      <ModelNum>CIV</ModelNum>
      <ModelName>${vehicleModel}</ModelName>
      <SubModelDesc>LX</SubModelDesc>
      <VehicleType>PC</VehicleType>
      <OdometerInfo>
        <OdometerReading>50000</OdometerReading>
        <OdometerReadingMeasure>MI</OdometerReadingMeasure>
      </OdometerInfo>
    </VehicleDesc>
    <Body>
      <BodyStyle>4D</BodyStyle>
    </Body>
    <Paint>
      <Exterior>
        <Color>
          <ColorName>Silver</ColorName>
        </Color>
      </Exterior>
      <Interior>
        <Color>
          <ColorName>Black</ColorName>
        </Color>
      </Interior>
    </Paint>
    <Powertrain>
      <EngineDesc>1.5L I4</EngineDesc>
      <TransmissionInfo>
        <TransmissionDesc>CVT</TransmissionDesc>
      </TransmissionInfo>
    </Powertrain>
    <Condition>
      <ConditionCode>D</ConditionCode>
      <DrivableInd>Y</DrivableInd>
      <PriorDamageInd>N</PriorDamageInd>
    </Condition>
    <Valuation>
      <ValuationType>ACV</ValuationType>
      <ValuationAmt>25000.00</ValuationAmt>
    </Valuation>
  </VehicleInfo>

  ${generateDamageLines(damageLineCount)}

  <RepairTotalsInfo>
    <LaborTotalsInfo>
      <TotalType>Labor</TotalType>
      <TaxableAmt>2500.00</TaxableAmt>
      <TaxTotalAmt>312.50</TaxTotalAmt>
      <TotalAmt>2812.50</TotalAmt>
    </LaborTotalsInfo>
    <PartsTotalsInfo>
      <TotalType>Parts</TotalType>
      <TaxableAmt>3500.00</TaxableAmt>
      <TaxTotalAmt>437.50</TaxTotalAmt>
      <TotalAmt>3937.50</TotalAmt>
    </PartsTotalsInfo>
    <SummaryTotalsInfo>
      <TotalType>Grand</TotalType>
      <TotalSubType>Total</TotalSubType>
      <TotalTypeDesc>Grand Total</TotalTypeDesc>
      <TotalAmt>6750.00</TotalAmt>
    </SummaryTotalsInfo>
  </RepairTotalsInfo>

  ${includeAllSections ? `
  <ProfileInfo>
    <ProfileName>Standard Profile</ProfileName>
    <ProfileUUID>test-profile-uuid</ProfileUUID>
  </ProfileInfo>

  <EventInfo>
    <EstimateEvent>
      <CommitDateTime>${new Date().toISOString()}</CommitDateTime>
    </EstimateEvent>
  </EventInfo>
  ` : ''}
</VehicleDamageEstimateAddRq>`;
}

export function createInvalidBMSFile(options = {}) {
  const {
    missingVIN = false,
    missingRequiredFields = [],
    invalidEmail = false,
    invalidPostalCode = false,
    invalidYear = false,
    malformedXML = false
  } = options;

  if (malformedXML) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<VehicleDamageEstimateAddRq xmlns="http://www.cieca.com/BMS">
  <RqUID>test-invalid
  <DocumentInfo>
    <BMSVer>5.2.22</BMSVer>
    <!-- Missing closing tags -->
</VehicleDamageEstimateAddRq>`;
  }

  const baseFile = createMockBMSFile({
    includeAllSections: true,
    customerName: 'Invalid Test'
  });

  let modifiedFile = baseFile;

  // Remove VIN if requested
  if (missingVIN) {
    modifiedFile = modifiedFile.replace(/<VINInfo>[\s\S]*?<\/VINInfo>/g, '');
  }

  // Remove required fields
  missingRequiredFields.forEach(field => {
    const regex = new RegExp(`<${field}>.*?<\/${field}>`, 'g');
    modifiedFile = modifiedFile.replace(regex, '');
  });

  // Add invalid email
  if (invalidEmail) {
    modifiedFile = modifiedFile.replace(
      'test@example.com',
      'invalid-email-format'
    );
  }

  // Add invalid postal code
  if (invalidPostalCode) {
    modifiedFile = modifiedFile.replace(
      'V6B 1A1',
      'INVALID'
    );
  }

  // Add invalid year
  if (invalidYear) {
    modifiedFile = modifiedFile.replace(
      '<ModelYear>2020</ModelYear>',
      '<ModelYear>1800</ModelYear>'
    );
  }

  return modifiedFile;
}

function generateDamageLines(count = 5) {
  const lines = [];
  
  for (let i = 1; i <= count; i++) {
    const lineNum = i.toString().padStart(3, '0');
    
    lines.push(`
  <DamageLineInfo>
    <LineNum>${lineNum}</LineNum>
    <UniqueSequenceNum>${i}</UniqueSequenceNum>
    <LineDesc>Test damage line ${i}</LineDesc>
    <LineType>P</LineType>
    
    <PartInfo>
      <PartSourceCode>O</PartSourceCode>
      <PartType>Body</PartType>
      <PartNum>TEST-PART-${lineNum}</PartNum>
      <OEMPartNum>OEM-PART-${lineNum}</OEMPartNum>
      <PartPrice>${(100 + (i * 50)).toFixed(2)}</PartPrice>
      <OEMPartPrice>${(150 + (i * 50)).toFixed(2)}</OEMPartPrice>
      <Quantity>1</Quantity>
      <TaxableInd>1</TaxableInd>
    </PartInfo>
    
    <LaborInfo>
      <LaborType>B</LaborType>
      <LaborOperation>Replace</LaborOperation>
      <LaborHours>${(2.0 + (i * 0.5)).toFixed(1)}</LaborHours>
      <DatabaseLaborHours>${(2.0 + (i * 0.5)).toFixed(1)}</DatabaseLaborHours>
      <TaxableInd>1</TaxableInd>
    </LaborInfo>
  </DamageLineInfo>`);
  }
  
  return lines.join('');
}

export function createMockValidationResult(isValid = true) {
  if (isValid) {
    return {
      isValid: true,
      hasWarnings: false,
      errorCount: 0,
      warningCount: 0,
      totalIssues: 0,
      errors: [],
      warnings: [],
      fieldValidations: {
        'DocumentInfo.BMSVer': { isValid: true, message: 'Valid BMS version' },
        'VehicleInfo.VIN': { isValid: true, message: 'Valid VIN' },
        'PolicyHolder.PersonName': { isValid: true, message: 'Valid person name' }
      },
      summary: {
        status: 'valid',
        message: 'BMS file is valid with no issues detected'
      }
    };
  } else {
    return {
      isValid: false,
      hasWarnings: true,
      errorCount: 2,
      warningCount: 1,
      totalIssues: 3,
      errors: [
        {
          field: 'vehicleInfo.vin',
          message: 'Missing VIN information',
          severity: 'error'
        },
        {
          field: 'documentInfo.documentId',
          message: 'Missing required field: DocumentID',
          severity: 'error'
        }
      ],
      warnings: [
        {
          field: 'adminInfo.email',
          message: 'Invalid email format: invalid-email',
          severity: 'warning'
        }
      ],
      fieldValidations: {
        'VehicleInfo.VIN': { isValid: false, message: 'Missing VIN' },
        'DocumentInfo.DocumentID': { isValid: false, message: 'Missing required field' },
        'PolicyHolder.Email': { isValid: false, message: 'Invalid email format' }
      },
      summary: {
        status: 'invalid',
        message: 'BMS file is invalid with 2 error(s) and 1 warning(s)'
      }
    };
  }
}

export function createMockBatchStatus(status = 'processing') {
  const baseStatus = {
    id: `batch-${Date.now()}`,
    status,
    progress: 0,
    statistics: {
      totalFiles: 5,
      processedFiles: 0,
      successfulFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      totalSize: 50000,
      processedSize: 0
    },
    timestamps: {
      created: new Date(Date.now() - 60000),
      started: new Date(Date.now() - 30000),
      paused: null,
      resumed: null,
      completed: null
    },
    canPause: true,
    canResume: false,
    canCancel: true,
    files: []
  };

  // Generate file statuses based on overall batch status
  for (let i = 0; i < 5; i++) {
    const fileStatus = {
      id: `${baseStatus.id}-file-${i}`,
      fileName: `test-file-${i}.xml`,
      status: 'pending',
      progress: 0,
      error: null
    };

    if (status === 'completed') {
      fileStatus.status = i < 4 ? 'completed' : 'failed';
      fileStatus.progress = 100;
      baseStatus.statistics.processedFiles = 5;
      baseStatus.statistics.successfulFiles = 4;
      baseStatus.statistics.failedFiles = 1;
      baseStatus.statistics.processedSize = 50000;
      baseStatus.progress = 100;
      baseStatus.timestamps.completed = new Date();
      baseStatus.canPause = false;
      baseStatus.canCancel = false;
      
      if (i === 4) {
        fileStatus.error = 'Validation failed';
      }
    } else if (status === 'processing') {
      if (i < 2) {
        fileStatus.status = 'completed';
        fileStatus.progress = 100;
      } else if (i === 2) {
        fileStatus.status = 'processing';
        fileStatus.progress = 50;
      }
      baseStatus.statistics.processedFiles = 2;
      baseStatus.statistics.successfulFiles = 2;
      baseStatus.statistics.processedSize = 20000;
      baseStatus.progress = 40;
    } else if (status === 'paused') {
      if (i < 2) {
        fileStatus.status = 'completed';
        fileStatus.progress = 100;
      }
      baseStatus.statistics.processedFiles = 2;
      baseStatus.statistics.successfulFiles = 2;
      baseStatus.statistics.processedSize = 20000;
      baseStatus.progress = 40;
      baseStatus.timestamps.paused = new Date();
      baseStatus.canPause = false;
      baseStatus.canResume = true;
    }

    baseStatus.files.push(fileStatus);
  }

  return baseStatus;
}

export function createMockErrorReport(errorType = 'validation') {
  const baseReport = {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    context: {
      fileName: 'test-file.xml',
      fileSize: 1024,
      operation: 'upload',
      userId: 'test-user-id',
      sessionId: 'test-session'
    },
    resolution: {
      status: 'unresolved',
      resolvedAt: null,
      resolvedBy: null,
      resolution: null
    }
  };

  switch (errorType) {
    case 'validation':
      return {
        ...baseReport,
        originalError: {
          name: 'ValidationError',
          message: 'Invalid VIN format',
          stack: 'ValidationError: Invalid VIN format\n    at validateVIN...'
        },
        analysis: {
          category: 'validation',
          severity: 'medium',
          userMessage: 'The Vehicle Identification Number (VIN) in the BMS file is invalid or missing.',
          technicalMessage: 'Invalid VIN format',
          suggestions: [
            'Verify the VIN in the original estimate',
            'Check that the VIN contains exactly 17 characters',
            'Ensure the VIN does not contain invalid characters (I, O, Q)'
          ],
          retryable: false,
          affectedComponents: ['Data Validation']
        }
      };

    case 'parsing':
      return {
        ...baseReport,
        originalError: {
          name: 'XMLParseError',
          message: 'XML parse error: Unexpected end of input',
          stack: 'XMLParseError: XML parse error...'
        },
        analysis: {
          category: 'parsing',
          severity: 'high',
          userMessage: 'The BMS file appears to be corrupted or not in valid XML format. Please check the file and try again.',
          technicalMessage: 'XML parse error: Unexpected end of input',
          suggestions: [
            'Ensure the file is a valid BMS XML file from Mitchell Estimating',
            'Check that the file was not corrupted during transfer',
            'Try opening the file in a text editor to verify its contents'
          ],
          retryable: false,
          affectedComponents: ['XML Parser']
        }
      };

    case 'network':
      return {
        ...baseReport,
        originalError: {
          name: 'NetworkError',
          message: 'fetch failed',
          stack: 'NetworkError: fetch failed...'
        },
        analysis: {
          category: 'network',
          severity: 'high',
          userMessage: 'Network connection error occurred during file upload.',
          technicalMessage: 'fetch failed',
          suggestions: [
            'Check your internet connection',
            'Ensure firewall is not blocking the connection',
            'Try again with a smaller file size'
          ],
          retryable: true,
          affectedComponents: ['Network']
        }
      };

    default:
      return baseReport;
  }
}

export function createMockProcessingStatistics() {
  return {
    overall: {
      totalBatches: 25,
      activeBatches: 2,
      queuedBatches: 1,
      completedBatches: 22,
      totalFiles: 150,
      successfulFiles: 142,
      failedFiles: 8,
      overallSuccessRate: 94.67
    },
    errors: {
      totalErrors: 12,
      resolvedErrors: 8,
      unresolvedErrors: 4,
      resolutionRate: 66.67,
      errorsByCategory: {
        'validation': 5,
        'parsing': 3,
        'network': 2,
        'database': 2
      },
      errorsBySeverity: {
        'low': 2,
        'medium': 6,
        'high': 3,
        'critical': 1
      },
      recentErrors: []
    },
    period: {
      name: 'month',
      data: {
        totalUploads: 150,
        successfulUploads: 142,
        failedUploads: 8,
        averageProcessingTime: 4.2,
        dailyBreakdown: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          uploads: Math.floor(Math.random() * 10) + 1,
          successes: Math.floor(Math.random() * 9) + 1,
          failures: Math.floor(Math.random() * 2)
        }))
      }
    }
  };
}