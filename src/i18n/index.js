
// Internationalization Configuration for CollisionOS
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
const en = {
  translation: {
    // Navigation
    dashboard: 'Dashboard',
    repair_orders: 'Repair Orders',
    customers: 'Customers',
    vehicles: 'Vehicles',
    parts: 'Parts',
    purchase_orders: 'Purchase Orders',
    financial: 'Financial',
    reports: 'Reports',
    settings: 'Settings',
    
    // Common actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    
    // Repair Orders
    ro_number: 'RO Number',
    status: 'Status',
    priority: 'Priority',
    customer: 'Customer',
    vehicle: 'Vehicle',
    claim: 'Claim',
    insurance_company: 'Insurance Company',
    total_amount: 'Total Amount',
    opened_at: 'Opened At',
    estimated_completion: 'Estimated Completion',
    
    // Status values
    estimate: 'Estimate',
    in_progress: 'In Progress',
    parts_pending: 'Parts Pending',
    completed: 'Completed',
    delivered: 'Delivered',
    
    // Priority values
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
    
    // Customer fields
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    state: 'State',
    zip_code: 'ZIP Code',
    
    // Vehicle fields
    vin: 'VIN',
    year: 'Year',
    make: 'Make',
    model: 'Model',
    license_plate: 'License Plate',
    color: 'Color',
    odometer: 'Odometer',
    
    // Messages
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading...',
    no_data: 'No data available',
    confirm_delete: 'Are you sure you want to delete this item?',
    
    // Time formats
    date_format: 'MM/DD/YYYY',
    time_format: 'HH:mm',
    datetime_format: 'MM/DD/YYYY HH:mm'
  }
};

// Spanish translations
const es = {
  translation: {
    // Navigation
    dashboard: 'Panel de Control',
    repair_orders: 'Órdenes de Reparación',
    customers: 'Clientes',
    vehicles: 'Vehículos',
    parts: 'Piezas',
    purchase_orders: 'Órdenes de Compra',
    financial: 'Financiero',
    reports: 'Reportes',
    settings: 'Configuración',
    
    // Common actions
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    
    // Repair Orders
    ro_number: 'Número de RO',
    status: 'Estado',
    priority: 'Prioridad',
    customer: 'Cliente',
    vehicle: 'Vehículo',
    claim: 'Reclamo',
    insurance_company: 'Compañía de Seguros',
    total_amount: 'Monto Total',
    opened_at: 'Abierto En',
    estimated_completion: 'Finalización Estimada',
    
    // Status values
    estimate: 'Estimación',
    in_progress: 'En Progreso',
    parts_pending: 'Piezas Pendientes',
    completed: 'Completado',
    delivered: 'Entregado',
    
    // Priority values
    low: 'Bajo',
    normal: 'Normal',
    high: 'Alto',
    urgent: 'Urgente',
    
    // Customer fields
    first_name: 'Nombre',
    last_name: 'Apellido',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    address: 'Dirección',
    city: 'Ciudad',
    state: 'Estado',
    zip_code: 'Código Postal',
    
    // Vehicle fields
    vin: 'VIN',
    year: 'Año',
    make: 'Marca',
    model: 'Modelo',
    license_plate: 'Placa',
    color: 'Color',
    odometer: 'Odómetro',
    
    // Messages
    success: 'Éxito',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Información',
    loading: 'Cargando...',
    no_data: 'No hay datos disponibles',
    confirm_delete: '¿Está seguro de que desea eliminar este elemento?',
    
    // Time formats
    date_format: 'DD/MM/YYYY',
    time_format: 'HH:mm',
    datetime_format: 'DD/MM/YYYY HH:mm'
  }
};

// French translations
const fr = {
  translation: {
    // Navigation
    dashboard: 'Tableau de Bord',
    repair_orders: 'Ordres de Réparation',
    customers: 'Clients',
    vehicles: 'Véhicules',
    parts: 'Pièces',
    purchase_orders: 'Commandes d'Achat',
    financial: 'Financier',
    reports: 'Rapports',
    settings: 'Paramètres',
    
    // Common actions
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    import: 'Importer',
    
    // Repair Orders
    ro_number: 'Numéro RO',
    status: 'Statut',
    priority: 'Priorité',
    customer: 'Client',
    vehicle: 'Véhicule',
    claim: 'Réclamation',
    insurance_company: 'Compagnie d'Assurance',
    total_amount: 'Montant Total',
    opened_at: 'Ouvert Le',
    estimated_completion: 'Finalisation Estimée',
    
    // Status values
    estimate: 'Devis',
    in_progress: 'En Cours',
    parts_pending: 'Pièces en Attente',
    completed: 'Terminé',
    delivered: 'Livré',
    
    // Priority values
    low: 'Faible',
    normal: 'Normal',
    high: 'Élevé',
    urgent: 'Urgent',
    
    // Customer fields
    first_name: 'Prénom',
    last_name: 'Nom',
    email: 'Email',
    phone: 'Téléphone',
    address: 'Adresse',
    city: 'Ville',
    state: 'État',
    zip_code: 'Code Postal',
    
    // Vehicle fields
    vin: 'VIN',
    year: 'Année',
    make: 'Marque',
    model: 'Modèle',
    license_plate: 'Plaque d'Immatriculation',
    color: 'Couleur',
    odometer: 'Odomètre',
    
    // Messages
    success: 'Succès',
    error: 'Erreur',
    warning: 'Avertissement',
    info: 'Information',
    loading: 'Chargement...',
    no_data: 'Aucune donnée disponible',
    confirm_delete: 'Êtes-vous sûr de vouloir supprimer cet élément?',
    
    // Time formats
    date_format: 'DD/MM/YYYY',
    time_format: 'HH:mm',
    datetime_format: 'DD/MM/YYYY HH:mm'
  }
};

