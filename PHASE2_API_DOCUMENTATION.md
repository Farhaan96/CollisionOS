# CollisionOS Phase 2 Backend API Documentation

## Overview
This document provides comprehensive API documentation for the Phase 2 backend development of CollisionOS - a complete collision repair management system with enterprise-grade features.

## Base URL
- Development: `http://localhost:3001/api`
- Versioned: `http://localhost:3001/api/v1`

## Authentication
All API endpoints require JWT authentication unless otherwise specified.

```
Authorization: Bearer <jwt-token>
```

## Rate Limiting
- Standard endpoints: 100 requests per 15 minutes
- Bulk operations: 10 requests per hour
- Communication endpoints: 100 requests per 15 minutes

---

## 1. BMS Integration System

### Supabase Edge Function: BMS Ingestion
**Endpoint:** `/functions/bms_ingest`  
**Method:** POST

#### Description
Automated XML/JSON parsing and data ingestion from insurance systems with structured upsert pipeline.

#### Request Body
```json
{
  "data": "XML string or JSON object",
  "format": "xml" | "json",
  "shop_id": "string",
  "user_id": "string"
}
```

#### Response
```json
{
  "success": true,
  "message": "BMS data ingested successfully",
  "counts": {
    "documents": 1,
    "customers": 1,
    "vehicles": 1,
    "claims": 1,
    "repair_orders": 1,
    "part_lines": 15
  },
  "errors": [],
  "processing_time_ms": 1250
}
```

#### Features
- XML parsing with fast-xml-parser (removeNSPrefix: true)
- Structured upsert order: documents → customers → vehicles → claims → repair_orders → part_lines
- Comprehensive validation and error handling
- JSON response with ingestion counts

---

## 2. Purchase Order Management

### Base Routes
- `/api/pos` or `/api/purchase-orders`
- `/api/v1/pos` or `/api/v1/purchase-orders`

### Create Purchase Order
**Endpoint:** `POST /pos`

#### Description
Create PO from selected part lines with structured numbering and vendor management.

#### Request Body
```json
{
  "part_line_ids": ["string"],
  "vendor_id": "string",
  "ro_number": "string",
  "delivery_date": "2024-09-15",
  "notes": "string",
  "expedite": false
}
```

#### Response
```json
{
  "success": true,
  "message": "Purchase order created successfully",
  "data": {
    "po_id": "string",
    "po_number": "RO2024-2409-PART-001",
    "status": "draft",
    "total_amount": 1250.00,
    "part_count": 5
  }
}
```

#### Features
- **Structured PO numbering:** `${ro_number}-${YYMM}-${vendorCode}-${seq}`
- **Vendor code generation:** 4 chars uppercase from supplier name
- **Margin validation:** Real-time margin checking against vendor agreements
- **Status workflow:** draft → sent → ack → partial → received → closed

### Receive Purchase Order
**Endpoint:** `POST /pos/:id/receive`

#### Description
Partial receiving with quantity tracking and returns handling.

#### Request Body
```json
{
  "received_items": [
    {
      "part_line_id": "string",
      "received_quantity": 5,
      "condition": "good" | "damaged" | "wrong_part",
      "notes": "string"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Purchase order partially received",
  "data": {
    "po_status": "partial",
    "processing_results": [...],
    "return_items": 0,
    "all_received": false
  }
}
```

### Install Parts
**Endpoint:** `POST /part-lines/:id/install`

#### Description
Install parts and update status with technician tracking.

#### Request Body
```json
{
  "installed_quantity": 2,
  "installation_notes": "string",
  "technician_id": "string"
}
```

### Vendor-Specific PO Views
**Endpoint:** `GET /pos/vendor/:vendorId`

#### Query Parameters
- `status`: Filter by PO status
- `date_range`: Number of days (default: 30)

#### Response
```json
{
  "success": true,
  "data": {
    "purchase_orders": [...],
    "vendor_metrics": {
      "total_pos": 25,
      "on_time_delivery_rate": "92.5",
      "avg_delivery_days": 3,
      "total_value": "15250.00"
    },
    "total_pos": 25
  }
}
```

