/**
 * Estimate Diff Service
 * Compares BMS estimate versions and tracks changes
 */

// TODO: Replace with local database connection

/**
 * Compare two BMS parsed results and generate a detailed diff
 * @param {Object} currentBMS - New BMS parsed data
 * @param {Object} previousBMS - Previous BMS parsed data
 * @returns {Object} Diff summary with added, removed, modified items
 */
function compareBMSEstimates(currentBMS, previousBMS) {
  const diff = {
    summary: {
      hasChanges: false,
      totalChange: 0,
      percentChange: 0,
      lineItemsAdded: 0,
      lineItemsRemoved: 0,
      lineItemsModified: 0,
    },
    parts: {
      added: [],
      removed: [],
      modified: [],
      unchanged: [],
    },
    labor: {
      added: [],
      removed: [],
      modified: [],
      unchanged: [],
    },
    totals: {
      previous: {
        parts: parseFloat(previousBMS.financial?.partsTotal || 0),
        labor: parseFloat(previousBMS.financial?.laborTotal || 0),
        materials: parseFloat(previousBMS.financial?.materialsTotal || 0),
        tax: parseFloat(previousBMS.financial?.partsTax || 0) + parseFloat(previousBMS.financial?.laborTax || 0),
        grand: parseFloat(previousBMS.documentInfo?.totalAmount || 0),
      },
      current: {
        parts: parseFloat(currentBMS.financial?.partsTotal || 0),
        labor: parseFloat(currentBMS.financial?.laborTotal || 0),
        materials: parseFloat(currentBMS.financial?.materialsTotal || 0),
        tax: parseFloat(currentBMS.financial?.partsTax || 0) + parseFloat(currentBMS.financial?.laborTax || 0),
        grand: parseFloat(currentBMS.documentInfo?.totalAmount || 0),
      },
      changes: {},
    },
  };

  // Calculate total changes
  diff.totals.changes = {
    parts: diff.totals.current.parts - diff.totals.previous.parts,
    labor: diff.totals.current.labor - diff.totals.previous.labor,
    materials: diff.totals.current.materials - diff.totals.previous.materials,
    tax: diff.totals.current.tax - diff.totals.previous.tax,
    grand: diff.totals.current.grand - diff.totals.previous.grand,
  };

  diff.summary.totalChange = diff.totals.changes.grand;
  if (diff.totals.previous.grand > 0) {
    diff.summary.percentChange = (diff.totals.changes.grand / diff.totals.previous.grand) * 100;
  }

  // Compare parts
  const previousParts = new Map();
  (previousBMS.parts || []).forEach(part => {
    const key = `${part.lineNumber}_${part.partNumber}_${part.description}`;
    previousParts.set(key, part);
  });

  const currentParts = new Map();
  (currentBMS.parts || []).forEach(part => {
    const key = `${part.lineNumber}_${part.partNumber}_${part.description}`;
    currentParts.set(key, part);

    if (!previousParts.has(key)) {
      // New part added
      diff.parts.added.push({
        lineNumber: part.lineNumber,
        description: part.description,
        partNumber: part.partNumber,
        quantity: part.quantity,
        price: part.price,
        extended: parseFloat(part.price || 0) * parseFloat(part.quantity || 0),
      });
      diff.summary.lineItemsAdded++;
    } else {
      // Part exists, check for modifications
      const prev = previousParts.get(key);
      const changes = {};
      let hasChange = false;

      if (parseFloat(part.quantity) !== parseFloat(prev.quantity)) {
        changes.quantity = {
          from: parseFloat(prev.quantity),
          to: parseFloat(part.quantity),
          change: parseFloat(part.quantity) - parseFloat(prev.quantity),
        };
        hasChange = true;
      }

      if (parseFloat(part.price) !== parseFloat(prev.price)) {
        changes.price = {
          from: parseFloat(prev.price),
          to: parseFloat(part.price),
          change: parseFloat(part.price) - parseFloat(prev.price),
        };
        hasChange = true;
      }

      const prevExtended = parseFloat(prev.price || 0) * parseFloat(prev.quantity || 0);
      const currExtended = parseFloat(part.price || 0) * parseFloat(part.quantity || 0);
      if (Math.abs(currExtended - prevExtended) > 0.01) {
        changes.extended = {
          from: prevExtended,
          to: currExtended,
          change: currExtended - prevExtended,
        };
        hasChange = true;
      }

      if (hasChange) {
        diff.parts.modified.push({
          lineNumber: part.lineNumber,
          description: part.description,
          partNumber: part.partNumber,
          changes,
        });
        diff.summary.lineItemsModified++;
      } else {
        diff.parts.unchanged.push({
          lineNumber: part.lineNumber,
          description: part.description,
          partNumber: part.partNumber,
        });
      }
    }
  });

  // Find removed parts
  previousParts.forEach((part, key) => {
    if (!currentParts.has(key)) {
      diff.parts.removed.push({
        lineNumber: part.lineNumber,
        description: part.description,
        partNumber: part.partNumber,
        quantity: part.quantity,
        price: part.price,
        extended: parseFloat(part.price || 0) * parseFloat(part.quantity || 0),
      });
      diff.summary.lineItemsRemoved++;
    }
  });

  // Compare labor
  const previousLabor = new Map();
  (previousBMS.labor?.lines || []).forEach(labor => {
    const key = `${labor.lineNumber}_${labor.operation}`;
    previousLabor.set(key, labor);
  });

  const currentLabor = new Map();
  (currentBMS.labor?.lines || []).forEach(labor => {
    const key = `${labor.lineNumber}_${labor.operation}`;
    currentLabor.set(key, labor);

    if (!previousLabor.has(key)) {
      // New labor operation added
      diff.labor.added.push({
        lineNumber: labor.lineNumber,
        operation: labor.operation,
        hours: labor.hours,
        laborType: labor.laborType,
      });
      diff.summary.lineItemsAdded++;
    } else {
      // Labor exists, check for modifications
      const prev = previousLabor.get(key);
      const changes = {};
      let hasChange = false;

      if (parseFloat(labor.hours) !== parseFloat(prev.hours)) {
        changes.hours = {
          from: parseFloat(prev.hours),
          to: parseFloat(labor.hours),
          change: parseFloat(labor.hours) - parseFloat(prev.hours),
        };
        hasChange = true;
      }

      if (hasChange) {
        diff.labor.modified.push({
          lineNumber: labor.lineNumber,
          operation: labor.operation,
          changes,
        });
        diff.summary.lineItemsModified++;
      } else {
        diff.labor.unchanged.push({
          lineNumber: labor.lineNumber,
          operation: labor.operation,
        });
      }
    }
  });

  // Find removed labor
  previousLabor.forEach((labor, key) => {
    if (!currentLabor.has(key)) {
      diff.labor.removed.push({
        lineNumber: labor.lineNumber,
        operation: labor.operation,
        hours: labor.hours,
        laborType: labor.laborType,
      });
      diff.summary.lineItemsRemoved++;
    }
  });

  diff.summary.hasChanges =
    diff.summary.lineItemsAdded > 0 ||
    diff.summary.lineItemsRemoved > 0 ||
    diff.summary.lineItemsModified > 0 ||
    Math.abs(diff.summary.totalChange) > 0.01;

  return diff;
}

