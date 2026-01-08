# Dashboard Page - Detailed Analysis & POC Completion Plan

## Overview

The Dashboard page (`src/pages/Dashboard.tsx`) is the main monitoring interface that displays business metrics, detects anomalies, and correlates them with alerts from multiple sources (Coralogix, Cloudflare, Sentry, Slack).

---

## Page Structure & Sections

### 1. **Header Section** (Lines 108-111)
- **Component**: Simple heading
- **Purpose**: Page title "Monitoring Dashboard"
- **Status**: ✅ Complete

### 2. **KPI Cards Section** (Lines 113-143)
- **Component**: 4 `KPICard` components in a responsive grid
- **Purpose**: Display key performance indicators at a glance

#### KPI Cards:
1. **P1 Alerts (Last 1 Hour)**
   - **Data Source**: Filtered from `displayAlerts` (alerts shown in feed)
   - **Calculation**: Counts alerts with `priority === 'p1'` triggered in last 60 minutes
   - **Color**: Red (critical)
   - **Status**: ✅ Implemented (mock calculation based on alerts)

2. **Services Up**
   - **Data Source**: Derived from alerts
   - **Calculation**: `10 - criticalAlerts.length` (mock: assumes 10 total services)
   - **Color**: Green
   - **Status**: ⚠️ **Mock implementation** - needs real service health data

3. **Services Down**
   - **Data Source**: Derived from `servicesUp`
   - **Calculation**: `10 - servicesUp`
   - **Color**: Red
   - **Status**: ⚠️ **Mock implementation** - needs real service health data

4. **Total Anomalies**
   - **Data Source**: `hourlyAnomalies.length + dailyAnomalies.length`
   - **Calculation**: Sum of detected anomalies from both hourly and daily metrics
   - **Color**: Blue
   - **Status**: ✅ Complete

---

### 3. **Anomaly Selection Banner** (Lines 145-161)
- **Component**: Conditional banner that appears when user clicks an anomaly hour
- **Purpose**: Shows which anomaly hour is selected and allows clearing selection
- **Behavior**: 
  - Displays when `selectedAnomalyHour !== null`
  - Shows message: "Showing alerts correlated with anomaly at hour X:00"
  - "Clear selection" button resets anomaly selection
- **Status**: ✅ Complete

---

### 4. **Filter Modal** (Lines 163-187)
- **Component**: `FilterModal` - Modal dialog for configuring filters
- **Purpose**: Centralized filter configuration
- **Filters Available**:
  1. **DAY-0 Date**: Select date for hourly metrics
  2. **Metric**: Dropdown (applications_created, applications_submitted, applications_approved)
  3. **Window Before**: Minutes before anomaly (default: 60)
  4. **Window After**: Minutes after anomaly (default: 15)
  5. **Alert Sources**: Multi-select (coralogix, cloudflare, sentry, slack)
  6. **Priority**: Multi-select (p1, p2)
  7. **Severity**: Comma-separated text input
  8. **Search Alerts**: Text search (alert name, message, host, path)
- **Status**: ✅ Complete

---

### 5. **Main Content Area - Tabs** (Lines 189-295)
- **Component**: `MetricCard` wrapper with `Tabs` component
- **Structure**: Three tabs for different views

#### Tab 1: **Hourly Metrics** (Lines 205-228)
- **Layout**: Two-column grid (chart + table)
- **Components**:
  - `HourlyFunnelChart`: Line chart showing DAY-0 vs DAY-1 vs DAY-7
  - `HourlyMetricsDataGrid`: Data table with anomaly highlighting
- **Data Flow**:
  1. `useHourlyMetrics` hook fetches data for `selectedDate` and `selectedMetric`
  2. Fetches from `bharatpe_app_hourly_metrics` table
  3. Computes anomalies using `computeHourlyAnomalies` (30% threshold)
  4. Transforms data to show all 24 hours with deltas
