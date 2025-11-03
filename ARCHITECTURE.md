# CloudExtelGPT - Excel Data Visualization Feature Architecture

## 📋 Overview

This document explains the complete architecture of the Excel data visualization feature, including file dependencies, data flow, and how each component works together.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  DataPage.jsx                                                 │
│    ├── Handles file upload (drag & drop)                     │
│    ├── Uses: api.js → uploadExcelFile()                       │
│    └── Displays: DataDashboard.jsx after upload               │
│                                                               │
│  DataDashboard.jsx                                            │
│    ├── Shows data preview & metadata                          │
│    ├── Visualization builder UI                               │
│    ├── Uses: api.js → generateVisualization()                 │
│    └── Renders: ReactECharts component                        │
│                                                               │
│  api.js (services)                                            │
│    ├── uploadExcelFile() → POST /api/data/upload             │
│    ├── getDataPreview() → GET /api/data/preview/{id}         │
│    └── generateVisualization() → POST /api/data/visualize     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  routes_data.py (API Endpoints)                              │
│    ├── POST /api/data/upload → Uses data_service             │
│    ├── GET /api/data/preview/{id} → Uses data_service        │
│    └── POST /api/data/visualize → Uses dashboard_service    │
│                                                               │
│  data_service.py                                              │
│    ├── process_excel_file() → Reads Excel with pandas        │
│    ├── Extracts metadata (column types, stats)               │
│    ├── Stores DataFrame in memory cache                       │
│    └── Uses: pandas, openpyxl, config.py                    │
│                                                               │
│  dashboard_service.py                                         │
│    ├── prepare_visualization_data() → Main entry point        │
│    ├── prepare_bar_chart_data() → Formats bar chart           │
│    ├── prepare_pie_chart_data() → Formats pie chart          │
│    ├── prepare_line_chart_data() → Formats line chart        │
│    └── Uses: data_service.get_cached_dataframe()            │
│                                                               │
│  schema_data.py (Pydantic Models)                            │
│    ├── FileUploadResponse → Response validation              │
│    ├── VisualizationRequest → Request validation              │
│    └── VisualizationResponse → Response validation            │
│                                                               │
│  config.py                                                    │
│    └── Settings (file sizes, limits, etc.)                   │
│                                                               │
│  main.py                                                      │
│    ├── FastAPI app setup                                      │
│    └── Includes routes_data.py router                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

See ARCHITECTURE.md for complete documentation with detailed explanations of each file and their dependencies.

