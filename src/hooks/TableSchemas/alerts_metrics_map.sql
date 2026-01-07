create table public.bharatpe_alerts_metric_map (
  id uuid not null default gen_random_uuid (),
  match_field character varying(30) not null,
  match_type character varying(20) not null,
  match_value character varying(300) not null,
  domain character varying(50) not null,
  metric character varying(100) not null,
  confidence character varying(10) null default '0.7'::character varying,
  notes text null default ''::text,
  is_active character varying(5) not null default 'true'::character varying,
  created_at timestamp with time zone not null default now(),
  constraint bharatpe_alerts_metric_map_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_bharatpe_alerts_metric_map_domain on public.bharatpe_alerts_metric_map using btree (domain) TABLESPACE pg_default;

create index IF not exists idx_bharatpe_alerts_metric_map_metric on public.bharatpe_alerts_metric_map using btree (metric) TABLESPACE pg_default;

create index IF not exists idx_bharatpe_alerts_metric_map_active on public.bharatpe_alerts_metric_map using btree (is_active) TABLESPACE pg_default;