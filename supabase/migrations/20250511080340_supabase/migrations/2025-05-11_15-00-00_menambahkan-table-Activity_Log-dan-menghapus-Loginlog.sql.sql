create type "public"."Asal_Pengunjung" as enum ('BMKG', 'PEMPROV', 'PEMKAB', 'PEMKOT', 'UNIVERSITAS', 'UMUM');

create type "public"."Jenis_Stasiun" as enum ('Meteorologi', 'Klimatologi', 'Geofisika');

create type "public"."Peran_Admin" as enum ('Admin', 'Superadmin');

create sequence "public"."Activity_Log_ID_Activity_seq";

create sequence "public"."Admin_ID_Admin_seq";

create sequence "public"."Alamat_ID_Alamat_seq";

create sequence "public"."Buku_Tamu_ID_Buku_Tamu_seq";

create sequence "public"."Pengunjung_ID_Pengunjung_seq";

create sequence "public"."Stasiun_ID_Stasiun_seq";

create table "public"."Activity_Log" (
    "ID_Activity" integer not null default nextval('"Activity_Log_ID_Activity_seq"'::regclass),
    "ID_Admin" integer,
    "ID_Pengunjung" integer,
    "IP_Address" character varying,
    "Created_At" timestamp with time zone default (now() AT TIME ZONE 'utc'::text),
    "Description" text,
    "Action" text,
    "User_Agent" text
);


alter table "public"."Activity_Log" enable row level security;

create table "public"."Admin" (
    "ID_Admin" integer not null default nextval('"Admin_ID_Admin_seq"'::regclass),
    "ID_Stasiun" integer,
    "Nama_Depan_Admin" character varying,
    "Nama_Belakang_Admin" character varying,
    "Email_Admin" character varying,
    "Kata_Sandi_Admin" character varying,
    "Peran" "Peran_Admin"
);


alter table "public"."Admin" enable row level security;

create table "public"."Alamat" (
    "ID_Alamat" integer not null default nextval('"Alamat_ID_Alamat_seq"'::regclass),
    "Provinsi" character varying,
    "Kabupaten" character varying,
    "Kecamatan" character varying,
    "Kelurahan" character varying,
    "Kode_Pos" character varying,
    "RT" integer,
    "RW" integer,
    "Alamat_Jalan" text
);


alter table "public"."Alamat" enable row level security;

create table "public"."Buku_Tamu" (
    "ID_Buku_Tamu" integer not null default nextval('"Buku_Tamu_ID_Buku_Tamu_seq"'::regclass),
    "ID_Pengunjung" integer,
    "ID_Stasiun" integer,
    "Tujuan" text,
    "Tanda_Tangan" character varying,
    "Tanggal_Pengisian" timestamp without time zone
);


alter table "public"."Buku_Tamu" enable row level security;

create table "public"."Pengunjung" (
    "ID_Pengunjung" integer not null default nextval('"Pengunjung_ID_Pengunjung_seq"'::regclass),
    "ID_Alamat" integer,
    "Nama_Depan_Pengunjung" character varying,
    "Nama_Belakang_Pengunjung" character varying,
    "Email_Pengunjung" character varying,
    "Kata_Sandi_Pengunjung" character varying,
    "No_Telepon_Pengunjung" character varying,
    "Asal_Pengunjung" "Asal_Pengunjung",
    "Keterangan_Asal_Pengunjung" character varying,
    "Foto_Pengunjung" character varying
);


alter table "public"."Pengunjung" enable row level security;

create table "public"."Stasiun" (
    "ID_Stasiun" integer not null default nextval('"Stasiun_ID_Stasiun_seq"'::regclass),
    "Nama_Stasiun" "Jenis_Stasiun" not null
);


alter table "public"."Stasiun" enable row level security;

alter sequence "public"."Activity_Log_ID_Activity_seq" owned by "public"."Activity_Log"."ID_Activity";

alter sequence "public"."Admin_ID_Admin_seq" owned by "public"."Admin"."ID_Admin";

