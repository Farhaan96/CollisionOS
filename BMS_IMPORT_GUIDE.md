# BMS File Import Guide

## Overview

The CollisionOS BMS (Body Management System) file import functionality allows you to automatically import Mitchell Estimating BMS XML files into your CollisionOS system. This feature extracts all relevant information from BMS files and creates or updates customers, vehicles, and jobs in your database.

## What are BMS Files?

BMS (Body Management System) files are XML documents created by Mitchell Estimating software that contain detailed auto body repair estimates. These files include comprehensive information about:

- **Customer Information**: Policy holder details, contact information, addresses
- **Vehicle Information**: VIN, make, model, year, color, options, condition
- **Claim Information**: Claim numbers, policy details, loss information
- **Damage Assessment**: Detailed line items for parts, labor, and materials
- **Pricing**: Parts prices, labor rates, materials, taxes, and totals
- **Insurance Details**: Insurance company, adjuster information, coverage details

## Supported File Format

The system supports standard Mitchell Estimating BMS XML files with the following characteristics:

- **File Extension**: `.xml`
- **Format**: XML (eXtensible Markup Language)
- **Schema**: Cieca BMS (Body Management System) standard
- **Encoding**: UTF-8
- **Version**: BMS 5.2.22 (and compatible versions)

## How to Use BMS Import

### 1. Access the BMS Import Page

Navigate to the BMS Import page in your CollisionOS application. This page provides a comprehensive interface for uploading and processing BMS files.

### 2. Upload BMS Files

You can upload BMS files in several ways:

#### Drag and Drop

- Simply drag one or more BMS XML files from your file explorer
- Drop them onto the upload area
- The system will automatically process the files

#### Click to Browse

- Click on the upload area to open a file browser
- Select one or more BMS XML files
- Click "Open" to start processing

#### Multiple File Upload

- You can upload multiple BMS files at once
- The system will process them sequentially
- Progress is shown for each file

### 3. Monitor Processing

During file processing, you can monitor:

- **Progress Bar**: Shows overall processing progress
- **File Status**: Success/error indicators for each file
- **Processing Details**: Real-time updates on what's being processed

### 4. Review Results

After processing, you can:

- **View File Details**: Expand each file to see parsed information
- **Download Parsed Data**: Export the parsed JSON data for review
- **Remove Files**: Delete files from the processed list
- **View Statistics**: See import statistics and totals

## What Gets Imported

### Customer Information

- First and last name
- Email address
- Phone number
- Address (street, city, state/province, postal code)
- Customer type (policy holder)

### Vehicle Information

- VIN (Vehicle Identification Number)
- License plate and state/province
- Year, make, model, and sub-model
- Body style and vehicle type
- Engine and transmission details
- Exterior and interior colors
- Odometer reading and unit
- Vehicle condition and prior damage
- Vehicle valuation

### Job/Estimate Information

- Claim number
- Policy number
- Insurance company
- Adjuster information
- Loss date and description
- Damage description
- Deductible amount
- Labor totals
- Parts totals
- Materials totals
- Gross and net totals

### Parts Information

- Part numbers (OEM and aftermarket)
- Part descriptions
- Prices (OEM and selected)
- Quantities
- Suppliers
- Part types and source codes

### Labor Information

- Labor types (body, paint, mechanical, etc.)
- Labor operations
- Hours (calculated and database)
- Paint stages
- Labor rates

### Materials Information

- Material types
- Paint materials
- Shop materials
- Hazardous waste
- Pricing and calculations

## System Requirements

### Software Requirements

- CollisionOS application running
- Modern web browser with JavaScript enabled
- File upload support

### File Requirements

- Valid BMS XML format
- File size under 10MB (configurable)
- Proper XML encoding (UTF-8)

### Network Requirements

- Stable internet connection for file upload
- Sufficient bandwidth for large files

## Error Handling

### Common Errors and Solutions

#### Invalid XML Format

**Error**: "Failed to parse BMS file"
**Solution**: Ensure the file is a valid BMS XML document from Mitchell Estimating

#### Missing Required Fields

**Error**: "Policy holder information is required"
**Solution**: BMS files must contain customer/policy holder information

#### File Size Too Large