// Punjabi translations
const pa = {
  translation: {
    // Navigation
    dashboard: 'ਡੈਸ਼ਬੋਰਡ',
    repair_orders: 'ਮਰਮਤ ਦੇ ਆਰਡਰ',
    customers: 'ਗਾਹਕ',
    vehicles: 'ਵਾਹਨ',
    parts: 'ਭਾਗ',
    purchase_orders: 'ਖਰੀਦ ਦੇ ਆਰਡਰ',
    financial: 'ਵਿੱਤੀ',
    reports: 'ਰਿਪੋਰਟਾਂ',
    settings: 'ਸੈਟਿੰਗਾਂ',
    
    // Common actions
    save: 'ਸੇਵ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    delete: 'ਮਿਟਾਓ',
    edit: 'ਸੰਪਾਦਨ',
    add: 'ਜੋੜੋ',
    search: 'ਖੋਜ',
    filter: 'ਫਿਲਟਰ',
    export: 'ਨਿਰਯਾਤ',
    import: 'ਆਯਾਤ',
    
    // Repair Orders
    ro_number: 'RO ਨੰਬਰ',
    status: 'ਸਥਿਤੀ',
    priority: 'ਪ੍ਰਾਥਮਿਕਤਾ',
    customer: 'ਗਾਹਕ',
    vehicle: 'ਵਾਹਨ',
    claim: 'ਦਾਅਵਾ',
    insurance_company: 'ਬੀਮਾ ਕੰਪਨੀ',
    total_amount: 'ਕੁੱਲ ਰਕਮ',
    opened_at: 'ਖੋਲ੍ਹਿਆ ਗਿਆ',
    estimated_completion: 'ਅਨੁਮਾਨਿਤ ਪੂਰਤੀ',
    
    // Status values
    estimate: 'ਅਨੁਮਾਨ',
    in_progress: 'ਚੱਲ ਰਿਹਾ',
    parts_pending: 'ਭਾਗ ਲੰਬੇ',
    completed: 'ਪੂਰਾ',
    delivered: 'ਡਿਲੀਵਰ',
    
    // Priority values
    low: 'ਘੱਟ',
    normal: 'ਸਾਧਾਰਣ',
    high: 'ਉੱਚ',
    urgent: 'ਜ਼ਰੂਰੀ',
    
    // Customer fields
    first_name: 'ਪਹਿਲਾ ਨਾਮ',
    last_name: 'ਆਖਰੀ ਨਾਮ',
    email: 'ਈਮੇਲ',
    phone: 'ਫੋਨ',
    address: 'ਪਤਾ',
    city: 'ਸ਼ਹਿਰ',
    state: 'ਰਾਜ',
    zip_code: 'ਜ਼ਿਪ ਕੋਡ',
    
    // Vehicle fields
    vin: 'VIN',
    year: 'ਸਾਲ',
    make: 'ਬਣਾਉਣ ਵਾਲਾ',
    model: 'ਮਾਡਲ',
    license_plate: 'ਲਾਇਸੈਂਸ ਪਲੇਟ',
    color: 'ਰੰਗ',
    odometer: 'ਓਡੋਮੀਟਰ',
    
    // Messages
    success: 'ਸਫਲਤਾ',
    error: 'ਗਲਤੀ',
    warning: 'ਚੇਤਾਵਨੀ',
    info: 'ਜਾਣਕਾਰੀ',
    loading: 'ਲੋਡ ਹੋ ਰਿਹਾ...',
    no_data: 'ਕੋਈ ਡੇਟਾ ਉਪਲਬਧ ਨਹੀਂ',
    confirm_delete: 'ਕੀ ਤੁਸੀਂ ਇਸ ਆਈਟਮ ਨੂੰ ਮਿਟਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
    
    // Time formats
    date_format: 'DD/MM/YYYY',
    time_format: 'HH:mm',
    datetime_format: 'DD/MM/YYYY HH:mm'
  }
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      es,
      fr,
      pa
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
