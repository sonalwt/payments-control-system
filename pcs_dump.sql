--
-- PostgreSQL database dump
--

\restrict RKM04N9zCh3cU1CbKj8Y0Upe16v9hRaNcMdDaCIvqBJuv8cqZVSbr711AVx4Q2S

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
    CONSTRAINT chk_approval_matrix_tt_mode CHECK (((tt_mode)::text = ANY ((ARRAY['ONLINE_TT'::character varying, 'OFFLINE_TT'::character varying])::text[])))
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
    CONSTRAINT chk_balance_change_kind CHECK (((kind)::text = ANY ((ARRAY['PAYMENT_DEBIT'::character varying, 'RECEIPT_CREDIT'::character varying, 'STATEMENT_RESET'::character varying, 'MANUAL_OVERRIDE'::character varying, 'PAYMENT_CORRECTION'::character varying])::text[])))
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
    CONSTRAINT chk_statement_line_direction CHECK (((direction)::text = ANY ((ARRAY['DEBIT'::character varying, 'CREDIT'::character varying])::text[]))),
    CONSTRAINT chk_statement_line_match CHECK (((match_status)::text = ANY ((ARRAY['UNMATCHED'::character varying, 'CANDIDATE'::character varying, 'MATCHED'::character varying, 'EXCEPTION'::character varying])::text[])))
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
    CONSTRAINT chk_statement_ingestion_status CHECK (((ingestion_status)::text = ANY ((ARRAY['UPLOADED'::character varying, 'PARSED'::character varying, 'PARSE_FAILED'::character varying, 'MATCHED'::character varying])::text[])))
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
    CONSTRAINT chk_incoming_receipt_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'AWAITING_RECEIPT'::character varying, 'RECEIVED'::character varying, 'CANCELLED'::character varying])::text[])))
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
    CONSTRAINT chk_pr_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PENDING_APPROVAL'::character varying, 'TREASURY_MAKER'::character varying, 'TREASURY_CHECKER'::character varying, 'TREASURY_AUTHORISER'::character varying, 'COMPLETED'::character varying, 'REJECTED'::character varying, 'WITHDRAWN'::character varying, 'CANCELLED'::character varying, 'AWAITING_MAKER_PREP'::character varying, 'AWAITING_CHECKER_REVIEW'::character varying, 'AWAITING_HEAD_APPROVAL'::character varying])::text[])))
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
    CONSTRAINT chk_recon_exception_status CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'UNDER_INVESTIGATION'::character varying, 'RESOLVED_WITH_JUSTIFICATION'::character varying, 'CONFIRMED_EXCEPTION'::character varying])::text[]))),
    CONSTRAINT chk_recon_exception_type CHECK (((exception_type)::text = ANY ((ARRAY['UNAUTHORISED_PAYMENT'::character varying, 'UNIDENTIFIED_RECEIPT'::character varying])::text[])))
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
-- Data for Name: account_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_types (id, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
b5716a13-8937-498e-a904-9698c8d4454f	Fixed Deposit	t	2026-06-04 15:43:56.833437+05:30	2026-06-04 15:43:56.833437+05:30	\N	\N	\N
79e2741d-a8e8-46c4-b874-ddaf6cebdc2e	EEFC Account	t	2026-06-04 15:43:56.833437+05:30	2026-06-04 15:43:56.833437+05:30	\N	\N	\N
513eabff-b9a0-4f26-9053-345a6935b1d8	Savings Account	t	2026-06-04 15:43:56.833437+05:30	2026-06-04 15:43:56.833437+05:30	\N	\N	\N
8dbde40f-c755-4e27-8b41-3050c0f8e0af	Current Account	t	2026-06-04 15:43:56.833437+05:30	2026-06-04 15:43:56.833437+05:30	\N	\N	\N
200f7160-e4de-441d-baca-8b580808a34d	Overdraft	t	2026-06-04 15:43:56.833437+05:30	2026-06-04 15:43:56.833437+05:30	\N	\N	\N
5c41ed1e-f9e1-45ad-8bd1-789cba594cfb	Cash Credit	t	2026-06-04 15:43:56.833437+05:30	2026-06-04 15:43:56.833437+05:30	\N	\N	\N
\.


--
-- Data for Name: approval_matrices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_matrices (id, name, description, payment_type_id, currency_id, effective_from, effective_to, is_active, created_at, updated_at, deleted_at, created_by, updated_by, tt_mode, treasury_maker_role_id, treasury_checker_role_id, treasury_authoriser_role_id) FROM stdin;
3da82a62-abb0-43c5-be3c-b953e44a5306	Trade Supplier Payment — USD	rade Supplier Payment — USD	b2294dcc-742c-48f6-9190-0c0d756705c0	69d86cc6-7d2b-4977-b579-62dbcbe56760	2026-06-04	2026-06-30	t	2026-06-04 16:12:49.033104+05:30	2026-06-06 00:29:55.136215+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	\N	\N	\N
49a5464d-03e8-4579-a2d1-94116c588617	Smoke Matrix 0FEDAE	\N	b646f1be-4d33-4a27-8cad-23aef13f80ca	ff0ea523-3dd5-4256-be64-13b191fc043f	2026-01-01	\N	t	2026-06-08 02:34:22.855773+05:30	2026-06-08 02:44:45.185414+05:30	2026-06-08 02:44:45.185414+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
5c464c28-5a8e-471a-8a35-864bfb560dbc	CM Matrix A688BA	\N	f3ff3e18-5359-4ccd-85a7-af09b6ac7e41	ff0ea523-3dd5-4256-be64-13b191fc043f	2026-01-01	\N	t	2026-06-08 03:47:10.184764+05:30	2026-06-08 03:47:10.184764+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	\N	\N	0082be8d-052d-499a-94f6-2019d8dff9e7
da8ba145-1083-4a80-9109-3eb72718a48b	Vendor Payment — USD	\N	bdc51ca6-b206-4c5c-9203-11471ed81b9f	69d86cc6-7d2b-4977-b579-62dbcbe56760	2026-06-04	2026-06-30	t	2026-06-04 16:14:42.599394+05:30	2026-06-08 12:08:20.505248+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
44044b90-c7ec-48fe-b754-eba0686cc542	Test Merge Matrix	\N	1239481b-c30a-4843-b775-d02e2fdeda60	ff0ea523-3dd5-4256-be64-13b191fc043f	2026-06-08	\N	t	2026-06-08 14:59:31.456784+05:30	2026-06-08 14:59:33.732321+05:30	2026-06-08 14:59:33.732321+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	81c68ec5-f574-4031-b9dd-a93a42ef108d	81c68ec5-f574-4031-b9dd-a93a42ef108d	81c68ec5-f574-4031-b9dd-a93a42ef108d
71d4b189-7034-41e2-8d23-daca356dbfca	Reimbursements	\N	6d850ccc-6ac1-4015-b4ba-968422dc3417	69d86cc6-7d2b-4977-b579-62dbcbe56760	2026-06-08	2026-06-16	t	2026-06-08 15:17:27.969018+05:30	2026-06-08 15:17:27.969018+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
798524d7-72cc-4844-966f-dda467e4931c	Office and other utility payments	\N	9605ab99-8afa-48d5-984c-8ace3f06fbe7	69d86cc6-7d2b-4977-b579-62dbcbe56760	2026-06-08	\N	t	2026-06-08 16:45:43.781399+05:30	2026-06-08 16:45:43.781399+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
\.


--
-- Data for Name: approval_matrix_bands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_matrix_bands (id, matrix_id, sort_order, min_amount, max_amount, created_at) FROM stdin;
bb318e8d-74ef-427e-8326-f814d9392578	3da82a62-abb0-43c5-be3c-b953e44a5306	0	0.0000	100000.0000	2026-06-06 00:29:55.136215+05:30
959ab9df-394a-4e9f-838e-d491c8446cbc	3da82a62-abb0-43c5-be3c-b953e44a5306	1	100001.0000	500000.0000	2026-06-06 00:29:55.136215+05:30
9f1ef875-7ed9-4ad5-b339-90e7b1212f17	49a5464d-03e8-4579-a2d1-94116c588617	0	0.0000	\N	2026-06-08 02:34:22.855773+05:30
c4f73f49-be70-4fc0-92fe-7f977d382ec8	da8ba145-1083-4a80-9109-3eb72718a48b	0	0.0000	1000.0000	2026-06-08 12:08:40.193011+05:30
f1ac9e36-0761-4d40-9f4a-b99bfd407d6b	da8ba145-1083-4a80-9109-3eb72718a48b	1	1001.0000	25000.0000	2026-06-08 12:08:40.193011+05:30
aa73c83c-33a5-4526-9abe-3baa09cd03a2	44044b90-c7ec-48fe-b754-eba0686cc542	0	0.0000	\N	2026-06-08 14:59:31.456784+05:30
298b989f-7128-443c-8041-066788142f1c	71d4b189-7034-41e2-8d23-daca356dbfca	0	0.0000	\N	2026-06-08 16:18:25.433409+05:30
da133fc8-7bd3-4e55-b430-a3d683af0e08	798524d7-72cc-4844-966f-dda467e4931c	0	0.0000	10000.0000	2026-06-08 16:45:43.781399+05:30
3b7b9547-673e-4491-8abb-2275fcd3d975	798524d7-72cc-4844-966f-dda467e4931c	1	10001.0000	\N	2026-06-08 16:45:43.781399+05:30
\.


--
-- Data for Name: approval_matrix_steps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_matrix_steps (id, band_id, step_order, approver_type, approver_user_id, approver_role_id, is_optional, created_at) FROM stdin;
bb745066-f2a8-4740-b6a6-900e6458d106	bb318e8d-74ef-427e-8326-f814d9392578	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-06 00:29:55.136215+05:30
916087df-df3f-4121-ba34-31564b765e65	bb318e8d-74ef-427e-8326-f814d9392578	1	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	f	2026-06-06 00:29:55.136215+05:30
58299ffa-8275-486a-9c60-3d932ea06ed4	959ab9df-394a-4e9f-838e-d491c8446cbc	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-06 00:29:55.136215+05:30
9b910207-1574-4594-adad-34c484c4ede1	959ab9df-394a-4e9f-838e-d491c8446cbc	1	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	f	2026-06-06 00:29:55.136215+05:30
f8dfc561-9ad7-40e6-b449-befe1e2f24a2	9f1ef875-7ed9-4ad5-b339-90e7b1212f17	0	USER	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	f	2026-06-08 02:34:22.855773+05:30
f4078ba1-dfb9-47ba-bd4a-c3d0a51287cf	c4f73f49-be70-4fc0-92fe-7f977d382ec8	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-08 12:08:40.193011+05:30
64a83162-6ce6-4ea3-9807-359ba8fa6352	c4f73f49-be70-4fc0-92fe-7f977d382ec8	1	USER	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	\N	f	2026-06-08 12:08:40.193011+05:30
3331a236-3dac-4b7f-b810-6f3d1e9e36b0	f1ac9e36-0761-4d40-9f4a-b99bfd407d6b	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-08 12:08:40.193011+05:30
6a067583-a340-47bf-8c0d-7bc23829073d	f1ac9e36-0761-4d40-9f4a-b99bfd407d6b	1	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	f	2026-06-08 12:08:40.193011+05:30
7b3eeec8-202a-4ed4-94bf-697a447f2cbc	aa73c83c-33a5-4526-9abe-3baa09cd03a2	0	USER	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	\N	f	2026-06-08 14:59:31.456784+05:30
6a12faba-5d65-42bc-9047-6e814b535ef1	298b989f-7128-443c-8041-066788142f1c	0	USER	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	\N	f	2026-06-08 16:18:25.433409+05:30
21ce37c5-7e13-4d67-a0b1-75326298cf45	da133fc8-7bd3-4e55-b430-a3d683af0e08	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-08 16:45:43.781399+05:30
82b0c959-b358-4adb-ac0d-90b071531698	3b7b9547-673e-4491-8abb-2275fcd3d975	0	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	f	2026-06-08 16:45:43.781399+05:30
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, action, entity_type, entity_id, user_id, user_email, http_method, path, status_code, success, params, request_body, error_message, ip_address, user_agent, duration_ms, created_at) FROM stdin;
5f7e42eb-a13f-4736-8d15-b2208e35f3f3	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	771	2026-06-04 15:18:05.281719+05:30
8b4e0ed7-32d3-4863-9bc5-be9644a1a524	CREATE	Currencies	69d86cc6-7d2b-4977-b579-62dbcbe56760	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/currencies	201	t	\N	{"name": "US Dollar", "isActive": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	8	2026-06-04 15:21:57.010626+05:30
88da2792-0552-4994-af33-ba0d80945e99	CREATE	Currencies	3bfc821c-ff8e-463a-b20d-2fac66932aa2	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/currencies	201	t	\N	{"name": "Indian Rupee", "isActive": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	5	2026-06-04 15:22:10.892865+05:30
b2577f2b-6714-48bb-b4af-56cd5cfee6ed	CREATE	Currencies	aaeb6da9-336e-47f2-a034-c3944780f05c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/currencies	201	t	\N	{"name": "UAE Dirham", "isActive": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	6	2026-06-04 15:22:23.095767+05:30
db1b8c3c-3264-4f4e-89ca-6aaaafc2ba4a	CREATE	Currencies	5f5322a7-6bc1-4726-9796-9e610f766575	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/currencies	201	t	\N	{"name": "Singapore Dollar", "isActive": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	6	2026-06-04 15:22:41.156278+05:30
fc38cdbf-378b-4a0a-b7ec-18a16d42ca61	CREATE	Currencies	ff0ea523-3dd5-4256-be64-13b191fc043f	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/currencies	201	t	\N	{"name": "British Pound", "isActive": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	4	2026-06-04 15:22:50.648601+05:30
a1ec32e5-00a4-435a-afe3-c4792608bd6a	CREATE	Currencies	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/currencies	409	f	\N	{"name": "British Pound", "isActive": true}	Currency "British Pound" already exists	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-04 15:23:28.787338+05:30
8fb391a8-8317-4e81-97d0-80efde632cc6	CREATE	Currencies	1324a9b2-4915-4b98-b1f5-4077456addf8	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/currencies	201	t	\N	{"name": "Swiss Franc", "isActive": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	10	2026-06-04 15:25:15.016686+05:30
a7a83c3d-50a8-464e-bdc4-cbb62fc58546	CREATE	Countries	97cddc42-776c-4c99-89e8-5e374808b560	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/countries	201	t	\N	{"code": "IN", "isActive": true, "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "countryName": "India", "isSanctioned": false, "countryShortName": "IND"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	13	2026-06-04 15:25:49.263815+05:30
4e535a5d-8f51-41fa-b1f0-cd4b34bff976	CREATE	Roles	64424fa9-5141-49d7-84c8-f2b10feeec22	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/roles	201	t	\N	{"code": "OPS_TEAM", "name": "Ops Team ", "description": "Trade Payment request initiator/maker"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	42	2026-06-04 15:30:22.692547+05:30
b603ea2e-414f-4497-8b0c-a621c8be96f1	CREATE	Roles	81c68ec5-f574-4031-b9dd-a93a42ef108d	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/roles	201	t	\N	{"code": "ACCOUNTS_TEAM", "name": "Accounts  Team ", "description": "Trade payments checker"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	7	2026-06-04 15:31:12.820536+05:30
fd5e23b0-95b8-4b15-abc1-cc0e1295c7fc	CREATE	Roles	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/roles	201	t	\N	{"code": "APPROVER", "name": "Approver", "description": "APPROVER"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	11	2026-06-04 15:31:41.112406+05:30
483933c7-5e1a-4a1f-8555-482abca02e62	CREATE	Counterparties	f074196f-049f-4deb-a331-aee61df80d59	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/counterparties	201	t	\N	{"code": "CP-0001", "name": " Acme Supplies Pvt Ltd", "role": "VENDOR", "kycDone": true, "isActive": true, "addresses": [], "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "legalName": " Acme Supplies Pvt Ltd", "taxIdentifiers": [], "primaryContactName": "Sonal Tamboli", "primaryContactEmail": "sonal@firsteconomy.com", "primaryContactPhone": "9876543210"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	14	2026-06-04 15:48:45.474094+05:30
d11ead07-03d2-4750-999b-f3a5bdf49d33	CREATE	BankAccounts	2d19213d-76e1-4683-8c62-a762ae3c7e3c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/bank-accounts	201	t	\N	{"bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "isActive": true, "branchCode": "HDFC0007811", "branchName": "Mumbai", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "bankNickname": " HDFC – India Ops", "accountNumber": "50100123456789", "accountTypeId": "8dbde40f-c755-4e27-8b41-3050c0f8e0af", "minimumBalance": 100000, "openingBalance": 5000000, "remainingBalance": 0, "isChairmanDesignated": false}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	17	2026-06-04 15:52:23.056544+05:30
a3be913a-02c0-4646-a080-673a281793c7	CREATE	PaymentTypes	b2294dcc-742c-48f6-9190-0c0d756705c0	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "TRADE_SUPPLIER_PAYMENT", "name": "Trade Supplier Payment", "isActive": true, "direction": "OUTGOING", "description": "Trade Supplier\\nPayment", "isBatchBased": false, "makerRoleIds": ["64424fa9-5141-49d7-84c8-f2b10feeec22"], "checkerRoleId": "81c68ec5-f574-4031-b9dd-a93a42ef108d", "legalEntityId": "3c7059a2-ba71-47e4-a7e1-2f6e5daf707f", "isConfidential": false, "paymentCategoryId": "d23f70da-74f5-407d-a239-74e8bbc7776f", "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	16	2026-06-04 16:02:21.903764+05:30
6361711e-1b97-441b-ba80-c54bc2f1f5ae	CREATE	Roles	9297ad11-6e3c-4215-ab53-7c09547baf1b	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/roles	201	t	\N	{"code": "NT_VENDOR_PAYMENT_TEAM", "name": "Non Trade  - vendor Payment", "description": "Non Trade  - vendor Payment"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	9	2026-06-04 16:07:40.969568+05:30
dabe27c9-5db2-4156-9331-30b8d33c15dd	CREATE	UserRoles	02d953f9-ffa4-4710-a7a9-12c8c843c39f	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/user-roles	201	t	\N	{"roleId": "9297ad11-6e3c-4215-ab53-7c09547baf1b", "userId": "666c0362-0318-45f1-a2f8-34c5e1970d94"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	9	2026-06-04 16:09:10.265399+05:30
3c63ae0f-2b8a-4e70-bc6c-836c7de264a8	APPROVE	PaymentRequests	66e48633-9bf7-49ec-bfcf-3d030b2a1377	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/payment-requests/66e48633-9bf7-49ec-bfcf-3d030b2a1377/approve	201	t	{"id": "66e48633-9bf7-49ec-bfcf-3d030b2a1377"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	21	2026-06-04 16:26:46.567786+05:30
ea6b5982-2737-4b9c-a953-edf9d52d8fed	CREATE	PaymentTypes	bdc51ca6-b206-4c5c-9203-11471ed81b9f	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "VENDOR_PAYMENT", "name": "Vendor payments", "isActive": true, "direction": "OUTGOING", "description": "", "isBatchBased": false, "makerRoleIds": ["9297ad11-6e3c-4215-ab53-7c09547baf1b"], "legalEntityId": "a7010e74-1a65-445d-9227-1967ebd9139f", "isConfidential": false, "paymentCategoryId": "80a96bf9-5c86-4d1e-9cce-e082ffa21fa8", "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	16	2026-06-04 16:10:28.645075+05:30
44c397b6-8203-4220-8eef-c47c39d68fe8	CREATE	ApprovalMatrices	3da82a62-abb0-43c5-be3c-b953e44a5306	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "Trade Supplier Payment — USD", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": 100000, "minAmount": 0}, {"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": 500000, "minAmount": 100001}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "description": "rade Supplier Payment — USD", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-04", "paymentTypeId": "b2294dcc-742c-48f6-9190-0c0d756705c0"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	28	2026-06-04 16:12:49.055365+05:30
d2f1bf7e-bf8a-459f-9fff-cc5ea4bb3085	CREATE	ApprovalMatrices	da8ba145-1083-4a80-9109-3eb72718a48b	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "Vendor Payment — USD", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": 1000, "minAmount": 0}, {"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": 25000, "minAmount": 1001}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-04", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	24	2026-06-04 16:14:42.620428+05:30
bf363e2e-3837-4ab5-a0e8-10e97a844071	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	764	2026-06-04 16:21:44.701988+05:30
20e6300e-7c49-4873-b2d0-3e1f60e8d551	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	759	2026-06-04 16:22:02.206449+05:30
184081fc-d056-4da1-a7e9-42fe835b11e2	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	745	2026-06-04 16:22:30.145568+05:30
0b37156c-0a14-4f00-82a3-8bfe6b37780a	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	10	2026-06-04 16:25:37.93939+05:30
316e1dc1-b046-42c6-b2eb-4e76bcb32d97	CREATE	PaymentRequests	66e48633-9bf7-49ec-bfcf-3d030b2a1377	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "10000", "dueDate": "2026-06-03", "documents": [{"fileUrl": "/uploads/1780570537932-881796.pdf", "fileName": "Payments Authority Matrix - Radiant (1) (1).pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-2203", "paymentTypeId": "b2294dcc-742c-48f6-9190-0c0d756705c0", "counterpartyId": "f074196f-049f-4deb-a331-aee61df80d59", "sourceAccountId": "2d19213d-76e1-4683-8c62-a762ae3c7e3c", "purposeDescription": "testing", "beneficiaryAccountId": "dc9edb0c-1c51-4633-9abc-d0e613f6cc04"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	47	2026-06-04 16:25:39.275372+05:30
bd0bf0c7-3d97-4ed6-9fcd-97e252c3cb60	SUBMIT	PaymentRequests	66e48633-9bf7-49ec-bfcf-3d030b2a1377	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/66e48633-9bf7-49ec-bfcf-3d030b2a1377/submit	201	t	{"id": "66e48633-9bf7-49ec-bfcf-3d030b2a1377"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	36	2026-06-04 16:25:44.715352+05:30
74467689-c7b0-469b-b159-f8cf995d78e8	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	691	2026-06-04 16:25:54.71685+05:30
685c9a94-2fc4-4e13-9c64-80121078ac0a	APPROVE	PaymentRequests	66e48633-9bf7-49ec-bfcf-3d030b2a1377	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/66e48633-9bf7-49ec-bfcf-3d030b2a1377/approve	201	t	{"id": "66e48633-9bf7-49ec-bfcf-3d030b2a1377"}	{"comments": "Testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	49	2026-06-04 16:26:08.955703+05:30
89ad430c-5d95-4120-b535-0fcea64d82a7	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	711	2026-06-04 16:26:18.901971+05:30
415c4b1c-716b-48c5-a770-cc9c211b5bfd	APPROVE	PaymentRequests	66e48633-9bf7-49ec-bfcf-3d030b2a1377	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/66e48633-9bf7-49ec-bfcf-3d030b2a1377/approve	201	t	{"id": "66e48633-9bf7-49ec-bfcf-3d030b2a1377"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	28	2026-06-04 16:26:27.592906+05:30
3e53711e-7508-4dc6-82f0-63bf173a026f	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	715	2026-06-04 16:26:37.971561+05:30
4f354935-d1ec-42f8-900d-0be19f7df44e	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	740	2026-06-04 16:26:54.829057+05:30
8acccf33-129b-463d-a5fe-b2ee463d37c4	LOGIN	Auth	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abirami@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	679	2026-06-04 16:28:38.265342+05:30
cfbe0c97-87d7-489d-aeee-aa3ea9034281	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	4	2026-06-04 16:28:57.10771+05:30
357287da-57a1-4699-91d5-96704acc2924	TREASURY_SUBMIT	PaymentRequests	66e48633-9bf7-49ec-bfcf-3d030b2a1377	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/payment-requests/66e48633-9bf7-49ec-bfcf-3d030b2a1377/treasury/submit	201	t	{"id": "66e48633-9bf7-49ec-bfcf-3d030b2a1377"}	{"swiftCopyUrl": "/uploads/1780570737103-344375.pdf", "referenceNumber": "FT123REF988"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	46	2026-06-04 16:28:58.435831+05:30
9df2c7a8-e5a1-48bf-a7c1-741176f3c8b6	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	761	2026-06-04 16:29:38.54437+05:30
2b0b17c6-fc93-4a1f-a594-64978bb3ae88	TREASURY_CHECK	PaymentRequests	66e48633-9bf7-49ec-bfcf-3d030b2a1377	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/payment-requests/66e48633-9bf7-49ec-bfcf-3d030b2a1377/treasury/check	201	t	{"id": "66e48633-9bf7-49ec-bfcf-3d030b2a1377"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	20	2026-06-04 16:29:43.872951+05:30
cf5b6ca3-2104-4fb9-a4a6-00278ab408bd	LOGIN	Auth	964da820-0264-48cf-8d22-971f8843741d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "anushya@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	741	2026-06-04 16:30:19.158299+05:30
79038d32-d8dc-4efc-876f-537bf0de8637	TREASURY_COMPLETE	PaymentRequests	66e48633-9bf7-49ec-bfcf-3d030b2a1377	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/payment-requests/66e48633-9bf7-49ec-bfcf-3d030b2a1377/treasury/complete	201	t	{"id": "66e48633-9bf7-49ec-bfcf-3d030b2a1377"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	33	2026-06-04 16:30:27.088986+05:30
f6ed3cca-1167-49a8-ba58-3071f6b28a83	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	811	2026-06-04 16:32:35.872916+05:30
a90c2092-c1a5-458b-b476-86c892e373b0	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	6	2026-06-04 16:34:12.645133+05:30
828e7cbc-44c5-4979-8c38-084cc094f009	CREATE	PaymentRequests	2958a789-38b2-4d88-aa57-11c679e40a7d	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "500", "documents": [{"fileUrl": "/uploads/1780571052640-58786.pdf", "fileName": "Payments Authority Matrix - Radiant (1) (1).pdf", "documentCode": "invoice", "documentLabel": "INVOICE"}], "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-000076", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f", "counterpartyId": "9460c88b-b10b-465a-bc87-3d8613469184", "sourceAccountId": "8d7ca822-e714-4838-af9f-f59aa98a6e08", "purposeDescription": "testing", "beneficiaryAccountId": "d297dfdd-cecb-4f2f-8c61-114d23490d78"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	36	2026-06-04 16:34:13.769048+05:30
62076783-9897-4965-9d9e-df22074f245e	UPDATE	PaymentRequests	2958a789-38b2-4d88-aa57-11c679e40a7d	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	PUT	/api/v1/payment-requests/2958a789-38b2-4d88-aa57-11c679e40a7d	200	t	{"id": "2958a789-38b2-4d88-aa57-11c679e40a7d"}	{"amount": "500.0000", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-000076", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f", "counterpartyId": "9460c88b-b10b-465a-bc87-3d8613469184", "sourceAccountId": "8d7ca822-e714-4838-af9f-f59aa98a6e08", "purposeDescription": "testing", "beneficiaryAccountId": "d297dfdd-cecb-4f2f-8c61-114d23490d78"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	24	2026-06-04 16:34:22.019055+05:30
3152403a-9e84-457e-9842-7905170b0cb3	SUBMIT	PaymentRequests	2958a789-38b2-4d88-aa57-11c679e40a7d	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/2958a789-38b2-4d88-aa57-11c679e40a7d/submit	201	t	{"id": "2958a789-38b2-4d88-aa57-11c679e40a7d"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	33	2026-06-04 16:34:24.088187+05:30
986db56c-1fe5-4ec4-afd8-b3aa23396f0d	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	632	2026-06-04 17:11:42.538195+05:30
926fae38-7a57-48c1-b866-41f5266f53b2	APPROVE	PaymentRequests	2958a789-38b2-4d88-aa57-11c679e40a7d	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/2958a789-38b2-4d88-aa57-11c679e40a7d/approve	201	t	{"id": "2958a789-38b2-4d88-aa57-11c679e40a7d"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	76	2026-06-04 17:11:50.388922+05:30
c4ba47b5-a045-42e6-8166-b31af0ad69de	LOGIN	Auth	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ali@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	551	2026-06-04 17:11:57.576673+05:30
35a948ae-7b8c-40b5-940f-c10be3900879	APPROVE	PaymentRequests	2958a789-38b2-4d88-aa57-11c679e40a7d	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	POST	/api/v1/payment-requests/2958a789-38b2-4d88-aa57-11c679e40a7d/approve	201	t	{"id": "2958a789-38b2-4d88-aa57-11c679e40a7d"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	28	2026-06-04 17:12:05.051842+05:30
5e6bba2e-0e7e-4cb8-9905-42028fb2f8c1	LOGIN	Auth	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abirami@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	570	2026-06-04 17:15:43.015313+05:30
8d557018-39ca-4625-8c85-7219a7221e26	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	29	2026-06-04 17:16:21.158303+05:30
4df9796e-330a-4668-a789-e174e82b910b	TREASURY_SUBMIT	PaymentRequests	2958a789-38b2-4d88-aa57-11c679e40a7d	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/payment-requests/2958a789-38b2-4d88-aa57-11c679e40a7d/treasury/submit	201	t	{"id": "2958a789-38b2-4d88-aa57-11c679e40a7d"}	{"swiftCopyUrl": "/uploads/1780573581126-273119.pdf", "referenceNumber": "Ft12232234SWo"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	81	2026-06-04 17:16:25.105606+05:30
69241fc3-0626-4033-b176-8f97b350c87b	LOGIN	Auth	\N	\N	krish@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krish@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	73	2026-06-04 17:16:48.117949+05:30
64beb60a-48a4-437f-aef3-bb9d292cd91c	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	524	2026-06-04 17:16:54.263566+05:30
c08963fa-12ef-4d12-9af3-a49b31b9b59b	TREASURY_CHECK	PaymentRequests	2958a789-38b2-4d88-aa57-11c679e40a7d	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/payment-requests/2958a789-38b2-4d88-aa57-11c679e40a7d/treasury/check	201	t	{"id": "2958a789-38b2-4d88-aa57-11c679e40a7d"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	45	2026-06-04 17:17:06.821632+05:30
fe768aa0-e547-4f8a-892d-e27ddcae21ad	LOGIN	Auth	964da820-0264-48cf-8d22-971f8843741d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "anushya@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	642	2026-06-04 17:17:45.623367+05:30
6fbd0b78-af9d-4a07-ad4a-4eeacbb066b1	TREASURY_COMPLETE	PaymentRequests	2958a789-38b2-4d88-aa57-11c679e40a7d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/payment-requests/2958a789-38b2-4d88-aa57-11c679e40a7d/treasury/complete	201	t	{"id": "2958a789-38b2-4d88-aa57-11c679e40a7d"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	129	2026-06-04 17:18:04.938574+05:30
76ecfcd8-2195-4b64-a27f-aaadece66a42	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	951	2026-06-04 17:37:23.178588+05:30
415001b2-818d-403c-b039-f6df9ea6ee48	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	217	2026-06-05 17:35:50.488177+05:30
fc400ba6-fd7a-462a-ae94-fc763620370e	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	369	2026-06-05 17:36:04.646592+05:30
c5b4242a-a0b8-43a5-bf43-03718b12e659	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	39	2026-06-05 17:37:09.251672+05:30
ffd9449c-3b0a-4295-a0d9-c49d72810fe3	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	1	2026-06-05 17:37:10.577825+05:30
88284328-a9d9-4c93-823f-b6286843735d	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	422	2026-06-05 17:37:23.578722+05:30
d7850fdd-e572-4c93-8e74-e189ea5f2fb9	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	34	2026-06-05 17:41:58.066121+05:30
437dd58f-bc0e-4db8-96d8-fce244d239cb	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	369	2026-06-05 17:42:08.049575+05:30
bcb6f8e1-483f-4c6b-8159-1bb454f9f251	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	147	2026-06-05 17:42:24.466768+05:30
8fccb10b-8066-447a-8e9d-0fc2a7996d0a	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 17:42:31.068128+05:30
dee17591-e2e0-4f32-aec9-40871caafea1	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3	2026-06-05 17:42:33.747421+05:30
7fa97ff3-7853-4456-b2d0-8d9fc00d7045	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3	2026-06-05 17:42:37.266601+05:30
d7c76a96-dd5a-41ff-b02f-3feda79d2f2b	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 17:42:38.310627+05:30
3be3dc52-dc87-40c9-a31f-0ee8c3b57c52	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 17:42:38.522559+05:30
b7f8c13a-ab5f-4540-97f3-9e153fbd3612	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 17:42:38.723644+05:30
dac339f0-a877-4cfe-9fba-2a3f921b06e9	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 17:42:38.928375+05:30
61176942-6098-46fb-876c-be1e2db6f502	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3	2026-06-05 17:42:39.134672+05:30
a26140e4-acca-47f6-a21e-2fcf1e0166fb	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 17:42:39.320975+05:30
42ea1e3e-d17f-45e6-9ddd-589e5589f6f8	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 17:42:39.510304+05:30
5ad300d1-b818-4cd6-9559-b840db13002e	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 17:42:39.720043+05:30
36561909-06c8-4915-9585-bbe4de4baac6	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	365	2026-06-05 17:42:50.712197+05:30
c64b3d4e-cd10-4805-b54b-a4815240f502	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	393	2026-06-05 17:44:27.852628+05:30
2e4e2326-3dde-4104-8ce5-9bfad9a52bbe	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	500	f	\N	\N	Failed to upload file to S3: No value provided for input HTTP label: Bucket.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	32	2026-06-05 17:45:13.555839+05:30
575d7fa2-28b5-4452-a386-a2446b4e4e0f	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	500	f	\N	\N	Failed to upload file to S3: No value provided for input HTTP label: Bucket.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	6	2026-06-05 17:52:31.327465+05:30
e9e4feab-7064-42c7-915a-3ecffcbce06b	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	500	f	\N	\N	Failed to upload file to S3: No value provided for input HTTP label: Bucket.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	5	2026-06-05 17:53:15.297623+05:30
38df410f-5bea-4ef2-96b8-c0e92c62dee1	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	241	2026-06-05 17:55:01.034196+05:30
a54e9277-c888-4f89-a102-83e2a54d2f56	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	218	2026-06-05 17:56:30.594841+05:30
ba08b473-f3d3-4a59-a31f-a5cb44a002cc	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	209	2026-06-05 17:57:20.751434+05:30
edec657b-b6b3-4ae2-96e2-f85aaa995100	CREATE	PaymentRequests	29ec674f-6fcc-4401-86dd-e0d71c9f73f0	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "1000", "dueDate": "2026-06-11", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780662440553-436690.pdf", "fileName": "Payments Authority Matrix - Radiant (1) (1).pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-2203", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f", "counterpartyId": "9460c88b-b10b-465a-bc87-3d8613469184", "sourceAccountId": "2d19213d-76e1-4683-8c62-a762ae3c7e3c", "purposeDescription": "testing", "beneficiaryAccountId": "d297dfdd-cecb-4f2f-8c61-114d23490d78"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	98	2026-06-05 17:57:28.370336+05:30
d59beaf4-86da-4408-97f6-5a84de585808	SUBMIT	PaymentRequests	29ec674f-6fcc-4401-86dd-e0d71c9f73f0	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/29ec674f-6fcc-4401-86dd-e0d71c9f73f0/submit	201	t	{"id": "29ec674f-6fcc-4401-86dd-e0d71c9f73f0"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	73	2026-06-05 17:57:32.283615+05:30
eb428be9-f214-42e7-9aeb-c7155cf9014d	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	381	2026-06-05 17:58:08.20871+05:30
2a95b680-b73e-46f4-b122-23d6558e3ee2	APPROVE	PaymentRequests	29ec674f-6fcc-4401-86dd-e0d71c9f73f0	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/29ec674f-6fcc-4401-86dd-e0d71c9f73f0/approve	201	t	{"id": "29ec674f-6fcc-4401-86dd-e0d71c9f73f0"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	36	2026-06-05 17:58:17.239217+05:30
66fa17cc-d9c5-47e8-aa08-5bafb87cbd71	LOGIN	Auth	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ali@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	353	2026-06-05 17:58:26.10014+05:30
3e13fcda-f962-4537-9405-d079f849d0d0	REJECT	PaymentRequests	29ec674f-6fcc-4401-86dd-e0d71c9f73f0	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	POST	/api/v1/payment-requests/29ec674f-6fcc-4401-86dd-e0d71c9f73f0/reject	201	t	{"id": "29ec674f-6fcc-4401-86dd-e0d71c9f73f0"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	43	2026-06-05 17:58:33.900182+05:30
18fae761-3aba-4aab-81a7-083b826a3333	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	50	2026-06-05 17:59:27.67081+05:30
30088fbe-80f0-42e3-9f80-67a3599d415f	LOGIN	Auth	\N	\N	asmita@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "asmita@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3	2026-06-05 17:59:29.605055+05:30
eddad5a2-b716-40d3-a9fa-b2b62b456760	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	366	2026-06-05 17:59:35.160196+05:30
d3274c74-6e53-490f-a734-0a812509fa88	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	196	2026-06-05 18:00:09.50658+05:30
5cfb8a36-0c8d-4899-be97-3023ace9b883	UPDATE	ApprovalMatrices	3da82a62-abb0-43c5-be3c-b953e44a5306	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/3da82a62-abb0-43c5-be3c-b953e44a5306	200	t	{"id": "3da82a62-abb0-43c5-be3c-b953e44a5306"}	{"treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	80	2026-06-06 00:19:30.06877+05:30
dd082dd7-fec8-4d2c-bb6e-6c15d1800123	CREATE	PaymentTypes	e4e97ac2-e9ae-4609-8dae-cbe6ba15fe48	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "SMOKE_CONF3_DDC528", "name": "Smoke Conf3 DDC528", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": true}	\N	::1	curl/8.18.0	15	2026-06-08 02:48:55.095428+05:30
0266fe38-13ad-4048-9f2f-3e70efc1f04e	CREATE	PaymentRequests	c4584104-471b-45d0-a323-d44589dc6514	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "1000", "dueDate": "2026-06-10", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780662609314-110177.pdf", "fileName": "Payments Authority Matrix - Radiant (1) (1).pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-2203", "paymentTypeId": "b2294dcc-742c-48f6-9190-0c0d756705c0", "counterpartyId": "f074196f-049f-4deb-a331-aee61df80d59", "sourceAccountId": "2d19213d-76e1-4683-8c62-a762ae3c7e3c", "purposeDescription": "testing", "beneficiaryAccountId": "dc9edb0c-1c51-4633-9abc-d0e613f6cc04"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	92	2026-06-05 18:00:10.958441+05:30
b78f9b20-7c4f-42dd-ac1d-c76a656f606f	SUBMIT	PaymentRequests	c4584104-471b-45d0-a323-d44589dc6514	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/c4584104-471b-45d0-a323-d44589dc6514/submit	201	t	{"id": "c4584104-471b-45d0-a323-d44589dc6514"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	32	2026-06-05 18:00:14.282536+05:30
4b488de8-a3a3-44a3-8fba-6cd69bf4bdb6	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:23.891842+05:30
b799a8b8-c597-4e01-9408-6d886ac4ba75	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3	2026-06-05 18:00:25.551605+05:30
29c6e8c3-7e1c-4af8-a910-bc48c83a48a3	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	352	2026-06-05 18:00:35.558032+05:30
266f1acd-b49f-4fc4-8b81-5a30ccb2d5e6	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:44.70878+05:30
e47b8e0a-8a1a-4992-949a-c2006e19fff0	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:47.557529+05:30
2ab58ee7-6b8e-495c-8116-d6b520a52c79	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:48.567671+05:30
17721696-0cb7-4964-9fb1-065f7d2ed5c0	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	1	2026-06-05 18:00:49.213367+05:30
ab803ac6-98a3-442d-8457-327fc068c466	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:49.423055+05:30
98ae1adf-e9fe-494d-bf0c-e58abda2a93b	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:49.616876+05:30
e6ed6ba2-6e77-4463-8b27-e39c1443700c	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:49.79996+05:30
faa177db-466e-4496-a18b-cd75a32f22d9	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:49.995808+05:30
04b67f58-8acf-435b-aba4-15788322e9d3	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:50.189697+05:30
fe09a3c1-fad6-4fc1-9806-8a104932455e	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:50.395618+05:30
818251f2-46f2-4156-a2f0-0eca8413483d	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3	2026-06-05 18:00:57.690953+05:30
0122b0f9-a95b-4b27-9456-a6d1d24649a6	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-05 18:00:58.687998+05:30
45dae63b-4104-491b-afdb-7aa10d0f303d	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3	2026-06-05 18:01:02.988926+05:30
316a50b9-406e-4d8f-b95f-f9572f43827c	LOGIN	Auth	\N	\N	x	POST	/api/v1/auth/login	400	f	\N	{"email": "x", "password": "[REDACTED]"}	Bad Request Exception	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	2	2026-06-05 23:52:35.925772+05:30
d7a8f86f-6e49-4a39-817b-0a157b26f9e4	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	737	2026-06-05 23:56:52.975347+05:30
93bbe837-e3fb-491a-8420-671ff3421a37	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	369	2026-06-06 00:18:57.899282+05:30
d37c9bd4-6788-43c4-8142-935bb4fde868	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	373	2026-06-06 00:19:29.759184+05:30
f9c734f1-155c-4a0e-a31e-882d7a49f694	UPDATE	ApprovalMatrices	3da82a62-abb0-43c5-be3c-b953e44a5306	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/3da82a62-abb0-43c5-be3c-b953e44a5306	200	t	{"id": "3da82a62-abb0-43c5-be3c-b953e44a5306"}	{"name": "Trade Supplier Payment — USD", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": 100000, "minAmount": 0}, {"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": 500000, "minAmount": 100001}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "description": "rade Supplier Payment — USD", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-04", "paymentTypeId": "b2294dcc-742c-48f6-9190-0c0d756705c0", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	104	2026-06-06 00:29:55.203775+05:30
4b478e06-8d0a-419b-8807-7a838442ba5a	UPDATE	ApprovalMatrices	da8ba145-1083-4a80-9109-3eb72718a48b	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/da8ba145-1083-4a80-9109-3eb72718a48b	200	t	{"id": "da8ba145-1083-4a80-9109-3eb72718a48b"}	{"name": "Vendor Payment — USD", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": 1000, "minAmount": 0}, {"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": 25000, "minAmount": 1001}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-04", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	130	2026-06-06 00:30:26.906733+05:30
5181bc52-b146-4eb9-b424-8f187681ca70	LOGIN	Auth	\N	\N	x	POST	/api/v1/auth/login	400	f	\N	{"email": "x", "password": "[REDACTED]"}	Bad Request Exception	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	5	2026-06-06 00:44:03.844895+05:30
eeb41f78-d68b-4617-8c37-5ab235ccbc8b	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	813	2026-06-08 00:17:03.205059+05:30
8881ab56-a210-4f94-9c25-9c06ba9be5c1	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	471	2026-06-08 01:48:23.396552+05:30
28de2e76-3157-42c8-b157-d523105385f3	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	397	2026-06-08 01:48:31.722994+05:30
7ebe1f01-4236-41ec-86a4-0feb8a5333e3	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	577	2026-06-08 01:49:37.001206+05:30
abb6ad93-8d91-4ffc-b9bd-c86ccfa19127	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	410	2026-06-08 02:33:35.209674+05:30
be4041f9-4bbe-44b0-a1c3-5fb7a1afb283	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Python-urllib/3.14	440	2026-06-08 02:34:22.355459+05:30
3f875776-1917-4ede-ba0b-e80a7804e123	CREATE	PaymentTypes	f017e554-5e03-42b3-9320-d4a32131bbd7	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "SMOKE_CONF_0FEDAE", "name": "Smoke Confidential 0FEDAE", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": true, "requiresApprovalChain": true}	\N	::1	Python-urllib/3.14	49	2026-06-08 02:34:22.51759+05:30
ef1513af-b7d1-44de-8c32-63320c870632	CREATE	PaymentRequests	5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": 5000, "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "paymentTypeId": "f017e554-5e03-42b3-9320-d4a32131bbd7", "purposeDescription": "smoke confidential"}	\N	::1	Python-urllib/3.14	117	2026-06-08 02:34:22.709902+05:30
6e2dc0d2-7d1f-48b1-a3fa-1e787c7346d2	SUBMIT	PaymentRequests	5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5/submit	500	f	{"id": "5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5"}	\N	new row for relation "payment_requests" violates check constraint "chk_pr_status"	::1	Python-urllib/3.14	43	2026-06-08 02:34:22.777095+05:30
319bc77c-e46e-4c09-a1b4-6b8228b7e9a8	TREASURY_COMPLETE	PaymentRequests	5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5/treasury/complete	400	f	{"id": "5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5"}	\N	Cannot complete in status DRAFT	::1	Python-urllib/3.14	5	2026-06-08 02:34:22.799513+05:30
b6c90001-16a5-4656-8ff1-97cd05457c96	TREASURY_COMPLETE	PaymentRequests	5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5/treasury/complete	400	f	{"id": "5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5"}	{"swiftCopyUrl": "/uploads/smoke-mt103.pdf", "referenceNumber": "FT-SMOKE-001"}	Cannot complete in status DRAFT	::1	Python-urllib/3.14	2	2026-06-08 02:34:22.821656+05:30
0a47255c-34d6-4bde-8b1a-abb2bd33fc60	CREATE	ApprovalMatrices	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	400	f	\N	{"name": "Smoke Matrix NoRoles 0FEDAE", "bands": [{"steps": [{"approverType": "USER", "approverUserId": "5a59123f-8a33-462c-a1bc-49efff8668f3"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "effectiveFrom": "2026-01-01", "paymentTypeId": "b646f1be-4d33-4a27-8cad-23aef13f80ca"}	Bad Request Exception	::1	Python-urllib/3.14	2	2026-06-08 02:34:22.834723+05:30
37d2a632-710c-4445-bd0c-8f6b8f85e562	DELETE	ApprovalMatrices	49a5464d-03e8-4579-a2d1-94116c588617	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/approval-matrices/49a5464d-03e8-4579-a2d1-94116c588617	500	f	{"id": "49a5464d-03e8-4579-a2d1-94116c588617"}	\N	Entity "ApprovalMatrixBand" does not have delete date columns.	::1	Python-urllib/3.14	38	2026-06-08 02:34:22.941871+05:30
58cd3367-d765-413f-890b-bf3e3c4df962	CREATE	ApprovalMatrices	\N	\N	\N	POST	/api/v1/approval-matrices	400	f	\N	\N	Bad control character in string literal in JSON at position 368 (line 1 column 369)	::1	curl/8.18.0	\N	2026-06-08 02:48:55.257211+05:30
da4e04b8-7bba-4874-a78e-8297694525cb	CREATE	ApprovalMatrices	49a5464d-03e8-4579-a2d1-94116c588617	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "Smoke Matrix 0FEDAE", "bands": [{"steps": [{"approverType": "USER", "approverUserId": "5a59123f-8a33-462c-a1bc-49efff8668f3"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "effectiveFrom": "2026-01-01", "paymentTypeId": "b646f1be-4d33-4a27-8cad-23aef13f80ca", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Python-urllib/3.14	39	2026-06-08 02:34:22.886859+05:30
39fcd243-6b78-4203-b232-4d239557aa2d	DELETE	PaymentTypes	f017e554-5e03-42b3-9320-d4a32131bbd7	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/f017e554-5e03-42b3-9320-d4a32131bbd7	204	t	{"id": "f017e554-5e03-42b3-9320-d4a32131bbd7"}	\N	\N	::1	Python-urllib/3.14	23	2026-06-08 02:34:22.977456+05:30
daf431ad-05f5-48c4-abc0-80a6cb6cfe24	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Python-urllib/3.14	423	2026-06-08 02:42:50.701121+05:30
b063ca0b-58af-43ea-8872-4ed2be7a2f11	CREATE	PaymentTypes	fcaaaee3-682e-4b0d-a07e-582387d75971	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "SMOKE_CONF_8DE24A", "name": "Smoke Confidential 8DE24A", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": true, "requiresApprovalChain": true}	\N	::1	Python-urllib/3.14	17	2026-06-08 02:42:50.815249+05:30
b785a9e4-725b-4ba3-aeec-6704704b45b4	CREATE	PaymentRequests	1ea399a1-960b-48c9-8ad1-02a30134292c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": 5000, "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "paymentTypeId": "fcaaaee3-682e-4b0d-a07e-582387d75971", "purposeDescription": "smoke confidential"}	\N	::1	Python-urllib/3.14	132	2026-06-08 02:42:50.967062+05:30
0c30ddc8-6814-422b-af6c-578d661d18af	SUBMIT	PaymentRequests	1ea399a1-960b-48c9-8ad1-02a30134292c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/1ea399a1-960b-48c9-8ad1-02a30134292c/submit	201	t	{"id": "1ea399a1-960b-48c9-8ad1-02a30134292c"}	\N	\N	::1	Python-urllib/3.14	87	2026-06-08 02:42:51.070265+05:30
126cab8e-552f-4f20-a3a8-1e12e1cd3e13	TREASURY_COMPLETE	PaymentRequests	1ea399a1-960b-48c9-8ad1-02a30134292c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/1ea399a1-960b-48c9-8ad1-02a30134292c/treasury/complete	400	f	{"id": "1ea399a1-960b-48c9-8ad1-02a30134292c"}	\N	Reference number and SWIFT/MT103 copy are required to complete a confidential payment.	::1	Python-urllib/3.14	5	2026-06-08 02:42:51.089831+05:30
e954043a-d242-4912-ada8-aaa75d543185	TREASURY_COMPLETE	PaymentRequests	1ea399a1-960b-48c9-8ad1-02a30134292c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/1ea399a1-960b-48c9-8ad1-02a30134292c/treasury/complete	201	t	{"id": "1ea399a1-960b-48c9-8ad1-02a30134292c"}	{"swiftCopyUrl": "/uploads/smoke-mt103.pdf", "referenceNumber": "FT-SMOKE-001"}	\N	::1	Python-urllib/3.14	30	2026-06-08 02:42:51.13284+05:30
6a22afba-79c3-42d0-ba5d-3c0332d3b6ac	DELETE	PaymentTypes	fcaaaee3-682e-4b0d-a07e-582387d75971	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/fcaaaee3-682e-4b0d-a07e-582387d75971	204	t	{"id": "fcaaaee3-682e-4b0d-a07e-582387d75971"}	\N	\N	::1	Python-urllib/3.14	25	2026-06-08 02:42:51.171037+05:30
303cc0aa-efa6-4d67-9c97-7e32ec4b8b99	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	1015	2026-06-08 02:44:44.604944+05:30
18f3370d-626e-4982-a2c9-b3a8f10e2149	DELETE	ApprovalMatrices	49a5464d-03e8-4579-a2d1-94116c588617	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/approval-matrices/49a5464d-03e8-4579-a2d1-94116c588617	204	t	{"id": "49a5464d-03e8-4579-a2d1-94116c588617"}	\N	\N	::1	curl/8.18.0	36	2026-06-08 02:44:45.189517+05:30
9e2bcd1b-7346-4c2c-afca-c137269d59eb	UPDATE	PaymentTypes	b646f1be-4d33-4a27-8cad-23aef13f80ca	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/payment-types/b646f1be-4d33-4a27-8cad-23aef13f80ca	200	t	{"id": "b646f1be-4d33-4a27-8cad-23aef13f80ca"}	{"code": "CHAIRMAN_PAYMENT", "name": "Chairman Payment", "isActive": true, "direction": "OUTGOING", "description": "Confidential payment initiated by the Chairman; completed by the treasury team.", "isBatchBased": false, "makerRoleIds": ["fb4ee674-45b9-4160-aead-ec4470fb1592"], "checkerRoleId": "0082be8d-052d-499a-94f6-2019d8dff9e7", "legalEntityId": "a7010e74-1a65-445d-9227-1967ebd9139f", "isConfidential": true, "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": false}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	80	2026-06-08 02:44:47.798177+05:30
c3c421d1-1687-4370-9609-a83e0885e6ba	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	483	2026-06-08 02:48:33.72121+05:30
816954d2-571c-4adf-99f9-fe2e0be0c275	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	365	2026-06-08 02:48:34.951401+05:30
112af825-e592-48b2-9776-372e464868e8	CREATE	PaymentTypes	3e30d156-9208-441c-9d70-ac7f70596aa3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "SMOKE_CONF2_06F76D", "name": "Smoke Conf2 06F76D", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": true}	\N	::1	curl/8.18.0	44	2026-06-08 02:48:35.158582+05:30
7a553776-32df-49b7-b5f4-92da9293ba76	CREATE	ApprovalMatrices	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	400	f	\N	{"name": "Guard 06F76D", "bands": [{"steps": [{"approverType": "USER", "approverUserId": "5a59123f-8a33-462c-a1bc-49efff8668f3"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "effectiveFrom": "2026-01-01", "paymentTypeId": "3e30d156-9208-441c-9d70-ac7f70596aa3", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	"Smoke Conf2 06F76D" is a confidential (chairman-style) payment type and bypasses the approval matrix. Confidential payments route directly to the Treasury Authoriser — no matrix is required.	::1	curl/8.18.0	5	2026-06-08 02:48:35.298332+05:30
e2c18161-5ad7-46ce-b1f7-bba5f19c679f	DELETE	PaymentTypes	3e30d156-9208-441c-9d70-ac7f70596aa3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/3e30d156-9208-441c-9d70-ac7f70596aa3	204	t	{"id": "3e30d156-9208-441c-9d70-ac7f70596aa3"}	\N	\N	::1	curl/8.18.0	58	2026-06-08 02:48:35.669637+05:30
4dcb4f3d-5f2e-48fd-876a-d2ffb4b58771	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	454	2026-06-08 02:48:53.731965+05:30
3203815b-1262-4a7e-b819-f869b1644d33	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	394	2026-06-08 02:48:54.920688+05:30
e08dcd82-cf0e-4ad0-887a-022b150aafae	DELETE	PaymentTypes	e4e97ac2-e9ae-4609-8dae-cbe6ba15fe48	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/e4e97ac2-e9ae-4609-8dae-cbe6ba15fe48	204	t	{"id": "e4e97ac2-e9ae-4609-8dae-cbe6ba15fe48"}	\N	\N	::1	curl/8.18.0	54	2026-06-08 02:48:55.456209+05:30
7deb9232-a3b8-4280-affc-f5ea2b7dbd56	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Python-urllib/3.14	483	2026-06-08 02:49:20.290367+05:30
b626dbe3-077a-42e9-b5ad-4a76c1413f0e	CREATE	PaymentTypes	593b8c2d-1fc9-4a68-818b-dfee07d875ce	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "GUARD_5AE814", "name": "Guard 5AE814", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": true}	\N	::1	Python-urllib/3.14	42	2026-06-08 02:49:20.466409+05:30
46420f8b-705c-4188-8086-3b39e00cd12f	CREATE	ApprovalMatrices	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	400	f	\N	{"name": "Guard 5AE814", "bands": [{"steps": [{"approverType": "USER", "approverUserId": "5a59123f-8a33-462c-a1bc-49efff8668f3"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "effectiveFrom": "2026-01-01", "paymentTypeId": "593b8c2d-1fc9-4a68-818b-dfee07d875ce", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	"Guard 5AE814" is a confidential (chairman-style) payment type and bypasses the approval matrix. Confidential payments route directly to the Treasury Authoriser — no matrix is required.	::1	Python-urllib/3.14	13	2026-06-08 02:49:20.494125+05:30
79d97c87-c4cd-4767-9361-f4b894ab949a	DELETE	PaymentTypes	593b8c2d-1fc9-4a68-818b-dfee07d875ce	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/593b8c2d-1fc9-4a68-818b-dfee07d875ce	204	t	{"id": "593b8c2d-1fc9-4a68-818b-dfee07d875ce"}	\N	\N	::1	Python-urllib/3.14	24	2026-06-08 02:49:20.530376+05:30
b2b7f171-8c05-4e32-b007-1205a2cd53de	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Python-urllib/3.14	770	2026-06-08 03:07:25.121424+05:30
3c791f51-eb68-48aa-b213-c311927800b7	CREATE	PaymentTypes	928fc1ba-2a1c-49c0-bb73-5a7792bdbad4	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "CONFAUTH_C578B0", "name": "Conf Auth C578B0", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": true, "treasuryAuthoriserRoleId": "0082be8d-052d-499a-94f6-2019d8dff9e7"}	\N	::1	Python-urllib/3.14	56	2026-06-08 03:07:25.385598+05:30
3ae3935f-f349-4c19-ad80-8e06b359c422	CREATE	PaymentRequests	8e7fe565-c945-43f2-a16b-48761c28b88e	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": 7000, "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "paymentTypeId": "928fc1ba-2a1c-49c0-bb73-5a7792bdbad4", "purposeDescription": "conf auth test"}	\N	::1	Python-urllib/3.14	127	2026-06-08 03:07:25.589394+05:30
a95bf06a-65b5-406b-9dad-b680ec680c29	SUBMIT	PaymentRequests	8e7fe565-c945-43f2-a16b-48761c28b88e	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/8e7fe565-c945-43f2-a16b-48761c28b88e/submit	201	t	{"id": "8e7fe565-c945-43f2-a16b-48761c28b88e"}	\N	\N	::1	Python-urllib/3.14	107	2026-06-08 03:07:25.717511+05:30
782c3f9d-b85a-4256-93ce-097113573871	TREASURY_COMPLETE	PaymentRequests	8e7fe565-c945-43f2-a16b-48761c28b88e	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/8e7fe565-c945-43f2-a16b-48761c28b88e/treasury/complete	201	t	{"id": "8e7fe565-c945-43f2-a16b-48761c28b88e"}	{"swiftCopyUrl": "/uploads/c.pdf", "referenceNumber": "FT-CONF-1"}	\N	::1	Python-urllib/3.14	40	2026-06-08 03:07:25.777486+05:30
819ff910-e457-4bd7-bc8a-8b0a1f36e4ae	DELETE	PaymentTypes	928fc1ba-2a1c-49c0-bb73-5a7792bdbad4	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/928fc1ba-2a1c-49c0-bb73-5a7792bdbad4	204	t	{"id": "928fc1ba-2a1c-49c0-bb73-5a7792bdbad4"}	\N	\N	::1	Python-urllib/3.14	35	2026-06-08 03:07:25.83058+05:30
9cefaac3-3ed5-472e-b7b5-9d39a651a14b	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	394	2026-06-08 03:13:08.843991+05:30
5feefe07-d7db-4458-b0b4-ddce3fcb9ebe	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	461	2026-06-08 03:17:11.270839+05:30
79544b98-3bdb-4a72-8c03-cb446e71d0bb	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Python-urllib/3.14	521	2026-06-08 03:21:34.763638+05:30
4087216f-9482-4783-bb8a-c505f154940d	CREATE	PaymentTypes	a286ce69-effe-4a61-9b8b-a539fcf370c3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "CONFAUTH_9AEE8F", "name": "Conf Auth 9AEE8F", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": true, "treasuryAuthoriserRoleId": "0082be8d-052d-499a-94f6-2019d8dff9e7"}	\N	::1	Python-urllib/3.14	31	2026-06-08 03:21:34.982295+05:30
e6d9d40a-655b-4086-87e0-060176b722fe	CREATE	PaymentRequests	2c47cc2c-113d-44fb-a1b4-2ba506491671	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": 7000, "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "paymentTypeId": "a286ce69-effe-4a61-9b8b-a539fcf370c3", "purposeDescription": "x"}	\N	::1	Python-urllib/3.14	82	2026-06-08 03:21:35.13271+05:30
5faaa393-0e8f-4d31-a59d-7f7e920098fa	SUBMIT	PaymentRequests	2c47cc2c-113d-44fb-a1b4-2ba506491671	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/2c47cc2c-113d-44fb-a1b4-2ba506491671/submit	201	t	{"id": "2c47cc2c-113d-44fb-a1b4-2ba506491671"}	\N	\N	::1	Python-urllib/3.14	64	2026-06-08 03:21:35.207516+05:30
c7ddecaa-88dd-4cc6-b188-4484f210c985	TREASURY_COMPLETE	PaymentRequests	2c47cc2c-113d-44fb-a1b4-2ba506491671	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/2c47cc2c-113d-44fb-a1b4-2ba506491671/treasury/complete	201	t	{"id": "2c47cc2c-113d-44fb-a1b4-2ba506491671"}	{"swiftCopyUrl": "/uploads/c.pdf", "referenceNumber": "FT-RE-1"}	\N	::1	Python-urllib/3.14	30	2026-06-08 03:21:35.254317+05:30
15e37714-fd7e-46fa-9096-d19b9259a6f7	CREATE	PaymentTypes	3fb9f8c5-8d49-4dda-9fed-b2b8ed3d6bac	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "NOTCONF_9AEE8F", "name": "Not Conf 9AEE8F", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": false, "treasuryAuthoriserRoleId": "0082be8d-052d-499a-94f6-2019d8dff9e7"}	\N	::1	Python-urllib/3.14	7	2026-06-08 03:21:35.278008+05:30
6a6dbfa5-71ff-4d24-a52b-901515a1b2a3	DELETE	PaymentTypes	a286ce69-effe-4a61-9b8b-a539fcf370c3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/a286ce69-effe-4a61-9b8b-a539fcf370c3	204	t	{"id": "a286ce69-effe-4a61-9b8b-a539fcf370c3"}	\N	\N	::1	Python-urllib/3.14	26	2026-06-08 03:21:35.320837+05:30
7677cf08-1c0d-464a-ae66-abafd1fbddcd	DELETE	PaymentTypes	3fb9f8c5-8d49-4dda-9fed-b2b8ed3d6bac	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/3fb9f8c5-8d49-4dda-9fed-b2b8ed3d6bac	204	t	{"id": "3fb9f8c5-8d49-4dda-9fed-b2b8ed3d6bac"}	\N	\N	::1	Python-urllib/3.14	36	2026-06-08 03:21:35.377975+05:30
9c2c9803-b5e5-49f7-b392-ba9138874c88	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Python-urllib/3.14	319	2026-06-08 03:47:10.03515+05:30
e36edb9f-a793-4fc4-b0a0-170d5ce5d468	CREATE	PaymentTypes	f3ff3e18-5359-4ccd-85a7-af09b6ac7e41	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "CM_A688BA", "name": "CM A688BA", "direction": "OUTGOING", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": true}	\N	::1	Python-urllib/3.14	21	2026-06-08 03:47:10.160361+05:30
f1f607b4-ac34-4fb4-8526-a71dd683f5bf	CREATE	ApprovalMatrices	5c464c28-5a8e-471a-8a35-864bfb560dbc	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "CM Matrix A688BA", "ttMode": "ONLINE_TT", "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "effectiveFrom": "2026-01-01", "paymentTypeId": "f3ff3e18-5359-4ccd-85a7-af09b6ac7e41", "treasuryAuthoriserRoleId": "0082be8d-052d-499a-94f6-2019d8dff9e7"}	\N	::1	Python-urllib/3.14	32	2026-06-08 03:47:10.203491+05:30
1762029f-2179-45cf-8928-e68dd4b1e67e	CREATE	PaymentRequests	63e2a3b5-c4a9-4825-9019-d5b6cdf6b725	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": 9000, "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "paymentTypeId": "f3ff3e18-5359-4ccd-85a7-af09b6ac7e41", "purposeDescription": "x"}	\N	::1	Python-urllib/3.14	49	2026-06-08 03:47:10.274404+05:30
c1ece640-b9ed-414b-9ffe-4ea992db8c1a	TREASURY_COMPLETE	PaymentRequests	63e2a3b5-c4a9-4825-9019-d5b6cdf6b725	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/63e2a3b5-c4a9-4825-9019-d5b6cdf6b725/treasury/complete	201	t	{"id": "63e2a3b5-c4a9-4825-9019-d5b6cdf6b725"}	{"swiftCopyUrl": "/uploads/c.pdf", "referenceNumber": "FT-CM-1"}	\N	::1	Python-urllib/3.14	15	2026-06-08 03:47:10.350265+05:30
4c2e971c-b088-4e86-ba98-4e9c045f144f	DELETE	PaymentTypes	f3ff3e18-5359-4ccd-85a7-af09b6ac7e41	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/f3ff3e18-5359-4ccd-85a7-af09b6ac7e41	204	t	{"id": "f3ff3e18-5359-4ccd-85a7-af09b6ac7e41"}	\N	\N	::1	Python-urllib/3.14	14	2026-06-08 03:47:10.40506+05:30
84228f5c-c604-40ac-a28e-085e2cf1c402	CREATE	ApprovalMatrices	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	400	f	\N	{"name": "CM Bad A688BA", "ttMode": "ONLINE_TT", "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "effectiveFrom": "2026-01-01", "paymentTypeId": "f3ff3e18-5359-4ccd-85a7-af09b6ac7e41"}	A Treasury Authoriser role is required for confidential payment types.	::1	Python-urllib/3.14	3	2026-06-08 03:47:10.216582+05:30
05dd68c7-ece4-464b-9495-cf7995144593	SUBMIT	PaymentRequests	63e2a3b5-c4a9-4825-9019-d5b6cdf6b725	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/63e2a3b5-c4a9-4825-9019-d5b6cdf6b725/submit	201	t	{"id": "63e2a3b5-c4a9-4825-9019-d5b6cdf6b725"}	\N	\N	::1	Python-urllib/3.14	44	2026-06-08 03:47:10.326615+05:30
959a68a3-79de-4fbf-afff-074b449b692a	CREATE	ApprovalMatrices	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	400	f	\N	{"name": "STD Bad A688BA", "ttMode": "ONLINE_TT", "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "effectiveFrom": "2026-01-01", "paymentTypeId": "b2294dcc-742c-48f6-9190-0c0d756705c0", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "0082be8d-052d-499a-94f6-2019d8dff9e7"}	At least one band is required.	::1	Python-urllib/3.14	1	2026-06-08 03:47:10.376661+05:30
fc82f73e-9a1e-44f7-8e61-f513e8aae44d	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	404	f	\N	\N	Cannot POST /api/v1/employee-auth/request-otp	::1	curl/8.18.0	\N	2026-06-08 10:08:28.784756+05:30
3dc3324f-3fb1-45a0-a7d6-e338d24891c3	LOGIN	Auth	\N	\N	\N	POST	/api/v1/auth/login	400	f	\N	\N	Bad Request Exception	::1	curl/8.18.0	5	2026-06-08 10:08:28.81159+05:30
9fb051ef-65ae-4aff-81b5-aa7a3846d882	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "nobody@example.com"}	\N	::1	curl/8.18.0	18	2026-06-08 10:09:11.257645+05:30
9a69f71d-e52b-4e5d-8af0-9b3160a7afc2	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "nobody@example.com"}	\N	::1	curl/8.18.0	2	2026-06-08 10:09:11.306185+05:30
9c35db18-23d0-49c4-92b7-519a9c803191	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	401	f	\N	{"code": "000000", "workEmail": "nobody@example.com"}	Invalid or expired code	::1	curl/8.18.0	5	2026-06-08 10:09:11.415898+05:30
bf2d70ce-bb52-4427-82a5-aaedcfe57c48	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "shivam.emp@radiant.com"}	\N	::1	curl/8.18.0	208	2026-06-08 10:10:52.687498+05:30
e53f1de2-42a1-4ec8-a4ac-57f7f08f41d7	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "270570", "workEmail": "shivam.emp@radiant.com"}	\N	::1	node	90	2026-06-08 10:11:12.361407+05:30
1709d397-12f8-4cf0-a587-b6359c2fe7c9	CREATE	EmployeePortal	2ec9e47a-b735-4feb-8d77-4a64b85606cf	94a6e00e-ff36-41c2-863f-f76d73f6b86c	\N	POST	/api/v1/employee/payment-requests	201	t	\N	{"amount": "123.4500", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f", "purposeDescription": "E2E smoke test reimbursement", "beneficiaryAccountId": "bf480d61-b059-4e2a-8f62-09f0a795431a"}	\N	::1	node	63	2026-06-08 10:11:12.497716+05:30
59a69953-3d26-4592-af58-c01f72cc673b	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "nobody@example.com"}	\N	::1	curl/8.18.0	16	2026-06-08 10:14:18.597102+05:30
e6117d31-5821-4beb-956f-cc377c882bd2	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "nobody@example.com"}	\N	::1	curl/8.18.0	2	2026-06-08 10:14:18.660619+05:30
ec747778-834e-4df7-825c-7bf261e5031a	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	node	527	2026-06-08 10:51:49.378892+05:30
75c1e52d-1638-4271-88d2-c9996630153b	CREATE	IncomingReceipts	9f035ac8-0fd4-47d8-9947-e02863caba64	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts	201	t	\N	{"documents": [{"fileUrl": "/uploads/smoke.pdf", "fileName": "dn.pdf", "documentCode": "DEBIT_NOTE", "documentLabel": "Debit Note"}], "legalEntityId": "3c7059a2-ba71-47e4-a7e1-2f6e5daf707f", "counterpartyId": "78929b22-17bd-49c4-af3f-df4b91ecc9eb", "expectedAmount": "1000.0000", "purposeDescription": "SMOKE TEST", "expectedCurrencyCode": "USD", "receiveFromAccountId": "5dd8d08c-039a-46e9-9634-bad63547fa4c"}	\N	::1	node	28	2026-06-08 10:51:49.462459+05:30
118cbcc9-6622-4d89-b31f-40e5013c7135	SUBMIT	IncomingReceipts	9f035ac8-0fd4-47d8-9947-e02863caba64	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/9f035ac8-0fd4-47d8-9947-e02863caba64/submit	201	t	{"id": "9f035ac8-0fd4-47d8-9947-e02863caba64"}	\N	\N	::1	node	71	2026-06-08 10:51:49.599562+05:30
a2105ec6-34d0-47ff-b93f-6a0b1392e1a8	CREATE	IncomingReceipts	9f035ac8-0fd4-47d8-9947-e02863caba64	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/9f035ac8-0fd4-47d8-9947-e02863caba64/mark-received	500	f	{"id": "9f035ac8-0fd4-47d8-9947-e02863caba64"}	{"remarks": "ok", "receivedDate": "2026-06-08", "receivedAmount": "1000.0000", "inwardBankReference": "UTRSMOKE1", "receiveFromAccountId": "5dd8d08c-039a-46e9-9634-bad63547fa4c", "receivedCurrencyCode": "USD"}	relation "balance_changes" does not exist	::1	node	20	2026-06-08 10:51:49.641683+05:30
ddadc8e6-a0bb-4dd6-b223-9cfd405aab4c	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	node	394	2026-06-08 10:53:19.077952+05:30
43eec29d-5ab3-4785-bf8d-b83bcae8ad57	CREATE	IncomingReceipts	f8354012-1714-4103-bfd6-986b8fba12ea	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts	201	t	\N	{"documents": [{"fileUrl": "/uploads/smoke.pdf", "fileName": "dn.pdf", "documentCode": "DEBIT_NOTE", "documentLabel": "Debit Note"}], "legalEntityId": "3c7059a2-ba71-47e4-a7e1-2f6e5daf707f", "counterpartyId": "78929b22-17bd-49c4-af3f-df4b91ecc9eb", "expectedAmount": "1000.0000", "purposeDescription": "SMOKE", "expectedCurrencyCode": "USD", "receiveFromAccountId": "5dd8d08c-039a-46e9-9634-bad63547fa4c"}	\N	::1	node	20	2026-06-08 10:53:19.152761+05:30
a55eaf9e-92bd-4993-8de7-421b31cf4429	SUBMIT	IncomingReceipts	f8354012-1714-4103-bfd6-986b8fba12ea	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/f8354012-1714-4103-bfd6-986b8fba12ea/submit	201	t	{"id": "f8354012-1714-4103-bfd6-986b8fba12ea"}	\N	\N	::1	node	27	2026-06-08 10:53:19.246065+05:30
e65d882d-886b-42ff-a929-3e94cdbe8e6b	SUBMIT	IncomingReceipts	f8354012-1714-4103-bfd6-986b8fba12ea	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/f8354012-1714-4103-bfd6-986b8fba12ea/submit	400	f	{"id": "f8354012-1714-4103-bfd6-986b8fba12ea"}	\N	Only DRAFT receipts can be submitted.	::1	node	5	2026-06-08 10:53:19.260718+05:30
c3ee3144-f006-4bb9-b0b9-f5fb69648445	CREATE	IncomingReceipts	f8354012-1714-4103-bfd6-986b8fba12ea	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/f8354012-1714-4103-bfd6-986b8fba12ea/mark-received	201	t	{"id": "f8354012-1714-4103-bfd6-986b8fba12ea"}	{"remarks": "ok", "receivedDate": "2026-06-08", "receivedAmount": "1000.0000", "inwardBankReference": "UTRSMOKE1", "receiveFromAccountId": "5dd8d08c-039a-46e9-9634-bad63547fa4c", "receivedCurrencyCode": "USD"}	\N	::1	node	6962	2026-06-08 10:53:26.232614+05:30
bb515f45-5fda-4f0f-87fc-a2ac4da9d53a	CANCEL	IncomingReceipts	f8354012-1714-4103-bfd6-986b8fba12ea	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/f8354012-1714-4103-bfd6-986b8fba12ea/cancel	400	f	{"id": "f8354012-1714-4103-bfd6-986b8fba12ea"}	{"reason": "x"}	This receipt cannot be cancelled in its current status.	::1	node	7	2026-06-08 10:53:26.297042+05:30
9f3fd943-40d6-4af3-9141-62e26a1394f2	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	75	2026-06-08 12:17:05.133064+05:30
9d228acb-f327-4850-b5c3-a0ca5c949af8	CREATE	StatementUploads	3b66e16d-13f8-47c9-a8ce-1e317006edb0	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/statement-uploads	201	t	\N	{"notes": "SMOKE", "fileUrl": "/uploads/smoke-stmt.pdf", "bankAccountId": "84bef48c-ec28-4437-a2db-e9b536c09a73", "statementDate": "2026-06-08", "closingBalance": 1495000, "openingBalance": 1500000}	\N	::1	node	34	2026-06-08 10:53:26.344748+05:30
cd27de03-8a12-4608-b18e-0830d4a54640	CREATE	Reconciliation	3b66e16d-13f8-47c9-a8ce-1e317006edb0	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/reconciliation/uploads/3b66e16d-13f8-47c9-a8ce-1e317006edb0/ingest-csv	201	t	{"id": "3b66e16d-13f8-47c9-a8ce-1e317006edb0"}	{"runAutoMatch": true}	\N	::1	node	12	2026-06-08 10:53:26.423612+05:30
ca1b2df0-f9f5-4caf-9544-288d903792c6	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	893	2026-06-08 12:06:17.478825+05:30
bf93826b-86cc-4358-abd2-25ac2df5b1c4	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	865	2026-06-08 12:06:39.383675+05:30
d59d33c7-7290-49ed-9648-1e798fa98ccb	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	747	2026-06-08 12:07:09.387209+05:30
e521dcae-c925-464d-a1c8-997ffd60a423	UPDATE	ApprovalMatrices	da8ba145-1083-4a80-9109-3eb72718a48b	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/da8ba145-1083-4a80-9109-3eb72718a48b	200	t	{"id": "da8ba145-1083-4a80-9109-3eb72718a48b"}	{"name": "Vendor Payment — USD", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": 1000, "minAmount": 0}, {"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": 25000, "minAmount": 1001}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-04", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	164	2026-06-08 12:08:20.592714+05:30
37c4d733-6ce3-4c4d-9ace-06702aee603c	UPDATE	ApprovalMatrices	da8ba145-1083-4a80-9109-3eb72718a48b	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/da8ba145-1083-4a80-9109-3eb72718a48b	200	t	{"id": "da8ba145-1083-4a80-9109-3eb72718a48b"}	{"name": "Vendor Payment — USD", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": 1000, "minAmount": 0}, {"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}, {"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": 25000, "minAmount": 1001}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-04", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	111	2026-06-08 12:08:40.25605+05:30
6fa84749-fc9c-4773-800e-c07a4d430220	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	764	2026-06-08 12:09:08.581068+05:30
174ff101-425a-4c67-b24d-1c4d2096635b	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	396	2026-06-08 12:09:54.444064+05:30
aec23eeb-c35b-45c1-8bba-19465289fed3	CREATE	PaymentRequests	ef82204b-d60a-4058-9457-477971f78c38	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "1000", "dueDate": "2026-06-09", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780900794062-68284.pdf", "fileName": "SOW_Payments_Control_System.pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-2203", "paymentTypeId": "b2294dcc-742c-48f6-9190-0c0d756705c0", "counterpartyId": "9460c88b-b10b-465a-bc87-3d8613469184", "sourceAccountId": "2d19213d-76e1-4683-8c62-a762ae3c7e3c", "purposeDescription": "testing", "beneficiaryAccountId": "d297dfdd-cecb-4f2f-8c61-114d23490d78"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	240	2026-06-08 12:10:02.173079+05:30
53cce169-7062-4448-9de5-bcf5216f4fe9	SUBMIT	PaymentRequests	ef82204b-d60a-4058-9457-477971f78c38	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/ef82204b-d60a-4058-9457-477971f78c38/submit	201	t	{"id": "ef82204b-d60a-4058-9457-477971f78c38"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	127	2026-06-08 12:15:36.044919+05:30
6adc7a51-84e9-4a41-8397-308dd0dcf74d	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	82	2026-06-08 12:15:49.11311+05:30
e8830864-52cd-4dbd-bb19-96c3f3225b8e	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	4	2026-06-08 12:15:51.40282+05:30
112f53d6-a5d6-4489-8649-40f0087a7419	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	69	2026-06-08 12:16:27.541696+05:30
ba085246-095f-4213-b0e1-d5fd53570a2c	LOGIN	Auth	\N	\N	saritha@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	635	2026-06-08 12:16:35.965833+05:30
ef2c85ac-a05b-4351-9df1-7a1a3afbd0f6	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	788	2026-06-08 12:17:28.090426+05:30
59c7f5ff-8aee-4db3-97e4-e00a0141440c	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	729	2026-06-08 12:17:50.195549+05:30
b86b0c1b-6f75-456a-9e86-9027b8ac2f6b	APPROVE	PaymentRequests	ef82204b-d60a-4058-9457-477971f78c38	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/ef82204b-d60a-4058-9457-477971f78c38/approve	201	t	{"id": "ef82204b-d60a-4058-9457-477971f78c38"}	{"comments": "test"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	137	2026-06-08 12:18:06.907219+05:30
34635a29-65fd-4b7b-93ab-deb835531775	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	732	2026-06-08 12:18:21.233415+05:30
5bb0eef7-7d48-42e9-a3a6-a9e6af8e96cf	APPROVE	PaymentRequests	ef82204b-d60a-4058-9457-477971f78c38	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/ef82204b-d60a-4058-9457-477971f78c38/approve	201	t	{"id": "ef82204b-d60a-4058-9457-477971f78c38"}	{"comments": "test"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	178	2026-06-08 12:18:31.921448+05:30
9b67d07d-be61-429e-a03d-24cf3fc7955a	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	776	2026-06-08 12:18:43.052512+05:30
83cf241f-3d29-404a-b98d-7419961cee32	APPROVE	PaymentRequests	ef82204b-d60a-4058-9457-477971f78c38	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/payment-requests/ef82204b-d60a-4058-9457-477971f78c38/approve	201	t	{"id": "ef82204b-d60a-4058-9457-477971f78c38"}	{"comments": "test"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	136	2026-06-08 12:18:52.691045+05:30
2fb5104c-06f8-4a79-8cb3-8ec638b139a7	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	754	2026-06-08 12:19:09.277626+05:30
cb1f7f25-7fd9-4174-b4f2-b28e97ee402f	LOGIN	Auth	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abirami@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	743	2026-06-08 12:19:52.680669+05:30
08f95b92-c42a-4e1b-912c-44ed553c7e04	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	1316	2026-06-08 12:20:12.550614+05:30
d900e0d2-a17b-4f00-a66f-315a11974dda	TREASURY_SUBMIT	PaymentRequests	ef82204b-d60a-4058-9457-477971f78c38	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/payment-requests/ef82204b-d60a-4058-9457-477971f78c38/treasury/submit	201	t	{"id": "ef82204b-d60a-4058-9457-477971f78c38"}	{"swiftCopyUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780901411250-275209.pdf", "referenceNumber": "FT123REF988"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	94	2026-06-08 12:20:13.92655+05:30
cefe4c2d-9af3-4462-8fa7-d0c0e3ff71af	LOGIN	Auth	\N	\N	krrish.jain@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "krrish.jain@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	177	2026-06-08 12:20:26.73912+05:30
b3ec836f-59ca-4e50-a9a6-58f0d1263d39	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	735	2026-06-08 12:21:15.213954+05:30
2acc68bc-14d4-4084-b847-c4e7df0f0400	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	741	2026-06-08 12:21:45.18016+05:30
ef34b69b-52b7-4fe7-b368-914e3f773b51	TREASURY_CHECK	PaymentRequests	ef82204b-d60a-4058-9457-477971f78c38	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/payment-requests/ef82204b-d60a-4058-9457-477971f78c38/treasury/check	201	t	{"id": "ef82204b-d60a-4058-9457-477971f78c38"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	80	2026-06-08 12:22:16.971669+05:30
bb6df995-ec90-41d7-a284-03b83cd32f94	LOGIN	Auth	964da820-0264-48cf-8d22-971f8843741d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "anushya@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	836	2026-06-08 12:22:29.616723+05:30
9286eb5c-56df-4886-96e9-33de777c77bf	TREASURY_COMPLETE	PaymentRequests	ef82204b-d60a-4058-9457-477971f78c38	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/payment-requests/ef82204b-d60a-4058-9457-477971f78c38/treasury/complete	201	t	{"id": "ef82204b-d60a-4058-9457-477971f78c38"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	60	2026-06-08 12:22:36.291782+05:30
17d2ffc3-47f2-4e79-9ae2-54d92c8f0ddc	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	852	2026-06-08 12:23:15.168998+05:30
d71d0f91-5ed9-4d37-8055-eaf15ccd69a2	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	857	2026-06-08 12:28:51.090183+05:30
9c3ab71f-2246-4314-a541-920e221608c7	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	741	2026-06-08 12:29:11.548842+05:30
99afbef3-5d57-486b-8522-a7ea053ca82a	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2783	2026-06-08 12:30:18.394494+05:30
b2b7e77f-ac51-4e15-93fb-e847046cdcae	CREATE	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "1000", "dueDate": "2026-06-09", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780902015612-676056.pdf", "fileName": "SOW_Payments_Control_System.pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-2203", "paymentTypeId": "b2294dcc-742c-48f6-9190-0c0d756705c0", "counterpartyId": "9460c88b-b10b-465a-bc87-3d8613469184", "sourceAccountId": "2d19213d-76e1-4683-8c62-a762ae3c7e3c", "purposeDescription": "testing", "beneficiaryAccountId": "d297dfdd-cecb-4f2f-8c61-114d23490d78"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	210	2026-06-08 12:30:29.047105+05:30
194da39a-4820-47c3-a231-ab6b77dcd152	SUBMIT	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/submit	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	142	2026-06-08 12:32:23.362295+05:30
c802d067-4c05-431e-a3bf-3117ad32f59a	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	739	2026-06-08 12:32:41.194058+05:30
45484024-395b-4b12-944b-486ddd15cae9	APPROVE	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/approve	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	179	2026-06-08 12:32:59.554131+05:30
b94c579c-02f0-4207-a182-8f943c0b88a3	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	735	2026-06-08 12:33:41.568231+05:30
d2ef5b02-e461-478c-8aa8-3b223f3886dc	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	720	2026-06-08 12:34:02.276813+05:30
79527c27-5aa3-45bc-a76e-fc75efb56c1a	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	651	2026-06-08 12:34:21.301387+05:30
2c09c01b-8354-4418-ba29-910b569699e3	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	734	2026-06-08 12:35:12.974593+05:30
b18ac66e-faf0-4eba-b98e-b49b10811ea2	APPROVE	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/approve	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	89	2026-06-08 12:35:26.31493+05:30
d404a072-ab53-492e-a010-2e87a8b5b403	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	741	2026-06-08 12:35:41.86301+05:30
855b5827-36ef-42a1-b2a7-640f16938fc5	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	710	2026-06-08 12:35:59.698907+05:30
b13c3afa-6598-4d1e-a2ee-04035f43ecd7	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	835	2026-06-08 12:36:34.808641+05:30
d9e88361-4fed-4d0d-bce2-fcbfa4859bac	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	662	2026-06-08 12:36:45.432291+05:30
e6da38bf-f2c2-4df9-9b57-f2fe249add72	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	721	2026-06-08 12:37:34.78052+05:30
49a36966-3bd8-4f62-bc0c-f339f2a91d01	REJECT	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/reject	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	{"comments": "testing purpose only"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	128	2026-06-08 12:37:53.067039+05:30
763daed7-c16c-4336-b3c5-da83699eb1c0	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	707	2026-06-08 12:38:15.407353+05:30
bf82d4d0-64b0-4cb9-952e-71e129f41443	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	749	2026-06-08 12:38:52.939075+05:30
a60a7f56-66d4-4cdf-9066-e4af429a22cc	RESUBMIT	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/resubmit	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	80	2026-06-08 12:39:01.759865+05:30
254c9faa-cb7f-4b68-af04-6ffe24195df0	CREATE	PaymentTypes	1239481b-c30a-4843-b775-d02e2fdeda60	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "TEST_MERGE_970741", "name": "Test Merge Type", "isActive": true, "direction": "OUTGOING", "isBatchBased": false, "makerRoleIds": [], "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": false, "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	56	2026-06-08 14:59:31.416989+05:30
15b89043-636b-4830-99ed-b353cd479d8c	UPDATE	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	PUT	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	200	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	{"amount": "1000.0000", "dueDate": "2026-06-09", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-2203", "paymentTypeId": "b2294dcc-742c-48f6-9190-0c0d756705c0", "counterpartyId": "9460c88b-b10b-465a-bc87-3d8613469184", "sourceAccountId": "2d19213d-76e1-4683-8c62-a762ae3c7e3c", "purposeDescription": "testing", "beneficiaryAccountId": "d297dfdd-cecb-4f2f-8c61-114d23490d78"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	125	2026-06-08 12:39:17.477562+05:30
4386d78f-298b-4368-80bb-99a085d3d99d	SUBMIT	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/submit	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	76	2026-06-08 12:39:21.394193+05:30
9578143e-fb36-45cb-a9e2-e60b6c79cbb0	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	728	2026-06-08 12:39:34.069485+05:30
2f4c33fd-3e38-4e4f-9cde-f0b09434777a	APPROVE	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/approve	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	163	2026-06-08 12:39:47.354691+05:30
bd6ec1e8-2f80-474e-a3cc-40556723ec5f	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	647	2026-06-08 12:39:57.821033+05:30
e98c7ccf-30f8-4906-9597-26afa2d0c827	APPROVE	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/approve	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	{"comments": "Testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	176	2026-06-08 12:41:44.299299+05:30
46526f7d-eeb9-4a21-9b7e-2278f09e3e7b	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	742	2026-06-08 12:41:56.350087+05:30
6a76abdb-4074-4fc7-b620-49d7700811b8	APPROVE	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/approve	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	{"comments": "Testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	149	2026-06-08 12:42:07.633119+05:30
a5b68762-75cc-417f-8b26-223820d422a9	LOGIN	Auth	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abirami@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	740	2026-06-08 12:42:21.808614+05:30
1eeb4182-5256-4f78-9477-86f4c7cdf6dc	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	530	2026-06-08 12:43:03.108505+05:30
30988879-1253-4185-a081-0e8574e4fc7d	TREASURY_SUBMIT	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/treasury/submit	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	{"swiftCopyUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780902782580-698632.pdf", "referenceNumber": "FT123REF988"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	166	2026-06-08 12:43:30.785969+05:30
ce13db67-8428-4e0f-b447-9a290e4f943e	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	731	2026-06-08 12:43:47.409547+05:30
779cc556-8c65-4207-8fcd-04d1705fd155	TREASURY_CHECK	PaymentRequests	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/payment-requests/65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e/treasury/check	201	t	{"id": "65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	144	2026-06-08 12:46:59.615397+05:30
3105dc27-c82e-4401-a839-9d303e13fabe	LOGIN	Auth	964da820-0264-48cf-8d22-971f8843741d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "anushya@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	744	2026-06-08 12:47:35.057598+05:30
f6b3cbf9-f238-441e-814b-7595f421d4f9	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	698	2026-06-08 12:50:23.70601+05:30
bb60b7c2-e733-4f38-90ab-5c0a813211eb	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	731	2026-06-08 12:52:45.491595+05:30
43ff1e1a-343d-4b7f-b5b5-ae684ddb9461	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	765	2026-06-08 13:03:54.24836+05:30
12c2492e-6d88-4249-9956-ba9987b54719	LOGIN	Auth	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ankita@firsteconomy.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	760	2026-06-08 13:07:00.098649+05:30
d0c29d55-61cf-4961-8a37-904ee21cc022	CREATE	Uploads	\N	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	246	2026-06-08 13:08:02.893789+05:30
cc10915d-cc7d-46ec-b00f-755df9a4e853	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	7012	2026-06-08 15:20:17.380952+05:30
f5a8547d-1361-48ea-8da8-a5fe0dd8d5a8	CREATE	PaymentRequests	307d4a1f-0a9c-4729-a2f4-73a2cf15b038	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "1000", "dueDate": "2026-06-10", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780904282648-918189.pdf", "fileName": "Payments Authority Matrix - Radiant (1) (1).pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-2203", "paymentTypeId": "b646f1be-4d33-4a27-8cad-23aef13f80ca", "counterpartyId": "f074196f-049f-4deb-a331-aee61df80d59", "sourceAccountId": "2d19213d-76e1-4683-8c62-a762ae3c7e3c", "purposeDescription": "testing", "beneficiaryAccountId": "dc9edb0c-1c51-4633-9abc-d0e613f6cc04"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	110	2026-06-08 13:08:04.366703+05:30
74495136-b5b7-4344-a79f-dcbf86171381	SUBMIT	PaymentRequests	307d4a1f-0a9c-4729-a2f4-73a2cf15b038	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests/307d4a1f-0a9c-4729-a2f4-73a2cf15b038/submit	201	t	{"id": "307d4a1f-0a9c-4729-a2f4-73a2cf15b038"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	77	2026-06-08 13:08:19.545736+05:30
e3daa094-8ffa-482d-ab42-6c200d123597	LOGIN	Auth	964da820-0264-48cf-8d22-971f8843741d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "anushya@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	865	2026-06-08 13:08:34.197385+05:30
1a51e690-725e-46d0-b9c1-4bcf87eeddf2	CREATE	Uploads	\N	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3513	2026-06-08 13:08:59.479947+05:30
e047ec7d-ee7c-46b9-a5af-db38ed33f414	TREASURY_COMPLETE	PaymentRequests	307d4a1f-0a9c-4729-a2f4-73a2cf15b038	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/payment-requests/307d4a1f-0a9c-4729-a2f4-73a2cf15b038/treasury/complete	201	t	{"id": "307d4a1f-0a9c-4729-a2f4-73a2cf15b038"}	{"swiftCopyUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780904335969-690381.pdf", "referenceNumber": "FT123REF988"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	172	2026-06-08 13:09:10.17605+05:30
0289206c-a328-4544-8c64-b8c2a65fe0b1	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	932	2026-06-08 13:32:53.009255+05:30
4de49ed3-8135-44af-93b0-1f33ab87856f	CREATE	Employees	0da474d7-d748-4795-bb34-0fa2c05f61a0	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/employees	201	t	\N	{"address": "askghdjhdwgj hsbsmddbcjhbjhscb  jhdbjasbdhasb", "endDate": "2026-06-09", "fullName": "Sonal Tamboli", "isActive": true, "startDate": "2026-06-09", "workEmail": "sonal@firsteconomy.com", "nationalId": "12343r4221322`", "dateOfBirth": "1993-05-19", "employeeCode": "EMP-007", "mobileNumber": "9119505008", "taxIdentifier": "test", "countryOfEmploymentId": "97cddc42-776c-4c99-89e8-5e374808b560"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	68	2026-06-08 13:35:54.160726+05:30
bc330831-d2cc-425b-9eed-c0b5c4f5130b	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	36	2026-06-08 13:37:40.960555+05:30
cdc83739-c6c1-40e5-a472-bf31f2a640e3	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	80	2026-06-08 13:48:34.607521+05:30
92bdd712-2f6d-4657-ad80-770bbde252c6	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "682392", "workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	95	2026-06-08 13:48:58.067613+05:30
636d6e1e-2fc2-4c9e-82b0-f984cc070d81	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	86	2026-06-08 13:52:53.176909+05:30
0cb2f9e1-e13c-4ba1-97a4-806239ad1dc8	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	4864	2026-06-08 13:58:31.307815+05:30
28303bac-ee08-4c0c-9ecc-1310620804c1	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "188036", "workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	119	2026-06-08 13:58:52.77376+05:30
54b45d5d-c830-4d70-a634-389d0de8934c	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	1175	2026-06-08 14:09:01.557019+05:30
5d38b13e-69bb-48f3-ba71-5146505dedc9	CREATE	Employee	\N	\N	\N	POST	/api/v1/employee/uploads/file	401	f	\N	\N	Unauthorized	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; en-IN) WindowsPowerShell/5.1.26100.8457	\N	2026-06-08 14:09:20.928079+05:30
19955c17-3494-4a37-8109-86c9d7185432	CREATE	Roles	3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/roles	201	t	\N	{"code": "EMPLOYEE", "name": "Employee", "description": "Employee"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	127	2026-06-08 14:45:49.308478+05:30
d511d732-5f38-4379-b93c-53db5c61de18	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	562	2026-06-08 14:53:14.288123+05:30
34ca8f5f-a0f6-4dc7-8794-11e3d1fc4ea2	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	538	2026-06-08 14:56:57.111123+05:30
a95e9f68-ba3d-48b7-a7a8-0197994a398d	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	383	2026-06-08 14:57:07.05111+05:30
ea5a45af-e411-433d-80db-8491cdf92620	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	446	2026-06-08 14:57:24.363896+05:30
2ce52c51-183e-40c7-bb5f-04a03cb91011	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	445	2026-06-08 14:58:14.419966+05:30
e2eb4dc6-4924-468a-b563-bf311a610c96	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	502	2026-06-08 14:59:26.295125+05:30
6eac39fe-a7cf-4ee4-a861-3ff3c289d737	CREATE	ApprovalMatrices	44044b90-c7ec-48fe-b754-eba0686cc542	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "Test Merge Matrix", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "ff0ea523-3dd5-4256-be64-13b191fc043f", "effectiveFrom": "2026-06-08", "paymentTypeId": "1239481b-c30a-4843-b775-d02e2fdeda60", "treasuryMakerRoleId": "81c68ec5-f574-4031-b9dd-a93a42ef108d", "treasuryCheckerRoleId": "81c68ec5-f574-4031-b9dd-a93a42ef108d", "treasuryAuthoriserRoleId": "81c68ec5-f574-4031-b9dd-a93a42ef108d"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36	50	2026-06-08 14:59:31.492891+05:30
c7065261-4a9f-4c23-bdac-0970b2c7153f	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	node	698	2026-06-08 14:59:33.573342+05:30
454c8af9-1654-45d6-aec2-cbe94623bf9d	DELETE	ApprovalMatrices	44044b90-c7ec-48fe-b754-eba0686cc542	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/approval-matrices/44044b90-c7ec-48fe-b754-eba0686cc542	204	t	{"id": "44044b90-c7ec-48fe-b754-eba0686cc542"}	\N	\N	::1	node	54	2026-06-08 14:59:33.741602+05:30
e9d24395-c58a-4cb1-a174-ef1cfc4d1753	DELETE	PaymentTypes	1239481b-c30a-4843-b775-d02e2fdeda60	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/1239481b-c30a-4843-b775-d02e2fdeda60	204	t	{"id": "1239481b-c30a-4843-b775-d02e2fdeda60"}	\N	\N	::1	node	41	2026-06-08 14:59:33.801618+05:30
4e217039-45d8-4c92-bf61-53b5f4bdf0fd	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	549	2026-06-08 15:11:38.835551+05:30
305b2631-f03e-4a9e-b376-cdd0361a9490	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	638	2026-06-08 15:13:51.049686+05:30
12033383-9473-4647-a54a-8f0fcdc51cf0	CREATE	Roles	0385aa54-b00a-4e55-a9d8-f35ef42568fc	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/roles	201	t	\N	{"code": "REIMBURSEMENT_CHECKER", "name": "Reimbursements_checker", "description": "Reimbursements_checker"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	26	2026-06-08 15:13:56.257725+05:30
c12c13db-cefb-40d5-b1b5-857eb7e5c3d4	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "ghizlane.emp@radiant.com"}	\N	::1	curl/8.18.0	3667	2026-06-08 15:14:27.794371+05:30
47c4dbe4-50dd-4740-ae1e-91a303824d6a	CREATE	UserRoles	5620b458-e536-4f42-99fd-da285b1cc77d	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/user-roles	201	t	\N	{"roleId": "0385aa54-b00a-4e55-a9d8-f35ef42568fc", "userId": "803b17c2-2f24-40a3-a3d3-09e7fcf388c1"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	28	2026-06-08 15:14:28.853737+05:30
439a3e4b-d7a4-490b-88ef-f2c0fa639724	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	400	f	\N	{"code": "", "workEmail": "ghizlane.emp@radiant.com"}	Bad Request Exception	::1	curl/8.18.0	2	2026-06-08 15:14:29.818697+05:30
b0f0713d-2090-4517-896a-eef1d1f08c1f	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "ghizlane.emp@radiant.com"}	\N	::1	curl/8.18.0	3295	2026-06-08 15:14:53.798173+05:30
a07f8f61-1ced-4e4b-a8c0-7bd6ecf170f3	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	401	f	\N	{"code": "178091", "workEmail": "ghizlane.emp@radiant.com"}	Invalid or expired code	::1	curl/8.18.0	12	2026-06-08 15:14:57.496612+05:30
cf9a4252-59bc-46b6-a6e0-439baaf9c974	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "123456", "workEmail": "ghizlane.emp@radiant.com"}	\N	::1	node	33	2026-06-08 15:16:22.808581+05:30
ea8250d0-27dc-4808-99f7-9d235c8e5478	CREATE	PaymentTypes	6d850ccc-6ac1-4015-b4ba-968422dc3417	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "REIMBURSEMENT", "name": "Reimbursements", "isActive": true, "direction": "OUTGOING", "description": "Reimbursements", "isBatchBased": true, "makerRoleIds": ["3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf"], "checkerRoleId": "0385aa54-b00a-4e55-a9d8-f35ef42568fc", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": false, "paymentCategoryId": "78a18613-1e96-45db-a3ed-3a7cdfaca411", "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	18	2026-06-08 15:17:27.921276+05:30
c025d4ec-9940-4405-ab1e-60d9d1d03829	CREATE	ApprovalMatrices	71d4b189-7034-41e2-8d23-daca356dbfca	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "Reimbursements", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "effectiveTo": "2026-06-16", "effectiveFrom": "2026-06-08", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	28	2026-06-08 15:17:27.987775+05:30
28ab66e2-c771-43de-9e45-9c0a102490bb	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	1152	2026-06-08 15:18:38.559859+05:30
3b7c88c8-a950-46a2-8375-3d73375d6037	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	385	2026-06-08 15:18:41.065579+05:30
b5713b9d-9130-4b1a-a900-166020c85488	CREATE	BeneficiaryAccounts	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests	400	f	\N	{"documents": [{"code": "CANCELLED_CHEQUE", "label": "Cancelled cheque / bank letter", "fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780912117423-240790.pdf", "fileName": "Payments Authority Matrix - Radiant (1) (1).pdf"}, {"code": "COUNTERPARTY_LETTER", "label": "Counterparty letter", "fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780912120663-948428.pdf", "fileName": "Payments Authority Matrix - Radiant (1) (1).pdf"}], "changeType": "ADD", "proposedData": {"bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "swiftBic": "HDFC0002805", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "branchName": "Vidyavihar", "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "accountNumber": "50100000000001", "accountDirection": "PAY_TO", "accountHolderName": "Sonal"}}	ADD: proposedData must include exactly one of counterpartyId / employeeId	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	10	2026-06-08 15:19:06.855523+05:30
6a5e6fad-51d4-42af-a73e-2d4d5603aaed	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	958	2026-06-08 15:20:06.184536+05:30
9f7c0f07-2681-486e-8a3d-174fb89195b0	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests	201	t	\N	{"documents": [{"code": "CANCELLED_CHEQUE", "label": "Cancelled cheque / bank letter", "fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780912205228-979044.pdf", "fileName": "SOW_Payments_Control_System.pdf"}, {"code": "COUNTERPARTY_LETTER", "label": "Counterparty letter", "fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780912210368-609897.pdf", "fileName": "SOW_Payments_Control_System.pdf"}], "changeType": "ADD", "proposedData": {"bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "swiftBic": "HDFC0002805", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "branchName": "Vidyavihar", "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "employeeId": "6c911f01-c555-46d7-85c2-96649ae503e0", "accountNumber": "50100000000001", "accountDirection": "PAY_TO", "accountHolderName": "Sonal"}}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	13	2026-06-08 15:20:18.765369+05:30
f1ad1e5a-44f2-407f-8507-e91436964b40	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/verify	403	f	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"callbackEvidence": "hen, with whom, what was confirmed).\\n\\nVerification notes", "verificationNotes": "ewrqwrqrv "}	The user who raised the change request cannot verify it.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	34	2026-06-08 15:20:38.461515+05:30
2809e9d7-e090-4f73-84f8-611c9cdd87c9	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/verify	403	f	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"callbackEvidence": "hen, with whom, what was confirmed).\\n\\nVerification notes", "verificationNotes": "ewrqwrqrv "}	The user who raised the change request cannot verify it.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	7	2026-06-08 15:20:40.776375+05:30
8b6a59df-3f7c-4347-9cac-2bb88db4c9d4	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	385	2026-06-08 15:22:22.427725+05:30
cb62cb6f-9624-4168-9725-64032c9a3459	LOGIN	Auth	08201732-f2d9-4568-869d-cd3627bc7484	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "rohit@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	400	2026-06-08 15:23:10.455746+05:30
c670f9cc-6d1a-408e-897e-218bac1127a8	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/verify	201	t	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"callbackEvidence": "who when dsda", "verificationNotes": "wqeqEW"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	45	2026-06-08 15:23:42.698559+05:30
17edfb04-5801-444c-8d66-49e8be117fe5	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/approve	500	f	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"coolingOffOverride": true, "coolingOffOverrideReason": "ASDQWDQWD"}	insert or update on table "beneficiary_accounts" violates foreign key constraint "beneficiary_accounts_employee_id_fkey"	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	52	2026-06-08 15:23:49.683347+05:30
d4a5c1bf-d1ea-446a-b45d-dd02d082ee3a	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/approve	500	f	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"coolingOffOverride": true, "coolingOffOverrideReason": "URGENT PAYme dwe"}	insert or update on table "beneficiary_accounts" violates foreign key constraint "beneficiary_accounts_employee_id_fkey"	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	43	2026-06-08 15:24:09.028362+05:30
68df9601-c6d2-4c44-b3ba-386a03850c30	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/approve	500	f	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"coolingOffOverride": true, "coolingOffOverrideReason": "dfsdfda"}	insert or update on table "beneficiary_accounts" violates foreign key constraint "beneficiary_accounts_employee_id_fkey"	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	40	2026-06-08 15:24:33.465097+05:30
292a7f5c-ccde-4929-8512-f2b934baff4f	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/approve	400	f	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"coolingOffOverride": true, "coolingOffOverrideReason": ""}	Cooling-off override requires a reason.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	37	2026-06-08 15:27:44.604235+05:30
8cb4335a-80d3-44b2-817a-91ddac5836a6	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/approve	500	f	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"coolingOffOverride": true, "coolingOffOverrideReason": "zxassa"}	insert or update on table "beneficiary_accounts" violates foreign key constraint "beneficiary_accounts_employee_id_fkey"	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	76	2026-06-08 15:27:48.261668+05:30
53340635-c4f9-4b01-8006-7478a8016ded	CREATE	BeneficiaryAccounts	f6b6f00a-a4ab-4047-a022-71fa06ee9589	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/beneficiary-accounts/change-requests/f6b6f00a-a4ab-4047-a022-71fa06ee9589/approve	201	t	{"id": "f6b6f00a-a4ab-4047-a022-71fa06ee9589"}	{"coolingOffOverride": true, "coolingOffOverrideReason": "fgdyshgdsjkh"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	83	2026-06-08 15:33:27.948575+05:30
da0d9669-d6ac-4b09-90bc-6b96581b291b	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	467	2026-06-08 15:33:57.803196+05:30
92fe3c17-637c-4332-9e62-44434a7e1c63	CREATE	EmployeePortal	c5c1bf1b-2967-4829-8554-4c99c36ef704	2da2e451-6c99-42a2-9439-f08b6b9c8d1b	\N	POST	/api/v1/employee/payment-requests	201	t	\N	{"amount": "100.0000", "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "bdc51ca6-b206-4c5c-9203-11471ed81b9f", "purposeDescription": "verify fix"}	\N	::1	node	111	2026-06-08 15:36:35.35782+05:30
e24d687c-5b87-492d-a5df-7a136adc2942	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2391	2026-06-08 15:41:42.187511+05:30
5f08d3f3-59e8-443e-a8fc-7ceb8c61622c	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	403	f	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913037345-873072.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	This payment type is not available for self-service.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	8	2026-06-08 15:34:00.838446+05:30
eab23eb7-681b-4d41-9813-189968a886b1	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	403	f	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913037345-873072.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	This payment type is not available for self-service.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	8	2026-06-08 15:34:04.554263+05:30
3ac66784-29d3-49b9-8917-dc62ccf796c8	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	403	f	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913037345-873072.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	This payment type is not available for self-service.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	6	2026-06-08 15:34:05.618365+05:30
1fb04050-3a5d-426e-bf69-97572b0da02b	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	403	f	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913037345-873072.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	This payment type is not available for self-service.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3	2026-06-08 15:34:06.416261+05:30
958b92ff-7304-4957-b07d-3240cf32bc94	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	403	f	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913037345-873072.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	This payment type is not available for self-service.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-08 15:34:06.751162+05:30
242d050f-4d10-4d94-96d6-081268432cab	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	403	f	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913037345-873072.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	This payment type is not available for self-service.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	4	2026-06-08 15:34:06.973969+05:30
88799d85-711e-49b8-94b1-59461996d0ec	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	403	f	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913037345-873072.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	This payment type is not available for self-service.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-08 15:34:07.190969+05:30
c3d8ab86-5e11-43f4-90f6-07bb9ba3f111	CREATE	EmployeePortal	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	403	f	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913037345-873072.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	This payment type is not available for self-service.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	2	2026-06-08 15:34:15.529342+05:30
e6724065-ea4c-45fc-9bd8-f577b6d691ad	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3747	2026-06-08 15:34:56.568531+05:30
b87ee96a-64e5-4e76-9004-2220ad016978	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "188669", "workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	55	2026-06-08 15:35:15.109036+05:30
bf8e2dd8-3798-46a3-bb3e-cf1b1fde1d68	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "123456", "workEmail": "ghizlane.emp@radiant.com"}	\N	::1	node	188	2026-06-08 15:36:35.173858+05:30
050d3d77-e8af-409c-9c3d-69e51d29b75e	CREATE	EmployeePortal	63d958bc-8a19-465d-b615-96ab7d781a51	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests	201	t	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913499807-41600.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "SOW_Payments_Control_System.pdf", "fileSizeBytes": 341029}], "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "purposeDescription": "client dinner", "beneficiaryAccountId": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	53	2026-06-08 15:41:43.53764+05:30
d7cc358f-2d86-49db-b390-af5d454a1315	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "123456", "workEmail": "sonal@firsteconomy.com"}	\N	::1	node	8	2026-06-08 15:44:31.935729+05:30
4699675d-927e-47e7-a635-a7bf44de172b	LOGIN	Auth	08201732-f2d9-4568-869d-cd3627bc7484	08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "rohit@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	528	2026-06-08 15:44:47.356949+05:30
31ac80d8-57a8-4263-8985-f599b4c24d32	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	399	2026-06-08 15:45:01.132927+05:30
db160742-9b8a-4f96-86c7-ed754560e146	LOGIN	Auth	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ankita@firsteconomy.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	507	2026-06-08 15:46:02.830111+05:30
5014b6e7-52a2-44a6-a3b7-c940b4900358	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "123456", "workEmail": "sonal@firsteconomy.com"}	\N	::1	node	82	2026-06-08 15:48:50.872669+05:30
857f203b-9a25-4524-a7e7-4fbb1ad0dd51	SUBMIT	EmployeePortal	63d958bc-8a19-465d-b615-96ab7d781a51	0da474d7-d748-4795-bb34-0fa2c05f61a0	\N	POST	/api/v1/employee/payment-requests/63d958bc-8a19-465d-b615-96ab7d781a51/submit	201	t	{"id": "63d958bc-8a19-465d-b615-96ab7d781a51"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	90	2026-06-08 15:50:31.749536+05:30
d752d2b6-e906-4c67-a573-3ce343d89e20	APPROVE	PaymentRequests	63d958bc-8a19-465d-b615-96ab7d781a51	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests/63d958bc-8a19-465d-b615-96ab7d781a51/approve	400	f	{"id": "63d958bc-8a19-465d-b615-96ab7d781a51"}	{"comments": "testing"}	No active approval matrix found for this payment type and currency. Please create an approval matrix under Masters → Approval Matrices before approving.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	29	2026-06-08 15:50:50.767093+05:30
856c6041-371a-4286-9a61-853af2ee3476	APPROVE	PaymentRequests	63d958bc-8a19-465d-b615-96ab7d781a51	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests/63d958bc-8a19-465d-b615-96ab7d781a51/approve	400	f	{"id": "63d958bc-8a19-465d-b615-96ab7d781a51"}	{"comments": "testing"}	No active approval matrix found for this payment type and currency. Please create an approval matrix under Masters → Approval Matrices before approving.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	32	2026-06-08 15:51:15.477479+05:30
ef7b638a-4e97-44b0-97c4-13a2619629e3	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "123456", "workEmail": "sonal@firsteconomy.com"}	\N	::1	node	27	2026-06-08 15:58:24.235469+05:30
523b33d8-fdde-496b-8de6-38175b47636d	APPROVE	PaymentRequests	63d958bc-8a19-465d-b615-96ab7d781a51	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests/63d958bc-8a19-465d-b615-96ab7d781a51/approve	400	f	{"id": "63d958bc-8a19-465d-b615-96ab7d781a51"}	{"comments": "dfsdfas"}	No active approval matrix found for this payment type and currency. Please create an approval matrix under Masters → Approval Matrices before approving.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	17	2026-06-08 16:00:46.417015+05:30
c7468bc8-ad4d-45d0-9351-963f32a37588	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	425	2026-06-08 16:17:45.833705+05:30
387451d0-d983-4e4e-941f-dff2d3f5c0fb	UPDATE	PaymentTypes	6d850ccc-6ac1-4015-b4ba-968422dc3417	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/payment-types/6d850ccc-6ac1-4015-b4ba-968422dc3417	200	t	{"id": "6d850ccc-6ac1-4015-b4ba-968422dc3417"}	{"code": "REIMBURSEMENT", "name": "Reimbursements", "isActive": true, "direction": "OUTGOING", "description": "Reimbursements", "isBatchBased": false, "makerRoleIds": ["3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf"], "checkerRoleId": "0385aa54-b00a-4e55-a9d8-f35ef42568fc", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": false, "paymentCategoryId": "78a18613-1e96-45db-a3ed-3a7cdfaca411", "allowsCrossCurrency": false, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	46	2026-06-08 16:18:25.326411+05:30
455e8570-da7e-431a-bf7f-add4178506ec	UPDATE	ApprovalMatrices	71d4b189-7034-41e2-8d23-daca356dbfca	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/71d4b189-7034-41e2-8d23-daca356dbfca	200	t	{"id": "71d4b189-7034-41e2-8d23-daca356dbfca"}	{"name": "Reimbursements", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "effectiveTo": "2026-06-16", "effectiveFrom": "2026-06-08", "paymentTypeId": "6d850ccc-6ac1-4015-b4ba-968422dc3417", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	52	2026-06-08 16:18:25.456884+05:30
a60a9eff-4d77-467a-93dd-d2476cfcc296	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3165	2026-06-08 16:22:10.122017+05:30
17a5571d-1da7-45bd-81a8-6c71f90963d3	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "826353", "workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	60	2026-06-08 16:24:33.840747+05:30
c81d115e-4d12-4405-90fc-2a9f87ad0b7f	LOGIN	Auth	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ankita@firsteconomy.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	386	2026-06-08 16:30:35.222905+05:30
fef2c574-178e-45ce-8da0-3199bbd9914d	APPROVE	PaymentRequests	63d958bc-8a19-465d-b615-96ab7d781a51	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests/63d958bc-8a19-465d-b615-96ab7d781a51/approve	400	f	{"id": "63d958bc-8a19-465d-b615-96ab7d781a51"}	{"comments": "nbbn"}	No active approval matrix found for this payment type and currency. Please create an approval matrix under Masters → Approval Matrices before approving.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	21	2026-06-08 16:30:46.080868+05:30
6cb07fe5-acc1-413f-bd14-a07e193f99ff	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	3104	2026-06-08 16:36:30.760396+05:30
d5d6e921-aa8f-41ff-bb70-b447ef2d4506	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "249101", "workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	56	2026-06-08 16:36:53.965617+05:30
176a5b60-6417-44ba-b37e-487f2f9f64a2	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	365	2026-06-08 16:37:18.55309+05:30
9c342f1f-c22b-4cb9-ba49-e60518721af9	LOGIN	Auth	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ankita@firsteconomy.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	456	2026-06-08 16:39:44.893879+05:30
96d3e0e5-d602-4858-a8e9-0d503ba6ea46	APPROVE	PaymentRequests	63d958bc-8a19-465d-b615-96ab7d781a51	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests/63d958bc-8a19-465d-b615-96ab7d781a51/approve	201	t	{"id": "63d958bc-8a19-465d-b615-96ab7d781a51"}	{"comments": "m,nkj"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	115	2026-06-08 16:39:52.428364+05:30
80ed99d3-44b9-4a46-aa48-7d786af574ce	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	375	2026-06-08 16:41:35.820934+05:30
0c835b55-ae16-43ae-8e6f-0f4625af3393	CREATE	PaymentTypes	9605ab99-8afa-48d5-984c-8ace3f06fbe7	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "OFFICE_AND_OTHER_UTILITIES", "name": "Office and other utility payments", "isActive": true, "direction": "OUTGOING", "description": "Office and other utility payments", "isBatchBased": false, "makerRoleIds": ["64424fa9-5141-49d7-84c8-f2b10feeec22"], "checkerRoleId": "81c68ec5-f574-4031-b9dd-a93a42ef108d", "legalEntityId": "1de67104-b600-4332-9b9a-f15ca75998c3", "isConfidential": false, "paymentCategoryId": "80a96bf9-5c86-4d1e-9cce-e082ffa21fa8", "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	29	2026-06-08 16:45:43.676546+05:30
c824950f-730f-4932-ac8c-a75baaa8063c	CREATE	ApprovalMatrices	798524d7-72cc-4844-966f-dda467e4931c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "Office and other utility payments", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "29b1615c-4272-4c8b-9a20-f6b5c9e653da"}], "maxAmount": 10000, "minAmount": 0}, {"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c"}], "maxAmount": null, "minAmount": 10001}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "effectiveFrom": "2026-06-08", "paymentTypeId": "9605ab99-8afa-48d5-984c-8ace3f06fbe7", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	54	2026-06-08 16:45:43.809287+05:30
e9a02639-c285-4551-b8d2-1b09374aeafa	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	391	2026-06-08 16:46:08.324221+05:30
a4cbce19-6bcd-48ff-bbb9-85239ce34e28	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	633	2026-06-08 16:46:48.539749+05:30
bf5ed059-ac85-437e-9660-b242e749dfd1	CREATE	PaymentRequests	66fc1db1-f0ad-4e88-9998-fa8f54d7e3af	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "1000", "dueDate": "2026-06-09", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780917407903-116300.pdf", "fileName": "Payments Authority Matrix - Radiant (1) (1).pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "invoiceNumber": "INV-2203", "paymentTypeId": "9605ab99-8afa-48d5-984c-8ace3f06fbe7", "counterpartyId": "f074196f-049f-4deb-a331-aee61df80d59", "sourceAccountId": "2d19213d-76e1-4683-8c62-a762ae3c7e3c", "purposeDescription": "ewr", "beneficiaryAccountId": "dc9edb0c-1c51-4633-9abc-d0e613f6cc04"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	167	2026-06-08 16:46:52.632441+05:30
83fd12ed-febd-4ac4-b535-bf3e0ff51e9f	SUBMIT	PaymentRequests	66fc1db1-f0ad-4e88-9998-fa8f54d7e3af	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/66fc1db1-f0ad-4e88-9998-fa8f54d7e3af/submit	201	t	{"id": "66fc1db1-f0ad-4e88-9998-fa8f54d7e3af"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	41	2026-06-08 16:46:59.778869+05:30
8ad63297-23ee-4c4e-82ea-3ae27ba6aac3	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::ffff:127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	413	2026-06-08 16:47:11.465395+05:30
ddf81421-0f6f-464e-98f8-560eaa0f0fe3	APPROVE	PaymentRequests	66fc1db1-f0ad-4e88-9998-fa8f54d7e3af	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/66fc1db1-f0ad-4e88-9998-fa8f54d7e3af/approve	201	t	{"id": "66fc1db1-f0ad-4e88-9998-fa8f54d7e3af"}	{"comments": "ewr"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	126	2026-06-08 16:47:20.538249+05:30
26f991f6-49a8-470e-b030-a8b9a2f09530	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	390	2026-06-08 16:47:42.604492+05:30
7bd34e0b-a7d2-4353-9a4a-99fd8ddb91b7	APPROVE	PaymentRequests	66fc1db1-f0ad-4e88-9998-fa8f54d7e3af	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/66fc1db1-f0ad-4e88-9998-fa8f54d7e3af/approve	201	t	{"id": "66fc1db1-f0ad-4e88-9998-fa8f54d7e3af"}	{"comments": "erwarwq"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	67	2026-06-08 16:47:49.743947+05:30
2de6edb1-cacb-4082-80b2-22a98f453017	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	430	2026-06-08 16:48:42.383963+05:30
\.


--
-- Data for Name: balance_changes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.balance_changes (id, account_id, kind, previous_balance, new_balance, delta, reason, payment_request_id, receipt_id, statement_upload_id, changed_by, created_at) FROM stdin;
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_accounts (id, bank_id, bank_nickname, currency_id, account_type_id, account_number, branch_name, branch_code, opening_balance, minimum_balance, is_chairman_designated, is_active, created_at, updated_at, deleted_at, created_by, updated_by, bank_name, is_counterparty, remaining_balance, counterparty_id) FROM stdin;
091f5834-2623-468f-9963-8e10ec1ef255	4b8ac2d1-2422-484c-ae7f-d5c284a3dbd6	JPMC - US Trade	69d86cc6-7d2b-4977-b579-62dbcbe56760	8dbde40f-c755-4e27-8b41-3050c0f8e0af	000123456789	New York Main Branch	\N	2000000.0000	50000.0000	f	t	2026-06-04 15:53:24.583283+05:30	2026-06-04 16:00:31.005876+05:30	\N	\N	\N	\N	f	2000000.0000	\N
0f2cf8f9-ae3b-42ca-bbef-b7912fc8d3f1	dd4aaaef-0027-49de-8a0a-dabd7c945b82	UBS - Geneva	1324a9b2-4915-4b98-b1f5-4077456addf8	8dbde40f-c755-4e27-8b41-3050c0f8e0af	0023456789	Geneva Main Branch	\N	1000000.0000	50000.0000	f	t	2026-06-04 15:53:24.583283+05:30	2026-06-04 16:00:31.005876+05:30	\N	\N	\N	\N	f	1000000.0000	\N
8d7ca822-e714-4838-af9f-f59aa98a6e08	63b42e3b-4b8a-457e-96a4-51828dda0bc7	ENBD - DXB Ops	69d86cc6-7d2b-4977-b579-62dbcbe56760	8dbde40f-c755-4e27-8b41-3050c0f8e0af	1015400987654	Dubai Main Branch	\N	3000000.0000	100000.0000	f	t	2026-06-04 15:53:24.583283+05:30	2026-06-04 17:18:04.807455+05:30	\N	\N	\N	\N	f	2999500.0000	\N
5dd8d08c-039a-46e9-9634-bad63547fa4c	8cbb0f09-3024-4658-8d1b-cae2e1d6df3a	DBS - SG Trade	69d86cc6-7d2b-4977-b579-62dbcbe56760	8dbde40f-c755-4e27-8b41-3050c0f8e0af	0012345678	Singapore Main Branch	\N	2500000.0000	50000.0000	f	t	2026-06-04 15:53:24.583283+05:30	2026-06-08 10:53:19.270104+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	f	2500000.0000	\N
84bef48c-ec28-4437-a2db-e9b536c09a73	29f69c65-6551-4158-a3da-ce33167d813f	BARC - UK Ops	ff0ea523-3dd5-4256-be64-13b191fc043f	8dbde40f-c755-4e27-8b41-3050c0f8e0af	20000012345678	London Main Branch	\N	1500000.0000	50000.0000	f	t	2026-06-04 15:53:24.583283+05:30	2026-06-08 10:53:26.31086+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	f	1500000.0000	\N
2d19213d-76e1-4683-8c62-a762ae3c7e3c	2cc9362c-01e1-4126-a248-94b863f940f8	 HDFC – India Ops	69d86cc6-7d2b-4977-b579-62dbcbe56760	8dbde40f-c755-4e27-8b41-3050c0f8e0af	50100123456789	Mumbai Main Branch	HDFC0007811	5000000.0000	100000.0000	f	t	2026-06-04 15:52:23.046894+05:30	2026-06-08 13:09:10.00415+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	f	4988000.0000	\N
\.


--
-- Data for Name: bank_statement_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_statement_lines (id, statement_upload_id, bank_account_id, line_index, value_date, posting_date, direction, amount, currency_code, bank_reference, counterparty_text, narrative, running_balance, match_status, matched_payment_request_id, matched_incoming_receipt_id, match_score, match_reason, matched_at, matched_by, exception_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bank_statement_uploads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_statement_uploads (id, bank_account_id, statement_date, opening_balance, closing_balance, file_url, row_count, notes, ingestion_status, ingestion_format, ingestion_error, auto_match_completed_at, matched_count, candidate_count, exception_count, uploaded_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: banks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.banks (id, name, short_name, country_id, swift_bic, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_counterparty) FROM stdin;
2cc9362c-01e1-4126-a248-94b863f940f8	HDFC Bank	HDFC	97cddc42-776c-4c99-89e8-5e374808b560	HDFCINBB	t	2026-06-04 15:46:59.781024+05:30	2026-06-04 15:46:59.781024+05:30	\N	\N	\N	f
4b8ac2d1-2422-484c-ae7f-d5c284a3dbd6	JPMorgan Chase	JPMC	74f30660-cea8-467f-a2ed-55a8814488ab	CHASUS33	t	2026-06-04 15:46:59.781024+05:30	2026-06-04 15:46:59.781024+05:30	\N	\N	\N	f
63b42e3b-4b8a-457e-96a4-51828dda0bc7	Emirates NBD	ENBD	2b4761a9-c08f-48d5-9ad5-93685b76471b	EBILAEAD	t	2026-06-04 15:46:59.781024+05:30	2026-06-04 15:46:59.781024+05:30	\N	\N	\N	f
8cbb0f09-3024-4658-8d1b-cae2e1d6df3a	DBS Bank	DBS	d7de565f-53d7-4d78-b998-0b9bec89d862	DBSSSGSG	t	2026-06-04 15:46:59.781024+05:30	2026-06-04 15:46:59.781024+05:30	\N	\N	\N	f
29f69c65-6551-4158-a3da-ce33167d813f	Barclays Bank	BARC	71c403a2-07be-4447-92d7-0a1a35459c7c	BARCGB22	t	2026-06-04 15:46:59.781024+05:30	2026-06-04 15:46:59.781024+05:30	\N	\N	\N	f
dd4aaaef-0027-49de-8a0a-dabd7c945b82	UBS Switzerland	UBS	3e7296cb-d6b7-4311-8a9f-1551450fbf14	UBSWCHZH80A	t	2026-06-04 15:46:59.781024+05:30	2026-06-04 15:46:59.781024+05:30	\N	\N	\N	f
\.


--
-- Data for Name: beneficiary_account_change_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.beneficiary_account_change_requests (id, beneficiary_account_id, change_type, proposed_data, documents, status, requested_by, requested_at, verified_by, verified_at, verification_notes, callback_evidence, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, cooling_off_override, cooling_off_override_reason, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
f6b6f00a-a4ab-4047-a022-71fa06ee9589	c90a4e9a-8f75-47db-b762-d0b05e4be5bb	ADD	{"bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "swiftBic": "HDFC0002805", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "branchName": "Vidyavihar", "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "employeeId": "0da474d7-d748-4795-bb34-0fa2c05f61a0", "accountNumber": "50100000000001", "accountDirection": "PAY_TO", "accountHolderName": "Sonal"}	[{"code": "CANCELLED_CHEQUE", "label": "Cancelled cheque / bank letter", "fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780912205228-979044.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": null}, {"code": "COUNTERPARTY_LETTER", "label": "Counterparty letter", "fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780912210368-609897.pdf", "fileName": "SOW_Payments_Control_System.pdf", "mimeType": null}]	APPROVED	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-08 15:20:18.75+05:30	08201732-f2d9-4568-869d-cd3627bc7484	2026-06-08 15:23:42.67+05:30	wqeqEW	who when dsda	\N	2026-06-08 15:33:27.895+05:30	\N	\N	\N	t	fgdyshgdsjkh	2026-06-08 15:20:18.751073+05:30	2026-06-08 15:33:27.895183+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	08201732-f2d9-4568-869d-cd3627bc7484
\.


--
-- Data for Name: beneficiary_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.beneficiary_accounts (id, counterparty_id, employee_id, account_holder_name, account_number, bank_id, branch_name, swift_bic, iban, currency_id, country_id, account_direction, status, cooling_off_until, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
bf480d61-b059-4e2a-8f62-09f0a795431a	\N	94a6e00e-ff36-41c2-863f-f76d73f6b86c	Shivam	50300999888777	2cc9362c-01e1-4126-a248-94b863f940f8	Mumbai Main Branch	HDFCINBB	\N	69d86cc6-7d2b-4977-b579-62dbcbe56760	97cddc42-776c-4c99-89e8-5e374808b560	PAY_TO	ACTIVE	2026-06-03 15:55:05.900864+05:30	2026-06-04 15:55:05.900864+05:30	2026-06-04 15:59:33.155072+05:30	\N	\N	\N
dc9edb0c-1c51-4633-9abc-d0e613f6cc04	f074196f-049f-4deb-a331-aee61df80d59	\N	Acme Supplies Pvt Ltd	50200111222333	2cc9362c-01e1-4126-a248-94b863f940f8	Mumbai Main Branch	HDFCINBB	\N	69d86cc6-7d2b-4977-b579-62dbcbe56760	97cddc42-776c-4c99-89e8-5e374808b560	PAY_TO	ACTIVE	2026-06-03 15:55:05.900864+05:30	2026-06-04 15:55:05.900864+05:30	2026-06-04 15:59:33.155072+05:30	\N	\N	\N
011e776a-3486-4983-9442-99fe67e9aa9a	78929b22-17bd-49c4-af3f-df4b91ecc9eb	\N	Meridian Commodities Inc	000987654321	4b8ac2d1-2422-484c-ae7f-d5c284a3dbd6	New York Main Branch	CHASUS33	\N	69d86cc6-7d2b-4977-b579-62dbcbe56760	74f30660-cea8-467f-a2ed-55a8814488ab	PAY_TO	ACTIVE	2026-06-03 15:55:05.900864+05:30	2026-06-04 15:55:05.900864+05:30	2026-06-04 15:59:33.155072+05:30	\N	\N	\N
6c911f01-c555-46d7-85c2-96649ae503e5	\N	251075c6-9b7f-43c6-b325-42ccb5249aba	Venessa	1019876543210	63b42e3b-4b8a-457e-96a4-51828dda0bc7	Dubai Main Branch	EBILAEAD	\N	69d86cc6-7d2b-4977-b579-62dbcbe56760	2b4761a9-c08f-48d5-9ad5-93685b76471b	PAY_TO	ACTIVE	2026-06-03 15:55:05.900864+05:30	2026-06-04 15:55:05.900864+05:30	2026-06-04 15:59:33.155072+05:30	\N	\N	\N
ba05219b-2c85-4dee-99d4-3483796e3306	c54f7aa8-b944-4a01-acb5-54bfcc1aa59c	\N	Gulf Trade Partners LLC	1011223344556	63b42e3b-4b8a-457e-96a4-51828dda0bc7	Dubai Main Branch	EBILAEAD	\N	69d86cc6-7d2b-4977-b579-62dbcbe56760	2b4761a9-c08f-48d5-9ad5-93685b76471b	PAY_TO	ACTIVE	2026-06-03 15:55:05.900864+05:30	2026-06-04 15:55:05.900864+05:30	2026-06-04 15:59:33.155072+05:30	\N	\N	\N
d297dfdd-cecb-4f2f-8c61-114d23490d78	9460c88b-b10b-465a-bc87-3d8613469184	\N	Asia Metals Pte Ltd	0019998887	8cbb0f09-3024-4658-8d1b-cae2e1d6df3a	Singapore Main Branch	DBSSSGSG	\N	69d86cc6-7d2b-4977-b579-62dbcbe56760	d7de565f-53d7-4d78-b998-0b9bec89d862	PAY_TO	ACTIVE	2026-06-03 15:55:05.900864+05:30	2026-06-04 15:55:05.900864+05:30	2026-06-04 15:59:33.155072+05:30	\N	\N	\N
c90a4e9a-8f75-47db-b762-d0b05e4be5bb	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	Sonal	50100000000001	2cc9362c-01e1-4126-a248-94b863f940f8	Vidyavihar	HDFC0002805	\N	3bfc821c-ff8e-463a-b20d-2fac66932aa2	97cddc42-776c-4c99-89e8-5e374808b560	PAY_TO	ACTIVE	\N	2026-06-08 15:33:27.895183+05:30	2026-06-08 15:33:27.895183+05:30	\N	08201732-f2d9-4568-869d-cd3627bc7484	08201732-f2d9-4568-869d-cd3627bc7484
\.


--
-- Data for Name: counterparties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.counterparties (id, code, name, legal_name, role, country_id, country_code, tax_identifiers, addresses, primary_contact_name, primary_contact_email, primary_contact_phone, notes, is_active, created_at, updated_at, deleted_at, created_by, updated_by, kyc_done) FROM stdin;
f074196f-049f-4deb-a331-aee61df80d59	CP-0001	 Acme Supplies Pvt Ltd	 Acme Supplies Pvt Ltd	VENDOR	97cddc42-776c-4c99-89e8-5e374808b560	\N	[]	[]	Sonal Tamboli	sonal@firsteconomy.com	9876543210	\N	t	2026-06-04 15:48:45.46601+05:30	2026-06-04 15:48:45.46601+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	t
78929b22-17bd-49c4-af3f-df4b91ecc9eb	CP-0004	Meridian Commodities Inc	Meridian Commodities Inc	BOTH	74f30660-cea8-467f-a2ed-55a8814488ab	US	[]	[]	\N	\N	\N	\N	t	2026-06-04 15:49:12.77906+05:30	2026-06-04 16:24:14.537885+05:30	\N	\N	\N	t
c54f7aa8-b944-4a01-acb5-54bfcc1aa59c	CP-0002	Gulf Trade Partners LLC	Gulf Trade Partners LLC	VENDOR	2b4761a9-c08f-48d5-9ad5-93685b76471b	AE	[]	[]	\N	\N	\N	\N	t	2026-06-04 15:49:12.77906+05:30	2026-06-04 16:24:14.537885+05:30	\N	\N	\N	t
9460c88b-b10b-465a-bc87-3d8613469184	CP-0003	Asia Metals Pte Ltd	Asia Metals Pte Ltd	VENDOR	d7de565f-53d7-4d78-b998-0b9bec89d862	SG	[]	[]	\N	\N	\N	\N	t	2026-06-04 15:49:12.77906+05:30	2026-06-04 16:24:14.537885+05:30	\N	\N	\N	t
06a41aa6-ffba-4566-8bf2-8662bc06dcdb	CP-0006	Britannia Logistics Ltd	Britannia Logistics Ltd	VENDOR	71c403a2-07be-4447-92d7-0a1a35459c7c	GB	[]	[]	\N	\N	\N	\N	t	2026-06-04 15:49:12.77906+05:30	2026-06-04 16:24:14.537885+05:30	\N	\N	\N	t
2d47c9ab-2643-47e3-8fa9-ea735137c76c	CP-0005	Helvetia Trade Finance AG	Helvetia Trade Finance AG	VENDOR	3e7296cb-d6b7-4311-8a9f-1551450fbf14	CH	[]	[]	\N	\N	\N	\N	t	2026-06-04 15:49:12.77906+05:30	2026-06-04 16:24:14.537885+05:30	\N	\N	\N	t
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.countries (id, country_name, country_short_name, code, currency_id, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_sanctioned) FROM stdin;
97cddc42-776c-4c99-89e8-5e374808b560	India	IND	IN	3bfc821c-ff8e-463a-b20d-2fac66932aa2	t	2026-06-04 15:25:49.25726+05:30	2026-06-04 15:25:49.25726+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	f
74f30660-cea8-467f-a2ed-55a8814488ab	United States	USA	US	69d86cc6-7d2b-4977-b579-62dbcbe56760	t	2026-06-04 15:27:01.498864+05:30	2026-06-04 15:27:01.498864+05:30	\N	\N	\N	f
2b4761a9-c08f-48d5-9ad5-93685b76471b	United Arab Emirates	UAE	AE	aaeb6da9-336e-47f2-a034-c3944780f05c	t	2026-06-04 15:27:01.498864+05:30	2026-06-04 15:27:01.498864+05:30	\N	\N	\N	f
d7de565f-53d7-4d78-b998-0b9bec89d862	Singapore	SGP	SG	5f5322a7-6bc1-4726-9796-9e610f766575	t	2026-06-04 15:27:01.498864+05:30	2026-06-04 15:27:01.498864+05:30	\N	\N	\N	f
71c403a2-07be-4447-92d7-0a1a35459c7c	United Kingdom	UK	GB	ff0ea523-3dd5-4256-be64-13b191fc043f	t	2026-06-04 15:27:01.498864+05:30	2026-06-04 15:27:01.498864+05:30	\N	\N	\N	f
3e7296cb-d6b7-4311-8a9f-1551450fbf14	Switzerland	CHE	CH	1324a9b2-4915-4b98-b1f5-4077456addf8	t	2026-06-04 15:27:01.498864+05:30	2026-06-04 15:27:01.498864+05:30	\N	\N	\N	f
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currencies (id, code, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
69d86cc6-7d2b-4977-b579-62dbcbe56760	USD	US Dollar	t	2026-06-04 15:21:57.004009+05:30	2026-06-04 15:57:55.474952+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
3bfc821c-ff8e-463a-b20d-2fac66932aa2	INR	Indian Rupee	t	2026-06-04 15:22:10.889482+05:30	2026-06-04 15:57:55.474952+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
aaeb6da9-336e-47f2-a034-c3944780f05c	AED	UAE Dirham	t	2026-06-04 15:22:23.090933+05:30	2026-06-04 15:57:55.474952+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
5f5322a7-6bc1-4726-9796-9e610f766575	SGD	Singapore Dollar	t	2026-06-04 15:22:41.152863+05:30	2026-06-04 15:57:55.474952+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
ff0ea523-3dd5-4256-be64-13b191fc043f	GBP	British Pound	t	2026-06-04 15:22:50.644932+05:30	2026-06-04 15:57:55.474952+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
1324a9b2-4915-4b98-b1f5-4077456addf8	CHF	Swiss Franc	t	2026-06-04 15:25:15.009974+05:30	2026-06-04 15:57:55.474952+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
\.


--
-- Data for Name: employee_login_otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_login_otps (id, employee_id, code_hash, expires_at, consumed_at, attempts, created_at) FROM stdin;
696c846a-2d58-4baa-8239-14602d40a7c9	0da474d7-d748-4795-bb34-0fa2c05f61a0	2eef6c135428994d17fea287d54d89e28aad762794d78853e108d82b0d2cc8be	2026-06-08 13:47:40.938+05:30	2026-06-08 13:48:34.575+05:30	0	2026-06-08 13:37:40.951555+05:30
632fe9cf-b236-47f3-b645-fd4bb0c67e77	0da474d7-d748-4795-bb34-0fa2c05f61a0	103cb9288ebf266d5a14fc6a5f8887ef0f9c591291067fdcc2dd481253f0fa9b	2026-06-08 13:58:34.575+05:30	2026-06-08 13:48:58.022+05:30	0	2026-06-08 13:48:34.59299+05:30
83ac3db9-9c54-4361-85bf-433f1465064a	0da474d7-d748-4795-bb34-0fa2c05f61a0	f5c3fc2edd1ed19c1b1123a80ee5fea508a278a67bc4e04426c68cc38ddb019b	2026-06-08 14:02:53.162+05:30	2026-06-08 13:58:26.543+05:30	0	2026-06-08 13:52:53.168808+05:30
466c25e6-41da-4532-829e-6c7258a2b1d4	0da474d7-d748-4795-bb34-0fa2c05f61a0	f1ca90f457da8a5aac25fb11c288299997ddb568d248a9fcc3f330660f52940f	2026-06-08 14:08:26.543+05:30	2026-06-08 13:58:52.741+05:30	0	2026-06-08 13:58:26.563872+05:30
e1503fd7-08a5-4f28-897e-d9ef476682cd	2da2e451-6c99-42a2-9439-f08b6b9c8d1b	51d4e84392de64bb865d7a42ec6adde0a1bb8bbba779646feedb92e92c5fd1bb	2026-06-08 15:24:24.142+05:30	2026-06-08 15:14:50.502+05:30	0	2026-06-08 15:14:24.151422+05:30
ae978805-afe7-4cd5-b6cb-b0f9f6a9e072	2da2e451-6c99-42a2-9439-f08b6b9c8d1b	c071852a5e01f921cb4276d6703ebcf01f407583215bec82e55d541e635e02cf	2026-06-08 15:24:50.502+05:30	\N	1	2026-06-08 15:14:50.516062+05:30
fd765802-48c4-4f89-bb06-cd1ba2d8bb9f	0da474d7-d748-4795-bb34-0fa2c05f61a0	c2e3b4a5e7a41efb9af72d6ad6998c84f890c2347892c075296ebe9cb593cb0b	2026-06-08 15:44:52.973+05:30	2026-06-08 15:35:15.098+05:30	0	2026-06-08 15:34:52.97725+05:30
223e9173-3f60-427f-8697-5b1a7a3c867a	0da474d7-d748-4795-bb34-0fa2c05f61a0	88e97bcea7be2a82e0121bdfd711de2f94c81c874867e8018850eeefc322e8a8	2026-06-08 16:32:06.997+05:30	2026-06-08 16:24:33.835+05:30	0	2026-06-08 16:22:07.002851+05:30
cdffecfe-9e10-4165-8667-b7eb7e997fd6	0da474d7-d748-4795-bb34-0fa2c05f61a0	f0f10107c7f2c10be5ed6a5e305b742fbdbda08a3a4f8077c4d354eb2c30d329	2026-06-08 16:46:27.705+05:30	2026-06-08 16:36:53.954+05:30	0	2026-06-08 16:36:27.716167+05:30
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, employee_code, full_name, work_email, country_of_employment_id, start_date, end_date, national_id, tax_identifier, date_of_birth, mobile_number, address, compensation_band, is_active, created_at, updated_at, deleted_at, created_by, updated_by, legal_entity_id) FROM stdin;
94a6e00e-ff36-41c2-863f-f76d73f6b86c	EMP-002	Shivam	shivam.emp@radiant.com	97cddc42-776c-4c99-89e8-5e374808b560	2023-06-01	\N	\N	\N	\N	\N	\N	\N	t	2026-06-04 15:50:20.597722+05:30	2026-06-04 15:50:20.597722+05:30	\N	\N	\N	\N
08f02602-b9a0-45cb-a436-f2dfda267814	EMP-006	Mark	mark.emp@radiant.com	74f30660-cea8-467f-a2ed-55a8814488ab	2024-07-01	\N	\N	\N	\N	\N	\N	\N	t	2026-06-04 15:50:20.597722+05:30	2026-06-04 15:50:20.597722+05:30	\N	\N	\N	\N
251075c6-9b7f-43c6-b325-42ccb5249aba	EMP-001	Venessa	venessa.emp@radiant.com	2b4761a9-c08f-48d5-9ad5-93685b76471b	2024-01-15	\N	\N	\N	\N	\N	\N	\N	t	2026-06-04 15:50:20.597722+05:30	2026-06-04 15:50:20.597722+05:30	\N	\N	\N	\N
293999d8-0bf2-49dd-82d2-1cffae9bc47d	EMP-005	Magaeshwari	magaeshwari.emp@radiant.com	d7de565f-53d7-4d78-b998-0b9bec89d862	2022-11-05	\N	\N	\N	\N	\N	\N	\N	t	2026-06-04 15:50:20.597722+05:30	2026-06-04 15:50:20.597722+05:30	\N	\N	\N	\N
a37acf60-939b-4c8c-803d-05f984c15f84	EMP-003	Saritha	saritha.emp@radiant.com	71c403a2-07be-4447-92d7-0a1a35459c7c	2023-09-12	\N	\N	\N	\N	\N	\N	\N	t	2026-06-04 15:50:20.597722+05:30	2026-06-04 15:50:20.597722+05:30	\N	\N	\N	\N
2da2e451-6c99-42a2-9439-f08b6b9c8d1b	EMP-004	Ghizlane	ghizlane.emp@radiant.com	3e7296cb-d6b7-4311-8a9f-1551450fbf14	2024-03-10	\N	\N	\N	\N	\N	\N	\N	t	2026-06-04 15:50:20.597722+05:30	2026-06-04 15:50:20.597722+05:30	\N	\N	\N	\N
0da474d7-d748-4795-bb34-0fa2c05f61a0	EMP-007	Sonal Tamboli	sonal@firsteconomy.com	97cddc42-776c-4c99-89e8-5e374808b560	2026-06-09	2026-06-09	12343r4221322`	test	1993-05-19	9119505008	askghdjhdwgj hsbsmddbcjhbjhscb  jhdbjasbdhasb	\N	t	2026-06-08 13:35:54.106055+05:30	2026-06-08 13:35:54.106055+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N
\.


--
-- Data for Name: incoming_receipt_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incoming_receipt_documents (id, incoming_receipt_id, document_code, document_label, file_name, file_url, file_size_bytes, mime_type, uploaded_by, uploaded_at, created_at) FROM stdin;
\.


--
-- Data for Name: incoming_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incoming_receipts (id, receipt_number, legal_entity_id, counterparty_id, receive_from_account_id, expected_amount, expected_currency_code, purpose_description, status, submitted_at, received_at, received_amount, received_currency_code, inward_bank_reference, received_remarks, cancellation_reason, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: legal_entities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.legal_entities (id, name, code, is_active, created_at, updated_at, deleted_at, created_by, updated_by, country_id) FROM stdin;
3c7059a2-ba71-47e4-a7e1-2f6e5daf707f	Radiant India Pvt Ltd	RADIANT-IN	t	2026-06-04 15:45:51.464527+05:30	2026-06-04 15:45:51.464527+05:30	\N	\N	\N	97cddc42-776c-4c99-89e8-5e374808b560
5081a641-34de-46ab-bd38-8d2b56455d1e	Radiant US Inc	RADIANT-US	t	2026-06-04 15:45:51.464527+05:30	2026-06-04 15:45:51.464527+05:30	\N	\N	\N	74f30660-cea8-467f-a2ed-55a8814488ab
a7010e74-1a65-445d-9227-1967ebd9139f	Radiant Trading FZE	RADIANT-DXB	t	2026-06-04 15:45:51.464527+05:30	2026-06-04 15:45:51.464527+05:30	\N	\N	\N	2b4761a9-c08f-48d5-9ad5-93685b76471b
3593aa30-a59c-493a-bd1b-f0d19b68afbf	Radiant Singapore Pte Ltd	RADIANT-SG	t	2026-06-04 15:45:51.464527+05:30	2026-06-04 15:45:51.464527+05:30	\N	\N	\N	d7de565f-53d7-4d78-b998-0b9bec89d862
e6acd6fb-d36e-4966-be9a-b6ea44d60e55	Radiant UK Ltd	RADIANT-UK	t	2026-06-04 15:45:51.464527+05:30	2026-06-04 15:45:51.464527+05:30	\N	\N	\N	71c403a2-07be-4447-92d7-0a1a35459c7c
1de67104-b600-4332-9b9a-f15ca75998c3	Radiant Geneva SA	RADIANT-GVA	t	2026-06-04 15:45:51.464527+05:30	2026-06-04 15:45:51.464527+05:30	\N	\N	\N	3e7296cb-d6b7-4311-8a9f-1551450fbf14
\.


--
-- Data for Name: payment_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_categories (id, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
db83eff4-20ae-40b1-b981-59ac8bfb4a38	Exceptional Payments	t	2026-06-04 15:44:50.89335+05:30	2026-06-04 15:44:50.89335+05:30	\N	\N	\N
78a18613-1e96-45db-a3ed-3a7cdfaca411	Salary & Statutory Payments	t	2026-06-04 15:44:50.89335+05:30	2026-06-04 15:44:50.89335+05:30	\N	\N	\N
d23f70da-74f5-407d-a239-74e8bbc7776f	Trade Payments	t	2026-06-04 15:44:50.89335+05:30	2026-06-04 15:44:50.89335+05:30	\N	\N	\N
80a96bf9-5c86-4d1e-9cce-e082ffa21fa8	Non-Trade Payments	t	2026-06-04 15:44:50.89335+05:30	2026-06-04 15:44:50.89335+05:30	\N	\N	\N
be3ea0c3-0fea-482e-96db-de211f40c452	Capital Expenditure	t	2026-06-04 15:44:50.89335+05:30	2026-06-04 15:44:50.89335+05:30	\N	\N	\N
\.


--
-- Data for Name: payment_request_approvals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_request_approvals (id, payment_request_id, step_order, approver_type, approver_user_id, approver_role_id, decision, decided_by, decided_at, comments, created_at, updated_at) FROM stdin;
e1448631-52a8-45f4-a1e1-bb3b8da2e17b	66e48633-9bf7-49ec-bfcf-3d030b2a1377	1	ROLE	\N	81c68ec5-f574-4031-b9dd-a93a42ef108d	APPROVED	fa939508-de63-4abb-b6ca-ff4f4f627c9c	2026-06-04 16:26:08.912+05:30	Testing	2026-06-04 16:25:44.679955+05:30	2026-06-04 16:26:08.906903+05:30
25b214ab-6a9e-48c0-b240-7d3a2896b73f	66e48633-9bf7-49ec-bfcf-3d030b2a1377	2	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	APPROVED	29b1615c-4272-4c8b-9a20-f6b5c9e653da	2026-06-04 16:26:27.567+05:30	testing	2026-06-04 16:26:08.906903+05:30	2026-06-04 16:26:27.565628+05:30
bf3971d0-0710-47cf-9a30-631313251e02	66e48633-9bf7-49ec-bfcf-3d030b2a1377	3	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	APPROVED	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	2026-06-04 16:26:46.546+05:30	testing	2026-06-04 16:26:08.906903+05:30	2026-06-04 16:26:46.545676+05:30
229dbe1e-0355-4afe-ab43-7c882dfa3b8f	2958a789-38b2-4d88-aa57-11c679e40a7d	1	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	APPROVED	29b1615c-4272-4c8b-9a20-f6b5c9e653da	2026-06-04 17:11:50.319+05:30	testing	2026-06-04 16:34:24.055774+05:30	2026-06-04 17:11:50.311936+05:30
bb0d4022-42d1-42e2-96c0-c2f02d4e2302	2958a789-38b2-4d88-aa57-11c679e40a7d	2	USER	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	\N	APPROVED	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	2026-06-04 17:12:05.026+05:30	testing	2026-06-04 16:34:24.055774+05:30	2026-06-04 17:12:05.0229+05:30
d1a78a1e-4c91-4bc4-a33b-2122db73ca8f	29ec674f-6fcc-4401-86dd-e0d71c9f73f0	1	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	APPROVED	29b1615c-4272-4c8b-9a20-f6b5c9e653da	2026-06-05 17:58:17.204+05:30	testing	2026-06-05 17:57:32.209936+05:30	2026-06-05 17:58:17.202139+05:30
562b23d3-f224-4bd1-97cb-d7fd48cdfed6	29ec674f-6fcc-4401-86dd-e0d71c9f73f0	2	USER	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	\N	REJECTED	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	2026-06-05 17:58:33.86+05:30	testing	2026-06-05 17:57:32.209936+05:30	2026-06-05 17:58:33.856456+05:30
8bb93a95-e36a-4877-9efc-e6c4f4aa5e7c	c4584104-471b-45d0-a323-d44589dc6514	1	ROLE	\N	81c68ec5-f574-4031-b9dd-a93a42ef108d	PENDING	\N	\N	\N	2026-06-05 18:00:14.249752+05:30	2026-06-05 18:00:14.249752+05:30
0113a227-8d36-4256-955b-3593f5eff96c	ef82204b-d60a-4058-9457-477971f78c38	1	ROLE	\N	81c68ec5-f574-4031-b9dd-a93a42ef108d	APPROVED	fa939508-de63-4abb-b6ca-ff4f4f627c9c	2026-06-08 12:18:06.79+05:30	test	2026-06-08 12:15:35.917393+05:30	2026-06-08 12:18:06.774978+05:30
28627a6e-99a8-415e-b409-573da311b430	ef82204b-d60a-4058-9457-477971f78c38	2	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	APPROVED	29b1615c-4272-4c8b-9a20-f6b5c9e653da	2026-06-08 12:18:31.782+05:30	test	2026-06-08 12:18:06.774978+05:30	2026-06-08 12:18:31.741208+05:30
99f47976-23ea-4d4f-b6a7-a545571d41ac	ef82204b-d60a-4058-9457-477971f78c38	3	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	APPROVED	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	2026-06-08 12:18:52.582+05:30	test	2026-06-08 12:18:06.774978+05:30	2026-06-08 12:18:52.555066+05:30
6a34ef9f-29f4-47b5-94dc-1a87f8b1ffee	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	1	ROLE	\N	81c68ec5-f574-4031-b9dd-a93a42ef108d	APPROVED	fa939508-de63-4abb-b6ca-ff4f4f627c9c	2026-06-08 12:39:47.235+05:30	testing	2026-06-08 12:39:21.317086+05:30	2026-06-08 12:39:47.191423+05:30
692c90c9-a57c-4f7c-a979-2c48ed2a283c	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	2	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	APPROVED	29b1615c-4272-4c8b-9a20-f6b5c9e653da	2026-06-08 12:41:44.159+05:30	Testing	2026-06-08 12:39:47.191423+05:30	2026-06-08 12:41:44.121295+05:30
48eac5ac-82f7-41fc-81f6-e9387d7cb5fe	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	3	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	APPROVED	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	2026-06-08 12:42:07.521+05:30	Testing	2026-06-08 12:39:47.191423+05:30	2026-06-08 12:42:07.483059+05:30
14b50e1d-e181-4d12-a6ea-c2e07e38c25c	63d958bc-8a19-465d-b615-96ab7d781a51	1	ROLE	\N	0385aa54-b00a-4e55-a9d8-f35ef42568fc	APPROVED	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	2026-06-08 16:39:52.321+05:30	m,nkj	2026-06-08 15:50:31.664119+05:30	2026-06-08 16:39:52.311085+05:30
25d12781-1b0f-4f3c-89c2-1271a6c78e93	63d958bc-8a19-465d-b615-96ab7d781a51	2	USER	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	\N	PENDING	\N	\N	\N	2026-06-08 16:39:52.311085+05:30	2026-06-08 16:39:52.311085+05:30
cc352ddf-8037-40a1-b613-12b462020711	66fc1db1-f0ad-4e88-9998-fa8f54d7e3af	1	ROLE	\N	81c68ec5-f574-4031-b9dd-a93a42ef108d	APPROVED	fa939508-de63-4abb-b6ca-ff4f4f627c9c	2026-06-08 16:47:20.421+05:30	ewr	2026-06-08 16:46:59.738015+05:30	2026-06-08 16:47:20.410904+05:30
1d27c431-a6c1-4ccd-ba72-bcb264842d7b	66fc1db1-f0ad-4e88-9998-fa8f54d7e3af	2	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	APPROVED	29b1615c-4272-4c8b-9a20-f6b5c9e653da	2026-06-08 16:47:49.682+05:30	erwarwq	2026-06-08 16:47:20.410904+05:30	2026-06-08 16:47:49.678852+05:30
\.


--
-- Data for Name: payment_request_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_request_documents (id, payment_request_id, document_code, document_label, file_name, file_url, file_size_bytes, mime_type, uploaded_by, uploaded_at, created_at, updated_at) FROM stdin;
558771f7-2095-4915-bd60-24f182105086	66e48633-9bf7-49ec-bfcf-3d030b2a1377	INVOICE	Invoice	Payments Authority Matrix - Radiant (1) (1).pdf	/uploads/1780570537932-881796.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-04 16:25:39.237501+05:30	2026-06-04 16:25:39.237501+05:30	2026-06-04 16:25:39.237501+05:30
2a325b71-6778-408b-9f2e-35a0e6d51e4c	2958a789-38b2-4d88-aa57-11c679e40a7d	invoice	INVOICE	Payments Authority Matrix - Radiant (1) (1).pdf	/uploads/1780571052640-58786.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-04 16:34:13.739313+05:30	2026-06-04 16:34:13.739313+05:30	2026-06-04 16:34:13.739313+05:30
c2aba4db-99aa-48f4-855a-8e67a55bbef7	29ec674f-6fcc-4401-86dd-e0d71c9f73f0	INVOICE	Invoice	Payments Authority Matrix - Radiant (1) (1).pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780662440553-436690.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-05 17:57:28.289329+05:30	2026-06-05 17:57:28.289329+05:30	2026-06-05 17:57:28.289329+05:30
5ce40167-1946-46c9-bad9-0af120de80ad	c4584104-471b-45d0-a323-d44589dc6514	INVOICE	Invoice	Payments Authority Matrix - Radiant (1) (1).pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780662609314-110177.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-05 18:00:10.882284+05:30	2026-06-05 18:00:10.882284+05:30	2026-06-05 18:00:10.882284+05:30
a4780bb0-4eae-4107-85d5-0bc924189e0a	ef82204b-d60a-4058-9457-477971f78c38	INVOICE	Invoice	SOW_Payments_Control_System.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780900794062-68284.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-08 12:10:01.978721+05:30	2026-06-08 12:10:01.978721+05:30	2026-06-08 12:10:01.978721+05:30
30e43c8e-b7a0-483c-ac3c-10356d1446b6	65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	INVOICE	Invoice	SOW_Payments_Control_System.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780902015612-676056.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-08 12:30:28.861922+05:30	2026-06-08 12:30:28.861922+05:30	2026-06-08 12:30:28.861922+05:30
ca84ba4d-954a-4135-940b-471663688c2a	307d4a1f-0a9c-4729-a2f4-73a2cf15b038	INVOICE	Invoice	Payments Authority Matrix - Radiant (1) (1).pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780904282648-918189.pdf	\N	\N	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	2026-06-08 13:08:04.272785+05:30	2026-06-08 13:08:04.272785+05:30	2026-06-08 13:08:04.272785+05:30
a031fd8f-8caa-4b02-b3e6-0da6e67f6b1e	63d958bc-8a19-465d-b615-96ab7d781a51	RECEIPT	SOW_Payments_Control_System.pdf	SOW_Payments_Control_System.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780913499807-41600.pdf	341029	application/pdf	\N	2026-06-08 15:41:43.485373+05:30	2026-06-08 15:41:43.485373+05:30	2026-06-08 15:41:43.485373+05:30
71a3ecb8-8aae-476a-b617-9d71251f53a7	66fc1db1-f0ad-4e88-9998-fa8f54d7e3af	INVOICE	Invoice	Payments Authority Matrix - Radiant (1) (1).pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780917407903-116300.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-08 16:46:52.513485+05:30	2026-06-08 16:46:52.513485+05:30	2026-06-08 16:46:52.513485+05:30
\.


--
-- Data for Name: payment_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_requests (id, request_number, payment_type_id, counterparty_id, employee_id, beneficiary_account_id, source_account_id, currency_id, amount, purpose_description, invoice_number, due_date, status, submitted_at, approved_at, released_at, paid_at, matrix_id, current_step_order, bank_reference, value_date, proof_of_payment_url, sanction_warning, sanction_override_reason, counterparty_snapshot, beneficiary_snapshot, rejection_reason, cancellation_reason, withdrawn_reason, created_at, updated_at, deleted_at, created_by, updated_by, anomaly_flag, anomaly_notes, tt_mode, treasury_reference_number, swift_copy_url, treasury_maker_by, treasury_maker_at, treasury_checker_by, treasury_checker_at, treasury_authoriser_by, treasury_authoriser_at, completed_at, treasury_maker_role_id, treasury_checker_role_id, treasury_authoriser_role_id, raised_by_employee_id) FROM stdin;
66e48633-9bf7-49ec-bfcf-3d030b2a1377	PR-2026-00012	b2294dcc-742c-48f6-9190-0c0d756705c0	f074196f-049f-4deb-a331-aee61df80d59	\N	dc9edb0c-1c51-4633-9abc-d0e613f6cc04	2d19213d-76e1-4683-8c62-a762ae3c7e3c	69d86cc6-7d2b-4977-b579-62dbcbe56760	10000.0000	testing	INV-2203	2026-06-03	COMPLETED	2026-06-04 16:25:44.693+05:30	2026-06-04 16:26:46.55+05:30	\N	\N	3da82a62-abb0-43c5-be3c-b953e44a5306	\N	\N	\N	\N	f	\N	{"id": "f074196f-049f-4deb-a331-aee61df80d59", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "legalName": " Acme Supplies Pvt Ltd"}	{"id": "dc9edb0c-1c51-4633-9abc-d0e613f6cc04", "iban": null, "bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "swiftBic": "HDFCINBB", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "accountNumber": "50200111222333", "accountHolderName": "Acme Supplies Pvt Ltd"}	\N	\N	\N	2026-06-04 16:25:39.237501+05:30	2026-06-04 16:30:27.055877+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	964da820-0264-48cf-8d22-971f8843741d	f	\N	ONLINE_TT	FT123REF988	/uploads/1780570737103-344375.pdf	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	2026-06-04 16:28:58.401+05:30	9b085aa8-7467-461a-afb0-50849bb1fec9	2026-06-04 16:29:43.855+05:30	964da820-0264-48cf-8d22-971f8843741d	2026-06-04 16:30:27.066+05:30	2026-06-04 16:30:27.066+05:30	\N	\N	\N	\N
29ec674f-6fcc-4401-86dd-e0d71c9f73f0	PR-2026-00018	bdc51ca6-b206-4c5c-9203-11471ed81b9f	9460c88b-b10b-465a-bc87-3d8613469184	\N	d297dfdd-cecb-4f2f-8c61-114d23490d78	2d19213d-76e1-4683-8c62-a762ae3c7e3c	69d86cc6-7d2b-4977-b579-62dbcbe56760	1000.0000	testing	INV-2203	2026-06-11	REJECTED	2026-06-05 17:57:32.237+05:30	\N	\N	\N	da8ba145-1083-4a80-9109-3eb72718a48b	\N	\N	\N	\N	f	\N	{"id": "9460c88b-b10b-465a-bc87-3d8613469184", "countryId": "d7de565f-53d7-4d78-b998-0b9bec89d862", "legalName": "Asia Metals Pte Ltd"}	{"id": "d297dfdd-cecb-4f2f-8c61-114d23490d78", "iban": null, "bankId": "8cbb0f09-3024-4658-8d1b-cae2e1d6df3a", "swiftBic": "DBSSSGSG", "countryId": "d7de565f-53d7-4d78-b998-0b9bec89d862", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "accountNumber": "0019998887", "accountHolderName": "Asia Metals Pte Ltd"}	testing	\N	\N	2026-06-05 17:57:28.289329+05:30	2026-06-05 17:58:33.856456+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	f	\N	ONLINE_TT	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2958a789-38b2-4d88-aa57-11c679e40a7d	PR-2026-00013	bdc51ca6-b206-4c5c-9203-11471ed81b9f	9460c88b-b10b-465a-bc87-3d8613469184	\N	d297dfdd-cecb-4f2f-8c61-114d23490d78	8d7ca822-e714-4838-af9f-f59aa98a6e08	69d86cc6-7d2b-4977-b579-62dbcbe56760	500.0000	testing	INV-000076	\N	COMPLETED	2026-06-04 16:34:24.065+05:30	2026-06-04 17:12:05.031+05:30	\N	\N	da8ba145-1083-4a80-9109-3eb72718a48b	\N	\N	\N	\N	f	\N	{"id": "9460c88b-b10b-465a-bc87-3d8613469184", "countryId": "d7de565f-53d7-4d78-b998-0b9bec89d862", "legalName": "Asia Metals Pte Ltd"}	{"id": "d297dfdd-cecb-4f2f-8c61-114d23490d78", "iban": null, "bankId": "8cbb0f09-3024-4658-8d1b-cae2e1d6df3a", "swiftBic": "DBSSSGSG", "countryId": "d7de565f-53d7-4d78-b998-0b9bec89d862", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "accountNumber": "0019998887", "accountHolderName": "Asia Metals Pte Ltd"}	\N	\N	\N	2026-06-04 16:34:13.739313+05:30	2026-06-04 17:18:04.807455+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	964da820-0264-48cf-8d22-971f8843741d	f	\N	ONLINE_TT	Ft12232234SWo	/uploads/1780573581126-273119.pdf	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	2026-06-04 17:16:25.034+05:30	9b085aa8-7467-461a-afb0-50849bb1fec9	2026-06-04 17:17:06.778+05:30	964da820-0264-48cf-8d22-971f8843741d	2026-06-04 17:18:04.843+05:30	2026-06-04 17:18:04.843+05:30	\N	\N	\N	\N
c4584104-471b-45d0-a323-d44589dc6514	PR-2026-00019	b2294dcc-742c-48f6-9190-0c0d756705c0	f074196f-049f-4deb-a331-aee61df80d59	\N	dc9edb0c-1c51-4633-9abc-d0e613f6cc04	2d19213d-76e1-4683-8c62-a762ae3c7e3c	69d86cc6-7d2b-4977-b579-62dbcbe56760	1000.0000	testing	INV-2203	2026-06-10	PENDING_APPROVAL	2026-06-05 18:00:14.261+05:30	\N	\N	\N	\N	1	\N	\N	\N	f	\N	{"id": "f074196f-049f-4deb-a331-aee61df80d59", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "legalName": " Acme Supplies Pvt Ltd"}	{"id": "dc9edb0c-1c51-4633-9abc-d0e613f6cc04", "iban": null, "bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "swiftBic": "HDFCINBB", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "accountNumber": "50200111222333", "accountHolderName": "Acme Supplies Pvt Ltd"}	\N	\N	\N	2026-06-05 18:00:10.882284+05:30	2026-06-05 18:00:14.249752+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5634f9b6-bb8f-4e1d-bc7d-48a9e6ef48d5	PR-2026-00020	f017e554-5e03-42b3-9320-d4a32131bbd7	\N	\N	\N	\N	ff0ea523-3dd5-4256-be64-13b191fc043f	5000.0000	smoke confidential	\N	\N	DRAFT	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	2026-06-08 02:34:22.606625+05:30	2026-06-08 02:34:22.606625+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1ea399a1-960b-48c9-8ad1-02a30134292c	PR-2026-00021	fcaaaee3-682e-4b0d-a07e-582387d75971	\N	\N	\N	\N	ff0ea523-3dd5-4256-be64-13b191fc043f	5000.0000	smoke confidential	\N	\N	COMPLETED	2026-06-08 02:42:51.016+05:30	2026-06-08 02:42:51.016+05:30	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	2026-06-08 02:42:50.847336+05:30	2026-06-08 02:42:51.102689+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	f	\N	\N	FT-SMOKE-001	/uploads/smoke-mt103.pdf	\N	\N	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-08 02:42:51.105+05:30	2026-06-08 02:42:51.105+05:30	\N	\N	\N	\N
8e7fe565-c945-43f2-a16b-48761c28b88e	PR-2026-00022	928fc1ba-2a1c-49c0-bb73-5a7792bdbad4	\N	\N	\N	\N	ff0ea523-3dd5-4256-be64-13b191fc043f	7000.0000	conf auth test	\N	\N	COMPLETED	2026-06-08 03:07:25.65+05:30	2026-06-08 03:07:25.65+05:30	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	2026-06-08 03:07:25.465497+05:30	2026-06-08 03:07:25.736798+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	f	\N	\N	FT-CONF-1	/uploads/c.pdf	\N	\N	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-08 03:07:25.742+05:30	2026-06-08 03:07:25.742+05:30	\N	\N	0082be8d-052d-499a-94f6-2019d8dff9e7	\N
2c47cc2c-113d-44fb-a1b4-2ba506491671	PR-2026-00023	a286ce69-effe-4a61-9b8b-a539fcf370c3	\N	\N	\N	\N	ff0ea523-3dd5-4256-be64-13b191fc043f	7000.0000	x	\N	\N	COMPLETED	2026-06-08 03:21:35.166+05:30	2026-06-08 03:21:35.166+05:30	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	2026-06-08 03:21:35.054354+05:30	2026-06-08 03:21:35.224127+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	f	\N	\N	FT-RE-1	/uploads/c.pdf	\N	\N	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-08 03:21:35.228+05:30	2026-06-08 03:21:35.228+05:30	\N	\N	0082be8d-052d-499a-94f6-2019d8dff9e7	\N
63e2a3b5-c4a9-4825-9019-d5b6cdf6b725	PR-2026-00056	f3ff3e18-5359-4ccd-85a7-af09b6ac7e41	\N	\N	\N	\N	ff0ea523-3dd5-4256-be64-13b191fc043f	9000.0000	x	\N	\N	COMPLETED	2026-06-08 03:47:10.301+05:30	2026-06-08 03:47:10.301+05:30	\N	\N	5c464c28-5a8e-471a-8a35-864bfb560dbc	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	2026-06-08 03:47:10.226679+05:30	2026-06-08 03:47:10.335013+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	f	\N	\N	FT-CM-1	/uploads/c.pdf	\N	\N	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-08 03:47:10.336+05:30	2026-06-08 03:47:10.336+05:30	\N	\N	0082be8d-052d-499a-94f6-2019d8dff9e7	\N
ef82204b-d60a-4058-9457-477971f78c38	PR-2026-00058	b2294dcc-742c-48f6-9190-0c0d756705c0	9460c88b-b10b-465a-bc87-3d8613469184	\N	d297dfdd-cecb-4f2f-8c61-114d23490d78	2d19213d-76e1-4683-8c62-a762ae3c7e3c	69d86cc6-7d2b-4977-b579-62dbcbe56760	1000.0000	testing	INV-2203	2026-06-09	COMPLETED	2026-06-08 12:15:35.99+05:30	2026-06-08 12:18:52.589+05:30	\N	\N	3da82a62-abb0-43c5-be3c-b953e44a5306	\N	\N	\N	\N	f	\N	{"id": "9460c88b-b10b-465a-bc87-3d8613469184", "countryId": "d7de565f-53d7-4d78-b998-0b9bec89d862", "legalName": "Asia Metals Pte Ltd"}	{"id": "d297dfdd-cecb-4f2f-8c61-114d23490d78", "iban": null, "bankId": "8cbb0f09-3024-4658-8d1b-cae2e1d6df3a", "swiftBic": "DBSSSGSG", "countryId": "d7de565f-53d7-4d78-b998-0b9bec89d862", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "accountNumber": "0019998887", "accountHolderName": "Asia Metals Pte Ltd"}	\N	\N	\N	2026-06-08 12:10:01.978721+05:30	2026-06-08 12:22:36.231122+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	964da820-0264-48cf-8d22-971f8843741d	t	2 payment requests have already been submitted to this beneficiary in the last 7 days.	ONLINE_TT	FT123REF988	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780901411250-275209.pdf	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	2026-06-08 12:20:13.844+05:30	9b085aa8-7467-461a-afb0-50849bb1fec9	2026-06-08 12:22:16.899+05:30	964da820-0264-48cf-8d22-971f8843741d	2026-06-08 12:22:36.245+05:30	2026-06-08 12:22:36.245+05:30	\N	\N	\N	\N
65dc90a1-0dd2-4c0c-8a69-1c00e445fe9e	PR-2026-00059	b2294dcc-742c-48f6-9190-0c0d756705c0	9460c88b-b10b-465a-bc87-3d8613469184	\N	d297dfdd-cecb-4f2f-8c61-114d23490d78	2d19213d-76e1-4683-8c62-a762ae3c7e3c	69d86cc6-7d2b-4977-b579-62dbcbe56760	1000.0000	testing	INV-2203	2026-06-09	TREASURY_AUTHORISER	2026-06-08 12:39:21.343+05:30	2026-06-08 12:42:07.53+05:30	\N	\N	3da82a62-abb0-43c5-be3c-b953e44a5306	\N	\N	\N	\N	f	\N	{"id": "9460c88b-b10b-465a-bc87-3d8613469184", "countryId": "d7de565f-53d7-4d78-b998-0b9bec89d862", "legalName": "Asia Metals Pte Ltd"}	{"id": "d297dfdd-cecb-4f2f-8c61-114d23490d78", "iban": null, "bankId": "8cbb0f09-3024-4658-8d1b-cae2e1d6df3a", "swiftBic": "DBSSSGSG", "countryId": "d7de565f-53d7-4d78-b998-0b9bec89d862", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "accountNumber": "0019998887", "accountHolderName": "Asia Metals Pte Ltd"}	\N	\N	\N	2026-06-08 12:30:28.861922+05:30	2026-06-08 12:46:59.469236+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	9b085aa8-7467-461a-afb0-50849bb1fec9	t	3 payment requests have already been submitted to this beneficiary in the last 7 days.	ONLINE_TT	FT123REF988	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780902782580-698632.pdf	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	2026-06-08 12:43:30.651+05:30	9b085aa8-7467-461a-afb0-50849bb1fec9	2026-06-08 12:46:59.494+05:30	\N	\N	\N	\N	\N	\N	\N
307d4a1f-0a9c-4729-a2f4-73a2cf15b038	PR-2026-00060	b646f1be-4d33-4a27-8cad-23aef13f80ca	f074196f-049f-4deb-a331-aee61df80d59	\N	dc9edb0c-1c51-4633-9abc-d0e613f6cc04	2d19213d-76e1-4683-8c62-a762ae3c7e3c	69d86cc6-7d2b-4977-b579-62dbcbe56760	1000.0000	testing	INV-2203	2026-06-10	COMPLETED	2026-06-08 13:08:19.504+05:30	2026-06-08 13:08:19.504+05:30	\N	\N	\N	\N	\N	\N	\N	f	\N	{"id": "f074196f-049f-4deb-a331-aee61df80d59", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "legalName": " Acme Supplies Pvt Ltd"}	{"id": "dc9edb0c-1c51-4633-9abc-d0e613f6cc04", "iban": null, "bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "swiftBic": "HDFCINBB", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "accountNumber": "50200111222333", "accountHolderName": "Acme Supplies Pvt Ltd"}	\N	\N	\N	2026-06-08 13:08:04.272785+05:30	2026-06-08 13:09:10.00415+05:30	\N	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	964da820-0264-48cf-8d22-971f8843741d	t	2 payment requests have already been submitted to this beneficiary in the last 7 days.	\N	FT123REF988	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1780904335969-690381.pdf	\N	\N	\N	\N	964da820-0264-48cf-8d22-971f8843741d	2026-06-08 13:09:10.078+05:30	2026-06-08 13:09:10.078+05:30	\N	\N	\N	\N
63d958bc-8a19-465d-b615-96ab7d781a51	PR-2026-00062	6d850ccc-6ac1-4015-b4ba-968422dc3417	\N	0da474d7-d748-4795-bb34-0fa2c05f61a0	c90a4e9a-8f75-47db-b762-d0b05e4be5bb	\N	69d86cc6-7d2b-4977-b579-62dbcbe56760	1000.0000	client dinner	\N	\N	PENDING_APPROVAL	2026-06-08 15:50:31.701+05:30	\N	\N	\N	71d4b189-7034-41e2-8d23-daca356dbfca	2	\N	\N	\N	f	\N	\N	{"id": "c90a4e9a-8f75-47db-b762-d0b05e4be5bb", "iban": null, "bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "swiftBic": "HDFC0002805", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "currencyId": "3bfc821c-ff8e-463a-b20d-2fac66932aa2", "accountNumber": "50100000000001", "accountHolderName": "Sonal"}	\N	\N	\N	2026-06-08 15:41:43.485373+05:30	2026-06-08 16:39:52.311085+05:30	\N	\N	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	t	Beneficiary account was activated within the last 7 days.	ONLINE_TT	\N	\N	\N	\N	\N	\N	\N	\N	\N	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6	0da474d7-d748-4795-bb34-0fa2c05f61a0
66fc1db1-f0ad-4e88-9998-fa8f54d7e3af	PR-2026-00063	9605ab99-8afa-48d5-984c-8ace3f06fbe7	f074196f-049f-4deb-a331-aee61df80d59	\N	dc9edb0c-1c51-4633-9abc-d0e613f6cc04	2d19213d-76e1-4683-8c62-a762ae3c7e3c	69d86cc6-7d2b-4977-b579-62dbcbe56760	1000.0000	ewr	INV-2203	2026-06-09	TREASURY_MAKER	2026-06-08 16:46:59.75+05:30	2026-06-08 16:47:49.688+05:30	\N	\N	798524d7-72cc-4844-966f-dda467e4931c	\N	\N	\N	\N	f	\N	{"id": "f074196f-049f-4deb-a331-aee61df80d59", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "legalName": " Acme Supplies Pvt Ltd"}	{"id": "dc9edb0c-1c51-4633-9abc-d0e613f6cc04", "iban": null, "bankId": "2cc9362c-01e1-4126-a248-94b863f940f8", "swiftBic": "HDFCINBB", "countryId": "97cddc42-776c-4c99-89e8-5e374808b560", "currencyId": "69d86cc6-7d2b-4977-b579-62dbcbe56760", "accountNumber": "50200111222333", "accountHolderName": "Acme Supplies Pvt Ltd"}	\N	\N	\N	2026-06-08 16:46:52.513485+05:30	2026-06-08 16:47:49.678852+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	29b1615c-4272-4c8b-9a20-f6b5c9e653da	t	3 payment requests have already been submitted to this beneficiary in the last 7 days.	ONLINE_TT	\N	\N	\N	\N	\N	\N	\N	\N	\N	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6	\N
\.


--
-- Data for Name: payment_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_types (id, code, name, description, direction, requires_approval_chain, is_batch_based, is_confidential, mobile_initiation_only, allows_cross_currency, document_policy, field_config, is_system, is_active, version, effective_from, effective_to, created_at, updated_at, deleted_at, created_by, updated_by, payment_category_id, maker_role_id, checker_role_id, maker_user_id, checker_user_id, legal_entity_id, maker_role_ids, employee_self_service) FROM stdin;
b2294dcc-742c-48f6-9190-0c0d756705c0	TRADE_SUPPLIER_PAYMENT	Trade Supplier Payment	Trade Supplier\nPayment	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-06-04	\N	2026-06-04 16:02:21.89379+05:30	2026-06-04 16:02:21.89379+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	d23f70da-74f5-407d-a239-74e8bbc7776f	64424fa9-5141-49d7-84c8-f2b10feeec22	81c68ec5-f574-4031-b9dd-a93a42ef108d	\N	\N	3c7059a2-ba71-47e4-a7e1-2f6e5daf707f	{64424fa9-5141-49d7-84c8-f2b10feeec22}	f
f017e554-5e03-42b3-9320-d4a32131bbd7	SMOKE_CONF_0FEDAE	Smoke Confidential 0FEDAE	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 02:34:22.473713+05:30	2026-06-08 02:34:22.974236+05:30	2026-06-08 02:34:22.974236+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
1239481b-c30a-4843-b775-d02e2fdeda60	TEST_MERGE_970741	Test Merge Type	\N	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 14:59:31.367828+05:30	2026-06-08 14:59:33.793997+05:30	2026-06-08 14:59:33.793997+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
fcaaaee3-682e-4b0d-a07e-582387d75971	SMOKE_CONF_8DE24A	Smoke Confidential 8DE24A	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 02:42:50.808199+05:30	2026-06-08 02:42:51.167427+05:30	2026-06-08 02:42:51.167427+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
b646f1be-4d33-4a27-8cad-23aef13f80ca	CHAIRMAN_PAYMENT	Chairman Payment	Confidential payment initiated by the Chairman; completed by the treasury team.	OUTGOING	f	f	t	f	t	[]	[]	t	t	1	2026-06-05	\N	2026-06-05 15:43:05.734574+05:30	2026-06-08 02:44:47.778255+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	fb4ee674-45b9-4160-aead-ec4470fb1592	0082be8d-052d-499a-94f6-2019d8dff9e7	\N	\N	a7010e74-1a65-445d-9227-1967ebd9139f	{fb4ee674-45b9-4160-aead-ec4470fb1592}	f
3e30d156-9208-441c-9d70-ac7f70596aa3	SMOKE_CONF2_06F76D	Smoke Conf2 06F76D	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 02:48:35.126205+05:30	2026-06-08 02:48:35.66189+05:30	2026-06-08 02:48:35.66189+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
6d850ccc-6ac1-4015-b4ba-968422dc3417	REIMBURSEMENT	Reimbursements	Reimbursements	OUTGOING	t	f	f	f	f	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 15:17:27.91189+05:30	2026-06-08 16:18:25.312679+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	78a18613-1e96-45db-a3ed-3a7cdfaca411	3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf	0385aa54-b00a-4e55-a9d8-f35ef42568fc	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf}	f
e4e97ac2-e9ae-4609-8dae-cbe6ba15fe48	SMOKE_CONF3_DDC528	Smoke Conf3 DDC528	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 02:48:55.090108+05:30	2026-06-08 02:48:55.4458+05:30	2026-06-08 02:48:55.4458+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
9605ab99-8afa-48d5-984c-8ace3f06fbe7	OFFICE_AND_OTHER_UTILITIES	Office and other utility payments	Office and other utility payments	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 16:45:43.656859+05:30	2026-06-08 16:45:43.656859+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	80a96bf9-5c86-4d1e-9cce-e082ffa21fa8	64424fa9-5141-49d7-84c8-f2b10feeec22	81c68ec5-f574-4031-b9dd-a93a42ef108d	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{64424fa9-5141-49d7-84c8-f2b10feeec22}	f
593b8c2d-1fc9-4a68-818b-dfee07d875ce	GUARD_5AE814	Guard 5AE814	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 02:49:20.433973+05:30	2026-06-08 02:49:20.526882+05:30	2026-06-08 02:49:20.526882+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
928fc1ba-2a1c-49c0-bb73-5a7792bdbad4	CONFAUTH_C578B0	Conf Auth C578B0	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 03:07:25.346836+05:30	2026-06-08 03:07:25.823953+05:30	2026-06-08 03:07:25.823953+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
a286ce69-effe-4a61-9b8b-a539fcf370c3	CONFAUTH_9AEE8F	Conf Auth 9AEE8F	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 03:21:34.971033+05:30	2026-06-08 03:21:35.31622+05:30	2026-06-08 03:21:35.31622+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
3fb9f8c5-8d49-4dda-9fed-b2b8ed3d6bac	NOTCONF_9AEE8F	Not Conf 9AEE8F	\N	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 03:21:35.272515+05:30	2026-06-08 03:21:35.374501+05:30	2026-06-08 03:21:35.374501+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
f3ff3e18-5359-4ccd-85a7-af09b6ac7e41	CM_A688BA	CM A688BA	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-08	\N	2026-06-08 03:47:10.149801+05:30	2026-06-08 03:47:10.402118+05:30	2026-06-08 03:47:10.402118+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	1de67104-b600-4332-9b9a-f15ca75998c3	{}	f
bdc51ca6-b206-4c5c-9203-11471ed81b9f	VENDOR_PAYMENT	Vendor payments		OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-06-04	\N	2026-06-04 16:10:28.637382+05:30	2026-06-04 16:10:28.637382+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	80a96bf9-5c86-4d1e-9cce-e082ffa21fa8	9297ad11-6e3c-4215-ab53-7c09547baf1b	\N	\N	\N	a7010e74-1a65-445d-9227-1967ebd9139f	{9297ad11-6e3c-4215-ab53-7c09547baf1b}	f
\.


--
-- Data for Name: reconciliation_exceptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reconciliation_exceptions (id, exception_number, statement_upload_id, statement_line_id, bank_account_id, exception_type, status, amount, currency_code, value_date, bank_reference, counterparty_text, narrative, resolution_note, investigated_by, investigated_at, resolved_by, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, code, name, description, is_system, created_at, updated_at, deleted_at) FROM stdin;
64424fa9-5141-49d7-84c8-f2b10feeec22	OPS_TEAM	Ops Team 	Trade Payment request initiator/maker	f	2026-06-04 15:30:22.651666+05:30	2026-06-04 15:30:22.651666+05:30	\N
81c68ec5-f574-4031-b9dd-a93a42ef108d	ACCOUNTS_TEAM	Accounts  Team 	Trade payments checker	f	2026-06-04 15:31:12.814415+05:30	2026-06-04 15:31:12.814415+05:30	\N
7ea68dff-db3b-4af0-a5c9-68d37dfcd703	APPROVER	Approver	APPROVER	f	2026-06-04 15:31:41.102141+05:30	2026-06-04 15:31:41.102141+05:30	\N
9f4e11e9-8c7a-4d4a-a563-190625caa263	TREASURY_MAKER_OFFLINE	Treasury Maker (Offline)	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
7361467f-9324-403a-b224-e34fef57b114	KYC_TEAM	KYC Team	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	TREASURY_MAKER_ONLINE	Treasury Maker (Online)	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
15ab6892-78f6-4e88-aa6a-34d5358460c6	TREASURY_AUTHORISER	Treasury Authoriser	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
adcb32d4-e1f3-498d-96aa-33018a941d24	TREASURY_CHECKER	Treasury Checker	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
9297ad11-6e3c-4215-ab53-7c09547baf1b	NT_VENDOR_PAYMENT_TEAM	Non Trade  - vendor Payment	Non Trade  - vendor Payment	f	2026-06-04 16:07:40.962028+05:30	2026-06-04 16:07:40.962028+05:30	\N
fb4ee674-45b9-4160-aead-ec4470fb1592	CHAIRMAN	Chairman	Initiates confidential (chairman-style) payments.	t	2026-06-05 15:40:49.812089+05:30	2026-06-05 15:40:49.812089+05:30	\N
0082be8d-052d-499a-94f6-2019d8dff9e7	TREASURY_TEAM_FOR_CHAIRMAN	Treasury Team (Chairman)	Completes confidential (chairman-style) payments in a single step: records the reference number, attaches the SWIFT copy / MT103, picks the source account and completes the payment. No maker/checker/authoriser chain.	f	2026-06-05 15:40:49.812089+05:30	2026-06-05 15:40:49.812089+05:30	\N
fdf3fc9a-2e7f-4b56-9987-553d0f0a69b7	SUPER_ADMIN	Platform administrator	Platform administrator	t	2026-06-05 17:14:07.493871+05:30	2026-06-05 17:14:07.493871+05:30	\N
3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf	EMPLOYEE	Employee	Employee	f	2026-06-08 14:45:49.189872+05:30	2026-06-08 14:45:49.189872+05:30	\N
0385aa54-b00a-4e55-a9d8-f35ef42568fc	REIMBURSEMENT_CHECKER	Reimbursements_checker	Reimbursements_checker	f	2026-06-08 15:13:56.238667+05:30	2026-06-08 15:13:56.238667+05:30	\N
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role_id, created_at) FROM stdin;
6c81db80-3252-4607-b5ae-6f1305d7d138	8e3f6158-5bff-4d7d-8d6e-5a517d0b1cab	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	2026-06-04 15:41:44.917218+05:30
42dc712e-92d0-45cf-867e-cddf42c9a049	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	2026-06-04 15:41:44.917218+05:30
92855d92-92de-4b32-8619-11efd0ed0eff	7e9bf049-b04b-4274-9170-9bed67faaac7	9f4e11e9-8c7a-4d4a-a563-190625caa263	2026-06-04 15:41:44.917218+05:30
efd82fab-7e08-4397-9f18-c791883ca3fc	4913d2c0-cbd4-424b-b51b-ad07deeeaeb8	adcb32d4-e1f3-498d-96aa-33018a941d24	2026-06-04 15:41:44.917218+05:30
2655a7aa-edc2-49d7-9a57-934df5b5e740	9b085aa8-7467-461a-afb0-50849bb1fec9	adcb32d4-e1f3-498d-96aa-33018a941d24	2026-06-04 15:41:44.917218+05:30
8979351c-2a61-43c1-b648-1c9d88bf0b1f	f2ec56f8-7fc5-4150-870d-c95304aaae86	15ab6892-78f6-4e88-aa6a-34d5358460c6	2026-06-04 15:41:44.917218+05:30
df4b5f86-f9ac-4a06-9526-1a24684d30e4	964da820-0264-48cf-8d22-971f8843741d	15ab6892-78f6-4e88-aa6a-34d5358460c6	2026-06-04 15:41:44.917218+05:30
1576ec09-4860-4163-bceb-a503350f1d07	666c0362-0318-45f1-a2f8-34c5e1970d94	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-06-04 15:41:44.917218+05:30
713238aa-ebf6-4881-89b4-2c92f74baae1	fa939508-de63-4abb-b6ca-ff4f4f627c9c	81c68ec5-f574-4031-b9dd-a93a42ef108d	2026-06-04 15:41:44.917218+05:30
db23d2d1-31a9-4093-95cf-4eb1e17d6922	29b1615c-4272-4c8b-9a20-f6b5c9e653da	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-06-04 15:41:44.917218+05:30
a9c0dea4-bd50-4451-bd46-5f46a2338cc8	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-06-04 15:41:44.917218+05:30
f271f901-64d5-45ab-8f8a-c749398ca1d6	5651d894-c430-4c34-abfb-0f71e72d8ba4	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-06-04 15:41:44.917218+05:30
89c25dd8-c28d-45c6-a395-897817f3545f	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-06-04 15:41:44.917218+05:30
c5e96a98-9f39-4a4b-a201-2cd3c5298008	08201732-f2d9-4568-869d-cd3627bc7484	7361467f-9324-403a-b224-e34fef57b114	2026-06-04 15:41:44.917218+05:30
02d953f9-ffa4-4710-a7a9-12c8c843c39f	666c0362-0318-45f1-a2f8-34c5e1970d94	9297ad11-6e3c-4215-ab53-7c09547baf1b	2026-06-04 16:09:10.259436+05:30
55ee7b7e-aefb-4a17-92a8-8ef0e43dafce	5a59123f-8a33-462c-a1bc-49efff8668f3	fb4ee674-45b9-4160-aead-ec4470fb1592	2026-06-05 15:40:49.812089+05:30
07d58ff8-25c8-48bc-981c-73bdf5d7bb0c	5a59123f-8a33-462c-a1bc-49efff8668f3	0082be8d-052d-499a-94f6-2019d8dff9e7	2026-06-05 15:40:49.812089+05:30
02a6428c-5881-4d62-ad78-d260759d020c	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	fb4ee674-45b9-4160-aead-ec4470fb1592	2026-06-05 15:43:35.240323+05:30
a415a4d7-46a7-447b-a2aa-4a5701e811d6	964da820-0264-48cf-8d22-971f8843741d	0082be8d-052d-499a-94f6-2019d8dff9e7	2026-06-05 15:44:22.914117+05:30
8b3a473f-a550-4e38-834c-c3ffd7e31370	5a59123f-8a33-462c-a1bc-49efff8668f3	fdf3fc9a-2e7f-4b56-9987-553d0f0a69b7	2026-06-05 17:14:07.493871+05:30
5620b458-e536-4f42-99fd-da285b1cc77d	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	0385aa54-b00a-4e55-a9d8-f35ef42568fc	2026-06-08 15:14:28.836817+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, full_name, employee_code, is_active, is_platform_admin, last_login_at, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
7e9bf049-b04b-4274-9170-9bed67faaac7	meena@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Meena	EMP-010	t	f	\N	2026-06-04 15:41:44.917218+05:30	2026-06-04 15:41:44.917218+05:30	\N	\N	\N
5651d894-c430-4c34-abfb-0f71e72d8ba4	tarang@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Tarang	EMP-005	t	f	\N	2026-06-04 15:41:44.917218+05:30	2026-06-04 15:41:44.917218+05:30	\N	\N	\N
4913d2c0-cbd4-424b-b51b-ad07deeeaeb8	urvil@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Urvil Anil Shah	EMP-011	t	f	\N	2026-06-04 15:41:44.917218+05:30	2026-06-04 15:41:44.917218+05:30	\N	\N	\N
8e3f6158-5bff-4d7d-8d6e-5a517d0b1cab	vinay@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Vinay Natrajan	EMP-008	t	f	\N	2026-06-04 15:41:44.917218+05:30	2026-06-04 15:41:44.917218+05:30	\N	\N	\N
f2ec56f8-7fc5-4150-870d-c95304aaae86	keval@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Keval	EMP-013	t	f	\N	2026-06-04 15:41:44.917218+05:30	2026-06-04 15:41:44.917218+05:30	\N	\N	\N
666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Saritha	EMP-001	t	f	2026-06-08 16:46:08.311+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-08 16:46:08.312035+05:30	\N	\N	\N
fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Abhishek	EMP-002	t	f	2026-06-08 16:47:11.449+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-08 16:47:11.452323+05:30	\N	\N	\N
29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Ganesh	EMP-003	t	f	2026-06-08 16:47:42.589+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-08 16:47:42.591935+05:30	\N	\N	\N
964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Anushya	EMP-014	t	f	2026-06-08 13:08:34.158+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-08 13:08:34.159628+05:30	\N	\N	\N
5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	System Administrator	\N	t	t	2026-06-08 16:48:42.364+05:30	2026-06-04 15:16:14.034493+05:30	2026-06-08 16:48:42.366559+05:30	\N	\N	\N
08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Rohit	EMP-007	t	f	2026-06-08 15:44:47.342+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-08 15:44:47.344282+05:30	\N	\N	\N
81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Ali	EMP-004	t	f	2026-06-05 17:58:26.091+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-05 17:58:26.093001+05:30	\N	\N	\N
734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Abirami	EMP-009	t	f	2026-06-08 12:42:21.765+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-08 12:42:21.767279+05:30	\N	\N	\N
9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Krrish Jain	EMP-012	t	f	2026-06-08 12:43:47.371+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-08 12:43:47.372625+05:30	\N	\N	\N
803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	$2b$12$7tGFUsI2LD6TMliLT3yNZuerjIfws5RV8FQF9M1irwULRnHTXm.b2	Ankita Verma	EMP-oo2	t	f	2026-06-08 16:39:44.881+05:30	2026-06-05 15:42:53.031444+05:30	2026-06-08 16:39:44.883233+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Pinkesh	EMP-006	t	f	2026-06-08 12:50:23.693+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-08 12:50:23.695172+05:30	\N	\N	\N
\.


--
-- Name: incoming_receipt_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.incoming_receipt_seq', 2, true);


--
-- Name: payment_request_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_request_seq', 63, true);


--
-- Name: reconciliation_exception_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reconciliation_exception_seq', 1, false);


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

\unrestrict RKM04N9zCh3cU1CbKj8Y0Upe16v9hRaNcMdDaCIvqBJuv8cqZVSbr711AVx4Q2S