alter sequence "public"."Alamat_ID_Alamat_seq" owned by "public"."Alamat"."ID_Alamat";

alter sequence "public"."Buku_Tamu_ID_Buku_Tamu_seq" owned by "public"."Buku_Tamu"."ID_Buku_Tamu";

alter sequence "public"."Pengunjung_ID_Pengunjung_seq" owned by "public"."Pengunjung"."ID_Pengunjung";

alter sequence "public"."Stasiun_ID_Stasiun_seq" owned by "public"."Stasiun"."ID_Stasiun";

CREATE UNIQUE INDEX "Activity_Log_pkey" ON public."Activity_Log" USING btree ("ID_Activity");

CREATE UNIQUE INDEX "Admin_pkey" ON public."Admin" USING btree ("ID_Admin");

CREATE UNIQUE INDEX "Alamat_pkey" ON public."Alamat" USING btree ("ID_Alamat");

CREATE UNIQUE INDEX "Buku_Tamu_pkey" ON public."Buku_Tamu" USING btree ("ID_Buku_Tamu");

CREATE UNIQUE INDEX "Pengunjung_pkey" ON public."Pengunjung" USING btree ("ID_Pengunjung");

CREATE UNIQUE INDEX "Stasiun_pkey" ON public."Stasiun" USING btree ("ID_Stasiun");

CREATE UNIQUE INDEX unique_email_admin ON public."Admin" USING btree ("Email_Admin");

CREATE UNIQUE INDEX unique_email_pengunjung ON public."Pengunjung" USING btree ("Email_Pengunjung");

alter table "public"."Activity_Log" add constraint "Activity_Log_pkey" PRIMARY KEY using index "Activity_Log_pkey";

alter table "public"."Admin" add constraint "Admin_pkey" PRIMARY KEY using index "Admin_pkey";

alter table "public"."Alamat" add constraint "Alamat_pkey" PRIMARY KEY using index "Alamat_pkey";

alter table "public"."Buku_Tamu" add constraint "Buku_Tamu_pkey" PRIMARY KEY using index "Buku_Tamu_pkey";

alter table "public"."Pengunjung" add constraint "Pengunjung_pkey" PRIMARY KEY using index "Pengunjung_pkey";

alter table "public"."Stasiun" add constraint "Stasiun_pkey" PRIMARY KEY using index "Stasiun_pkey";

alter table "public"."Activity_Log" add constraint "Activity_Log_ID_Admin_fkey" FOREIGN KEY ("ID_Admin") REFERENCES "Admin"("ID_Admin") ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."Activity_Log" validate constraint "Activity_Log_ID_Admin_fkey";

alter table "public"."Activity_Log" add constraint "Activity_Log_ID_Pengunjung_fkey" FOREIGN KEY ("ID_Pengunjung") REFERENCES "Pengunjung"("ID_Pengunjung") ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."Activity_Log" validate constraint "Activity_Log_ID_Pengunjung_fkey";

alter table "public"."Admin" add constraint "Admin_ID_Stasiun_fkey" FOREIGN KEY ("ID_Stasiun") REFERENCES "Stasiun"("ID_Stasiun") ON DELETE CASCADE not valid;

alter table "public"."Admin" validate constraint "Admin_ID_Stasiun_fkey";

alter table "public"."Admin" add constraint "unique_email_admin" UNIQUE using index "unique_email_admin";

alter table "public"."Buku_Tamu" add constraint "Buku_Tamu_ID_Pengunjung_fkey" FOREIGN KEY ("ID_Pengunjung") REFERENCES "Pengunjung"("ID_Pengunjung") ON DELETE CASCADE not valid;

alter table "public"."Buku_Tamu" validate constraint "Buku_Tamu_ID_Pengunjung_fkey";

alter table "public"."Buku_Tamu" add constraint "Buku_Tamu_ID_Stasiun_fkey" FOREIGN KEY ("ID_Stasiun") REFERENCES "Stasiun"("ID_Stasiun") ON DELETE CASCADE not valid;

