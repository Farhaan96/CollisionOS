/**
 * CollisionOS BMS Ingestion Edge Function
 * 
 * Phase 2 Backend Development - BMS Integration System
 * 
 * Features:
 * - XML/JSON BMS data parsing with fast-xml-parser
 * - Structured data pipeline: documents → customers → vehicles → claims → repair_orders → part_lines
 * - Comprehensive validation and error handling
 * - JSON response with ingestion counts
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BMSData {
  documents?: any[]
  customers?: any[]
  vehicles?: any[]
  claims?: any[]
  repair_orders?: any[]
  part_lines?: any[]
}

interface IngestionResult {
  success: boolean
  message: string
  counts: {
    documents: number
    customers: number
    vehicles: number
    claims: number
    repair_orders: number
    part_lines: number
  }
  errors: string[]
  processing_time_ms: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request
    const { data, format = 'xml', shop_id, user_id } = await req.json()

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'BMS data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse BMS data based on format
    let parsedData: BMSData = {}
    
    if (format === 'xml') {
      parsedData = await parseXMLBMSData(data)
    } else if (format === 'json') {
      parsedData = data as BMSData
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported format. Use "xml" or "json"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate parsed data
    const validation = validateBMSData(parsedData)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid BMS data', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Execute structured upsert pipeline
    const result = await executeBMSPipeline(supabase, parsedData, shop_id, user_id)

    const response: IngestionResult = {
      success: true,
      message: 'BMS data ingested successfully',
      counts: result.counts,
      errors: result.errors,
      processing_time_ms: Date.now() - startTime
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('BMS ingestion error:', error)
    
    const response: IngestionResult = {
      success: false,
      message: 'BMS ingestion failed',
      counts: { documents: 0, customers: 0, vehicles: 0, claims: 0, repair_orders: 0, part_lines: 0 },
      errors: [error.message],
      processing_time_ms: Date.now() - startTime
    }

    return new Response(
      JSON.stringify(response),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Parse XML BMS data using fast-xml-parser
 */
async function parseXMLBMSData(xmlData: string): Promise<BMSData> {
  // Import fast-xml-parser
  const { XMLParser } = await import('https://esm.sh/fast-xml-parser@4.3.2')
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true
  })

  const parsed = parser.parse(xmlData)
  
  // Extract BMS sections based on CIECA standard structure
  const bmsData: BMSData = {
    documents: extractDocuments(parsed),
    customers: extractCustomers(parsed),
    vehicles: extractVehicles(parsed),
    claims: extractClaims(parsed),
    repair_orders: extractRepairOrders(parsed),
    part_lines: extractPartLines(parsed)
  }

  return bmsData
}

/**
 * Extract document information for provenance tracking
 */
function extractDocuments(parsed: any): any[] {
  const documents = []
  
  if (parsed.BMS?.Header) {
    documents.push({
      document_type: 'BMS',
      version: parsed.BMS.Header.Version || '1.0',
      source_system: parsed.BMS.Header.SourceSystem || 'Unknown',
      created_date: parsed.BMS.Header.CreatedDate || new Date().toISOString(),
      document_id: parsed.BMS.Header.DocumentId || generateDocumentId()
    })
  }
  
  return documents
}

/**
 * Extract customer contact information
 */
function extractCustomers(parsed: any): any[] {
  const customers = []
  
  // Extract from Vehicle Owner section
  if (parsed.BMS?.VehicleOwner) {
    const owner = parsed.BMS.VehicleOwner
    customers.push({
      first_name: owner.FirstName || '',
      last_name: owner.LastName || '',
      company_name: owner.CompanyName || null,
      phone: owner.Phone || '',
      email: owner.Email || '',
      address_line1: owner.Address?.Street || '',
      address_line2: owner.Address?.Street2 || null,
      city: owner.Address?.City || '',
      state: owner.Address?.State || '',
      zip_code: owner.Address?.ZipCode || '',
      customer_type: 'vehicle_owner'
    })
  }

  // Extract insurance contact if different
  if (parsed.BMS?.InsuranceInfo?.Contact) {
    const contact = parsed.BMS.InsuranceInfo.Contact
    customers.push({
      first_name: contact.FirstName || '',
      last_name: contact.LastName || '',
      company_name: parsed.BMS.InsuranceInfo.CompanyName || '',
      phone: contact.Phone || '',
      email: contact.Email || '',
      customer_type: 'insurance_contact'
    })
  }

  return customers
}