- **Features**:
  - Clickable table rows → triggers anomaly correlation
  - Anomaly rows highlighted with red border
  - Shows % delta vs DAY-1 and DAY-7
- **Status**: ✅ Complete

#### Tab 2: **Daily Trends** (Lines 229-284)
- **Layout**: Chart with toggle checkboxes + anomalies list
- **Components**:
  - `DailyDisbursedChart`: Line chart for disbursed trend
  - Toggle checkboxes for "Show Approved" and "Show Submitted"
- **Data Flow**:
  1. `useDailyMetrics` hook fetches last 30 days from `bharatpe_daybyday_amount_metrics`
  2. Computes daily anomalies using `computeDailyAnomalies` (30% threshold)
  3. Calculates % delta vs previous day
- **Features**:
  - Shows disbursed amount over time
  - Optional approved/submitted lines
  - Anomalies list below chart (dates with >30% drop)
- **Status**: ✅ Complete

#### Tab 3: **Alerts Feed** (Lines 285-292)
- **Component**: `AlertsDataGrid` - Full-featured data grid
- **Data Flow**:
  1. If `selectedAnomalyTimestamp` exists → uses `useCorrelatedAlerts`
     - Fetches alerts in time window: `[timestamp - windowBefore, timestamp + windowAfter]`
  2. Otherwise → uses `useAlerts` (all alerts with filters)
  3. Applies filters: source, priority, severity, search text
  4. Sorts by: priority (p1 > p2) → value (higher) → recency (newer)
- **Features**:
  - Expandable rows (master-detail) showing full alert details
  - Color-coded badges for source, priority, status code
  - Search, filter, column chooser, column fixing
  - Displays triggered_at in IST timezone
- **Status**: ✅ Complete

---

## Component Details

### Data Hooks

#### `useHourlyMetrics` (`src/hooks/useHourlyMetrics.ts`)
- **Inputs**: `selectedDate`, `selectedMetric`, `threshold` (0.30)
- **Outputs**: `data`, `anomalies`, `loading`, `error`
- **Process**:
  1. Fetches all cohorts (DAY-0, DAY-1, DAY-7) for selected date
  2. Groups by hour (0-23)
  3. Computes deltas: `(day0 - day1)/day1` and `(day0 - day7)/day7`
  4. Flags anomaly if drop > 30% vs either baseline
  5. Creates `HourlyAnomaly` objects with IST timestamps

#### `useDailyMetrics` (`src/hooks/useDailyMetrics.ts`)
- **Inputs**: `days` (default: 30)
- **Outputs**: `data`, `anomalies`, `loading`, `error`
- **Process**:
  1. Fetches last N days from `bharatpe_daybyday_amount_metrics`
  2. Parses disbursed, approved, submitted (varchar → number)
  3. Computes % delta vs previous day
  4. Flags anomaly if drop > 30%

#### `useAlerts` (`src/hooks/useAlerts.ts`)
- **Inputs**: `filters`, `timeWindow` (optional)
- **Outputs**: `alerts`, `loading`, `error`, `refetch`
- **Process**:
  1. Fetches from `bharatpe_alerts_events`
  2. Applies time window filter (converts IST → UTC for query)
  3. Applies source, priority, severity, search filters
  4. Sorts by priority → value → recency

#### `useCorrelatedAlerts` (`src/hooks/useAlerts.ts`)
- **Inputs**: `anomalyTimestamp` (IST), `windowBefore`, `windowAfter`, `filters`
- **Outputs**: Same as `useAlerts`
- **Process**:
  1. Calculates time window: `[timestamp - windowBefore, timestamp + windowAfter]`
  2. Delegates to `useAlerts` with time window

### Chart Components

#### `HourlyFunnelChart` (`src/components/charts/HourlyFunnelChart.tsx`)
- **Library**: Recharts
- **Type**: Line chart
- **Data**: Transforms `HourlyMetricData[]` to chart format
- **Lines**: DAY-0 (blue), DAY-1 (green), DAY-7 (red)
- **Status**: ✅ Complete

