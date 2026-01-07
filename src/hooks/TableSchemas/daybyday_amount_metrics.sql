create table public.bharatpe_daybyday_amount_metrics (
  id uuid not null default gen_random_uuid (),
  dt date not null,
  eligible character varying(30) not null default '0'::character varying,
  started character varying(30) not null default '0'::character varying,
  shop_details_page character varying(30) not null default '0'::character varying,
  shop_photo character varying(30) not null default '0'::character varying,
  kyc_initiated character varying(30) not null default '0'::character varying,
  kyc_completed character varying(30) not null default '0'::character varying,
  add_detials_submitted character varying(30) not null default '0'::character varying,
  ref_page_submitted character varying(30) not null default '0'::character varying,
  submitted character varying(30) not null default '0'::character varying,
  nach_initiated character varying(30) not null default '0'::character varying,
  nach_done character varying(30) not null default '0'::character varying,
  processed character varying(30) not null default '0'::character varying,
  approved character varying(30) not null default '0'::character varying,
  disbursed character varying(30) not null default '0'::character varying,
  ingested_at timestamp with time zone not null default now(),
  constraint bharatpe_daybyday_amount_metrics_pkey primary key (id),
  constraint uq_daybyday_dt unique (dt)
) TABLESPACE pg_default;

create index IF not exists idx_daybyday_dt on public.bharatpe_daybyday_amount_metrics using btree (dt) TABLESPACE pg_default;