/**
 * Extract vehicle information (VIN, YMMT, plate, color, paint code, odometer)
 */
function extractVehicles(parsed: any): any[] {
  const vehicles = []
  
  if (parsed.BMS?.Vehicle) {
    const vehicle = parsed.BMS.Vehicle
    vehicles.push({
      vin: vehicle.VIN || '',
      year: parseInt(vehicle.Year) || null,
      make: vehicle.Make || '',
      model: vehicle.Model || '',
      trim: vehicle.Trim || null,
      color: vehicle.Color || '',
      paint_code: vehicle.PaintCode || null,
      license_plate: vehicle.LicensePlate || null,
      odometer: parseInt(vehicle.Odometer) || null,
      odometer_unit: vehicle.OdometerUnit || 'miles',
      engine_type: vehicle.Engine || null,
      transmission: vehicle.Transmission || null,
      body_type: vehicle.BodyType || null
    })
  }

  return vehicles
}

/**
 * Extract claim information (claim_number, insurer, adjuster info, deductible)
 */
function extractClaims(parsed: any): any[] {
  const claims = []
  
  if (parsed.BMS?.ClaimInfo) {
    const claim = parsed.BMS.ClaimInfo
    claims.push({
      claim_number: claim.ClaimNumber || '',
      policy_number: claim.PolicyNumber || null,
      deductible: parseFloat(claim.Deductible) || 0,
      insurance_company: claim.InsuranceCompany || '',
      adjuster_name: claim.Adjuster?.Name || null,
      adjuster_phone: claim.Adjuster?.Phone || null,
      adjuster_email: claim.Adjuster?.Email || null,
      date_of_loss: claim.DateOfLoss || null,
      loss_description: claim.LossDescription || null,
      claim_status: claim.Status || 'open'
    })
  }

  return claims
}

/**
 * Extract repair order information (RO_number, 1:1 with claim, stages, dates)
 */
function extractRepairOrders(parsed: any): any[] {
  const repairOrders = []
  
  if (parsed.BMS?.RepairOrder) {
    const ro = parsed.BMS.RepairOrder
    repairOrders.push({
      ro_number: ro.RONumber || generateRONumber(),
      claim_number: parsed.BMS?.ClaimInfo?.ClaimNumber || null,
      status: ro.Status || 'estimate',
      stage: ro.Stage || 'intake',
      promised_date: ro.PromisedDate || null,
      started_date: ro.StartedDate || null,
      completed_date: ro.CompletedDate || null,
      total_estimate: parseFloat(ro.TotalEstimate) || 0,
      total_labor: parseFloat(ro.TotalLabor) || 0,
      total_parts: parseFloat(ro.TotalParts) || 0,
      total_other: parseFloat(ro.TotalOther) || 0,
      customer_notes: ro.CustomerNotes || null,
      internal_notes: ro.InternalNotes || null
    })
  }

  return repairOrders
}

/**
 * Extract part line items (operations, parts, status=needed, pricing)
 */
function extractPartLines(parsed: any): any[] {
  const partLines = []
  
  if (parsed.BMS?.LineItems?.LineItem) {
    const lineItems = Array.isArray(parsed.BMS.LineItems.LineItem) 
      ? parsed.BMS.LineItems.LineItem 
      : [parsed.BMS.LineItems.LineItem]

    lineItems.forEach((item: any, index: number) => {
      if (item.Type === 'Part' || item.PartNumber) {
        partLines.push({
          line_number: item.LineNumber || (index + 1),
          part_number: item.PartNumber || '',
          part_description: item.Description || '',
          quantity: parseInt(item.Quantity) || 1,
          unit_cost: parseFloat(item.UnitCost) || 0,
          total_cost: parseFloat(item.TotalCost) || 0,
          vendor_name: item.Vendor || null,
          status: 'needed',
          operation_type: item.OperationType || 'repair',
          labor_hours: parseFloat(item.LaborHours) || 0,
          part_type: item.PartType || 'OEM',
          notes: item.Notes || null
        })
      }
    })
  }

  return partLines
}

