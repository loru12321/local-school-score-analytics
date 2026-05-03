-- Local single-school analytics cloud storage.
-- Run this once in Supabase SQL Editor for the project under loru12321's Org.

create extension if not exists pgcrypto;

create table if not exists public.analysis_snapshots (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    school_name text not null default '本校',
    grade smallint not null check (grade between 6 and 9),
    cohort_year smallint not null,
    school_year text not null,
    exam_name text not null,
    exam_date date not null default current_date,
    student_count integer not null default 0,
    class_count integer not null default 0,
    subject_count integer not null default 0,
    total_max numeric,
    total_avg numeric,
    source text not null default 'local-school-score-analytics',
    snapshot jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists analysis_snapshots_owner_created_idx
    on public.analysis_snapshots (owner_id, created_at desc);

create index if not exists analysis_snapshots_owner_grade_cohort_idx
    on public.analysis_snapshots (owner_id, grade, cohort_year, exam_date desc);

create index if not exists analysis_snapshots_snapshot_gin_idx
    on public.analysis_snapshots using gin (snapshot jsonb_path_ops);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists analysis_snapshots_set_updated_at on public.analysis_snapshots;
create trigger analysis_snapshots_set_updated_at
before update on public.analysis_snapshots
for each row
execute function public.set_updated_at();

alter table public.analysis_snapshots enable row level security;

drop policy if exists "analysis_snapshots_select_own" on public.analysis_snapshots;
drop policy if exists "analysis_snapshots_insert_own" on public.analysis_snapshots;
drop policy if exists "analysis_snapshots_update_own" on public.analysis_snapshots;
drop policy if exists "analysis_snapshots_delete_own" on public.analysis_snapshots;

create policy "analysis_snapshots_select_own"
on public.analysis_snapshots
for select
to authenticated
using (owner_id = auth.uid());

create policy "analysis_snapshots_insert_own"
on public.analysis_snapshots
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "analysis_snapshots_update_own"
on public.analysis_snapshots
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "analysis_snapshots_delete_own"
on public.analysis_snapshots
for delete
to authenticated
using (owner_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'school-analysis-files',
    'school-analysis-files',
    false,
    52428800,
    array[
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/json',
        'application/octet-stream'
    ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "school_analysis_files_select_own" on storage.objects;
drop policy if exists "school_analysis_files_insert_own" on storage.objects;
drop policy if exists "school_analysis_files_update_own" on storage.objects;
drop policy if exists "school_analysis_files_delete_own" on storage.objects;

create policy "school_analysis_files_select_own"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'school-analysis-files'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "school_analysis_files_insert_own"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'school-analysis-files'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "school_analysis_files_update_own"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'school-analysis-files'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'school-analysis-files'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "school_analysis_files_delete_own"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'school-analysis-files'
    and (storage.foldername(name))[1] = auth.uid()::text
);
