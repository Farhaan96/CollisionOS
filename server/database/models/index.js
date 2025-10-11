const { sequelize } = require('../connection');

// Initialize models
const UserModel = require('./User');
const JobModel = require('./Job');
const ShopModel = require('./Shop');
const CustomerModel = require('./Customer');
const VehicleModel = require('./Vehicle');
const PartModel = require('./Part');
const VendorModel = require('./Vendor');

// New production models
const BmsImportModel = require('./BmsImport');
const EstimateModel = require('./Estimate');
const EstimateLineItemModel = require('./EstimateLineItem');
const PartsOrderModel = require('./PartsOrder');
const PartsOrderItemModel = require('./PartsOrderItem');
const LaborTimeEntryModel = require('./LaborTimeEntry');
const AttachmentModel = require('./Attachment');
const InsuranceCompanyModel = require('./InsuranceCompany');
const InvoiceModel = require('./Invoice');
const VehicleHistoryModel = require('./VehicleHistory');
const WorkflowStatusModel = require('./WorkflowStatus');

// IMEX-level enhancement models
const ProductionStageModel = require('./ProductionStage');
const JobStageHistoryModel = require('./JobStageHistory');
const TechnicianPerformanceModel = require('./TechnicianPerformance');
const CommunicationTemplateModel = require('./CommunicationTemplate');
const CommunicationLogModel = require('./CommunicationLog');
const FinancialTransactionModel = require('./FinancialTransaction');

// Phase 1 Comprehensive Collision Repair Models
const ContactTimelineModel = require('./ContactTimeline');
const VehicleProfileModel = require('./VehicleProfile');
const ClaimManagementModel = require('./ClaimManagement');
const RepairOrderManagementModel = require('./RepairOrderManagement');
const ProductionWorkflowModel = require('./ProductionWorkflow');
const SchedulingCapacityModel = require('./SchedulingCapacity');
const LoanerFleetManagementModel = require('./LoanerFleetManagement');
const LoanerReservationModel = require('./LoanerReservation');
const AdvancedPartsManagementModel = require('./AdvancedPartsManagement');
const PurchaseOrderSystemModel = require('./PurchaseOrderSystem');

// Automated Parts Sourcing Enhancement Models
const PartsSourcingRequestModel = require('./PartsSourcingRequest');
const VendorPartQuoteModel = require('./VendorPartQuote');
const VendorApiConfigModel = require('./VendorApiConfig');
const VendorApiMetricsModel = require('./VendorApiMetrics');
const PartsInventoryTrackingModel = require('./PartsInventoryTracking');
const AutomatedPurchaseOrderModel = require('./AutomatedPurchaseOrder');

// Phase 2 Financial Integration Models
const PaymentModel = require('./Payment');
const ExpenseModel = require('./Expense');
const InvoiceEnhancedModel = require('./InvoiceEnhanced');
const QuickBooksConnectionModel = require('./QuickBooksConnection');
const QuickBooksSyncLogModel = require('./QuickBooksSyncLog');

// Digital Signature Model
const SignatureModel = require('./Signature');

// Time Clock Model
const TimeClockModel = require('./TimeClock');

const User = UserModel(sequelize);
const Job = JobModel(sequelize);
const Shop = ShopModel(sequelize);
const Customer = CustomerModel(sequelize);
const Vehicle = VehicleModel(sequelize);
const Part = PartModel(sequelize);
const Vendor = VendorModel(sequelize);

// New production models
const BmsImport = BmsImportModel(sequelize);
const Estimate = EstimateModel(sequelize);
const EstimateLineItem = EstimateLineItemModel(sequelize);
const PartsOrder = PartsOrderModel(sequelize);
const PartsOrderItem = PartsOrderItemModel(sequelize);
const LaborTimeEntry = LaborTimeEntryModel(sequelize);
const Attachment = AttachmentModel(sequelize);
const InsuranceCompany = InsuranceCompanyModel(sequelize);
const Invoice = InvoiceModel(sequelize);
const VehicleHistory = VehicleHistoryModel(sequelize);
const WorkflowStatus = WorkflowStatusModel(sequelize);

// IMEX-level enhancement models
const ProductionStage = ProductionStageModel(sequelize);
const JobStageHistory = JobStageHistoryModel(sequelize);
const TechnicianPerformance = TechnicianPerformanceModel(sequelize);
const CommunicationTemplate = CommunicationTemplateModel(sequelize);
const CommunicationLog = CommunicationLogModel(sequelize);
const FinancialTransaction = FinancialTransactionModel(sequelize);

// Phase 1 Comprehensive Collision Repair Models
const ContactTimeline = ContactTimelineModel(sequelize);
const VehicleProfile = VehicleProfileModel(sequelize);
const ClaimManagement = ClaimManagementModel(sequelize);
const RepairOrderManagement = RepairOrderManagementModel(sequelize);
const ProductionWorkflow = ProductionWorkflowModel(sequelize);
const SchedulingCapacity = SchedulingCapacityModel(sequelize);
const LoanerFleetManagement = LoanerFleetManagementModel(sequelize);
const LoanerReservation = LoanerReservationModel(sequelize);
const AdvancedPartsManagement = AdvancedPartsManagementModel(sequelize);
const PurchaseOrderSystem = PurchaseOrderSystemModel(sequelize);

// Automated Parts Sourcing Enhancement Models
const PartsSourcingRequest = PartsSourcingRequestModel(sequelize);
const VendorPartQuote = VendorPartQuoteModel(sequelize);
const VendorApiConfig = VendorApiConfigModel(sequelize);
const VendorApiMetrics = VendorApiMetricsModel(sequelize);
const PartsInventoryTracking = PartsInventoryTrackingModel(sequelize);
const AutomatedPurchaseOrder = AutomatedPurchaseOrderModel(sequelize);

// Phase 2 Financial Integration Models
const Payment = PaymentModel(sequelize);
const Expense = ExpenseModel(sequelize);
const InvoiceEnhanced = InvoiceEnhancedModel(sequelize);
const QuickBooksConnection = QuickBooksConnectionModel(sequelize);
const QuickBooksSyncLog = QuickBooksSyncLogModel(sequelize);

