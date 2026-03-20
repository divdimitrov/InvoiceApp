-- InvoiceApp schema (clients + documents + versioning)
-- Paste into Supabase SQL editor and run.
-- This script is idempotent and can be run multiple times.

create extension if not exists "pgcrypto";

-- ===== Clients =====
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists clients_normalized_name_key on public.clients (normalized_name);
create index if not exists clients_created_at_idx on public.clients (created_at desc);

-- ===== Documents =====
-- IMPORTANT: this project previously used a different public.documents table shape.
-- For the new "saved documents + versioning" feature we use a new table name
-- to avoid migrating or breaking the legacy table.
create table if not exists public.client_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references public.clients(id) on delete cascade,
  document_type text,
  document_number text
);

create index if not exists client_documents_client_id_idx on public.client_documents (client_id);
create index if not exists client_documents_updated_at_idx on public.client_documents (updated_at desc);
create index if not exists client_documents_created_at_idx on public.client_documents (created_at desc);

-- ===== Document versions =====
-- Use a dedicated table name to avoid clashing with any legacy tables.
create table if not exists public.client_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.client_documents(id) on delete cascade,
  label text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists client_document_versions_document_id_label_key on public.client_document_versions (document_id, label);
create index if not exists client_document_versions_document_id_idx on public.client_document_versions (document_id);
create index if not exists client_document_versions_created_at_idx on public.client_document_versions (created_at desc);

-- Optional (recommended) if you later add Supabase Auth:
-- alter table public.clients enable row level security;
-- alter table public.client_documents enable row level security;
-- alter table public.client_document_versions enable row level security;
