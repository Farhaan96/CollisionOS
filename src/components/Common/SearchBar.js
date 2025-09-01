import React from 'react';
import { TextField } from '@mui/material';
export const SearchBar = ({ value, onChange, placeholder }) => (
  <TextField
    fullWidth
    size='small'
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder || 'Search...'}
  />
);
