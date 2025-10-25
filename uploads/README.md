# Uploads Directory

This directory stores uploaded files from the CollisionOS application.

## Structure

```
uploads/
├── bms/                 # BMS file uploads
│   ├── processed/       # Successfully processed BMS files
│   ├── failed/          # Failed BMS files (for debugging)
│   └── .gitkeep        # Ensures directory is tracked in git
└── README.md           # This file
```

## BMS File Processing

When a BMS (Body Management System) XML file is uploaded:

1. **Upload**: File is initially saved to `uploads/bms/` with a unique filename
2. **Processing**: File is parsed and data is extracted
3. **Success**: File is moved to `uploads/bms/processed/`
4. **Failure**: File is moved to `uploads/bms/failed/` for debugging

## Important Notes

- Files are **permanently stored** after processing
- Successful files in `processed/` can be used for reference and audit
- Failed files in `failed/` help with debugging and troubleshooting
- Files are named with timestamps to avoid conflicts: `bms-{timestamp}-{random}.xml`

## Maintenance

- Periodically clean old files from `processed/` (e.g., after 90 days)
- Review files in `failed/` to identify common issues
- Ensure sufficient disk space for file storage

## Security

- This directory is excluded from git (in .gitignore)
- Only authorized users can upload BMS files
- Files are validated before processing