### Split Purchase Orders
**Endpoint:** `POST /pos/:id/split`

#### Description
Split POs by vendor or delivery with intelligent grouping.

#### Request Body
```json
{
  "split_by": "vendor" | "delivery",
  "split_groups": [
    {
      "part_line_ids": ["string"],
      "vendor_id": "string",
      "vendor_code": "PART",
      "delivery_date": "2024-09-20"
    }
  ]
}
```

---

## 3. Advanced Parts Management

### Base Routes
- `/api/parts-workflow`
- `/api/v1/parts-workflow`

### Parts Workflow Status
**Endpoint:** `GET /workflow/:roId`

#### Description
Parts status buckets for repair order with completion tracking.

#### Response
```json
{
  "success": true,
  "data": {
    "workflow_buckets": {
      "needed": [...],
      "sourcing": [...],
      "ordered": [...],
      "backordered": [...],
      "received": [...],
      "installed": [...],
      "returned": [...],
      "cancelled": [...]
    },
    "workflow_metrics": {
      "total_parts": 25,
      "total_value": "5250.00",
      "completion_rate": "68.0",
      "parts_on_order": 8,
      "ready_to_install": 3,
      "critical_delays": 2
    },
    "margin_analysis": {
      "total_cost": 4200.00,
      "total_sell": 5250.00,
      "estimated_margin": 1050.00,
      "margin_percentage": 20.0
    }
  }
}
```

#### Workflow States
- **needed** → **sourcing** → **ordered** → **backordered** → **received** → **installed** → **returned** → **cancelled**

### Bulk Status Updates
**Endpoint:** `POST /bulk-update`

#### Description
Multi-select status updates with validation rules.

#### Request Body
```json
{
  "part_ids": ["string"],
  "new_status": "received",
  "vendor_id": "string",
  "notes": "string",
  "expected_date": "2024-09-15"
}
```

#### Response
```json
{
  "success": true,
  "message": "12 parts updated successfully",
  "data": {
    "updated_count": 12,
    "new_status": "received",
    "part_count": 12
  }
}
```

### Advanced Parts Search
**Endpoint:** `GET /search`

#### Query Parameters
- `q`: Search query (part number, description)
- `status`: Filter by status
- `vendor_id`: Filter by vendor
- `ro_number`: Filter by RO
- `priority`: Filter by priority
- `date_from`: Date range start
- `date_to`: Date range end
- `sort_by`: Sort field (default: created_at)
- `sort_order`: ASC/DESC (default: DESC)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)

#### Response
```json
{
  "success": true,
  "data": {
    "parts": [...],
    "search_metrics": {
      "total_found": 125,
      "page": 1,
      "per_page": 50,
      "total_pages": 3,
      "status_breakdown": {...},
      "total_value": 12500.00
    }
  }
}
```

### Vendor Quote Requests
**Endpoint:** `POST /vendor-quote`

#### Description
Request quotes from multiple vendors with pricing estimates.

#### Request Body
```json
{
  "part_requests": [
    {
      "part_number": "12345",
      "description": "Front Bumper",
      "quantity": 1,
      "oem_part_number": "OEM-12345"
    }
  ],
  "vendor_ids": ["string"],
  "urgent": false,
  "delivery_needed_by": "2024-09-20"
}
```

#### Response
```json
{
  "success": true,
  "message": "Quote requests sent to 3 vendors",
  "data": {
    "quote_requests": [
      {
        "quote_id": "QR-1234567890-PART",
        "vendor_name": "Parts Authority",
        "status": "requested",
        "part_count": 5,
        "total_estimated": "1250.00",
        "estimated_response_time": "24-48 hours"
      }
    ]
  }
}
```

### Margin Analysis
**Endpoint:** `GET /margin-analysis`

#### Query Parameters
- `ro_id`: Filter by repair order
- `vendor_id`: Filter by vendor
- `date_range`: Number of days (default: 30)

