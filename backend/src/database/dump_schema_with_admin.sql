--
-- PostgreSQL database dump
--

\restrict HsI5XMDxwa8oH2OSDT3dZ0A4ZI65FyxPupdvHoSIYlXRrUk8zq9Ux2PvC4Aqwca

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_types; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: approval_matrices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_matrices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    payment_type_id uuid NOT NULL,
    currency_id uuid NOT NULL,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    effective_to date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    tt_mode character varying(20) DEFAULT 'ONLINE_TT'::character varying NOT NULL,
    treasury_maker_role_id uuid,
    treasury_checker_role_id uuid,
    treasury_authoriser_role_id uuid,
    CONSTRAINT chk_approval_matrix_tt_mode CHECK (((tt_mode)::text = ANY (ARRAY[('ONLINE_TT'::character varying)::text, ('OFFLINE_TT'::character varying)::text])))
);


--
-- Name: approval_matrix_bands; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: approval_matrix_steps; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT chk_step_approver_type CHECK (((approver_type)::text = ANY (ARRAY[('USER'::character varying)::text, ('ROLE'::character varying)::text])))
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action character varying(40) NOT NULL,
    entity_type character varying(80),
    entity_id character varying(64),
    user_id uuid,
    user_email character varying(200),
    http_method character varying(10) NOT NULL,
    path text NOT NULL,
    status_code integer,
    success boolean DEFAULT true NOT NULL,
    params jsonb,
    request_body jsonb,
    error_message text,
    ip_address character varying(64),
    user_agent text,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: balance_changes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balance_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    kind character varying(25) NOT NULL,
    previous_balance numeric(20,4) NOT NULL,
    new_balance numeric(20,4) NOT NULL,
    delta numeric(20,4) NOT NULL,
    reason text,
    payment_request_id uuid,
    receipt_id uuid,
    statement_upload_id uuid,
    changed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_balance_change_kind CHECK (((kind)::text = ANY (ARRAY[('PAYMENT_DEBIT'::character varying)::text, ('RECEIPT_CREDIT'::character varying)::text, ('STATEMENT_RESET'::character varying)::text, ('MANUAL_OVERRIDE'::character varying)::text, ('PAYMENT_CORRECTION'::character varying)::text])))
);


--
-- Name: bank_account_charge_bands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_account_charge_bands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bank_account_id uuid NOT NULL,
    sort_order integer NOT NULL,
    min_amount numeric(20,4) NOT NULL,
    max_amount numeric(20,4),
    percentage numeric(7,4) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_charge_band_amounts CHECK (((max_amount IS NULL) OR (max_amount > min_amount))),
    CONSTRAINT chk_charge_band_percentage CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric)))
);


--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: bank_statement_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_statement_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    statement_upload_id uuid NOT NULL,
    bank_account_id uuid NOT NULL,
    line_index integer NOT NULL,
    value_date date NOT NULL,
    posting_date date,
    direction character varying(10) NOT NULL,
    amount numeric(20,4) NOT NULL,
    currency_code character varying(10) NOT NULL,
    bank_reference character varying(140),
    counterparty_text character varying(300),
    narrative text,
    running_balance numeric(20,4),
    match_status character varying(15) DEFAULT 'UNMATCHED'::character varying NOT NULL,
    matched_payment_request_id uuid,
    matched_incoming_receipt_id uuid,
    match_score numeric(5,2),
    match_reason text,
    matched_at timestamp with time zone,
    matched_by uuid,
    exception_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_statement_line_direction CHECK (((direction)::text = ANY (ARRAY[('DEBIT'::character varying)::text, ('CREDIT'::character varying)::text]))),
    CONSTRAINT chk_statement_line_match CHECK (((match_status)::text = ANY (ARRAY[('UNMATCHED'::character varying)::text, ('CANDIDATE'::character varying)::text, ('MATCHED'::character varying)::text, ('EXCEPTION'::character varying)::text])))
);


--
-- Name: bank_statement_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bank_statement_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bank_account_id uuid NOT NULL,
    statement_date date NOT NULL,
    opening_balance numeric(20,4) NOT NULL,
    closing_balance numeric(20,4) NOT NULL,
    file_url character varying(500) NOT NULL,
    row_count integer DEFAULT 0 NOT NULL,
    notes text,
    ingestion_status character varying(20) DEFAULT 'UPLOADED'::character varying NOT NULL,
    ingestion_format character varying(10),
    ingestion_error text,
    auto_match_completed_at timestamp with time zone,
    matched_count integer DEFAULT 0 NOT NULL,
    candidate_count integer DEFAULT 0 NOT NULL,
    exception_count integer DEFAULT 0 NOT NULL,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_statement_ingestion_status CHECK (((ingestion_status)::text = ANY (ARRAY[('UPLOADED'::character varying)::text, ('PARSED'::character varying)::text, ('PARSE_FAILED'::character varying)::text, ('MATCHED'::character varying)::text])))
);