// Digital Signature Model
const Signature = SignatureModel(sequelize);

// Time Clock Model
const TimeClock = TimeClockModel(sequelize);

// Define associations

// Shop associations (central hub)
Shop.hasMany(User, { foreignKey: 'shopId', as: 'users' });
Shop.hasMany(Customer, { foreignKey: 'shopId', as: 'customers' });
Shop.hasMany(Vehicle, { foreignKey: 'shopId', as: 'vehicles' });
Shop.hasMany(Part, { foreignKey: 'shopId', as: 'parts' });
Shop.hasMany(Vendor, { foreignKey: 'shopId', as: 'vendors' });
Shop.hasMany(Job, { foreignKey: 'shopId', as: 'jobs' });
Shop.hasMany(BmsImport, { foreignKey: 'shopId', as: 'bmsImports' });
Shop.hasMany(Estimate, { foreignKey: 'shopId', as: 'estimates' });
// Shop.hasMany(PartsOrder, { foreignKey: 'shopId', as: 'partsOrders' });  // Commented for testing
Shop.hasMany(LaborTimeEntry, { foreignKey: 'shopId', as: 'laborTimeEntries' });
// Shop.hasMany(Attachment, { foreignKey: 'shopId', as: 'attachments' });  // Commented for testing
Shop.hasMany(InsuranceCompany, {
  foreignKey: 'shopId',
  as: 'insuranceCompanies',
});
Shop.hasMany(Invoice, { foreignKey: 'shopId', as: 'invoices' });
Shop.hasMany(VehicleHistory, { foreignKey: 'shopId', as: 'vehicleHistory' });
Shop.hasMany(WorkflowStatus, { foreignKey: 'shopId', as: 'workflowStatuses' });

// IMEX-level model associations
Shop.hasMany(ProductionStage, { foreignKey: 'shopId', as: 'productionStages' });
Shop.hasMany(JobStageHistory, { foreignKey: 'shopId', as: 'jobStageHistory' });
Shop.hasMany(TechnicianPerformance, {
  foreignKey: 'shopId',
  as: 'technicianPerformance',
});
Shop.hasMany(CommunicationTemplate, {
  foreignKey: 'shopId',
  as: 'communicationTemplates',
});
Shop.hasMany(CommunicationLog, {
  foreignKey: 'shopId',
  as: 'communicationLogs',
});
Shop.hasMany(FinancialTransaction, {
  foreignKey: 'shopId',
  as: 'financialTransactions',
});

// Phase 1 Comprehensive Collision Repair Associations
Shop.hasMany(ContactTimeline, { foreignKey: 'shopId', as: 'contactTimeline' });
Shop.hasMany(VehicleProfile, { foreignKey: 'shopId', as: 'vehicleProfiles' });
Shop.hasMany(ClaimManagement, { foreignKey: 'shopId', as: 'claimManagement' });
Shop.hasMany(RepairOrderManagement, {
  foreignKey: 'shopId',
  as: 'repairOrderManagement',
});
Shop.hasMany(ProductionWorkflow, {
  foreignKey: 'shopId',
  as: 'productionWorkflow',
});
Shop.hasMany(SchedulingCapacity, {
  foreignKey: 'shopId',
  as: 'schedulingCapacity',
});
Shop.hasMany(LoanerFleetManagement, {
  foreignKey: 'shopId',
  as: 'loanerFleet',
});
Shop.hasMany(LoanerReservation, {
  foreignKey: 'shopId',
  as: 'loanerReservations',
});
Shop.hasMany(AdvancedPartsManagement, {
  foreignKey: 'shopId',
  as: 'advancedPartsManagement',
});
Shop.hasMany(PurchaseOrderSystem, {
  foreignKey: 'shopId',
  as: 'purchaseOrders',
});

// Automated Parts Sourcing Enhancement Associations
Shop.hasMany(PartsSourcingRequest, {
  foreignKey: 'shopId',
  as: 'partsSourcingRequests',
});
Shop.hasMany(VendorPartQuote, {
  foreignKey: 'shopId',
  as: 'vendorPartQuotes',
});
Shop.hasMany(VendorApiConfig, {
  foreignKey: 'shopId',
  as: 'vendorApiConfigs',
});
Shop.hasMany(VendorApiMetrics, {
  foreignKey: 'shopId',
  as: 'vendorApiMetrics',
});
Shop.hasMany(PartsInventoryTracking, {
  foreignKey: 'shopId',
  as: 'partsInventoryTracking',
});
Shop.hasMany(AutomatedPurchaseOrder, {
  foreignKey: 'shopId',
  as: 'automatedPurchaseOrders',
});

// Phase 2 Financial Integration Associations
Shop.hasMany(Payment, { foreignKey: 'shopId', as: 'payments' });
Shop.hasMany(Expense, { foreignKey: 'shopId', as: 'expenses' });
Shop.hasMany(InvoiceEnhanced, { foreignKey: 'shopId', as: 'invoicesEnhanced' });
Shop.hasMany(QuickBooksConnection, { foreignKey: 'shopId', as: 'quickbooksConnections' });
Shop.hasMany(QuickBooksSyncLog, { foreignKey: 'shopId', as: 'quickbooksSyncLogs' });

// Digital Signature Associations
Shop.hasMany(Signature, { foreignKey: 'shopId', as: 'signatures' });

// Time Clock Associations
Shop.hasMany(TimeClock, { foreignKey: 'shopId', as: 'timeClocks' });

User.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Customer.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Vehicle.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Part.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Vendor.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Job.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
BmsImport.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Estimate.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
// PartsOrder.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });  // Commented for testing
LaborTimeEntry.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
// Attachment.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });  // Commented for testing
InsuranceCompany.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Invoice.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
VehicleHistory.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
WorkflowStatus.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// IMEX-level belongsTo associations
ProductionStage.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
JobStageHistory.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
TechnicianPerformance.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
CommunicationTemplate.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
CommunicationLog.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
FinancialTransaction.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// User self-reference for supervisor relationship
User.belongsTo(User, { foreignKey: 'supervisorId', as: 'supervisor' });
User.hasMany(User, { foreignKey: 'supervisorId', as: 'subordinates' });