#### Response
```json
{
  "success": true,
  "data": {
    "overall_analysis": {
      "total_parts": 150,
      "total_sell_value": "25000.00",
      "total_cost_value": "18500.00",
      "total_margin": "6500.00",
      "margin_percentage": "26.00"
    },
    "vendor_analysis": {...},
    "status_analysis": {...}
  }
}
```

---

## 4. Scheduling & Capacity Management

### Base Routes
- `/api/scheduling`
- `/api/v1/scheduling`

### Real-Time Capacity Analysis
**Endpoint:** `GET /capacity`

#### Query Parameters
- `date`: Analysis date (default: today)
- `department`: Filter by department
- `view`: daily/weekly (default: daily)

#### Response
```json
{
  "success": true,
  "data": {
    "capacity_date": "2024-08-29",
    "view_mode": "daily",
    "capacity_by_department": {
      "body": {
        "department": "body",
        "total_technicians": 4,
        "available_technicians": 2,
        "total_capacity_hours": 32,
        "scheduled_hours": 28,
        "available_hours": 4,
        "utilization_percentage": "87.5",
        "bottlenecks": [],
        "next_available_slot": "today"
      }
    },
    "overall_metrics": {
      "total_technicians": 12,
      "overall_utilization": "82.5",
      "bottleneck_departments": ["paint"],
      "total_jobs_queued": 15
    }
  }
}
```

#### Departments
- **body**: Body work and frame straightening
- **paint**: Paint preparation and application
- **mechanical**: Mechanical repairs and assembly
- **detailing**: Final detailing and cleanup
- **adas_calibration**: ADAS calibration and testing

### Smart Scheduling
**Endpoint:** `POST /book`

#### Description
Smart scheduling with constraint handling and skills matrix.

#### Request Body
```json
{
  "ro_id": "string",
  "operations": [
    {
      "operation_type": "body_repair",
      "department": "body",
      "estimated_hours": 8,
      "required_skills": ["aluminum_repair"],
      "preferred_technician_id": "string",
      "parts_required": true
    }
  ],
  "priority": "normal" | "high" | "urgent",
  "customer_requested_date": "2024-09-20",
  "parts_availability": {...}
}
```

#### Response
```json
{
  "success": true,
  "message": "3 operations scheduled successfully",
  "data": {
    "scheduling_solution": {
      "ro_id": "string",
      "operations_scheduled": 3,
      "earliest_start": "2024-08-30T08:00:00Z",
      "estimated_completion": "2024-09-05T17:00:00Z",
      "total_duration_hours": 24
    },
    "scheduled_operations": [...],
    "constraints_applied": {
      "parts_constraints": {...},
      "skill_matching": true,
      "capacity_optimization": true
    }
  }
}
```

### Technician Availability
**Endpoint:** `GET /technicians`

#### Query Parameters
- `date`: Availability date (default: today)
- `department`: Filter by department
- `skill_filter`: Filter by skill/certification

#### Response
```json
{
  "success": true,
  "data": {
    "technicians": [
      {
        "technician_id": "string",
        "name": "John Smith",
        "employee_id": "EMP001",
        "departments": ["body", "paint"],
        "certifications": ["aluminum_repair", "frame_straightening"],
        "skill_level": "intermediate",
        "hourly_rate": 45.00,
        "availability": {
          "date": "2024-08-29",
          "total_hours": 8,
          "scheduled_hours": 6,
          "available_hours": 2,
          "utilization_percentage": "75.0",
          "next_available_slot": "today"
        },
        "performance_metrics": {
          "efficiency_score": 92.5,
          "quality_score": 88.0,
          "productivity_score": 90.2
        }
      }
    ],
    "summary": {
      "total_technicians": 12,
      "fully_available": 3,
      "partially_available": 6,
      "fully_booked": 3
    }
  }
}
```

### What-If Analysis
**Endpoint:** `POST /what-if`

