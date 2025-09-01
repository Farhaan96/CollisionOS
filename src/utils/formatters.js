export const formatCurrency = v => `$${Number(v || 0).toLocaleString()}`;
export const formatNumber = v => Number(v || 0).toLocaleString();
export const formatDate = d => (d ? new Date(d).toLocaleDateString() : '');
export const formatTime = d => (d ? new Date(d).toLocaleTimeString() : '');
