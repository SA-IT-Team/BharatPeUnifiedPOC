create table public.bharatpe_app_hourly_metrics (
  id uuid not null default gen_random_uuid (),
  dt date not null,
  hour character varying(2) not null,
  cohort character varying(10) null,
  applications_created character varying(20) null,
  applications_submitted character varying(20) null,
  applications_pending character varying(20) null,
  applications_nached character varying(20) null,
  autopay_done_applications character varying(20) null,
  applications_approved character varying(20) null,
  ingested_at timestamp with time zone not null default now(),
  constraint bharatpe_app_hourly_metrics_pkey primary key (id),
  constraint uq_app_hourly_dt_hour unique (dt, hour)
) TABLESPACE pg_default;

create index IF not exists idx_app_hourly_dt on public.bharatpe_app_hourly_metrics using btree (dt) TABLESPACE pg_default;

create index IF not exists idx_app_hourly_dt_hour on public.bharatpe_app_hourly_metrics using btree (dt, hour) TABLESPACE pg_default;