#### Description
Scheduling scenario planning with comparison analysis.

#### Request Body
```json
{
  "scenarios": [
    {
      "name": "Standard Schedule",
      "operations": [...],
      "constraints": {...}
    },
    {
      "name": "Rush Schedule",
      "operations": [...],
      "constraints": {...}
    }
  ],
  "comparison_mode": "cost" | "time" | "quality" | "balanced"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "scenario_analysis": [...],
    "comparison_report": {...},
    "best_scenario": {...},
    "comparison_criteria": "balanced"
  }
}
```

### Smart ETA Calculations
**Endpoint:** `GET /smart-eta/:roId`

#### Query Parameters
- `include_confidence`: Include confidence analysis (default: true)
- `breakdown`: Include detailed breakdown (default: true)

#### Response
```json
{
  "success": true,
  "data": {
    "ro_id": "string",
    "smart_eta": {
      "estimated_completion_date": "2024-09-15",
      "estimated_completion_time": "17:00",
      "total_estimated_hours": 40,
      "remaining_hours": 28,
      "completion_probability": 85
    },
    "confidence_analysis": {
      "confidence_level": "high",
      "risk_factors": ["Parts delivery delays"],
      "mitigating_factors": ["Experienced technicians"]
    },
    "factors_considered": [
      "Historical data",
      "Parts availability",
      "Technician capacity",
      "Seasonal patterns"
    ]
  }
}
```

---

## 5. Loaner Fleet Management

### Base Routes
- `/api/loaners` or `/api/loaner-fleet`
- `/api/v1/loaners` or `/api/v1/loaner-fleet`

### Fleet Status
**Endpoint:** `GET /fleet`

#### Query Parameters
- `status`: Filter by vehicle status
- `vehicle_type`: Filter by vehicle type
- `availability_date`: Check availability for specific date

#### Response
```json
{
  "success": true,
  "data": {
    "fleet_vehicles": {
      "available": [...],
      "rented": [...],
      "maintenance": [...],
      "out_of_service": [...],
      "reserved": [...]
    },
    "fleet_metrics": {
      "total_fleet_size": 15,
      "currently_available": 8,
      "currently_rented": 5,
      "in_maintenance": 1,
      "out_of_service": 1,
      "utilization_rate": "33.3",
      "availability_rate": "53.3"
    },
    "availability_analysis": {
      "target_date": "2024-09-15",
      "available_vehicles": 10,
      "availability_percentage": "66.7"
    }
  }
}
```

### Create Reservation
**Endpoint:** `POST /reserve`

#### Description
Create loaner reservations with vehicle assignment and preferences.

#### Request Body
```json
{
  "customer_id": "string",
  "repair_order_id": "string",
  "vehicle_preferences": {
    "vehicle_type": "compact" | "sedan" | "suv",
    "features": ["automatic", "bluetooth"]
  },
  "pickup_date": "2024-09-01",
  "expected_return_date": "2024-09-05",
  "duration_days": 4,
  "notes": "string"
}
```

#### Response
```json
{
  "success": true,
  "message": "Loaner vehicle reserved successfully",
  "data": {
    "reservation": {
      "reservation_id": "string",
      "confirmation_number": "LC-12345678",
      "vehicle_assigned": {
        "vehicle_id": "string",
        "vehicle_number": "LV001",
        "make_model": "Honda Civic",
        "year": 2022,
        "license_plate": "ABC-123"
      },
      "pickup_details": {
        "pickup_date": "2024-09-01",
        "pickup_location": "Shop Location",
        "estimated_pickup_time": "09:00 AM"
      }
    },
    "next_steps": [
      "Customer will receive confirmation email/SMS",
      "Prepare vehicle inspection checklist"
    ]
  }
}
```

### Vehicle Checkout
**Endpoint:** `POST /check-out`

#### Description
Vehicle checkout with digital paperwork and inspection.

