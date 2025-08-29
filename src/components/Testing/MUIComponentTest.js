import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Switch,
  Slider,
  Chip,
  Alert,
  LinearProgress,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Settings,
  Home,
  Person,
  Email,
  Phone,
  LocationOn,
  Star,
  Favorite,
  Share,
  MoreVert,
  CheckCircle,
  Warning,
  Error,
  Info,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

/**
 * Comprehensive MUI Component Test Suite
 * Tests all major MUI components for compatibility and rendering
 */
export default function MUIComponentTest() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [textValue, setTextValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(30);
  const [dateValue, setDateValue] = useState(dayjs());
  const [timeValue, setTimeValue] = useState(dayjs());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Sample data for DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'firstName', headerName: 'First name', width: 150 },
    { field: 'lastName', headerName: 'Last name', width: 150 },
    { field: 'age', headerName: 'Age', type: 'number', width: 110 },
    { field: 'email', headerName: 'Email', width: 200 },
  ];

  const rows = [
    { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35, email: 'jon@example.com' },
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42, email: 'cersei@example.com' },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45, email: 'jaime@example.com' },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16, email: 'arya@example.com' },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null, email: 'daenerys@example.com' },
  ];

  // Sample table data
  const tableData = [
    { name: 'John Doe', role: 'Admin', status: 'Active', email: 'john@example.com' },
    { name: 'Jane Smith', role: 'User', status: 'Inactive', email: 'jane@example.com' },
    { name: 'Bob Johnson', role: 'Manager', status: 'Active', email: 'bob@example.com' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" color="primary">
        MUI Component Test Suite
      </Typography>
      
      <Typography variant="subtitle1" align="center" color="textSecondary" paragraph>
        Comprehensive test of all MUI components to verify compatibility and rendering
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Components */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Basic Components
              </Typography>
              
              <Stack spacing={2}>
                <Button variant="contained" startIcon={<Add />}>
                  Primary Button
                </Button>
                
                <Button variant="outlined" endIcon={<Edit />}>
                  Secondary Button
                </Button>
                
                <TextField
                  label="Text Input"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  fullWidth
                  helperText="Enter some text"
                />
                
                <FormControl fullWidth>
                  <InputLabel>Select Option</InputLabel>
                  <Select
                    value={selectValue}
                    label="Select Option"
                    onChange={(e) => setSelectValue(e.target.value)}
                  >
                    <MenuItem value="option1">Option 1</MenuItem>
                    <MenuItem value="option2">Option 2</MenuItem>
                    <MenuItem value="option3">Option 3</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkboxValue}
                      onChange={(e) => setCheckboxValue(e.target.checked)}
                    />
                  }
                  label="Checkbox Option"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={switchValue}
                      onChange={(e) => setSwitchValue(e.target.checked)}
                    />
                  }
                  label="Switch Option"
                />
                
                <Box>
                  <Typography gutterBottom>Slider Value: {sliderValue}</Typography>
                  <Slider
                    value={sliderValue}
                    onChange={(e, value) => setSliderValue(value)}
                    min={0}
                    max={100}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Icons and Feedback */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Icons & Feedback
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Material Icons</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {[Home, Person, Email, Phone, LocationOn, Star, Favorite, Share, Settings].map((Icon, index) => (
                      <Tooltip key={index} title={`Icon ${index + 1}`}>
                        <IconButton color="primary">
                          <Icon />
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Stack>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Chips</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label="Default" />
                    <Chip label="Primary" color="primary" />
                    <Chip label="Secondary" color="secondary" />
                    <Chip label="Deletable" onDelete={() => {}} />
                    <Chip label="Clickable" onClick={() => {}} icon={<Star />} />
                  </Stack>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Alerts</Typography>
                  <Stack spacing={1}>
                    <Alert severity="success" icon={<CheckCircle />}>
                      Success alert with custom icon
                    </Alert>
                    <Alert severity="warning" icon={<Warning />}>
                      Warning alert message
                    </Alert>
                    <Alert severity="error" icon={<Error />}>
                      Error alert message
                    </Alert>
                    <Alert severity="info" icon={<Info />}>
                      Info alert message
                    </Alert>
                  </Stack>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Progress Indicators</Typography>
                  <Stack spacing={2}>
                    <LinearProgress />
                    <LinearProgress variant="determinate" value={sliderValue} />
                    <Box display="flex" alignItems="center" gap={2}>
                      <CircularProgress size={24} />
                      <CircularProgress variant="determinate" value={sliderValue} />
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Date and Time Pickers */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                MUI X Date/Time Pickers
              </Typography>
              
              <Stack spacing={3}>
                <DatePicker
                  label="Date Picker"
                  value={dateValue}
                  onChange={(newValue) => setDateValue(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
                
                <TimePicker
                  label="Time Picker"
                  value={timeValue}
                  onChange={(newValue) => setTimeValue(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
                
                <Typography variant="body2" color="textSecondary">
                  Selected Date: {dateValue?.format('YYYY-MM-DD')}
                  <br />
                  Selected Time: {timeValue?.format('HH:mm')}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Interactive Components */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Interactive Components
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  onClick={() => setDialogOpen(true)}
                  startIcon={<Settings />}
                >
                  Open Dialog
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => setSnackbarOpen(true)}
                  startIcon={<Info />}
                >
                  Show Snackbar
                </Button>
                
                <Divider />
                
                <Typography variant="subtitle2">
                  Theme Information
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current theme mode: {theme.palette.mode}
                  <br />
                  Is mobile: {isMobile ? 'Yes' : 'No'}
                  <br />
                  Primary color: {theme.palette.primary.main}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Table */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                Basic Table
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell component="th" scope="row">
                          {row.name}
                        </TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>
                          <Chip 
                            label={row.status} 
                            color={row.status === 'Active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary">
                            <Edit />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* MUI X Data Grid */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                MUI X Data Grid
              </Typography>
              
              <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={5}
                  rowsPerPageOptions={[5]}
                  checkboxSelection
                  disableSelectionOnClick
                  sx={{
                    '& .MuiDataGrid-root': {
                      border: 'none',
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: theme.palette.grey[50],
                      borderRadius: 0,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Settings color="primary" />
            MUI Dialog Test
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This is a test dialog to verify MUI Dialog components work correctly.
          </Typography>
          <Alert severity="success" sx={{ mt: 2 }}>
            Dialog is working perfectly!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          MUI Snackbar is working perfectly!
        </Alert>
      </Snackbar>

      {/* Footer */}
      <Box sx={{ mt: 4, p: 2, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="textSecondary">
          ✅ All MUI components rendered successfully
        </Typography>
        <Typography variant="caption" color="textSecondary">
          MUI Material v{require('@mui/material/package.json').version} | 
          MUI X Data Grid v{require('@mui/x-data-grid/package.json').version} | 
          MUI X Date Pickers v{require('@mui/x-date-pickers/package.json').version}
        </Typography>
      </Box>
    </Box>
  );
}