import { Sequelize } from 'sequelize';

export interface User {
  id: string;
  shopId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  supervisorId?: string;
  permissions: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  shopId: string;
  jobNumber: string;
  customerId: string;
  vehicleId: string;
  status: string;
  priority: string;
  jobType: string;
  claimNumber?: string;
  estimateNumber?: string;
  deductible: number;
  totalAmount: number;
  laborAmount: number;
  partsAmount: number;
  materialsAmount: number;
  subletAmount: number;
  taxAmount: number;
  damageDescription?: string;
  repairDescription?: string;
  notes?: string;
  estimateStatus: string;
  isInsurance: boolean;
  checkInDate?: Date;
  source: string;
  metadata?: any;
  history?: any[];
  isUserModified: boolean;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  findByPk: (id: string, options?: any) => Promise<Job | null>;
  update: (values: any, options?: any) => Promise<Job>;
  count: (options?: any) => Promise<number>;
  findOne: (options?: any) => Promise<Job | null>;
  create: (values: any, options?: any) => Promise<Job>;
}

export interface Shop {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  setupCompleted: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  findOne: (options?: any) => Promise<Shop | null>;
  create: (values: any, options?: any) => Promise<Shop>;
}

export interface Customer {
  id: string;
  shopId: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  customerType: string;
  customerStatus: string;
  gstExempt: boolean;
  preferredContact: string;
  firstVisitDate: Date;
  lastVisitDate: Date;
  createdAt: Date;
  updatedAt: Date;
  findOne: (options?: any) => Promise<Customer | null>;
  create: (values: any, options?: any) => Promise<Customer>;
  count: (options?: any) => Promise<number>;
  update: (values: any, options?: any) => Promise<Customer>;
}

export interface Vehicle {
  id: string;
  shopId: string;
  customerId: string;
  vin?: string;
  licensePlate?: string;
  licenseState?: string;
  year: number;
  make: string;
  model: string;
  subModel?: string;
  bodyStyle?: string;
  engine?: string;
  transmission?: string;
  fuelType?: string;
  exteriorColor?: string;
  interiorColor?: string;
  odometer: number;
  odometerUnit: string;
  condition?: string;
  drivable: boolean;
  priorDamage: boolean;
  vehicleStatus: string;
  createdAt: Date;
  updatedAt: Date;
  findOne: (options?: any) => Promise<Vehicle | null>;
  create: (values: any, options?: any) => Promise<Vehicle>;
  update: (values: any, options?: any) => Promise<Vehicle>;
}

export interface Part {
  id: string;
  shopId: string;
  partNumber: string;
  oemPartNumber?: string;
  description: string;
  category: string;
  subCategory?: string;
  price: number;
  cost: number;
  margin: number;
  stockQuantity: number;
  minStockLevel: number;
  supplier?: string;
  primaryVendorId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vendor {
  id: string;
  shopId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  vendorType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelStatic {
  findOne: (options?: any) => Promise<any>;
  findByPk: (id: string, options?: any) => Promise<any>;
  create: (values: any, options?: any) => Promise<any>;
  update: (values: any, options?: any) => Promise<any>;
  count: (options?: any) => Promise<number>;
}

export interface Models {
  sequelize: Sequelize;
  User: ModelStatic & typeof User;
  Job: ModelStatic & typeof Job;
  Shop: ModelStatic & typeof Shop;
  Customer: ModelStatic & typeof Customer;
  Vehicle: ModelStatic & typeof Vehicle;
  Part: ModelStatic & typeof Part;
  Vendor: ModelStatic & typeof Vendor;
}

declare const models: Models;
export = models;