#### Request Body
```json
{
  "reservation_id": "string",
  "checkout_inspection": {
    "fuel_level": 0.8,
    "odometer_reading": 15000,
    "damage_notes": "Small scratch on rear bumper",
    "photos": ["photo1.jpg"],
    "cleanliness_rating": 5
  },
  "customer_agreement": {
    "signature": "base64-encoded-signature",
    "terms_accepted": true,
    "insurance_verified": true,
    "license_checked": true
  },
  "checkout_notes": "string"
}
```

#### Response
```json
{
  "success": true,
  "message": "Vehicle checked out successfully",
  "data": {
    "checkout_confirmation": {
      "checkout_id": "CO-1234567890",
      "checkout_details": {...},
      "return_instructions": {
        "return_by": "2024-09-05",
        "return_location": "Shop Location",
        "emergency_contact": "Shop Phone Number"
      }
    }
  }
}
```

### Vehicle Check-In
**Endpoint:** `POST /check-in`

#### Description
Return processing with damage assessment and additional charges.

#### Request Body
```json
{
  "reservation_id": "string",
  "return_inspection": {
    "fuel_level": 0.3,
    "odometer_reading": 15250,
    "damage_assessment": {
      "new_damage_found": false,
      "damage_description": "",
      "estimated_repair_cost": 0
    },
    "cleanliness_rating": 4,
    "interior_condition": "good",
    "exterior_condition": "good"
  },
  "additional_charges": {
    "fuel_charge": 25.00,
    "cleaning_charge": 0,
    "damage_charge": 0
  },
  "return_notes": "string"
}
```

#### Response
```json
{
  "success": true,
  "message": "Vehicle returned successfully",
  "data": {
    "return_confirmation": {
      "return_id": "RI-1234567890",
      "usage_summary": {
        "rental_duration_days": 4,
        "miles_driven": 250,
        "average_miles_per_day": "62.5"
      },
      "financial_summary": {
        "total_additional": 25.00,
        "payment_due": true
      },
      "vehicle_status": "available"
    }
  }
}
```

### Fleet Utilization Analytics
**Endpoint:** `GET /utilization`

#### Query Parameters
- `period`: Analysis period in days (default: 30)
- `vehicle_id`: Filter by specific vehicle
- `detailed`: Include detailed metrics (default: false)

#### Response
```json
{
  "success": true,
  "data": {
    "utilization_period": {
      "start_date": "2024-07-30",
      "end_date": "2024-08-29",
      "days_analyzed": 30
    },
    "utilization_metrics": {
      "total_fleet_size": 15,
      "analysis_period_days": 30,
      "total_rental_days": 180,
      "utilization_rate": "40.0",
      "average_rental_duration": "4.5"
    },
    "recommendations": [
      "Fleet utilization is healthy at 40%",
      "Consider marketing to increase usage"
    ]
  }
}
```

---

## 6. Customer Communication System

### Base Routes
- `/api/customer-communication`
- `/api/v1/customer-communication`

### Send Communication
**Endpoint:** `POST /send`

#### Description
Multi-channel communication with template processing and automation.

#### Request Body
```json
{
  "customer_id": "string",
  "template_id": "string",
  "channels": ["sms", "email", "portal"],
  "message": {
    "subject": "Repair Update",
    "content": "Your vehicle repair is progressing well...",
    "variables": {
      "repair_stage": "Paint"
    }
  },
  "priority": "normal" | "high" | "urgent",
  "scheduled_send": "2024-08-30T09:00:00Z",
  "ro_id": "string",
  "communication_type": "repair_update"
}
```

#### Response
```json
{
  "success": true,
  "message": "Communication sent successfully",
  "data": {
    "communication_id": "string",
    "delivery_summary": {
      "channels_attempted": ["sms", "email"],
      "successful_deliveries": 2,
      "failed_deliveries": 0,
      "delivery_results": [
        {
          "channel": "sms",
          "success": true,
          "delivery_id": "SMS-1234567890"
        }
      ]
    },
    "next_steps": [
      "Monitor delivery confirmation",
      "Track customer response"
    ]
  }
}
```