#### `DailyDisbursedChart` (`src/components/charts/DailyDisbursedChart.tsx`)
- **Library**: Recharts
- **Type**: Line chart
- **Data**: Shows disbursed (always), approved/submitted (optional)
- **Status**: ✅ Complete

### Table Components

#### `HourlyMetricsDataGrid` (`src/components/tables/HourlyMetricsDataGrid.tsx`)
- **Library**: DevExtreme DataGrid
- **Columns**: Hour, DAY-0, DAY-1, DAY-7, %Δ vs DAY-1, %Δ vs DAY-7
- **Features**:
  - Row click → triggers `onRowClick(hour)` → sets anomaly selection
  - Anomaly rows: red background + left border
  - Negative deltas: red text, bold
  - Pagination, search, header filters
- **Status**: ✅ Complete

#### `AlertsDataGrid` (`src/components/tables/AlertsDataGrid.tsx`)
- **Library**: DevExtreme DataGrid
- **Columns**: Triggered At (IST), Source, Priority, Alert Name, Host, Path, Status, Value
- **Features**:
  - Master-detail expansion for full alert details
  - Color-coded badges (source, priority, status code)
  - Column chooser, column fixing, search, filters
  - Displays message, sample_log, alert_query in detail view
- **Status**: ✅ Complete

### Card Components

#### `KPICard` (`src/components/cards/KPICard.tsx`)
- **Props**: `title`, `value`, `subtitle`, `icon`, `color` (blue/red/green)
- **Styling**: BharatPe color scheme with left border accent
- **Status**: ✅ Complete

#### `MetricCard` (`src/components/cards/MetricCard.tsx`)
- **Props**: `title`, `children`, `actionButton`
- **Purpose**: Wrapper card for tabbed content
- **Status**: ✅ Complete

---

## Data Flow Architecture

```
Dashboard Component
│
├─→ useEffect: Fetch latest DAY-0 date on mount
│   └─→ supabaseApi.fetchLatestDate('DAY-0')
│       └─→ Sets selectedDate state
│
├─→ useHourlyMetrics(selectedDate, selectedMetric, 0.30)
│   ├─→ supabaseApi.fetchHourlyMetrics(date, ['DAY-0', 'DAY-1', 'DAY-7'])
│   ├─→ computeHourlyAnomalies() → transforms & detects anomalies
│   └─→ Returns: { data, anomalies, loading, error }
│
├─→ useDailyMetrics(30)
│   ├─→ supabaseApi.fetchDailyMetrics(startDate, endDate)
│   ├─→ Transforms & computes daily anomalies
│   └─→ Returns: { data, anomalies, loading, error }
│
├─→ useAlerts(alertFilters) OR useCorrelatedAlerts(...)
│   ├─→ supabaseApi.fetchAlerts(timeWindow?)
│   ├─→ Applies filters (source, priority, severity, search)
│   ├─→ Sorts by priority → value → recency
│   └─→ Returns: { alerts, loading, error }
│
└─→ User Interactions:
    ├─→ Click anomaly hour in table → sets selectedAnomalyTimestamp
    │   └─→ Switches to correlated alerts view
    ├─→ Open filter modal → updates filter states
    │   └─→ Triggers re-fetch with new filters
    └─→ Change date/metric → triggers re-fetch
```

---

## Current Implementation Status

### ✅ **Completed Features**

1. **Dashboard Layout & Structure**
   - Header, KPI cards, tabs, filter modal
   - Responsive grid layout
   - BharatPe color theme

2. **Hourly Metrics Tab**
   - Funnel chart (DAY-0 vs DAY-1 vs DAY-7)
   - Data table with anomaly highlighting
   - Click-to-correlate functionality
   - Anomaly detection (30% threshold)

3. **Daily Trends Tab**
   - Disbursed trend chart
   - Optional approved/submitted lines
   - Anomalies list display