/**
 * Save estimate version and diff to database
 * @param {UUID} claimId - Insurance claim ID
 * @param {UUID} jobId - Job ID
 * @param {Object} bmsData - Full parsed BMS data
 * @param {Object} diff - Diff object (if comparing to previous version)
 * @param {string} revisionReason - Reason for this version (initial, supplement, etc.)
 */
async function saveEstimateVersion(claimId, jobId, bmsData, diff = null, revisionReason = 'initial') {
  try {
    // Get the latest version number for this claim
    const { data: latestVersion } = await supabaseAdmin
      .from('estimate_versions')
      .select('version_number')
      .eq('claim_id', claimId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1;

    // Prepare version data
    const versionData = {
      claim_id: claimId,
      job_id: jobId,
      version_number: nextVersionNumber,
      estimate_number: bmsData.documentInfo?.estimateNumber || `EST-${Date.now()}`,
      revision_reason: revisionReason,
      estimate_date: bmsData.documentInfo?.date ? new Date(bmsData.documentInfo.date).toISOString() : null,
      parts_total: parseFloat(bmsData.financial?.partsTotal || 0),
      labor_total: parseFloat(bmsData.financial?.laborTotal || 0),
      materials_total: parseFloat(bmsData.financial?.materialsTotal || 0),
      tax_total: (parseFloat(bmsData.financial?.partsTax || 0) + parseFloat(bmsData.financial?.laborTax || 0)),
      grand_total: parseFloat(bmsData.documentInfo?.totalAmount || 0),
      bms_data: bmsData,
      diff_summary: diff ? diff.summary : null,
    };

    // Insert estimate version
    const { data: newVersion, error: versionError } = await supabaseAdmin
      .from('estimate_versions')
      .insert([versionData])
      .select()
      .single();

    if (versionError) {
      console.error('Error saving estimate version:', versionError);
      throw versionError;
    }

    console.log(`✅ Saved estimate version ${nextVersionNumber} for claim ${claimId}`);

    // Save line item changes if diff exists
    if (diff && newVersion) {
      await saveLineItemChanges(newVersion.id, claimId, diff);
    }

    return {
      success: true,
      version: newVersion,
      versionNumber: nextVersionNumber,
      diff: diff,
    };

  } catch (error) {
    console.error('Error in saveEstimateVersion:', error);
    throw error;
  }
}

/**
 * Save detailed line item changes
 */
async function saveLineItemChanges(versionId, claimId, diff) {
  const lineItems = [];

  // Added parts
  diff.parts.added.forEach(part => {
    lineItems.push({
      version_id: versionId,
      claim_id: claimId,
      line_number: part.lineNumber,
      item_type: 'part',
      description: part.description,
      part_number: part.partNumber,
      change_type: 'added',
      current_quantity: part.quantity,
      current_price: part.price,
      current_extended: part.extended,
      quantity_change: part.quantity,
      price_change: part.price,
      extended_change: part.extended,
    });
  });

  // Removed parts
  diff.parts.removed.forEach(part => {
    lineItems.push({
      version_id: versionId,
      claim_id: claimId,
      line_number: part.lineNumber,
      item_type: 'part',
      description: part.description,
      part_number: part.partNumber,
      change_type: 'removed',
      previous_quantity: part.quantity,
      previous_price: part.price,
      previous_extended: part.extended,
      quantity_change: -part.quantity,
      price_change: -part.price,
      extended_change: -part.extended,
    });
  });

  // Modified parts
  diff.parts.modified.forEach(part => {
    const lineItem = {
      version_id: versionId,
      claim_id: claimId,
      line_number: part.lineNumber,
      item_type: 'part',
      description: part.description,
      part_number: part.partNumber,
      change_type: 'modified',
    };

    if (part.changes.quantity) {
      lineItem.previous_quantity = part.changes.quantity.from;
      lineItem.current_quantity = part.changes.quantity.to;
      lineItem.quantity_change = part.changes.quantity.change;
    }

    if (part.changes.price) {
      lineItem.previous_price = part.changes.price.from;
      lineItem.current_price = part.changes.price.to;
      lineItem.price_change = part.changes.price.change;
    }

    if (part.changes.extended) {
      lineItem.previous_extended = part.changes.extended.from;
      lineItem.current_extended = part.changes.extended.to;
      lineItem.extended_change = part.changes.extended.change;
    }

    lineItems.push(lineItem);
  });

  // Added labor
  diff.labor.added.forEach(labor => {
    lineItems.push({
      version_id: versionId,
      claim_id: claimId,
      line_number: labor.lineNumber,
      item_type: 'labor',
      description: labor.operation,
      change_type: 'added',
      current_hours: labor.hours,
      hours_change: labor.hours,
    });
  });

  // Removed labor
  diff.labor.removed.forEach(labor => {
    lineItems.push({
      version_id: versionId,
      claim_id: claimId,
      line_number: labor.lineNumber,
      item_type: 'labor',
      description: labor.operation,
      change_type: 'removed',
      previous_hours: labor.hours,
      hours_change: -labor.hours,
    });
  });

  // Modified labor
  diff.labor.modified.forEach(labor => {
    const lineItem = {
      version_id: versionId,
      claim_id: claimId,
      line_number: labor.lineNumber,
      item_type: 'labor',
      description: labor.operation,
      change_type: 'modified',
    };

    if (labor.changes.hours) {
      lineItem.previous_hours = labor.changes.hours.from;
      lineItem.current_hours = labor.changes.hours.to;
      lineItem.hours_change = labor.changes.hours.change;
    }

    lineItems.push(lineItem);
  });

  // Bulk insert line item changes
  if (lineItems.length > 0) {
    const { error } = await supabaseAdmin
      .from('estimate_line_item_changes')
      .insert(lineItems);

    if (error) {
      console.error('Error saving line item changes:', error);
      throw error;
    }

    console.log(`✅ Saved ${lineItems.length} line item changes`);
  }
}

/**
 * Get estimate version history for a claim
 */
async function getEstimateVersionHistory(claimId) {
  const { data, error } = await supabaseAdmin
    .from('estimate_versions')
    .select('*')
    .eq('claim_id', claimId)
    .order('version_number', { ascending: true });

  if (error) {
    console.error('Error fetching version history:', error);
    throw error;
  }

  return data;
}

/**
 * Get detailed changes for a specific version
 */
async function getVersionChanges(versionId) {
  const { data, error } = await supabaseAdmin
    .from('estimate_line_item_changes')
    .select('*')
    .eq('version_id', versionId)
    .order('line_number', { ascending: true });

  if (error) {
    console.error('Error fetching version changes:', error);
    throw error;
  }

  return data;
}

module.exports = {
  compareBMSEstimates,
  saveEstimateVersion,
  saveLineItemChanges,
  getEstimateVersionHistory,
  getVersionChanges,
};