### Automated Communication Triggers
**Endpoint:** `POST /auto-trigger`

#### Description
Event-based automated communication triggers.

#### Request Body
```json
{
  "trigger_event": "repair_completed" | "parts_arrived" | "ready_for_pickup",
  "ro_id": "string",
  "event_data": {
    "completion_date": "2024-08-30",
    "pickup_instructions": "Please call to schedule pickup"
  },
  "override_settings": {
    "channels": ["sms", "email"],
    "variables": {...}
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Automated communication triggered successfully",
  "data": {
    "communication_id": "string",
    "trigger_event": "repair_completed",
    "automation_template": "Repair Completion Notice",
    "delivery_summary": {
      "channels_used": ["sms", "email"],
      "successful_deliveries": 2
    }
  }
}
```

### Communication History
**Endpoint:** `GET /history/:customerId`

#### Query Parameters
- `limit`: Number of records (default: 50)
- `offset`: Pagination offset (default: 0)
- `channel`: Filter by communication channel
- `communication_type`: Filter by communication type
- `date_from`: Start date filter
- `date_to`: End date filter
- `include_timeline`: Include timeline entries (default: true)

#### Response
```json
{
  "success": true,
  "data": {
    "customer_id": "string",
    "communication_history": [
      {
        "communication_id": "string",
        "communication_type": "repair_update",
        "subject": "Repair Progress Update",
        "channels": ["email", "sms"],
        "status": "sent",
        "priority": "normal",
        "automated": true,
        "created_date": "2024-08-29T10:00:00Z",
        "delivery_success": true
      }
    ],
    "timeline_entries": [...],
    "analytics": {
      "total_communications": 25,
      "successful_communications": 24,
      "success_rate": "96.0",
      "automated_communications": 18,
      "automation_rate": "72.0"
    }
  }
}
```

### Communication Templates
**Endpoint:** `POST /templates`

#### Description
Create and manage communication templates with automation rules.

#### Request Body
```json
{
  "name": "Parts Arrival Notification",
  "category": "parts_updates",
  "communication_type": "parts_arrived",
  "subject": "Parts Arrived - {{ro_number}}",
  "message_content": "Hello {{customer_first_name}}, the parts for your {{ro_number}} have arrived and we can now proceed with repairs.",
  "default_channels": ["sms", "email"],
  "automated": true,
  "trigger_events": ["parts_received"],
  "automation_rules": {
    "only_business_hours": true,
    "min_job_value": 500
  },
  "variables": ["customer_first_name", "ro_number"]
}
```

**Endpoint:** `GET /templates`

#### Query Parameters
- `category`: Filter by template category
- `automated`: Filter automated templates (true/false)
- `communication_type`: Filter by communication type

#### Response
```json
{
  "success": true,
  "data": {
    "templates_by_category": {
      "repair_updates": [...],
      "parts_notifications": [...],
      "scheduling": [...]
    },
    "automation_templates": [...],
    "template_categories": ["repair_updates", "parts_notifications"],
    "total_templates": 25,
    "automated_templates": 15
  }
}
```

### Bulk Communications
**Endpoint:** `POST /bulk-send`

#### Description
Send bulk communications to up to 100 recipients.

#### Request Body
```json
{
  "recipient_type": "customers" | "active_jobs" | "custom_list",
  "recipients": ["customer_id1", "customer_id2"],
  "template_id": "string",
  "message": {
    "subject": "Shop Newsletter",
    "content": "Monthly newsletter content..."
  },
  "channels": ["email"],
  "priority": "normal",
  "scheduled_send": "2024-08-30T09:00:00Z"
}
```

#### Response
```json
{
  "success": true,
  "message": "Bulk communication completed: 45 sent, 2 failed",
  "data": {
    "bulk_job_id": "BULK-1234567890",
    "summary": {
      "total_recipients": 47,
      "successful_sends": 45,
      "failed_sends": 2,
      "success_rate": "95.7"
    },
    "delivery_results": [...]
  }
}
```

