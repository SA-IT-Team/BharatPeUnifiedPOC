You are building a Unified Agentic AI Monitoring POC (BharatPe-style) using ReactJs + TypeScript + Tailwind + Recharts. The app reads from Supabase (PostgREST / @supabase/supabase-js) and correlates business metric deviations with alerts/log events (Coralogix/Slack/Cloudflare/Sentry). No auth needed (POC), assume Supabase anon key and RLS off.

Core objective

Detect anomalies (drops/spikes) in:

Hourly applications funnel (DAY-0 vs DAY-1 vs DAY-7 per hour)

Daily disbursed trend (today vs yesterday / rolling baseline)

Then show relevant alerts in a correlation time window around the anomaly.

AI agent is phase-2. For now, implement a “Generate Summary” button that produces a deterministic summary based on metric deviation + top correlated alerts (stub).

Supabase tables (exact)

Use these tables and columns:

1) public.app_hourly_metrics

dt (date)

hour (varchar, "0".."23")

cohort (varchar: "DAY-0", "DAY-1", "DAY-7")

metrics (varchar; parse to number, null/empty/NaN => 0):

applications_created

applications_submitted

applications_pending

applications_nached

autopay_done_applications

applications_approved

2) public.daybyday_amount_metrics

dt (date)

daily funnel fields (varchar; parse to number; null/empty => 0):

eligible, started, shop_details_page, shop_photo, kyc_initiated, kyc_completed, add_detials_submitted, ref_page_submitted, submitted, nach_initiated, nach_done, processed, approved, disbursed

3) public.bharatpe_alerts_events

triggered_at (timestamptz)

source (varchar: coralogix/cloudflare/sentry/slack)

priority (varchar p1/p2)

severity

team, application, subsystem

alert_name

message

alert_query

sample_log

host, path, status_code

threshold, value

ingested_at

4) public.bharatpe_alerts_metric_map

Exists but DO NOT depend on it yet (we’ll seed later). Correlation is time-window based initially.

Timezone + timestamps

Display everything in Asia/Kolkata timezone.

Alerts triggered_at are timestamptz; render in IST.

For an hourly anomaly (dt + hour), interpret it as IST local time.

App pages (MVP)
Page 1: Dashboard (/)

Layout:

Controls bar

Select DAY-0 date (default: latest dt where cohort=DAY-0)

Select metric to view (dropdown): applications_created, applications_submitted, applications_approved

Correlation window config (mins): window_before=60, window_after=15

Alert filters: source multi-select, priority, severity, search text

Card: Hourly Funnel Chart

Chart: DAY-0 vs DAY-1 vs DAY-7 for selected metric across hours 0–23

Table below: hour, day0, day1, day7, %delta vs day1, %delta vs day7

Highlight anomalous hours where:

drop > 30% vs DAY-1 OR DAY-7 (configurable threshold)

Card: Daily Disbursed Trend

Chart: disbursed by dt (last N days available)

Optional toggles for approved and submitted

Flag anomaly where:

today drop > 30% vs yesterday (configurable)

Show a small anomalies list (dates with drop)

Card: Alerts Feed

Shows alerts within chosen day/time range OR within correlation window of selected anomaly hour

Each alert row: triggered_at (IST), source, priority, alert_name, host/path/status_code, value

Expand to show message + sample_log

Page 2: Incident Explorer (/incident)

User selects:

domain: applications or collections

metric: applications_created/submitted/approved OR disbursed

date (dt)

if applications metric: hour selection (0–23)
Then:

compute anomaly stats (vs baselines)

fetch alerts in correlation window [T-window_before, T+window_after]
Output:

Incident Card:

metric + timeframe

current value + baselines + %drop

top correlated alerts (sorted by priority then value then recency)

“Generate Summary” (stub): deterministic summary from top 3 alerts + deviation

Computation rules (must implement)
Numeric parsing

All metrics are varchar. Implement safe parse helper:

empty/null/NaN => 0

parse float

use Number(...) fallback

Hourly baselines

For the selected metric:

fetch all rows for cohorts DAY-0/DAY-1/DAY-7 for selected date range

join by hour

compute:

%delta_day1 = (day0 - day1)/day1

%delta_day7 = (day0 - day7)/day7

divide-by-zero safe (if baseline 0 -> null delta)

Daily anomaly

For disbursed trend:

compute prev day value and %delta

flag if %delta < -0.30

Alerts correlation

Given anomaly timestamp T (IST):

query alerts where triggered_at between (T - window_before mins) and (T + window_after mins)

apply filters and search

Technical requirements

ReactJs App Router

lib/supabaseClient.ts for client init using env vars:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Data fetching: server components or client hooks; prefer server actions or route handlers if needed, but simplest is client fetch with supabase-js.

UI: Tailwind, minimal clean layout, reusable components

Charts: Recharts

Deliverables / Definition of Done

Dashboard renders hourly chart (DAY-0 vs DAY-1 vs DAY-7) and table with anomaly highlights.

Disbursed daily chart renders and anomalies list appears.

Alerts feed pulls from bharatpe_alerts_events with filters/search.

Incident Explorer computes anomaly + fetches correlated alerts using time window.

Summary stub produces a readable incident summary text.

Implementation plan (steps)

Scaffold ReactJs app + Tailwind + Recharts.

Add Supabase client and typed interfaces for rows.

Build / dashboard UI with controls, charts, tables.

Implement anomaly computations and highlighting.

Implement alerts fetch with filters + correlation window.

Build /incident page + incident card + summary stub.

Add error states + loading states, guard against missing data