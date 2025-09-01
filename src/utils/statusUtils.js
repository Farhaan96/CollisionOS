export const getStatusColor = status =>
  ({
    estimate: '#FFA500',
    intake: '#FF6B6B',
    blueprint: '#4ECDC4',
    parts_ordering: '#45B7D1',
    parts_receiving: '#96CEB4',
    body_structure: '#FFEAA7',
    paint_prep: '#DDA0DD',
    paint_booth: '#98D8C8',
    reassembly: '#F7DC6F',
    quality_control: '#BB8FCE',
    calibration: '#85C1E9',
    detail: '#F8C471',
    ready_pickup: '#82E0AA',
    delivered: '#2ECC71',
  })[status] || '#95A5A6';

export const getPriorityColor = p =>
  ({
    low: '#2ECC71',
    normal: '#3498DB',
    high: '#F39C12',
    urgent: '#E67E22',
    rush: '#E74C3C',
  })[p] || '#3498DB';

export const getStatusIcon = () => null;