---

## 7. Quality Control & Compliance

### Base Routes
- `/api/qc` or `/api/quality-control`
- `/api/v1/qc` or `/api/v1/quality-control`

### Quality Checklists
**Endpoint:** `POST /checklist`

#### Description
Stage-specific quality checklists with pass/fail tracking.

#### Request Body
```json
{
  "ro_id": "string",
  "stage": "body_work" | "paint" | "final_inspection",
  "checklist_items": [
    {
      "item_id": "body_alignment_check",
      "description": "Body panel alignment check",
      "category": "structural",
      "status": "pass" | "fail" | "na",
      "notes": "All panels properly aligned",
      "requires_photo": true,
      "photo_attachments": ["photo1.jpg"]
    }
  ],
  "overall_status": "pass" | "fail" | "conditional",
  "inspector_id": "string",
  "inspection_notes": "Overall quality meets standards",
  "reinspection_required": false
}
```

#### Response
```json
{
  "success": true,
  "message": "Quality inspection passed for body_work stage",
  "data": {
    "qc_record": {
      "qc_id": "QC-1234567890",
      "ro_id": "string",
      "stage": "body_work",
      "inspector": "John Smith",
      "overall_status": "pass",
      "compliance_status": {
        "level": "compliant",
        "compliance_score": "98.5"
      }
    },
    "checklist_summary": {
      "total_items": 15,
      "passed_items": 15,
      "failed_items": 0,
      "pass_percentage": "100.0"
    },
    "compliance_certificate": {
      "certificate_id": "CERT-1234567890",
      "certificate_type": "qc_body_work",
      "status": "valid"
    }
  }
}
```

### Photo Validation
**Endpoint:** `POST /photos`

#### Description
Required photo capture with validation and compliance checking.

#### Request Body
```json
{
  "ro_id": "string",
  "stage": "damage_assessment",
  "photo_requirements": [
    {
      "requirement_id": "damage_photos",
      "description": "Initial damage documentation",
      "category": "damage_assessment",
      "required": true,
      "photo_urls": ["photo1.jpg", "photo2.jpg"],
      "verification_notes": "All damage areas documented"
    }
  ],
  "photographer_id": "string",
  "verification_complete": true
}
```

#### Response
```json
{
  "success": true,
  "message": "Photo verification complete - 100.0% complete",
  "data": {
    "verification_report": {
      "verification_id": "PV-1234567890",
      "completion_percentage": "100.0",
      "overall_status": "complete"
    },
    "photo_validation_results": [...],
    "compliance_check": {
      "compliant": true,
      "compliance_percentage": "100.0"
    }
  }
}
```

### Compliance Requirements
**Endpoint:** `GET /compliance/:roId`

#### Description
ADAS scan and calibration requirements with regulatory compliance.

#### Response
```json
{
  "success": true,
  "data": {
    "ro_id": "string",
    "vehicle_info": {
      "year": 2020,
      "make": "Honda",
      "model": "Accord",
      "vin": "1HGCV1F3XLA123456"
    },
    "adas_requirements": {
      "adas_equipped": true,
      "systems_detected": ["FCW", "AEB", "LKA"],
      "calibration_needed": true,
      "requirements": [
        "Pre-scan required",
        "Post-repair scan required",
        "Dynamic calibration required"
      ],
      "estimated_time": 2.5
    },
    "calibration_status": {
      "pre_scan_completed": true,
      "post_scan_completed": false,
      "calibration_completed": false
    },
    "overall_compliance": {
      "compliance_level": "partial",
      "completion_percentage": "33.3",
      "pending_items": ["post_scan", "calibration"]
    }
  }
}
```

### Re-Inspection
**Endpoint:** `POST /inspection`

#### Description
Re-inspection forms and punch-lists with escalation workflows.