alter table "public"."Buku_Tamu" validate constraint "Buku_Tamu_ID_Stasiun_fkey";

alter table "public"."Pengunjung" add constraint "Pengunjung_ID_Alamat_fkey" FOREIGN KEY ("ID_Alamat") REFERENCES "Alamat"("ID_Alamat") ON DELETE SET NULL not valid;

alter table "public"."Pengunjung" validate constraint "Pengunjung_ID_Alamat_fkey";

alter table "public"."Pengunjung" add constraint "unique_email_pengunjung" UNIQUE using index "unique_email_pengunjung";

grant delete on table "public"."Activity_Log" to "anon";

grant insert on table "public"."Activity_Log" to "anon";

grant references on table "public"."Activity_Log" to "anon";

grant select on table "public"."Activity_Log" to "anon";

grant trigger on table "public"."Activity_Log" to "anon";

grant truncate on table "public"."Activity_Log" to "anon";

grant update on table "public"."Activity_Log" to "anon";

grant delete on table "public"."Activity_Log" to "authenticated";

grant insert on table "public"."Activity_Log" to "authenticated";

grant references on table "public"."Activity_Log" to "authenticated";

grant select on table "public"."Activity_Log" to "authenticated";

grant trigger on table "public"."Activity_Log" to "authenticated";

grant truncate on table "public"."Activity_Log" to "authenticated";

grant update on table "public"."Activity_Log" to "authenticated";

grant delete on table "public"."Activity_Log" to "service_role";

grant insert on table "public"."Activity_Log" to "service_role";

grant references on table "public"."Activity_Log" to "service_role";

grant select on table "public"."Activity_Log" to "service_role";

grant trigger on table "public"."Activity_Log" to "service_role";

grant truncate on table "public"."Activity_Log" to "service_role";

grant update on table "public"."Activity_Log" to "service_role";

grant delete on table "public"."Admin" to "anon";

grant insert on table "public"."Admin" to "anon";

grant references on table "public"."Admin" to "anon";

grant select on table "public"."Admin" to "anon";

grant trigger on table "public"."Admin" to "anon";

grant truncate on table "public"."Admin" to "anon";

grant update on table "public"."Admin" to "anon";

grant delete on table "public"."Admin" to "authenticated";

grant insert on table "public"."Admin" to "authenticated";

grant references on table "public"."Admin" to "authenticated";

grant select on table "public"."Admin" to "authenticated";

grant trigger on table "public"."Admin" to "authenticated";

grant truncate on table "public"."Admin" to "authenticated";

grant update on table "public"."Admin" to "authenticated";

grant delete on table "public"."Admin" to "service_role";

grant insert on table "public"."Admin" to "service_role";

grant references on table "public"."Admin" to "service_role";

grant select on table "public"."Admin" to "service_role";

grant trigger on table "public"."Admin" to "service_role";

grant truncate on table "public"."Admin" to "service_role";

grant update on table "public"."Admin" to "service_role";

grant delete on table "public"."Alamat" to "anon";

grant insert on table "public"."Alamat" to "anon";

grant references on table "public"."Alamat" to "anon";

grant select on table "public"."Alamat" to "anon";

grant trigger on table "public"."Alamat" to "anon";

grant truncate on table "public"."Alamat" to "anon";

grant update on table "public"."Alamat" to "anon";

grant delete on table "public"."Alamat" to "authenticated";

grant insert on table "public"."Alamat" to "authenticated";

grant references on table "public"."Alamat" to "authenticated";

grant select on table "public"."Alamat" to "authenticated";

grant trigger on table "public"."Alamat" to "authenticated";

grant truncate on table "public"."Alamat" to "authenticated";

grant update on table "public"."Alamat" to "authenticated";

grant delete on table "public"."Alamat" to "service_role";

grant insert on table "public"."Alamat" to "service_role";

grant references on table "public"."Alamat" to "service_role";

grant select on table "public"."Alamat" to "service_role";