// Customer associations
Customer.hasMany(Vehicle, { foreignKey: 'customerId', as: 'vehicles' });
Customer.hasMany(Job, { foreignKey: 'customerId', as: 'jobs' });
Customer.hasMany(Estimate, { foreignKey: 'customerId', as: 'estimates' });
Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
// Customer.hasMany(Attachment, { foreignKey: 'customerId', as: 'attachments' });  // Commented for testing

Vehicle.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Job.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
// Estimate.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });  // Commented for testing
// Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });  // Commented for testing
// Attachment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });  // Commented for testing

// Vehicle associations
Vehicle.hasMany(Job, { foreignKey: 'vehicleId', as: 'jobs' });
Vehicle.hasMany(Estimate, { foreignKey: 'vehicleId', as: 'estimates' });
Vehicle.hasMany(Invoice, { foreignKey: 'vehicleId', as: 'invoices' });
Vehicle.hasMany(VehicleHistory, { foreignKey: 'vehicleId', as: 'history' });
// Vehicle.hasMany(Attachment, { foreignKey: 'vehicleId', as: 'attachments' });  // Commented for testing

Job.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
// Estimate.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });  // Commented for testing
// Invoice.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });  // Commented for testing
VehicleHistory.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
// Attachment.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });  // Commented for testing

// Job associations (core workflow)
Job.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
// Job.hasMany(PartsOrder, { foreignKey: 'jobId', as: 'partsOrders' });  // Commented for testing
Job.hasMany(LaborTimeEntry, { foreignKey: 'jobId', as: 'laborTimeEntries' });
// Job.hasMany(Attachment, { foreignKey: 'jobId', as: 'attachments' });  // Commented for testing
Job.hasMany(Invoice, { foreignKey: 'jobId', as: 'invoices' });
Job.hasMany(VehicleHistory, { foreignKey: 'jobId', as: 'vehicleHistory' });
Job.hasMany(WorkflowStatus, { foreignKey: 'jobId', as: 'workflowStatuses' });
Job.hasOne(Estimate, { foreignKey: 'jobId', as: 'estimate' });

User.hasMany(Job, { foreignKey: 'assignedTo', as: 'assignedJobs' });
// PartsOrder.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });  // Commented for testing
LaborTimeEntry.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
// Attachment.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });  // Commented for testing
Invoice.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
VehicleHistory.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
WorkflowStatus.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Estimate.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

// Estimate associations
Estimate.hasMany(EstimateLineItem, {
  foreignKey: 'estimateId',
  as: 'lineItems',
});
Estimate.belongsTo(InsuranceCompany, {
  foreignKey: 'insuranceCompanyId',
  as: 'insuranceCompany',
});
Estimate.hasMany(BmsImport, { foreignKey: 'estimateId', as: 'bmsImports' });
Estimate.hasMany(Attachment, { foreignKey: 'estimateId', as: 'attachments' });
// Estimate.hasMany(PartsOrder, { foreignKey: 'estimateId', as: 'partsOrders' });  // Commented for testing

EstimateLineItem.belongsTo(Estimate, {
  foreignKey: 'estimateId',
  as: 'estimate',
});
EstimateLineItem.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
// EstimateLineItem.hasMany(PartsOrderItem, { foreignKey: 'estimateLineItemId', as: 'partsOrderItems' });  // Commented for testing
EstimateLineItem.hasMany(LaborTimeEntry, {
  foreignKey: 'estimateLineItemId',
  as: 'laborTimeEntries',
});

BmsImport.belongsTo(Estimate, { foreignKey: 'estimateId', as: 'estimate' });
BmsImport.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
BmsImport.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Attachment.belongsTo(Estimate, { foreignKey: 'estimateId', as: 'estimate' });
// PartsOrder.belongsTo(Estimate, { foreignKey: 'estimateId', as: 'estimate' });  // Commented for testing

// Parts order associations - COMMENTED OUT FOR TESTING
// PartsOrder.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
// PartsOrder.hasMany(PartsOrderItem, { foreignKey: 'partsOrderId', as: 'items' });
// PartsOrder.hasMany(Attachment, { foreignKey: 'partsOrderId', as: 'attachments' });
//
// PartsOrderItem.belongsTo(PartsOrder, { foreignKey: 'partsOrderId', as: 'partsOrder' });
// PartsOrderItem.belongsTo(Part, { foreignKey: 'partId', as: 'part' });
// PartsOrderItem.belongsTo(EstimateLineItem, { foreignKey: 'estimateLineItemId', as: 'estimateLineItem' });
//
// Vendor.hasMany(PartsOrder, { foreignKey: 'vendorId', as: 'partsOrders' });
// Part.hasMany(PartsOrderItem, { foreignKey: 'partId', as: 'partsOrderItems' });

// Labor time entry associations
LaborTimeEntry.belongsTo(User, {
  foreignKey: 'technicianId',
  as: 'technician',
});
LaborTimeEntry.belongsTo(EstimateLineItem, {
  foreignKey: 'estimateLineItemId',
  as: 'estimateLineItem',
});
LaborTimeEntry.belongsTo(LaborTimeEntry, {
  foreignKey: 'originalTimeEntryId',
  as: 'originalTimeEntry',
});
LaborTimeEntry.hasMany(LaborTimeEntry, {
  foreignKey: 'originalTimeEntryId',
  as: 'reworkEntries',
});

User.hasMany(LaborTimeEntry, {
  foreignKey: 'technicianId',
  as: 'laborTimeEntries',
});

// Part and vendor associations
Part.belongsTo(Vendor, { foreignKey: 'primaryVendorId', as: 'primaryVendor' });
Vendor.hasMany(Part, { foreignKey: 'primaryVendorId', as: 'parts' });
Vendor.hasMany(EstimateLineItem, {
  foreignKey: 'vendorId',
  as: 'estimateLineItems',
});

// Insurance company associations
InsuranceCompany.hasMany(Estimate, {
  foreignKey: 'insuranceCompanyId',
  as: 'estimates',
});
InsuranceCompany.hasMany(Invoice, {
  foreignKey: 'insuranceCompanyId',
  as: 'invoices',
});
InsuranceCompany.hasMany(VehicleHistory, {
  foreignKey: 'insuranceCompanyId',
  as: 'vehicleHistory',
});