#### Request Body
```json
{
  "original_inspection_id": "string",
  "ro_id": "string",
  "reinspection_items": [
    {
      "original_item_id": "paint_finish_check",
      "issue_description": "Minor orange peel in paint finish",
      "corrective_action_taken": "Paint section re-sprayed and polished",
      "verification_photos": ["after_repair.jpg"],
      "status": "resolved" | "pending" | "escalated"
    }
  ],
  "inspector_id": "string",
  "reinspection_type": "partial" | "full",
  "punch_list_complete": true
}
```

#### Response
```json
{
  "success": true,
  "message": "Re-inspection passed - 100.0% resolved",
  "data": {
    "reinspection_report": {
      "reinspection_id": "string",
      "overall_status": "passed",
      "resolution_rate": "100.0",
      "items_summary": {
        "total_items": 3,
        "resolved": 3,
        "pending": 0,
        "escalated": 0
      }
    },
    "next_steps": [
      "All items resolved",
      "Proceed to next stage"
    ]
  }
}
```

### Compliance Certificates
**Endpoint:** `GET /certificates/:roId`

#### Query Parameters
- `certificate_type`: Filter by certificate type
- `include_drafts`: Include draft certificates (default: false)

#### Response
```json
{
  "success": true,
  "data": {
    "ro_id": "string",
    "certificates": [
      {
        "certificate_id": "CERT-001",
        "certificate_type": "qc_final_inspection",
        "status": "valid",
        "issue_date": "2024-08-29",
        "inspector": "Quality Inspector",
        "compliance_score": "98.5"
      }
    ],
    "missing_certificates": [
      {
        "certificate_type": "adas_calibration",
        "description": "ADAS Calibration Certificate",
        "required_by": "Vehicle has ADAS systems"
      }
    ],
    "compliance_score": {
      "overall_score": 92.5,
      "quality_score": 95.0,
      "compliance_score": 90.0
    },
    "regulatory_compliance": {
      "dot_compliant": true,
      "nhtsa_compliant": true,
      "state_inspection_ready": true
    }
  }
}
```

---

## Error Handling

All API endpoints return consistent error responses:

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "details": { ... }
}
```

### Common HTTP Status Codes
- **200 OK**: Success
- **201 Created**: Resource created
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

---

## Real-Time Updates

All major operations broadcast real-time updates via Socket.io:

### Event Types
- `po_update`: Purchase order changes
- `parts_update`: Parts status changes
- `scheduling_update`: Scheduling changes
- `loaner_update`: Fleet status changes
- `communication_update`: Communication events
- `qc_update`: Quality control updates

### Example Socket Event
```javascript
socket.on('parts_update', (data) => {
  console.log('Parts update:', data);
  // {
  //   part_id: "string",
  //   part_number: "12345",
  //   old_status: "ordered",
  //   new_status: "received",
  //   updated_by: "user123"
  // }
});
```

---

## Integration Features

### Third-Party System Hooks
All major operations include hooks for:
- **Mitchell**: Estimate integration
- **Audatex**: Damage assessment
- **DMS**: Dealership management systems
- **Parts suppliers**: Automated ordering
- **SMS/Email providers**: Communication delivery
- **Payment processors**: Financial transactions

### Webhook Support
Configure webhooks for external system notifications on:
- Job status changes
- Parts availability updates
- Completion notifications
- Quality checkpoints

---

## Performance Considerations

### Optimization Features
- **Database indexing**: Optimized queries for all search operations
- **Caching**: 5-minute cache for frequently accessed data
- **Pagination**: All list endpoints support pagination
- **Background processing**: Long-running operations handled asynchronously
- **Rate limiting**: Protects against API abuse
- **Query optimization**: Efficient database operations with relationship loading

### Scalability
- **Modular architecture**: Independent service scaling
- **Database sharding**: Multi-shop support
- **Load balancing**: Horizontal scaling support
- **Monitoring**: Built-in performance metrics
- **Error tracking**: Comprehensive error logging

---

This comprehensive API documentation covers all Phase 2 backend development features for CollisionOS, providing enterprise-grade collision repair management capabilities with professional workflow automation, vendor integration, customer communication, and quality control systems.