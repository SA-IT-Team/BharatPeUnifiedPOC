create table public.bharatpe_alerts_events (
  id uuid not null default gen_random_uuid (),
  triggered_at timestamp with time zone not null,
  source character varying(30) not null,
  priority character varying(10) null default ''::character varying,
  severity character varying(20) null default ''::character varying,
  team character varying(100) null default ''::character varying,
  application character varying(100) null default ''::character varying,
  subsystem character varying(150) null default ''::character varying,
  alert_name character varying(300) not null,
  message text null default ''::text,
  alert_query text null default ''::text,
  sample_log text null default ''::text,
  host character varying(200) null default ''::character varying,
  path character varying(300) null default ''::character varying,
  status_code character varying(10) null default ''::character varying,
  threshold character varying(100) null default ''::character varying,
  value character varying(50) null default '0'::character varying,
  raw_text text null default ''::text,
  ingested_at timestamp with time zone not null default now(),
  constraint bharatpe_alerts_events_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_bharatpe_alerts_events_triggered_at on public.bharatpe_alerts_events using btree (triggered_at) TABLESPACE pg_default;

create index IF not exists idx_bharatpe_alerts_events_source on public.bharatpe_alerts_events using btree (source) TABLESPACE pg_default;

create index IF not exists idx_bharatpe_alerts_events_subsystem on public.bharatpe_alerts_events using btree (subsystem) TABLESPACE pg_default;

create index IF not exists idx_bharatpe_alerts_events_alert_name on public.bharatpe_alerts_events using btree (alert_name) TABLESPACE pg_default;