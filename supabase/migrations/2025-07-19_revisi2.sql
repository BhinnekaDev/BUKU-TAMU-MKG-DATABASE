--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: Asal_Pengunjung; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Asal_Pengunjung" AS ENUM (
    'Umum',
    'Universitas',
    'Pemerintah Pusat/Pemerintah Daerah',
    'BMKG'
);


--
-- Name: Peran_Admin; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Peran_Admin" AS ENUM (
    'Admin',
    'Superadmin'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Activity_Log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Activity_Log" (
    "ID_Activity" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ID_User" uuid,
    "Role" character varying(50),
    "Action" text,
    "Description" text,
    "IP_Address" character varying,
    "User_Agent" text,
    "Created_At" timestamp with time zone DEFAULT (now() AT TIME ZONE 'utc'::text)
);


--
-- Name: Admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Admin" (
    "ID_Admin" uuid NOT NULL,
    "Peran" public."Peran_Admin" NOT NULL,
    "ID_Stasiun" uuid,
    "Created_At" timestamp with time zone DEFAULT now(),
    "Nama_Depan_Admin" character varying(255) NOT NULL,
    "Nama_Belakang_Admin" character varying(255) NOT NULL,
    "Email_Admin" character varying(255) NOT NULL,
    "Foto_Admin" text
);


--
-- Name: Buku_Tamu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Buku_Tamu" (
    "ID_Buku_Tamu" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ID_Pengunjung" uuid NOT NULL,
    "ID_Stasiun" uuid NOT NULL,
    "Tujuan" text NOT NULL,
    "Tanda_Tangan" character varying,
    "Tanggal_Pengisian" timestamp with time zone DEFAULT timezone('Asia/Jakarta'::text, now()),
    "Waktu_Kunjungan" character varying DEFAULT ''::character varying
);


--
-- Name: Pengunjung; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Pengunjung" (
    "ID_Pengunjung" uuid NOT NULL,
    "Nama_Depan_Pengunjung" character varying,
    "Nama_Belakang_Pengunjung" character varying,
    "Email_Pengunjung" character varying,
    "No_Telepon_Pengunjung" character varying,
    "Asal_Pengunjung" public."Asal_Pengunjung",
    "Asal_Instansi" character varying,
    "Alamat_Lengkap" text
);


--
-- Name: Stasiun; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Stasiun" (
    "ID_Stasiun" uuid DEFAULT gen_random_uuid() NOT NULL,
    "Nama_Stasiun" character varying(255) NOT NULL
);


--
-- Name: Activity_Log Activity_Log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity_Log"
    ADD CONSTRAINT "Activity_Log_pkey" PRIMARY KEY ("ID_Activity");


--
-- Name: Admin Admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT "Admin_pkey" PRIMARY KEY ("ID_Admin");


--
-- Name: Buku_Tamu Buku_Tamu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Buku_Tamu"
    ADD CONSTRAINT "Buku_Tamu_pkey" PRIMARY KEY ("ID_Buku_Tamu");


--
-- Name: Pengunjung Pengunjung_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pengunjung"
    ADD CONSTRAINT "Pengunjung_pkey" PRIMARY KEY ("ID_Pengunjung");


--
-- Name: Stasiun Stasiun_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Stasiun"
    ADD CONSTRAINT "Stasiun_pkey" PRIMARY KEY ("ID_Stasiun");


--
-- Name: Buku_Tamu Buku_Tamu_ID_Pengunjung_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Buku_Tamu"
    ADD CONSTRAINT "Buku_Tamu_ID_Pengunjung_fkey" FOREIGN KEY ("ID_Pengunjung") REFERENCES public."Pengunjung"("ID_Pengunjung") ON DELETE CASCADE;


--
-- Name: Buku_Tamu Buku_Tamu_ID_Stasiun_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Buku_Tamu"
    ADD CONSTRAINT "Buku_Tamu_ID_Stasiun_fkey" FOREIGN KEY ("ID_Stasiun") REFERENCES public."Stasiun"("ID_Stasiun") ON DELETE CASCADE;


--
-- Name: Admin fk_admin_stasiun; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT fk_admin_stasiun FOREIGN KEY ("ID_Stasiun") REFERENCES public."Stasiun"("ID_Stasiun") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Admin fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Admin"
    ADD CONSTRAINT fk_user FOREIGN KEY ("ID_Admin") REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: TABLE "Activity_Log"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Activity_Log" TO anon;
GRANT ALL ON TABLE public."Activity_Log" TO authenticated;
GRANT ALL ON TABLE public."Activity_Log" TO service_role;


--
-- Name: TABLE "Admin"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Admin" TO anon;
GRANT ALL ON TABLE public."Admin" TO authenticated;
GRANT ALL ON TABLE public."Admin" TO service_role;


--
-- Name: TABLE "Buku_Tamu"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Buku_Tamu" TO anon;
GRANT ALL ON TABLE public."Buku_Tamu" TO authenticated;
GRANT ALL ON TABLE public."Buku_Tamu" TO service_role;


--
-- Name: TABLE "Pengunjung"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Pengunjung" TO anon;
GRANT ALL ON TABLE public."Pengunjung" TO authenticated;
GRANT ALL ON TABLE public."Pengunjung" TO service_role;


--
-- Name: TABLE "Stasiun"; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public."Stasiun" TO anon;
GRANT ALL ON TABLE public."Stasiun" TO authenticated;
GRANT ALL ON TABLE public."Stasiun" TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