**Error**: "File size exceeds limit"
**Solution**: Check file size and compress if necessary

#### Network Issues

**Error**: "Upload failed"
**Solution**: Check internet connection and try again

### Error Recovery

- Failed uploads can be retried
- Partial imports are handled gracefully
- Error logs are maintained for troubleshooting

## Best Practices

### File Preparation

1. **Validate Files**: Ensure BMS files are complete and valid
2. **Check Format**: Verify files are in the correct BMS XML format
3. **Review Content**: Check that all required information is present
4. **Backup Files**: Keep original BMS files as backup

### Upload Process

1. **Batch Uploads**: Upload multiple files in batches for efficiency
2. **Monitor Progress**: Watch the progress indicators during processing
3. **Review Results**: Check processed files for accuracy
4. **Verify Data**: Confirm imported data in the main application

### Data Management

1. **Regular Imports**: Import BMS files regularly to keep data current
2. **Data Validation**: Review imported data for accuracy
3. **Duplicate Handling**: Check for duplicate customers/vehicles
4. **Data Cleanup**: Remove old or invalid import records

## Integration with CollisionOS

### Automatic Data Creation

When a BMS file is imported, the system automatically:

1. **Creates Customer Records**: New customers are added to the customer database
2. **Creates Vehicle Records**: New vehicles are linked to customers
3. **Creates Job Records**: New jobs/estimates are created with all line items
4. **Imports Parts**: Parts information is added to the parts management system
5. **Imports Labor**: Labor operations are added to the job
6. **Calculates Totals**: All pricing and totals are calculated

### Data Updates

- Existing customers are updated with new information
- Existing vehicles are updated if VIN matches
- Job information is preserved and can be modified

### System Integration

- Imported data appears in all relevant CollisionOS modules
- Customers appear in the customer management system
- Vehicles appear in the vehicle management system
- Jobs appear in the production board and job management
- Parts appear in the parts management system

## Troubleshooting

### File Upload Issues

1. **Check File Format**: Ensure files are valid BMS XML
2. **Check File Size**: Verify files are under size limit
3. **Check Network**: Ensure stable internet connection
4. **Clear Browser Cache**: Try clearing browser cache and cookies

### Processing Issues

1. **Check File Content**: Verify BMS file contains required data
2. **Check System Status**: Ensure database and storage are available
3. **Review Error Messages**: Check specific error details
4. **Contact Support**: If issues persist, contact technical support

### Data Issues

1. **Verify Import**: Check that data was imported correctly
2. **Review Duplicates**: Look for duplicate records
3. **Check Relationships**: Verify customer-vehicle-job relationships
4. **Validate Totals**: Confirm pricing and calculations are correct

## Support and Contact

### Technical Support

For technical issues with BMS import functionality:

- Email: support@collisionos.com
- Phone: (555) 123-4567
- Hours: Monday-Friday 8AM-6PM EST

### Documentation

- User Guide: Available in the application help section
- API Documentation: Available for developers
- Video Tutorials: Available on the support website

### Training

- Online training sessions available
- Custom training for your team
- Certification programs for advanced users

## Future Enhancements

### Planned Features

- **Batch Processing**: Enhanced batch upload capabilities
- **Auto-Import**: Scheduled automatic imports
- **Advanced Validation**: Enhanced data validation rules
- **Integration APIs**: Additional integration options
- **Mobile Support**: Mobile app import functionality

### Customization Options

- **Custom Fields**: Support for custom BMS fields
- **Business Rules**: Configurable business logic
- **Workflow Integration**: Integration with custom workflows
- **Reporting**: Enhanced import reporting and analytics

## Security and Privacy

### Data Security

- All uploaded files are processed securely
- File contents are encrypted during transmission
- Access to imported data is controlled by user permissions
- Audit logs track all import activities

### Privacy Protection

- Customer information is protected according to privacy laws
- Data retention policies are enforced
- Export controls prevent unauthorized data access
- Regular security audits are conducted

## Conclusion

The BMS file import functionality provides a powerful and efficient way to import auto body repair estimates into your CollisionOS system. By following the guidelines in this document, you can ensure successful imports and maximize the value of your BMS data.

For additional support or questions, please contact the CollisionOS support team.
