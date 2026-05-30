--
-- PostgreSQL database dump
--

\restrict tmKahVh2xUCNibu9lQXRHFPMZFkHZ9w9bjyUFkKkbU7bUN0zRiY1tqL9stmEHcZ

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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
-- Name: account_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.account_types OWNER TO postgres;

--
-- Name: approval_matrices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval_matrices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    payment_type_id uuid NOT NULL,
    currency_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    status character varying(15) DEFAULT 'DRAFT'::character varying NOT NULL,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    effective_to date,
    published_at timestamp with time zone,
    published_by uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT chk_matrix_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PUBLISHED'::character varying, 'SUPERSEDED'::character varying])::text[])))
);


ALTER TABLE public.approval_matrices OWNER TO postgres;

--
-- Name: approval_matrix_bands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval_matrix_bands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    matrix_id uuid NOT NULL,
    sort_order integer NOT NULL,
    min_amount numeric(20,4) NOT NULL,
    max_amount numeric(20,4),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_band_amounts CHECK (((max_amount IS NULL) OR (max_amount > min_amount)))
);


ALTER TABLE public.approval_matrix_bands OWNER TO postgres;

--
-- Name: approval_matrix_steps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval_matrix_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    band_id uuid NOT NULL,
    step_order integer NOT NULL,
    approver_type character varying(10) NOT NULL,
    approver_user_id uuid,
    approver_role_id uuid,
    is_optional boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_step_approver_target CHECK (((((approver_type)::text = 'USER'::text) AND (approver_user_id IS NOT NULL) AND (approver_role_id IS NULL)) OR (((approver_type)::text = 'ROLE'::text) AND (approver_role_id IS NOT NULL) AND (approver_user_id IS NULL)))),
    CONSTRAINT chk_step_approver_type CHECK (((approver_type)::text = ANY ((ARRAY['USER'::character varying, 'ROLE'::character varying])::text[])))
);


ALTER TABLE public.approval_matrix_steps OWNER TO postgres;

--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bank_id uuid,
    bank_nickname character varying(100),
    currency_id uuid NOT NULL,
    account_type_id uuid,
    account_number character varying(50) NOT NULL,
    branch_name character varying(150),
    branch_code character varying(50),
    opening_balance numeric(20,4) DEFAULT 0 NOT NULL,
    minimum_balance numeric(20,4) DEFAULT 0 NOT NULL,
    is_chairman_designated boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    bank_name character varying(150),
    is_counterparty boolean DEFAULT false NOT NULL,
    remaining_balance numeric(20,4) DEFAULT 0 NOT NULL,
    counterparty_id uuid
);


ALTER TABLE public.bank_accounts OWNER TO postgres;

--
-- Name: banks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    short_name character varying(50),
    country_id uuid NOT NULL,
    swift_bic character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_counterparty boolean DEFAULT false NOT NULL
);


ALTER TABLE public.banks OWNER TO postgres;

--
-- Name: beneficiary_account_change_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.beneficiary_account_change_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    beneficiary_account_id uuid,
    change_type character varying(12) NOT NULL,
    proposed_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    documents jsonb DEFAULT '[]'::jsonb NOT NULL,
    status character varying(25) DEFAULT 'PENDING_VERIFICATION'::character varying NOT NULL,
    requested_by uuid NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    verified_by uuid,
    verified_at timestamp with time zone,
    verification_notes text,
    callback_evidence text,
    approved_by uuid,
    approved_at timestamp with time zone,
    rejected_by uuid,
    rejected_at timestamp with time zone,
    rejection_reason text,
    cooling_off_override boolean DEFAULT false CONSTRAINT beneficiary_account_change_reques_cooling_off_override_not_null NOT NULL,
    cooling_off_override_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT chk_bacr_change_type CHECK (((change_type)::text = ANY ((ARRAY['ADD'::character varying, 'MODIFY'::character varying, 'DEACTIVATE'::character varying])::text[]))),
    CONSTRAINT chk_bacr_maker_checker CHECK (((verified_by IS NULL) OR (verified_by <> requested_by))),
    CONSTRAINT chk_bacr_status CHECK (((status)::text = ANY ((ARRAY['PENDING_VERIFICATION'::character varying, 'VERIFIED'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.beneficiary_account_change_requests OWNER TO postgres;

--
-- Name: beneficiary_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.beneficiary_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    counterparty_id uuid,
    employee_id uuid,
    account_holder_name character varying(200) NOT NULL,
    account_number character varying(60) NOT NULL,
    bank_id uuid NOT NULL,
    branch_name character varying(120),
    swift_bic character varying(11),
    iban character varying(34),
    currency_id uuid NOT NULL,
    country_id uuid NOT NULL,
    account_direction character varying(15) DEFAULT 'PAY_TO'::character varying NOT NULL,
    status character varying(25) DEFAULT 'PENDING_ACTIVATION'::character varying NOT NULL,
    cooling_off_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT chk_bene_direction CHECK (((account_direction)::text = ANY ((ARRAY['PAY_TO'::character varying, 'RECEIVE_FROM'::character varying, 'BOTH'::character varying])::text[]))),
    CONSTRAINT chk_bene_owner CHECK ((((counterparty_id IS NOT NULL) AND (employee_id IS NULL)) OR ((counterparty_id IS NULL) AND (employee_id IS NOT NULL)))),
    CONSTRAINT chk_bene_status CHECK (((status)::text = ANY ((ARRAY['PENDING_ACTIVATION'::character varying, 'ACTIVE'::character varying, 'INACTIVE'::character varying])::text[])))
);


ALTER TABLE public.beneficiary_accounts OWNER TO postgres;

--
-- Name: counterparties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.counterparties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(40) NOT NULL,
    name character varying(200) NOT NULL,
    legal_name character varying(200),
    role character varying(10) NOT NULL,
    country_id uuid,
    country_code character(2),
    tax_identifiers jsonb DEFAULT '[]'::jsonb NOT NULL,
    addresses jsonb DEFAULT '[]'::jsonb NOT NULL,
    primary_contact_name character varying(150),
    primary_contact_email character varying(150),
    primary_contact_phone character varying(50),
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    kyc_done boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_counterparty_role CHECK (((role)::text = ANY ((ARRAY['VENDOR'::character varying, 'CUSTOMER'::character varying, 'BOTH'::character varying])::text[])))
);


ALTER TABLE public.counterparties OWNER TO postgres;

--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_name character varying(120) NOT NULL,
    country_short_name character varying(20) NOT NULL,
    code character varying(10) NOT NULL,
    currency_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    is_sanctioned boolean DEFAULT false NOT NULL
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- Name: currencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(10),
    name character varying(80) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.currencies OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_code character varying(50) NOT NULL,
    full_name character varying(150) NOT NULL,
    work_email public.citext NOT NULL,
    country_of_employment_id uuid NOT NULL,
    start_date date,
    end_date date,
    national_id character varying(50),
    tax_identifier character varying(50),
    date_of_birth date,
    mobile_number character varying(30),
    address text,
    compensation_band character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: legal_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.legal_entities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    country_id uuid
);


ALTER TABLE public.legal_entities OWNER TO postgres;

--
-- Name: payment_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.payment_categories OWNER TO postgres;

--
-- Name: payment_request_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_request_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_request_id uuid NOT NULL,
    step_order integer NOT NULL,
    approver_type character varying(10) NOT NULL,
    approver_user_id uuid,
    approver_role_id uuid,
    decision character varying(10) DEFAULT 'PENDING'::character varying NOT NULL,
    decided_by uuid,
    decided_at timestamp with time zone,
    comments text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_pra_decision CHECK (((decision)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[]))),
    CONSTRAINT chk_pra_target CHECK (((((approver_type)::text = 'USER'::text) AND (approver_user_id IS NOT NULL) AND (approver_role_id IS NULL)) OR (((approver_type)::text = 'ROLE'::text) AND (approver_role_id IS NOT NULL) AND (approver_user_id IS NULL)))),
    CONSTRAINT chk_pra_type CHECK (((approver_type)::text = ANY ((ARRAY['USER'::character varying, 'ROLE'::character varying])::text[])))
);


ALTER TABLE public.payment_request_approvals OWNER TO postgres;

--
-- Name: payment_request_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_request_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_request_id uuid NOT NULL,
    document_code character varying(50) NOT NULL,
    document_label character varying(200),
    file_name character varying(255) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_size_bytes integer,
    mime_type character varying(100),
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_request_documents OWNER TO postgres;

--
-- Name: payment_request_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_request_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_request_seq OWNER TO postgres;

--
-- Name: payment_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_number character varying(30) NOT NULL,
    payment_type_id uuid NOT NULL,
    legal_entity_id uuid NOT NULL,
    counterparty_id uuid,
    employee_id uuid,
    beneficiary_account_id uuid,
    source_account_id uuid,
    currency_id uuid NOT NULL,
    amount numeric(20,4) NOT NULL,
    purpose_description text,
    invoice_number character varying(60),
    due_date date,
    status character varying(40) DEFAULT 'DRAFT'::character varying NOT NULL,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    released_at timestamp with time zone,
    paid_at timestamp with time zone,
    matrix_id uuid,
    matrix_version integer,
    current_step_order integer,
    bank_reference character varying(100),
    value_date date,
    proof_of_payment_url character varying(500),
    sanction_warning boolean DEFAULT false NOT NULL,
    sanction_override_reason text,
    counterparty_snapshot jsonb,
    beneficiary_snapshot jsonb,
    rejection_reason text,
    cancellation_reason text,
    withdrawn_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT chk_pr_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_pr_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PENDING_APPROVAL'::character varying, 'APPROVED'::character varying, 'AWAITING_PAYMENT_CONFIRMATION'::character varying, 'PAID'::character varying, 'REJECTED'::character varying, 'WITHDRAWN'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.payment_requests OWNER TO postgres;

--
-- Name: payment_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(40) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    direction character varying(10) NOT NULL,
    requires_approval_chain boolean DEFAULT true NOT NULL,
    is_batch_based boolean DEFAULT false NOT NULL,
    is_confidential boolean DEFAULT false NOT NULL,
    mobile_initiation_only boolean DEFAULT false NOT NULL,
    allows_cross_currency boolean DEFAULT true NOT NULL,
    document_policy jsonb DEFAULT '[]'::jsonb NOT NULL,
    field_config jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    effective_to date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    payment_category_id uuid,
    maker_role_id uuid,
    checker_role_id uuid,
    maker_user_id uuid,
    checker_user_id uuid,
    CONSTRAINT chk_payment_type_direction CHECK (((direction)::text = ANY ((ARRAY['OUTGOING'::character varying, 'INCOMING'::character varying])::text[])))
);


