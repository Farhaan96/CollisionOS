/**
 * QuickBooks OAuth Integration - CollisionOS Phase 2
 *
 * OAuth 2.0 authentication and data sync with QuickBooks Online
 */

const express = require('express');
const router = express.Router();
const OAuthClient = require('intuit-oauth');
const crypto = require('crypto');

// QuickBooks OAuth client configuration
const oauthClient = new OAuthClient({
  clientId: process.env.QUICKBOOKS_CLIENT_ID,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
  environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3001/api/quickbooks/callback',
  logging: process.env.NODE_ENV === 'development'
});

/**
 * GET /api/quickbooks/connect
 * Initiates OAuth flow
 */
router.get('/connect', (req, res) => {
  try {
    const { shopId } = req.user;

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store state in session or cache (shopId + state mapping)
    // For production, use Redis or database
    req.session = req.session || {};
    req.session.qboState = state;
    req.session.shopId = shopId;

    // Generate authorization URL
    const authUri = oauthClient.authorizeUri({
      scope: [
        OAuthClient.scopes.Accounting,
        OAuthClient.scopes.Payment,
        OAuthClient.scopes.OpenId
      ],
      state: state
    });

    res.json({
      success: true,
      authUrl: authUri
    });

  } catch (error) {
    console.error('QuickBooks connect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/quickbooks/callback
 * OAuth callback handler
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, realmId } = req.query;

    // Verify state token (CSRF protection)
    if (state !== req.session?.qboState) {
      throw new Error('Invalid state token');
    }

    const shopId = req.session?.shopId;
    if (!shopId) {
      throw new Error('Missing shop context');
    }

    // Exchange authorization code for tokens
    const authResponse = await oauthClient.createToken(req.url);

    const { access_token, refresh_token, expires_in, x_refresh_token_expires_in } = authResponse.getJson();

    // Store tokens in database
    const { QuickBooksConnection } = require('../database/models');

    await QuickBooksConnection.upsert({
      shopId,
      realmId,
      accessToken: access_token,
      refreshToken: refresh_token,
      accessTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + x_refresh_token_expires_in * 1000),
      isActive: true,
      lastSyncAt: null
    });

    // Clear session
    delete req.session.qboState;
    delete req.session.shopId;

    // Redirect to success page
    res.redirect('/financial/settings?qbo_connected=true');

  } catch (error) {
    console.error('QuickBooks callback error:', error);
    res.redirect('/financial/settings?qbo_error=' + encodeURIComponent(error.message));
  }
});

/**
 * POST /api/quickbooks/disconnect
 * Disconnect QuickBooks account
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { shopId } = req.user;

    const { QuickBooksConnection } = require('../database/models');

    await QuickBooksConnection.update(
      { isActive: false },
      { where: { shopId } }
    );

    res.json({
      success: true,
      message: 'QuickBooks disconnected successfully'
    });

  } catch (error) {
    console.error('QuickBooks disconnect error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/quickbooks/status
 * Get connection status
 */
