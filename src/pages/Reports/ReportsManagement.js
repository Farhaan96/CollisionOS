import React from 'react';
import { Box } from '@mui/material';
import ReportingSystem from '../../components/Reports/ReportingSystem';

const ReportsManagement = () => {
  const handleReportGenerate = (report, filters) => {
    console.log('Generating report:', report.name, 'with filters:', filters);
    // Implement report generation logic
  };

  const handleReportSchedule = reportConfig => {
    console.log('Scheduling report:', reportConfig);
    // Implement report scheduling logic
  };

  return (
    <Box sx={{ p: 3 }}>
      <ReportingSystem
        onReportGenerate={handleReportGenerate}
        onReportSchedule={handleReportSchedule}
      />
    </Box>
  );
};

export default ReportsManagement;
