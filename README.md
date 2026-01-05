# BharatPe Unified Agent Monitoring POC

A React-based monitoring dashboard that detects anomalies in business metrics and correlates them with alerts from various sources (Coralogix, Cloudflare, Sentry, Slack).

## Features

- **Dashboard**: Real-time monitoring of hourly application metrics and daily disbursed trends
- **Anomaly Detection**: Automatic detection of metric drops (>30% threshold)
- **Alert Correlation**: Time-window based correlation of alerts with anomalies
- **Incident Explorer**: Detailed analysis of specific incidents with correlated alerts
- **Summary Generation**: Deterministic summary generation from top correlated alerts

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Supabase** for data storage and queries
- **React Router** for navigation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Database Schema

The application expects the following Supabase tables:

### `app_hourly_metrics`
- `dt` (date)
- `hour` (varchar: "0".."23")
- `cohort` (varchar: "DAY-0", "DAY-1", "DAY-7")
- `applications_created`, `applications_submitted`, `applications_pending`, `applications_nached`, `autopay_done_applications`, `applications_approved` (varchar)

### `daybyday_amount_metrics`
- `dt` (date)
- `eligible`, `started`, `shop_details_page`, `shop_photo`, `kyc_initiated`, `kyc_completed`, `add_detials_submitted`, `ref_page_submitted`, `submitted`, `nach_initiated`, `nach_done`, `processed`, `approved`, `disbursed` (varchar)

### `bharatpe_alerts_events`
- `triggered_at` (timestamptz)
- `source`, `priority`, `severity`, `team`, `application`, `subsystem`, `alert_name`, `message`, `alert_query`, `sample_log`, `host`, `path`, `status_code`, `threshold`, `value`, `ingested_at`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── charts/         # Chart components (Recharts)
│   ├── tables/         # Data table components
│   ├── cards/          # Card containers
│   └── ui/             # Base UI components
├── lib/                # Core utilities and clients
│   ├── supabaseClient.ts
│   ├── utils.ts        # Parsing, timezone, anomaly detection
│   └── types.ts        # TypeScript interfaces
├── hooks/              # Custom React hooks
│   ├── useHourlyMetrics.ts
│   ├── useDailyMetrics.ts
│   └── useAlerts.ts
├── pages/              # Page components
│   ├── Dashboard.tsx
│   └── IncidentExplorer.tsx
└── App.tsx             # Main app with routing
```

## Key Features

### Dashboard Page (`/`)
- Hourly funnel chart comparing DAY-0 vs DAY-1 vs DAY-7
- Daily disbursed trend with anomaly detection
- Alerts feed with filtering and correlation
- Configurable correlation windows

### Incident Explorer Page (`/incident`)
- Select domain (applications/collections) and metric
- Compute anomaly statistics vs baselines
- Fetch correlated alerts in time window
- Generate deterministic summary from top alerts

## Timezone

All timestamps are displayed in **Asia/Kolkata (IST)** timezone.

## Anomaly Detection

- **Hourly**: Drop > 30% vs DAY-1 OR DAY-7 (configurable)
- **Daily**: Drop > 30% vs yesterday (configurable)

## License

ISC