4. **Alerts Feed Tab**
   - Full-featured data grid
   - Filtering (source, priority, severity, search)
   - Correlation window support
   - Master-detail expansion
   - IST timezone display

5. **Data Integration**
   - Supabase API integration (PostgREST)
   - All three tables connected
   - Proper timezone handling (IST)
   - Safe metric parsing (varchar → number)

6. **Anomaly Detection**
   - Hourly: Drop > 30% vs DAY-1 OR DAY-7
   - Daily: Drop > 30% vs previous day
   - Configurable thresholds

---

### ⚠️ **Areas Needing Completion for 100% POC**

#### 1. **Service Health KPI Cards** (Lines 84-94)
- **Current**: Mock calculation (`10 - criticalAlerts.length`)
- **Needed**: 
  - Real service health data source
  - Service registry/status API
  - Or remove if not in scope for POC

#### 2. **Error Handling & Loading States**
- **Current**: Basic loading states exist
- **Needed**:
  - Error boundaries for failed API calls
  - Retry mechanisms
  - Empty state messages
  - Network error handling

#### 3. **Data Validation**
- **Current**: Basic parsing with fallbacks
- **Needed**:
  - Validate date ranges
  - Handle missing data gracefully
  - Edge cases (no data for selected date)

#### 4. **Performance Optimizations**
- **Current**: Basic memoization with `useMemo`
- **Needed**:
  - Debounce filter inputs
  - Virtual scrolling for large alert lists
  - Chart data optimization

#### 5. **Accessibility**
- **Current**: Basic semantic HTML
- **Needed**:
  - ARIA labels
  - Keyboard navigation
  - Screen reader support

#### 6. **Testing**
- **Current**: None visible
- **Needed**:
  - Unit tests for hooks
  - Component tests
  - Integration tests for data flow

---

## POC Completion Checklist

### Critical (Must Have)
- [x] Dashboard renders with all three tabs
- [x] Hourly funnel chart displays DAY-0/DAY-1/DAY-7
- [x] Daily disbursed chart displays trend
- [x] Alerts feed pulls from Supabase
- [x] Anomaly detection works (30% threshold)
- [x] Correlation window filtering works
- [x] Filter modal functional
- [ ] **Error handling for API failures**
- [ ] **Empty state handling (no data scenarios)**

### Important (Should Have)
- [ ] **Service health KPI - decide: real data or remove**
- [ ] **Loading skeletons instead of text**
- [ ] **Date picker validation**
- [ ] **Filter persistence (localStorage?)**

### Nice to Have (Could Have)
- [ ] Export functionality (CSV/PDF)
- [ ] Real-time updates (polling/websockets)
- [ ] Chart zoom/pan
- [ ] Alert grouping/aggregation

---

## Next Steps to Complete POC 100%

1. **Fix Service Health KPIs**
   - Option A: Remove if not in scope
   - Option B: Add real service health endpoint
   - Option C: Keep mock but label as "Estimated"

2. **Add Error Handling**
   - Wrap API calls in try-catch
   - Display error messages to user
   - Add retry buttons

3. **Improve Empty States**
   - "No data for selected date" message
   - "No alerts found" with filter suggestions
   - "Select a date to view metrics"

4. **Add Data Validation**
   - Validate date format
   - Check date range (not too far in future)
   - Handle missing cohorts gracefully

5. **Polish UI/UX**
   - Loading skeletons
   - Smooth transitions
   - Better error messages
   - Tooltips for complex features

---

## Summary

The Dashboard page is **~90% complete** for the POC. Core functionality is implemented:
- ✅ All three tabs functional
- ✅ Charts rendering correctly
- ✅ Anomaly detection working
- ✅ Alert correlation working
- ✅ Filters functional

**Remaining work** is primarily:
- Error handling & edge cases
- Service health KPI decision
- UI polish & empty states
- Data validation

The architecture is solid and ready for production with these additions.