/**
 * Validate BMS data structure and completeness
 */
function validateBMSData(data: BMSData): { valid: boolean, errors: string[] } {
  const errors: string[] = []

  // Check required sections
  if (!data.customers || data.customers.length === 0) {
    errors.push('Customer information is required')
  }

  if (!data.vehicles || data.vehicles.length === 0) {
    errors.push('Vehicle information is required')
  }

  // Validate customer data
  data.customers?.forEach((customer, index) => {
    if (!customer.first_name && !customer.last_name && !customer.company_name) {
      errors.push(`Customer ${index + 1}: Name or company name is required`)
    }
  })

  // Validate vehicle data
  data.vehicles?.forEach((vehicle, index) => {
    if (!vehicle.vin || vehicle.vin.length < 17) {
      errors.push(`Vehicle ${index + 1}: Valid VIN is required`)
    }
    if (!vehicle.year || !vehicle.make || !vehicle.model) {
      errors.push(`Vehicle ${index + 1}: Year, Make, and Model are required`)
    }
  })

  return { valid: errors.length === 0, errors }
}

/**
 * Execute structured upsert pipeline in order
 */
async function executeBMSPipeline(
  supabase: any, 
  data: BMSData, 
  shop_id?: string, 
  user_id?: string
) {
  const counts = { documents: 0, customers: 0, vehicles: 0, claims: 0, repair_orders: 0, part_lines: 0 }
  const errors: string[] = []

  try {
    // 1. Upsert documents for provenance tracking
    if (data.documents?.length) {
      const { data: docs, error } = await supabase
        .from('documents')
        .upsert(data.documents.map(doc => ({ ...doc, shop_id, created_by: user_id })))
        .select()
      
      if (error) errors.push(`Documents: ${error.message}`)
      else counts.documents = docs?.length || 0
    }

    // 2. Upsert customers
    if (data.customers?.length) {
      const { data: customers, error } = await supabase
        .from('customers')
        .upsert(data.customers.map(customer => ({ ...customer, shop_id, created_by: user_id })))
        .select()
      
      if (error) errors.push(`Customers: ${error.message}`)
      else counts.customers = customers?.length || 0
    }

    // 3. Upsert vehicles
    if (data.vehicles?.length) {
      const { data: vehicles, error } = await supabase
        .from('vehicle_profiles')
        .upsert(data.vehicles.map(vehicle => ({ ...vehicle, shop_id, created_by: user_id })))
        .select()
      
      if (error) errors.push(`Vehicles: ${error.message}`)
      else counts.vehicles = vehicles?.length || 0
    }

    // 4. Upsert claims
    if (data.claims?.length) {
      const { data: claims, error } = await supabase
        .from('claim_management')
        .upsert(data.claims.map(claim => ({ ...claim, shop_id, created_by: user_id })))
        .select()
      
      if (error) errors.push(`Claims: ${error.message}`)
      else counts.claims = claims?.length || 0
    }

    // 5. Upsert repair orders (1:1 with claims)
    if (data.repair_orders?.length) {
      const { data: repairOrders, error } = await supabase
        .from('repair_order_management')
        .upsert(data.repair_orders.map(ro => ({ ...ro, shop_id, created_by: user_id })))
        .select()
      
      if (error) errors.push(`Repair Orders: ${error.message}`)
      else counts.repair_orders = repairOrders?.length || 0
    }

    // 6. Upsert part lines (status=needed, pricing)
    if (data.part_lines?.length) {
      const { data: partLines, error } = await supabase
        .from('advanced_parts_management')
        .upsert(data.part_lines.map(part => ({ ...part, shop_id, created_by: user_id })))
        .select()
      
      if (error) errors.push(`Part Lines: ${error.message}`)
      else counts.part_lines = partLines?.length || 0
    }

  } catch (error) {
    errors.push(`Pipeline execution error: ${error.message}`)
  }

  return { counts, errors }
}

/**
 * Generate unique document ID
 */
function generateDocumentId(): string {
  return `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate repair order number
 */
function generateRONumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().substr(2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `RO${year}${month}${seq}`
}