--
-- Name: banks; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: beneficiary_account_change_requests; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT chk_bacr_change_type CHECK (((change_type)::text = ANY (ARRAY[('ADD'::character varying)::text, ('MODIFY'::character varying)::text, ('DEACTIVATE'::character varying)::text]))),
    CONSTRAINT chk_bacr_maker_checker CHECK (((verified_by IS NULL) OR (verified_by <> requested_by))),
    CONSTRAINT chk_bacr_status CHECK (((status)::text = ANY (ARRAY[('PENDING_VERIFICATION'::character varying)::text, ('VERIFIED'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


--
-- Name: beneficiary_accounts; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT chk_bene_direction CHECK (((account_direction)::text = ANY (ARRAY[('PAY_TO'::character varying)::text, ('RECEIVE_FROM'::character varying)::text, ('BOTH'::character varying)::text]))),
    CONSTRAINT chk_bene_owner CHECK ((((counterparty_id IS NOT NULL) AND (employee_id IS NULL)) OR ((counterparty_id IS NULL) AND (employee_id IS NOT NULL)))),
    CONSTRAINT chk_bene_status CHECK (((status)::text = ANY (ARRAY[('PENDING_ACTIVATION'::character varying)::text, ('ACTIVE'::character varying)::text, ('INACTIVE'::character varying)::text])))
);


--
-- Name: counterparties; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT chk_counterparty_role CHECK (((role)::text = ANY (ARRAY[('VENDOR'::character varying)::text, ('CUSTOMER'::character varying)::text, ('BOTH'::character varying)::text])))
);


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: employee_login_otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_login_otps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    code_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
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
    updated_by uuid,
    legal_entity_id uuid
);


--
-- Name: fx_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fx_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    base_currency_code character(3) NOT NULL,
    quote_currency_code character(3) NOT NULL,
    rate numeric(20,8) NOT NULL,
    as_of_date date NOT NULL,
    source character varying(20) DEFAULT 'OANDA'::character varying NOT NULL,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL,
    provider_name character varying(60),
    override_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid
);


--
-- Name: incoming_receipt_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incoming_receipt_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    incoming_receipt_id uuid NOT NULL,
    document_code character varying(50) NOT NULL,
    document_label character varying(200),
    file_name character varying(255) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_size_bytes integer,
    mime_type character varying(100),
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: incoming_receipt_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.incoming_receipt_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: incoming_receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incoming_receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    receipt_number character varying(30) NOT NULL,
    legal_entity_id uuid NOT NULL,
    counterparty_id uuid NOT NULL,
    receive_from_account_id uuid NOT NULL,
    expected_amount numeric(20,4) NOT NULL,
    expected_currency_code character varying(10) NOT NULL,
    purpose_description text,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    submitted_at timestamp with time zone,
    received_at timestamp with time zone,
    received_amount numeric(20,4),
    received_currency_code character varying(10),
    inward_bank_reference character varying(140),
    received_remarks text,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    received_from_account character varying(200),
    CONSTRAINT chk_incoming_receipt_status CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('AWAITING_RECEIPT'::character varying)::text, ('RECEIVED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


--
-- Name: legal_entities; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: payment_categories; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: payment_request_approvals; Type: TABLE; Schema: public; Owner: -
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
    CONSTRAINT chk_pra_decision CHECK (((decision)::text = ANY (ARRAY[('PENDING'::character varying)::text, ('APPROVED'::character varying)::text, ('REJECTED'::character varying)::text]))),
    CONSTRAINT chk_pra_target CHECK (((((approver_type)::text = 'USER'::text) AND (approver_user_id IS NOT NULL) AND (approver_role_id IS NULL)) OR (((approver_type)::text = 'ROLE'::text) AND (approver_role_id IS NOT NULL) AND (approver_user_id IS NULL)))),
    CONSTRAINT chk_pra_type CHECK (((approver_type)::text = ANY (ARRAY[('USER'::character varying)::text, ('ROLE'::character varying)::text])))
);


--
-- Name: payment_request_documents; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: payment_request_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_request_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    request_number character varying(30) NOT NULL,
    payment_type_id uuid NOT NULL,
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
    anomaly_flag boolean DEFAULT false NOT NULL,
    anomaly_notes text,
    tt_mode character varying(20),
    treasury_reference_number character varying(100),
    swift_copy_url character varying(500),
    treasury_maker_by uuid,
    treasury_maker_at timestamp with time zone,
    treasury_checker_by uuid,
    treasury_checker_at timestamp with time zone,
    treasury_authoriser_by uuid,
    treasury_authoriser_at timestamp with time zone,
    completed_at timestamp with time zone,
    treasury_maker_role_id uuid,
    treasury_checker_role_id uuid,
    treasury_authoriser_role_id uuid,
    raised_by_employee_id uuid,
    CONSTRAINT chk_pr_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_pr_status CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('PENDING_APPROVAL'::character varying)::text, ('TREASURY_MAKER'::character varying)::text, ('TREASURY_CHECKER'::character varying)::text, ('TREASURY_AUTHORISER'::character varying)::text, ('COMPLETED'::character varying)::text, ('REJECTED'::character varying)::text, ('WITHDRAWN'::character varying)::text, ('CANCELLED'::character varying)::text, ('AWAITING_MAKER_PREP'::character varying)::text, ('AWAITING_CHECKER_REVIEW'::character varying)::text, ('AWAITING_HEAD_APPROVAL'::character varying)::text])))
);