Invoice.belongsTo(InsuranceCompany, {
  foreignKey: 'insuranceCompanyId',
  as: 'insuranceCompany',
});
VehicleHistory.belongsTo(InsuranceCompany, {
  foreignKey: 'insuranceCompanyId',
  as: 'insuranceCompany',
});

// Invoice associations
Invoice.belongsTo(Invoice, {
  foreignKey: 'originalInvoiceId',
  as: 'originalInvoice',
});
Invoice.hasMany(Invoice, { foreignKey: 'originalInvoiceId', as: 'revisions' });

// Vehicle history associations
VehicleHistory.belongsTo(User, {
  foreignKey: 'technicianId',
  as: 'technician',
});
VehicleHistory.belongsTo(VehicleHistory, {
  foreignKey: 'originalServiceId',
  as: 'originalService',
});
VehicleHistory.hasMany(VehicleHistory, {
  foreignKey: 'originalServiceId',
  as: 'returnVisits',
});

// Workflow status associations
WorkflowStatus.belongsTo(User, {
  foreignKey: 'technicianId',
  as: 'technician',
});
WorkflowStatus.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignor' });
WorkflowStatus.belongsTo(User, { foreignKey: 'inspectedBy', as: 'inspector' });
WorkflowStatus.belongsTo(WorkflowStatus, {
  foreignKey: 'originalWorkflowId',
  as: 'originalWorkflow',
});
WorkflowStatus.hasMany(WorkflowStatus, {
  foreignKey: 'originalWorkflowId',
  as: 'reworkWorkflows',
});

// User creation/update tracking
User.hasMany(BmsImport, { foreignKey: 'createdBy', as: 'createdBmsImports' });
User.hasMany(Estimate, { foreignKey: 'createdBy', as: 'createdEstimates' });
User.hasMany(Estimate, { foreignKey: 'updatedBy', as: 'updatedEstimates' });
User.hasMany(Estimate, { foreignKey: 'approvedBy', as: 'approvedEstimates' });
// User.hasMany(PartsOrder, { foreignKey: 'createdBy', as: 'createdPartsOrders' });  // Commented for testing
// User.hasMany(Attachment, { foreignKey: 'uploadedBy', as: 'uploadedAttachments' });  // Commented for testing
User.hasMany(Invoice, { foreignKey: 'createdBy', as: 'createdInvoices' });
User.hasMany(VehicleHistory, {
  foreignKey: 'technicianId',
  as: 'vehicleHistoryEntries',
});

// Additional IMEX-level associations
// Job associations with new models
Job.hasMany(JobStageHistory, { foreignKey: 'jobId', as: 'stageHistory' });
Job.hasMany(CommunicationLog, { foreignKey: 'jobId', as: 'communications' });
Job.hasMany(FinancialTransaction, { foreignKey: 'jobId', as: 'transactions' });

JobStageHistory.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobStageHistory.belongsTo(WorkflowStatus, {
  foreignKey: 'workflowStatusId',
  as: 'workflowStatus',
});
JobStageHistory.belongsTo(ProductionStage, {
  foreignKey: 'productionStageId',
  as: 'productionStage',
});
JobStageHistory.belongsTo(User, {
  foreignKey: 'technicianId',
  as: 'technician',
});

CommunicationLog.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
CommunicationLog.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});
CommunicationLog.belongsTo(CommunicationTemplate, {
  foreignKey: 'templateId',
  as: 'template',
});
CommunicationLog.belongsTo(WorkflowStatus, {
  foreignKey: 'workflowStatusId',
  as: 'workflowStatus',
});

FinancialTransaction.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
FinancialTransaction.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});
FinancialTransaction.belongsTo(Invoice, {
  foreignKey: 'invoiceId',
  as: 'invoice',
});
FinancialTransaction.belongsTo(Vendor, {
  foreignKey: 'vendorId',
  as: 'vendor',
});
FinancialTransaction.belongsTo(InsuranceCompany, {
  foreignKey: 'insuranceCompanyId',
  as: 'insuranceCompany',
});

TechnicianPerformance.belongsTo(User, {
  foreignKey: 'technicianId',
  as: 'technician',
});
User.hasMany(TechnicianPerformance, {
  foreignKey: 'technicianId',
  as: 'performanceRecords',
});

// =====================================================================
// PHASE 1 COMPREHENSIVE COLLISION REPAIR MODEL ASSOCIATIONS
// =====================================================================

// Phase 1 belongsTo Shop associations
ContactTimeline.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
VehicleProfile.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
ClaimManagement.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
RepairOrderManagement.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
ProductionWorkflow.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
SchedulingCapacity.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
LoanerFleetManagement.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
LoanerReservation.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
AdvancedPartsManagement.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
PurchaseOrderSystem.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// Contact Timeline Associations
ContactTimeline.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});
ContactTimeline.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
ContactTimeline.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ContactTimeline.belongsTo(CommunicationTemplate, {
  foreignKey: 'templateId',
  as: 'template',
});

Customer.hasMany(ContactTimeline, {
  foreignKey: 'customerId',
  as: 'contactTimeline',
});
Job.hasMany(ContactTimeline, { foreignKey: 'jobId', as: 'contactTimeline' });
User.hasMany(ContactTimeline, { foreignKey: 'userId', as: 'contactTimeline' });
CommunicationTemplate.hasMany(ContactTimeline, {
  foreignKey: 'templateId',
  as: 'contactTimeline',
});

// Vehicle Profile Associations
VehicleProfile.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});
VehicleProfile.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
VehicleProfile.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

Customer.hasMany(VehicleProfile, {
  foreignKey: 'customerId',
  as: 'vehicleProfiles',
});
User.hasMany(VehicleProfile, {
  foreignKey: 'createdBy',
  as: 'createdVehicleProfiles',
});
User.hasMany(VehicleProfile, {
  foreignKey: 'updatedBy',
  as: 'updatedVehicleProfiles',
});