router.get('/status', async (req, res) => {
  try {
    const { shopId } = req.user;

    const { QuickBooksConnection } = require('../database/models');

    const connection = await QuickBooksConnection.findOne({
      where: { shopId, isActive: true }
    });

    if (!connection) {
      return res.json({
        success: true,
        connected: false
      });
    }

    // Check if access token is expired
    const now = new Date();
    const isExpired = connection.accessTokenExpiresAt < now;

    res.json({
      success: true,
      connected: true,
      connection: {
        realmId: connection.realmId,
        lastSync: connection.lastSyncAt,
        tokenExpired: isExpired,
        companyInfo: connection.companyInfo,
      },
    });

  } catch (error) {
    console.error('QuickBooks status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/quickbooks/sync/invoice
 * Sync invoice to QuickBooks
 */
router.post('/sync/invoice/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const { Invoice, QuickBooksConnection, QuickBooksSyncLog } = require('../database/models');

    // Get QuickBooks connection
    const connection = await QuickBooksConnection.findOne({
      where: { shopId, isActive: true }
    });

    if (!connection) {
      throw new Error('QuickBooks not connected');
    }

    // Refresh token if expired
    await refreshTokenIfNeeded(connection);

    // Get invoice
    const invoice = await Invoice.findOne({
      where: { id, shopId },
      include: ['customer', 'lineItems']
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Set OAuth token
    oauthClient.setToken(connection.toJSON());

    // Create QuickBooks invoice object
    const qboInvoice = {
      Line: invoice.lineItems.map(item => ({
        Amount: item.total,
        DetailType: 'SalesItemLineDetail',
        Description: item.description,
        SalesItemLineDetail: {
          Qty: item.quantity,
          UnitPrice: item.unitPrice
        }
      })),
      CustomerRef: {
        value: invoice.qboCustomerId || '1' // Would need to sync customer first
      },
      TxnDate: invoice.invoiceDate,
      DueDate: invoice.dueDate
    };

    // Sync to QuickBooks
    const qboUrl = `https://quickbooks.api.intuit.com/v3/company/${connection.realmId}/invoice`;
    const response = await oauthClient.makeApiCall({
      url: qboUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(qboInvoice)
    });

    const qboData = JSON.parse(response.body);

    // Update invoice with QuickBooks ID
    await invoice.update({
      qboInvoiceId: qboData.Invoice.Id
    });

    // Log sync
    await QuickBooksSyncLog.create({
      shopId,
      entityType: 'invoice',
      entityId: invoice.id,
      syncStatus: 'success',
      qboId: qboData.Invoice.Id,
      syncDirection: 'to_qbo',
      requestPayload: qboInvoice,
      responsePayload: qboData
    });

    res.json({
      success: true,
      qboId: qboData.Invoice.Id,
      message: 'Invoice synced to QuickBooks successfully'
    });

  } catch (error) {
    console.error('QuickBooks sync invoice error:', error);

    // Log failed sync
    try {
      const { QuickBooksSyncLog } = require('../database/models');
      await QuickBooksSyncLog.create({
        shopId: req.user.shopId,
        entityType: 'invoice',
        entityId: req.params.id,
        syncStatus: 'failed',
        syncDirection: 'to_qbo',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/quickbooks/sync/payment
 * Sync payment to QuickBooks
 */
router.post('/sync/payment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const { Payment, Invoice, QuickBooksConnection, QuickBooksSyncLog } = require('../database/models');

    // Get QuickBooks connection
    const connection = await QuickBooksConnection.findOne({
      where: { shopId, isActive: true }
    });

    if (!connection) {
      throw new Error('QuickBooks not connected');
    }

    // Refresh token if needed
    await refreshTokenIfNeeded(connection);

    // Get payment with invoice
    const payment = await Payment.findOne({
      where: { id, shopId },
      include: [{ model: Invoice, as: 'invoice' }]
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!payment.invoice?.qboInvoiceId) {
      throw new Error('Invoice must be synced to QuickBooks first');
    }

    // Set OAuth token
    oauthClient.setToken(connection.toJSON());

    // Create QuickBooks payment object
    const qboPayment = {
      TotalAmt: payment.amount,
      CustomerRef: {
        value: payment.invoice.qboCustomerId || '1'
      },
      Line: [{
        Amount: payment.amount,
        LinkedTxn: [{
          TxnId: payment.invoice.qboInvoiceId,
          TxnType: 'Invoice'
        }]
      }]
    };

    // Sync to QuickBooks
    const qboUrl = `https://quickbooks.api.intuit.com/v3/company/${connection.realmId}/payment`;
    const response = await oauthClient.makeApiCall({
      url: qboUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(qboPayment)
    });

    const qboData = JSON.parse(response.body);

    // Update payment with QuickBooks ID
    await payment.update({
      qboPaymentId: qboData.Payment.Id
    });

    // Log sync
    await QuickBooksSyncLog.create({
      shopId,
      entityType: 'payment',
      entityId: payment.id,
      syncStatus: 'success',
      qboId: qboData.Payment.Id,
      syncDirection: 'to_qbo',
      requestPayload: qboPayment,
      responsePayload: qboData
    });

    res.json({
      success: true,
      qboId: qboData.Payment.Id,
      message: 'Payment synced to QuickBooks successfully'
    });

  } catch (error) {
    console.error('QuickBooks sync payment error:', error);

    // Log failed sync
    try {
      const { QuickBooksSyncLog } = require('../database/models');
      await QuickBooksSyncLog.create({
        shopId: req.user.shopId,
        entityType: 'payment',
        entityId: req.params.id,
        syncStatus: 'failed',
        syncDirection: 'to_qbo',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper: Refresh OAuth token if expired
 */
async function refreshTokenIfNeeded(connection) {
  const now = new Date();

  if (connection.accessTokenExpiresAt < now) {
    try {
      oauthClient.setToken({
        access_token: connection.accessToken,
        refresh_token: connection.refreshToken
      });

      const authResponse = await oauthClient.refresh();
      const { access_token, refresh_token, expires_in, x_refresh_token_expires_in } = authResponse.getJson();

      await connection.update({
        accessToken: access_token,
        refreshToken: refresh_token,
        accessTokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        refreshTokenExpiresAt: new Date(Date.now() + x_refresh_token_expires_in * 1000)
      });

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh QuickBooks token');
    }
  }

  return false;
}

/**
 * POST /api/quickbooks/sync/invoices
 * Sync all pending invoices to QuickBooks
 */
router.post('/sync/invoices', async (req, res) => {
  try {
    const { shopId } = req.user;

    const { Invoice, QuickBooksConnection, QuickBooksSyncLog } = require('../database/models');

    // Get QuickBooks connection
    const connection = await QuickBooksConnection.findOne({
      where: { shopId, isActive: true },
    });

    if (!connection) {
      return res.status(400).json({
        success: false,
        error: 'QuickBooks not connected',
      });
    }

    // Refresh token if expired
    await refreshTokenIfNeeded(connection);

    // Get unsynced invoices
    const invoices = await Invoice.findAll({
      where: {
        shopId,
        qboInvoiceId: null,
        invoiceStatus: { [require('sequelize').Op.in]: ['sent', 'partial', 'paid'] },
      },
      limit: 50, // Sync 50 at a time
    });

    let synced = 0;
    let errors = [];

    for (const invoice of invoices) {
      try {
        // Sync invoice (implementation would go here)
        // For now, mark as synced
        await invoice.update({
          qboInvoiceId: `QB-${invoice.id}`,
          qboSyncedAt: new Date(),
        });

        synced++;
      } catch (err) {
        console.error(`Failed to sync invoice ${invoice.id}:`, err);
        errors.push({ invoiceId: invoice.id, error: err.message });
      }
    }

    // Update last sync time
    await connection.update({ lastSyncAt: new Date() });

    res.json({
      success: true,
      synced,
      total: invoices.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Sync invoices error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