--
-- Name: payment_types; Type: TABLE; Schema: public; Owner: -
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
    legal_entity_id uuid NOT NULL,
    maker_role_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    employee_self_service boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_payment_type_direction CHECK (((direction)::text = ANY (ARRAY[('OUTGOING'::character varying)::text, ('INCOMING'::character varying)::text])))
);


--
-- Name: reconciliation_exception_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reconciliation_exception_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reconciliation_exceptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reconciliation_exceptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    exception_number character varying(30) NOT NULL,
    statement_upload_id uuid NOT NULL,
    statement_line_id uuid NOT NULL,
    bank_account_id uuid NOT NULL,
    exception_type character varying(25) NOT NULL,
    status character varying(30) DEFAULT 'OPEN'::character varying NOT NULL,
    amount numeric(20,4) NOT NULL,
    currency_code character varying(10) NOT NULL,
    value_date date NOT NULL,
    bank_reference character varying(140),
    counterparty_text character varying(300),
    narrative text,
    resolution_note text,
    investigated_by uuid,
    investigated_at timestamp with time zone,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_recon_exception_status CHECK (((status)::text = ANY (ARRAY[('OPEN'::character varying)::text, ('UNDER_INVESTIGATION'::character varying)::text, ('RESOLVED_WITH_JUSTIFICATION'::character varying)::text, ('CONFIRMED_EXCEPTION'::character varying)::text]))),
    CONSTRAINT chk_recon_exception_type CHECK (((exception_type)::text = ANY (ARRAY[('UNAUTHORISED_PAYMENT'::character varying)::text, ('UNIDENTIFIED_RECEIPT'::character varying)::text])))
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: account_types account_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_name_key UNIQUE (name);


--
-- Name: account_types account_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_pkey PRIMARY KEY (id);


--
-- Name: approval_matrices approval_matrices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT approval_matrices_pkey PRIMARY KEY (id);


--
-- Name: approval_matrix_bands approval_matrix_bands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrix_bands
    ADD CONSTRAINT approval_matrix_bands_pkey PRIMARY KEY (id);


--
-- Name: approval_matrix_steps approval_matrix_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrix_steps
    ADD CONSTRAINT approval_matrix_steps_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: balance_changes balance_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_changes
    ADD CONSTRAINT balance_changes_pkey PRIMARY KEY (id);


--
-- Name: bank_account_charge_bands bank_account_charge_bands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_account_charge_bands
    ADD CONSTRAINT bank_account_charge_bands_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: bank_statement_lines bank_statement_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statement_lines
    ADD CONSTRAINT bank_statement_lines_pkey PRIMARY KEY (id);


--
-- Name: bank_statement_uploads bank_statement_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statement_uploads
    ADD CONSTRAINT bank_statement_uploads_pkey PRIMARY KEY (id);


--
-- Name: banks banks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_pkey PRIMARY KEY (id);


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_pkey PRIMARY KEY (id);


--
-- Name: beneficiary_accounts beneficiary_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_pkey PRIMARY KEY (id);


--
-- Name: counterparties counterparties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.counterparties
    ADD CONSTRAINT counterparties_pkey PRIMARY KEY (id);


--
-- Name: countries countries_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_code_key UNIQUE (code);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- Name: employee_login_otps employee_login_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_login_otps
    ADD CONSTRAINT employee_login_otps_pkey PRIMARY KEY (id);


--
-- Name: employees employees_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_code_key UNIQUE (employee_code);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_work_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_work_email_key UNIQUE (work_email);


--
-- Name: fx_rates fx_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fx_rates
    ADD CONSTRAINT fx_rates_pkey PRIMARY KEY (id);


--
-- Name: incoming_receipt_documents incoming_receipt_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incoming_receipt_documents
    ADD CONSTRAINT incoming_receipt_documents_pkey PRIMARY KEY (id);


--
-- Name: incoming_receipts incoming_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incoming_receipts
    ADD CONSTRAINT incoming_receipts_pkey PRIMARY KEY (id);


--
-- Name: incoming_receipts incoming_receipts_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incoming_receipts
    ADD CONSTRAINT incoming_receipts_receipt_number_key UNIQUE (receipt_number);


--
-- Name: legal_entities legal_entities_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_entities
    ADD CONSTRAINT legal_entities_code_key UNIQUE (code);


--
-- Name: legal_entities legal_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_entities
    ADD CONSTRAINT legal_entities_pkey PRIMARY KEY (id);