grant trigger on table "public"."Alamat" to "service_role";

grant truncate on table "public"."Alamat" to "service_role";

grant update on table "public"."Alamat" to "service_role";

grant delete on table "public"."Buku_Tamu" to "anon";

grant insert on table "public"."Buku_Tamu" to "anon";

grant references on table "public"."Buku_Tamu" to "anon";

grant select on table "public"."Buku_Tamu" to "anon";

grant trigger on table "public"."Buku_Tamu" to "anon";

grant truncate on table "public"."Buku_Tamu" to "anon";

grant update on table "public"."Buku_Tamu" to "anon";

grant delete on table "public"."Buku_Tamu" to "authenticated";

grant insert on table "public"."Buku_Tamu" to "authenticated";

grant references on table "public"."Buku_Tamu" to "authenticated";

grant select on table "public"."Buku_Tamu" to "authenticated";

grant trigger on table "public"."Buku_Tamu" to "authenticated";

grant truncate on table "public"."Buku_Tamu" to "authenticated";

grant update on table "public"."Buku_Tamu" to "authenticated";

grant delete on table "public"."Buku_Tamu" to "service_role";

grant insert on table "public"."Buku_Tamu" to "service_role";

grant references on table "public"."Buku_Tamu" to "service_role";

grant select on table "public"."Buku_Tamu" to "service_role";

grant trigger on table "public"."Buku_Tamu" to "service_role";

grant truncate on table "public"."Buku_Tamu" to "service_role";

grant update on table "public"."Buku_Tamu" to "service_role";

grant delete on table "public"."Pengunjung" to "anon";

grant insert on table "public"."Pengunjung" to "anon";

grant references on table "public"."Pengunjung" to "anon";

grant select on table "public"."Pengunjung" to "anon";

grant trigger on table "public"."Pengunjung" to "anon";

grant truncate on table "public"."Pengunjung" to "anon";

grant update on table "public"."Pengunjung" to "anon";

grant delete on table "public"."Pengunjung" to "authenticated";

grant insert on table "public"."Pengunjung" to "authenticated";

grant references on table "public"."Pengunjung" to "authenticated";

grant select on table "public"."Pengunjung" to "authenticated";

grant trigger on table "public"."Pengunjung" to "authenticated";

grant truncate on table "public"."Pengunjung" to "authenticated";

grant update on table "public"."Pengunjung" to "authenticated";

grant delete on table "public"."Pengunjung" to "service_role";

grant insert on table "public"."Pengunjung" to "service_role";

grant references on table "public"."Pengunjung" to "service_role";

grant select on table "public"."Pengunjung" to "service_role";

grant trigger on table "public"."Pengunjung" to "service_role";

grant truncate on table "public"."Pengunjung" to "service_role";

grant update on table "public"."Pengunjung" to "service_role";

grant delete on table "public"."Stasiun" to "anon";

grant insert on table "public"."Stasiun" to "anon";

grant references on table "public"."Stasiun" to "anon";

grant select on table "public"."Stasiun" to "anon";

grant trigger on table "public"."Stasiun" to "anon";

grant truncate on table "public"."Stasiun" to "anon";

grant update on table "public"."Stasiun" to "anon";

grant delete on table "public"."Stasiun" to "authenticated";

grant insert on table "public"."Stasiun" to "authenticated";

grant references on table "public"."Stasiun" to "authenticated";

grant select on table "public"."Stasiun" to "authenticated";

grant trigger on table "public"."Stasiun" to "authenticated";

grant truncate on table "public"."Stasiun" to "authenticated";

grant update on table "public"."Stasiun" to "authenticated";

grant delete on table "public"."Stasiun" to "service_role";

grant insert on table "public"."Stasiun" to "service_role";

grant references on table "public"."Stasiun" to "service_role";

grant select on table "public"."Stasiun" to "service_role";

grant trigger on table "public"."Stasiun" to "service_role";

grant truncate on table "public"."Stasiun" to "service_role";

grant update on table "public"."Stasiun" to "service_role";


