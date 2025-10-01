# Common Components - ResizableChart & ChartSettingsDialog

This directory contains reusable common components for the CollisionOS application.

## Components

### ResizableChart

A wrapper component that makes any chart resizable and adds settings functionality.

**Features:**
- Drag corners/edges to resize charts
- Min height: 250px, Max height: 800px
- Persistent size storage in localStorage
- Settings button in top-right corner
- Professional styling with MUI theme
- Visual resize indicator

**Usage:**
```jsx
import { ResizableChart } from '../../components/Common';
import { KPIChart } from '../../components/Dashboard/KPIChart';

function MyDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <ResizableChart
      title="Revenue Trend"
      defaultHeight={400}
      chartId="revenue-chart"
      onSettingsClick={() => setSettingsOpen(true)}
    >
      <KPIChart data={chartData} type="line" />
    </ResizableChart>
  );
}
```

**Props:**
- `title` (string): Chart title for identification
- `defaultHeight` (number): Default height in pixels (default: 400)
- `chartId` (string, required): Unique ID for localStorage persistence
- `onSettingsClick` (function): Callback when settings icon is clicked
- `children` (ReactNode): Chart component to render

---

### ChartSettingsDialog

Configuration dialog for customizing chart appearance and behavior.

**Features:**
- Chart type selection (line, bar, pie, doughnut)
- 5 color scheme options (default, cool, warm, nature, monochrome)
- Display toggles (legend, grid, animation, gradient)
- Export as PNG (placeholder for html2canvas integration)
- Settings persistence in localStorage
- Reset to defaults functionality

**Usage:**
```jsx
import { ChartSettingsDialog } from '../../components/Common';

function MyComponent() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chartSettings, setChartSettings] = useState({
    chartType: 'line',
    colorScheme: 'default',
    showLegend: true,
    animated: true,
    gradient: true,
  });

  return (
    <ChartSettingsDialog
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      chartId="my-chart"
      defaultSettings={chartSettings}
      onSettingsChange={(newSettings) => {
        setChartSettings(newSettings);
        setSettingsOpen(false);
      }}
    />
  );
}
```

**Props:**
- `open` (boolean, required): Whether dialog is open
- `onClose` (function, required): Callback when dialog closes
- `chartId` (string, required): Unique chart identifier for persistence
- `defaultSettings` (object): Default settings object
- `onSettingsChange` (function): Callback when settings are saved

**Settings Object Structure:**
```javascript
{
  chartType: 'line' | 'bar' | 'pie' | 'doughnut',
  colorScheme: 'default' | 'cool' | 'warm' | 'nature' | 'monochrome',
  showLegend: boolean,
  showGrid: boolean,
  animated: boolean,
  gradient: boolean
}
```

---

## Integration Example

Complete example integrating both components:

```jsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import { ResizableChart, ChartSettingsDialog } from '../../components/Common';
import { KPIChart } from '../../components/Dashboard/KPIChart';

function AnalyticsDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chartSettings, setChartSettings] = useState({
    chartType: 'line',
    colorScheme: 'default',
    showLegend: true,
    animated: true,
    gradient: true,
  });

  const chartData = [
    { label: 'Jan', value: 95000 },
    { label: 'Feb', value: 108000 },
    { label: 'Mar', value: 112000 },
    { label: 'Apr', value: 125000 },
  ];

  return (
    <Box>
      <ResizableChart
        title="Revenue Trend"
        defaultHeight={400}
        chartId="revenue-chart"
        onSettingsClick={() => setSettingsOpen(true)}
      >
        <KPIChart
          data={chartData}
          type={chartSettings.chartType}
          height={300}
          currency={true}
          animated={chartSettings.animated}
          gradient={chartSettings.gradient}
        />
      </ResizableChart>

      <ChartSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        chartId="revenue-chart"
        defaultSettings={chartSettings}
        onSettingsChange={(newSettings) => {
          setChartSettings(newSettings);
          setSettingsOpen(false);
        }}
      />
    </Box>
  );
}
```

---

## Testing

Tests are located in `__tests__/` directory:
- `ResizableChart.test.js` - Tests for ResizableChart component
- `ChartSettingsDialog.test.js` - Tests for ChartSettingsDialog component

Run tests:
```bash
npm test -- --testPathPattern="ResizableChart|ChartSettingsDialog"
```

---

## Dependencies

- `re-resizable` - For chart resizing functionality (already installed)
- `@mui/material` - Material-UI components
- `@mui/icons-material` - Material-UI icons

---

## LocalStorage Keys

Components use the following localStorage keys:
- `chart-size-{chartId}` - Stores chart size preferences
- `chart-settings-{chartId}` - Stores chart settings

Example:
```javascript
// Chart size
localStorage.getItem('chart-size-revenue-chart')
// Returns: {"height": 450}

// Chart settings
localStorage.getItem('chart-settings-revenue-chart')
// Returns: {"chartType":"line","colorScheme":"default",...}
```

---

## Styling

Both components use MUI theme for consistent styling:
- Theme-aware colors
- Responsive design
- Dark mode support
- Professional animations and transitions

---

## Future Enhancements

Potential improvements:
1. **Export Functionality**: Integrate html2canvas or Chart.js export
2. **More Chart Types**: Add area, scatter, radar charts
3. **Custom Color Picker**: Allow users to create custom color schemes
4. **Chart Templates**: Save/load chart configurations as templates
5. **Responsive Breakpoints**: Auto-adjust chart size based on screen size
6. **Full Screen Mode**: Add full-screen chart viewing
7. **Print Optimization**: Print-friendly chart rendering

---

## Notes

- Chart resizing is smooth and performant using `re-resizable`
- Settings persist across page refreshes via localStorage
- Components are fully accessible with ARIA labels
- Works with any chart library (Chart.js, Recharts, etc.)
- Tested with React 18 and MUI v7

---

## Support

For issues or questions, refer to:
- Project documentation: `/CLAUDE.md`
- Frontend progress: `.claude/project_updates/frontend_progress.md`
- Component tests for usage examples
