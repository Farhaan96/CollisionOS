import { Decimal } from 'decimal.js';
import { Transaction } from 'sequelize';

// Data structures for parsed BMS/EMS data
export interface NormalizedPayload {
  identities: {
    ro_number: string;
    claim_number: string;
    vin: string;
  };
  customer: CustomerData & { gst_payable: boolean };
  vehicle: VehicleData;
  lines: EstimateLine[];
  parts: PartData[];
  meta: {
    source_system: string;
    import_timestamp: Date;
    unknown_tags: string[];
  };
}

export interface CustomerData {
  type: 'person' | 'organization';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: {
    address1: string;
    city?: string;
    stateProvince?: string;
    postalCode?: string;
  };
}

export interface VehicleData {
  vin: string;
  year: number;
  make: string;
  model: string;
  subModel?: string;
  bodyStyle?: string;
  exteriorColor?: string;
  interiorColor?: string;
  odometer?: number;
  odometerUnit?: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  condition?: string;
  drivable?: boolean;
  priorDamage?: boolean;
  license?: {
    plateNumber?: string;
    stateProvince?: string;
  };
}

export interface EstimateLine {
  lineNum: number;
  uniqueSequenceNum: string;
  parentLineNum?: number;
  lineDesc: string;
  lineType: string;
  partInfo?: PartInfo;
  laborInfo?: LaborInfo;
  otherChargesInfo?: OtherChargesInfo;
  taxable: boolean;
  amount: Decimal;
}

export interface PartInfo {
  partNumber: string;
  oemPartNumber?: string;
  description: string;
  price: Decimal;
  quantity: number;
  partType?: string;
  sourceCode?: string;
  taxable?: boolean;
}

export interface LaborInfo {
  laborType: string;
  operation: string;
  hours: Decimal;
  rate?: Decimal;
  taxable?: boolean;
  paintStages?: number;
}

export interface OtherChargesInfo {
  type: string;
  price: Decimal;
  taxable: boolean;
}

export interface PartData {
  partNumber: string;
  oemPartNumber?: string;
  description: string;
  price: Decimal;
  quantity: number;
  supplier?: string;
  partType?: string;
  lineNumber: number;
}

// Sequelize model types
export type Database = typeof import('../../database/models/index.js');

// Re-export Transaction type for convenience
export { Transaction } from 'sequelize';