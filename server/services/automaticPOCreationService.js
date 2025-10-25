/**
 * Automatic PO Creation Service
 *
 * Automatically creates Purchase Orders after BMS import:
 * 1. Groups parts by supplier
 * 2. Creates separate POs for each supplier
 * 3. Links parts to their respective POs
 * 4. Updates part status to 'ordered'
 */

const { PurchaseOrderSystem, AdvancedPartsManagement, Vendor, RepairOrderManagement } = require('../database/models');
const supplierMappingService = require('./supplierMappingService');
const { Op } = require('sequelize');

class AutomaticPOCreationService {
  /**
   * Create POs automatically for parts that need ordering
   * @param {number} repairOrderId - Repair Order ID
   * @param {string} shopId - Shop ID
   * @param {number} userId - User ID for audit
   * @returns {Promise<Object>} Result with created POs
   */
  async createPOsForRepairOrder(repairOrderId, shopId, userId) {
    try {
      console.log(`[Auto PO] Starting automatic PO creation for RO ${repairOrderId}`);

      // Get all parts that need ordering for this RO
      const parts = await AdvancedPartsManagement.findAll({
        where: {
          repairOrderId,
          shopId,
          partStatus: 'needed',
          partsOrderId: null // Only parts not already on a PO
        },
        include: [
          {
            model: Vendor,
            as: 'vendor',
            required: false
          }
        ]
      });

      if (parts.length === 0) {
        console.log(`[Auto PO] No parts need ordering for RO ${repairOrderId}`);
        return {
          success: true,
          message: 'No parts need ordering',
          data: {
            posCreated: 0,
            parts: []
          }
        };
      }

      console.log(`[Auto PO] Found ${parts.length} parts to order`);

      // Ensure vendors exist
      await this.ensureVendorsExist(shopId, parts);

      // Group parts by vendor
      const partsByVendor = await this.groupPartsByVendor(parts, shopId);

      console.log(`[Auto PO] Grouped into ${Object.keys(partsByVendor).length} vendors`);

      // Get RO information for PO numbering
      const repairOrder = await RepairOrderManagement.findByPk(repairOrderId);
      if (!repairOrder) {
        throw new Error('Repair order not found');
      }

      // Create POs for each vendor
      const createdPOs = [];

      for (const [vendorId, vendorGroup] of Object.entries(partsByVendor)) {
        if (vendorId === 'unassigned') {
          console.warn(`[Auto PO] Skipping ${vendorGroup.parts.length} unassigned parts`);
          continue;
        }

        const po = await this.createPOForVendor(
          repairOrder,
          vendorGroup.vendor,
          vendorGroup.parts,
          shopId,
          userId
        );

        if (po) {
          createdPOs.push(po);
        }
      }

      console.log(`[Auto PO] Created ${createdPOs.length} POs successfully`);

      return {
        success: true,
        message: `Created ${createdPOs.length} purchase orders`,
        data: {
          posCreated: createdPOs.length,
          pos: createdPOs.map(po => ({
            id: po.id,
            poNumber: po.purchaseOrderNumber,
            vendorName: po.vendorName,
            totalAmount: po.totalAmount,
            partCount: po.totalLineItems
          }))
        }
      };

    } catch (error) {
      console.error('[Auto PO] Error creating POs:', error);
      return {
        success: false,
        message: `Failed to create POs: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Ensure vendors exist for all parts, assign if missing
   */
  async ensureVendorsExist(shopId, parts) {
    // Ensure default vendors exist
    await supplierMappingService.ensureDefaultVendors(shopId);

    // Assign vendors to parts that don't have one
    for (const part of parts) {
      if (!part.vendorId) {
        const vendor = await supplierMappingService.mapPartToVendor({
          supplierRefNum: part.primaryVendor, // This might be supplier name from BMS
          sourceCode: part.brandType === 'oem' ? 'O' : 'A',
          partType: part.partCategory || part.partSubcategory || ''
        }, shopId);

        if (vendor) {
          // Update part with vendor ID
          await part.update({
            vendorId: vendor.id,
            primaryVendor: vendor.name
          });
          part.vendor = vendor; // Update in memory too
        }
      }
    }
  }

  /**
   * Group parts by their assigned vendor
   */
  async groupPartsByVendor(parts, shopId) {
    const grouped = {};

    for (const part of parts) {
      const vendorId = part.vendorId || 'unassigned';

      if (!grouped[vendorId]) {
        grouped[vendorId] = {
          vendor: part.vendor || await Vendor.findByPk(vendorId),
          parts: []
        };
      }

      grouped[vendorId].parts.push(part);
    }

    return grouped;
  }

  /**
   * Create a single PO for a vendor with their parts
   */
  async createPOForVendor(repairOrder, vendor, parts, shopId, userId) {
    try {
      // Generate PO number
      const poNumber = await this.generatePONumber(repairOrder.ro_number, vendor);

      // Calculate totals
      const subtotal = parts.reduce((sum, part) => {
        const price = parseFloat(part.netPrice || part.listPrice || 0);
        const quantity = parseFloat(part.quantityOrdered || 1);
        return sum + (price * quantity);
      }, 0);

      const taxRate = 0.08; // 8% default tax
      const taxAmount = subtotal * taxRate;
      const totalAmount = subtotal + taxAmount;

      // Create PO
      const purchaseOrder = await PurchaseOrderSystem.create({
        purchaseOrderNumber: poNumber,
        roNumber: repairOrder.ro_number,
        yearMonth: this.getYearMonth(),
        vendorCode: this.generateVendorCode(vendor.name),
        sequenceNumber: await this.getNextSequence(vendor.id, this.getYearMonth()),
        repairOrderId: repairOrder.id,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        vendorPhone: vendor.phone,
        poStatus: 'draft',
        poDate: new Date(),
        subtotalAmount: subtotal,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        totalLineItems: parts.length,
        totalQuantity: parts.reduce((sum, p) => sum + parseFloat(p.quantityOrdered || 1), 0),
        requestedDeliveryDate: this.calculateDeliveryDate(vendor),
        poNotes: `Auto-generated PO from BMS import for RO ${repairOrder.ro_number}`,
        isRushOrder: parts.some(p => p.priority === 'urgent' || p.priority === 'critical'),
        shopId,
        createdBy: userId,
        updatedBy: userId,
      });

      console.log(`[Auto PO] Created PO ${poNumber} for vendor ${vendor.name}`);

      // Update parts to link to this PO and change status to ordered
      const partIds = parts.map(p => p.id);
      await AdvancedPartsManagement.update(
        {
          partsOrderId: purchaseOrder.id,
          partStatus: 'ordered',
          orderDate: new Date(),
          orderedBy: userId,
          purchaseOrderNumber: poNumber,
          updatedBy: userId,
        },
        {
          where: { id: partIds }
        }
      );

      console.log(`[Auto PO] Updated ${partIds.length} parts to 'ordered' status`);

      return purchaseOrder;

    } catch (error) {
      console.error(`[Auto PO] Error creating PO for vendor ${vendor.name}:`, error);
      return null;
    }
  }

  /**
   * Generate PO number in format: ${ro_number}-${YYMM}-${vendorCode}-${seq}
   */
  async generatePONumber(roNumber, vendor) {
    const yearMonth = this.getYearMonth();
    const vendorCode = this.generateVendorCode(vendor.name);
    const sequence = await this.getNextSequence(vendor.id, yearMonth);

    return `${roNumber}-${yearMonth}-${vendorCode}-${String(sequence).padStart(3, '0')}`;
  }

  /**
   * Get YYMM format for current date
   */
  getYearMonth() {
    const now = new Date();
    const yy = now.getFullYear().toString().substr(2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${yy}${mm}`;
  }

  /**
   * Generate 4-character vendor code from name
   */
  generateVendorCode(vendorName) {
    const cleaned = vendorName.toUpperCase().replace(/[^A-Z]/g, '');
    return cleaned.length >= 4 ? cleaned.substr(0, 4) : cleaned.padEnd(4, 'X');
  }

  /**
   * Get next sequence number for PO
   */
  async getNextSequence(vendorId, yearMonth) {
    const count = await PurchaseOrderSystem.count({
      where: {
        vendorId,
        yearMonth
      }
    });
    return count + 1;
  }

  /**
   * Calculate estimated delivery date based on vendor performance
   */
  calculateDeliveryDate(vendor) {
    const daysToAdd = vendor.averageDeliveryTime || 5; // Default 5 days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    return deliveryDate;
  }
}

module.exports = new AutomaticPOCreationService();
