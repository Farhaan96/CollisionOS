
// QuickBooks Integration for CollisionOS
const QuickBooks = require('node-quickbooks');

class QuickBooksService {
  constructor() {
    // TODO: Replace with local database connection
  }

  /**
   * Initialize QuickBooks connection
   */
  async initializeConnection(shopId) {
    try {
      // Get shop's QuickBooks credentials
      const { data: credentials } = await this.supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .single();

      if (!credentials) {
        return { success: false, error: 'QuickBooks not connected' };
      }

      const qb = new QuickBooks(
        credentials.consumer_key,
        credentials.consumer_secret,
        credentials.access_token,
        credentials.access_token_secret,
        credentials.realm_id,
        true, // use sandbox
        true, // enable debug
        null, // minor version
        '2.0', // oauth version
        credentials.refresh_token
      );

      return { success: true, qb };
    } catch (error) {
      console.error('QuickBooks initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync invoice to QuickBooks
   */
  async syncInvoice(repairOrderId) {
    try {
      const { qb } = await this.initializeConnection(repairOrderId);
      if (!qb) {
        return { success: false, error: 'QuickBooks not connected' };
      }

      // Get repair order data
      const { data: repairOrder } = await this.supabase
        .from('repair_orders')
        .select(`
          *,
          customers!inner(*),
          vehicles!inner(*),
          parts(*)
        `)
        .eq('id', repairOrderId)
        .single();

      if (!repairOrder) {
        return { success: false, error: 'Repair order not found' };
      }

      // Create QuickBooks invoice
      const invoice = {
        Line: repairOrder.parts.map(part => ({
          DetailType: 'SalesItemLineDetail',
          Amount: part.unit_cost * part.quantity_needed,
          SalesItemLineDetail: {
            ItemRef: {
              value: part.part_number,
              name: part.description
            },
            Qty: part.quantity_needed,
            UnitPrice: part.unit_cost
          }
        })),
        CustomerRef: {
          value: repairOrder.customers.quickbooks_customer_id
        },
        DocNumber: repairOrder.ro_number,
        TxnDate: repairOrder.created_at
      };

      const result = await new Promise((resolve, reject) => {
        qb.createInvoice(invoice, (err, invoice) => {
          if (err) reject(err);
          else resolve(invoice);
        });
      });

      // Store sync record
      await this.supabase
        .from('quickbooks_sync_logs')
        .insert({
          shop_id: repairOrder.shop_id,
          entity_type: 'invoice',
          entity_id: repairOrderId,
          quickbooks_id: result.Id,
          status: 'synced',
          synced_at: new Date().toISOString()
        });

      return { success: true, quickbooks_id: result.Id };
    } catch (error) {
      console.error('Invoice sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync payment to QuickBooks
   */
  async syncPayment(paymentId) {
    try {
      const { data: payment } = await this.supabase
        .from('payments')
        .select(`
          *,
          repair_orders!inner(*)
        `)
        .eq('id', paymentId)
        .single();

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      const { qb } = await this.initializeConnection(payment.repair_orders.shop_id);
      if (!qb) {
        return { success: false, error: 'QuickBooks not connected' };
      }

      // Create QuickBooks payment
      const quickbooksPayment = {
        TotalAmt: payment.amount,
        CustomerRef: {
          value: payment.repair_orders.customers.quickbooks_customer_id
        },
        PaymentRefNum: payment.transaction_id,
        TxnDate: payment.processed_at
      };

      const result = await new Promise((resolve, reject) => {
        qb.createPayment(quickbooksPayment, (err, payment) => {
          if (err) reject(err);
          else resolve(payment);
        });
      });

      // Store sync record
      await this.supabase
        .from('quickbooks_sync_logs')
        .insert({
          shop_id: payment.repair_orders.shop_id,
          entity_type: 'payment',
          entity_id: paymentId,
          quickbooks_id: result.Id,
          status: 'synced',
          synced_at: new Date().toISOString()
        });

      return { success: true, quickbooks_id: result.Id };
    } catch (error) {
      console.error('Payment sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync expense to QuickBooks
   */
  async syncExpense(expenseId) {
    try {
      const { data: expense } = await this.supabase
        .from('job_expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (!expense) {
        return { success: false, error: 'Expense not found' };
      }

      const { qb } = await this.initializeConnection(expense.shop_id);
      if (!qb) {
        return { success: false, error: 'QuickBooks not connected' };
      }

      // Create QuickBooks expense
      const quickbooksExpense = {
        TotalAmt: expense.amount,
        AccountRef: {
          value: this.getExpenseAccountId(expense.category)
        },
        Memo: expense.description,
        TxnDate: expense.created_at
      };

      const result = await new Promise((resolve, reject) => {
        qb.createPurchase(quickbooksExpense, (err, expense) => {
          if (err) reject(err);
          else resolve(expense);
        });
      });

      // Store sync record
      await this.supabase
        .from('quickbooks_sync_logs')
        .insert({
          shop_id: expense.shop_id,
          entity_type: 'expense',
          entity_id: expenseId,
          quickbooks_id: result.Id,
          status: 'synced',
          synced_at: new Date().toISOString()
        });

      return { success: true, quickbooks_id: result.Id };
    } catch (error) {
      console.error('Expense sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get expense account ID for category
   */
  getExpenseAccountId(category) {
    const accountMapping = {
      'parts': '5000', // Cost of Goods Sold
      'labor': '5001', // Labor Costs
      'materials': '5002', // Materials
      'sublet': '5003', // Sublet Work
      'other': '5004' // Other Expenses
    };
    
    return accountMapping[category] || '5004';
  }

  /**
   * Get reconciliation report
   */
  async getReconciliationReport(shopId, dateRange) {
    try {
      const { data: syncLogs } = await this.supabase
        .from('quickbooks_sync_logs')
        .select('*')
        .eq('shop_id', shopId)
        .gte('synced_at', dateRange.start)
        .lte('synced_at', dateRange.end);

      const report = {
        total_synced: syncLogs.length,
        invoices_synced: syncLogs.filter(log => log.entity_type === 'invoice').length,
        payments_synced: syncLogs.filter(log => log.entity_type === 'payment').length,
        expenses_synced: syncLogs.filter(log => log.entity_type === 'expense').length,
        sync_errors: syncLogs.filter(log => log.status === 'error').length
      };

      return { success: true, report };
    } catch (error) {
      console.error('Reconciliation report failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = QuickBooksService;
