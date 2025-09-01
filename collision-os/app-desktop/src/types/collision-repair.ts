// Collision Repair System TypeScript Definitions
// Specialized types for insurance collision repair operations

export interface RepairOrder {
  id: string;
  roNumber: string;
  claimNumber: string;
  status: RepairOrderStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletionDate: Date;
  actualCompletionDate?: Date;

  // Vehicle Information
  vehicle: VehicleInfo;

  // Customer & Insurance
  customer: CustomerInfo;
  insurance: InsuranceInfo;

  // Repair Details
  damages: DamageAssessment[];
  estimateLines: EstimateLine[];
  purchaseOrders: PurchaseOrder[];

  // Progress Tracking
  stages: RepairStage[];
  currentStage: RepairStageType;
  progressPercentage: number;

  // Financial
  totalEstimate: number;
  totalActual: number;
  laborHours: number;

  // Photos & Documentation
  photos: RepairPhoto[];
  documents: RepairDocument[];
}

export enum RepairOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_PARTS = 'waiting_parts',
  QUALITY_CHECK = 'quality_check',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
}

export enum RepairStageType {
  INTAKE = 'intake',
  TEARDOWN = 'teardown',
  ORDERING = 'ordering',
  BODY_WORK = 'body_work',
  PAINT_PREP = 'paint_prep',
  PAINTING = 'painting',
  REASSEMBLY = 'reassembly',
  DETAIL = 'detail',
  QUALITY_CHECK = 'quality_check',
  DELIVERY_PREP = 'delivery_prep',
}

export interface VehicleInfo {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color: string;
  mileage: number;
  licensePlate: string;

  // Collision specific
  preAccidentValue: number;
  postAccidentValue: number;
  totalLoss: boolean;
}

export interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;

  // Insurance relationship
  policyHolder: boolean;
  relationToPolicyHolder?: string;
}

export interface InsuranceInfo {
  company: string;
  policyNumber: string;
  claimNumber: string;
  deductible: number;
  adjusterName: string;
  adjusterPhone: string;
  adjusterEmail: string;

  // Financial limits
  coverageType: CoverageType;
  policyLimit: number;
  deductiblePaid: boolean;
}

export enum CoverageType {
  LIABILITY = 'liability',
  COLLISION = 'collision',
  COMPREHENSIVE = 'comprehensive',
  UNINSURED_MOTORIST = 'uninsured_motorist',
}

export interface DamageAssessment {
  id: string;
  area: VehicleArea;
  damageType: DamageType;
  severity: DamageSeverity;
  description: string;
  photos: string[];
  estimatedCost: number;
}

export enum VehicleArea {
  FRONT_BUMPER = 'front_bumper',
  REAR_BUMPER = 'rear_bumper',
  LEFT_FRONT_FENDER = 'left_front_fender',
  RIGHT_FRONT_FENDER = 'right_front_fender',
  LEFT_FRONT_DOOR = 'left_front_door',
  RIGHT_FRONT_DOOR = 'right_front_door',
  LEFT_REAR_DOOR = 'left_rear_door',
  RIGHT_REAR_DOOR = 'right_rear_door',
  HOOD = 'hood',
  ROOF = 'roof',
  TRUNK = 'trunk',
  LEFT_SIDE = 'left_side',
  RIGHT_SIDE = 'right_side',
}

export enum DamageType {
  DENT = 'dent',
  SCRATCH = 'scratch',
  CRACK = 'crack',
  BROKEN = 'broken',
  MISSING = 'missing',
  BENT = 'bent',
  TORN = 'torn',
}

export enum DamageSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  SEVERE = 'severe',
}

export interface EstimateLine {
  id: string;
  lineNumber: number;
  type: LineType;
  partNumber?: string;
  description: string;
  quantity: number;

  // Labor
  laborHours: number;
  laborRate: number;
  laborCost: number;

  // Parts
  partCost: number;
  partSupplier?: string;
  partETA?: Date;

  // Paint & Materials
  paintCost?: number;
  materialsCost?: number;

  // Totals
  lineCost: number;

  // Status
  status: LineStatus;
  notes?: string;
}

export enum LineType {
  LABOR = 'labor',
  PARTS = 'parts',
  PAINT = 'paint',
  MATERIALS = 'materials',
  SUBLET = 'sublet',
}

export enum LineStatus {
  PENDING = 'pending',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: SupplierInfo;
  orderDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  status: POStatus;

  // Line Items
  items: POLineItem[];

  // Financial
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;

  // Tracking
  trackingNumber?: string;
  notes?: string;
}

export enum POStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  SHIPPED = 'shipped',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export interface POLineItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitCost: number;
  lineCost: number;

  // Status
  received: number;
  backordered: number;

  // References
  estimateLineId?: string;
}

export interface SupplierInfo {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: Address;

  // Terms
  paymentTerms: string;
  shippingMethod: string;
  accountNumber?: string;
}

export interface RepairStage {
  id: string;
  stage: RepairStageType;
  status: StageStatus;
  startDate?: Date;
  endDate?: Date;
  assignedTechnician?: string;
  notes?: string;
  photos?: string[];
}

export enum StageStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export interface RepairPhoto {
  id: string;
  url: string;
  caption: string;
  stage: RepairStageType;
  area?: VehicleArea;
  timestamp: Date;
  takenBy: string;
}

export interface RepairDocument {
  id: string;
  type: DocumentType;
  name: string;
  url: string;
  uploadDate: Date;
  uploadedBy: string;
}

export enum DocumentType {
  ESTIMATE = 'estimate',
  INVOICE = 'invoice',
  INSURANCE_FORM = 'insurance_form',
  PHOTO = 'photo',
  RECEIPT = 'receipt',
  OTHER = 'other',
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// BMS Integration Types
export interface BMSImportData {
  source: string;
  importDate: Date;
  claimNumber: string;
  estimateData: EstimateLine[];
  vehicleData: Partial<VehicleInfo>;
  customerData: Partial<CustomerInfo>;
  insuranceData: Partial<InsuranceInfo>;
}

// Dashboard Analytics Types
export interface CollisionRepairMetrics {
  activeRepairs: number;
  completedThisMonth: number;
  averageRepairTime: number;
  customerSatisfaction: number;
  partsOnOrder: number;
  revenueThisMonth: number;
  cycleTimeByStage: Record<RepairStageType, number>;
  topDamageTypes: Array<{ type: DamageType; count: number }>;
}