--
-- Name: payment_categories payment_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_categories
    ADD CONSTRAINT payment_categories_pkey PRIMARY KEY (id);


--
-- Name: payment_request_approvals payment_request_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_pkey PRIMARY KEY (id);


--
-- Name: payment_request_documents payment_request_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_documents
    ADD CONSTRAINT payment_request_documents_pkey PRIMARY KEY (id);


--
-- Name: payment_requests payment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_pkey PRIMARY KEY (id);


--
-- Name: payment_requests payment_requests_request_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_request_number_key UNIQUE (request_number);


--
-- Name: payment_types payment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_pkey PRIMARY KEY (id);


--
-- Name: reconciliation_exceptions reconciliation_exceptions_exception_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_exceptions
    ADD CONSTRAINT reconciliation_exceptions_exception_number_key UNIQUE (exception_number);


--
-- Name: reconciliation_exceptions reconciliation_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_exceptions
    ADD CONSTRAINT reconciliation_exceptions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_code_key UNIQUE (employee_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_account_types_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_types_deleted_at ON public.account_types USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id, created_at);


--
-- Name: idx_bacr_bene_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bacr_bene_account ON public.beneficiary_account_change_requests USING btree (beneficiary_account_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bacr_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bacr_deleted_at ON public.beneficiary_account_change_requests USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_bacr_requested_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bacr_requested_by ON public.beneficiary_account_change_requests USING btree (requested_by) WHERE (deleted_at IS NULL);


--
-- Name: idx_bacr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bacr_status ON public.beneficiary_account_change_requests USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_balance_changes_account_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_balance_changes_account_time ON public.balance_changes USING btree (account_id, created_at DESC);


--
-- Name: idx_balance_changes_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_balance_changes_kind ON public.balance_changes USING btree (kind);


--
-- Name: idx_bands_matrix_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bands_matrix_id ON public.approval_matrix_bands USING btree (matrix_id);


--
-- Name: idx_bank_accounts_account_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_accounts_account_type_id ON public.bank_accounts USING btree (account_type_id);


--
-- Name: idx_bank_accounts_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_accounts_bank_id ON public.bank_accounts USING btree (bank_id);


--
-- Name: idx_bank_accounts_counterparty_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_accounts_counterparty_id ON public.bank_accounts USING btree (counterparty_id) WHERE ((counterparty_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_bank_accounts_currency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_accounts_currency_id ON public.bank_accounts USING btree (currency_id);


--
-- Name: idx_bank_accounts_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_accounts_deleted_at ON public.bank_accounts USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_bank_accounts_is_counterparty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bank_accounts_is_counterparty ON public.bank_accounts USING btree (is_counterparty) WHERE (deleted_at IS NULL);


--
-- Name: idx_banks_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banks_country_id ON public.banks USING btree (country_id);


--
-- Name: idx_banks_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banks_deleted_at ON public.banks USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_banks_is_counterparty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banks_is_counterparty ON public.banks USING btree (is_counterparty) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_counterparty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bene_counterparty ON public.beneficiary_accounts USING btree (counterparty_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bene_country ON public.beneficiary_accounts USING btree (country_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bene_deleted_at ON public.beneficiary_accounts USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bene_employee ON public.beneficiary_accounts USING btree (employee_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_bene_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bene_status ON public.beneficiary_accounts USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_charge_bands_bank_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_charge_bands_bank_account ON public.bank_account_charge_bands USING btree (bank_account_id);


--
-- Name: idx_counterparties_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_counterparties_country_id ON public.counterparties USING btree (country_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_counterparties_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_counterparties_deleted_at ON public.counterparties USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_counterparties_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_counterparties_role ON public.counterparties USING btree (role) WHERE (deleted_at IS NULL);


--
-- Name: idx_countries_currency_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_countries_currency_id ON public.countries USING btree (currency_id);


--
-- Name: idx_countries_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_countries_deleted_at ON public.countries USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_countries_is_sanctioned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_countries_is_sanctioned ON public.countries USING btree (is_sanctioned) WHERE ((deleted_at IS NULL) AND (is_sanctioned = true));


--
-- Name: idx_currencies_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_currencies_deleted_at ON public.currencies USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_employee_login_otps_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employee_login_otps_employee ON public.employee_login_otps USING btree (employee_id, expires_at);


--
-- Name: idx_employees_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_country_id ON public.employees USING btree (country_of_employment_id);


--
-- Name: idx_employees_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_employees_deleted_at ON public.employees USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_fx_rates_base_quote_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fx_rates_base_quote_date ON public.fx_rates USING btree (base_currency_code, quote_currency_code, as_of_date DESC);


--
-- Name: idx_fx_rates_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fx_rates_deleted_at ON public.fx_rates USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_incoming_receipt_documents_receipt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incoming_receipt_documents_receipt ON public.incoming_receipt_documents USING btree (incoming_receipt_id);


--
-- Name: idx_incoming_receipts_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incoming_receipts_account ON public.incoming_receipts USING btree (receive_from_account_id);


--
-- Name: idx_incoming_receipts_counterparty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incoming_receipts_counterparty ON public.incoming_receipts USING btree (counterparty_id);


--
-- Name: idx_incoming_receipts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incoming_receipts_status ON public.incoming_receipts USING btree (status);


--
-- Name: idx_legal_entities_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_entities_country_id ON public.legal_entities USING btree (country_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_legal_entities_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legal_entities_deleted_at ON public.legal_entities USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_matrices_currency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matrices_currency ON public.approval_matrices USING btree (currency_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_matrices_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matrices_deleted_at ON public.approval_matrices USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_matrices_payment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matrices_payment_type ON public.approval_matrices USING btree (payment_type_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_categories_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_categories_deleted_at ON public.payment_categories USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_types_category_id ON public.payment_types USING btree (payment_category_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_checker_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_types_checker_role_id ON public.payment_types USING btree (checker_role_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_checker_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_types_checker_user_id ON public.payment_types USING btree (checker_user_id) WHERE ((checker_user_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_payment_types_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_types_deleted_at ON public.payment_types USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_legal_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_types_legal_entity_id ON public.payment_types USING btree (legal_entity_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_maker_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_types_maker_role_id ON public.payment_types USING btree (maker_role_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_payment_types_maker_role_ids; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_types_maker_role_ids ON public.payment_types USING gin (maker_role_ids);


--
-- Name: idx_payment_types_maker_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_types_maker_user_id ON public.payment_types USING btree (maker_user_id) WHERE ((maker_user_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_pr_anomaly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_anomaly ON public.payment_requests USING btree (anomaly_flag) WHERE (anomaly_flag = true);


--
-- Name: idx_pr_beneficiary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_beneficiary ON public.payment_requests USING btree (beneficiary_account_id) WHERE (beneficiary_account_id IS NOT NULL);


--
-- Name: idx_pr_counterparty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_counterparty ON public.payment_requests USING btree (counterparty_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_created_at ON public.payment_requests USING btree (created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_deleted_at ON public.payment_requests USING btree (deleted_at) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_invoice ON public.payment_requests USING btree (invoice_number) WHERE ((invoice_number IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: idx_pr_payment_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_payment_type ON public.payment_requests USING btree (payment_type_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_raised_by_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_raised_by_employee ON public.payment_requests USING btree (raised_by_employee_id) WHERE (raised_by_employee_id IS NOT NULL);


--
-- Name: idx_pr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_status ON public.payment_requests USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: idx_pr_treasury_authoriser_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_treasury_authoriser_role ON public.payment_requests USING btree (treasury_authoriser_role_id) WHERE (treasury_authoriser_role_id IS NOT NULL);


--
-- Name: idx_pr_treasury_checker_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_treasury_checker_role ON public.payment_requests USING btree (treasury_checker_role_id) WHERE (treasury_checker_role_id IS NOT NULL);


--
-- Name: idx_pr_treasury_maker_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pr_treasury_maker_role ON public.payment_requests USING btree (treasury_maker_role_id) WHERE (treasury_maker_role_id IS NOT NULL);


--
-- Name: idx_pra_decision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pra_decision ON public.payment_request_approvals USING btree (decision);


--
-- Name: idx_pra_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pra_role ON public.payment_request_approvals USING btree (approver_role_id) WHERE (approver_role_id IS NOT NULL);


--
-- Name: idx_pra_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pra_user ON public.payment_request_approvals USING btree (approver_user_id) WHERE (approver_user_id IS NOT NULL);


--
-- Name: idx_prd_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prd_code ON public.payment_request_documents USING btree (payment_request_id, document_code);


--
-- Name: idx_prd_request; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prd_request ON public.payment_request_documents USING btree (payment_request_id);


--
-- Name: idx_recon_exceptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recon_exceptions_status ON public.reconciliation_exceptions USING btree (status);


--
-- Name: idx_recon_exceptions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recon_exceptions_type ON public.reconciliation_exceptions USING btree (exception_type);


--
-- Name: idx_recon_exceptions_upload; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recon_exceptions_upload ON public.reconciliation_exceptions USING btree (statement_upload_id);


--
-- Name: idx_statement_lines_match; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_statement_lines_match ON public.bank_statement_lines USING btree (match_status);


--
-- Name: idx_statement_lines_upload; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_statement_lines_upload ON public.bank_statement_lines USING btree (statement_upload_id, line_index);


--
-- Name: idx_statement_uploads_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_statement_uploads_account ON public.bank_statement_uploads USING btree (bank_account_id, statement_date DESC);


--
-- Name: idx_steps_band_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_steps_band_id ON public.approval_matrix_steps USING btree (band_id);


--
-- Name: uq_account_types_name_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_account_types_name_live ON public.account_types USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: uq_bands_matrix_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_bands_matrix_sort ON public.approval_matrix_bands USING btree (matrix_id, sort_order);


--
-- Name: uq_bank_accounts_bank_account_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_bank_accounts_bank_account_live ON public.bank_accounts USING btree (bank_id, account_number) WHERE ((deleted_at IS NULL) AND (bank_id IS NOT NULL));


--
-- Name: uq_banks_name_country_kind_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_banks_name_country_kind_live ON public.banks USING btree (name, country_id, is_counterparty) WHERE (deleted_at IS NULL);


--
-- Name: uq_bene_bank_account_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_bene_bank_account_live ON public.beneficiary_accounts USING btree (bank_id, account_number) WHERE (deleted_at IS NULL);


--
-- Name: uq_charge_bands_account_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_charge_bands_account_sort ON public.bank_account_charge_bands USING btree (bank_account_id, sort_order);


--
-- Name: uq_counterparties_code_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_counterparties_code_live ON public.counterparties USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: uq_currencies_code_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_currencies_code_live ON public.currencies USING btree (code) WHERE ((code IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: uq_employees_employee_code_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_employees_employee_code_live ON public.employees USING btree (employee_code) WHERE (deleted_at IS NULL);


--
-- Name: uq_fx_rates_base_quote_date_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_fx_rates_base_quote_date_live ON public.fx_rates USING btree (base_currency_code, quote_currency_code, as_of_date) WHERE (deleted_at IS NULL);


--
-- Name: uq_legal_entities_code; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_legal_entities_code ON public.legal_entities USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: uq_matrices_pt_ccy_name_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_matrices_pt_ccy_name_live ON public.approval_matrices USING btree (payment_type_id, currency_id, name) WHERE (deleted_at IS NULL);


--
-- Name: uq_payment_categories_name_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_payment_categories_name_live ON public.payment_categories USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: uq_payment_types_code_live; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_payment_types_code_live ON public.payment_types USING btree (code) WHERE (deleted_at IS NULL);


--
-- Name: uq_pra_request_step; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_pra_request_step ON public.payment_request_approvals USING btree (payment_request_id, step_order);


--
-- Name: uq_steps_band_order; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_steps_band_order ON public.approval_matrix_steps USING btree (band_id, step_order);


--
-- Name: approval_matrices approval_matrices_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT approval_matrices_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: approval_matrices approval_matrices_payment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT approval_matrices_payment_type_id_fkey FOREIGN KEY (payment_type_id) REFERENCES public.payment_types(id) ON DELETE RESTRICT;


--
-- Name: approval_matrix_bands approval_matrix_bands_matrix_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrix_bands
    ADD CONSTRAINT approval_matrix_bands_matrix_id_fkey FOREIGN KEY (matrix_id) REFERENCES public.approval_matrices(id) ON DELETE CASCADE;


--
-- Name: approval_matrix_steps approval_matrix_steps_approver_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrix_steps
    ADD CONSTRAINT approval_matrix_steps_approver_role_id_fkey FOREIGN KEY (approver_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: approval_matrix_steps approval_matrix_steps_approver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrix_steps
    ADD CONSTRAINT approval_matrix_steps_approver_user_id_fkey FOREIGN KEY (approver_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: approval_matrix_steps approval_matrix_steps_band_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrix_steps
    ADD CONSTRAINT approval_matrix_steps_band_id_fkey FOREIGN KEY (band_id) REFERENCES public.approval_matrix_bands(id) ON DELETE CASCADE;


--
-- Name: balance_changes balance_changes_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_changes
    ADD CONSTRAINT balance_changes_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.bank_accounts(id) ON DELETE CASCADE;


--
-- Name: bank_account_charge_bands bank_account_charge_bands_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_account_charge_bands
    ADD CONSTRAINT bank_account_charge_bands_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id) ON DELETE CASCADE;


--
-- Name: bank_accounts bank_accounts_account_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_account_type_id_fkey FOREIGN KEY (account_type_id) REFERENCES public.account_types(id) ON DELETE RESTRICT;


--
-- Name: bank_accounts bank_accounts_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.banks(id) ON DELETE RESTRICT;


--
-- Name: bank_accounts bank_accounts_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON DELETE RESTRICT;


--
-- Name: bank_accounts bank_accounts_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: bank_statement_lines bank_statement_lines_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statement_lines
    ADD CONSTRAINT bank_statement_lines_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);


--
-- Name: bank_statement_lines bank_statement_lines_matched_incoming_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statement_lines
    ADD CONSTRAINT bank_statement_lines_matched_incoming_receipt_id_fkey FOREIGN KEY (matched_incoming_receipt_id) REFERENCES public.incoming_receipts(id);


--
-- Name: bank_statement_lines bank_statement_lines_matched_payment_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statement_lines
    ADD CONSTRAINT bank_statement_lines_matched_payment_request_id_fkey FOREIGN KEY (matched_payment_request_id) REFERENCES public.payment_requests(id);


--
-- Name: bank_statement_lines bank_statement_lines_statement_upload_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statement_lines
    ADD CONSTRAINT bank_statement_lines_statement_upload_id_fkey FOREIGN KEY (statement_upload_id) REFERENCES public.bank_statement_uploads(id) ON DELETE CASCADE;


--
-- Name: bank_statement_uploads bank_statement_uploads_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_statement_uploads
    ADD CONSTRAINT bank_statement_uploads_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);


--
-- Name: banks banks_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banks
    ADD CONSTRAINT banks_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_beneficiary_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_beneficiary_account_id_fkey FOREIGN KEY (beneficiary_account_id) REFERENCES public.beneficiary_accounts(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_account_change_requests beneficiary_account_change_requests_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_account_change_requests
    ADD CONSTRAINT beneficiary_account_change_requests_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES public.banks(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: beneficiary_accounts beneficiary_accounts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.beneficiary_accounts
    ADD CONSTRAINT beneficiary_accounts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: counterparties counterparties_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.counterparties
    ADD CONSTRAINT counterparties_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: countries countries_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: employee_login_otps employee_login_otps_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_login_otps
    ADD CONSTRAINT employee_login_otps_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: employees employees_country_of_employment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_country_of_employment_id_fkey FOREIGN KEY (country_of_employment_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: employees employees_legal_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_legal_entity_id_fkey FOREIGN KEY (legal_entity_id) REFERENCES public.legal_entities(id) ON DELETE SET NULL;


--
-- Name: approval_matrices fk_am_treasury_authoriser_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT fk_am_treasury_authoriser_role FOREIGN KEY (treasury_authoriser_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: approval_matrices fk_am_treasury_checker_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT fk_am_treasury_checker_role FOREIGN KEY (treasury_checker_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: approval_matrices fk_am_treasury_maker_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_matrices
    ADD CONSTRAINT fk_am_treasury_maker_role FOREIGN KEY (treasury_maker_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: payment_requests fk_pr_treasury_authoriser; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT fk_pr_treasury_authoriser FOREIGN KEY (treasury_authoriser_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_requests fk_pr_treasury_authoriser_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT fk_pr_treasury_authoriser_role FOREIGN KEY (treasury_authoriser_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: payment_requests fk_pr_treasury_checker; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT fk_pr_treasury_checker FOREIGN KEY (treasury_checker_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_requests fk_pr_treasury_checker_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT fk_pr_treasury_checker_role FOREIGN KEY (treasury_checker_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: payment_requests fk_pr_treasury_maker; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT fk_pr_treasury_maker FOREIGN KEY (treasury_maker_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payment_requests fk_pr_treasury_maker_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT fk_pr_treasury_maker_role FOREIGN KEY (treasury_maker_role_id) REFERENCES public.roles(id) ON DELETE SET NULL;


--
-- Name: incoming_receipt_documents incoming_receipt_documents_incoming_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incoming_receipt_documents
    ADD CONSTRAINT incoming_receipt_documents_incoming_receipt_id_fkey FOREIGN KEY (incoming_receipt_id) REFERENCES public.incoming_receipts(id) ON DELETE CASCADE;


--
-- Name: incoming_receipts incoming_receipts_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incoming_receipts
    ADD CONSTRAINT incoming_receipts_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id);


--
-- Name: incoming_receipts incoming_receipts_legal_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incoming_receipts
    ADD CONSTRAINT incoming_receipts_legal_entity_id_fkey FOREIGN KEY (legal_entity_id) REFERENCES public.legal_entities(id);


--
-- Name: incoming_receipts incoming_receipts_receive_from_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incoming_receipts
    ADD CONSTRAINT incoming_receipts_receive_from_account_id_fkey FOREIGN KEY (receive_from_account_id) REFERENCES public.bank_accounts(id);


--
-- Name: legal_entities legal_entities_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_entities
    ADD CONSTRAINT legal_entities_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;


--
-- Name: payment_request_approvals payment_request_approvals_approver_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_approver_role_id_fkey FOREIGN KEY (approver_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: payment_request_approvals payment_request_approvals_approver_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_approver_user_id_fkey FOREIGN KEY (approver_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_request_approvals payment_request_approvals_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_request_approvals payment_request_approvals_payment_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_approvals
    ADD CONSTRAINT payment_request_approvals_payment_request_id_fkey FOREIGN KEY (payment_request_id) REFERENCES public.payment_requests(id) ON DELETE CASCADE;


--
-- Name: payment_request_documents payment_request_documents_payment_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_documents
    ADD CONSTRAINT payment_request_documents_payment_request_id_fkey FOREIGN KEY (payment_request_id) REFERENCES public.payment_requests(id) ON DELETE CASCADE;


--
-- Name: payment_request_documents payment_request_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_documents
    ADD CONSTRAINT payment_request_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_beneficiary_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_beneficiary_account_id_fkey FOREIGN KEY (beneficiary_account_id) REFERENCES public.beneficiary_accounts(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_counterparty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_counterparty_id_fkey FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_payment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_payment_type_id_fkey FOREIGN KEY (payment_type_id) REFERENCES public.payment_types(id) ON DELETE RESTRICT;


--
-- Name: payment_requests payment_requests_raised_by_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_raised_by_employee_id_fkey FOREIGN KEY (raised_by_employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: payment_requests payment_requests_source_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT payment_requests_source_account_id_fkey FOREIGN KEY (source_account_id) REFERENCES public.bank_accounts(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_checker_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_checker_role_id_fkey FOREIGN KEY (checker_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_checker_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_checker_user_id_fkey FOREIGN KEY (checker_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_legal_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_legal_entity_id_fkey FOREIGN KEY (legal_entity_id) REFERENCES public.legal_entities(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_maker_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_maker_role_id_fkey FOREIGN KEY (maker_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_maker_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_maker_user_id_fkey FOREIGN KEY (maker_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_types payment_types_payment_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_types
    ADD CONSTRAINT payment_types_payment_category_id_fkey FOREIGN KEY (payment_category_id) REFERENCES public.payment_categories(id) ON DELETE RESTRICT;


--
-- Name: reconciliation_exceptions reconciliation_exceptions_bank_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_exceptions
    ADD CONSTRAINT reconciliation_exceptions_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);


--
-- Name: reconciliation_exceptions reconciliation_exceptions_statement_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_exceptions
    ADD CONSTRAINT reconciliation_exceptions_statement_line_id_fkey FOREIGN KEY (statement_line_id) REFERENCES public.bank_statement_lines(id) ON DELETE CASCADE;


--
-- Name: reconciliation_exceptions reconciliation_exceptions_statement_upload_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reconciliation_exceptions
    ADD CONSTRAINT reconciliation_exceptions_statement_upload_id_fkey FOREIGN KEY (statement_upload_id) REFERENCES public.bank_statement_uploads(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict HsI5XMDxwa8oH2OSDT3dZ0A4ZI65FyxPupdvHoSIYlXRrUk8zq9Ux2PvC4Aqwca


-- =====================================================================
-- Seed: platform admin user (admin@radiant.com) with its role grants.
-- Password hash is bcrypt; default credentials per project seed docs.
-- =====================================================================
BEGIN;

-- Roles required by the admin
INSERT INTO roles (id, code, name, description, is_system, created_at, updated_at) VALUES ('fb4ee674-45b9-4160-aead-ec4470fb1592','CHAIRMAN','Chairman','Initiates confidential (chairman-style) payments.','t','2026-06-05 15:40:49.812089+05:30','2026-06-05 15:40:49.812089+05:30') ON CONFLICT (id) DO NOTHING;
INSERT INTO roles (id, code, name, description, is_system, created_at, updated_at) VALUES ('fdf3fc9a-2e7f-4b56-9987-553d0f0a69b7','SUPER_ADMIN','Platform administrator','Platform administrator','t','2026-06-05 17:14:07.493871+05:30','2026-06-05 17:14:07.493871+05:30') ON CONFLICT (id) DO NOTHING;
INSERT INTO roles (id, code, name, description, is_system, created_at, updated_at) VALUES ('0082be8d-052d-499a-94f6-2019d8dff9e7','TREASURY_TEAM_FOR_CHAIRMAN','Treasury Team (Chairman)','Completes confidential (chairman-style) payments in a single step: records the reference number, attaches the SWIFT copy / MT103, picks the source account and completes the payment. No maker/checker/authoriser chain.','f','2026-06-05 15:40:49.812089+05:30','2026-06-05 15:40:49.812089+05:30') ON CONFLICT (id) DO NOTHING;

-- Admin user
INSERT INTO users (id, email, password_hash, full_name, employee_code, is_active, is_platform_admin, created_at, updated_at) VALUES ('5a59123f-8a33-462c-a1bc-49efff8668f3','admin@radiant.com','$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK','System Administrator',NULL,'t','t','2026-06-04 15:16:14.034493+05:30','2026-06-16 12:09:57.020012+05:30') ON CONFLICT (id) DO NOTHING;

-- Role assignments
INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES ('55ee7b7e-aefb-4a17-92a8-8ef0e43dafce','5a59123f-8a33-462c-a1bc-49efff8668f3','fb4ee674-45b9-4160-aead-ec4470fb1592','2026-06-05 15:40:49.812089+05:30') ON CONFLICT (user_id, role_id) DO NOTHING;
INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES ('07d58ff8-25c8-48bc-981c-73bdf5d7bb0c','5a59123f-8a33-462c-a1bc-49efff8668f3','0082be8d-052d-499a-94f6-2019d8dff9e7','2026-06-05 15:40:49.812089+05:30') ON CONFLICT (user_id, role_id) DO NOTHING;
INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES ('8b3a473f-a550-4e38-834c-c3ffd7e31370','5a59123f-8a33-462c-a1bc-49efff8668f3','fdf3fc9a-2e7f-4b56-9987-553d0f0a69b7','2026-06-05 17:14:07.493871+05:30') ON CONFLICT (user_id, role_id) DO NOTHING;

COMMIT;