// Claim Management Associations
ClaimManagement.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});
ClaimManagement.belongsTo(VehicleProfile, {
  foreignKey: 'vehicleProfileId',
  as: 'vehicleProfile',
});
ClaimManagement.belongsTo(InsuranceCompany, {
  foreignKey: 'insuranceCompanyId',
  as: 'insuranceCompany',
});
ClaimManagement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
ClaimManagement.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
ClaimManagement.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

Customer.hasMany(ClaimManagement, {
  foreignKey: 'customerId',
  as: 'claimManagement',
});
VehicleProfile.hasMany(ClaimManagement, {
  foreignKey: 'vehicleProfileId',
  as: 'claimManagement',
});
InsuranceCompany.hasMany(ClaimManagement, {
  foreignKey: 'insuranceCompanyId',
  as: 'claimManagement',
});
User.hasMany(ClaimManagement, {
  foreignKey: 'createdBy',
  as: 'createdClaimManagement',
});
User.hasMany(ClaimManagement, {
  foreignKey: 'updatedBy',
  as: 'updatedClaimManagement',
});
User.hasMany(ClaimManagement, {
  foreignKey: 'reviewedBy',
  as: 'reviewedClaimManagement',
});

// Repair Order Management Associations
RepairOrderManagement.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});
RepairOrderManagement.belongsTo(VehicleProfile, {
  foreignKey: 'vehicleProfileId',
  as: 'vehicleProfile',
});
RepairOrderManagement.belongsTo(ClaimManagement, {
  foreignKey: 'claimManagementId',
  as: 'claimManagement',
});
RepairOrderManagement.belongsTo(Estimate, {
  foreignKey: 'estimateId',
  as: 'estimate',
});
RepairOrderManagement.belongsTo(User, {
  foreignKey: 'primaryTechnician',
  as: 'primaryTechnicianUser',
});
RepairOrderManagement.belongsTo(User, {
  foreignKey: 'assignedEstimator',
  as: 'estimatorUser',
});
RepairOrderManagement.belongsTo(User, {
  foreignKey: 'assignedSalesRep',
  as: 'salesRepUser',
});
RepairOrderManagement.belongsTo(User, {
  foreignKey: 'qcInspector',
  as: 'qcInspectorUser',
});
RepairOrderManagement.belongsTo(User, {
  foreignKey: 'statusChangedBy',
  as: 'statusChanger',
});
RepairOrderManagement.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});
RepairOrderManagement.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater',
});

Customer.hasMany(RepairOrderManagement, {
  foreignKey: 'customerId',
  as: 'repairOrderManagement',
});
VehicleProfile.hasMany(RepairOrderManagement, {
  foreignKey: 'vehicleProfileId',
  as: 'repairOrderManagement',
});
ClaimManagement.hasMany(RepairOrderManagement, {
  foreignKey: 'claimManagementId',
  as: 'repairOrderManagement',
});
Estimate.hasMany(RepairOrderManagement, {
  foreignKey: 'estimateId',
  as: 'repairOrderManagement',
});
User.hasMany(RepairOrderManagement, {
  foreignKey: 'primaryTechnician',
  as: 'primaryTechnicianRepairOrders',
});
User.hasMany(RepairOrderManagement, {
  foreignKey: 'assignedEstimator',
  as: 'estimatorRepairOrders',
});
User.hasMany(RepairOrderManagement, {
  foreignKey: 'assignedSalesRep',
  as: 'salesRepRepairOrders',
});
User.hasMany(RepairOrderManagement, {
  foreignKey: 'qcInspector',
  as: 'qcInspectorRepairOrders',
});

// Production Workflow Associations
ProductionWorkflow.belongsTo(RepairOrderManagement, {
  foreignKey: 'repairOrderId',
  as: 'repairOrder',
});
ProductionWorkflow.belongsTo(ProductionStage, {
  foreignKey: 'productionStageId',
  as: 'productionStage',
});
ProductionWorkflow.belongsTo(User, {
  foreignKey: 'assignedTechnician',
  as: 'assignedTechnicianUser',
});
ProductionWorkflow.belongsTo(User, {
  foreignKey: 'backupTechnician',
  as: 'backupTechnicianUser',
});
ProductionWorkflow.belongsTo(User, {
  foreignKey: 'qcInspector',
  as: 'qcInspectorUser',
});
ProductionWorkflow.belongsTo(User, {
  foreignKey: 'completedBy',
  as: 'completedByUser',
});
ProductionWorkflow.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
ProductionWorkflow.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
ProductionWorkflow.belongsTo(ProductionWorkflow, {
  foreignKey: 'originalWorkOrderId',
  as: 'originalWorkOrder',
});

RepairOrderManagement.hasMany(ProductionWorkflow, {
  foreignKey: 'repairOrderId',
  as: 'productionWorkflow',
});
ProductionStage.hasMany(ProductionWorkflow, {
  foreignKey: 'productionStageId',
  as: 'productionWorkflow',
});
User.hasMany(ProductionWorkflow, {
  foreignKey: 'assignedTechnician',
  as: 'assignedProductionWorkflow',
});
User.hasMany(ProductionWorkflow, {
  foreignKey: 'backupTechnician',
  as: 'backupProductionWorkflow',
});
User.hasMany(ProductionWorkflow, {
  foreignKey: 'qcInspector',
  as: 'qcInspectorProductionWorkflow',
});
User.hasMany(ProductionWorkflow, {
  foreignKey: 'completedBy',
  as: 'completedProductionWorkflow',
});
ProductionWorkflow.hasMany(ProductionWorkflow, {
  foreignKey: 'originalWorkOrderId',
  as: 'reworkWorkflow',
});

// Scheduling Capacity Associations
SchedulingCapacity.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
SchedulingCapacity.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(SchedulingCapacity, {
  foreignKey: 'createdBy',
  as: 'createdSchedulingCapacity',
});
User.hasMany(SchedulingCapacity, {
  foreignKey: 'updatedBy',
  as: 'updatedSchedulingCapacity',
});

// Loaner Fleet Management Associations
LoanerFleetManagement.belongsTo(Customer, {
  foreignKey: 'currentRenterId',
  as: 'currentRenter',
});
LoanerFleetManagement.belongsTo(User, {
  foreignKey: 'damageReportedBy',
  as: 'damageReporter',
});
LoanerFleetManagement.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});
LoanerFleetManagement.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater',
});

