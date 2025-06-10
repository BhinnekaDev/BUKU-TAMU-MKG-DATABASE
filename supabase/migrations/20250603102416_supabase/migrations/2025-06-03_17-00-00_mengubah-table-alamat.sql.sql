create type "public"."Asal_Pengunjung" as enum ('BMKG', 'PEMPROV', 'PEMKAB', 'PEMKOT', 'UNIVERSITAS', 'UMUM');

create type "public"."Peran_Admin" as enum ('Admin', 'Superadmin');

create type "public"."status_kunjungan_enum" as enum ('menunggu_persetujuan', 'disetujui', 'dibatalkan');

create table "public"."Activity_Log" (
    "ID_Activity" uuid not null default gen_random_uuid(),
    "ID_User" uuid,
    "Role" character varying(50),
    "Action" text,
    "Description" text,
    "IP_Address" character varying,
    "User_Agent" text,
    "Created_At" timestamp with time zone default (now() AT TIME ZONE 'utc'::text)
);


create table "public"."Admin" (
    "ID_Admin" uuid not null,
    "Peran" "Peran_Admin" not null,
    "ID_Stasiun" uuid,
    "Created_At" timestamp with time zone default now(),
    "Nama_Depan_Admin" character varying(255) not null,
    "Nama_Belakang_Admin" character varying(255) not null,
    "Email_Admin" character varying(255) not null,
    "Foto_Admin" text
);


create table "public"."Alamat" (
    "ID_Alamat" uuid not null default gen_random_uuid(),
    "Provinsi" character varying,
    "Kabupaten" character varying,
    "Kecamatan" character varying,
    "Kelurahan" character varying,
    "Kode_Pos" character varying,
    "RT" integer,
    "RW" integer,
    "Alamat_Jalan" text,
    "Provinsi_ID" character varying,
    "Kabupaten_ID" character varying,
    "Kecamatan_ID" character varying,
    "Kelurahan_ID" character varying
);


create table "public"."Buku_Tamu" (
    "ID_Buku_Tamu" uuid not null default gen_random_uuid(),
    "ID_Pengunjung" uuid not null,
    "ID_Stasiun" uuid not null,
    "Tujuan" text not null,
    "Tanda_Tangan" character varying,
    "Tanggal_Pengisian" timestamp with time zone default timezone('Asia/Jakarta'::text, now()),
    "Status" status_kunjungan_enum not null default 'menunggu_persetujuan'::status_kunjungan_enum
);


create table "public"."Pengunjung" (
    "ID_Pengunjung" uuid not null,
    "ID_Alamat" uuid,
    "Nama_Depan_Pengunjung" character varying,
    "Nama_Belakang_Pengunjung" character varying,
    "Email_Pengunjung" character varying,
    "No_Telepon_Pengunjung" character varying,
    "Asal_Pengunjung" "Asal_Pengunjung",
    "Keterangan_Asal_Pengunjung" character varying,
    "Foto_Pengunjung" character varying
);


create table "public"."Stasiun" (
    "ID_Stasiun" uuid not null default gen_random_uuid(),
    "Nama_Stasiun" character varying(255) not null
);


CREATE UNIQUE INDEX "Activity_Log_pkey" ON public."Activity_Log" USING btree ("ID_Activity");

CREATE UNIQUE INDEX "Admin_pkey" ON public."Admin" USING btree ("ID_Admin");

CREATE UNIQUE INDEX "Alamat_pkey" ON public."Alamat" USING btree ("ID_Alamat");

CREATE UNIQUE INDEX "Buku_Tamu_pkey" ON public."Buku_Tamu" USING btree ("ID_Buku_Tamu");

CREATE UNIQUE INDEX "Pengunjung_Email_Pengunjung_key" ON public."Pengunjung" USING btree ("Email_Pengunjung");

CREATE UNIQUE INDEX "Pengunjung_pkey" ON public."Pengunjung" USING btree ("ID_Pengunjung");

CREATE UNIQUE INDEX "Stasiun_pkey" ON public."Stasiun" USING btree ("ID_Stasiun");

CREATE UNIQUE INDEX alamat_unik ON public."Alamat" USING btree ("Provinsi", "Kabupaten", "Kecamatan", "Kelurahan", "Kode_Pos", "RT", "RW", "Alamat_Jalan");

alter table "public"."Activity_Log" add constraint "Activity_Log_pkey" PRIMARY KEY using index "Activity_Log_pkey";

alter table "public"."Admin" add constraint "Admin_pkey" PRIMARY KEY using index "Admin_pkey";

alter table "public"."Alamat" add constraint "Alamat_pkey" PRIMARY KEY using index "Alamat_pkey";

alter table "public"."Buku_Tamu" add constraint "Buku_Tamu_pkey" PRIMARY KEY using index "Buku_Tamu_pkey";

alter table "public"."Pengunjung" add constraint "Pengunjung_pkey" PRIMARY KEY using index "Pengunjung_pkey";

alter table "public"."Stasiun" add constraint "Stasiun_pkey" PRIMARY KEY using index "Stasiun_pkey";

alter table "public"."Admin" add constraint "fk_admin_stasiun" FOREIGN KEY ("ID_Stasiun") REFERENCES "Stasiun"("ID_Stasiun") ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."Admin" validate constraint "fk_admin_stasiun";

alter table "public"."Admin" add constraint "fk_user" FOREIGN KEY ("ID_Admin") REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."Admin" validate constraint "fk_user";

alter table "public"."Alamat" add constraint "alamat_unik" UNIQUE using index "alamat_unik";

alter table "public"."Buku_Tamu" add constraint "Buku_Tamu_ID_Pengunjung_fkey" FOREIGN KEY ("ID_Pengunjung") REFERENCES "Pengunjung"("ID_Pengunjung") ON DELETE CASCADE not valid;

alter table "public"."Buku_Tamu" validate constraint "Buku_Tamu_ID_Pengunjung_fkey";

alter table "public"."Buku_Tamu" add constraint "Buku_Tamu_ID_Stasiun_fkey" FOREIGN KEY ("ID_Stasiun") REFERENCES "Stasiun"("ID_Stasiun") ON DELETE CASCADE not valid;

alter table "public"."Buku_Tamu" validate constraint "Buku_Tamu_ID_Stasiun_fkey";

alter table "public"."Pengunjung" add constraint "Pengunjung_Email_Pengunjung_key" UNIQUE using index "Pengunjung_Email_Pengunjung_key";

alter table "public"."Pengunjung" add constraint "Pengunjung_ID_Alamat_fkey" FOREIGN KEY ("ID_Alamat") REFERENCES "Alamat"("ID_Alamat") ON DELETE SET NULL not valid;

alter table "public"."Pengunjung" validate constraint "Pengunjung_ID_Alamat_fkey";

alter table "public"."Pengunjung" add constraint "fk_pengunjung_user" FOREIGN KEY ("ID_Pengunjung") REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."Pengunjung" validate constraint "fk_pengunjung_user";

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


