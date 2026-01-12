# Dashboard Alignment Summary

## Issues Fixed

### 1. **Hourly Metrics Fetching - Fixed**

**Problem**: Code was trying to fetch by `cohort` field (DAY-0, DAY-1, DAY-7) from same date, but schema shows:
- `cohort` field is nullable and not in unique constraint
- Table stores data by `(dt, hour)` - different dates, not cohorts

**Solution**: 
- Changed to fetch by **date comparison**:
  - Selected date (e.g., 2025-12-23) = DAY-0 (today)
  - Previous day (2025-12-22) = DAY-1 (yesterday)  
  - 7 days ago (2025-12-16) = DAY-7 (last week)
- Modified `supabaseApi.fetchHourlyMetrics()` to fetch three separate dates and mark them with cohort labels internally

**Files Changed**:
- `src/lib/supabaseApi.ts` - Updated fetchHourlyMetrics() and fetchLatestDate()
- `src/hooks/useHourlyMetrics.ts` - Updated to use new API
- `src/pages/Dashboard.tsx` - Updated date fetching logic
- `src/lib/types.ts` - Made cohort nullable to match schema

---

### 2. **Business Context Alignment**

**Clarification**:
- **bharatpe_app_hourly_metrics** = **Application Metrics** (loan applications created, submitted, approved per hour)
- **bharatpe_daybyday_amount_metrics** = **Collection Metrics** (loan collection amounts: eligible, submitted, approved, disbursed per day)
- **bharatpe_alerts_events** = Alerts from Coralogix, Cloudflare, Sentry, Slack
- **bharatpe_alerts_metric_map** = Maps alerts to domains (applications/collections) and specific metrics

**Changes Made**:
- Updated Dashboard header: "BharatPe Loan Service Monitoring"
- Updated tab labels:
  - "Hourly Metrics" → "Application Metrics (Hourly)"
  - "Daily Trends" → "Collection Metrics (Daily)"
- Updated FilterModal label: "DAY-0 Date" → "Date (Applications Metrics)"

---

### 3. **Alert Metric Map Integration - Added**

**Added**:
- New type `AlertMetricMap` in `src/lib/types.ts`
- New API method `fetchAlertMetricMap()` in `src/lib/supabaseApi.ts`
- Ready for domain-based correlation (can be used in future enhancements)

**Note**: Currently using time-window based correlation. Alert metric map can be integrated later for smarter correlation.

---

## Current Data Flow

### Application Metrics (Hourly)
```
User selects date (e.g., 2025-12-23)
  ↓
Fetch 3 dates:
  - 2025-12-23 (DAY-0)
  - 2025-12-22 (DAY-1)
  - 2025-12-16 (DAY-7)
  ↓
Group by hour (0-23)
  ↓
Compare DAY-0 vs DAY-1 vs DAY-7 per hour
  ↓
Detect anomalies (>30% drop)
  ↓
Display in chart + table
```

### Collection Metrics (Daily)
```
Fetch last 30 days from bharatpe_daybyday_amount_metrics
  ↓
Parse: disbursed, approved, submitted (varchar → number)
  ↓
Compare each day vs previous day
  ↓
Detect anomalies (>30% drop in disbursed)
  ↓
Display in chart with anomaly dates
```

### Alerts Correlation
```
User clicks anomaly hour
  ↓
Calculate time window: [anomaly_time - 60min, anomaly_time + 15min]
  ↓
Fetch alerts from bharatpe_alerts_events in that window
  ↓
Apply filters (source, priority, severity, search)
  ↓
Sort by: priority → value → recency
  ↓
Display in alerts feed
```

---

## Schema Alignment

### bharatpe_app_hourly_metrics
- **Purpose**: Application metrics (loan applications)
- **Key Fields**: `dt`, `hour`, `applications_created`, `applications_submitted`, `applications_approved`
- **Note**: `cohort` field exists but nullable - we now fetch by date instead

### bharatpe_daybyday_amount_metrics  
- **Purpose**: Collection metrics (loan collections)
- **Key Fields**: `dt`, `eligible`, `started`, `submitted`, `approved`, `disbursed`, `kyc_initiated`, etc.
- **Date Range**: 2025-12-01 to 2025-12-23

### bharatpe_alerts_events
- **Purpose**: Alerts from monitoring sources
- **Key Fields**: `triggered_at`, `source`, `priority`, `severity`, `alert_name`, `message`, `sample_log`
- **Date**: 2025-12-23

### bharatpe_alerts_metric_map
- **Purpose**: Maps alerts to domains and metrics
- **Key Fields**: `match_field`, `match_type`, `match_value`, `domain`, `metric`, `confidence`
- **Status**: API method added, ready for integration

---

## Next Steps for Full POC

1. ✅ **Fixed**: Hourly metrics fetching by date
2. ✅ **Fixed**: Business context labels
3. ✅ **Added**: Alert metric map API
4. ⏳ **Pending**: Integrate alert_metric_map for domain-based correlation
5. ⏳ **Pending**: Add more collection metrics to daily chart (eligible, kyc_initiated, etc.)
6. ⏳ **Pending**: Error handling and empty states
7. ⏳ **Pending**: Service health KPIs (remove or implement properly)

---

## Testing Checklist

- [ ] Test hourly metrics with date 2025-12-23
- [ ] Verify DAY-1 (2025-12-22) and DAY-7 (2025-12-16) are fetched correctly
- [ ] Test anomaly detection with real data
- [ ] Test alert correlation time windows
- [ ] Verify collection metrics display correctly
- [ ] Test with missing data scenarios