Customer.hasMany(LoanerFleetManagement, {
  foreignKey: 'currentRenterId',
  as: 'currentLoanerVehicles',
});
User.hasMany(LoanerFleetManagement, {
  foreignKey: 'damageReportedBy',
  as: 'reportedDamageLoaners',
});
User.hasMany(LoanerFleetManagement, {
  foreignKey: 'createdBy',
  as: 'createdLoanerFleet',
});
User.hasMany(LoanerFleetManagement, {
  foreignKey: 'updatedBy',
  as: 'updatedLoanerFleet',
});

// Loaner Reservation Associations
LoanerReservation.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});
LoanerReservation.belongsTo(RepairOrderManagement, {
  foreignKey: 'repairOrderId',
  as: 'repairOrder',
});
LoanerReservation.belongsTo(LoanerFleetManagement, {
  foreignKey: 'loanerVehicleId',
  as: 'loanerVehicle',
});
LoanerReservation.belongsTo(ClaimManagement, {
  foreignKey: 'claimManagementId',
  as: 'claimManagement',
});
LoanerReservation.belongsTo(User, {
  foreignKey: 'statusChangedBy',
  as: 'statusChanger',
});
LoanerReservation.belongsTo(User, {
  foreignKey: 'pickupInspectedBy',
  as: 'pickupInspector',
});
LoanerReservation.belongsTo(User, {
  foreignKey: 'returnInspectedBy',
  as: 'returnInspector',
});
LoanerReservation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
LoanerReservation.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

Customer.hasMany(LoanerReservation, {
  foreignKey: 'customerId',
  as: 'loanerReservations',
});
RepairOrderManagement.hasMany(LoanerReservation, {
  foreignKey: 'repairOrderId',
  as: 'loanerReservations',
});
LoanerFleetManagement.hasMany(LoanerReservation, {
  foreignKey: 'loanerVehicleId',
  as: 'reservations',
});
ClaimManagement.hasMany(LoanerReservation, {
  foreignKey: 'claimManagementId',
  as: 'loanerReservations',
});
User.hasMany(LoanerReservation, {
  foreignKey: 'pickupInspectedBy',
  as: 'pickupInspectedReservations',
});
User.hasMany(LoanerReservation, {
  foreignKey: 'returnInspectedBy',
  as: 'returnInspectedReservations',
});

// Advanced Parts Management Associations
AdvancedPartsManagement.belongsTo(RepairOrderManagement, {
  foreignKey: 'repairOrderId',
  as: 'repairOrder',
});
AdvancedPartsManagement.belongsTo(EstimateLineItem, {
  foreignKey: 'estimateLineItemId',
  as: 'estimateLineItem',
});
AdvancedPartsManagement.belongsTo(PartsOrder, {
  foreignKey: 'partsOrderId',
  as: 'partsOrder',
});
AdvancedPartsManagement.belongsTo(Vendor, {
  foreignKey: 'vendorId',
  as: 'vendor',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'statusChangedBy',
  as: 'statusChanger',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'sourcedBy',
  as: 'sourcer',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'orderedBy',
  as: 'orderer',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'receivedBy',
  as: 'receiver',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'inspectedBy',
  as: 'inspector',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'installedBy',
  as: 'installer',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'returnedBy',
  as: 'returner',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
});
AdvancedPartsManagement.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater',
});

RepairOrderManagement.hasMany(AdvancedPartsManagement, {
  foreignKey: 'repairOrderId',
  as: 'advancedPartsManagement',
});
EstimateLineItem.hasMany(AdvancedPartsManagement, {
  foreignKey: 'estimateLineItemId',
  as: 'advancedPartsManagement',
});
PartsOrder.hasMany(AdvancedPartsManagement, {
  foreignKey: 'partsOrderId',
  as: 'advancedPartsManagement',
});
Vendor.hasMany(AdvancedPartsManagement, {
  foreignKey: 'vendorId',
  as: 'advancedPartsManagement',
});
User.hasMany(AdvancedPartsManagement, {
  foreignKey: 'sourcedBy',
  as: 'sourcedAdvancedParts',
});
User.hasMany(AdvancedPartsManagement, {
  foreignKey: 'orderedBy',
  as: 'orderedAdvancedParts',
});
User.hasMany(AdvancedPartsManagement, {
  foreignKey: 'receivedBy',
  as: 'receivedAdvancedParts',
});
User.hasMany(AdvancedPartsManagement, {
  foreignKey: 'inspectedBy',
  as: 'inspectedAdvancedParts',
});
User.hasMany(AdvancedPartsManagement, {
  foreignKey: 'installedBy',
  as: 'installedAdvancedParts',
});

// Purchase Order System Associations
PurchaseOrderSystem.belongsTo(RepairOrderManagement, {
  foreignKey: 'repairOrderId',
  as: 'repairOrder',
});
PurchaseOrderSystem.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
PurchaseOrderSystem.belongsTo(User, {
  foreignKey: 'statusChangedBy',
  as: 'statusChanger',
});
PurchaseOrderSystem.belongsTo(User, {
  foreignKey: 'approvedBy',
  as: 'approver',
});
PurchaseOrderSystem.belongsTo(User, {
  foreignKey: 'rejectedBy',
  as: 'rejecter',
});
PurchaseOrderSystem.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });
PurchaseOrderSystem.belongsTo(User, {
  foreignKey: 'inspectedBy',
  as: 'inspector',
});
PurchaseOrderSystem.belongsTo(User, {
  foreignKey: 'requestedBy',
  as: 'requester',
});
PurchaseOrderSystem.belongsTo(User, {
  foreignKey: 'authorizedBy',
  as: 'authorizer',
});
PurchaseOrderSystem.belongsTo(User, {
  foreignKey: 'buyerAssigned',
  as: 'buyer',
});
PurchaseOrderSystem.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
PurchaseOrderSystem.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
PurchaseOrderSystem.belongsTo(PurchaseOrderSystem, {
  foreignKey: 'parentOrderId',
  as: 'parentOrder',
});

