const QRCode = require('qrcode');

/**
 * QR Code Service for generating RO-specific QR codes
 * Enables technicians to quickly punch in/out on specific repair orders
 */

class QRCodeService {
  /**
   * Generate QR code for a repair order
   * @param {Object} ro - Repair order object
   * @returns {Promise<string>} Base64 encoded QR code image
   */
  async generateROQRCode(ro) {
    try {
      const qrData = {
        type: 'repair_order',
        roId: ro.id,
        roNumber: ro.jobNumber || ro.ro_number,
        vehicle: {
          year: ro.vehicle?.year,
          make: ro.vehicle?.make,
          model: ro.vehicle?.model,
        },
        customer: {
          name: ro.customer?.name || `${ro.customer?.firstName} ${ro.customer?.lastName}`,
        },
        timestamp: new Date().toISOString(),
      };

      const qrDataString = JSON.stringify(qrData);

      // Generate QR code as base64 data URL
      const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as buffer (for printing)
   * @param {Object} ro - Repair order object
   * @returns {Promise<Buffer>} QR code image buffer
   */
  async generateROQRCodeBuffer(ro) {
    try {
      const qrData = {
        type: 'repair_order',
        roId: ro.id,
        roNumber: ro.jobNumber || ro.ro_number,
        vehicle: {
          year: ro.vehicle?.year,
          make: ro.vehicle?.make,
          model: ro.vehicle?.model,
        },
        customer: {
          name: ro.customer?.name || `${ro.customer?.firstName} ${ro.customer?.lastName}`,
        },
        timestamp: new Date().toISOString(),
      };

      const qrDataString = JSON.stringify(qrData);

      // Generate QR code as buffer
      const qrCodeBuffer = await QRCode.toBuffer(qrDataString, {
        errorCorrectionLevel: 'H',
        type: 'png',
        quality: 0.95,
        margin: 1,
        width: 300,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeBuffer;
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Validate QR code data
   * @param {string} qrDataString - QR code data string
   * @returns {Object|null} Parsed QR data or null if invalid
   */
  validateQRCode(qrDataString) {
    try {
      const qrData = JSON.parse(qrDataString);

      // Validate required fields
      if (
        qrData.type === 'repair_order' &&
        qrData.roId &&
        qrData.roNumber
      ) {
        return qrData;
      }

      return null;
    } catch (error) {
      console.error('Invalid QR code data:', error);
      return null;
    }
  }

  /**
   * Generate batch QR codes for multiple ROs
   * @param {Array} ros - Array of repair order objects
   * @returns {Promise<Array>} Array of objects with roId and qrCode
   */
  async generateBatchQRCodes(ros) {
    try {
      const qrCodes = await Promise.all(
        ros.map(async (ro) => {
          const qrCode = await this.generateROQRCode(ro);
          return {
            roId: ro.id,
            roNumber: ro.jobNumber || ro.ro_number,
            qrCode,
          };
        })
      );

      return qrCodes;
    } catch (error) {
      console.error('Error generating batch QR codes:', error);
      throw new Error('Failed to generate batch QR codes');
    }
  }

  /**
   * Generate technician badge QR code
   * @param {Object} technician - Technician user object
   * @returns {Promise<string>} Base64 encoded QR code image
   */
  async generateTechnicianBadgeQRCode(technician) {
    try {
      const qrData = {
        type: 'technician',
        technicianId: technician.id,
        name: technician.name,
        badgeNumber: technician.employeeId || technician.id,
        timestamp: new Date().toISOString(),
      };

      const qrDataString = JSON.stringify(qrData);

      const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 200,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating technician badge QR code:', error);
      throw new Error('Failed to generate technician badge QR code');
    }
  }
}

module.exports = new QRCodeService();
