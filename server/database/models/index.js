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
Shop.hasMany(InsuranceCompany, { foreignKey: 'shopId', as: 'insuranceCompanies' });
Shop.hasMany(Invoice, { foreignKey: 'shopId', as: 'invoices' });
Shop.hasMany(VehicleHistory, { foreignKey: 'shopId', as: 'vehicleHistory' });
Shop.hasMany(WorkflowStatus, { foreignKey: 'shopId', as: 'workflowStatuses' });

// IMEX-level model associations
Shop.hasMany(ProductionStage, { foreignKey: 'shopId', as: 'productionStages' });
Shop.hasMany(JobStageHistory, { foreignKey: 'shopId', as: 'jobStageHistory' });
Shop.hasMany(TechnicianPerformance, { foreignKey: 'shopId', as: 'technicianPerformance' });
Shop.hasMany(CommunicationTemplate, { foreignKey: 'shopId', as: 'communicationTemplates' });
Shop.hasMany(CommunicationLog, { foreignKey: 'shopId', as: 'communicationLogs' });
Shop.hasMany(FinancialTransaction, { foreignKey: 'shopId', as: 'financialTransactions' });

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
Estimate.hasMany(EstimateLineItem, { foreignKey: 'estimateId', as: 'lineItems' });
Estimate.belongsTo(InsuranceCompany, { foreignKey: 'insuranceCompanyId', as: 'insuranceCompany' });
Estimate.hasMany(BmsImport, { foreignKey: 'estimateId', as: 'bmsImports' });
Estimate.hasMany(Attachment, { foreignKey: 'estimateId', as: 'attachments' });
// Estimate.hasMany(PartsOrder, { foreignKey: 'estimateId', as: 'partsOrders' });  // Commented for testing

EstimateLineItem.belongsTo(Estimate, { foreignKey: 'estimateId', as: 'estimate' });
EstimateLineItem.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
// EstimateLineItem.hasMany(PartsOrderItem, { foreignKey: 'estimateLineItemId', as: 'partsOrderItems' });  // Commented for testing
EstimateLineItem.hasMany(LaborTimeEntry, { foreignKey: 'estimateLineItemId', as: 'laborTimeEntries' });

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
LaborTimeEntry.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
LaborTimeEntry.belongsTo(EstimateLineItem, { foreignKey: 'estimateLineItemId', as: 'estimateLineItem' });
LaborTimeEntry.belongsTo(LaborTimeEntry, { foreignKey: 'originalTimeEntryId', as: 'originalTimeEntry' });
LaborTimeEntry.hasMany(LaborTimeEntry, { foreignKey: 'originalTimeEntryId', as: 'reworkEntries' });

User.hasMany(LaborTimeEntry, { foreignKey: 'technicianId', as: 'laborTimeEntries' });

// Part and vendor associations
Part.belongsTo(Vendor, { foreignKey: 'primaryVendorId', as: 'primaryVendor' });
Vendor.hasMany(Part, { foreignKey: 'primaryVendorId', as: 'parts' });
Vendor.hasMany(EstimateLineItem, { foreignKey: 'vendorId', as: 'estimateLineItems' });

// Insurance company associations
InsuranceCompany.hasMany(Estimate, { foreignKey: 'insuranceCompanyId', as: 'estimates' });
InsuranceCompany.hasMany(Invoice, { foreignKey: 'insuranceCompanyId', as: 'invoices' });
InsuranceCompany.hasMany(VehicleHistory, { foreignKey: 'insuranceCompanyId', as: 'vehicleHistory' });

Invoice.belongsTo(InsuranceCompany, { foreignKey: 'insuranceCompanyId', as: 'insuranceCompany' });
VehicleHistory.belongsTo(InsuranceCompany, { foreignKey: 'insuranceCompanyId', as: 'insuranceCompany' });

// Invoice associations
Invoice.belongsTo(Invoice, { foreignKey: 'originalInvoiceId', as: 'originalInvoice' });
Invoice.hasMany(Invoice, { foreignKey: 'originalInvoiceId', as: 'revisions' });

// Vehicle history associations
VehicleHistory.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
VehicleHistory.belongsTo(VehicleHistory, { foreignKey: 'originalServiceId', as: 'originalService' });
VehicleHistory.hasMany(VehicleHistory, { foreignKey: 'originalServiceId', as: 'returnVisits' });

// Workflow status associations
WorkflowStatus.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
WorkflowStatus.belongsTo(User, { foreignKey: 'assignedBy', as: 'assignor' });
WorkflowStatus.belongsTo(User, { foreignKey: 'inspectedBy', as: 'inspector' });
WorkflowStatus.belongsTo(WorkflowStatus, { foreignKey: 'originalWorkflowId', as: 'originalWorkflow' });
WorkflowStatus.hasMany(WorkflowStatus, { foreignKey: 'originalWorkflowId', as: 'reworkWorkflows' });

// User creation/update tracking
User.hasMany(BmsImport, { foreignKey: 'createdBy', as: 'createdBmsImports' });
User.hasMany(Estimate, { foreignKey: 'createdBy', as: 'createdEstimates' });
User.hasMany(Estimate, { foreignKey: 'updatedBy', as: 'updatedEstimates' });
User.hasMany(Estimate, { foreignKey: 'approvedBy', as: 'approvedEstimates' });
// User.hasMany(PartsOrder, { foreignKey: 'createdBy', as: 'createdPartsOrders' });  // Commented for testing
// User.hasMany(Attachment, { foreignKey: 'uploadedBy', as: 'uploadedAttachments' });  // Commented for testing
User.hasMany(Invoice, { foreignKey: 'createdBy', as: 'createdInvoices' });
User.hasMany(VehicleHistory, { foreignKey: 'technicianId', as: 'vehicleHistoryEntries' });

// Additional IMEX-level associations
// Job associations with new models
Job.hasMany(JobStageHistory, { foreignKey: 'jobId', as: 'stageHistory' });
Job.hasMany(CommunicationLog, { foreignKey: 'jobId', as: 'communications' });
Job.hasMany(FinancialTransaction, { foreignKey: 'jobId', as: 'transactions' });

JobStageHistory.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
JobStageHistory.belongsTo(WorkflowStatus, { foreignKey: 'workflowStatusId', as: 'workflowStatus' });
JobStageHistory.belongsTo(ProductionStage, { foreignKey: 'productionStageId', as: 'productionStage' });
JobStageHistory.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

CommunicationLog.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
CommunicationLog.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
CommunicationLog.belongsTo(CommunicationTemplate, { foreignKey: 'templateId', as: 'template' });
CommunicationLog.belongsTo(WorkflowStatus, { foreignKey: 'workflowStatusId', as: 'workflowStatus' });

FinancialTransaction.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
FinancialTransaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
FinancialTransaction.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });
FinancialTransaction.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
FinancialTransaction.belongsTo(InsuranceCompany, { foreignKey: 'insuranceCompanyId', as: 'insuranceCompany' });

TechnicianPerformance.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
User.hasMany(TechnicianPerformance, { foreignKey: 'technicianId', as: 'performanceRecords' });

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
  FinancialTransaction
};