RepairOrderManagement.hasMany(PurchaseOrderSystem, {
  foreignKey: 'repairOrderId',
  as: 'purchaseOrders',
});
Vendor.hasMany(PurchaseOrderSystem, {
  foreignKey: 'vendorId',
  as: 'purchaseOrders',
});
User.hasMany(PurchaseOrderSystem, {
  foreignKey: 'approvedBy',
  as: 'approvedPurchaseOrders',
});
User.hasMany(PurchaseOrderSystem, {
  foreignKey: 'sentBy',
  as: 'sentPurchaseOrders',
});
User.hasMany(PurchaseOrderSystem, {
  foreignKey: 'inspectedBy',
  as: 'inspectedPurchaseOrders',
});
User.hasMany(PurchaseOrderSystem, {
  foreignKey: 'requestedBy',
  as: 'requestedPurchaseOrders',
});
User.hasMany(PurchaseOrderSystem, {
  foreignKey: 'buyerAssigned',
  as: 'assignedPurchaseOrders',
});
PurchaseOrderSystem.hasMany(PurchaseOrderSystem, {
  foreignKey: 'parentOrderId',
  as: 'childOrders',
});

// =====================================================================
// AUTOMATED PARTS SOURCING ENHANCEMENT ASSOCIATIONS
// =====================================================================

// Parts Sourcing Request Associations
PartsSourcingRequest.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
PartsSourcingRequest.belongsTo(RepairOrderManagement, { foreignKey: 'repairOrderId', as: 'repairOrder' });
PartsSourcingRequest.belongsTo(EstimateLineItem, { foreignKey: 'estimateLineItemId', as: 'estimateLineItem' });
PartsSourcingRequest.belongsTo(ClaimManagement, { foreignKey: 'claimManagementId', as: 'claimManagement' });
PartsSourcingRequest.belongsTo(Vendor, { foreignKey: 'selectedVendorId', as: 'selectedVendor' });
PartsSourcingRequest.belongsTo(VendorPartQuote, { foreignKey: 'selectedQuoteId', as: 'selectedQuote' });
PartsSourcingRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });
PartsSourcingRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
PartsSourcingRequest.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
PartsSourcingRequest.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
PartsSourcingRequest.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// Vendor Part Quote Associations
VendorPartQuote.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
VendorPartQuote.belongsTo(PartsSourcingRequest, { foreignKey: 'sourcingRequestId', as: 'sourcingRequest' });
VendorPartQuote.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
VendorPartQuote.belongsTo(User, { foreignKey: 'receivedBy', as: 'receiver' });
VendorPartQuote.belongsTo(User, { foreignKey: 'analyzedBy', as: 'analyzer' });
VendorPartQuote.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Vendor API Config Associations
VendorApiConfig.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
VendorApiConfig.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
VendorApiConfig.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
VendorApiConfig.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
VendorApiConfig.belongsTo(User, { foreignKey: 'lastTestedBy', as: 'lastTester' });

// Vendor API Metrics Associations
VendorApiMetrics.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
VendorApiMetrics.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
VendorApiMetrics.belongsTo(VendorApiConfig, { foreignKey: 'apiConfigId', as: 'apiConfig' });
VendorApiMetrics.belongsTo(PartsSourcingRequest, { foreignKey: 'sourcingRequestId', as: 'sourcingRequest' });

// Parts Inventory Tracking Associations
PartsInventoryTracking.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
PartsInventoryTracking.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
PartsInventoryTracking.belongsTo(Part, { foreignKey: 'partId', as: 'part' });
PartsInventoryTracking.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
PartsInventoryTracking.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

// Automated Purchase Order Associations
AutomatedPurchaseOrder.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
AutomatedPurchaseOrder.belongsTo(PartsSourcingRequest, { foreignKey: 'sourcingRequestId', as: 'sourcingRequest' });
AutomatedPurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
AutomatedPurchaseOrder.belongsTo(VendorPartQuote, { foreignKey: 'selectedQuoteId', as: 'selectedQuote' });
AutomatedPurchaseOrder.belongsTo(RepairOrderManagement, { foreignKey: 'repairOrderId', as: 'repairOrder' });
AutomatedPurchaseOrder.belongsTo(ClaimManagement, { foreignKey: 'claimManagementId', as: 'claimManagement' });
AutomatedPurchaseOrder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
AutomatedPurchaseOrder.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });
AutomatedPurchaseOrder.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
AutomatedPurchaseOrder.belongsTo(User, { foreignKey: 'sentBy', as: 'sender' });
AutomatedPurchaseOrder.belongsTo(User, { foreignKey: 'cancelledBy', as: 'canceller' });

// Reverse Associations for new models
RepairOrderManagement.hasMany(PartsSourcingRequest, { foreignKey: 'repairOrderId', as: 'partsSourcingRequests' });
EstimateLineItem.hasMany(PartsSourcingRequest, { foreignKey: 'estimateLineItemId', as: 'partsSourcingRequests' });
ClaimManagement.hasMany(PartsSourcingRequest, { foreignKey: 'claimManagementId', as: 'partsSourcingRequests' });

PartsSourcingRequest.hasMany(VendorPartQuote, { foreignKey: 'sourcingRequestId', as: 'vendorQuotes' });
PartsSourcingRequest.hasMany(AutomatedPurchaseOrder, { foreignKey: 'sourcingRequestId', as: 'automatedPurchaseOrders' });

Vendor.hasMany(PartsSourcingRequest, { foreignKey: 'selectedVendorId', as: 'selectedPartsSourcingRequests' });
Vendor.hasMany(VendorPartQuote, { foreignKey: 'vendorId', as: 'partQuotes' });
Vendor.hasMany(VendorApiConfig, { foreignKey: 'vendorId', as: 'apiConfigs' });
Vendor.hasMany(VendorApiMetrics, { foreignKey: 'vendorId', as: 'apiMetrics' });
Vendor.hasMany(PartsInventoryTracking, { foreignKey: 'vendorId', as: 'inventoryTracking' });
Vendor.hasMany(AutomatedPurchaseOrder, { foreignKey: 'vendorId', as: 'automatedPurchaseOrders' });

VendorApiConfig.hasMany(VendorApiMetrics, { foreignKey: 'apiConfigId', as: 'metrics' });