ALTER TABLE public.payment_types OWNER TO postgres;

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
-- Data for Name: account_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_types (id, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
bd44575d-7c7d-44be-88bb-33a41cd757db	Current	t	2026-05-28 08:57:38.562382+05:30	2026-05-28 08:57:38.562382+05:30	\N	\N	\N
a46ce9b0-80ba-4192-8ac6-c984366dec89	Savings	t	2026-05-28 08:57:38.562382+05:30	2026-05-28 08:57:38.562382+05:30	\N	\N	\N
ac939c85-1298-4c4f-8bb9-2999ccba4a75	Deposit	t	2026-05-28 08:57:38.562382+05:30	2026-05-28 08:57:38.562382+05:30	\N	\N	\N
91caa7d2-54ae-42ac-a3f3-6572555c5461	Collateral	t	2026-05-28 08:57:38.562382+05:30	2026-05-28 08:57:38.562382+05:30	\N	\N	\N
\.


--
-- Data for Name: approval_matrices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval_matrices (id, name, description, payment_type_id, currency_id, version, status, effective_from, effective_to, published_at, published_by, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
be4b1370-dfdf-439a-a1e1-da97c50020aa	Travel Desk - Authority Matrix	Per policy section 5.2	a46fc857-4d48-4187-93b3-1f678d941a70	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
e6b50b6f-d28c-49fb-96ef-7fb2fdc5ce57	Annual Subscription - Authority Matrix	Per policy (Annual subscriptions, Above 50,000 band only - the band with complete information).	307a7908-a86c-4720-ac99-de6e90ccd5e0	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
d7db98e6-2c65-43e7-8f36-dbd379970d62	Salaries - Authority Matrix	Per policy section 5.3	0f92980e-9920-4434-845a-f91c26855679	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
313ade42-6a70-4d41-ab73-e81059c5f95d	Statutory Dues - Authority Matrix	Per policy section 5.3 (VAT, TDS). Approver mapped to generic APPROVER role in lieu of AUDIT_TEAM_HEAD.	5f5fdd4e-5b85-43c9-962f-6009d201e6d5	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
26f7a8ec-f60b-492b-a1ce-bbdc5108448b	Rent & Utilities - Singapore Office	Per policy section 5.3	2c32250f-a745-4afa-b987-8666c48cd0f2	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
f4b6e23c-d330-467d-86c7-00e7bc87ad8d	Rent & Utilities - Dubai Office	Per policy section 5.3	f2fe0d26-2cbf-4c62-b172-94cf107903b6	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
cbc3363e-e792-45fc-ad28-f3cdc4f740c4	Rent & Utilities - Geneva Office	Per policy section 5.3	3912a080-146c-4267-a24a-23c19f56171e	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
3a775959-107d-4e0c-ac4a-ef2f99cf1405	Rent & Utilities - UK Office	Per policy section 5.3	7cdd31fd-5f04-462c-9b15-7275d4262ce0	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
309b4f6f-cf82-4ea4-88df-debc292513f3	Rent & Utilities - US Office	Per policy section 5.3	9359362e-be06-4caf-848a-5736d928ef11	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
9d814c1f-0886-4266-a0e1-934d65c7f19e	Capital Expenditure - Authority Matrix	Per policy section 5.4	36e02e43-c917-47ff-9f26-44ae83dc5c16	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
18abb5b6-f38c-4e97-861c-1bcf9dc84c5f	Exceptional - M&A	Per policy section 5.5	a0e1cbac-e6e1-4b1a-8989-7ba1b077c323	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
9053a1e6-5be1-4224-8098-25c094f299ff	Exceptional - Related Party	Per policy section 5.5	1568c1fb-e227-4938-a049-59b335d4d81a	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
e8d11b94-ebb0-4168-9e3c-87078f3a27ec	Exceptional - Legal Settlement	Per policy section 5.5	e19cb67d-49fd-4fba-ac35-8d9e47b9d40e	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
1679da6a-68f2-4851-9084-5e7e2a240694	Exceptional - Write-off	Per policy section 5.5	dee49814-df91-441e-b802-f52c097287cb	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
afa7659c-f9b0-40c9-9431-cb1a4e91b73c	Exceptional - CSR / Donations	Per policy section 5.5	6be8355a-b862-4dc7-8e80-f5c8b904db9c	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	\N	t	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N
0996f50c-b9bd-4dd3-8ab8-c670a3a4dc5c	Supplier Payment - Authority Matrix	Per policy section 5.1 (Trade Payments). Same 4-band chain across all bands.	ded8c9bc-6836-47d6-b1e6-862b895eb87c	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	\N	t	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N
0d9a36f2-07e5-425c-99b4-49eb4bbdc79d	Advance Payment - Authority Matrix	Per policy section 5.1 (Trade Payments). Same 4-band chain across all bands.	169620b9-530f-4283-9aba-454e64c33db8	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	\N	t	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N
da89561f-d412-41c1-a523-30b312791e78	Import Payment (LC/BG) - Authority Matrix	Per policy section 5.1 (Trade Payments). Same 4-band chain across all bands.	204ce329-aac9-49b7-804b-261c7025f81f	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	\N	t	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N
e1ec25d9-db8a-45ee-bb26-41b7f1bab717	Derivative Margin Payment - Authority Matrix	Per policy section 5.1 (Trade Payments). Same 4-band chain across all bands.	7b10c01c-e6fd-44d0-bc92-68f5f6423173	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	\N	t	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N
38b37586-070c-46f5-8cd9-a8d782e2a989	Trade Finance Bank Payment - Authority Matrix	Per policy section 5.1 (Trade Payments). Same 4-band chain across all bands.	015d9e7e-2a33-4d33-9be0-21d56889e8e3	9cd9c270-6608-4c47-bdde-fab9d950673e	1	PUBLISHED	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	\N	t	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N
\.


--
-- Data for Name: approval_matrix_bands; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval_matrix_bands (id, matrix_id, sort_order, min_amount, max_amount, created_at) FROM stdin;
cd918906-c101-4804-8d50-da2bf11b4ea8	be4b1370-dfdf-439a-a1e1-da97c50020aa	1	0.0000	1000.0000	2026-05-29 16:26:50.567667+05:30
027f55bd-90ae-4bb0-b42c-74eb73215b86	be4b1370-dfdf-439a-a1e1-da97c50020aa	2	1000.0001	10000.0000	2026-05-29 16:26:50.567667+05:30
08a8b842-af9c-4f31-a740-d1422285fef7	be4b1370-dfdf-439a-a1e1-da97c50020aa	3	10000.0001	25000.0000	2026-05-29 16:26:50.567667+05:30
0621df64-6c93-457e-8532-c0148cfd7f10	e6b50b6f-d28c-49fb-96ef-7fb2fdc5ce57	1	50000.0001	\N	2026-05-29 16:26:50.567667+05:30
caaf251e-99fe-499e-beaa-676671c9b1a0	d7db98e6-2c65-43e7-8f36-dbd379970d62	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
00ab6b8a-e42b-460a-aec6-396cef3b2b68	313ade42-6a70-4d41-ab73-e81059c5f95d	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
34920dd5-6b95-4ea4-b699-5a8372fc4393	26f7a8ec-f60b-492b-a1ce-bbdc5108448b	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
b4322415-4ce3-4653-8bae-17d33d03850c	f4b6e23c-d330-467d-86c7-00e7bc87ad8d	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
c53444ce-5ca6-4a81-83bd-7912df8ca676	cbc3363e-e792-45fc-ad28-f3cdc4f740c4	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
e0bd93f0-c658-48cb-8f7b-9ba2f652dc95	3a775959-107d-4e0c-ac4a-ef2f99cf1405	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
35e16a47-0015-4a8d-a195-2e6cf3d881fd	309b4f6f-cf82-4ea4-88df-debc292513f3	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
fbb72a37-23f4-453a-8eb8-bea682ba3108	9d814c1f-0886-4266-a0e1-934d65c7f19e	1	0.0000	50000.0000	2026-05-29 16:26:50.567667+05:30
1957bf51-2e84-4338-b1de-c9d88f7ef82a	9d814c1f-0886-4266-a0e1-934d65c7f19e	2	50000.0001	200000.0000	2026-05-29 16:26:50.567667+05:30
40b10898-6750-48be-82eb-d39aa1ba5063	9d814c1f-0886-4266-a0e1-934d65c7f19e	3	200000.0001	\N	2026-05-29 16:26:50.567667+05:30
6fbfa3d3-17b1-4692-9d38-71693564ffc2	18abb5b6-f38c-4e97-861c-1bcf9dc84c5f	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
9d844747-8e4d-4550-9ed3-adb02a0fca2a	9053a1e6-5be1-4224-8098-25c094f299ff	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
3f1c404f-bf1e-4b70-ac8b-9954f3f154c0	e8d11b94-ebb0-4168-9e3c-87078f3a27ec	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
e79d6561-aed5-4145-aa17-62bc62fc6ff0	1679da6a-68f2-4851-9084-5e7e2a240694	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
3a3de982-3ef3-4ca3-909a-e52c8fc62d07	afa7659c-f9b0-40c9-9431-cb1a4e91b73c	1	0.0000	\N	2026-05-29 16:26:50.567667+05:30
bd3af5ff-67b4-40d2-90df-627f9832b328	0996f50c-b9bd-4dd3-8ab8-c670a3a4dc5c	1	0.0000	100000.0000	2026-05-29 16:33:20.146041+05:30
49254f18-123b-4e9e-a883-26934372f572	0996f50c-b9bd-4dd3-8ab8-c670a3a4dc5c	2	100000.0001	500000.0000	2026-05-29 16:33:20.146041+05:30
757bdb38-9330-40e2-a4d5-18e4d6eb3ac0	0996f50c-b9bd-4dd3-8ab8-c670a3a4dc5c	3	500000.0001	1000000.0000	2026-05-29 16:33:20.146041+05:30
a7a78cd1-cb3e-4d8d-ad88-a118eedb7909	0996f50c-b9bd-4dd3-8ab8-c670a3a4dc5c	4	1000000.0001	\N	2026-05-29 16:33:20.146041+05:30
09acb734-68ce-48c5-a437-c59fa01b722e	0d9a36f2-07e5-425c-99b4-49eb4bbdc79d	1	0.0000	100000.0000	2026-05-29 16:33:20.146041+05:30
3a7420a9-de21-4abb-a009-6b7bd7fdadd0	0d9a36f2-07e5-425c-99b4-49eb4bbdc79d	2	100000.0001	500000.0000	2026-05-29 16:33:20.146041+05:30
d13f6c93-2c1f-498c-b60b-e9efca359fde	0d9a36f2-07e5-425c-99b4-49eb4bbdc79d	3	500000.0001	1000000.0000	2026-05-29 16:33:20.146041+05:30
48f2b0de-8d93-4fbc-adcf-fdb703a1fa07	0d9a36f2-07e5-425c-99b4-49eb4bbdc79d	4	1000000.0001	\N	2026-05-29 16:33:20.146041+05:30
4f81ad68-1cfc-4a92-8747-360aec9be02c	da89561f-d412-41c1-a523-30b312791e78	1	0.0000	100000.0000	2026-05-29 16:33:20.146041+05:30
63b129da-5345-4bcd-8edd-ef65ac80a291	da89561f-d412-41c1-a523-30b312791e78	2	100000.0001	500000.0000	2026-05-29 16:33:20.146041+05:30
85d7b3cb-b321-4229-85c5-5b8ccbf8cfa9	da89561f-d412-41c1-a523-30b312791e78	3	500000.0001	1000000.0000	2026-05-29 16:33:20.146041+05:30
5a61878f-7e64-4102-82e8-8493dccf0b13	da89561f-d412-41c1-a523-30b312791e78	4	1000000.0001	\N	2026-05-29 16:33:20.146041+05:30
88023e59-b981-4b97-822e-251dd5361cf4	e1ec25d9-db8a-45ee-bb26-41b7f1bab717	1	0.0000	100000.0000	2026-05-29 16:33:20.146041+05:30
c8e9cccf-59f9-451a-94d1-98abc4912ecc	e1ec25d9-db8a-45ee-bb26-41b7f1bab717	2	100000.0001	500000.0000	2026-05-29 16:33:20.146041+05:30
7b666fec-a7d2-446e-abd5-92f914ad3d4b	e1ec25d9-db8a-45ee-bb26-41b7f1bab717	3	500000.0001	1000000.0000	2026-05-29 16:33:20.146041+05:30
608b566d-6154-416e-898b-1997ce77f555	e1ec25d9-db8a-45ee-bb26-41b7f1bab717	4	1000000.0001	\N	2026-05-29 16:33:20.146041+05:30
b1bc310c-eabf-4487-ac76-88d28948e5eb	38b37586-070c-46f5-8cd9-a8d782e2a989	1	0.0000	100000.0000	2026-05-29 16:33:20.146041+05:30
71dbdfc0-dddf-4f38-af19-da55bfd3b194	38b37586-070c-46f5-8cd9-a8d782e2a989	2	100000.0001	500000.0000	2026-05-29 16:33:20.146041+05:30
15e6b95f-a8f9-4395-9c0f-801a6dbdc51c	38b37586-070c-46f5-8cd9-a8d782e2a989	3	500000.0001	1000000.0000	2026-05-29 16:33:20.146041+05:30
c66c5964-9753-40fa-abda-c06fd5055942	38b37586-070c-46f5-8cd9-a8d782e2a989	4	1000000.0001	\N	2026-05-29 16:33:20.146041+05:30
\.


--
-- Data for Name: approval_matrix_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval_matrix_steps (id, band_id, step_order, approver_type, approver_user_id, approver_role_id, is_optional, created_at) FROM stdin;
8c6176e6-3c12-48c1-ad46-8d16dfe6670f	cd918906-c101-4804-8d50-da2bf11b4ea8	1	USER	d32f0f54-0d3d-4680-b9c7-be9fdd5c54b8	\N	f	2026-05-29 16:26:50.567667+05:30
5a3a06fa-fc78-4e10-a9d4-683df8aa3780	cd918906-c101-4804-8d50-da2bf11b4ea8	2	USER	d7972fda-60df-444a-851b-9e02b4908227	\N	f	2026-05-29 16:26:50.567667+05:30
60e0d2a9-df5a-4002-8fe2-8ac1c2b090db	cd918906-c101-4804-8d50-da2bf11b4ea8	3	USER	d7972fda-60df-444a-851b-9e02b4908227	\N	f	2026-05-29 16:26:50.567667+05:30
e3a50322-55f4-491d-80d0-ad2b87a008be	cd918906-c101-4804-8d50-da2bf11b4ea8	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
c650ac08-2bdf-4641-91bf-6b7db4d811f1	027f55bd-90ae-4bb0-b42c-74eb73215b86	1	USER	d32f0f54-0d3d-4680-b9c7-be9fdd5c54b8	\N	f	2026-05-29 16:26:50.567667+05:30
a2647a8e-8190-4227-8bae-0aaa5381b8b1	027f55bd-90ae-4bb0-b42c-74eb73215b86	2	USER	d7972fda-60df-444a-851b-9e02b4908227	\N	f	2026-05-29 16:26:50.567667+05:30
0547fedb-c5b3-432a-a94d-7222a5f0dce0	027f55bd-90ae-4bb0-b42c-74eb73215b86	3	USER	d7972fda-60df-444a-851b-9e02b4908227	\N	f	2026-05-29 16:26:50.567667+05:30
dddb705c-7664-44c7-b24b-c3b21c73f542	027f55bd-90ae-4bb0-b42c-74eb73215b86	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
b33a94c9-21e4-4a34-b15e-84923d621030	08a8b842-af9c-4f31-a740-d1422285fef7	1	USER	d32f0f54-0d3d-4680-b9c7-be9fdd5c54b8	\N	f	2026-05-29 16:26:50.567667+05:30
ee39c6f0-6019-440b-997f-de185c148e15	08a8b842-af9c-4f31-a740-d1422285fef7	2	USER	d7972fda-60df-444a-851b-9e02b4908227	\N	f	2026-05-29 16:26:50.567667+05:30
be9906a6-e61b-400b-97ae-bfdfa679c4db	08a8b842-af9c-4f31-a740-d1422285fef7	3	USER	d7972fda-60df-444a-851b-9e02b4908227	\N	f	2026-05-29 16:26:50.567667+05:30
cef3e7e7-c844-4a5d-9fa4-90715433cfa6	08a8b842-af9c-4f31-a740-d1422285fef7	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
8ebc3f72-5bd3-48bd-807e-15a6b667d03d	0621df64-6c93-457e-8532-c0148cfd7f10	1	ROLE	\N	e4e63895-212d-42b5-83cf-63ff4cba01c3	f	2026-05-29 16:26:50.567667+05:30
a357a78b-2f64-46ba-89f8-614c5dce9297	0621df64-6c93-457e-8532-c0148cfd7f10	2	ROLE	\N	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	f	2026-05-29 16:26:50.567667+05:30
0b690bac-843c-4975-9d8b-bf9a8af462d1	0621df64-6c93-457e-8532-c0148cfd7f10	3	USER	a797d32b-14d8-4c79-8688-69f9d8fa4ded	\N	f	2026-05-29 16:26:50.567667+05:30
318ee0c1-38d4-48f1-b337-d6a847baaa5d	0621df64-6c93-457e-8532-c0148cfd7f10	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
f22bea66-1a76-4a9a-a680-ddceb1c5cc8a	caaf251e-99fe-499e-beaa-676671c9b1a0	1	ROLE	\N	e030ea14-296f-498c-908d-57e8c3c7c70f	f	2026-05-29 16:26:50.567667+05:30
6b5ca302-cb67-40d6-8de4-a84882d624a8	caaf251e-99fe-499e-beaa-676671c9b1a0	2	ROLE	\N	90018431-44d8-496e-9835-37b870827310	f	2026-05-29 16:26:50.567667+05:30
eb2af68e-3d5c-4c86-81dd-d1a54070ea5b	caaf251e-99fe-499e-beaa-676671c9b1a0	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:26:50.567667+05:30
a23d953a-d83e-42c6-9591-adf0beb8d578	00ab6b8a-e42b-460a-aec6-396cef3b2b68	1	ROLE	\N	be6aac17-a869-46f5-a3c8-ebc8b5dd5d29	f	2026-05-29 16:26:50.567667+05:30
addceaaa-6f3b-43de-986a-657cc9b968fa	00ab6b8a-e42b-460a-aec6-396cef3b2b68	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:26:50.567667+05:30
35ffa9ba-5ef5-4bdd-b24d-2c46a08af9ad	00ab6b8a-e42b-460a-aec6-396cef3b2b68	3	ROLE	\N	d2699641-dbf4-4cc8-b4f8-854bed20611f	f	2026-05-29 16:26:50.567667+05:30
caf56e91-cc44-4ed4-a880-e890d481cd61	34920dd5-6b95-4ea4-b699-5a8372fc4393	1	USER	0eecb572-4a4a-4178-9473-eace89db65b6	\N	f	2026-05-29 16:26:50.567667+05:30
6d385a15-42da-4468-bc61-fc12df992183	34920dd5-6b95-4ea4-b699-5a8372fc4393	2	USER	0eecb572-4a4a-4178-9473-eace89db65b6	\N	f	2026-05-29 16:26:50.567667+05:30
1f1f4384-106d-40ed-b90f-3406567478e2	34920dd5-6b95-4ea4-b699-5a8372fc4393	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:26:50.567667+05:30
bca100fd-ac6d-4455-b334-d31b66248b9c	b4322415-4ce3-4653-8bae-17d33d03850c	1	USER	0fd728c4-8012-4beb-a3fb-445d1bcd58dd	\N	f	2026-05-29 16:26:50.567667+05:30
5e925e54-5ceb-434e-9760-40834ffc575a	b4322415-4ce3-4653-8bae-17d33d03850c	2	USER	0fd728c4-8012-4beb-a3fb-445d1bcd58dd	\N	f	2026-05-29 16:26:50.567667+05:30
c940fc96-e186-4d34-8eb8-b0e69bd75ac8	b4322415-4ce3-4653-8bae-17d33d03850c	3	USER	198b8e75-e3ac-4223-8b2a-2cc3c0d5ef15	\N	f	2026-05-29 16:26:50.567667+05:30
9ec52d59-69d4-46ef-bc64-2bbca5f15d7e	c53444ce-5ca6-4a81-83bd-7912df8ca676	1	USER	36029f86-1a12-47bc-9450-676f2d469a21	\N	f	2026-05-29 16:26:50.567667+05:30
17d2baab-ee73-45ec-b978-5c23dcc028d7	c53444ce-5ca6-4a81-83bd-7912df8ca676	2	ROLE	\N	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	f	2026-05-29 16:26:50.567667+05:30
3d652d09-ec62-4ee5-bafd-a059b90b7fc0	c53444ce-5ca6-4a81-83bd-7912df8ca676	3	USER	a797d32b-14d8-4c79-8688-69f9d8fa4ded	\N	f	2026-05-29 16:26:50.567667+05:30
b95a0618-1278-4d90-9f89-e06063fd0464	e0bd93f0-c658-48cb-8f7b-9ba2f652dc95	1	USER	56c4ac8e-8854-490c-b9a5-32c1e76d38da	\N	f	2026-05-29 16:26:50.567667+05:30
9d3f837d-8b64-46d0-9caf-5805147e6584	e0bd93f0-c658-48cb-8f7b-9ba2f652dc95	2	ROLE	\N	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	f	2026-05-29 16:26:50.567667+05:30
85de2653-761e-4988-95a1-e6a925eb0c36	e0bd93f0-c658-48cb-8f7b-9ba2f652dc95	3	USER	a797d32b-14d8-4c79-8688-69f9d8fa4ded	\N	f	2026-05-29 16:26:50.567667+05:30
0af7939d-f557-4b52-912c-bf6a6d4f913e	35e16a47-0015-4a8d-a195-2e6cf3d881fd	1	USER	56c4ac8e-8854-490c-b9a5-32c1e76d38da	\N	f	2026-05-29 16:26:50.567667+05:30
c9e33de0-fea2-42fa-8d21-263b448f9d37	35e16a47-0015-4a8d-a195-2e6cf3d881fd	2	ROLE	\N	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	f	2026-05-29 16:26:50.567667+05:30
5e34114b-5588-40e2-915a-33021d2eab70	35e16a47-0015-4a8d-a195-2e6cf3d881fd	3	USER	a797d32b-14d8-4c79-8688-69f9d8fa4ded	\N	f	2026-05-29 16:26:50.567667+05:30
b80887e2-a90b-4eb2-8f3a-6773f416f43a	fbb72a37-23f4-453a-8eb8-bea682ba3108	1	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
58f22d94-b62a-4248-bed4-1dd4db52a856	1957bf51-2e84-4338-b1de-c9d88f7ef82a	1	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
00bbb1bf-2706-4666-bc6d-a0992a7456fb	40b10898-6750-48be-82eb-d39aa1ba5063	1	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
ca84fa32-b35f-43bb-9b1e-5cf7ee31d5a4	6fbfa3d3-17b1-4692-9d38-71693564ffc2	1	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
62ea3c0e-b085-4428-b993-ee405fcd5e98	9d844747-8e4d-4550-9ed3-adb02a0fca2a	1	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
75a61ecf-53ef-4c00-9ea3-a53dfde71bf3	3f1c404f-bf1e-4b70-ac8b-9954f3f154c0	1	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
d58dffbf-936d-4261-a7d1-d283ccc81edb	e79d6561-aed5-4145-aa17-62bc62fc6ff0	1	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
674d12b7-fccf-4517-aa01-e977a48045b3	3a3de982-3ef3-4ca3-909a-e52c8fc62d07	1	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:26:50.567667+05:30
944a490f-646b-4151-8e78-570ca9a3224c	bd3af5ff-67b4-40d2-90df-627f9832b328	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
c2374fa6-a7c6-49f6-83b3-e712416b8b34	bd3af5ff-67b4-40d2-90df-627f9832b328	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
fdf879de-cc28-4f6e-974d-c07f1537fe39	bd3af5ff-67b4-40d2-90df-627f9832b328	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
4467d9d3-e4cb-4a43-8894-b84dc4409c0a	bd3af5ff-67b4-40d2-90df-627f9832b328	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
131b67be-99c4-4bf6-9734-402d8449b7ad	49254f18-123b-4e9e-a883-26934372f572	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
0c17efea-f417-40b0-a9da-277b5181172f	49254f18-123b-4e9e-a883-26934372f572	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
cb6e16c0-10d1-4193-8833-a4f088cda9e3	49254f18-123b-4e9e-a883-26934372f572	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
667df3ee-8e67-411c-83ea-13a0697f36bb	49254f18-123b-4e9e-a883-26934372f572	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
318ad690-f78b-459a-9dde-f10a5a1a3e34	757bdb38-9330-40e2-a4d5-18e4d6eb3ac0	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
66cd7331-92e9-4d6b-b03b-7726d9007e8d	757bdb38-9330-40e2-a4d5-18e4d6eb3ac0	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
34fea231-e24e-4b54-984f-c323c47daaaf	757bdb38-9330-40e2-a4d5-18e4d6eb3ac0	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
c704a47c-83e4-49c1-8a2a-e2a471770111	757bdb38-9330-40e2-a4d5-18e4d6eb3ac0	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
0518f3cf-dfa7-459b-961a-de827b2cb1cf	a7a78cd1-cb3e-4d8d-ad88-a118eedb7909	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
4e2baace-3eb1-4bfb-8288-43dcc483ceda	a7a78cd1-cb3e-4d8d-ad88-a118eedb7909	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
fa231d58-a91c-4967-92b9-a0af8ddf8012	a7a78cd1-cb3e-4d8d-ad88-a118eedb7909	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
f0eab6c9-32ec-4dd1-9899-31f4607133c3	a7a78cd1-cb3e-4d8d-ad88-a118eedb7909	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
65b47e20-6b70-4a11-8c23-ad1ad1b6ce11	09acb734-68ce-48c5-a437-c59fa01b722e	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
59d71d72-cd81-413e-a599-7e1a0373e6d1	09acb734-68ce-48c5-a437-c59fa01b722e	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
07060df9-a453-43bf-a0d0-21ebf3a5e342	09acb734-68ce-48c5-a437-c59fa01b722e	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
9db973ba-2420-4ed1-bb98-7c71508a5b7b	09acb734-68ce-48c5-a437-c59fa01b722e	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
2dc805cd-9865-4339-bfd3-066aad7acb90	3a7420a9-de21-4abb-a009-6b7bd7fdadd0	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
daab8a92-c2ea-4ab1-8140-5493ff481c69	3a7420a9-de21-4abb-a009-6b7bd7fdadd0	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
622d84aa-2cdb-47e4-bc29-a12690c1bfa7	3a7420a9-de21-4abb-a009-6b7bd7fdadd0	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
c6890a22-6b84-4d50-822b-b1be166c3caf	3a7420a9-de21-4abb-a009-6b7bd7fdadd0	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
dbb4ec6a-ae7c-4960-939a-38f2540a2f31	d13f6c93-2c1f-498c-b60b-e9efca359fde	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
b8caca88-2147-49a2-947c-ad6f29b8f463	d13f6c93-2c1f-498c-b60b-e9efca359fde	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
33e8c2a2-69ba-4876-905b-f9b266f5b08e	d13f6c93-2c1f-498c-b60b-e9efca359fde	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
15717f00-8e34-4d73-b8dc-da0745446f60	d13f6c93-2c1f-498c-b60b-e9efca359fde	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
99ed7abc-63b0-4d82-95fc-5733a3bedd40	48f2b0de-8d93-4fbc-adcf-fdb703a1fa07	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
8f097a1a-6a8b-44b3-9a04-1f77df1aeff4	48f2b0de-8d93-4fbc-adcf-fdb703a1fa07	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
48d8c23a-e1ec-4e23-8e19-104dd1cfdec4	48f2b0de-8d93-4fbc-adcf-fdb703a1fa07	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
76d15dbb-5e34-4421-a4b2-8e852185e874	48f2b0de-8d93-4fbc-adcf-fdb703a1fa07	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
5435370d-dacd-4482-b28b-7c2f62d117d7	4f81ad68-1cfc-4a92-8747-360aec9be02c	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
6df9a23f-4226-480a-9c61-f10c77b12b1a	4f81ad68-1cfc-4a92-8747-360aec9be02c	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
15a47c31-2714-43f1-a7d1-37ef7938693e	4f81ad68-1cfc-4a92-8747-360aec9be02c	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
e20a9d8a-446a-47a6-886b-d90f9a373cdd	4f81ad68-1cfc-4a92-8747-360aec9be02c	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
58be6ed7-2781-46ba-9b95-cf4b84bfafe0	63b129da-5345-4bcd-8edd-ef65ac80a291	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
7a7e99db-c350-423f-8510-2ededcf85249	63b129da-5345-4bcd-8edd-ef65ac80a291	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
6ad4c750-151f-4e6b-a501-20bfa48538fd	63b129da-5345-4bcd-8edd-ef65ac80a291	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
10171273-1d53-461b-ad16-279add9d2b54	63b129da-5345-4bcd-8edd-ef65ac80a291	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
c909cba3-e047-47d9-b966-ddf2b93cfe1c	85d7b3cb-b321-4229-85c5-5b8ccbf8cfa9	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
05c49d18-2a5c-4d85-9098-7acf70fa7c89	85d7b3cb-b321-4229-85c5-5b8ccbf8cfa9	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
3f8de745-e79a-431c-825b-ea5640682dbc	85d7b3cb-b321-4229-85c5-5b8ccbf8cfa9	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
c62ec7ab-f06c-42ba-99be-930facb73e37	85d7b3cb-b321-4229-85c5-5b8ccbf8cfa9	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
35982651-e377-45ed-945b-f2aa059af5c9	5a61878f-7e64-4102-82e8-8493dccf0b13	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
017a91bd-d414-44be-b0bd-289980f01635	5a61878f-7e64-4102-82e8-8493dccf0b13	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
46dac6bf-6068-467d-aa9e-a94dba67c10a	5a61878f-7e64-4102-82e8-8493dccf0b13	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
f6d3d994-7ded-45fa-b294-6876d2be1c4b	5a61878f-7e64-4102-82e8-8493dccf0b13	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
f91e2fcf-1aa2-4745-855c-8c97d3ab8a61	88023e59-b981-4b97-822e-251dd5361cf4	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
a11a18be-0986-4a1e-9728-56852032342a	88023e59-b981-4b97-822e-251dd5361cf4	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
ad2dd577-71d9-4d9c-b8b9-9eeaf55d4c02	88023e59-b981-4b97-822e-251dd5361cf4	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
0b0bc5f0-c101-4402-b2e3-beb7b63b9116	88023e59-b981-4b97-822e-251dd5361cf4	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
bcfa6ca7-18d7-4f9c-b843-e7bac83507e1	c8e9cccf-59f9-451a-94d1-98abc4912ecc	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
20bf7eca-1015-4e8d-99a0-ff6e8a7f262c	c8e9cccf-59f9-451a-94d1-98abc4912ecc	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
5ca3566f-5d46-4c46-8e0e-04833f3b9a75	c8e9cccf-59f9-451a-94d1-98abc4912ecc	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
46c6c4b4-362d-47a1-a141-cc50b83b411e	c8e9cccf-59f9-451a-94d1-98abc4912ecc	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
61124747-ca25-4d31-848e-4cec09a95145	7b666fec-a7d2-446e-abd5-92f914ad3d4b	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
bba734d2-a5c5-4c05-9e5a-c25e842c4e63	7b666fec-a7d2-446e-abd5-92f914ad3d4b	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
eadf4d36-83d3-4ed3-9e26-9ae67da3431c	7b666fec-a7d2-446e-abd5-92f914ad3d4b	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
10e1a61c-1828-4844-ae03-4b6e0e3bd973	7b666fec-a7d2-446e-abd5-92f914ad3d4b	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
d3e49e39-4dd9-48a8-9759-faf839780514	608b566d-6154-416e-898b-1997ce77f555	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
0e756638-0b9c-4bcb-a381-a3b6c8cf2726	608b566d-6154-416e-898b-1997ce77f555	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
eda4b39b-d5d7-4c66-bbee-40b2d46667dc	608b566d-6154-416e-898b-1997ce77f555	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
a9dae018-1bc2-4c68-ab80-af2995ebe136	608b566d-6154-416e-898b-1997ce77f555	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
714ca052-6c73-42b3-9f10-6a8e1824fbbd	b1bc310c-eabf-4487-ac76-88d28948e5eb	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
eb6f0393-157c-4922-82da-448315043374	b1bc310c-eabf-4487-ac76-88d28948e5eb	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
b61f6ac1-9ff8-47c6-9d48-cba4c2264f8d	b1bc310c-eabf-4487-ac76-88d28948e5eb	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
396bc876-8e9d-4f64-8dc0-359b5b3f1086	b1bc310c-eabf-4487-ac76-88d28948e5eb	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
0e00962f-da3b-4fea-b85e-8571b1a1f2b9	71dbdfc0-dddf-4f38-af19-da55bfd3b194	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
de07ecf3-901f-4408-b362-741bc06edb61	71dbdfc0-dddf-4f38-af19-da55bfd3b194	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
5f16fc50-f245-4daa-b6c4-f5be27bae931	71dbdfc0-dddf-4f38-af19-da55bfd3b194	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
359e1946-e4a2-4ec7-a91d-49b9124ffc05	71dbdfc0-dddf-4f38-af19-da55bfd3b194	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
39eb2874-7edd-40ae-b7c6-c27e0309dedd	15e6b95f-a8f9-4395-9c0f-801a6dbdc51c	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
2ef29a87-e6c3-4e80-a415-53132d1ba5fc	15e6b95f-a8f9-4395-9c0f-801a6dbdc51c	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
5f902dd8-0413-48c7-bb5b-0494256ecfb9	15e6b95f-a8f9-4395-9c0f-801a6dbdc51c	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
d9389540-0c86-4d6e-ac69-381ee71f8eff	15e6b95f-a8f9-4395-9c0f-801a6dbdc51c	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
353fa0e4-5536-44a3-95b7-2bcb7bc805c8	c66c5964-9753-40fa-abda-c06fd5055942	1	ROLE	\N	0de259c9-b75a-4e2b-95f1-901d495f01d7	f	2026-05-29 16:33:20.146041+05:30
bcd317c2-e502-4a48-a2bf-30ddc833d08f	c66c5964-9753-40fa-abda-c06fd5055942	2	ROLE	\N	94b97c12-f17d-41a9-a2e2-8040a29192ea	f	2026-05-29 16:33:20.146041+05:30
bf8d46a8-e847-4d98-ba68-1807d4452018	c66c5964-9753-40fa-abda-c06fd5055942	3	USER	98fdb496-53fe-474c-8829-25e94569ab82	\N	f	2026-05-29 16:33:20.146041+05:30
3fc22687-c161-4393-b2af-5612f5136186	c66c5964-9753-40fa-abda-c06fd5055942	4	USER	23fa6946-2ede-4a14-b8d2-2473b9150df0	\N	f	2026-05-29 16:33:20.146041+05:30
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_accounts (id, bank_id, bank_nickname, currency_id, account_type_id, account_number, branch_name, branch_code, opening_balance, minimum_balance, is_chairman_designated, is_active, created_at, updated_at, deleted_at, created_by, updated_by, bank_name, is_counterparty, remaining_balance, counterparty_id) FROM stdin;
d0b8c38c-5d01-412c-af86-a919d36b6b90	e1c9cb02-fbc7-46df-828e-27bb293b7d45	HDFC - Main Operating	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	bd44575d-7c7d-44be-88bb-33a41cd757db	50100123456789	Vidyavihar	HDFC0007811	1000000.0000	50000.0000	f	t	2026-05-28 12:20:36.743976+05:30	2026-05-29 14:18:13.028231+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	\N	f	75000.0000	\N
02f068cd-f0a5-4fe9-a027-051e14929346	84a3c9fb-d098-4b4c-be70-ed354e034208	HDFC - Main Operating	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	bd44575d-7c7d-44be-88bb-33a41cd757db	500003424242332434	Vidyavihar	HDFC0007811	10000000000.0000	50000.0000	f	t	2026-05-28 14:41:15.740312+05:30	2026-05-30 07:02:52.41568+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	45a844e3-fd35-40d9-8633-4d15abf5ed9f	\N	t	0.0000	a0386cbb-1da6-4021-a6be-16b2746c1d9a
\.


--
-- Data for Name: banks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banks (id, name, short_name, country_id, swift_bic, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_counterparty) FROM stdin;
84a3c9fb-d098-4b4c-be70-ed354e034208	HDFC Bank	HDFC- CP sales	2d4054ef-f857-4191-92ec-e316b8630a65	HDFCIN11122	t	2026-05-28 14:39:12.619745+05:30	2026-05-28 14:39:12.619745+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	t
e1c9cb02-fbc7-46df-828e-27bb293b7d45	HDFC Bank	HDFC	2d4054ef-f857-4191-92ec-e316b8630a65	HDFC0002805	t	2026-05-28 12:17:59.227756+05:30	2026-05-28 15:04:49.045828+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	f
\.


--
-- Data for Name: beneficiary_account_change_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.beneficiary_account_change_requests (id, beneficiary_account_id, change_type, proposed_data, documents, status, requested_by, requested_at, verified_by, verified_at, verification_notes, callback_evidence, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, cooling_off_override, cooling_off_override_reason, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: beneficiary_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.beneficiary_accounts (id, counterparty_id, employee_id, account_holder_name, account_number, bank_id, branch_name, swift_bic, iban, currency_id, country_id, account_direction, status, cooling_off_until, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: counterparties; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.counterparties (id, code, name, legal_name, role, country_id, country_code, tax_identifiers, addresses, primary_contact_name, primary_contact_email, primary_contact_phone, notes, is_active, created_at, updated_at, deleted_at, created_by, updated_by, kyc_done) FROM stdin;
a0386cbb-1da6-4021-a6be-16b2746c1d9a	KOSMOS	Kosmos Resources	Kosmos 	VENDOR	2d4054ef-f857-4191-92ec-e316b8630a65	\N	[]	[]	Sonal Tamboli	sonal@firsteconomy.com	9876543210	\N	t	2026-05-28 17:10:26.606448+05:30	2026-05-28 17:10:26.606448+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	f
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.countries (id, country_name, country_short_name, code, currency_id, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_sanctioned) FROM stdin;
2d4054ef-f857-4191-92ec-e316b8630a65	INDIA	IND	IN	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	t	2026-05-28 12:06:08.098397+05:30	2026-05-28 12:06:08.098397+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	f
177f2b9e-8e65-4be5-afce-5474e63e17af	Iran	IR	IRN	9cd9c270-6608-4c47-bdde-fab9d950673e	t	2026-05-28 17:19:37.36539+05:30	2026-05-28 17:19:37.36539+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	t
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.currencies (id, code, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
9cd9c270-6608-4c47-bdde-fab9d950673e	USD	US Dollar	t	2026-05-28 08:57:38.554231+05:30	2026-05-28 08:57:38.554231+05:30	\N	\N	\N
255fcd2e-8660-43b2-872f-00ea3aa81a39	EUR	Euro	t	2026-05-28 08:57:38.554231+05:30	2026-05-28 08:57:38.554231+05:30	\N	\N	\N
676fab16-9a3d-4d6c-947a-fcab58d7a2be	GBP	Pound Sterling	t	2026-05-28 08:57:38.554231+05:30	2026-05-28 08:57:38.554231+05:30	\N	\N	\N
60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	INR	Indian Rupee	t	2026-05-28 08:57:38.554231+05:30	2026-05-28 08:57:38.554231+05:30	\N	\N	\N
7e1cf5ef-0fdc-437f-803e-065df5986651	AED	UAE Dirham	t	2026-05-28 08:57:38.554231+05:30	2026-05-28 08:57:38.554231+05:30	\N	\N	\N
4db64561-5488-4f97-8bad-3ae04584e4c4	SGD	Singapore Dollar	t	2026-05-28 08:57:38.554231+05:30	2026-05-28 08:57:38.554231+05:30	\N	\N	\N
2beb3092-ecb0-42d2-b9dc-c5438343d719	JPY	Japanese Yen	t	2026-05-28 08:57:38.554231+05:30	2026-05-28 08:57:38.554231+05:30	\N	\N	\N
a1acb86d-8056-4e80-b7f3-6d7a41146eac	\N	Tehran	t	2026-05-28 17:41:34.654511+05:30	2026-05-28 17:41:34.654511+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, employee_code, full_name, work_email, country_of_employment_id, start_date, end_date, national_id, tax_identifier, date_of_birth, mobile_number, address, compensation_band, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
f147d3c7-61fa-4c8e-af4a-8d487551c3e3	EMP-oo1	Jane Doe	jane.doe@radient.com	2d4054ef-f857-4191-92ec-e316b8630a65	2026-05-25	2026-05-27	12343r4	test	2026-05-28	9119505008	testing	B1	t	2026-05-28 12:23:06.474581+05:30	2026-05-28 16:24:59.742965+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66
\.


--
-- Data for Name: legal_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.legal_entities (id, name, code, is_active, created_at, updated_at, deleted_at, created_by, updated_by, country_id) FROM stdin;
01cc5c15-f41b-4b6b-a0ad-55f6fbdde3bd	Radient	RADIENT-IN	t	2026-05-28 12:05:27.430623+05:30	2026-05-28 12:05:27.430623+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	\N
\.


--
-- Data for Name: payment_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_categories (id, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
20065c43-91e7-4821-b39f-9b2b68bb9a24	Trade Payments	t	2026-05-29 12:43:30.699103+05:30	2026-05-29 12:43:30.699103+05:30	\N	\N	\N
a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	Non-Trade Payments	t	2026-05-29 12:43:30.699103+05:30	2026-05-29 12:43:30.699103+05:30	\N	\N	\N
c43ef77c-4cd3-4e5b-bd8e-7c7e7ad2d50e	Capital Expenditure	t	2026-05-29 12:43:30.699103+05:30	2026-05-29 12:43:30.699103+05:30	\N	\N	\N
a2ae196d-7beb-42d6-8c1d-6574078fff5a	Exceptional Payments	t	2026-05-29 12:43:30.699103+05:30	2026-05-29 12:43:30.699103+05:30	\N	\N	\N
\.


--
-- Data for Name: payment_request_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_request_approvals (id, payment_request_id, step_order, approver_type, approver_user_id, approver_role_id, decision, decided_by, decided_at, comments, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_request_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_request_documents (id, payment_request_id, document_code, document_label, file_name, file_url, file_size_bytes, mime_type, uploaded_by, uploaded_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_requests (id, request_number, payment_type_id, legal_entity_id, counterparty_id, employee_id, beneficiary_account_id, source_account_id, currency_id, amount, purpose_description, invoice_number, due_date, status, submitted_at, approved_at, released_at, paid_at, matrix_id, matrix_version, current_step_order, bank_reference, value_date, proof_of_payment_url, sanction_warning, sanction_override_reason, counterparty_snapshot, beneficiary_snapshot, rejection_reason, cancellation_reason, withdrawn_reason, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: payment_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_types (id, code, name, description, direction, requires_approval_chain, is_batch_based, is_confidential, mobile_initiation_only, allows_cross_currency, document_policy, field_config, is_system, is_active, version, effective_from, effective_to, created_at, updated_at, deleted_at, created_by, updated_by, payment_category_id, maker_role_id, checker_role_id, maker_user_id, checker_user_id) FROM stdin;
307a7908-a86c-4720-ac99-de6e90ccd5e0	ANNUAL_SUBSCRIPTION	Annual Subscription	Trading platform subscriptions. Only "Above 50,000" band has complete info.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	e4e63895-212d-42b5-83cf-63ff4cba01c3	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	\N	\N
0f92980e-9920-4434-845a-f91c26855679	SALARIES	Salaries	Monthly salary payments (section 5.3).	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	e030ea14-296f-498c-908d-57e8c3c7c70f	90018431-44d8-496e-9835-37b870827310	\N	\N
5f5fdd4e-5b85-43c9-962f-6009d201e6d5	STATUTORY_DUES	Statutory Dues	Statutory dues VAT/TDS (section 5.3).	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	be6aac17-a869-46f5-a3c8-ebc8b5dd5d29	94b97c12-f17d-41a9-a2e2-8040a29192ea	\N	\N
36e02e43-c917-47ff-9f26-44ae83dc5c16	CAPEX	Capital Expenditure	Capex - single approver per band (section 5.4).	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	c43ef77c-4cd3-4e5b-bd8e-7c7e7ad2d50e	\N	\N	\N	\N
a0e1cbac-e6e1-4b1a-8989-7ba1b077c323	EXCEPTIONAL_MA	Exceptional - M&A	M&A transactions (section 5.5).	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a2ae196d-7beb-42d6-8c1d-6574078fff5a	\N	\N	\N	\N
1568c1fb-e227-4938-a049-59b335d4d81a	EXCEPTIONAL_RPT	Exceptional - Related Party	Related party transactions (section 5.5).	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a2ae196d-7beb-42d6-8c1d-6574078fff5a	\N	\N	\N	\N
e19cb67d-49fd-4fba-ac35-8d9e47b9d40e	EXCEPTIONAL_LEGAL	Exceptional - Legal Settlement	Legal settlements (section 5.5).	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a2ae196d-7beb-42d6-8c1d-6574078fff5a	\N	\N	\N	\N
dee49814-df91-441e-b802-f52c097287cb	EXCEPTIONAL_WRITEOFF	Exceptional - Write-off	Write-offs (section 5.5).	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a2ae196d-7beb-42d6-8c1d-6574078fff5a	\N	\N	\N	\N
6be8355a-b862-4dc7-8e80-f5c8b904db9c	EXCEPTIONAL_CSR	Exceptional - CSR / Donations	CSR and donations (section 5.5).	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a2ae196d-7beb-42d6-8c1d-6574078fff5a	\N	\N	\N	\N
ded8c9bc-6836-47d6-b1e6-862b895eb87c	SUPPLIER_PAYMENT	Supplier Payment	Trade supplier payment per policy section 4 + 5.1.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N	20065c43-91e7-4821-b39f-9b2b68bb9a24	0de259c9-b75a-4e2b-95f1-901d495f01d7	94b97c12-f17d-41a9-a2e2-8040a29192ea	\N	\N
169620b9-530f-4283-9aba-454e64c33db8	ADVANCE_PAYMENT	Advance Payment	Advance payment to a trade counterparty per section 4 + 5.1.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N	20065c43-91e7-4821-b39f-9b2b68bb9a24	0de259c9-b75a-4e2b-95f1-901d495f01d7	94b97c12-f17d-41a9-a2e2-8040a29192ea	\N	\N
204ce329-aac9-49b7-804b-261c7025f81f	IMPORT_PAYMENT_LC_BG	Import Payment (LC/BG)	Import payment under Letter of Credit or Bank Guarantee per section 4 + 5.1.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N	20065c43-91e7-4821-b39f-9b2b68bb9a24	0de259c9-b75a-4e2b-95f1-901d495f01d7	94b97c12-f17d-41a9-a2e2-8040a29192ea	\N	\N
7b10c01c-e6fd-44d0-bc92-68f5f6423173	DERIVATIVE_MARGIN_PAYMENT	Derivative Margin Payment	Margin payment for derivatives (exchange / broker margin calls) per section 4 + 5.1.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N	20065c43-91e7-4821-b39f-9b2b68bb9a24	0de259c9-b75a-4e2b-95f1-901d495f01d7	94b97c12-f17d-41a9-a2e2-8040a29192ea	\N	\N
015d9e7e-2a33-4d33-9be0-21d56889e8e3	TRADE_FINANCE_PAYMENT	Trade Finance Bank Payment	Payment to trade finance bank (margin top-ups, collateral funding, LC margining) per section 4 + 5.1.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:33:20.146041+05:30	2026-05-29 16:33:20.146041+05:30	\N	\N	\N	20065c43-91e7-4821-b39f-9b2b68bb9a24	0de259c9-b75a-4e2b-95f1-901d495f01d7	94b97c12-f17d-41a9-a2e2-8040a29192ea	\N	\N
a46fc857-4d48-4187-93b3-1f678d941a70	TRAVEL_DESK	Travel Desk Payment	Non-trade travel desk payments (section 5.2). Maker/Checker are specific users.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	\N	\N	d32f0f54-0d3d-4680-b9c7-be9fdd5c54b8	d7972fda-60df-444a-851b-9e02b4908227
2c32250f-a745-4afa-b987-8666c48cd0f2	RENT_UTIL_SG	Rent & Utilities - Singapore	Singapore office rent & utilities. Maker/Checker are specific users.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	\N	\N	0eecb572-4a4a-4178-9473-eace89db65b6	0eecb572-4a4a-4178-9473-eace89db65b6
f2fe0d26-2cbf-4c62-b172-94cf107903b6	RENT_UTIL_DXB	Rent & Utilities - Dubai	Dubai office rent & utilities. Maker/Checker are specific users.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	\N	\N	0fd728c4-8012-4beb-a3fb-445d1bcd58dd	0fd728c4-8012-4beb-a3fb-445d1bcd58dd
3912a080-146c-4267-a24a-23c19f56171e	RENT_UTIL_GENEVA	Rent & Utilities - Geneva	Geneva office rent & utilities. Maker is a specific user.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	\N	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	36029f86-1a12-47bc-9450-676f2d469a21	\N
7cdd31fd-5f04-462c-9b15-7275d4262ce0	RENT_UTIL_UK	Rent & Utilities - UK	UK office rent & utilities. Maker is a specific user.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	\N	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	56c4ac8e-8854-490c-b9a5-32c1e76d38da	\N
9359362e-be06-4caf-848a-5736d928ef11	RENT_UTIL_US	Rent & Utilities - US	US office rent & utilities. Maker is a specific user.	OUTGOING	t	f	f	f	t	[]	[]	t	t	1	2026-05-29	\N	2026-05-29 16:26:50.567667+05:30	2026-05-29 16:26:50.567667+05:30	\N	\N	\N	a0ba4fc4-9b35-4648-a95b-6ba05e48dd7a	\N	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	56c4ac8e-8854-490c-b9a5-32c1e76d38da	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, code, name, description, is_system, created_at, updated_at, deleted_at) FROM stdin;
0de259c9-b75a-4e2b-95f1-901d495f01d7	OPS_TEAM	Ops Team	Maker — Trade Payments (5.1)	f	2026-05-29 16:11:21.165534+05:30	2026-05-29 16:11:21.165534+05:30	\N
e4e63895-212d-42b5-83cf-63ff4cba01c3	TRADING_TEAM	Trading Team	Maker — Annual Subscription trading platforms	f	2026-05-29 16:11:21.165534+05:30	2026-05-29 16:11:21.165534+05:30	\N
e030ea14-296f-498c-908d-57e8c3c7c70f	HR	HR	Maker — Salaries (5.3)	f	2026-05-29 16:11:21.165534+05:30	2026-05-29 16:11:21.165534+05:30	\N
be6aac17-a869-46f5-a3c8-ebc8b5dd5d29	ROHIT_TEAM	Rohit Team	Maker — Statutory dues (5.3)	f	2026-05-29 16:11:21.165534+05:30	2026-05-29 16:11:21.165534+05:30	\N
94b97c12-f17d-41a9-a2e2-8040a29192ea	ACCOUNTS_TEAM	Accounts Team	Checker — Trade payments, Statutory dues	f	2026-05-29 16:11:21.165534+05:30	2026-05-29 16:11:21.165534+05:30	\N
90018431-44d8-496e-9835-37b870827310	TREASURY_TEAM	Treasury Team	Checker — Salaries (5.3)	f	2026-05-29 16:11:21.165534+05:30	2026-05-29 16:11:21.165534+05:30	\N
2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	ABHISHEK_TEAM	Abhishek Team	Checker — Annual Subscription / Geneva/UK/US rent	f	2026-05-29 16:11:21.165534+05:30	2026-05-29 16:11:21.165534+05:30	\N
d2699641-dbf4-4cc8-b4f8-854bed20611f	APPROVER	Approver	Approver - financial authorisation per the authority matrix	f	2026-05-29 16:13:00.140024+05:30	2026-05-29 16:13:00.140024+05:30	\N
de101e3a-9711-46da-9bfc-fb9c097e0a19	COUNTERPARTY	Counterparty	Counterparty - external user with access to the Counterparty module	t	2026-05-29 16:17:27.353667+05:30	2026-05-29 16:17:27.353667+05:30	\N
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role_id, created_at) FROM stdin;
e005db5d-11ef-4773-820b-e220fecb9616	45a844e3-fd35-40d9-8633-4d15abf5ed9f	0de259c9-b75a-4e2b-95f1-901d495f01d7	2026-05-29 16:11:21.165534+05:30
9b0906b9-ff4f-47c1-b293-ea7aa35d8860	45a844e3-fd35-40d9-8633-4d15abf5ed9f	e4e63895-212d-42b5-83cf-63ff4cba01c3	2026-05-29 16:11:21.165534+05:30
0e673386-b85a-4dc7-bedf-76efcee86c21	45a844e3-fd35-40d9-8633-4d15abf5ed9f	e030ea14-296f-498c-908d-57e8c3c7c70f	2026-05-29 16:11:21.165534+05:30
9f3cdd0c-6ff1-4128-966a-f558e3af6395	45a844e3-fd35-40d9-8633-4d15abf5ed9f	be6aac17-a869-46f5-a3c8-ebc8b5dd5d29	2026-05-29 16:11:21.165534+05:30
36638785-8483-458d-9a19-b7ff34a41b31	45a844e3-fd35-40d9-8633-4d15abf5ed9f	94b97c12-f17d-41a9-a2e2-8040a29192ea	2026-05-29 16:11:21.165534+05:30
34887cf9-bfe9-403e-896f-4a58d5b635ca	45a844e3-fd35-40d9-8633-4d15abf5ed9f	2684f84f-875f-43e8-9d6f-b70d6e1a8e7f	2026-05-29 16:11:21.165534+05:30
9b5d9b85-a901-4a94-97d7-a73c373474c0	45a844e3-fd35-40d9-8633-4d15abf5ed9f	d2699641-dbf4-4cc8-b4f8-854bed20611f	2026-05-29 16:13:00.140024+05:30
d0389803-a5e8-4783-bd18-cf4a9d006727	d60fecfa-8341-469b-8c82-602045ff2e2b	de101e3a-9711-46da-9bfc-fb9c097e0a19	2026-05-29 16:17:27.353667+05:30
49979f23-687c-4291-b875-b174bd3a3a2b	45a844e3-fd35-40d9-8633-4d15abf5ed9f	de101e3a-9711-46da-9bfc-fb9c097e0a19	2026-05-29 16:17:27.353667+05:30
23bd0fe9-316c-4e1d-8355-9972120b8de8	fa47e7b2-dfa8-46a3-8a48-f2efa8944350	0de259c9-b75a-4e2b-95f1-901d495f01d7	2026-05-29 16:30:02.328233+05:30
58d902cc-8d57-4b30-baa3-2dec9bf627b7	9e9b09e2-2762-471d-89c8-dae79f8ccbd9	94b97c12-f17d-41a9-a2e2-8040a29192ea	2026-05-29 16:31:05.294256+05:30
8b0e9212-b0fd-4589-81aa-a0458d951616	98fdb496-53fe-474c-8829-25e94569ab82	d2699641-dbf4-4cc8-b4f8-854bed20611f	2026-05-29 17:07:38.292696+05:30
3621cc2d-2a32-49ff-93f9-ae95c8e05b8b	23fa6946-2ede-4a14-b8d2-2473b9150df0	d2699641-dbf4-4cc8-b4f8-854bed20611f	2026-05-29 17:07:38.292696+05:30
baf988ab-a17e-4e7e-99ce-8e885eba4abf	d7972fda-60df-444a-851b-9e02b4908227	d2699641-dbf4-4cc8-b4f8-854bed20611f	2026-05-29 17:07:38.292696+05:30
c3df92a1-e960-4ab2-ba4a-db9eed182f57	198b8e75-e3ac-4223-8b2a-2cc3c0d5ef15	d2699641-dbf4-4cc8-b4f8-854bed20611f	2026-05-29 17:07:38.292696+05:30
6e028dab-b489-4f47-92d9-0cb59db0ac4d	a797d32b-14d8-4c79-8688-69f9d8fa4ded	d2699641-dbf4-4cc8-b4f8-854bed20611f	2026-05-29 17:07:38.292696+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, full_name, employee_code, is_active, is_platform_admin, last_login_at, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
98fdb496-53fe-474c-8829-25e94569ab82	ganesh@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Ganesh	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
23fa6946-2ede-4a14-b8d2-2473b9150df0	pinkesh@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Pinkesh	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
d32f0f54-0d3d-4680-b9c7-be9fdd5c54b8	venessa@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Venessa	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
d7972fda-60df-444a-851b-9e02b4908227	sachin@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Sachin	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
0eecb572-4a4a-4178-9473-eace89db65b6	magaeshwari@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Magaeshwari	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
0fd728c4-8012-4beb-a3fb-445d1bcd58dd	shivam@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Shivam	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
36029f86-1a12-47bc-9450-676f2d469a21	ghizlane@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Ghizlane	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
56c4ac8e-8854-490c-b9a5-32c1e76d38da	saritha@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Saritha	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
198b8e75-e3ac-4223-8b2a-2cc3c0d5ef15	ali@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Mr Ali	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
a797d32b-14d8-4c79-8688-69f9d8fa4ded	tarang@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Tarang	\N	t	f	\N	2026-05-29 15:47:37.441123+05:30	2026-05-29 15:47:37.441123+05:30	\N	\N	\N
9e9b09e2-2762-471d-89c8-dae79f8ccbd9	ankita@firsteconomy.com	$2b$12$8TD.KhX6Xzkr8jZkJeg/m.vOXnuHe0IdGhJYXRXA15plaK1pgYMqO	ankita	EMP-oo2	t	f	\N	2026-05-29 16:30:35.458079+05:30	2026-05-29 16:30:35.458079+05:30	\N	45a844e3-fd35-40d9-8633-4d15abf5ed9f	45a844e3-fd35-40d9-8633-4d15abf5ed9f
d60fecfa-8341-469b-8c82-602045ff2e2b	counterparty@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Counterparty	\N	t	f	2026-05-29 16:41:00.61+05:30	2026-05-29 15:47:37.441123+05:30	2026-05-29 16:41:00.613235+05:30	\N	\N	\N
fa47e7b2-dfa8-46a3-8a48-f2efa8944350	sonal@firsteconomy.com	$2b$12$Ng8AcIOf73hyN9pt3oyODev2/9y65qbbSk3z3EHZ3d6G6MWUdIahW	Sonal Tamboli	EMP-oo1	t	f	2026-05-29 18:16:01.257+05:30	2026-05-29 16:29:29.317141+05:30	2026-05-29 18:16:01.262695+05:30	\N	45a844e3-fd35-40d9-8633-4d15abf5ed9f	45a844e3-fd35-40d9-8633-4d15abf5ed9f
45a844e3-fd35-40d9-8633-4d15abf5ed9f	admin@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Admin	\N	t	t	2026-05-30 06:51:15.437+05:30	2026-05-29 15:47:37.441123+05:30	2026-05-30 06:51:15.443479+05:30	\N	\N	\N
\.


--
-- Name: payment_request_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_request_seq', 1, false);


--
-- Name: account_types account_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_name_key UNIQUE (name);


--
-- Name: account_types account_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_pkey PRIMARY KEY (id);


--
-- Name: approval_matrices approval_matrices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT approval_matrices_pkey PRIMARY KEY (id);


--
-- Name: approval_matrix_bands approval_matrix_bands_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrix_bands
    ADD CONSTRAINT approval_matrix_bands_pkey PRIMARY KEY (id);


--
-- Name: approval_matrix_steps approval_matrix_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrix_steps
    ADD CONSTRAINT approval_matrix_steps_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: banks banks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_pkey PRIMARY KEY (id);


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_pkey PRIMARY KEY (id);


--
-- Name: beneficiary_accounts beneficiary_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_pkey PRIMARY KEY (id);


--
-- Name: counterparties counterparties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparties
    ADD CONSTRAINT counterparties_pkey PRIMARY KEY (id);


--
-- Name: countries countries_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_code_key UNIQUE (code);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_work_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_work_email_key UNIQUE (work_email);


--
-- Name: legal_entities legal_entities_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_entities
    ADD CONSTRAINT legal_entities_code_key UNIQUE (code);


--
-- Name: legal_entities legal_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_entities
    ADD CONSTRAINT legal_entities_pkey PRIMARY KEY (id);


--
-- Name: payment_categories payment_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_categories
    ADD CONSTRAINT payment_categories_pkey PRIMARY KEY (id);


--
-- Name: payment_request_approvals payment_request_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_pkey PRIMARY KEY (id);


--
-- Name: payment_request_documents payment_request_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_request_documents
    ADD CONSTRAINT payment_request_documents_pkey PRIMARY KEY (id);


--
-- Name: payment_requests payment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_pkey PRIMARY KEY (id);


--
-- Name: payment_requests payment_requests_request_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_request_number_key UNIQUE (request_number);


--
-- Name: payment_types payment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_pkey PRIMARY KEY (id);


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
-- Name: idx_account_types_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_types_deleted_at ON public.account_types USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_bacr_bene_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bacr_bene_account ON public.beneficiary_account_change_requests USING btree (beneficiary_account_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bacr_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bacr_deleted_at ON public.beneficiary_account_change_requests USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_bacr_requested_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bacr_requested_by ON public.beneficiary_account_change_requests USING btree (requested_by) WHERE (deleted_at IS NULL);


--
-- Name: idx_bacr_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bacr_status ON public.beneficiary_account_change_requests USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_bands_matrix_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bands_matrix_id ON public.approval_matrix_bands USING btree (matrix_id);


--
-- Name: idx_bank_accounts_account_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_accounts_account_type_id ON public.bank_accounts USING btree (account_type_id);


--
-- Name: idx_bank_accounts_bank_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_accounts_bank_id ON public.bank_accounts USING btree (bank_id);


--
-- Name: idx_bank_accounts_counterparty_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_accounts_counterparty_id ON public.bank_accounts USING btree (counterparty_id) WHERE ((counterparty_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_bank_accounts_currency_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_accounts_currency_id ON public.bank_accounts USING btree (currency_id);


--
-- Name: idx_bank_accounts_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_accounts_deleted_at ON public.bank_accounts USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_bank_accounts_is_counterparty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_accounts_is_counterparty ON public.bank_accounts USING btree (is_counterparty) WHERE (deleted_at IS NULL);


--
-- Name: idx_banks_country_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_banks_country_id ON public.banks USING btree (country_id);


--
-- Name: idx_banks_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_banks_deleted_at ON public.banks USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_banks_is_counterparty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_banks_is_counterparty ON public.banks USING btree (is_counterparty) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_counterparty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bene_counterparty ON public.beneficiary_accounts USING btree (counterparty_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_country; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bene_country ON public.beneficiary_accounts USING btree (country_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bene_deleted_at ON public.beneficiary_accounts USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bene_employee ON public.beneficiary_accounts USING btree (employee_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bene_status ON public.beneficiary_accounts USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_counterparties_country_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_counterparties_country_id ON public.counterparties USING btree (country_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_counterparties_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_counterparties_deleted_at ON public.counterparties USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_counterparties_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_counterparties_role ON public.counterparties USING btree (role) WHERE (deleted_at IS NULL);


--
-- Name: idx_countries_currency_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_countries_currency_id ON public.countries USING btree (currency_id);


--
-- Name: idx_countries_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_countries_deleted_at ON public.countries USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_countries_is_sanctioned; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_countries_is_sanctioned ON public.countries USING btree (is_sanctioned) WHERE ((deleted_at IS NULL) AND (is_sanctioned = true));


--
-- Name: idx_currencies_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_currencies_deleted_at ON public.currencies USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_employees_country_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_country_id ON public.employees USING btree (country_of_employment_id);


--
-- Name: idx_employees_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_deleted_at ON public.employees USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_legal_entities_country_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_legal_entities_country_id ON public.legal_entities USING btree (country_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_legal_entities_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_legal_entities_deleted_at ON public.legal_entities USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_matrices_currency; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matrices_currency ON public.approval_matrices USING btree (currency_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_matrices_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matrices_deleted_at ON public.approval_matrices USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_matrices_payment_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matrices_payment_type ON public.approval_matrices USING btree (payment_type_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_matrices_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_matrices_status ON public.approval_matrices USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_categories_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_categories_deleted_at ON public.payment_categories USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_types_category_id ON public.payment_types USING btree (payment_category_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_checker_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_types_checker_role_id ON public.payment_types USING btree (checker_role_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_checker_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_types_checker_user_id ON public.payment_types USING btree (checker_user_id) WHERE ((checker_user_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_payment_types_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_types_deleted_at ON public.payment_types USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_maker_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_types_maker_role_id ON public.payment_types USING btree (maker_role_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_maker_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_types_maker_user_id ON public.payment_types USING btree (maker_user_id) WHERE ((maker_user_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_pr_beneficiary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_beneficiary ON public.payment_requests USING btree (beneficiary_account_id) WHERE (beneficiary_account_id IS NOT NULL);


--
-- Name: idx_pr_counterparty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_counterparty ON public.payment_requests USING btree (counterparty_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_created_at ON public.payment_requests USING btree (created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_deleted_at ON public.payment_requests USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_entity ON public.payment_requests USING btree (legal_entity_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_invoice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_invoice ON public.payment_requests USING btree (invoice_number) WHERE ((invoice_number IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_pr_payment_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_payment_type ON public.payment_requests USING btree (payment_type_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pr_status ON public.payment_requests USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_pra_decision; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pra_decision ON public.payment_request_approvals USING btree (decision);


--
-- Name: idx_pra_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pra_role ON public.payment_request_approvals USING btree (approver_role_id) WHERE (approver_role_id IS NOT NULL);


--
-- Name: idx_pra_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pra_user ON public.payment_request_approvals USING btree (approver_user_id) WHERE (approver_user_id IS NOT NULL);


--
-- Name: idx_prd_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prd_code ON public.payment_request_documents USING btree (payment_request_id, document_code);


--
-- Name: idx_prd_request; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prd_request ON public.payment_request_documents USING btree (payment_request_id);


--
-- Name: idx_steps_band_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_steps_band_id ON public.approval_matrix_steps USING btree (band_id);


--
-- Name: uq_account_types_name_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_account_types_name_live ON public.account_types USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: uq_bands_matrix_sort; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_bands_matrix_sort ON public.approval_matrix_bands USING btree (matrix_id, sort_order);


--
-- Name: uq_bank_accounts_bank_account_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_bank_accounts_bank_account_live ON public.bank_accounts USING btree (bank_id, account_number) WHERE ((deleted_at IS NULL) AND (bank_id IS NOT NULL));


--
-- Name: uq_banks_name_country_kind_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_banks_name_country_kind_live ON public.banks USING btree (name, country_id, is_counterparty) WHERE (deleted_at IS NULL);


--
-- Name: uq_bene_bank_account_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_bene_bank_account_live ON public.beneficiary_accounts USING btree (bank_id, account_number) WHERE (deleted_at IS NULL);


--
-- Name: uq_counterparties_code_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_counterparties_code_live ON public.counterparties USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: uq_currencies_code_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_currencies_code_live ON public.currencies USING btree (code) WHERE ((code IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: uq_employees_employee_code_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_employees_employee_code_live ON public.employees USING btree (employee_code) WHERE (deleted_at IS NULL);


--
-- Name: uq_legal_entities_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_legal_entities_code ON public.legal_entities USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: uq_matrices_pt_ccy_name_version_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_matrices_pt_ccy_name_version_live ON public.approval_matrices USING btree (payment_type_id, currency_id, name, version) WHERE (deleted_at IS NULL);


--
-- Name: uq_payment_categories_name_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_payment_categories_name_live ON public.payment_categories USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: uq_payment_types_code_live; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_payment_types_code_live ON public.payment_types USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: uq_pra_request_step; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_pra_request_step ON public.payment_request_approvals USING btree (payment_request_id, step_order);


--
-- Name: uq_steps_band_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_steps_band_order ON public.approval_matrix_steps USING btree (band_id, step_order);


--
-- Name: approval_matrices approval_matrices_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT approval_matrices_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: approval_matrices approval_matrices_payment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT approval_matrices_payment_type_id_fkey FOREIGN KEY (payment_type_id) REFERENCES public.payment_types(id) ON DELETE RESTRICT;


--
-- Name: approval_matrix_bands approval_matrix_bands_matrix_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrix_bands
    ADD CONSTRAINT approval_matrix_bands_matrix_id_fkey FOREIGN KEY (matrix_id) REFERENCES public.approval_matrices(id) ON DELETE CASCADE;


--
-- Name: approval_matrix_steps approval_matrix_steps_approver_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrix_steps
    ADD CONSTRAINT approval_matrix_steps_approver_role_id_fkey FOREIGN KEY (approver_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: approval_matrix_steps approval_matrix_steps_approver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrix_steps
    ADD CONSTRAINT approval_matrix_steps_approver_user_id_fkey FOREIGN KEY (approver_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: approval_matrix_steps approval_matrix_steps_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_matrix_steps
    ADD CONSTRAINT approval_matrix_steps_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.approval_matrix_bands(id) ON DELETE CASCADE;


--
-- Name: bank_accounts bank_accounts_account_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_account_type_id_fkey FOREIGN KEY (account_type_id) REFERENCES public.account_types(id) ON DELETE RESTRICT;


--
-- Name: bank_accounts bank_accounts_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.banks(id) ON DELETE RESTRICT;


--
-- Name: bank_accounts bank_accounts_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON DELETE RESTRICT;


--
-- Name: bank_accounts bank_accounts_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: banks banks_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_beneficiary_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_beneficiary_account_id_fkey FOREIGN KEY (beneficiary_account_id) REFERENCES public.beneficiary_accounts(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.banks(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: counterparties counterparties_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.counterparties
    ADD CONSTRAINT counterparties_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: countries countries_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: employees employees_country_of_employment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_country_of_employment_id_fkey FOREIGN KEY (country_of_employment_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: legal_entities legal_entities_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.legal_entities
    ADD CONSTRAINT legal_entities_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: payment_request_approvals payment_request_approvals_approver_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_approver_role_id_fkey FOREIGN KEY (approver_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: payment_request_approvals payment_request_approvals_approver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_approver_user_id_fkey FOREIGN KEY (approver_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_request_approvals payment_request_approvals_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_request_approvals payment_request_approvals_payment_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_payment_request_id_fkey FOREIGN KEY (payment_request_id) REFERENCES public.payment_requests(id) ON DELETE CASCADE;


--
-- Name: payment_request_documents payment_request_documents_payment_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_request_documents
    ADD CONSTRAINT payment_request_documents_payment_request_id_fkey FOREIGN KEY (payment_request_id) REFERENCES public.payment_requests(id) ON DELETE CASCADE;


--
-- Name: payment_request_documents payment_request_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_request_documents
    ADD CONSTRAINT payment_request_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_beneficiary_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_beneficiary_account_id_fkey FOREIGN KEY (beneficiary_account_id) REFERENCES public.beneficiary_accounts(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_legal_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_legal_entity_id_fkey FOREIGN KEY (legal_entity_id) REFERENCES public.legal_entities(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_payment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_payment_type_id_fkey FOREIGN KEY (payment_type_id) REFERENCES public.payment_types(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_source_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_source_account_id_fkey FOREIGN KEY (source_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_checker_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_checker_role_id_fkey FOREIGN KEY (checker_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_checker_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_checker_user_id_fkey FOREIGN KEY (checker_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_maker_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_maker_role_id_fkey FOREIGN KEY (maker_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_maker_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_maker_user_id_fkey FOREIGN KEY (maker_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_payment_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_payment_category_id_fkey FOREIGN KEY (payment_category_id) REFERENCES public.payment_categories(id) ON DELETE RESTRICT;


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

\unrestrict tmKahVh2xUCNibu9lQXRHFPMZFkHZ9w9bjyUFkKkbU7bUN0zRiY1tqL9stmEHcZ

