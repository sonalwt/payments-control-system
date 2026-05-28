--
-- PostgreSQL database dump
--

\restrict q0TGcYTzGG7B3jNa5mb5npQfDpwGQq0s9nu8bNRSJJZ7cDbOT1LumZQXuIhQsVX

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email public.citext NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    employee_code character varying(50),
    is_active boolean DEFAULT true,
    is_platform_admin boolean DEFAULT false,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, code, name, description, is_system, created_at, updated_at, deleted_at) FROM stdin;
44da9987-9d61-4bcf-92ab-9da2646b1700	SUPER_ADMIN	Super Admin	Full platform access â system administrator	t	2026-05-27 21:33:15.405053+05:30	2026-05-27 21:33:15.405053+05:30	\N
8155a8f5-9633-462b-aaa3-1d3fdb0e88b5	INITIATOR	Initiator	Creates and submits payment requests for review	f	2026-05-27 21:33:15.405053+05:30	2026-05-27 21:33:15.405053+05:30	\N
a8a25161-b0e1-4c4a-883d-2f1805e1f650	CHECKER	Checker	Reviews and validates payment requests before approval	f	2026-05-27 21:33:15.405053+05:30	2026-05-27 21:33:15.405053+05:30	\N
d996b2b5-f194-4591-af5e-8be0ac5eb270	APPROVER_1	Approver Level 1	First-level approver; can approve within delegated authority limits	f	2026-05-27 21:33:15.405053+05:30	2026-05-27 21:33:15.405053+05:30	\N
bb2ed825-ee69-4e2f-8e8b-e58d0703d710	APPROVER_2	Approver Level 2	Final / senior approver for high-value transactions (above USD 1mn)	f	2026-05-27 21:33:15.405053+05:30	2026-05-27 21:33:15.405053+05:30	\N
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role_id, created_at) FROM stdin;
8dfc4ddf-b09e-4a04-bfb2-38b504245bfa	41b975e3-6fba-4363-a3fe-06e37c8b2f66	44da9987-9d61-4bcf-92ab-9da2646b1700	2026-05-27 21:34:38.835135+05:30
47190531-5ff1-41b1-827a-eda430cd8946	e0efd8a0-c389-4da4-b376-c1f7363d9d0f	8155a8f5-9633-462b-aaa3-1d3fdb0e88b5	2026-05-27 21:34:38.835135+05:30
143fa900-c069-42d0-b2aa-2d1946f1d751	d5c2365e-54c1-429b-abdf-3b8c4a6f1666	8155a8f5-9633-462b-aaa3-1d3fdb0e88b5	2026-05-27 21:34:38.835135+05:30
67fa6740-0dcb-4032-962e-cd61bf2f1ad1	96bdf899-6190-4bac-b020-ee98fd1a663f	8155a8f5-9633-462b-aaa3-1d3fdb0e88b5	2026-05-27 21:34:38.835135+05:30
339825be-9937-465b-850a-eb1fa54f847d	007a532a-f00c-4453-a438-830d26e4e370	8155a8f5-9633-462b-aaa3-1d3fdb0e88b5	2026-05-27 21:34:38.835135+05:30
b1c41739-cd62-4e55-be36-693592ae87c4	89ec48f9-172a-4e51-b102-de057d0756d1	8155a8f5-9633-462b-aaa3-1d3fdb0e88b5	2026-05-27 21:34:38.835135+05:30
115e1dd3-dc8b-4d2a-8c03-596a839b8365	699e1fc8-51c9-4654-9bf1-a090875e8d8c	8155a8f5-9633-462b-aaa3-1d3fdb0e88b5	2026-05-27 21:34:38.835135+05:30
a40ce566-797d-415d-97ef-4bbd14bd73e3	106dedd2-3689-47c5-927b-ed6ac5219cd7	8155a8f5-9633-462b-aaa3-1d3fdb0e88b5	2026-05-27 21:34:38.835135+05:30
d9019482-76db-4b3e-b5a1-60cee7797f68	e0efd8a0-c389-4da4-b376-c1f7363d9d0f	a8a25161-b0e1-4c4a-883d-2f1805e1f650	2026-05-27 21:34:38.835135+05:30
d1ba57d6-1ea7-4736-a5a1-c8b488f5e38b	a2df5712-de9e-454e-bde6-c60b645275a3	a8a25161-b0e1-4c4a-883d-2f1805e1f650	2026-05-27 21:34:38.835135+05:30
39994897-6f66-4c9d-a29d-55aaa54df4ac	ac7d5a4a-6575-4c28-92b6-760db04b0367	d996b2b5-f194-4591-af5e-8be0ac5eb270	2026-05-27 21:34:38.835135+05:30
1dd3398c-76f4-463b-a1a5-747fde2dcb32	cecec475-ceb7-4dd5-852e-78824c332d97	d996b2b5-f194-4591-af5e-8be0ac5eb270	2026-05-27 21:34:38.835135+05:30
77474320-f3ff-4719-b551-f6bd2c87815d	2129c53b-7a14-487b-9633-172b24eb7ec5	d996b2b5-f194-4591-af5e-8be0ac5eb270	2026-05-27 21:34:38.835135+05:30
d8e95d7b-8d84-409e-ae73-930f59a93744	b7aa4cac-92c2-42cd-8d52-cb15c9a06929	d996b2b5-f194-4591-af5e-8be0ac5eb270	2026-05-27 21:34:38.835135+05:30
8ae96bbb-cd36-4bd6-975a-e10228e0a0e6	796fdc23-904b-46fc-98da-140b23d15aa4	d996b2b5-f194-4591-af5e-8be0ac5eb270	2026-05-27 21:34:38.835135+05:30
bc44d1bd-f35b-4ba5-befe-3f54e85205dc	a9d1e44b-f1f3-4da7-a443-5c02ca89a73d	d996b2b5-f194-4591-af5e-8be0ac5eb270	2026-05-27 21:34:38.835135+05:30
085eaf09-3440-406a-99e0-6ce1be7180e9	bcd74998-6770-4ec0-8571-5ff8721bf913	d996b2b5-f194-4591-af5e-8be0ac5eb270	2026-05-27 21:34:38.835135+05:30
163cc649-dffa-4c20-868c-c940179c82b5	28aa8171-b5ee-45b6-baca-ff970a13de2d	d996b2b5-f194-4591-af5e-8be0ac5eb270	2026-05-27 21:34:38.835135+05:30
8489ab6a-17cd-47f0-b8d2-8a11637f5a7a	ac7d5a4a-6575-4c28-92b6-760db04b0367	bb2ed825-ee69-4e2f-8e8b-e58d0703d710	2026-05-27 21:34:38.835135+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, full_name, employee_code, is_active, is_platform_admin, last_login_at, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
ac7d5a4a-6575-4c28-92b6-760db04b0367	pinkesh@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Pinkesh Natrajan	EMP-002	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
cecec475-ceb7-4dd5-852e-78824c332d97	ganesh@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Ganesh	EMP-003	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
2129c53b-7a14-487b-9633-172b24eb7ec5	tarang@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Tarang	EMP-004	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
b7aa4cac-92c2-42cd-8d52-cb15c9a06929	amogh@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Amogh	EMP-005	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
796fdc23-904b-46fc-98da-140b23d15aa4	rakesh@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Rakesh	EMP-006	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
a9d1e44b-f1f3-4da7-a443-5c02ca89a73d	sachin@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Sachin	EMP-007	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
bcd74998-6770-4ec0-8571-5ff8721bf913	keval@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Keval	EMP-008	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
28aa8171-b5ee-45b6-baca-ff970a13de2d	anushya@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Anushya	EMP-009	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
e0efd8a0-c389-4da4-b376-c1f7363d9d0f	urvil.shah@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Urvil Anil Shah	EMP-010	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
a2df5712-de9e-454e-bde6-c60b645275a3	krrish.jain@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Krrish Jain	EMP-011	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
d5c2365e-54c1-429b-abdf-3b8c4a6f1666	vinay.natrajan@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Vinay Natrajan	EMP-012	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
96bdf899-6190-4bac-b020-ee98fd1a663f	abirami@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Abirami	EMP-013	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
007a532a-f00c-4453-a438-830d26e4e370	meena@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Meena	EMP-014	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
89ec48f9-172a-4e51-b102-de057d0756d1	venessa@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Venessa	EMP-015	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
699e1fc8-51c9-4654-9bf1-a090875e8d8c	pritesh@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Pritesh	EMP-016	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
106dedd2-3689-47c5-927b-ed6ac5219cd7	lovely@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	Lovely	EMP-017	t	f	\N	2026-05-27 21:33:54.21444+05:30	2026-05-27 21:33:54.21444+05:30	\N	\N	\N
41b975e3-6fba-4363-a3fe-06e37c8b2f66	admin@radiant.com	$2b$12$GDr0P7Wy5mh3k7j1hn23vO2eqNaUxnf9o1cDgkGql.KtO2NIxFPnq	System Admin	EMP-001	t	t	2026-05-27 22:11:55.067+05:30	2026-05-27 21:33:54.21444+05:30	2026-05-27 22:11:55.08463+05:30	\N	\N	\N
\.


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_code_key UNIQUE (employee_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict q0TGcYTzGG7B3jNa5mb5npQfDpwGQq0s9nu8bNRSJJZ7cDbOT1LumZQXuIhQsVX