User.hasMany(PartsSourcingRequest, { foreignKey: 'requestedBy', as: 'requestedPartsSourcing' });
User.hasMany(PartsSourcingRequest, { foreignKey: 'approvedBy', as: 'approvedPartsSourcing' });
User.hasMany(PartsSourcingRequest, { foreignKey: 'reviewedBy', as: 'reviewedPartsSourcing' });
User.hasMany(VendorPartQuote, { foreignKey: 'receivedBy', as: 'receivedVendorQuotes' });
User.hasMany(VendorPartQuote, { foreignKey: 'analyzedBy', as: 'analyzedVendorQuotes' });
User.hasMany(VendorApiConfig, { foreignKey: 'createdBy', as: 'createdVendorApiConfigs' });
User.hasMany(VendorApiConfig, { foreignKey: 'lastTestedBy', as: 'testedVendorApiConfigs' });
User.hasMany(PartsInventoryTracking, { foreignKey: 'createdBy', as: 'createdInventoryTracking' });
User.hasMany(AutomatedPurchaseOrder, { foreignKey: 'createdBy', as: 'createdAutomatedPOs' });
User.hasMany(AutomatedPurchaseOrder, { foreignKey: 'approvedBy', as: 'approvedAutomatedPOs' });
User.hasMany(AutomatedPurchaseOrder, { foreignKey: 'sentBy', as: 'sentAutomatedPOs' });

// =====================================================================
// PHASE 2 FINANCIAL INTEGRATION ASSOCIATIONS
// =====================================================================

// Payment Associations
Payment.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Payment.belongsTo(RepairOrderManagement, { foreignKey: 'repairOrderId', as: 'repairOrder' });
Payment.belongsTo(InvoiceEnhanced, { foreignKey: 'invoiceId', as: 'invoice' });
Payment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

RepairOrderManagement.hasMany(Payment, { foreignKey: 'repairOrderId', as: 'payments' });
InvoiceEnhanced.hasMany(Payment, { foreignKey: 'invoiceId', as: 'payments' });
User.hasMany(Payment, { foreignKey: 'createdBy', as: 'createdPayments' });

// Expense Associations
Expense.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Expense.belongsTo(RepairOrderManagement, { foreignKey: 'repairOrderId', as: 'repairOrder' });
Expense.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Expense.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Expense.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

RepairOrderManagement.hasMany(Expense, { foreignKey: 'repairOrderId', as: 'expenses' });
Vendor.hasMany(Expense, { foreignKey: 'vendorId', as: 'expenses' });
User.hasMany(Expense, { foreignKey: 'createdBy', as: 'createdExpenses' });
User.hasMany(Expense, { foreignKey: 'approvedBy', as: 'approvedExpenses' });

// Invoice Enhanced Associations
InvoiceEnhanced.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
InvoiceEnhanced.belongsTo(RepairOrderManagement, { foreignKey: 'repairOrderId', as: 'repairOrder' });
InvoiceEnhanced.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
InvoiceEnhanced.belongsTo(InsuranceCompany, { foreignKey: 'insuranceCompanyId', as: 'insuranceCompany' });
InvoiceEnhanced.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

RepairOrderManagement.hasMany(InvoiceEnhanced, { foreignKey: 'repairOrderId', as: 'invoicesEnhanced' });
Customer.hasMany(InvoiceEnhanced, { foreignKey: 'customerId', as: 'invoicesEnhanced' });
InsuranceCompany.hasMany(InvoiceEnhanced, { foreignKey: 'insuranceCompanyId', as: 'invoicesEnhanced' });
User.hasMany(InvoiceEnhanced, { foreignKey: 'createdBy', as: 'createdInvoicesEnhanced' });

// QuickBooks Associations
QuickBooksConnection.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
QuickBooksSyncLog.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });

// Digital Signature Associations
Signature.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
Signature.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Signature.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Signature.belongsTo(RepairOrderManagement, { foreignKey: 'repairOrderId', as: 'repairOrder' });

User.hasMany(Signature, { foreignKey: 'userId', as: 'signatures' });
Customer.hasMany(Signature, { foreignKey: 'customerId', as: 'signatures' });
RepairOrderManagement.hasMany(Signature, { foreignKey: 'repairOrderId', as: 'signatures' });

// Time Clock Associations
TimeClock.belongsTo(Shop, { foreignKey: 'shopId', as: 'shop' });
TimeClock.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
TimeClock.belongsTo(Job, { foreignKey: 'roId', as: 'ro' });
TimeClock.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
TimeClock.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
TimeClock.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(TimeClock, { foreignKey: 'technicianId', as: 'timeClocks' });
User.hasMany(TimeClock, { foreignKey: 'approvedBy', as: 'approvedTimeClocks' });
Job.hasMany(TimeClock, { foreignKey: 'roId', as: 'timeClocks' });

module.exports = {
  sequelize,
  User,
  Job,
  Shop,
  Customer,
  Vehicle,
  Part,
  Vendor,
  BmsImport,
  Estimate,
  EstimateLineItem,
  PartsOrder,
  PartsOrderItem,
  LaborTimeEntry,
  Attachment,
  InsuranceCompany,
  Invoice,
  VehicleHistory,
  WorkflowStatus,
  // IMEX-level enhancement models
  ProductionStage,
  JobStageHistory,
  TechnicianPerformance,
  CommunicationTemplate,
  CommunicationLog,
  FinancialTransaction,
  // Phase 1 Comprehensive Collision Repair Models
  ContactTimeline,
  VehicleProfile,
  ClaimManagement,
  RepairOrderManagement,
  ProductionWorkflow,
  SchedulingCapacity,
  LoanerFleetManagement,
  LoanerReservation,
  AdvancedPartsManagement,
  PurchaseOrderSystem,
  // Automated Parts Sourcing Enhancement Models
  PartsSourcingRequest,
  VendorPartQuote,
  VendorApiConfig,
  VendorApiMetrics,
  PartsInventoryTracking,
  AutomatedPurchaseOrder,
  // Phase 2 Financial Integration Models
  Payment,
  Expense,
  InvoiceEnhanced,
  QuickBooksConnection,
  QuickBooksSyncLog,
  // Digital Signature Model
  Signature,
  // Time Clock Model
  TimeClock,
};
