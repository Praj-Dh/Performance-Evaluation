/root-project-folder
│
├── /frontend               # Next.js Application
│   ├── /src/components     # Reusable UI (Buttons, Cards)
│   ├── /src/pages          # Page routes (Dashboard, Login)
│   ├── /public             # Static assets
│   └── next.config.js      # CRITICAL: Must have 'output: export'
│
├── /backend                # PHP API
│   ├── /api                # Endpoints (login.php, get_tasks.php)
│   ├── /config             # db_connection.php (MySQL localhost)
│   └── /utils              # Helper functions (Auth validation)
│
├── /database               # SQL files
│   └── schema.sql          # Full table definitions
│
├── /docs                   # Documentation
│   ├── LOCAL_DEV.md        # Local development (scripts/dev.sh)
│   ├── DEPLOY_TEST.md      # Deploy to TEST (scripts/deploy-to-test.sh)
│   ├── MYSQL_MAC_SETUP.md  # MySQL on Mac
│   └── Sprint_1.md         # Sprint 1 plan
│
├── /scripts                # Run from project root
│   ├── dev.sh              # Start backend + frontend + MySQL
│   └── deploy-to-test.sh  # Deploy to aptitude (TEST)
│
└── /tests                  # Testing suite
    ├── /acceptance         # For PROD server
    └── /unit               # For DEV/TEST servers