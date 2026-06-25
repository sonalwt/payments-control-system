--
-- PostgreSQL database dump
--

\restrict o3rDjVIZ03DGJPkncMzhAlm3u9e9QBdmhRtPO0Uzz3y8hDzwnvMuel9SfGKZcKq

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

ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reconciliation_exceptions DROP CONSTRAINT IF EXISTS reconciliation_exceptions_statement_upload_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reconciliation_exceptions DROP CONSTRAINT IF EXISTS reconciliation_exceptions_statement_line_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reconciliation_exceptions DROP CONSTRAINT IF EXISTS reconciliation_exceptions_bank_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_types DROP CONSTRAINT IF EXISTS payment_types_payment_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_types DROP CONSTRAINT IF EXISTS payment_types_maker_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_types DROP CONSTRAINT IF EXISTS payment_types_maker_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_types DROP CONSTRAINT IF EXISTS payment_types_legal_entity_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_types DROP CONSTRAINT IF EXISTS payment_types_checker_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_types DROP CONSTRAINT IF EXISTS payment_types_checker_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_source_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_raised_by_employee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_payment_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_employee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_counterparty_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_beneficiary_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_documents DROP CONSTRAINT IF EXISTS payment_request_documents_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_documents DROP CONSTRAINT IF EXISTS payment_request_documents_payment_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_approvals DROP CONSTRAINT IF EXISTS payment_request_approvals_payment_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_approvals DROP CONSTRAINT IF EXISTS payment_request_approvals_decided_by_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_approvals DROP CONSTRAINT IF EXISTS payment_request_approvals_approver_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_approvals DROP CONSTRAINT IF EXISTS payment_request_approvals_approver_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.legal_entities DROP CONSTRAINT IF EXISTS legal_entities_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipts DROP CONSTRAINT IF EXISTS incoming_receipts_receive_from_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipts DROP CONSTRAINT IF EXISTS incoming_receipts_legal_entity_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipts DROP CONSTRAINT IF EXISTS incoming_receipts_counterparty_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipt_documents DROP CONSTRAINT IF EXISTS incoming_receipt_documents_incoming_receipt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_maker_role;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_maker;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_checker_role;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_checker;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_authoriser_role;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_authoriser;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS fk_bank_accounts_legal_entity;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS fk_am_treasury_maker_role;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS fk_am_treasury_checker_role;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS fk_am_treasury_authoriser_role;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_legal_entity_id_fkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_country_of_employment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.employee_login_otps DROP CONSTRAINT IF EXISTS employee_login_otps_employee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.counterparties DROP CONSTRAINT IF EXISTS counterparties_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_accounts DROP CONSTRAINT IF EXISTS beneficiary_accounts_employee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_accounts DROP CONSTRAINT IF EXISTS beneficiary_accounts_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_accounts DROP CONSTRAINT IF EXISTS beneficiary_accounts_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_accounts DROP CONSTRAINT IF EXISTS beneficiary_accounts_counterparty_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_accounts DROP CONSTRAINT IF EXISTS beneficiary_accounts_bank_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_account_change_requests DROP CONSTRAINT IF EXISTS beneficiary_account_change_requests_verified_by_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_account_change_requests DROP CONSTRAINT IF EXISTS beneficiary_account_change_requests_requested_by_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_account_change_requests DROP CONSTRAINT IF EXISTS beneficiary_account_change_requests_rejected_by_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_account_change_requests DROP CONSTRAINT IF EXISTS beneficiary_account_change_requests_beneficiary_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_account_change_requests DROP CONSTRAINT IF EXISTS beneficiary_account_change_requests_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.banks DROP CONSTRAINT IF EXISTS banks_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_statement_uploads DROP CONSTRAINT IF EXISTS bank_statement_uploads_bank_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_statement_lines DROP CONSTRAINT IF EXISTS bank_statement_lines_statement_upload_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_statement_lines DROP CONSTRAINT IF EXISTS bank_statement_lines_matched_payment_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_statement_lines DROP CONSTRAINT IF EXISTS bank_statement_lines_matched_incoming_receipt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_statement_lines DROP CONSTRAINT IF EXISTS bank_statement_lines_bank_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_counterparty_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_bank_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_account_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bank_account_charge_bands DROP CONSTRAINT IF EXISTS bank_account_charge_bands_bank_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.balance_changes DROP CONSTRAINT IF EXISTS balance_changes_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrix_steps DROP CONSTRAINT IF EXISTS approval_matrix_steps_band_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrix_steps DROP CONSTRAINT IF EXISTS approval_matrix_steps_approver_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrix_steps DROP CONSTRAINT IF EXISTS approval_matrix_steps_approver_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrix_bands DROP CONSTRAINT IF EXISTS approval_matrix_bands_matrix_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS approval_matrices_payment_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS approval_matrices_currency_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_delegations DROP CONSTRAINT IF EXISTS approval_delegations_payment_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_delegations DROP CONSTRAINT IF EXISTS approval_delegations_delegator_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.approval_delegations DROP CONSTRAINT IF EXISTS approval_delegations_delegate_user_id_fkey;
DROP INDEX IF EXISTS public.uq_steps_band_order;
DROP INDEX IF EXISTS public.uq_pra_request_step;
DROP INDEX IF EXISTS public.uq_payment_types_code_live;
DROP INDEX IF EXISTS public.uq_payment_categories_name_live;
DROP INDEX IF EXISTS public.uq_matrices_pt_ccy_name_live;
DROP INDEX IF EXISTS public.uq_legal_entities_code;
DROP INDEX IF EXISTS public.uq_fx_rates_base_quote_date_live;
DROP INDEX IF EXISTS public.uq_employees_employee_code_live;
DROP INDEX IF EXISTS public.uq_currencies_code_live;
DROP INDEX IF EXISTS public.uq_counterparties_code_live;
DROP INDEX IF EXISTS public.uq_charge_bands_account_sort;
DROP INDEX IF EXISTS public.uq_bene_bank_account_live;
DROP INDEX IF EXISTS public.uq_banks_name_country_kind_live;
DROP INDEX IF EXISTS public.uq_bank_accounts_bank_account_live;
DROP INDEX IF EXISTS public.uq_bands_matrix_sort;
DROP INDEX IF EXISTS public.uq_account_types_name_live;
DROP INDEX IF EXISTS public.idx_steps_band_id;
DROP INDEX IF EXISTS public.idx_statement_uploads_account;
DROP INDEX IF EXISTS public.idx_statement_lines_upload;
DROP INDEX IF EXISTS public.idx_statement_lines_match;
DROP INDEX IF EXISTS public.idx_recon_exceptions_upload;
DROP INDEX IF EXISTS public.idx_recon_exceptions_type;
DROP INDEX IF EXISTS public.idx_recon_exceptions_status;
DROP INDEX IF EXISTS public.idx_prd_request;
DROP INDEX IF EXISTS public.idx_prd_code;
DROP INDEX IF EXISTS public.idx_pra_user;
DROP INDEX IF EXISTS public.idx_pra_role;
DROP INDEX IF EXISTS public.idx_pra_decision;
DROP INDEX IF EXISTS public.idx_pr_treasury_maker_role;
DROP INDEX IF EXISTS public.idx_pr_treasury_checker_role;
DROP INDEX IF EXISTS public.idx_pr_treasury_authoriser_role;
DROP INDEX IF EXISTS public.idx_pr_status;
DROP INDEX IF EXISTS public.idx_pr_raised_by_employee;
DROP INDEX IF EXISTS public.idx_pr_payment_type;
DROP INDEX IF EXISTS public.idx_pr_invoice;
DROP INDEX IF EXISTS public.idx_pr_deleted_at;
DROP INDEX IF EXISTS public.idx_pr_created_at;
DROP INDEX IF EXISTS public.idx_pr_counterparty;
DROP INDEX IF EXISTS public.idx_pr_beneficiary;
DROP INDEX IF EXISTS public.idx_pr_anomaly;
DROP INDEX IF EXISTS public.idx_payment_types_maker_user_id;
DROP INDEX IF EXISTS public.idx_payment_types_maker_role_ids;
DROP INDEX IF EXISTS public.idx_payment_types_maker_role_id;
DROP INDEX IF EXISTS public.idx_payment_types_legal_entity_id;
DROP INDEX IF EXISTS public.idx_payment_types_deleted_at;
DROP INDEX IF EXISTS public.idx_payment_types_checker_user_id;
DROP INDEX IF EXISTS public.idx_payment_types_checker_role_id;
DROP INDEX IF EXISTS public.idx_payment_types_category_id;
DROP INDEX IF EXISTS public.idx_payment_categories_deleted_at;
DROP INDEX IF EXISTS public.idx_matrices_payment_type;
DROP INDEX IF EXISTS public.idx_matrices_deleted_at;
DROP INDEX IF EXISTS public.idx_matrices_currency;
DROP INDEX IF EXISTS public.idx_legal_entities_deleted_at;
DROP INDEX IF EXISTS public.idx_legal_entities_country_id;
DROP INDEX IF EXISTS public.idx_incoming_receipts_status;
DROP INDEX IF EXISTS public.idx_incoming_receipts_counterparty;
DROP INDEX IF EXISTS public.idx_incoming_receipts_account;
DROP INDEX IF EXISTS public.idx_incoming_receipt_documents_receipt;
DROP INDEX IF EXISTS public.idx_fx_rates_deleted_at;
DROP INDEX IF EXISTS public.idx_fx_rates_base_quote_date;
DROP INDEX IF EXISTS public.idx_employees_deleted_at;
DROP INDEX IF EXISTS public.idx_employees_country_id;
DROP INDEX IF EXISTS public.idx_employee_login_otps_employee;
DROP INDEX IF EXISTS public.idx_currencies_deleted_at;
DROP INDEX IF EXISTS public.idx_countries_is_sanctioned;
DROP INDEX IF EXISTS public.idx_countries_deleted_at;
DROP INDEX IF EXISTS public.idx_counterparties_role;
DROP INDEX IF EXISTS public.idx_counterparties_deleted_at;
DROP INDEX IF EXISTS public.idx_counterparties_country_id;
DROP INDEX IF EXISTS public.idx_charge_bands_bank_account;
DROP INDEX IF EXISTS public.idx_bene_status;
DROP INDEX IF EXISTS public.idx_bene_employee;
DROP INDEX IF EXISTS public.idx_bene_deleted_at;
DROP INDEX IF EXISTS public.idx_bene_country;
DROP INDEX IF EXISTS public.idx_bene_counterparty;
DROP INDEX IF EXISTS public.idx_banks_is_counterparty;
DROP INDEX IF EXISTS public.idx_banks_deleted_at;
DROP INDEX IF EXISTS public.idx_banks_country_id;
DROP INDEX IF EXISTS public.idx_bank_accounts_is_counterparty;
DROP INDEX IF EXISTS public.idx_bank_accounts_deleted_at;
DROP INDEX IF EXISTS public.idx_bank_accounts_currency_id;
DROP INDEX IF EXISTS public.idx_bank_accounts_counterparty_id;
DROP INDEX IF EXISTS public.idx_bank_accounts_bank_id;
DROP INDEX IF EXISTS public.idx_bank_accounts_account_type_id;
DROP INDEX IF EXISTS public.idx_bands_matrix_id;
DROP INDEX IF EXISTS public.idx_balance_changes_kind;
DROP INDEX IF EXISTS public.idx_balance_changes_account_time;
DROP INDEX IF EXISTS public.idx_bacr_status;
DROP INDEX IF EXISTS public.idx_bacr_requested_by;
DROP INDEX IF EXISTS public.idx_bacr_deleted_at;
DROP INDEX IF EXISTS public.idx_bacr_bene_account;
DROP INDEX IF EXISTS public.idx_audit_logs_user;
DROP INDEX IF EXISTS public.idx_audit_logs_entity;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.idx_appr_deleg_delegator;
DROP INDEX IF EXISTS public.idx_appr_deleg_delegate;
DROP INDEX IF EXISTS public.idx_account_types_deleted_at;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_employee_code_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_id_key;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_code_key;
ALTER TABLE IF EXISTS ONLY public.reconciliation_exceptions DROP CONSTRAINT IF EXISTS reconciliation_exceptions_pkey;
ALTER TABLE IF EXISTS ONLY public.reconciliation_exceptions DROP CONSTRAINT IF EXISTS reconciliation_exceptions_exception_number_key;
ALTER TABLE IF EXISTS ONLY public.payment_types DROP CONSTRAINT IF EXISTS payment_types_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_request_number_key;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_documents DROP CONSTRAINT IF EXISTS payment_request_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_approvals DROP CONSTRAINT IF EXISTS payment_request_approvals_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_categories DROP CONSTRAINT IF EXISTS payment_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.legal_entities DROP CONSTRAINT IF EXISTS legal_entities_pkey;
ALTER TABLE IF EXISTS ONLY public.legal_entities DROP CONSTRAINT IF EXISTS legal_entities_code_key;
ALTER TABLE IF EXISTS ONLY public.incoming_receipts DROP CONSTRAINT IF EXISTS incoming_receipts_receipt_number_key;
ALTER TABLE IF EXISTS ONLY public.incoming_receipts DROP CONSTRAINT IF EXISTS incoming_receipts_pkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipt_documents DROP CONSTRAINT IF EXISTS incoming_receipt_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.fx_rates DROP CONSTRAINT IF EXISTS fx_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_work_email_key;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_pkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_employee_code_key;
ALTER TABLE IF EXISTS ONLY public.employee_login_otps DROP CONSTRAINT IF EXISTS employee_login_otps_pkey;
ALTER TABLE IF EXISTS ONLY public.currencies DROP CONSTRAINT IF EXISTS currencies_pkey;
ALTER TABLE IF EXISTS ONLY public.countries DROP CONSTRAINT IF EXISTS countries_pkey;
ALTER TABLE IF EXISTS ONLY public.countries DROP CONSTRAINT IF EXISTS countries_code_key;
ALTER TABLE IF EXISTS ONLY public.counterparties DROP CONSTRAINT IF EXISTS counterparties_pkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_accounts DROP CONSTRAINT IF EXISTS beneficiary_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.beneficiary_account_change_requests DROP CONSTRAINT IF EXISTS beneficiary_account_change_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.banks DROP CONSTRAINT IF EXISTS banks_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_statement_uploads DROP CONSTRAINT IF EXISTS bank_statement_uploads_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_statement_lines DROP CONSTRAINT IF EXISTS bank_statement_lines_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS bank_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.bank_account_charge_bands DROP CONSTRAINT IF EXISTS bank_account_charge_bands_pkey;
ALTER TABLE IF EXISTS ONLY public.balance_changes DROP CONSTRAINT IF EXISTS balance_changes_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrix_steps DROP CONSTRAINT IF EXISTS approval_matrix_steps_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrix_bands DROP CONSTRAINT IF EXISTS approval_matrix_bands_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS approval_matrices_pkey;
ALTER TABLE IF EXISTS ONLY public.approval_delegations DROP CONSTRAINT IF EXISTS approval_delegations_pkey;
ALTER TABLE IF EXISTS ONLY public.account_types DROP CONSTRAINT IF EXISTS account_types_pkey;
ALTER TABLE IF EXISTS ONLY public.account_types DROP CONSTRAINT IF EXISTS account_types_name_key;
ALTER TABLE IF EXISTS ONLY public.migrations DROP CONSTRAINT IF EXISTS "PK_8c82d7f526340ab734260ea46be";
ALTER TABLE IF EXISTS public.migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.reconciliation_exceptions;
DROP SEQUENCE IF EXISTS public.reconciliation_exception_seq;
DROP TABLE IF EXISTS public.payment_types;
DROP TABLE IF EXISTS public.payment_requests;
DROP SEQUENCE IF EXISTS public.payment_request_seq;
DROP TABLE IF EXISTS public.payment_request_documents;
DROP TABLE IF EXISTS public.payment_request_approvals;
DROP TABLE IF EXISTS public.payment_categories;
DROP SEQUENCE IF EXISTS public.migrations_id_seq;
DROP TABLE IF EXISTS public.migrations;
DROP TABLE IF EXISTS public.legal_entities;
DROP TABLE IF EXISTS public.incoming_receipts;
DROP SEQUENCE IF EXISTS public.incoming_receipt_seq;
DROP TABLE IF EXISTS public.incoming_receipt_documents;
DROP TABLE IF EXISTS public.fx_rates;
DROP TABLE IF EXISTS public.employees;
DROP TABLE IF EXISTS public.employee_login_otps;
DROP TABLE IF EXISTS public.currencies;
DROP TABLE IF EXISTS public.countries;
DROP TABLE IF EXISTS public.counterparties;
DROP TABLE IF EXISTS public.beneficiary_accounts;
DROP TABLE IF EXISTS public.beneficiary_account_change_requests;
DROP TABLE IF EXISTS public.banks;
DROP TABLE IF EXISTS public.bank_statement_uploads;
DROP TABLE IF EXISTS public.bank_statement_lines;
DROP TABLE IF EXISTS public.bank_accounts;
DROP TABLE IF EXISTS public.bank_account_charge_bands;
DROP TABLE IF EXISTS public.balance_changes;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.approval_matrix_steps;
DROP TABLE IF EXISTS public.approval_matrix_bands;
DROP TABLE IF EXISTS public.approval_matrices;
DROP TABLE IF EXISTS public.approval_delegations;
DROP TABLE IF EXISTS public.account_types;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS citext;
-- *not* dropping schema, since initdb creates it
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
-- Name: approval_delegations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_delegations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    delegator_user_id uuid NOT NULL,
    delegate_user_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason character varying(200),
    payment_type_id uuid
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
    counterparty_id uuid,
    account_holder_name character varying(200),
    swift_bic character varying(20),
    iban character varying(60),
    bank_address text,
    correspondent_bank text,
    correspondent_swift character varying(20),
    contact_name character varying(150),
    contact_phone character varying(40),
    contact_phone_alt character varying(40),
    contact_email character varying(150),
    legal_entity_id uuid
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
    legal_entity_id uuid,
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
-- Data for Name: account_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_types (id, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
64f6d996-c3d9-433f-a024-024cf55291d5	Current Account	t	2026-06-23 10:29:05.237612+05:30	2026-06-23 10:29:05.237612+05:30	\N	\N	\N
9ce59edd-d4cd-4c3f-a6d8-c15f07886681	Call Account	t	2026-06-23 10:29:05.240667+05:30	2026-06-23 10:29:05.240667+05:30	\N	\N	\N
6a14fdfd-3cac-4d07-94a1-7bac76dbf7c2	Business Current Account	t	2026-06-23 10:29:05.241107+05:30	2026-06-23 10:29:05.241107+05:30	\N	\N	\N
9e5ba367-e5f5-4c84-90f6-bf0ce671a7ff	Interest Account	t	2026-06-23 10:29:05.241454+05:30	2026-06-23 10:29:05.241454+05:30	\N	\N	\N
210e32f4-2e8e-4166-8661-29c023e99d0c	Fixed Deposit	t	2026-06-23 10:29:05.241794+05:30	2026-06-23 10:29:05.241794+05:30	\N	\N	\N
b8c93a07-3ef2-47fe-bf80-2ca9739a38a6	Savings Account	t	2026-06-23 10:29:05.242124+05:30	2026-06-23 10:29:05.242124+05:30	\N	\N	\N
e7d87014-9a43-41c2-a07e-513ccce3eda0	Nostro Account	t	2026-06-23 10:29:05.242477+05:30	2026-06-23 10:29:05.242477+05:30	\N	\N	\N
\.


--
-- Data for Name: approval_delegations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_delegations (id, created_at, updated_at, deleted_at, created_by, updated_by, delegator_user_id, delegate_user_id, start_date, end_date, reason, payment_type_id) FROM stdin;
\.


--
-- Data for Name: approval_matrices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_matrices (id, name, description, payment_type_id, currency_id, effective_from, effective_to, is_active, created_at, updated_at, deleted_at, created_by, updated_by, tt_mode, treasury_maker_role_id, treasury_checker_role_id, treasury_authoriser_role_id) FROM stdin;
f561c533-4b22-4b2d-998b-60237847326c	Chairman Payments - confidential	\N	5d0eb666-1435-4593-8ae2-021607a473b5	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-06-23	2026-06-30	t	2026-06-23 11:37:14.851123+05:30	2026-06-23 11:37:14.851123+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	\N	\N	15ab6892-78f6-4e88-aa6a-34d5358460c6
e1b46e8e-cff7-4443-90e9-6b25fe2fbc91	Trade Payments — Authority Matrix	Trade payments authority matrix (USD).	4d730eee-15ce-47da-951a-f2c3e60c3ccd	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-06-23	\N	t	2026-06-23 11:48:30.827131+05:30	2026-06-23 11:48:30.827131+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	\N	\N	\N
2e3a959f-9368-4cdc-9c39-42af91a29cb0	Reimbursements	\N	3ebc9866-7b55-4060-bc33-b38833dbf79a	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-06-23	2026-06-30	t	2026-06-23 12:00:22.039785+05:30	2026-06-23 12:00:22.039785+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
\.


--
-- Data for Name: approval_matrix_bands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_matrix_bands (id, matrix_id, sort_order, min_amount, max_amount, created_at) FROM stdin;
f6667785-fe3a-4007-bb05-53dd22dcf066	e1b46e8e-cff7-4443-90e9-6b25fe2fbc91	0	0.0000	100000.0000	2026-06-23 11:48:30.827131+05:30
3cf68fa8-2daa-48c7-969a-e23428e64e75	e1b46e8e-cff7-4443-90e9-6b25fe2fbc91	1	100000.0001	500000.0000	2026-06-23 11:48:30.827131+05:30
f93aae9a-0efd-439a-821d-66f0c8849a03	e1b46e8e-cff7-4443-90e9-6b25fe2fbc91	2	500000.0001	1000000.0000	2026-06-23 11:48:30.827131+05:30
7591242d-2b03-4085-b9a1-9a13bde26d30	e1b46e8e-cff7-4443-90e9-6b25fe2fbc91	3	1000000.0001	\N	2026-06-23 11:48:30.827131+05:30
762341b0-fadc-4c0b-8300-19879d32f002	2e3a959f-9368-4cdc-9c39-42af91a29cb0	0	1.0000	\N	2026-06-23 13:22:16.995718+05:30
\.


--
-- Data for Name: approval_matrix_steps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_matrix_steps (id, band_id, step_order, approver_type, approver_user_id, approver_role_id, is_optional, created_at) FROM stdin;
f9855181-88a0-49d7-bb86-4886efd8e705	f6667785-fe3a-4007-bb05-53dd22dcf066	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-23 11:52:37.03393+05:30
151e52e3-f7bf-4284-a985-2762b4dc4f5c	f6667785-fe3a-4007-bb05-53dd22dcf066	1	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	f	2026-06-23 11:52:37.03393+05:30
5d984ab3-b0d2-4763-b4b4-0c25b585c5fa	3cf68fa8-2daa-48c7-969a-e23428e64e75	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-23 11:52:37.03393+05:30
518ede51-08ae-442f-b20e-6cea8e1cbdc8	3cf68fa8-2daa-48c7-969a-e23428e64e75	1	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	f	2026-06-23 11:52:37.03393+05:30
f4986e8e-8cee-40d6-aa7a-47bf969dced7	f93aae9a-0efd-439a-821d-66f0c8849a03	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-23 11:52:37.03393+05:30
e95167ad-bbbb-4539-a8f4-8be7a4e8897d	f93aae9a-0efd-439a-821d-66f0c8849a03	1	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	f	2026-06-23 11:52:37.03393+05:30
f88ea523-9cad-4d34-a1a1-a5309d8f925a	7591242d-2b03-4085-b9a1-9a13bde26d30	0	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	f	2026-06-23 11:52:37.03393+05:30
eec8a4d1-079a-4e09-b0c6-ff92fed74c1a	7591242d-2b03-4085-b9a1-9a13bde26d30	1	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	f	2026-06-23 11:52:37.03393+05:30
198f55d2-7fe1-44fd-80aa-7dd55b527cda	762341b0-fadc-4c0b-8300-19879d32f002	0	USER	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	\N	f	2026-06-23 13:22:16.995718+05:30
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, action, entity_type, entity_id, user_id, user_email, http_method, path, status_code, success, params, request_body, error_message, ip_address, user_agent, duration_ms, created_at) FROM stdin;
5af0b28e-df37-46bc-bc71-381d6c677686	UPDATE	Employees	8c1d301c-9042-44c8-84c3-3d6e616b1556	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/employees/8c1d301c-9042-44c8-84c3-3d6e616b1556	200	t	{"id": "8c1d301c-9042-44c8-84c3-3d6e616b1556"}	{"fullName": "Sonal Tamboli", "isActive": true, "startDate": "2023-08-25", "workEmail": "sonal@firsteconomy.com", "employeeCode": "EMP-008", "mobileNumber": "+91 98200 12345", "legalEntityId": "d2837668-c91a-4ae9-8c13-42a26d700e1e", "compensationBand": "B2"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	137	2026-06-23 10:14:49.484766+05:30
bd843bd8-fdb4-4008-a39a-bbc880a8a1f2	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	887	2026-06-23 11:19:24.302253+05:30
42848d88-e46f-43fc-b66f-0c6c553dfead	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	685	2026-06-23 11:29:39.757884+05:30
78ca62d6-98f8-4640-84e4-cdbbd6d34f90	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	867	2026-06-23 11:29:50.223529+05:30
9f497c31-305e-4e60-b1d8-10b4160a366d	CREATE	PaymentTypes	b6066058-6735-48da-894d-65a50e98d7c3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "TEST_CONF_001", "name": "Test Confidential", "isActive": true, "direction": "OUTGOING", "makerRoleIds": [], "isConfidential": true, "requiresApprovalChain": false}	\N	::1	curl/8.18.0	63	2026-06-23 11:29:50.478802+05:30
ac4417f8-cf1c-4f5a-bd0e-5d404f22617a	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	830	2026-06-23 11:30:26.220162+05:30
2c97fad8-14a3-4514-b417-fd0058e2816d	DELETE	PaymentTypes	b6066058-6735-48da-894d-65a50e98d7c3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/payment-types/b6066058-6735-48da-894d-65a50e98d7c3	204	t	{"id": "b6066058-6735-48da-894d-65a50e98d7c3"}	\N	\N	::1	curl/8.18.0	113	2026-06-23 11:30:26.578415+05:30
e5122ea3-dd9b-4fb5-a6b4-67fbe027ee31	CREATE	PaymentTypes	5d0eb666-1435-4593-8ae2-021607a473b5	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "CHAIRMAN_PAYMENTS", "name": "Chairman Payments", "isActive": true, "direction": "OUTGOING", "description": "Chairman Payments - confidential", "isBatchBased": false, "makerRoleIds": [], "isConfidential": true, "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": false}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	86	2026-06-23 11:37:14.586634+05:30
04e388ff-fe40-41e1-bb72-c77aa05de3ba	CREATE	ApprovalMatrices	f561c533-4b22-4b2d-998b-60237847326c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "Chairman Payments - confidential", "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-23", "paymentTypeId": "5d0eb666-1435-4593-8ae2-021607a473b5", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	91	2026-06-23 11:37:14.901206+05:30
125c6926-4110-466e-84a5-f276d949cdb8	UPDATE	PaymentTypes	5d0eb666-1435-4593-8ae2-021607a473b5	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/payment-types/5d0eb666-1435-4593-8ae2-021607a473b5	200	t	{"id": "5d0eb666-1435-4593-8ae2-021607a473b5"}	{"code": "CHAIRMAN_PAYMENTS", "name": "Chairman Payments", "isActive": true, "direction": "OUTGOING", "description": "Chairman Payments - confidential", "isBatchBased": false, "makerRoleIds": ["fb4ee674-45b9-4160-aead-ec4470fb1592"], "isConfidential": true, "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": false}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	100	2026-06-23 11:37:27.830412+05:30
306e3759-14d9-4d3c-81c1-3bc2dbde742d	UPDATE	ApprovalMatrices	f561c533-4b22-4b2d-998b-60237847326c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/f561c533-4b22-4b2d-998b-60237847326c	200	t	{"id": "f561c533-4b22-4b2d-998b-60237847326c"}	{"name": "Chairman Payments - confidential", "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-23", "paymentTypeId": "5d0eb666-1435-4593-8ae2-021607a473b5", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	82	2026-06-23 11:37:27.961068+05:30
e7be602b-c9ee-44c1-88be-ed5fe85f72f4	CREATE	Users	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/users	409	f	\N	{"email": "shivam@radiant.com", "fullName": "Shivam", "isActive": true, "password": "[REDACTED]", "employeeCode": "EMP-0072"}	User with email "shivam@radiant.com" already exists	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	24	2026-06-23 11:44:18.582753+05:30
162bcac7-7a3d-418f-b1d6-0f351b700e52	CREATE	Users	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/users	409	f	\N	{"email": "shivam@radiant.com", "fullName": "Shivam", "isActive": true, "password": "[REDACTED]", "employeeCode": "EMP-0073"}	User with email "shivam@radiant.com" already exists	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	5	2026-06-23 11:44:24.320121+05:30
aef3c4f4-22ed-458a-bb44-3c76ee0272e1	CREATE	Users	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/users	409	f	\N	{"email": "shivam@radiant.com", "fullName": "Shivam", "isActive": true, "password": "[REDACTED]", "employeeCode": "EMP-0075"}	User with email "shivam@radiant.com" already exists	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	7	2026-06-23 11:44:29.465236+05:30
6ff05081-7b8e-460f-b378-666637d68ac1	CREATE	UserRoles	427bf42d-cede-4c39-a737-7c0b26989324	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/user-roles	201	t	\N	{"roleId": "0385aa54-b00a-4e55-a9d8-f35ef42568fc", "userId": "401400ac-215b-4bfe-be5f-d89c884e9320"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	46	2026-06-23 11:44:49.14511+05:30
2b62d32c-aa86-4164-8167-29c6627f15ec	DELETE	UserRoles	5620b458-e536-4f42-99fd-da285b1cc77d	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/user-roles/5620b458-e536-4f42-99fd-da285b1cc77d	204	t	{"id": "5620b458-e536-4f42-99fd-da285b1cc77d"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	27	2026-06-23 11:45:05.70287+05:30
4ae388e4-b481-44b9-a404-92eb01da8f28	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	808	2026-06-23 11:51:14.70523+05:30
78a8d76a-edd5-4773-bd65-78b072b69a51	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	3403	2026-06-23 11:55:28.69629+05:30
aba7d8e8-cffa-4d16-b442-ec7d1d705a09	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "790640", "workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	145	2026-06-23 11:55:41.270307+05:30
637e1307-e0d5-493f-aa96-973144ae4c54	CREATE	PaymentTypes	3ebc9866-7b55-4060-bc33-b38833dbf79a	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-types	201	t	\N	{"code": "REIMBURSEMENT", "name": "Employee Reimbursement", "isActive": true, "direction": "OUTGOING", "description": "Employee Reimbursement", "isBatchBased": false, "makerRoleIds": ["3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf"], "checkerRoleId": "0385aa54-b00a-4e55-a9d8-f35ef42568fc", "legalEntityId": "d2837668-c91a-4ae9-8c13-42a26d700e1e", "isConfidential": false, "paymentCategoryId": "2ef7dc78-ca46-4ab7-b030-7b13031e3321", "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	67	2026-06-23 12:00:21.788509+05:30
648ac345-fdfd-4a7e-bcbc-dc72e3a0a096	CREATE	ApprovalMatrices	2e3a959f-9368-4cdc-9c39-42af91a29cb0	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/approval-matrices	201	t	\N	{"name": "Reimbursements", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-23", "paymentTypeId": "3ebc9866-7b55-4060-bc33-b38833dbf79a", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	73	2026-06-23 12:00:22.077217+05:30
1dd3f2b3-b13e-49c2-bac3-975414c32535	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	640	2026-06-23 12:06:14.39032+05:30
579bb4a5-64d8-46fe-a2dc-20d17694c2ce	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	670	2026-06-23 12:15:15.74612+05:30
8b40365c-14cb-47dc-a5df-49860969306c	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	749	2026-06-23 12:19:20.430731+05:30
100d2a0f-59fd-4eb7-8c4f-662763fee871	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	3467	2026-06-23 12:24:57.244746+05:30
ad9070fe-4150-43e8-bfd4-399ace67c3a0	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	780	2026-06-23 12:29:05.154695+05:30
5259b01c-033e-487c-b177-47b3c529ac94	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	810	2026-06-23 12:33:35.561878+05:30
5c6cdb82-36e8-44a5-a351-0c5fba587aed	UPDATE	PaymentTypes	5d0eb666-1435-4593-8ae2-021607a473b5	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/payment-types/5d0eb666-1435-4593-8ae2-021607a473b5	200	t	{"id": "5d0eb666-1435-4593-8ae2-021607a473b5"}	{"code": "CHAIRMAN_PAYMENTS", "name": "Chairman Payments", "isActive": true, "direction": "OUTGOING", "description": "Chairman Payments - confidential", "isBatchBased": false, "makerRoleIds": ["fb4ee674-45b9-4160-aead-ec4470fb1592"], "isConfidential": true, "allowsCrossCurrency": true, "mobileInitiationOnly": true, "requiresApprovalChain": false}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	50	2026-06-23 12:33:50.809272+05:30
b2358d25-3f0c-4fa5-b5d3-6d606f35b17f	UPDATE	ApprovalMatrices	f561c533-4b22-4b2d-998b-60237847326c	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/f561c533-4b22-4b2d-998b-60237847326c	200	t	{"id": "f561c533-4b22-4b2d-998b-60237847326c"}	{"name": "Chairman Payments - confidential", "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-23", "paymentTypeId": "5d0eb666-1435-4593-8ae2-021607a473b5", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	67	2026-06-23 12:33:50.916085+05:30
410b7660-6cee-474f-b100-1863b440e061	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	543	2026-06-23 12:35:55.807512+05:30
32d28fbc-dd3f-4337-b4eb-9c9309d54937	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	289	2026-06-23 12:54:08.948786+05:30
33bccf7b-98a4-4221-86d6-57cc0fcfaf2e	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/extract-invoice	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	328	2026-06-23 12:54:09.341057+05:30
8cb135f8-115f-4b79-93cb-801f21039c21	CREATE	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "7500", "dueDate": "2026-06-25", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782199448686-82324.pdf", "fileName": "invoice-INV-2026-0042.pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "invoiceNumber": "INV-2026-0042", "paymentTypeId": "4d730eee-15ce-47da-951a-f2c3e60c3ccd", "counterpartyId": "91bb0080-571e-43e9-84e8-ff957c08b0a4", "sourceAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "purposeDescription": "Supplier payment for iron ore shipment — PO Gulf-2026-118", "beneficiaryAccountId": "135e4762-0e62-44e0-9332-fe0a6500e0eb"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	267	2026-06-23 12:54:17.322664+05:30
7bda214b-1ee0-452b-a5df-223949d99dbd	SUBMIT	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/submit	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	145	2026-06-23 12:54:33.021753+05:30
cecf8184-4b84-4cd9-b39f-c8c5e55a809f	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	735	2026-06-23 12:54:43.980216+05:30
5f22027b-639f-4ef5-a3ab-ecad710cf775	APPROVE	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/approve	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	201	2026-06-23 12:54:55.401825+05:30
01f5b13e-55d7-4a8b-84b8-cc06d6ef97af	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	659	2026-06-23 12:55:05.928035+05:30
57e20917-4f0b-42e9-8e77-c2436a84094e	APPROVE	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/approve	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	107	2026-06-23 12:55:15.945233+05:30
0aa7751b-8252-4145-83ff-29895c3b59eb	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	572	2026-06-23 12:55:46.079495+05:30
38e8495f-f160-4aaa-97f6-7742e982065f	LOGIN	Auth	\N	\N	pipinkesh@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "pipinkesh@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::ffff:127.0.0.1	Dart/3.12 (dart:io)	41	2026-06-23 12:56:23.177687+05:30
d05476fa-04d6-416d-87ed-26f2f63671b5	LOGIN	Auth	\N	\N	pipinkesh@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "pipinkesh@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::ffff:127.0.0.1	Dart/3.12 (dart:io)	1	2026-06-23 12:56:31.233284+05:30
412eef9c-511f-4aea-8191-005f4e4bd1ce	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::ffff:127.0.0.1	Dart/3.12 (dart:io)	535	2026-06-23 12:56:42.842694+05:30
60cf1301-3a55-4f2d-b5d8-bcf26e683831	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	844	2026-06-23 12:58:34.467952+05:30
54415e00-0b82-44c9-a574-613d74027e89	REJECT	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/reject	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	148	2026-06-23 12:58:43.198464+05:30
eb5fb263-794b-46f8-8fac-a85a2d865363	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	745	2026-06-23 12:59:02.767401+05:30
d1b302be-eebc-4aff-b602-bf45c95845b7	RESUBMIT	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/resubmit	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	62	2026-06-23 12:59:06.586522+05:30
4e744ec3-a3be-46fd-bee2-220ac8d1f226	UPDATE	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	PUT	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206	200	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"amount": "7500.0000", "dueDate": "2026-06-25", "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "invoiceNumber": "INV-2026-0042", "paymentTypeId": "4d730eee-15ce-47da-951a-f2c3e60c3ccd", "counterpartyId": "91bb0080-571e-43e9-84e8-ff957c08b0a4", "sourceAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "purposeDescription": "Supplier payment for iron ore shipment — PO Gulf-2026-118", "beneficiaryAccountId": "135e4762-0e62-44e0-9332-fe0a6500e0eb"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	91	2026-06-23 12:59:14.653694+05:30
ab57ab12-45c0-47ed-b6f9-32f70c4b1523	SUBMIT	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/submit	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	76	2026-06-23 12:59:16.400492+05:30
d35d4893-c087-4f27-afd5-08a9d7546550	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2956	2026-06-23 12:59:26.786665+05:30
3a7788a1-9e87-4394-945c-3f8c73d203a9	APPROVE	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/approve	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"comments": ""}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	309	2026-06-23 12:59:32.894015+05:30
5acfbd77-899a-4366-93f0-d1b25201ac22	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	683	2026-06-23 12:59:44.797545+05:30
4c41c2ba-b0ce-419f-8f3c-57d7be1c9ea8	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	612	2026-06-23 13:00:01.233308+05:30
8d78d925-7aa3-4b81-ac34-8550eb84d50f	APPROVE	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/approve	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	179	2026-06-23 13:00:10.219522+05:30
2195c3ba-f720-47b6-b61d-f54baca3a897	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	606	2026-06-23 13:00:22.315335+05:30
60b12165-caaa-433d-9e90-a25917f7c0b9	APPROVE	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/approve	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	158	2026-06-23 13:00:31.759684+05:30
60c7aede-c003-470b-9559-568c0a532d62	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	667	2026-06-23 13:00:45.434079+05:30
3dfe3c93-4ae6-43cc-924c-80cd0e1171ab	LOGIN	Auth	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abirami@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	596	2026-06-23 13:00:52.386625+05:30
4e19ffed-c700-4015-9f8a-3d3866df782d	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	197	2026-06-23 13:01:49.688913+05:30
da39e5a9-3c60-45ef-8797-c52456239e3e	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/extract-remittance	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	3	2026-06-23 13:01:49.747997+05:30
30a20340-5ea9-41d8-a97f-d5b13e5131f3	TREASURY_SUBMIT	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/treasury/submit	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"swiftCopyUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782199909493-665427.pdf", "referenceNumber": "REF-INV-2026-0042"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	91	2026-06-23 13:01:50.780758+05:30
2bbc9699-1e44-442c-89f8-bd39223bb189	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	636	2026-06-23 13:02:04.022144+05:30
1d0f54bf-596f-45f2-bf28-aa93aee574e9	TREASURY_CHECK	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/treasury/check	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	46	2026-06-23 13:02:06.986039+05:30
57f85788-f775-4758-a7b1-ec587951f35e	LOGIN	Auth	964da820-0264-48cf-8d22-971f8843741d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "anushya@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	526	2026-06-23 13:02:22.114668+05:30
122f279e-625e-4bbe-9b70-bb2a19201656	TREASURY_REJECT	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/treasury/reject	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	134	2026-06-23 13:02:32.924368+05:30
9dda613b-084c-4667-a54a-ef3a410d095d	LOGIN	Auth	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abirami@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	665	2026-06-23 13:02:44.953303+05:30
647acfaa-4fb4-46d9-8b9c-ef176f932cea	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	141	2026-06-23 13:02:56.467222+05:30
0fabad51-3424-4b3b-97b3-dda6fa2623d6	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/extract-remittance	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	5	2026-06-23 13:02:56.52733+05:30
88f16bd0-d444-4cdf-94a2-82d0c32d4b96	TREASURY_SUBMIT	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/treasury/submit	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	{"swiftCopyUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782199976323-712934.pdf", "referenceNumber": "REF-INV-2026-0042"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	74	2026-06-23 13:02:58.293812+05:30
9304a73f-f94a-4fdd-9336-c2397f39af2f	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	605	2026-06-23 13:03:06.511329+05:30
cd171552-da83-45cd-862f-5b45e353e4b6	TREASURY_CHECK	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/treasury/check	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	66	2026-06-23 13:03:09.096698+05:30
8770c1bd-3a4f-435a-9a78-f14022f09cb7	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	657	2026-06-23 13:04:34.855122+05:30
f1069947-c616-4818-822e-9a348c003b78	LOGIN	Auth	964da820-0264-48cf-8d22-971f8843741d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "anushya@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	606	2026-06-23 13:04:44.101334+05:30
8f240078-7f6c-458e-b08c-caedd7083808	TREASURY_COMPLETE	PaymentRequests	f1877c1b-fb1e-4955-8141-ff58fcb92206	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/payment-requests/f1877c1b-fb1e-4955-8141-ff58fcb92206/treasury/complete	201	t	{"id": "f1877c1b-fb1e-4955-8141-ff58fcb92206"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	3393	2026-06-23 13:05:00.560531+05:30
402691c4-e140-49e7-b3a2-e30843e54133	LOGIN	Auth	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ankita@firsteconomy.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	609	2026-06-23 13:06:14.21339+05:30
9f9c13b6-b594-4007-be00-50a2e5d41e9d	LOGIN	Auth	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ankita@firsteconomy.com", "password": "[REDACTED]"}	\N	::ffff:127.0.0.1	Dart/3.12 (dart:io)	1051	2026-06-23 13:06:53.686165+05:30
0b0237fd-17fa-4640-9104-030cdcd0b4e8	CREATE	PaymentRequests	7936d0ff-a8cd-4c15-8e04-99eb133874b1	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "1000.0", "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "paymentTypeId": "5d0eb666-1435-4593-8ae2-021607a473b5", "sourceAccountId": "56e56ac2-e38b-4aed-82f4-da8fca9f1f1c", "purposeDescription": "testing", "beneficiaryAccountId": "97c86923-fd7e-4995-8181-0b1e3abe7ba5"}	\N	::ffff:127.0.0.1	Dart/3.12 (dart:io)	368	2026-06-23 13:08:05.926164+05:30
4a27d9c6-8d2f-45b2-9ae3-30aa7c0b1c62	SUBMIT	PaymentRequests	7936d0ff-a8cd-4c15-8e04-99eb133874b1	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	POST	/api/v1/payment-requests/7936d0ff-a8cd-4c15-8e04-99eb133874b1/submit	201	t	{"id": "7936d0ff-a8cd-4c15-8e04-99eb133874b1"}	\N	\N	::ffff:127.0.0.1	Dart/3.12 (dart:io)	157	2026-06-23 13:08:06.198682+05:30
f7ba6390-c935-40b2-a36f-3c8726a3f182	LOGIN	Auth	964da820-0264-48cf-8d22-971f8843741d	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "anushya@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	592	2026-06-23 13:08:18.829566+05:30
fce8c038-7ac8-4dba-a54b-d7bab9a6e5ff	CREATE	Uploads	\N	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	170	2026-06-23 13:08:31.360079+05:30
bcd0784b-ea3a-4cc7-a1df-7492151a8ba5	CREATE	Uploads	\N	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/uploads/extract-remittance	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	6	2026-06-23 13:08:31.39484+05:30
257bfdbf-4969-495a-a583-d861dde71e3c	TREASURY_COMPLETE	PaymentRequests	7936d0ff-a8cd-4c15-8e04-99eb133874b1	964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	POST	/api/v1/payment-requests/7936d0ff-a8cd-4c15-8e04-99eb133874b1/treasury/complete	201	t	{"id": "7936d0ff-a8cd-4c15-8e04-99eb133874b1"}	{"swiftCopyUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782200311193-770067.pdf", "referenceNumber": "REF-INV-2026-0042"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	3190	2026-06-23 13:08:35.655804+05:30
0d6a3c47-e4c0-4098-a3cc-4fbce1d8d919	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	941	2026-06-23 13:12:25.084085+05:30
489e07e5-3322-466b-91ac-40a31cae381f	LOGIN	Auth	\N	\N	ganesh@radiant.com	POST	/api/v1/auth/login	401	f	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	Invalid credentials	::ffff:127.0.0.1	Dart/3.12 (dart:io)	632	2026-06-23 13:12:55.933777+05:30
4865db2b-a998-40c3-80d7-1a182ce5dcbf	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::ffff:127.0.0.1	Dart/3.12 (dart:io)	960	2026-06-23 13:13:12.591798+05:30
64536d5b-ca7a-44ec-988b-a095065110f8	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2994	2026-06-23 13:14:11.56733+05:30
c9e44367-0563-48a2-88c3-b39dfc3c22f5	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "109917", "workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	143	2026-06-23 13:14:33.887093+05:30
4bc61d6c-7b86-438c-9608-00774ab75d25	CREATE	EmployeePortal	\N	8c1d301c-9042-44c8-84c3-3d6e616b1556	\N	POST	/api/v1/employee/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	132	2026-06-23 13:19:43.379784+05:30
7933e803-4371-4777-be78-3867e2d5ed3b	CREATE	EmployeePortal	4265eef5-1eae-4f20-9a5b-e6c36a863661	8c1d301c-9042-44c8-84c3-3d6e616b1556	\N	POST	/api/v1/employee/payment-requests	201	t	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782200983248-660250.pdf", "fileName": "invoice-INV-2026-0042.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "invoice-INV-2026-0042.pdf", "fileSizeBytes": 929}], "currencyId": "6be7f785-72a8-4db8-9a4c-22230f831200", "paymentTypeId": "3ebc9866-7b55-4060-bc33-b38833dbf79a", "purposeDescription": "taxi fairs", "beneficiaryAccountId": "1b0cdb29-9a28-4525-a679-190e839c9e55"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	195	2026-06-23 13:19:48.120242+05:30
6b3d1b6a-18d6-4a03-a96f-f87a22e03cad	SUBMIT	EmployeePortal	4265eef5-1eae-4f20-9a5b-e6c36a863661	8c1d301c-9042-44c8-84c3-3d6e616b1556	\N	POST	/api/v1/employee/payment-requests/4265eef5-1eae-4f20-9a5b-e6c36a863661/submit	201	t	{"id": "4265eef5-1eae-4f20-9a5b-e6c36a863661"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	111	2026-06-23 13:19:50.883636+05:30
03b04026-c345-4ee0-8ef7-8a27d495a272	LOGIN	Auth	401400ac-215b-4bfe-be5f-d89c884e9320	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "shivam@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	842	2026-06-23 13:20:09.85621+05:30
2cda643d-a5ec-413f-9dfa-a7a0595612a9	APPROVE	PaymentRequests	4265eef5-1eae-4f20-9a5b-e6c36a863661	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/payment-requests/4265eef5-1eae-4f20-9a5b-e6c36a863661/approve	400	f	{"id": "4265eef5-1eae-4f20-9a5b-e6c36a863661"}	{"comments": "tyesting"}	No active approval matrix found for this payment type and currency. Please configure an approval matrix for this currency under Payment Types & Approvals before approving.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	50	2026-06-23 13:20:19.528163+05:30
b591c15c-9f35-4ccf-bdcb-b82f1d8afd35	APPROVE	PaymentRequests	4265eef5-1eae-4f20-9a5b-e6c36a863661	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/payment-requests/4265eef5-1eae-4f20-9a5b-e6c36a863661/approve	400	f	{"id": "4265eef5-1eae-4f20-9a5b-e6c36a863661"}	{"comments": "tyesting"}	No active approval matrix found for this payment type and currency. Please configure an approval matrix for this currency under Payment Types & Approvals before approving.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	15	2026-06-23 13:20:24.990725+05:30
e1d7161f-e4ab-4ba8-91dd-eed872298335	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	742	2026-06-23 13:20:34.798577+05:30
dc76f905-98f0-4246-9709-51e71b08de00	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	951	2026-06-23 13:20:48.168225+05:30
67c1a940-7a53-4d39-823c-c8e25b564543	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	4587	2026-06-23 13:30:45.04842+05:30
dc90fd5e-32ae-440a-98c0-1afe7e2923f5	UPDATE	PaymentTypes	3ebc9866-7b55-4060-bc33-b38833dbf79a	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/payment-types/3ebc9866-7b55-4060-bc33-b38833dbf79a	200	t	{"id": "3ebc9866-7b55-4060-bc33-b38833dbf79a"}	{"code": "REIMBURSEMENT", "name": "Employee Reimbursement", "isActive": true, "direction": "OUTGOING", "description": "Employee Reimbursement", "isBatchBased": false, "makerRoleIds": ["3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf"], "checkerRoleId": "0385aa54-b00a-4e55-a9d8-f35ef42568fc", "legalEntityId": "d2837668-c91a-4ae9-8c13-42a26d700e1e", "isConfidential": false, "paymentCategoryId": "2ef7dc78-ca46-4ab7-b030-7b13031e3321", "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	76	2026-06-23 13:21:17.767507+05:30
a5436ebc-9fa4-494e-bdc4-9c4c6dabe843	UPDATE	ApprovalMatrices	2e3a959f-9368-4cdc-9c39-42af91a29cb0	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/2e3a959f-9368-4cdc-9c39-42af91a29cb0	200	t	{"id": "2e3a959f-9368-4cdc-9c39-42af91a29cb0"}	{"name": "Reimbursements", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": null, "minAmount": 0}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-23", "paymentTypeId": "3ebc9866-7b55-4060-bc33-b38833dbf79a", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	62	2026-06-23 13:21:17.948349+05:30
6648b06b-9871-4263-99f9-962f93fedcf1	UPDATE	PaymentTypes	3ebc9866-7b55-4060-bc33-b38833dbf79a	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/payment-types/3ebc9866-7b55-4060-bc33-b38833dbf79a	200	t	{"id": "3ebc9866-7b55-4060-bc33-b38833dbf79a"}	{"code": "REIMBURSEMENT", "name": "Employee Reimbursement", "isActive": true, "direction": "OUTGOING", "description": "Employee Reimbursement", "isBatchBased": false, "makerRoleIds": ["3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf"], "checkerRoleId": "0385aa54-b00a-4e55-a9d8-f35ef42568fc", "legalEntityId": "d2837668-c91a-4ae9-8c13-42a26d700e1e", "isConfidential": false, "paymentCategoryId": "2ef7dc78-ca46-4ab7-b030-7b13031e3321", "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	61	2026-06-23 13:21:46.136382+05:30
9ae48d13-8ca9-4cef-b9a1-6b05f6dc93e3	UPDATE	ApprovalMatrices	2e3a959f-9368-4cdc-9c39-42af91a29cb0	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/2e3a959f-9368-4cdc-9c39-42af91a29cb0	200	t	{"id": "2e3a959f-9368-4cdc-9c39-42af91a29cb0"}	{"name": "Reimbursements", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": null, "minAmount": 1}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-23", "paymentTypeId": "3ebc9866-7b55-4060-bc33-b38833dbf79a", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	49	2026-06-23 13:21:46.273304+05:30
f96ca7dd-bd7e-47be-93fa-2904e9546a3a	UPDATE	PaymentTypes	3ebc9866-7b55-4060-bc33-b38833dbf79a	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/payment-types/3ebc9866-7b55-4060-bc33-b38833dbf79a	200	t	{"id": "3ebc9866-7b55-4060-bc33-b38833dbf79a"}	{"code": "REIMBURSEMENT", "name": "Employee Reimbursement", "isActive": true, "direction": "OUTGOING", "description": "Employee Reimbursement", "isBatchBased": false, "makerRoleIds": ["3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf"], "checkerRoleId": "0385aa54-b00a-4e55-a9d8-f35ef42568fc", "legalEntityId": "d2837668-c91a-4ae9-8c13-42a26d700e1e", "isConfidential": false, "paymentCategoryId": "2ef7dc78-ca46-4ab7-b030-7b13031e3321", "allowsCrossCurrency": true, "mobileInitiationOnly": false, "requiresApprovalChain": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	54	2026-06-23 13:22:16.831198+05:30
2b575c4f-0360-41f9-bebd-475f7e1793aa	UPDATE	ApprovalMatrices	2e3a959f-9368-4cdc-9c39-42af91a29cb0	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/approval-matrices/2e3a959f-9368-4cdc-9c39-42af91a29cb0	200	t	{"id": "2e3a959f-9368-4cdc-9c39-42af91a29cb0"}	{"name": "Reimbursements", "bands": [{"steps": [{"isOptional": false, "approverType": "USER", "approverUserId": "81968d94-ae95-4c6a-b1d5-b9525c7c9ebd"}], "maxAmount": null, "minAmount": 1}], "ttMode": "ONLINE_TT", "isActive": true, "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "effectiveTo": "2026-06-30", "effectiveFrom": "2026-06-23", "paymentTypeId": "3ebc9866-7b55-4060-bc33-b38833dbf79a", "treasuryMakerRoleId": "10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f", "treasuryCheckerRoleId": "adcb32d4-e1f3-498d-96aa-33018a941d24", "treasuryAuthoriserRoleId": "15ab6892-78f6-4e88-aa6a-34d5358460c6"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	136	2026-06-23 13:22:17.0377+05:30
c8e8ea29-50b0-4cf2-9d6a-a8a8592719a3	LOGIN	Auth	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ali@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	746	2026-06-23 13:22:24.996848+05:30
f353e2a2-453e-4994-a84b-2244c8fa1c86	LOGIN	Auth	401400ac-215b-4bfe-be5f-d89c884e9320	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "shivam@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	734	2026-06-23 13:22:35.100381+05:30
ca4536c7-7e79-45ef-9dbe-d65cdd30ca88	APPROVE	PaymentRequests	4265eef5-1eae-4f20-9a5b-e6c36a863661	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/payment-requests/4265eef5-1eae-4f20-9a5b-e6c36a863661/approve	400	f	{"id": "4265eef5-1eae-4f20-9a5b-e6c36a863661"}	{"comments": "tewsting"}	No active approval matrix found for this payment type and currency. Please configure an approval matrix for this currency under Payment Types & Approvals before approving.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	36	2026-06-23 13:22:53.331044+05:30
a82e278e-0037-47bf-a6f3-fbaf9d9590b6	APPROVE	PaymentRequests	4265eef5-1eae-4f20-9a5b-e6c36a863661	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/payment-requests/4265eef5-1eae-4f20-9a5b-e6c36a863661/approve	400	f	{"id": "4265eef5-1eae-4f20-9a5b-e6c36a863661"}	{"comments": "tewsting"}	No active approval matrix found for this payment type and currency. Please configure an approval matrix for this currency under Payment Types & Approvals before approving.	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	15	2026-06-23 13:22:55.083221+05:30
a65a45dd-2bec-4507-a6e9-1ff8fb198834	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	821	2026-06-23 13:23:18.735603+05:30
3f8f91b7-41e9-497d-93bb-386792a4c991	LOGIN	Auth	401400ac-215b-4bfe-be5f-d89c884e9320	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "shivam@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	757	2026-06-23 13:30:53.330938+05:30
ed685477-514a-46b0-9c68-2788dbb8d164	APPROVE	PaymentRequests	4265eef5-1eae-4f20-9a5b-e6c36a863661	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/payment-requests/4265eef5-1eae-4f20-9a5b-e6c36a863661/approve	201	t	{"id": "4265eef5-1eae-4f20-9a5b-e6c36a863661"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	179	2026-06-23 13:31:02.367637+05:30
84dd5ba6-c955-485d-9536-069dffa13c2b	LOGIN	Auth	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ali@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	710	2026-06-23 13:31:12.936312+05:30
a12a9530-ffd2-4a10-b892-84401074df5b	APPROVE	PaymentRequests	4265eef5-1eae-4f20-9a5b-e6c36a863661	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	POST	/api/v1/payment-requests/4265eef5-1eae-4f20-9a5b-e6c36a863661/approve	201	t	{"id": "4265eef5-1eae-4f20-9a5b-e6c36a863661"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	111	2026-06-23 13:31:20.60528+05:30
d6ca06d9-1e74-41f1-abad-b571fa82dfb3	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	820	2026-06-23 13:32:23.372147+05:30
62912748-3754-4dbe-83c5-8af24014af32	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	curl/8.18.0	843	2026-06-23 13:35:48.787867+05:30
dc562a1f-cd63-43c5-ad88-97641dafc106	CREATE	IncomingReceipts	91c4657f-8390-42eb-a61e-522da32110b1	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/91c4657f-8390-42eb-a61e-522da32110b1/mark-received	201	t	{"id": "91c4657f-8390-42eb-a61e-522da32110b1"}	{"remarks": "test credit", "receivedDate": "2026-06-23", "receivedAmount": "50000", "inwardBankReference": "INW-REF-TEST-001", "receiveFromAccountId": "17780bd6-58b9-4a8b-b4db-c9c64e05d9a3", "receivedCurrencyCode": "USD"}	\N	::1	curl/8.18.0	82	2026-06-23 13:35:49.004473+05:30
88607fd5-4225-4ecb-bdb7-2553a753a755	CREATE	IncomingReceipts	91c4657f-8390-42eb-a61e-522da32110b1	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/91c4657f-8390-42eb-a61e-522da32110b1/mark-received	201	t	{"id": "91c4657f-8390-42eb-a61e-522da32110b1"}	{"remarks": "sdasd", "receivedDate": "2026-06-23", "receivedAmount": "7500.0000", "inwardBankReference": "sdfdsfa", "receiveFromAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "receivedCurrencyCode": "USD"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	130	2026-06-23 13:39:59.737845+05:30
5c34994b-a1da-4be4-a72d-6951c2479adc	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	187	2026-06-23 13:42:11.462216+05:30
025b3a52-c9d4-4751-884c-04531ea66081	CREATE	IncomingReceipts	a4f4d126-42cf-42c6-bcfc-3e319bfab874	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts	201	t	\N	{"documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782202331283-14762.pdf", "fileName": "invoice-INV-2026-0042.pdf", "mimeType": "application/pdf", "documentCode": "SUPPORTING_DOC", "documentLabel": "Supporting Document", "fileSizeBytes": 929}], "legalEntityId": "d2837668-c91a-4ae9-8c13-42a26d700e1e", "counterpartyId": "91bb0080-571e-43e9-84e8-ff957c08b0a4", "expectedAmount": "1000", "purposeDescription": "testing", "receivedFromAccount": "43542353265", "expectedCurrencyCode": "USD", "receiveFromAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	80	2026-06-23 13:42:16.197817+05:30
88b38237-6c59-4dc0-a678-fe3db98d57b8	SUBMIT	IncomingReceipts	a4f4d126-42cf-42c6-bcfc-3e319bfab874	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/a4f4d126-42cf-42c6-bcfc-3e319bfab874/submit	201	t	{"id": "a4f4d126-42cf-42c6-bcfc-3e319bfab874"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	61	2026-06-23 13:42:18.48806+05:30
5120b657-7197-4924-b4d6-6fc70be6c15c	CREATE	IncomingReceipts	a4f4d126-42cf-42c6-bcfc-3e319bfab874	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/incoming-receipts/a4f4d126-42cf-42c6-bcfc-3e319bfab874/mark-received	201	t	{"id": "a4f4d126-42cf-42c6-bcfc-3e319bfab874"}	{"remarks": "testing", "receivedDate": "2026-06-23", "receivedAmount": "1000.0000", "inwardBankReference": "11231232", "receiveFromAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "receivedCurrencyCode": "USD"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	3321	2026-06-23 13:42:40.53803+05:30
c159b38d-d8ce-4254-b44e-2938c963da35	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	864	2026-06-23 13:55:42.399006+05:30
2e569012-6e5b-45c1-aed2-9375dffa938f	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	850	2026-06-23 13:56:42.296502+05:30
340d6301-fe05-4784-8f6a-61b0e5812950	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	212	2026-06-23 13:57:29.915056+05:30
e0cd89b3-8402-45e5-8e29-ef2a04d670ed	CREATE	StatementUploads	82c070b4-9f1e-4a31-9706-659ee5b540ad	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/statement-uploads	201	t	\N	{"notes": "tesrting", "fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782203249713-424273.pdf", "bankAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "statementDate": "2026-06-23", "closingBalance": 2601000, "openingBalance": 2600000}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	102	2026-06-23 13:57:35.911604+05:30
2ff8cfa2-1ad3-4dee-af71-bf84658ecef7	CREATE	Reconciliation	82c070b4-9f1e-4a31-9706-659ee5b540ad	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/reconciliation/uploads/82c070b4-9f1e-4a31-9706-659ee5b540ad/ingest-csv	201	t	{"id": "82c070b4-9f1e-4a31-9706-659ee5b540ad"}	{"runAutoMatch": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	546	2026-06-23 13:57:40.869943+05:30
a6e9a13e-9c01-4453-9fa4-9db1f4646c3e	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	138	2026-06-23 14:00:26.62591+05:30
a26b52dd-83e5-4f3d-9519-735cf6f181ed	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/extract-invoice	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	12	2026-06-23 14:00:26.808945+05:30
0baac124-e933-4d9c-b873-05e753830d07	CREATE	PaymentRequests	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests	500	f	\N	{"amount": "18500", "dueDate": "2026-06-26", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782203426486-446666.pdf", "fileName": "invoice-TRD-2026-0101.pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "invoiceNumber": "TRD-2026-0101", "paymentTypeId": "5d0eb666-1435-4593-8ae2-021607a473b5", "counterpartyId": "e9439123-ad25-4229-a522-7abb124acced", "sourceAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "purposeDescription": "testing", "beneficiaryAccountId": "e036853a-fcd1-43f6-beaf-620749697d0b"}	duplicate key value violates unique constraint "payment_requests_request_number_key"	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	79	2026-06-23 14:00:38.496957+05:30
153cd8df-ef7e-4e14-a770-4d505512f7ca	CREATE	PaymentRequests	0b7aecda-8c90-4225-9c55-36e8b40f45f6	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "18500", "dueDate": "2026-06-26", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782203426486-446666.pdf", "fileName": "invoice-TRD-2026-0101.pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "invoiceNumber": "TRD-2026-0101", "paymentTypeId": "5d0eb666-1435-4593-8ae2-021607a473b5", "counterpartyId": "e9439123-ad25-4229-a522-7abb124acced", "sourceAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "purposeDescription": "testing", "beneficiaryAccountId": "e036853a-fcd1-43f6-beaf-620749697d0b"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	253	2026-06-23 14:00:42.964897+05:30
a7c0677d-f104-4d48-9539-f1ba098eb0d1	SUBMIT	PaymentRequests	0b7aecda-8c90-4225-9c55-36e8b40f45f6	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/payment-requests/0b7aecda-8c90-4225-9c55-36e8b40f45f6/submit	201	t	{"id": "0b7aecda-8c90-4225-9c55-36e8b40f45f6"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	169	2026-06-23 14:01:11.112023+05:30
60839496-a1c0-413b-b5bf-d91df575dd9f	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	732	2026-06-23 14:01:36.8568+05:30
2d6587a9-3ed4-4be0-92e8-5cff3292051a	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	842	2026-06-23 14:01:55.92093+05:30
69fa239e-1cc1-4d46-a15d-57e9a3f7507d	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	724	2026-06-23 14:02:03.026833+05:30
e58ec8bb-6b27-4b57-a0e6-c44a3c467799	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	906	2026-06-23 14:02:19.384401+05:30
48847e79-aa8e-4936-9424-74bfd611347f	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	122	2026-06-23 14:03:12.682979+05:30
9147edc9-e3c7-4c6b-bed6-43dc9a228674	CREATE	Uploads	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/uploads/extract-invoice	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	2	2026-06-23 14:03:12.771948+05:30
d3bfa594-8804-44a7-a665-00912d15dce1	CREATE	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "18500", "dueDate": "2026-06-23", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782203592562-879402.pdf", "fileName": "invoice-TRD-2026-0101.pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "invoiceNumber": "TRD-2026-0101", "paymentTypeId": "4d730eee-15ce-47da-951a-f2c3e60c3ccd", "counterpartyId": "e9439123-ad25-4229-a522-7abb124acced", "sourceAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "purposeDescription": "testing", "beneficiaryAccountId": "e036853a-fcd1-43f6-beaf-620749697d0b"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	202	2026-06-23 14:03:21.773238+05:30
91298456-6ed6-4306-9681-4a474abf97e8	SUBMIT	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/submit	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	127	2026-06-23 14:03:27.661102+05:30
d3e30769-cf64-4e3b-8829-b389d545424e	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	731	2026-06-23 14:03:35.035358+05:30
bb587bbd-c19f-4595-8331-2f9d14096a22	REJECT	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/reject	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	102	2026-06-23 14:03:42.298295+05:30
9567160e-eae1-403f-9c36-97e51766fecf	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	803	2026-06-23 14:03:56.665091+05:30
6f72f4fc-ceaf-465d-b525-6aca3c346244	RESUBMIT	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/resubmit	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	71	2026-06-23 14:04:02.037676+05:30
04c40d04-dee0-4f10-b537-17886f78754c	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	805	2026-06-23 14:12:39.080597+05:30
b4468fbf-a5ca-4ace-b514-22e5e56fe3c8	DELETE	StatementUploads	82c070b4-9f1e-4a31-9706-659ee5b540ad	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/statement-uploads/82c070b4-9f1e-4a31-9706-659ee5b540ad	204	t	{"id": "82c070b4-9f1e-4a31-9706-659ee5b540ad"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	17	2026-06-23 14:14:00.977499+05:30
2a910513-497f-42fb-87bc-cfc47555cdb3	CREATE	Uploads	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	138	2026-06-23 14:15:03.017316+05:30
0373817a-8129-4a31-82f3-9778073fe542	CREATE	StatementUploads	458371e5-0796-438a-8677-5173b4ebbab1	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/statement-uploads	201	t	\N	{"notes": "testing", "fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782204302881-923373.pdf", "bankAccountId": "9dcf2dbb-0583-4eed-bd86-a81db1b8cd99", "statementDate": "2026-06-23", "closingBalance": 2601000, "openingBalance": 2600000}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	22	2026-06-23 14:15:07.598566+05:30
3812c203-c014-4add-b8f3-dd7ffeb7ddb5	CREATE	Reconciliation	458371e5-0796-438a-8677-5173b4ebbab1	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/reconciliation/uploads/458371e5-0796-438a-8677-5173b4ebbab1/ingest-csv	201	t	{"id": "458371e5-0796-438a-8677-5173b4ebbab1"}	{"runAutoMatch": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	528	2026-06-23 14:15:13.828609+05:30
7977833f-9183-4c99-85a6-a6996074a866	DELETE	StatementUploads	458371e5-0796-438a-8677-5173b4ebbab1	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/statement-uploads/458371e5-0796-438a-8677-5173b4ebbab1	204	t	{"id": "458371e5-0796-438a-8677-5173b4ebbab1"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	17	2026-06-23 14:17:55.531074+05:30
dd525f48-0395-4b58-be1d-1b6be77cae66	UPDATE	BankAccounts	aff1be49-3506-46da-b887-6bf61901b9f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/bank-accounts/aff1be49-3506-46da-b887-6bf61901b9f3	200	t	{"id": "aff1be49-3506-46da-b887-6bf61901b9f3"}	{"bankId": "e40249c8-3688-4ad0-97df-3242e8ac5821", "isActive": true, "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "chargeBands": [{"maxAmount": 100000, "minAmount": 0, "percentage": 2.5}, {"maxAmount": 1000000, "minAmount": 100000, "percentage": 1}, {"maxAmount": null, "minAmount": 1000000, "percentage": 0.55}], "accountNumber": "F10 749 409646", "accountTypeId": "64f6d996-c3d9-433f-a024-024cf55291d5", "legalEntityId": "2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf", "minimumBalance": 4000001, "openingBalance": 4000000, "remainingBalance": 4000000, "isChairmanDesignated": false}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	59	2026-06-23 14:20:37.0486+05:30
eedea73e-facb-408b-9da8-b2e75523939f	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/request-otp	204	t	\N	{"workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	3198	2026-06-23 14:21:55.0937+05:30
b9d89159-22b4-45ec-bf00-9ec690af0737	CREATE	EmployeeAuth	\N	\N	\N	POST	/api/v1/employee-auth/verify-otp	200	t	\N	{"code": "076144", "workEmail": "sonal@firsteconomy.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	58	2026-06-23 14:22:07.373451+05:30
6c05cdb6-d813-4dbe-9644-228269d4e2b8	CREATE	EmployeePortal	\N	8c1d301c-9042-44c8-84c3-3d6e616b1556	\N	POST	/api/v1/employee/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	162	2026-06-23 14:28:14.688385+05:30
1cb19582-6b87-4242-9f06-e77823127d99	LOGIN	Auth	401400ac-215b-4bfe-be5f-d89c884e9320	401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "shivam@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	925	2026-06-23 14:42:27.689238+05:30
07162533-fabf-466c-bb34-b40c68e46bf6	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	939	2026-06-23 14:43:46.073552+05:30
cd0fef84-d2ab-4922-8ff8-2a4b06bc54d8	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	708	2026-06-23 14:48:28.115324+05:30
49547c1a-9199-40d2-a8fc-5b6e184da360	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	977	2026-06-23 15:18:53.560143+05:30
910b9ac4-d550-4061-a670-82f48073e8f5	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	743	2026-06-23 15:19:05.407569+05:30
2f26e2d1-53a0-4aee-933c-77788ec864b7	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	854	2026-06-23 15:20:01.30737+05:30
2cf06450-6749-4ece-ac51-86a9f608d481	CREATE	EmployeePortal	\N	8c1d301c-9042-44c8-84c3-3d6e616b1556	\N	POST	/api/v1/employee/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	275	2026-06-23 15:25:25.476228+05:30
b3c05ad8-bafe-408b-a2f5-c88ca7f55c50	CREATE	EmployeePortal	b550d9d5-9879-4458-b3ac-dc0de1e3222c	8c1d301c-9042-44c8-84c3-3d6e616b1556	\N	POST	/api/v1/employee/payment-requests	201	t	\N	{"amount": "1000.0000", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782208525218-211868.pdf", "fileName": "invoice-TRD-2026-0101.pdf", "mimeType": "application/pdf", "documentCode": "RECEIPT", "documentLabel": "invoice-TRD-2026-0101.pdf", "fileSizeBytes": 1054}], "currencyId": "6be7f785-72a8-4db8-9a4c-22230f831200", "paymentTypeId": "3ebc9866-7b55-4060-bc33-b38833dbf79a", "purposeDescription": "taxi fares", "beneficiaryAccountId": "1b0cdb29-9a28-4525-a679-190e839c9e55"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	318	2026-06-23 15:25:29.060591+05:30
5c5e615f-2fda-4ffa-a0d0-9640b2c8e834	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	867	2026-06-23 15:36:25.381278+05:30
3b2f8937-3814-4377-942a-bdbc7db1a56c	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	831	2026-06-23 15:38:00.600417+05:30
f9bcab21-37fa-4a87-a909-252daacefd5f	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	834	2026-06-23 15:39:46.047489+05:30
9c78c29d-0a3d-4ec6-bc9d-90384b941ef9	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	847	2026-06-23 15:41:36.087021+05:30
a0af4dc7-9879-4a91-955a-40a50b46176c	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	955	2026-06-23 15:51:54.984855+05:30
08371830-9ac6-44d4-b297-c4dfebde846a	SUBMIT	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/submit	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	221	2026-06-23 15:52:41.288286+05:30
8c51f968-29fc-4f0b-8e39-b21f37707030	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	954	2026-06-23 15:53:12.74303+05:30
c1d1aa3a-8c29-4436-b23d-4a8743c3bc2e	LOGIN	Auth	fa939508-de63-4abb-b6ca-ff4f4f627c9c	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abhishek@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	807	2026-06-23 15:54:57.46308+05:30
085e7322-1d5f-4bdb-b3c1-0f7d124bd517	APPROVE	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/approve	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	201	2026-06-23 15:59:58.640724+05:30
8e33cdc5-5031-456f-95c5-6d08ed4966a4	LOGIN	Auth	29b1615c-4272-4c8b-9a20-f6b5c9e653da	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "ganesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	971	2026-06-23 16:00:15.432974+05:30
e1eecddd-663a-411f-bb9f-7626de05d951	APPROVE	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/approve	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	131	2026-06-23 16:01:04.130475+05:30
8c6270b1-e8dd-4c97-8265-66f2a353556c	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	855	2026-06-23 16:01:51.946597+05:30
43d3748f-ad4b-4f79-866e-2dcb5869cdcc	APPROVE	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/approve	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	135	2026-06-23 16:02:23.157438+05:30
a3581d36-f097-43a6-aa45-4ee9fbe9130c	LOGIN	Auth	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "pinkesh@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	935	2026-06-23 16:08:24.785638+05:30
c259eb2a-a93b-466f-99dc-68aacf1e26f4	LOGIN	Auth	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "abirami@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	740	2026-06-23 16:08:31.444793+05:30
797d83cc-b0fb-4526-8eea-257e8a012c54	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	336	2026-06-23 16:09:26.072306+05:30
459c5791-6bde-4683-a07c-5a870aba02c1	CREATE	Uploads	\N	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/uploads/extract-remittance	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	556	2026-06-23 16:09:26.661694+05:30
511fbfb7-0744-47b8-a357-d0b82b14d07f	TREASURY_SUBMIT	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/treasury/submit	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	{"swiftCopyUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782211165756-563096.pdf", "referenceNumber": "FT123REF988"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	180	2026-06-23 16:09:27.281301+05:30
c2c523c6-2d5d-4afb-8d94-e293d01cccfa	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	837	2026-06-23 16:10:36.684663+05:30
db5df067-59b8-48ce-b3bb-636c854b177d	LOGIN	Auth	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "saritha@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	825	2026-06-23 16:16:02.286878+05:30
59894ec8-61f5-400c-9f97-0568a013ed9d	LOGIN	Auth	9b085aa8-7467-461a-afb0-50849bb1fec9	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "krrish@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	919	2026-06-23 16:16:47.294093+05:30
251c5a4d-7676-4b47-aacd-9dd9e09efc58	TREASURY_CHECK	PaymentRequests	de673712-5c93-4ee2-a237-dff890878e65	9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	POST	/api/v1/payment-requests/de673712-5c93-4ee2-a237-dff890878e65/treasury/check	201	t	{"id": "de673712-5c93-4ee2-a237-dff890878e65"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	121	2026-06-23 16:19:05.137732+05:30
eed50f7d-a42f-4c2e-bb1d-636e73ea2172	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"email": "admin@radiant.com", "password": "[REDACTED]"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36	859	2026-06-23 16:22:44.788584+05:30
\.


--
-- Data for Name: balance_changes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.balance_changes (id, account_id, kind, previous_balance, new_balance, delta, reason, payment_request_id, receipt_id, statement_upload_id, changed_by, created_at) FROM stdin;
864f0d41-4c1b-440d-8994-1a555eb70b36	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	RECEIPT_CREDIT	2592500.0000	2600000.0000	7500.0000	Incoming receipt IR-2026-0001 received	\N	91c4657f-8390-42eb-a61e-522da32110b1	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-23 13:39:59.610365+05:30
959320f8-5f89-47b7-acd4-7fd942629fcf	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	RECEIPT_CREDIT	2600000.0000	2601000.0000	1000.0000	Incoming receipt IR-2026-00004 received	\N	a4f4d126-42cf-42c6-bcfc-3e319bfab874	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-23 13:42:37.216499+05:30
\.


--
-- Data for Name: bank_account_charge_bands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_account_charge_bands (id, bank_account_id, sort_order, min_amount, max_amount, percentage, created_at) FROM stdin;
a6c519f9-60ea-4441-a683-80700efccf88	aff1be49-3506-46da-b887-6bf61901b9f3	0	0.0000	100000.0000	2.5000	2026-06-23 14:20:37.027664+05:30
166bc90b-ae5c-4a4d-a0e2-895d65ca8127	aff1be49-3506-46da-b887-6bf61901b9f3	1	100000.0000	1000000.0000	1.0000	2026-06-23 14:20:37.027664+05:30
150d2efd-e1fb-49bb-b4ac-27b9456d5ef5	aff1be49-3506-46da-b887-6bf61901b9f3	2	1000000.0000	\N	0.5500	2026-06-23 14:20:37.027664+05:30
6ab6a390-f877-402d-98a2-4c0d5cc34ab3	3d8caf35-f900-4ac8-954a-5577e8c9c884	0	0.0000	100000.0000	1.5000	2026-06-23 10:53:59.416677+05:30
4fb38b54-dc6a-4dfb-9e76-8e8532c21876	3d8caf35-f900-4ac8-954a-5577e8c9c884	1	100000.0000	1000000.0000	0.6000	2026-06-23 10:53:59.417691+05:30
2f335304-b1f4-40f9-8cc3-952f7226c153	3d8caf35-f900-4ac8-954a-5577e8c9c884	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.418285+05:30
1dc86b5a-1cb6-4d7e-bf0f-d49509a0bc5b	53acb2ec-36c5-451b-a11c-604d052ffc45	0	0.0000	100000.0000	1.7500	2026-06-23 10:53:59.41936+05:30
32d58652-1d06-4eac-8c31-48e6d89614c7	53acb2ec-36c5-451b-a11c-604d052ffc45	1	100000.0000	1000000.0000	0.8000	2026-06-23 10:53:59.419834+05:30
150be840-42d5-4157-a1b2-b9e5c87fb3c3	53acb2ec-36c5-451b-a11c-604d052ffc45	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.420191+05:30
48f7023e-919a-4fe7-8444-3d25028e86f7	07b2bd47-e332-4099-9c2b-3e2d87b00080	0	0.0000	100000.0000	2.0000	2026-06-23 10:53:59.420972+05:30
a12c48b2-ee62-4e86-8535-42e9498e22a4	07b2bd47-e332-4099-9c2b-3e2d87b00080	1	100000.0000	1000000.0000	1.0000	2026-06-23 10:53:59.42158+05:30
3a363b26-e4da-4889-ac24-567f243e2a29	07b2bd47-e332-4099-9c2b-3e2d87b00080	2	1000000.0000	\N	0.5500	2026-06-23 10:53:59.422093+05:30
abc3a488-9d90-41ee-a92c-75d851a1fb38	56e56ac2-e38b-4aed-82f4-da8fca9f1f1c	0	0.0000	100000.0000	2.2500	2026-06-23 10:53:59.422928+05:30
bc88ba09-8911-4d81-aef4-cded25d0891b	56e56ac2-e38b-4aed-82f4-da8fca9f1f1c	1	100000.0000	1000000.0000	1.2000	2026-06-23 10:53:59.423348+05:30
6cf2e0b3-b9d0-411d-badd-04386c73602b	56e56ac2-e38b-4aed-82f4-da8fca9f1f1c	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.423804+05:30
ef87862f-be61-4eb4-a0d7-c1cacb68a776	4244e4fd-e2c8-4e16-9d4d-0feda91b2a5c	0	0.0000	100000.0000	2.5000	2026-06-23 10:53:59.424452+05:30
144429f2-56c2-4e3c-877e-331fc39f1985	4244e4fd-e2c8-4e16-9d4d-0feda91b2a5c	1	100000.0000	1000000.0000	0.6000	2026-06-23 10:53:59.424856+05:30
9753e933-7d3e-486e-89b7-b2d25de85f12	4244e4fd-e2c8-4e16-9d4d-0feda91b2a5c	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.425228+05:30
9d37f89a-155f-4f11-9480-3967d14bb045	66f5d9cc-ba85-4bc0-a1d3-ff7ce54aacdf	0	0.0000	100000.0000	1.5000	2026-06-23 10:53:59.425841+05:30
e77bafdf-39ed-40d4-baff-f887f7b68c56	66f5d9cc-ba85-4bc0-a1d3-ff7ce54aacdf	1	100000.0000	1000000.0000	0.8000	2026-06-23 10:53:59.426213+05:30
f8b3a54f-8f0e-4bc2-a1ec-42a1eca89e46	66f5d9cc-ba85-4bc0-a1d3-ff7ce54aacdf	2	1000000.0000	\N	0.5500	2026-06-23 10:53:59.426722+05:30
8c293f0a-55e2-4fcc-83be-dd844f659023	dce629d4-8d88-498c-bd45-9d80304bb65d	0	0.0000	100000.0000	1.7500	2026-06-23 10:53:59.42738+05:30
5cb6ece3-173d-4b93-a39d-a20f56642d06	dce629d4-8d88-498c-bd45-9d80304bb65d	1	100000.0000	1000000.0000	1.0000	2026-06-23 10:53:59.427735+05:30
50e4890b-2b5d-4ab9-919c-c18a375fcb73	dce629d4-8d88-498c-bd45-9d80304bb65d	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.42804+05:30
83c6d5fb-4f64-4f02-a075-657b6c9dd062	014f4163-3509-4538-a453-db917e5c62ae	0	0.0000	100000.0000	2.0000	2026-06-23 10:53:59.428561+05:30
fb3065e4-997d-494a-9852-39ceb06b0ba7	014f4163-3509-4538-a453-db917e5c62ae	1	100000.0000	1000000.0000	1.2000	2026-06-23 10:53:59.42878+05:30
abe62295-dca9-42cf-b200-8b446e4d7d39	014f4163-3509-4538-a453-db917e5c62ae	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.428973+05:30
53994c5f-050d-4a15-a30f-12a81c409a91	415bdadf-9405-4bae-8e9f-557f3e334fe4	0	0.0000	100000.0000	2.2500	2026-06-23 10:53:59.429315+05:30
e29c04b4-2cfc-40f3-ac0e-d109e3bfe768	415bdadf-9405-4bae-8e9f-557f3e334fe4	1	100000.0000	1000000.0000	0.6000	2026-06-23 10:53:59.429503+05:30
e3264864-6e15-4b82-9520-5be682147a0b	415bdadf-9405-4bae-8e9f-557f3e334fe4	2	1000000.0000	\N	0.5500	2026-06-23 10:53:59.429761+05:30
f2925321-fc50-4e20-bb45-1144e608c3d8	89a52914-587a-4f49-b7cb-550c9d121482	0	0.0000	100000.0000	2.5000	2026-06-23 10:53:59.430181+05:30
e56f4c26-9065-4957-862d-139b1b7375e1	89a52914-587a-4f49-b7cb-550c9d121482	1	100000.0000	1000000.0000	0.8000	2026-06-23 10:53:59.430634+05:30
c1a8a0ec-a47c-4d80-bd67-34255c68289b	89a52914-587a-4f49-b7cb-550c9d121482	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.430962+05:30
d14f97fd-661f-4c0f-a7fa-37994faa4460	d69330c6-5fce-4319-8192-9fbeb48280e3	0	0.0000	100000.0000	1.5000	2026-06-23 10:53:59.431431+05:30
4abb4b09-f819-4e15-ba7c-5331d6df921c	d69330c6-5fce-4319-8192-9fbeb48280e3	1	100000.0000	1000000.0000	1.0000	2026-06-23 10:53:59.431666+05:30
78914880-d228-46b5-990e-b7ae79dc8e12	d69330c6-5fce-4319-8192-9fbeb48280e3	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.431874+05:30
504b5948-e058-477c-9e50-2deb4e543bf6	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	0	0.0000	100000.0000	1.7500	2026-06-23 10:53:59.432334+05:30
d94ebb31-a73c-47d8-9cae-dd29803bc84a	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	1	100000.0000	1000000.0000	1.2000	2026-06-23 10:53:59.432694+05:30
5a1755ac-94fc-4d9c-9c5d-2e07e3a49258	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	2	1000000.0000	\N	0.5500	2026-06-23 10:53:59.433055+05:30
5d3afef3-3e6b-45c6-982f-12ea3c2de363	17780bd6-58b9-4a8b-b4db-c9c64e05d9a3	0	0.0000	100000.0000	2.0000	2026-06-23 10:53:59.433792+05:30
13fc1e0a-7bac-4eda-8872-8be19ed17809	17780bd6-58b9-4a8b-b4db-c9c64e05d9a3	1	100000.0000	1000000.0000	0.6000	2026-06-23 10:53:59.434121+05:30
6f858227-0feb-4504-bd7b-afd8c2130576	17780bd6-58b9-4a8b-b4db-c9c64e05d9a3	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.434433+05:30
59cb2279-eeb4-4de7-ba23-6ab1125e87d7	960de65c-5a1e-4b23-b062-aecc790c5be1	0	0.0000	100000.0000	2.2500	2026-06-23 10:53:59.434998+05:30
4a7aec42-ff93-4b32-b057-f0561cba7235	960de65c-5a1e-4b23-b062-aecc790c5be1	1	100000.0000	1000000.0000	0.8000	2026-06-23 10:53:59.435241+05:30
3284987d-6085-43de-b990-7b72da4fbb17	960de65c-5a1e-4b23-b062-aecc790c5be1	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.435466+05:30
7df7db03-b95e-4ea1-b912-3501a4c196d3	108bf6ab-a7d2-48b3-a7bc-1346a48bfe40	0	0.0000	100000.0000	1.5000	2026-06-23 10:53:59.437333+05:30
b8083942-a6b7-49d0-aa15-f6050bc1295f	108bf6ab-a7d2-48b3-a7bc-1346a48bfe40	1	100000.0000	1000000.0000	1.2000	2026-06-23 10:53:59.437556+05:30
384de919-0b14-4bd5-bc52-7fe55a73fe7a	108bf6ab-a7d2-48b3-a7bc-1346a48bfe40	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.437904+05:30
e4060bcc-e522-40c7-a222-de1497e2fd03	3cf5a6d3-8c65-4cd1-8122-4d9d1ce2795f	0	0.0000	100000.0000	1.7500	2026-06-23 10:53:59.438457+05:30
64971a45-b06d-46fa-8c61-d7bb9ae976ed	3cf5a6d3-8c65-4cd1-8122-4d9d1ce2795f	1	100000.0000	1000000.0000	0.6000	2026-06-23 10:53:59.438909+05:30
5c1c0722-ceaf-41de-a468-d99bef4c2462	3cf5a6d3-8c65-4cd1-8122-4d9d1ce2795f	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.439427+05:30
7f054c0a-cf46-4b3a-b88f-9c1e141156b3	bb57cf0e-6c21-4712-a21a-14c4f27b4a98	0	0.0000	100000.0000	2.0000	2026-06-23 10:53:59.440117+05:30
0806a53d-c7a6-4cac-bfd1-d7130e869c92	bb57cf0e-6c21-4712-a21a-14c4f27b4a98	1	100000.0000	1000000.0000	0.8000	2026-06-23 10:53:59.440484+05:30
1d89790d-8cc4-4564-a130-b6d6a46f49ce	bb57cf0e-6c21-4712-a21a-14c4f27b4a98	2	1000000.0000	\N	0.5500	2026-06-23 10:53:59.440868+05:30
c28b512f-4182-4c14-bb80-74c7b1e6e52b	f8e8e4d5-0653-4f4d-9a31-3e59b6d961b7	0	0.0000	100000.0000	2.2500	2026-06-23 10:53:59.441278+05:30
3cb4fb0d-c814-40ad-a58c-ca02d898e786	f8e8e4d5-0653-4f4d-9a31-3e59b6d961b7	1	100000.0000	1000000.0000	1.0000	2026-06-23 10:53:59.441476+05:30
3509029f-f5ec-4221-a324-f2a38ed5cb81	f8e8e4d5-0653-4f4d-9a31-3e59b6d961b7	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.441729+05:30
ee1b975a-4108-4aab-9cc2-3628585cac65	6d591d90-9d77-455d-95b3-2f34f107c6d1	0	0.0000	100000.0000	2.5000	2026-06-23 10:53:59.442208+05:30
f978f76a-d3fe-461a-86e2-f5eb9cff265a	6d591d90-9d77-455d-95b3-2f34f107c6d1	1	100000.0000	1000000.0000	1.2000	2026-06-23 10:53:59.442398+05:30
f43337c2-0307-4b13-88aa-63380642bdf6	6d591d90-9d77-455d-95b3-2f34f107c6d1	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.442556+05:30
d7326483-a68b-4b8d-bac4-191ae9846915	9e58c016-d56d-4dfb-8e0f-c8f20317745c	0	0.0000	100000.0000	1.5000	2026-06-23 10:53:59.442974+05:30
0144e253-4c2c-412c-afeb-f93a02e21273	9e58c016-d56d-4dfb-8e0f-c8f20317745c	1	100000.0000	1000000.0000	0.6000	2026-06-23 10:53:59.443253+05:30
0d7919db-1d79-42a3-86a4-0db6cc02b02b	9e58c016-d56d-4dfb-8e0f-c8f20317745c	2	1000000.0000	\N	0.5500	2026-06-23 10:53:59.443522+05:30
e43650a6-1fe6-48aa-91f8-d7d05838d451	28125913-f80c-438a-8714-f92e2eafb26c	0	0.0000	100000.0000	1.7500	2026-06-23 10:53:59.443948+05:30
1b086b70-5f14-47f2-91ab-ac7166d3dab5	28125913-f80c-438a-8714-f92e2eafb26c	1	100000.0000	1000000.0000	0.8000	2026-06-23 10:53:59.444146+05:30
6bbe1710-025b-4192-ac1c-8bfaf0093764	28125913-f80c-438a-8714-f92e2eafb26c	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.44431+05:30
8082386d-0577-4d59-9d00-c94ec4608e1e	52a9ee2c-df3a-422f-98b6-fba7a732ca62	0	0.0000	100000.0000	2.0000	2026-06-23 10:53:59.444634+05:30
5462cf27-94b4-47d9-be44-bbcb595ffb50	52a9ee2c-df3a-422f-98b6-fba7a732ca62	1	100000.0000	1000000.0000	1.0000	2026-06-23 10:53:59.444788+05:30
8cd85d19-3ddf-485a-ba9b-2a85048d888f	52a9ee2c-df3a-422f-98b6-fba7a732ca62	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.444959+05:30
3924c978-ac0b-45e7-ab53-5865449ca601	d06ff253-efb3-44f1-bf76-2ed72c3983d6	0	0.0000	100000.0000	2.2500	2026-06-23 10:53:59.445419+05:30
7d66da7c-f573-4c81-9039-74e54b53f9bc	d06ff253-efb3-44f1-bf76-2ed72c3983d6	1	100000.0000	1000000.0000	1.2000	2026-06-23 10:53:59.4456+05:30
d75a776c-252f-440b-8293-081b6b160f57	d06ff253-efb3-44f1-bf76-2ed72c3983d6	2	1000000.0000	\N	0.5500	2026-06-23 10:53:59.44579+05:30
56e55604-7ea3-490a-9d1b-5bdeafeb38ff	63acdd36-02f4-4696-9368-3def8020c948	0	0.0000	100000.0000	2.5000	2026-06-23 10:53:59.446126+05:30
25d4a0cd-78d9-48fe-9de0-4c3152718194	63acdd36-02f4-4696-9368-3def8020c948	1	100000.0000	1000000.0000	0.6000	2026-06-23 10:53:59.446298+05:30
a863e729-a2e8-4cbc-a316-6eeaab30c428	63acdd36-02f4-4696-9368-3def8020c948	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.44645+05:30
96e7d838-b0dd-43ee-bc47-1b98909ea4bf	6843da5f-b6f0-4f3f-9692-2796f8adc13f	0	0.0000	100000.0000	1.5000	2026-06-23 10:53:59.446823+05:30
d29e2303-2ed9-48ce-b04e-1f77a6f717c8	6843da5f-b6f0-4f3f-9692-2796f8adc13f	1	100000.0000	1000000.0000	0.8000	2026-06-23 10:53:59.447022+05:30
391e81f6-474e-497d-afe1-feb1cc105f45	6843da5f-b6f0-4f3f-9692-2796f8adc13f	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.447219+05:30
59b64c52-c17e-4941-bff9-39f3ffab8086	a3d4a144-9fa5-453a-b9a1-308963fdfc35	0	0.0000	100000.0000	1.7500	2026-06-23 10:53:59.447612+05:30
d14fe39f-660a-4cf7-903a-c06db2e07903	a3d4a144-9fa5-453a-b9a1-308963fdfc35	1	100000.0000	1000000.0000	1.0000	2026-06-23 10:53:59.448597+05:30
44c284fd-fa26-4aa9-8114-979e13745c25	a3d4a144-9fa5-453a-b9a1-308963fdfc35	2	1000000.0000	\N	0.5500	2026-06-23 10:53:59.448852+05:30
e08c5133-a588-4970-b717-e6748b894c08	b44c4a8f-05a4-4bf0-bbf1-c51e7c9ce984	0	0.0000	100000.0000	2.0000	2026-06-23 10:53:59.449218+05:30
82c92fef-b1f8-4fb8-8288-9cd98478be55	b44c4a8f-05a4-4bf0-bbf1-c51e7c9ce984	1	100000.0000	1000000.0000	1.2000	2026-06-23 10:53:59.449384+05:30
83fdc6a1-bbc8-4804-a427-573bbe16b0c1	b44c4a8f-05a4-4bf0-bbf1-c51e7c9ce984	2	1000000.0000	\N	0.2500	2026-06-23 10:53:59.449558+05:30
d7da8e69-a8c7-44a0-af97-accd6334c83d	643e2b3d-3161-47f4-8ccf-5b578d0a037a	0	0.0000	100000.0000	2.2500	2026-06-23 10:53:59.449992+05:30
6def0b66-b352-43d9-b7a9-99e4a8d18687	643e2b3d-3161-47f4-8ccf-5b578d0a037a	1	100000.0000	1000000.0000	0.6000	2026-06-23 10:53:59.450171+05:30
44e40065-9997-4781-97c1-ad73d892ea57	643e2b3d-3161-47f4-8ccf-5b578d0a037a	2	1000000.0000	\N	0.4000	2026-06-23 10:53:59.450319+05:30
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_accounts (id, bank_id, bank_nickname, currency_id, account_type_id, account_number, branch_name, branch_code, opening_balance, minimum_balance, is_chairman_designated, is_active, created_at, updated_at, deleted_at, created_by, updated_by, bank_name, is_counterparty, remaining_balance, counterparty_id, account_holder_name, swift_bic, iban, bank_address, correspondent_bank, correspondent_swift, contact_name, contact_phone, contact_phone_alt, contact_email, legal_entity_id) FROM stdin;
960de65c-5a1e-4b23-b062-aecc790c5be1	b03f241f-30bd-4f31-b326-e4b6812fb6f6	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	9ce59edd-d4cd-4c3f-a6d8-c15f07886681	F10 749 409476	\N	\N	3300000.0000	100000.0000	f	t	2026-06-23 10:24:26.567737+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Mizuho Bank Ltd	f	3300000.0000	\N	Radiant World Corporation Pte Ltd	MHCBSGSG	\N	\N	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
07b2bd47-e332-4099-9c2b-3e2d87b00080	e83b83e1-a992-4978-8268-4dabde459d2c	Radiant World Corporation Pte Ltd	65f144d3-5ed6-42b7-add7-4e79abaa770c	64f6d996-c3d9-433f-a024-024cf55291d5	CH700788000050725102	\N	\N	1900000.0000	50000.0000	f	t	2026-06-23 10:24:26.566822+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	BCGE Bank	f	1900000.0000	\N	Radiant World Corporation Pte Ltd	BCGECHGGXXX	CH700788000050725102	Geneve 2, 1211 Switzerland	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
52a9ee2c-df3a-422f-98b6-fba7a732ca62	32ce3f16-51e8-4bc4-985c-d5c0942c25b5	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	9ce59edd-d4cd-4c3f-a6d8-c15f07886681	CH7708825116524462002	\N	\N	500000.0000	100000.0000	f	t	2026-06-23 10:24:26.565908+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	TradeX Bank AG	f	500000.0000	\N	Radiant World Corporation Pte Ltd	TXBZCHZZ	CH7708825116524462002	Gartenstrasse 24, Postfach 2136, 8027 Zurich	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
28125913-f80c-438a-8714-f92e2eafb26c	32ce3f16-51e8-4bc4-985c-d5c0942c25b5	Radiant World Corporation Pte Ltd	65f144d3-5ed6-42b7-add7-4e79abaa770c	64f6d996-c3d9-433f-a024-024cf55291d5	CH4708825116524462002	\N	\N	3800000.0000	75000.0000	f	t	2026-06-23 10:24:26.565431+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	TradeX Bank AG	f	3800000.0000	\N	Radiant World Corporation Pte Ltd	TXBZCHZZ	CH4708825116524462002	Gartenstrasse 24, Postfach 2136, 8027 Zurich	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
3d8caf35-f900-4ac8-954a-5577e8c9c884	e40249c8-3688-4ad0-97df-3242e8ac5821	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	CH28087191072211200002	\N	\N	3100000.0000	50000.0000	f	t	2026-06-23 10:24:26.564923+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Arab Bank Switzerland Ltd	f	3100000.0000	\N	Radiant World Corporation Pte Ltd	ARBSCHZZ	CH28087191072211200002	Nuschelerstrasse 1, PO Box 8001, Zurich	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
53acb2ec-36c5-451b-a11c-604d052ffc45	e40249c8-3688-4ad0-97df-3242e8ac5821	Radiant World Corporation Pte Ltd	65f144d3-5ed6-42b7-add7-4e79abaa770c	64f6d996-c3d9-433f-a024-024cf55291d5	CH9808719107221120003	\N	\N	2400000.0000	25000.0000	f	t	2026-06-23 10:24:26.564374+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Arab Bank Switzerland Ltd	f	2400000.0000	\N	Radiant World Corporation Pte Ltd	ARBSCHZZ	CH9808719107221120003	Nuschelerstrasse 1, PO Box 8001, Zurich	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
014f4163-3509-4538-a453-db917e5c62ae	2bc48e8c-f98f-4095-bd00-637b0e9ffdc1	Radiant World Corporation Pte Ltd	3d6970b1-652a-42da-a255-ba4c9d00deab	9ce59edd-d4cd-4c3f-a6d8-c15f07886681	NL67UGBI8263429609	\N	\N	1700000.0000	100000.0000	f	t	2026-06-23 10:24:26.563714+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Garanti Bank	f	1700000.0000	\N	Radiant World Corporation Pte Ltd	UGBINL2A	NL67UGBI8263429609	Amsterdam, Netherlands	\N	CITIUS33	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
415bdadf-9405-4bae-8e9f-557f3e334fe4	2bc48e8c-f98f-4095-bd00-637b0e9ffdc1	Radiant World Corporation Pte Ltd	190044fe-1aa0-4386-a3d1-f9c1cb5ad26b	64f6d996-c3d9-433f-a024-024cf55291d5	NL11UGBI5000147790	\N	\N	1000000.0000	75000.0000	f	t	2026-06-23 10:24:26.563105+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Garanti Bank	f	1000000.0000	\N	Radiant World Corporation Pte Ltd	UGBINL2A	NL11UGBI5000147790	Amsterdam, Netherlands	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
4244e4fd-e2c8-4e16-9d4d-0feda91b2a5c	b366beba-bb1b-4b01-b75e-03a3d7e0ced5	Radiant World Corporation Pte Ltd	99913d2a-9ff8-408d-9cd6-135aff4e9809	64f6d996-c3d9-433f-a024-024cf55291d5	2025682-048	\N	\N	1800000.0000	75000.0000	f	t	2026-06-23 10:24:26.549823+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Deutsche Bank AG	f	1800000.0000	\N	Radiant World Corporation Pte Ltd	DEUTSGSG	\N	Singapore	Deutsche Bank AG, New York	DEUTUS33	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
dce629d4-8d88-498c-bd45-9d80304bb65d	b366beba-bb1b-4b01-b75e-03a3d7e0ced5	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	2025682-051	\N	\N	1100000.0000	50000.0000	f	t	2026-06-23 10:24:26.548987+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Deutsche Bank AG	f	1100000.0000	\N	Radiant World Corporation Pte Ltd	DEUTSGSG	\N	Singapore	Deutsche Bank AG, New York	DEUTUS33	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
66f5d9cc-ba85-4bc0-a1d3-ff7ce54aacdf	b366beba-bb1b-4b01-b75e-03a3d7e0ced5	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	2025682-050	\N	\N	400000.0000	25000.0000	f	t	2026-06-23 10:24:26.532954+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Deutsche Bank AG	f	400000.0000	\N	Radiant World Corporation Pte Ltd	DEUTSGSG	\N	Singapore	Deutsche Bank AG, New York	DEUTUS33	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
a3d4a144-9fa5-453a-b9a1-308963fdfc35	c22c09d0-52e7-44ac-9964-282b5da56b31	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	64f6d996-c3d9-433f-a024-024cf55291d5	7703284039	\N	\N	300000.0000	50000.0000	f	t	2026-06-23 10:24:26.562311+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	UOB Bank	f	300000.0000	\N	Royalline Trading Pte Ltd	UOVBSGSG	\N	80 Raffles Place, Singapore 048624	\N	IRVTUS3NXXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
b44c4a8f-05a4-4bf0-bbf1-c51e7c9ce984	c22c09d0-52e7-44ac-9964-282b5da56b31	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	7739938108	\N	\N	3600000.0000	25000.0000	f	t	2026-06-23 10:24:26.561631+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	UOB Bank	f	3600000.0000	\N	Royalline Trading Pte Ltd	UOVBSGSG	\N	80 Raffles Place, Singapore 048624	\N	IRVTUS3NXXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
643e2b3d-3161-47f4-8ccf-5b578d0a037a	135f391e-ff59-4c87-b6dc-0bae8e2b0808	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	9ce59edd-d4cd-4c3f-a6d8-c15f07886681	1853293493	\N	\N	2900000.0000	100000.0000	f	t	2026-06-23 10:24:26.56092+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Valley Bank	f	2900000.0000	\N	Royalline Trading Pte Ltd	MBNYUS33	\N	\N	\N	\N	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
89a52914-587a-4f49-b7cb-550c9d121482	09d000e1-5664-4216-8d2d-180b58eb5013	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	64f6d996-c3d9-433f-a024-024cf55291d5	142-864438-001	\N	\N	2200000.0000	75000.0000	f	t	2026-06-23 10:24:26.559586+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	HSBC	f	2200000.0000	\N	Royalline Trading Pte Ltd	HSBCSGSG	\N	50 Raffles Place, Singapore Land Tower #01-03, Singapore 048623	\N	MRMDUS33	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
d69330c6-5fce-4319-8192-9fbeb48280e3	09d000e1-5664-4216-8d2d-180b58eb5013	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	64f6d996-c3d9-433f-a024-024cf55291d5	261-014997-178	\N	\N	1500000.0000	50000.0000	f	t	2026-06-23 10:24:26.558839+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	HSBC	f	1500000.0000	\N	Royalline Trading Pte Ltd	HSBCSGSG	\N	50 Raffles Place, Singapore Land Tower #01-03, Singapore 048623	\N	MRMDUS33	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
6d591d90-9d77-455d-95b3-2f34f107c6d1	be47f0c8-5e25-45ca-9d2a-1e2cc74cc65d	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	9ce59edd-d4cd-4c3f-a6d8-c15f07886681	070-56.909.047	\N	\N	100000.0000	100000.0000	f	t	2026-06-23 10:24:26.556606+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	RBI Raiffeisen Bank International AG	f	100000.0000	\N	Royalline Trading Pte Ltd	RZBAATWW	AT0431000007056909047	Am Stadtpark 9, 1030 Vienna, Austria	\N	SCBLUS33XXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
f8e8e4d5-0653-4f4d-9a31-3e59b6d961b7	5c1a6a80-f530-484d-9840-f0878daaedcc	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	64f6d996-c3d9-433f-a024-024cf55291d5	5305-001172-002	\N	\N	3400000.0000	75000.0000	f	t	2026-06-23 10:24:26.555661+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	QNB	f	3400000.0000	\N	Royalline Trading Pte Ltd	QNBASGSG	\N	\N	JP Morgan Chase Bank, New York, USA	CHASUS33XXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
bb57cf0e-6c21-4712-a21a-14c4f27b4a98	5c1a6a80-f530-484d-9840-f0878daaedcc	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	5305001172001	\N	\N	2700000.0000	50000.0000	f	t	2026-06-23 10:24:26.554873+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	QNB	f	2700000.0000	\N	Royalline Trading Pte Ltd	QNBASGSG	\N	\N	JP Morgan Chase Bank, New York, USA	CHASUS33XXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
6843da5f-b6f0-4f3f-9692-2796f8adc13f	c84c669d-4867-43ac-92c5-df165e604534	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	64f6d996-c3d9-433f-a024-024cf55291d5	103702104200S5	\N	\N	2000000.0000	25000.0000	f	t	2026-06-23 10:24:26.554194+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	UCO Bank	f	2000000.0000	\N	Royalline Trading Pte Ltd	UCBASGSGXXX	\N	No.3 Raffles Place, Bharat Building, Singapore 048617	Standard Chartered Bank, New York, USA	SCBLUS33XXX	Pranab Kumar Biswas	(65) 6535 0676	(65) 9488 8578	cmsgmain@ucob.com.sg	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
63acdd36-02f4-4696-9368-3def8020c948	c84c669d-4867-43ac-92c5-df165e604534	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	9ce59edd-d4cd-4c3f-a6d8-c15f07886681	303702108200S6	\N	\N	1300000.0000	100000.0000	f	t	2026-06-23 10:24:26.55352+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	UCO Bank	f	1300000.0000	\N	Royalline Trading Pte Ltd	UCBASGSGXXX	\N	No.3 Raffles Place, Bharat Building, Singapore 048617	Standard Chartered Bank, New York, USA	SCBLUS33XXX	Pranab Kumar Biswas	(65) 6535 0676	(65) 9488 8578	cmsgmain@ucob.com.sg	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	5a9fe5b9-33e2-49f4-ac09-374acf364e5d	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	SS484-001-0001	\N	\N	2600000.0000	75000.0000	f	t	2026-06-23 10:24:26.567302+05:30	2026-06-23 13:42:37.216499+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	Intesa Sanpaolo	f	2601000.0000	\N	Radiant World Corporation Pte Ltd	BCITISGSGXXX	\N	\N	\N	CHASUS33XXX	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
56e56ac2-e38b-4aed-82f4-da8fca9f1f1c	e83b83e1-a992-4978-8268-4dabde459d2c	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	CH9200788000050691465	\N	\N	1200000.0000	25000.0000	f	t	2026-06-23 10:24:26.566382+05:30	2026-06-23 13:08:32.466224+05:30	\N	\N	\N	BCGE Bank	f	1199000.0000	\N	Radiant World Corporation Pte Ltd	BCGECHGGXXX	CH9200788000050691465	Geneve 2, 1211 Switzerland	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
aff1be49-3506-46da-b887-6bf61901b9f3	b03f241f-30bd-4f31-b326-e4b6812fb6f6	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	F10 749 409646	\N	\N	4000000.0000	4000001.0000	f	t	2026-06-23 10:24:26.568224+05:30	2026-06-23 14:20:37.027664+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	Mizuho Bank Ltd	f	4000000.0000	\N	Radiant World Corporation Pte Ltd	MHCBSGSG	\N	Singapore Branch, 12 Marina View, 08-01 Asia Square Tower 2, Singapore	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
17780bd6-58b9-4a8b-b4db-c9c64e05d9a3	0fa1b7e2-f792-417d-8049-6fa239d479b7	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	000455783632	\N	\N	800000.0000	25000.0000	f	t	2026-06-23 10:24:26.557574+05:30	2026-06-23 13:35:48.923441+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	MCB - The Mauritius Commercial Bank Ltd	f	800000.0000	\N	Royalline Trading Pte Ltd	MCBLMUMU	MU38MCBL0944000455783632000USD	\N	\N	\N	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
9e58c016-d56d-4dfb-8e0f-c8f20317745c	6f3a8064-aec1-4291-8473-d097ca939079	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	08705999102825600	\N	\N	600000.0000	75000.0000	f	t	2026-06-23 10:24:26.552797+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Societe Generale	f	600000.0000	\N	Royalline Trading Pte Ltd	SGBACHZZ	CH09 0870 5999 1028 2560 0	Societe Generale, Paris, ZURICH BRANCH, RUE DU RHONE 8, 1204 GENEVA, SWITZERLAND	\N	SOGEUS33XXX	Alberto Kuttel	(41) 58 272 30 12	(41) 79 536 05 82	alberto.kuttel@sgclb.com	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
3cf5a6d3-8c65-4cd1-8122-4d9d1ce2795f	729ca7aa-8c25-45e9-830e-3dea9b2aa409	Royalline Trading Pte Ltd	65f144d3-5ed6-42b7-add7-4e79abaa770c	64f6d996-c3d9-433f-a024-024cf55291d5	711000460	\N	\N	3900000.0000	50000.0000	f	t	2026-06-23 10:24:26.552044+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	NEXENT BANK	f	3900000.0000	\N	Royalline Trading Pte Ltd	FSUICHGG	CH090870599910282560 0	\N	\N	IRVTUS3NXXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
108bf6ab-a7d2-48b3-a7bc-1346a48bfe40	729ca7aa-8c25-45e9-830e-3dea9b2aa409	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	64f6d996-c3d9-433f-a024-024cf55291d5	711000457	\N	\N	3200000.0000	25000.0000	f	t	2026-06-23 10:24:26.551308+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	NEXENT BANK	f	3200000.0000	\N	Royalline Trading Pte Ltd	FSUICHGG	CH9000823600071100045 7	\N	\N	IRVTUS3NXXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
d06ff253-efb3-44f1-bf76-2ed72c3983d6	0bd081dc-5f1d-4dc7-b31d-4eeca77ea7f2	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	9ce59edd-d4cd-4c3f-a6d8-c15f07886681	53650	\N	\N	2500000.0000	100000.0000	f	t	2026-06-23 10:24:26.550538+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Triland Metals Limited	f	2500000.0000	\N	Royalline Trading Pte Ltd	\N	\N	Trading acc	\N	\N	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
\.


--
-- Data for Name: bank_statement_lines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_statement_lines (id, statement_upload_id, bank_account_id, line_index, value_date, posting_date, direction, amount, currency_code, bank_reference, counterparty_text, narrative, running_balance, match_status, matched_payment_request_id, matched_incoming_receipt_id, match_score, match_reason, matched_at, matched_by, exception_id, created_at, updated_at) FROM stdin;
028fffb3-ef90-4f5e-bde1-ebf4d4c307c5	458371e5-0796-438a-8677-5173b4ebbab1	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	1	2026-06-18	\N	CREDIT	7500.0000	USD	\N	\N	INWARD REMITTANCE RECEIVED FROM ASIA METALS PTE LTD REF INW-2026-0098	2607500.0000	CANDIDATE	\N	91c4657f-8390-42eb-a61e-522da32110b1	0.60	Amount match with value date within 5 days	2026-06-23 14:15:13.795+05:30	\N	\N	2026-06-23 14:15:13.300372+05:30	2026-06-23 14:15:13.300372+05:30
8134c44e-84f0-4be5-a48d-8282dea71027	458371e5-0796-438a-8677-5173b4ebbab1	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	2	2026-06-20	\N	DEBIT	7500.0000	USD	\N	\N	OUTWARD TRADE PAYMENT TO GULF TRADE PARTNERS LLC PR-2026-00072 TT-2026-0451	2600000.0000	CANDIDATE	f1877c1b-fb1e-4955-8141-ff58fcb92206	\N	0.60	Amount match with value date within 5 days	2026-06-23 14:15:13.795+05:30	\N	\N	2026-06-23 14:15:13.300372+05:30	2026-06-23 14:15:13.300372+05:30
bdde069f-2e4f-403a-b40d-fb0f5385ced5	458371e5-0796-438a-8677-5173b4ebbab1	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	3	2026-06-22	\N	CREDIT	1000.0000	USD	\N	\N	INWARD CREDIT - MISCELLANEOUS ADJUSTMENT	2601000.0000	CANDIDATE	\N	a4f4d126-42cf-42c6-bcfc-3e319bfab874	0.60	Amount match with value date within 5 days	2026-06-23 14:15:13.795+05:30	\N	\N	2026-06-23 14:15:13.300372+05:30	2026-06-23 14:15:13.300372+05:30
\.


--
-- Data for Name: bank_statement_uploads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_statement_uploads (id, bank_account_id, statement_date, opening_balance, closing_balance, file_url, row_count, notes, ingestion_status, ingestion_format, ingestion_error, auto_match_completed_at, matched_count, candidate_count, exception_count, uploaded_by, created_at, updated_at, deleted_at) FROM stdin;
82c070b4-9f1e-4a31-9706-659ee5b540ad	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	2026-06-23	2600000.0000	2601000.0000	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782203249713-424273.pdf	0	tesrting	PARSE_FAILED	PDF	Could not read this PDF: bad XRef entry	\N	0	0	0	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-23 13:57:35.811977+05:30	2026-06-23 14:14:00.972937+05:30	2026-06-23 14:14:00.972937+05:30
458371e5-0796-438a-8677-5173b4ebbab1	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	2026-06-23	2600000.0000	2601000.0000	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782204302881-923373.pdf	3	testing	MATCHED	PDF	\N	2026-06-23 14:15:13.804+05:30	0	3	0	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-23 14:15:07.577315+05:30	2026-06-23 14:17:55.526315+05:30	2026-06-23 14:17:55.526315+05:30
\.


--
-- Data for Name: banks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.banks (id, name, short_name, country_id, swift_bic, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_counterparty) FROM stdin;
b366beba-bb1b-4b01-b75e-03a3d7e0ced5	Deutsche Bank AG	Deutsche Bank	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	DEUTSGSG	t	2026-06-23 10:29:05.242851+05:30	2026-06-23 10:29:05.242851+05:30	\N	\N	\N	f
0bd081dc-5f1d-4dc7-b31d-4eeca77ea7f2	Triland Metals Limited	Triland	6fde955c-c9fd-49c7-9c4d-35710523d49b	\N	t	2026-06-23 10:29:05.245662+05:30	2026-06-23 10:29:05.245662+05:30	\N	\N	\N	f
729ca7aa-8c25-45e9-830e-3dea9b2aa409	NEXENT BANK	Nexent	89e707e6-19d3-4d6a-afd7-60ceffa50895	FSUICHGG	t	2026-06-23 10:29:05.246177+05:30	2026-06-23 10:29:05.246177+05:30	\N	\N	\N	f
6f3a8064-aec1-4291-8473-d097ca939079	Societe Generale	SocGen	89e707e6-19d3-4d6a-afd7-60ceffa50895	SGBACHZZ	t	2026-06-23 10:29:05.246683+05:30	2026-06-23 10:29:05.246683+05:30	\N	\N	\N	f
c84c669d-4867-43ac-92c5-df165e604534	UCO Bank	UCO	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	UCBASGSGXXX	t	2026-06-23 10:29:05.24709+05:30	2026-06-23 10:29:05.24709+05:30	\N	\N	\N	f
5c1a6a80-f530-484d-9840-f0878daaedcc	QNB	QNB	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	QNBASGSG	t	2026-06-23 10:29:05.247542+05:30	2026-06-23 10:29:05.247542+05:30	\N	\N	\N	f
be47f0c8-5e25-45ca-9d2a-1e2cc74cc65d	RBI Raiffeisen Bank International AG	Raiffeisen	74dbb0eb-4df4-4408-8046-7ab9d8059a22	RZBAATWW	t	2026-06-23 10:29:05.247964+05:30	2026-06-23 10:29:05.247964+05:30	\N	\N	\N	f
0fa1b7e2-f792-417d-8049-6fa239d479b7	MCB - The Mauritius Commercial Bank Ltd	MCB	54e61a70-a3e6-4738-8863-7573f72f37aa	MCBLMUMU	t	2026-06-23 10:29:05.248339+05:30	2026-06-23 10:29:05.248339+05:30	\N	\N	\N	f
09d000e1-5664-4216-8d2d-180b58eb5013	HSBC	HSBC	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	HSBCSGSG	t	2026-06-23 10:29:05.248639+05:30	2026-06-23 10:29:05.248639+05:30	\N	\N	\N	f
135f391e-ff59-4c87-b6dc-0bae8e2b0808	Valley Bank	Valley	44b7d4db-47fc-4ed0-a998-aa0698ffd315	MBNYUS33	t	2026-06-23 10:29:05.248959+05:30	2026-06-23 10:29:05.248959+05:30	\N	\N	\N	f
c22c09d0-52e7-44ac-9964-282b5da56b31	UOB Bank	UOB	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	UOVBSGSG	t	2026-06-23 10:29:05.249372+05:30	2026-06-23 10:29:05.249372+05:30	\N	\N	\N	f
2bc48e8c-f98f-4095-bd00-637b0e9ffdc1	Garanti Bank	Garanti	a033e999-778e-4c2c-aaa4-01a4ab9d40d3	UGBINL2A	t	2026-06-23 10:29:05.249772+05:30	2026-06-23 10:29:05.249772+05:30	\N	\N	\N	f
e40249c8-3688-4ad0-97df-3242e8ac5821	Arab Bank Switzerland Ltd	Arab Bank CH	89e707e6-19d3-4d6a-afd7-60ceffa50895	ARBSCHZZ	t	2026-06-23 10:29:05.250079+05:30	2026-06-23 10:29:05.250079+05:30	\N	\N	\N	f
32ce3f16-51e8-4bc4-985c-d5c0942c25b5	TradeX Bank AG	TradeX	89e707e6-19d3-4d6a-afd7-60ceffa50895	TXBZCHZZ	t	2026-06-23 10:29:05.250413+05:30	2026-06-23 10:29:05.250413+05:30	\N	\N	\N	f
e83b83e1-a992-4978-8268-4dabde459d2c	BCGE Bank	BCGE	89e707e6-19d3-4d6a-afd7-60ceffa50895	BCGECHGGXXX	t	2026-06-23 10:29:05.250708+05:30	2026-06-23 10:29:05.250708+05:30	\N	\N	\N	f
5a9fe5b9-33e2-49f4-ac09-374acf364e5d	Intesa Sanpaolo	Intesa	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	BCITISGSGXXX	t	2026-06-23 10:29:05.25103+05:30	2026-06-23 10:29:05.25103+05:30	\N	\N	\N	f
b03f241f-30bd-4f31-b326-e4b6812fb6f6	Mizuho Bank Ltd	Mizuho	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	MHCBSGSG	t	2026-06-23 10:29:05.25146+05:30	2026-06-23 10:29:05.25146+05:30	\N	\N	\N	f
\.


--
-- Data for Name: beneficiary_account_change_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.beneficiary_account_change_requests (id, beneficiary_account_id, change_type, proposed_data, documents, status, requested_by, requested_at, verified_by, verified_at, verification_notes, callback_evidence, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, cooling_off_override, cooling_off_override_reason, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: beneficiary_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.beneficiary_accounts (id, counterparty_id, employee_id, account_holder_name, account_number, bank_id, branch_name, swift_bic, iban, currency_id, country_id, account_direction, status, cooling_off_until, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
6b416806-2732-4944-a42e-eca697ab1c9d	5ac38e04-2f21-4d3d-8b3a-281bd269980f	\N	Acme Supplies Pvt Ltd	BEN1000000	e40249c8-3688-4ad0-97df-3242e8ac5821	\N	ARBSCHZZ	\N	bcfe9c6e-cd1c-46c2-a822-838830c862ed	a7a8f78e-67f7-4dca-88f0-68831fa7a0ff	PAY_TO	ACTIVE	\N	2026-06-23 11:03:15.472536+05:30	2026-06-23 11:03:15.472536+05:30	\N	\N	\N
a8f1230b-70e0-4fd9-9974-a7bfa13f7f4c	88d9a2fb-089a-4e14-8707-20009364b231	\N	Asia Metals Pte Ltd	BEN1000037	e83b83e1-a992-4978-8268-4dabde459d2c	\N	BCGECHGGXXX	\N	6be7f785-72a8-4db8-9a4c-22230f831200	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	RECEIVE_FROM	ACTIVE	\N	2026-06-23 11:03:15.480962+05:30	2026-06-23 11:03:15.480962+05:30	\N	\N	\N
97c86923-fd7e-4995-8181-0b1e3abe7ba5	418c9eca-7680-4411-abbe-7d0904be5d5f	\N	Britannia Logistics Ltd	BEN1000074	b366beba-bb1b-4b01-b75e-03a3d7e0ced5	\N	DEUTSGSG	\N	3d6970b1-652a-42da-a255-ba4c9d00deab	6fde955c-c9fd-49c7-9c4d-35710523d49b	PAY_TO	ACTIVE	\N	2026-06-23 11:03:15.481809+05:30	2026-06-23 11:03:15.481809+05:30	\N	\N	\N
135e4762-0e62-44e0-9332-fe0a6500e0eb	91bb0080-571e-43e9-84e8-ff957c08b0a4	\N	Gulf Trade Partners LLC	BEN1000111	2bc48e8c-f98f-4095-bd00-637b0e9ffdc1	\N	UGBINL2A	\N	328df0d5-ee2c-4604-971b-61a6494e2e02	510b1066-f4dd-4d84-abd5-83d428caad49	BOTH	ACTIVE	\N	2026-06-23 11:03:15.48271+05:30	2026-06-23 11:03:15.48271+05:30	\N	\N	\N
6608383e-471a-444a-84c6-8349f037b730	80ec1d1d-7141-439f-bd42-36f304e8baf5	\N	Helvetia Trade Finance AG	BEN1000148	09d000e1-5664-4216-8d2d-180b58eb5013	\N	HSBCSGSG	\N	65f144d3-5ed6-42b7-add7-4e79abaa770c	89e707e6-19d3-4d6a-afd7-60ceffa50895	PAY_TO	ACTIVE	\N	2026-06-23 11:03:15.48356+05:30	2026-06-23 11:03:15.48356+05:30	\N	\N	\N
eab041e6-553a-4c0a-8395-acf095740b9f	75937bba-48b0-42bc-bbcb-b80af964a83f	\N	Meridian Commodities Inc	BEN1000185	5a9fe5b9-33e2-49f4-ac09-374acf364e5d	\N	BCITISGSGXX	\N	91a86e49-bd04-41e3-99f6-76548ee5df83	44b7d4db-47fc-4ed0-a998-aa0698ffd315	RECEIVE_FROM	ACTIVE	\N	2026-06-23 11:04:03.171634+05:30	2026-06-23 11:04:03.171634+05:30	\N	\N	\N
e036853a-fcd1-43f6-beaf-620749697d0b	e9439123-ad25-4229-a522-7abb124acced	\N	Shenzhen Hardware Co Ltd	BEN1000222	0fa1b7e2-f792-417d-8049-6fa239d479b7	\N	MCBLMUMU	\N	99913d2a-9ff8-408d-9cd6-135aff4e9809	c1b07583-a883-444e-b5a9-6b366ba1e8f5	PAY_TO	ACTIVE	\N	2026-06-23 11:04:03.177516+05:30	2026-06-23 11:04:03.177516+05:30	\N	\N	\N
b35bb2d1-3f9b-499a-960c-dec16772cac5	9beb07aa-2fcd-4925-8840-3a384ade6f22	\N	Royal Crescent Trading FZE	BEN1000259	b03f241f-30bd-4f31-b326-e4b6812fb6f6	\N	MHCBSGSG	\N	328df0d5-ee2c-4604-971b-61a6494e2e02	510b1066-f4dd-4d84-abd5-83d428caad49	BOTH	ACTIVE	\N	2026-06-23 11:04:03.178797+05:30	2026-06-23 11:04:03.178797+05:30	\N	\N	\N
ce10e034-39d5-4f8f-9a58-405f67fdb395	\N	aaba6ece-43b2-4a64-94aa-4cc9a3649154	Wei Chen	EMP2000000	2bc48e8c-f98f-4095-bd00-637b0e9ffdc1	\N	UGBINL2A	\N	6be7f785-72a8-4db8-9a4c-22230f831200	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	PAY_TO	ACTIVE	\N	2026-06-23 11:04:03.184957+05:30	2026-06-23 11:04:03.184957+05:30	\N	\N	\N
ae944edb-e16c-43c5-a35a-e3f13e4d6ad1	\N	d8b79aa8-0478-4a65-af83-af08271b8023	James Carter	EMP2000053	09d000e1-5664-4216-8d2d-180b58eb5013	\N	HSBCSGSG	\N	3d6970b1-652a-42da-a255-ba4c9d00deab	6fde955c-c9fd-49c7-9c4d-35710523d49b	PAY_TO	ACTIVE	\N	2026-06-23 11:04:03.187286+05:30	2026-06-23 11:04:03.187286+05:30	\N	\N	\N
4b232c21-e194-4750-84dc-d09bac0c2141	\N	735c010c-e0b3-415f-b71b-9a695334fae8	Ahmed Al-Farsi	EMP2000106	5a9fe5b9-33e2-49f4-ac09-374acf364e5d	\N	BCITISGSGXX	\N	328df0d5-ee2c-4604-971b-61a6494e2e02	510b1066-f4dd-4d84-abd5-83d428caad49	PAY_TO	ACTIVE	\N	2026-06-23 11:04:03.188746+05:30	2026-06-23 11:04:03.188746+05:30	\N	\N	\N
c0c1518e-0d35-41a7-b5b1-b1c29ae8e86e	\N	e0514c59-5342-4413-8e39-db9cc17fda0d	Olivia Brown	EMP2000159	0fa1b7e2-f792-417d-8049-6fa239d479b7	\N	MCBLMUMU	\N	91a86e49-bd04-41e3-99f6-76548ee5df83	44b7d4db-47fc-4ed0-a998-aa0698ffd315	PAY_TO	ACTIVE	\N	2026-06-23 11:04:03.190058+05:30	2026-06-23 11:04:03.190058+05:30	\N	\N	\N
1b0cdb29-9a28-4525-a679-190e839c9e55	\N	8c1d301c-9042-44c8-84c3-3d6e616b1556	Sonal Tamboli	0291234567	09d000e1-5664-4216-8d2d-180b58eb5013	Singapore Main Branch	HSBCSGSG	\N	6be7f785-72a8-4db8-9a4c-22230f831200	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	PAY_TO	ACTIVE	\N	2026-06-23 13:17:20.537339+05:30	2026-06-23 13:17:20.537339+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
\.


--
-- Data for Name: counterparties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.counterparties (id, code, name, legal_name, role, country_id, country_code, tax_identifiers, addresses, primary_contact_name, primary_contact_email, primary_contact_phone, notes, is_active, created_at, updated_at, deleted_at, created_by, updated_by, kyc_done) FROM stdin;
5ac38e04-2f21-4d3d-8b3a-281bd269980f	CP-001	Acme Supplies Pvt Ltd	Acme Supplies Private Limited	VENDOR	a7a8f78e-67f7-4dca-88f0-68831fa7a0ff	IN	[{"type": "GSTIN", "value": "27AABCA1234M1Z5"}]	[]	Ramesh Iyer	ramesh@acmesupplies.in	+91 22 4000 1000	\N	t	2026-06-23 11:03:15.437943+05:30	2026-06-23 11:03:15.437943+05:30	\N	\N	\N	t
88d9a2fb-089a-4e14-8707-20009364b231	CP-002	Asia Metals Pte Ltd	Asia Metals Pte. Ltd.	CUSTOMER	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	SG	[{"type": "GST", "value": "201812345A"}]	[]	Lim Wei	lim.wei@asiametals.sg	+65 6500 2000	\N	t	2026-06-23 11:03:15.464751+05:30	2026-06-23 11:03:15.464751+05:30	\N	\N	\N	t
418c9eca-7680-4411-abbe-7d0904be5d5f	CP-003	Britannia Logistics Ltd	Britannia Logistics Limited	VENDOR	6fde955c-c9fd-49c7-9c4d-35710523d49b	GB	[{"type": "VAT", "value": "GB123456789"}]	[]	Oliver Hughes	oliver@britannialog.co.uk	+44 20 7100 3000	\N	t	2026-06-23 11:03:15.465655+05:30	2026-06-23 11:03:15.465655+05:30	\N	\N	\N	t
91bb0080-571e-43e9-84e8-ff957c08b0a4	CP-004	Gulf Trade Partners LLC	Gulf Trade Partners LLC	BOTH	510b1066-f4dd-4d84-abd5-83d428caad49	AE	[{"type": "TRN", "value": "100123456700003"}]	[]	Khalid Hassan	khalid@gulftrade.ae	+971 4 300 4000	\N	t	2026-06-23 11:03:15.466977+05:30	2026-06-23 11:03:15.466977+05:30	\N	\N	\N	t
80ec1d1d-7141-439f-bd42-36f304e8baf5	CP-005	Helvetia Trade Finance AG	Helvetia Trade Finance AG	VENDOR	89e707e6-19d3-4d6a-afd7-60ceffa50895	CH	[{"type": "VAT", "value": "CHE-123.456.789"}]	[]	Anna Keller	anna.keller@helvetiatf.ch	+41 44 500 5000	\N	t	2026-06-23 11:03:15.468339+05:30	2026-06-23 11:03:15.468339+05:30	\N	\N	\N	t
75937bba-48b0-42bc-bbcb-b80af964a83f	CP-006	Meridian Commodities Inc	Meridian Commodities Inc.	CUSTOMER	44b7d4db-47fc-4ed0-a998-aa0698ffd315	US	[{"type": "EIN", "value": "12-3456789"}]	[]	Sarah Johnson	sarah@meridiancomm.com	+1 212 555 6000	\N	t	2026-06-23 11:03:15.469476+05:30	2026-06-23 11:03:15.469476+05:30	\N	\N	\N	t
e9439123-ad25-4229-a522-7abb124acced	CP-007	Shenzhen Hardware Co Ltd	Shenzhen Hardware Co., Ltd.	VENDOR	c1b07583-a883-444e-b5a9-6b366ba1e8f5	CN	[{"type": "OTHER", "value": "9144030012345678XA"}]	[]	Zhang Wei	zhang.wei@szhardware.cn	+86 755 8000 7000	\N	t	2026-06-23 11:03:15.470285+05:30	2026-06-23 11:03:15.470285+05:30	\N	\N	\N	t
9beb07aa-2fcd-4925-8840-3a384ade6f22	CP-008	Royal Crescent Trading FZE	Royal Crescent Trading FZE	BOTH	510b1066-f4dd-4d84-abd5-83d428caad49	AE	[{"type": "TRN", "value": "100987654300003"}]	[]	Fatima Noor	fatima@royalcrescent.ae	+971 4 300 8000	\N	t	2026-06-23 11:03:15.471389+05:30	2026-06-23 11:03:15.471389+05:30	\N	\N	\N	t
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.countries (id, country_name, country_short_name, code, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_sanctioned) FROM stdin;
510b1066-f4dd-4d84-abd5-83d428caad49	United Arab Emirates	UAE	AE	t	2026-06-23 09:49:36.508008+05:30	2026-06-23 09:49:36.508008+05:30	\N	\N	\N	f
89e707e6-19d3-4d6a-afd7-60ceffa50895	Switzerland	Switzerland	CH	t	2026-06-23 09:49:36.522721+05:30	2026-06-23 09:49:36.522721+05:30	\N	\N	\N	f
c1b07583-a883-444e-b5a9-6b366ba1e8f5	China	China	CN	t	2026-06-23 09:49:36.524096+05:30	2026-06-23 09:49:36.524096+05:30	\N	\N	\N	f
8f79357b-c279-4cb1-bbb4-770c03c3ac95	Germany	Germany	DE	t	2026-06-23 09:49:36.52531+05:30	2026-06-23 09:49:36.52531+05:30	\N	\N	\N	f
6fde955c-c9fd-49c7-9c4d-35710523d49b	United Kingdom	UK	GB	t	2026-06-23 09:49:36.526928+05:30	2026-06-23 09:49:36.526928+05:30	\N	\N	\N	f
6c81583f-198a-4d8c-a826-fac186a89436	Hong Kong	Hong Kong	HK	t	2026-06-23 09:49:36.52793+05:30	2026-06-23 09:49:36.52793+05:30	\N	\N	\N	f
a7a8f78e-67f7-4dca-88f0-68831fa7a0ff	India	India	IN	t	2026-06-23 09:49:36.529826+05:30	2026-06-23 09:49:36.529826+05:30	\N	\N	\N	f
cb09aa2a-b6b6-41ff-96c8-356f4f35906c	Singapore	Singapore	SG	t	2026-06-23 09:49:36.530722+05:30	2026-06-23 09:49:36.530722+05:30	\N	\N	\N	f
44b7d4db-47fc-4ed0-a998-aa0698ffd315	United States	USA	US	t	2026-06-23 09:49:36.531812+05:30	2026-06-23 09:49:36.531812+05:30	\N	\N	\N	f
d74b89d6-f6c6-477c-9c4f-4060cef6a368	France	France	FR	t	2026-06-23 09:51:16.372112+05:30	2026-06-23 09:51:16.372112+05:30	\N	\N	\N	f
2e1fc220-dd9a-455a-9226-082c1b6a1d49	South Africa	South Africa	ZA	t	2026-06-23 09:54:09.272325+05:30	2026-06-23 09:54:09.272325+05:30	\N	\N	\N	f
74dbb0eb-4df4-4408-8046-7ab9d8059a22	Austria	Austria	AT	t	2026-06-23 10:29:05.232012+05:30	2026-06-23 10:29:05.232012+05:30	\N	\N	\N	f
a033e999-778e-4c2c-aaa4-01a4ab9d40d3	Netherlands	Netherlands	NL	t	2026-06-23 10:29:05.236324+05:30	2026-06-23 10:29:05.236324+05:30	\N	\N	\N	f
54e61a70-a3e6-4738-8863-7573f72f37aa	Mauritius	Mauritius	MU	t	2026-06-23 10:29:05.237115+05:30	2026-06-23 10:29:05.237115+05:30	\N	\N	\N	f
\.


--
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currencies (id, code, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
328df0d5-ee2c-4604-971b-61a6494e2e02	AED	UAE Dirham	t	2026-06-23 09:47:35.713542+05:30	2026-06-23 09:47:35.713542+05:30	\N	\N	\N
65f144d3-5ed6-42b7-add7-4e79abaa770c	CHF	Swiss Franc	t	2026-06-23 09:47:35.721455+05:30	2026-06-23 09:47:35.721455+05:30	\N	\N	\N
99913d2a-9ff8-408d-9cd6-135aff4e9809	CNH	Chinese Yuan (Offshore)	t	2026-06-23 09:47:35.722299+05:30	2026-06-23 09:47:35.722299+05:30	\N	\N	\N
190044fe-1aa0-4386-a3d1-f9c1cb5ad26b	EUR	Euro	t	2026-06-23 09:47:35.722936+05:30	2026-06-23 09:47:35.722936+05:30	\N	\N	\N
3d6970b1-652a-42da-a255-ba4c9d00deab	GBP	Pound Sterling	t	2026-06-23 09:47:35.723813+05:30	2026-06-23 09:47:35.723813+05:30	\N	\N	\N
aa4f6083-509d-4827-b4cf-1296a5341b71	HKD	Hong Kong Dollar	t	2026-06-23 09:47:35.724756+05:30	2026-06-23 09:47:35.724756+05:30	\N	\N	\N
bcfe9c6e-cd1c-46c2-a822-838830c862ed	INR	Indian Rupee	t	2026-06-23 09:47:35.725512+05:30	2026-06-23 09:47:35.725512+05:30	\N	\N	\N
6be7f785-72a8-4db8-9a4c-22230f831200	SGD	Singapore Dollar	t	2026-06-23 09:47:35.726181+05:30	2026-06-23 09:47:35.726181+05:30	\N	\N	\N
91a86e49-bd04-41e3-99f6-76548ee5df83	USD	US Dollar	t	2026-06-23 09:47:35.726755+05:30	2026-06-23 09:47:35.726755+05:30	\N	\N	\N
737cc4a8-08c8-44b8-b38a-c568567dbb3b	ZAR	South African Rand	t	2026-06-23 09:54:09.241164+05:30	2026-06-23 09:54:09.241164+05:30	\N	\N	\N
13289d71-f03f-437e-b7cc-8830af29cbc1	MUR	Mauritian Rupee	t	2026-06-23 10:29:05.227033+05:30	2026-06-23 10:29:05.227033+05:30	\N	\N	\N
\.


--
-- Data for Name: employee_login_otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_login_otps (id, employee_id, code_hash, expires_at, consumed_at, attempts, created_at) FROM stdin;
efe29914-377d-43bc-b599-d6a665fa0a35	8c1d301c-9042-44c8-84c3-3d6e616b1556	14c1ebbec1bfd18e995cf9333c878d12600906476880a39f27a37888e7ebb950	2026-06-23 12:05:25.315+05:30	2026-06-23 11:55:41.255+05:30	0	2026-06-23 11:55:25.32673+05:30
018461f4-7904-454a-9997-952cde92d563	8c1d301c-9042-44c8-84c3-3d6e616b1556	e301ad0d0465a1950a0f27b4cfd6b369e5eaff0f6fce06a88b57a96f510bb1cd	2026-06-23 12:34:53.865+05:30	2026-06-23 13:14:08.594+05:30	0	2026-06-23 12:24:53.874034+05:30
096721c5-9be4-4025-a0d5-f6bb32827506	8c1d301c-9042-44c8-84c3-3d6e616b1556	5ed162d7d18012cae86901c906b0576ed73def48fa1a5ef94354b8ee959dfa7a	2026-06-23 13:24:08.594+05:30	2026-06-23 13:14:33.873+05:30	0	2026-06-23 13:14:08.607027+05:30
728328f9-e6b5-45be-ae87-7d97db19b124	8c1d301c-9042-44c8-84c3-3d6e616b1556	94891973b1e69444173b2b2d08b16caba4c2e832bd1ba65ac9c5c001549e38e1	2026-06-23 13:40:40.666+05:30	2026-06-23 14:21:51.94+05:30	0	2026-06-23 13:30:40.685342+05:30
b279aa32-914c-42e2-ac3d-f63456d67f93	8c1d301c-9042-44c8-84c3-3d6e616b1556	f60bda512eb197498fbeda8a1718572b498a08f3cf1e457633bf0262bdd85a9f	2026-06-23 14:31:51.939+05:30	2026-06-23 14:22:07.364+05:30	0	2026-06-23 14:21:51.944429+05:30
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, employee_code, full_name, work_email, country_of_employment_id, start_date, end_date, national_id, tax_identifier, date_of_birth, mobile_number, address, compensation_band, is_active, created_at, updated_at, deleted_at, created_by, updated_by, legal_entity_id) FROM stdin;
aaba6ece-43b2-4a64-94aa-4cc9a3649154	EMP-001	Wei Chen	wei.chen@firsteconomy.com	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	2023-02-01	\N	\N	\N	\N	+65 8123 4567	\N	B3	t	2026-06-23 09:59:07.761539+05:30	2026-06-23 09:59:07.761539+05:30	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
005c48fe-d23d-4c57-9871-03aaba9a1704	EMP-002	Priya Nair	priya.nair@firsteconomy.com	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	2022-07-15	\N	\N	\N	\N	+65 9876 5432	\N	B2	t	2026-06-23 09:59:07.814797+05:30	2026-06-23 09:59:07.814797+05:30	\N	\N	\N	d2837668-c91a-4ae9-8c13-42a26d700e1e
d8b79aa8-0478-4a65-af83-af08271b8023	EMP-003	James Carter	james.carter@firsteconomy.com	6fde955c-c9fd-49c7-9c4d-35710523d49b	2021-11-03	\N	\N	\N	\N	+44 7700 900123	\N	B4	t	2026-06-23 09:59:07.816816+05:30	2026-06-23 09:59:07.816816+05:30	\N	\N	\N	e8fc5b9f-68cf-4afd-97b8-e85237ddceed
362328a7-8714-463a-afb0-5ca997637f67	EMP-004	Sophie Müller	sophie.muller@firsteconomy.com	89e707e6-19d3-4d6a-afd7-60ceffa50895	2024-01-08	\N	\N	\N	\N	+41 79 123 4567	\N	B3	t	2026-06-23 09:59:07.818298+05:30	2026-06-23 09:59:07.818298+05:30	\N	\N	\N	6186fcbb-4457-42cf-bcca-d6429199ff20
735c010c-e0b3-415f-b71b-9a695334fae8	EMP-005	Ahmed Al-Farsi	ahmed.alfarsi@firsteconomy.com	510b1066-f4dd-4d84-abd5-83d428caad49	2023-05-20	\N	\N	\N	\N	+971 50 123 4567	\N	B2	t	2026-06-23 09:59:07.819753+05:30	2026-06-23 09:59:07.819753+05:30	\N	\N	\N	5b058f0c-8814-43d6-a818-01ea288520dc
e0514c59-5342-4413-8e39-db9cc17fda0d	EMP-006	Olivia Brown	olivia.brown@firsteconomy.com	44b7d4db-47fc-4ed0-a998-aa0698ffd315	2022-03-10	\N	\N	\N	\N	+1 415 555 0182	\N	B4	t	2026-06-23 09:59:07.821459+05:30	2026-06-23 09:59:07.821459+05:30	\N	\N	\N	68c2f8c2-3344-4a5d-97e7-69e33033588e
fd8e140d-e597-4a9f-9240-491e62bb8fc3	EMP-007	Wong Ka Ming	kaming.wong@firsteconomy.com	6c81583f-198a-4d8c-a826-fac186a89436	2024-09-02	\N	\N	\N	\N	+852 5123 4567	\N	B1	t	2026-06-23 09:59:07.823174+05:30	2026-06-23 09:59:07.823174+05:30	\N	\N	\N	c6724213-d9e2-4bf7-b3e2-a3917977aeef
8c1d301c-9042-44c8-84c3-3d6e616b1556	EMP-008	Sonal Tamboli	sonal@firsteconomy.com	a7a8f78e-67f7-4dca-88f0-68831fa7a0ff	2023-08-25	\N	\N	\N	\N	+91 98200 12345	\N	B2	t	2026-06-23 09:59:07.824569+05:30	2026-06-23 10:14:49.453345+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	d2837668-c91a-4ae9-8c13-42a26d700e1e
\.


--
-- Data for Name: fx_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fx_rates (id, base_currency_code, quote_currency_code, rate, as_of_date, source, fetched_at, provider_name, override_reason, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: incoming_receipt_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incoming_receipt_documents (id, incoming_receipt_id, document_code, document_label, file_name, file_url, file_size_bytes, mime_type, uploaded_by, uploaded_at, created_at) FROM stdin;
7baaaa4c-8db8-4cf5-aad8-1b1e82e10e31	a4f4d126-42cf-42c6-bcfc-3e319bfab874	SUPPORTING_DOC	Supporting Document	invoice-INV-2026-0042.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782202331283-14762.pdf	929	application/pdf	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-23 13:42:16.117556+05:30	2026-06-23 13:42:16.117556+05:30
\.


--
-- Data for Name: incoming_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incoming_receipts (id, receipt_number, legal_entity_id, counterparty_id, receive_from_account_id, expected_amount, expected_currency_code, purpose_description, status, submitted_at, received_at, received_amount, received_currency_code, inward_bank_reference, received_remarks, cancellation_reason, created_at, updated_at, deleted_at, created_by, updated_by, received_from_account) FROM stdin;
91c4657f-8390-42eb-a61e-522da32110b1	IR-2026-0001	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf	88d9a2fb-089a-4e14-8707-20009364b231	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	7500.0000	USD	Expected trade settlement — same account as TRADE_PAYMENT PR-2026-00072	RECEIVED	2026-06-23 13:18:46.167588+05:30	2026-06-23 05:30:00+05:30	7500.0000	USD	sdfdsfa	sdasd	\N	2026-06-23 13:18:46.167588+05:30	2026-06-23 13:39:59.610365+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	Asia Metals Pte Ltd remittance
a4f4d126-42cf-42c6-bcfc-3e319bfab874	IR-2026-00004	d2837668-c91a-4ae9-8c13-42a26d700e1e	91bb0080-571e-43e9-84e8-ff957c08b0a4	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	1000.0000	USD	testing	RECEIVED	2026-06-23 13:42:18.455+05:30	2026-06-23 05:30:00+05:30	1000.0000	USD	11231232	testing	\N	2026-06-23 13:42:16.117556+05:30	2026-06-23 13:42:37.216499+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	43542353265
\.


--
-- Data for Name: legal_entities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.legal_entities (id, name, code, is_active, created_at, updated_at, deleted_at, created_by, updated_by, country_id) FROM stdin;
d2837668-c91a-4ae9-8c13-42a26d700e1e	Radiant World Capital Pte Ltd	RWCAP-SG	t	2026-06-23 09:56:52.164994+05:30	2026-06-23 09:56:52.164994+05:30	\N	\N	\N	cb09aa2a-b6b6-41ff-96c8-356f4f35906c
6186fcbb-4457-42cf-bcca-d6429199ff20	RADIANT WORLD COMMODITIES S.A.	RWCOMM-CH	t	2026-06-23 09:56:52.178116+05:30	2026-06-23 09:56:52.178116+05:30	\N	\N	\N	89e707e6-19d3-4d6a-afd7-60ceffa50895
5b058f0c-8814-43d6-a818-01ea288520dc	RADIANT WORLD COMMODITIES S.A. -DMCC	RWCOMM-DMCC	t	2026-06-23 09:56:52.179649+05:30	2026-06-23 09:56:52.179649+05:30	\N	\N	\N	510b1066-f4dd-4d84-abd5-83d428caad49
2d8e5084-18ba-4b0f-8f9d-b3721f59319c	Radiant World Commodities USA LLC	RWCOMM-US	t	2026-06-23 09:56:52.180696+05:30	2026-06-23 09:56:52.180696+05:30	\N	\N	\N	44b7d4db-47fc-4ed0-a998-aa0698ffd315
e8fc5b9f-68cf-4afd-97b8-e85237ddceed	Radiant World Corporation (UK) Limited	RWCORP-UK	t	2026-06-23 09:56:52.181666+05:30	2026-06-23 09:56:52.181666+05:30	\N	\N	\N	6fde955c-c9fd-49c7-9c4d-35710523d49b
2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf	Radiant World Corporation Pte Ltd	RWCORP-SG	t	2026-06-23 09:56:52.182636+05:30	2026-06-23 09:56:52.182636+05:30	\N	\N	\N	cb09aa2a-b6b6-41ff-96c8-356f4f35906c
e1f5c453-f4da-44be-8d96-fab306c94ece	Radiant World Corporation S.A.	RWCORP-CH	t	2026-06-23 09:56:52.183621+05:30	2026-06-23 09:56:52.183621+05:30	\N	\N	\N	89e707e6-19d3-4d6a-afd7-60ceffa50895
68c2f8c2-3344-4a5d-97e7-69e33033588e	Radiant World Corporation USA LLC	RWCORP-US	t	2026-06-23 09:56:52.184436+05:30	2026-06-23 09:56:52.184436+05:30	\N	\N	\N	44b7d4db-47fc-4ed0-a998-aa0698ffd315
94b55ffe-3457-4b56-a1f9-754c6afb866a	Radiant World Group Holding Company Limited	RWGHC-HK	t	2026-06-23 09:56:52.185235+05:30	2026-06-23 09:56:52.185235+05:30	\N	\N	\N	6c81583f-198a-4d8c-a826-fac186a89436
b6ce0d28-e09d-4f97-803a-e14b0f5d533c	RADIANT WORLD INVESTMENT UK LTD	RWINV-UK	t	2026-06-23 09:56:52.186298+05:30	2026-06-23 09:56:52.186298+05:30	\N	\N	\N	6fde955c-c9fd-49c7-9c4d-35710523d49b
bbf4e3a4-3487-45d6-9262-ca681e3ffe83	Rawsteel Minmetals Pte Ltd	RAWSTEEL-SG	t	2026-06-23 09:56:52.187175+05:30	2026-06-23 09:56:52.187175+05:30	\N	\N	\N	cb09aa2a-b6b6-41ff-96c8-356f4f35906c
c6724213-d9e2-4bf7-b3e2-a3917977aeef	RGL COMPANY LIMITED	RGL-HK	t	2026-06-23 09:56:52.187884+05:30	2026-06-23 09:56:52.187884+05:30	\N	\N	\N	6c81583f-198a-4d8c-a826-fac186a89436
c2aa6f23-7d9f-4f56-89a5-a048baadb76d	Royalline Trading Pte Ltd	RLT-SG	t	2026-06-23 10:51:15.578831+05:30	2026-06-23 10:51:15.578831+05:30	\N	\N	\N	cb09aa2a-b6b6-41ff-96c8-356f4f35906c
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1781000000000	AddReceivedFromAccountToIncomingReceipts1781000000000
2	1782000000000	AddBankAccountSheetDetails1782000000000
3	1782000000001	AddLegalEntityToBankAccounts1782000000001
4	1782000000002	MakePaymentTypeLegalEntityNullable1782000000002
5	1782000000002	RemoveCurrencyFromCountries1782000000002
\.


--
-- Data for Name: payment_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_categories (id, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
6ec3aebe-76f3-46f1-829a-b9d8bd93078f	Trade Payments	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
2ef7dc78-ca46-4ab7-b030-7b13031e3321	Non-Trade Payments	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
7ffd6e18-379c-4695-9fa2-9854cf75d038	Capital Expenditure	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
5d9f3908-2cf6-4310-83d5-d3c98c0373e0	Exceptional Payments	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
\.


--
-- Data for Name: payment_request_approvals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_request_approvals (id, payment_request_id, step_order, approver_type, approver_user_id, approver_role_id, decision, decided_by, decided_at, comments, created_at, updated_at) FROM stdin;
4d22a006-b904-43f7-a316-421e8fac1c84	f1877c1b-fb1e-4955-8141-ff58fcb92206	1	ROLE	\N	81c68ec5-f574-4031-b9dd-a93a42ef108d	APPROVED	fa939508-de63-4abb-b6ca-ff4f4f627c9c	2026-06-23 12:59:32.591+05:30		2026-06-23 12:59:16.323143+05:30	2026-06-23 12:59:32.582311+05:30
e42c956f-d629-4e73-a2df-fe81263c98b6	f1877c1b-fb1e-4955-8141-ff58fcb92206	2	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	APPROVED	29b1615c-4272-4c8b-9a20-f6b5c9e653da	2026-06-23 13:00:10.047+05:30	testing	2026-06-23 12:59:32.582311+05:30	2026-06-23 13:00:10.039508+05:30
148deac9-b83f-4b71-8495-6d4f1ff6a28d	f1877c1b-fb1e-4955-8141-ff58fcb92206	3	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	APPROVED	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	2026-06-23 13:00:31.627+05:30	testing	2026-06-23 12:59:32.582311+05:30	2026-06-23 13:00:31.605303+05:30
424f5a30-0c40-4694-aab9-c2475aa2c172	4265eef5-1eae-4f20-9a5b-e6c36a863661	1	ROLE	\N	0385aa54-b00a-4e55-a9d8-f35ef42568fc	APPROVED	401400ac-215b-4bfe-be5f-d89c884e9320	2026-06-23 13:31:02.205+05:30	testing	2026-06-23 13:19:50.774285+05:30	2026-06-23 13:31:02.189865+05:30
03dd8ac9-66e8-481c-9337-3959759f657f	4265eef5-1eae-4f20-9a5b-e6c36a863661	2	USER	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	\N	APPROVED	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	2026-06-23 13:31:20.503+05:30	testing	2026-06-23 13:31:02.189865+05:30	2026-06-23 13:31:20.493463+05:30
9e9e1c3b-13c8-4cc0-aa00-55d2065deae7	de673712-5c93-4ee2-a237-dff890878e65	1	ROLE	\N	81c68ec5-f574-4031-b9dd-a93a42ef108d	APPROVED	fa939508-de63-4abb-b6ca-ff4f4f627c9c	2026-06-23 15:59:58.466+05:30	testing	2026-06-23 15:52:41.068352+05:30	2026-06-23 15:59:58.440765+05:30
f47680be-811c-4648-a7a8-f28188dae64e	de673712-5c93-4ee2-a237-dff890878e65	2	USER	29b1615c-4272-4c8b-9a20-f6b5c9e653da	\N	APPROVED	29b1615c-4272-4c8b-9a20-f6b5c9e653da	2026-06-23 16:01:04.025+05:30	testing	2026-06-23 15:59:58.440765+05:30	2026-06-23 16:01:03.998925+05:30
5f96c49d-5d49-4ebb-9594-9285b72c912b	de673712-5c93-4ee2-a237-dff890878e65	3	USER	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	\N	APPROVED	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	2026-06-23 16:02:23.058+05:30	testing	2026-06-23 15:59:58.440765+05:30	2026-06-23 16:02:23.022388+05:30
\.


--
-- Data for Name: payment_request_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_request_documents (id, payment_request_id, document_code, document_label, file_name, file_url, file_size_bytes, mime_type, uploaded_by, uploaded_at, created_at, updated_at) FROM stdin;
8f1c683a-9958-4720-9309-46aa519abfd0	f1877c1b-fb1e-4955-8141-ff58fcb92206	INVOICE	Invoice	invoice-INV-2026-0042.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782199448686-82324.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-23 12:54:17.087644+05:30	2026-06-23 12:54:17.087644+05:30	2026-06-23 12:54:17.087644+05:30
8b4ed35a-04a6-4bd7-bd65-581d8d2b1ebe	4265eef5-1eae-4f20-9a5b-e6c36a863661	RECEIPT	invoice-INV-2026-0042.pdf	invoice-INV-2026-0042.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782200983248-660250.pdf	929	application/pdf	\N	2026-06-23 13:19:47.927597+05:30	2026-06-23 13:19:47.927597+05:30	2026-06-23 13:19:47.927597+05:30
cc5e41f5-e9d0-40a5-bfc3-5fb00d4770ad	0b7aecda-8c90-4225-9c55-36e8b40f45f6	INVOICE	Invoice	invoice-TRD-2026-0101.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782203426486-446666.pdf	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	2026-06-23 14:00:42.721009+05:30	2026-06-23 14:00:42.721009+05:30	2026-06-23 14:00:42.721009+05:30
4e257b3e-2509-4bd4-8e55-dc3be4271ae9	de673712-5c93-4ee2-a237-dff890878e65	INVOICE	Invoice	invoice-TRD-2026-0101.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782203592562-879402.pdf	\N	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	2026-06-23 14:03:21.591073+05:30	2026-06-23 14:03:21.591073+05:30	2026-06-23 14:03:21.591073+05:30
539e871c-1f1d-4576-bc67-93b7d8153857	b550d9d5-9879-4458-b3ac-dc0de1e3222c	RECEIPT	invoice-TRD-2026-0101.pdf	invoice-TRD-2026-0101.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782208525218-211868.pdf	1054	application/pdf	\N	2026-06-23 15:25:28.747156+05:30	2026-06-23 15:25:28.747156+05:30	2026-06-23 15:25:28.747156+05:30
\.


--
-- Data for Name: payment_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_requests (id, request_number, payment_type_id, counterparty_id, employee_id, beneficiary_account_id, source_account_id, currency_id, amount, purpose_description, invoice_number, due_date, status, submitted_at, approved_at, released_at, paid_at, matrix_id, current_step_order, bank_reference, value_date, proof_of_payment_url, sanction_warning, sanction_override_reason, counterparty_snapshot, beneficiary_snapshot, rejection_reason, cancellation_reason, withdrawn_reason, created_at, updated_at, deleted_at, created_by, updated_by, anomaly_flag, anomaly_notes, tt_mode, treasury_reference_number, swift_copy_url, treasury_maker_by, treasury_maker_at, treasury_checker_by, treasury_checker_at, treasury_authoriser_by, treasury_authoriser_at, completed_at, treasury_maker_role_id, treasury_checker_role_id, treasury_authoriser_role_id, raised_by_employee_id) FROM stdin;
f1877c1b-fb1e-4955-8141-ff58fcb92206	PR-2026-00072	4d730eee-15ce-47da-951a-f2c3e60c3ccd	91bb0080-571e-43e9-84e8-ff957c08b0a4	\N	135e4762-0e62-44e0-9332-fe0a6500e0eb	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	91a86e49-bd04-41e3-99f6-76548ee5df83	7500.0000	Supplier payment for iron ore shipment — PO Gulf-2026-118	INV-2026-0042	2026-06-25	COMPLETED	2026-06-23 12:59:16.351+05:30	2026-06-23 13:00:31.631+05:30	\N	\N	e1b46e8e-cff7-4443-90e9-6b25fe2fbc91	\N	\N	\N	\N	f	\N	{"id": "91bb0080-571e-43e9-84e8-ff957c08b0a4", "countryId": "510b1066-f4dd-4d84-abd5-83d428caad49", "legalName": "Gulf Trade Partners LLC"}	{"id": "135e4762-0e62-44e0-9332-fe0a6500e0eb", "iban": null, "bankId": "2bc48e8c-f98f-4095-bd00-637b0e9ffdc1", "swiftBic": "UGBINL2A", "countryId": "510b1066-f4dd-4d84-abd5-83d428caad49", "currencyId": "328df0d5-ee2c-4604-971b-61a6494e2e02", "accountNumber": "BEN1000111", "accountHolderName": "Gulf Trade Partners LLC"}	\N	\N	\N	2026-06-23 12:54:17.087644+05:30	2026-06-23 13:04:57.172002+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	964da820-0264-48cf-8d22-971f8843741d	f	\N	ONLINE_TT	REF-INV-2026-0042	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782199976323-712934.pdf	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	2026-06-23 13:02:58.233+05:30	9b085aa8-7467-461a-afb0-50849bb1fec9	2026-06-23 13:03:09.041+05:30	964da820-0264-48cf-8d22-971f8843741d	2026-06-23 13:04:57.197+05:30	2026-06-23 13:04:57.197+05:30	\N	\N	\N	\N
7936d0ff-a8cd-4c15-8e04-99eb133874b1	PR-2026-00073	5d0eb666-1435-4593-8ae2-021607a473b5	\N	\N	97c86923-fd7e-4995-8181-0b1e3abe7ba5	56e56ac2-e38b-4aed-82f4-da8fca9f1f1c	91a86e49-bd04-41e3-99f6-76548ee5df83	1000.0000	testing	\N	\N	COMPLETED	2026-06-23 13:08:06.122+05:30	2026-06-23 13:08:06.122+05:30	\N	\N	f561c533-4b22-4b2d-998b-60237847326c	\N	\N	\N	\N	f	\N	\N	{"id": "97c86923-fd7e-4995-8181-0b1e3abe7ba5", "iban": null, "bankId": "b366beba-bb1b-4b01-b75e-03a3d7e0ced5", "swiftBic": "DEUTSGSG", "countryId": "6fde955c-c9fd-49c7-9c4d-35710523d49b", "currencyId": "3d6970b1-652a-42da-a255-ba4c9d00deab", "accountNumber": "BEN1000074", "accountHolderName": "Britannia Logistics Ltd"}	\N	\N	\N	2026-06-23 13:08:05.596655+05:30	2026-06-23 13:08:32.466224+05:30	\N	803b17c2-2f24-40a3-a3d3-09e7fcf388c1	964da820-0264-48cf-8d22-971f8843741d	f	\N	\N	REF-INV-2026-0042	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782200311193-770067.pdf	\N	\N	\N	\N	964da820-0264-48cf-8d22-971f8843741d	2026-06-23 13:08:32.533+05:30	2026-06-23 13:08:32.533+05:30	\N	\N	15ab6892-78f6-4e88-aa6a-34d5358460c6	\N
4265eef5-1eae-4f20-9a5b-e6c36a863661	PR-2026-00074	3ebc9866-7b55-4060-bc33-b38833dbf79a	\N	8c1d301c-9042-44c8-84c3-3d6e616b1556	1b0cdb29-9a28-4525-a679-190e839c9e55	\N	6be7f785-72a8-4db8-9a4c-22230f831200	1000.0000	taxi fairs	\N	\N	TREASURY_MAKER	2026-06-23 13:19:50.812+05:30	2026-06-23 13:31:20.515+05:30	\N	\N	2e3a959f-9368-4cdc-9c39-42af91a29cb0	\N	\N	\N	\N	f	\N	\N	{"id": "1b0cdb29-9a28-4525-a679-190e839c9e55", "iban": null, "bankId": "09d000e1-5664-4216-8d2d-180b58eb5013", "swiftBic": "HSBCSGSG", "countryId": "cb09aa2a-b6b6-41ff-96c8-356f4f35906c", "currencyId": "6be7f785-72a8-4db8-9a4c-22230f831200", "accountNumber": "0291234567", "accountHolderName": "Sonal Tamboli"}	\N	\N	\N	2026-06-23 13:19:47.927597+05:30	2026-06-23 13:31:20.493463+05:30	\N	\N	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	f	\N	ONLINE_TT	\N	\N	\N	\N	\N	\N	\N	\N	\N	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6	8c1d301c-9042-44c8-84c3-3d6e616b1556
fb9ef718-1d65-4979-a575-85062a7c21ee	PR-2026-00075	4d730eee-15ce-47da-951a-f2c3e60c3ccd	91bb0080-571e-43e9-84e8-ff957c08b0a4	\N	135e4762-0e62-44e0-9332-fe0a6500e0eb	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	91a86e49-bd04-41e3-99f6-76548ee5df83	18500.0000	Second trade settlement on the same account	\N	\N	COMPLETED	2026-06-23 13:52:48.642848+05:30	\N	\N	\N	\N	\N	TT-PR-2026-00075	2026-06-23	\N	f	\N	\N	\N	\N	\N	\N	2026-06-23 13:52:48.642848+05:30	2026-06-23 13:52:48.642848+05:30	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-06-23 13:52:48.642848+05:30	\N	\N	\N	\N
0b7aecda-8c90-4225-9c55-36e8b40f45f6	PR-2026-00076	5d0eb666-1435-4593-8ae2-021607a473b5	e9439123-ad25-4229-a522-7abb124acced	\N	e036853a-fcd1-43f6-beaf-620749697d0b	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	91a86e49-bd04-41e3-99f6-76548ee5df83	18500.0000	testing	TRD-2026-0101	2026-06-26	TREASURY_AUTHORISER	2026-06-23 14:01:11.032+05:30	2026-06-23 14:01:11.032+05:30	\N	\N	f561c533-4b22-4b2d-998b-60237847326c	\N	\N	\N	\N	f	\N	{"id": "e9439123-ad25-4229-a522-7abb124acced", "countryId": "c1b07583-a883-444e-b5a9-6b366ba1e8f5", "legalName": "Shenzhen Hardware Co., Ltd."}	{"id": "e036853a-fcd1-43f6-beaf-620749697d0b", "iban": null, "bankId": "0fa1b7e2-f792-417d-8049-6fa239d479b7", "swiftBic": "MCBLMUMU", "countryId": "c1b07583-a883-444e-b5a9-6b366ba1e8f5", "currencyId": "99913d2a-9ff8-408d-9cd6-135aff4e9809", "accountNumber": "BEN1000222", "accountHolderName": "Shenzhen Hardware Co Ltd"}	\N	\N	\N	2026-06-23 14:00:42.721009+05:30	2026-06-23 14:01:10.94406+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	15ab6892-78f6-4e88-aa6a-34d5358460c6	\N
b550d9d5-9879-4458-b3ac-dc0de1e3222c	PR-2026-00078	3ebc9866-7b55-4060-bc33-b38833dbf79a	\N	8c1d301c-9042-44c8-84c3-3d6e616b1556	1b0cdb29-9a28-4525-a679-190e839c9e55	\N	6be7f785-72a8-4db8-9a4c-22230f831200	1000.0000	taxi fares	\N	\N	DRAFT	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	2026-06-23 15:25:28.747156+05:30	2026-06-23 15:25:28.747156+05:30	\N	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	8c1d301c-9042-44c8-84c3-3d6e616b1556
de673712-5c93-4ee2-a237-dff890878e65	PR-2026-00077	4d730eee-15ce-47da-951a-f2c3e60c3ccd	e9439123-ad25-4229-a522-7abb124acced	\N	e036853a-fcd1-43f6-beaf-620749697d0b	9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	91a86e49-bd04-41e3-99f6-76548ee5df83	18500.0000	testing	TRD-2026-0101	2026-06-23	TREASURY_AUTHORISER	2026-06-23 15:52:41.18+05:30	2026-06-23 16:02:23.067+05:30	\N	\N	e1b46e8e-cff7-4443-90e9-6b25fe2fbc91	\N	\N	\N	\N	f	\N	{"id": "e9439123-ad25-4229-a522-7abb124acced", "countryId": "c1b07583-a883-444e-b5a9-6b366ba1e8f5", "legalName": "Shenzhen Hardware Co., Ltd."}	{"id": "e036853a-fcd1-43f6-beaf-620749697d0b", "iban": null, "bankId": "0fa1b7e2-f792-417d-8049-6fa239d479b7", "swiftBic": "MCBLMUMU", "countryId": "c1b07583-a883-444e-b5a9-6b366ba1e8f5", "currencyId": "99913d2a-9ff8-408d-9cd6-135aff4e9809", "accountNumber": "BEN1000222", "accountHolderName": "Shenzhen Hardware Co Ltd"}	\N	\N	\N	2026-06-23 14:03:21.591073+05:30	2026-06-23 16:19:05.016415+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	9b085aa8-7467-461a-afb0-50849bb1fec9	f	\N	ONLINE_TT	FT123REF988	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1782211165756-563096.pdf	734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	2026-06-23 16:09:27.122+05:30	9b085aa8-7467-461a-afb0-50849bb1fec9	2026-06-23 16:19:05.036+05:30	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: payment_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_types (id, code, name, description, direction, requires_approval_chain, is_batch_based, is_confidential, mobile_initiation_only, allows_cross_currency, document_policy, field_config, is_system, is_active, version, effective_from, effective_to, created_at, updated_at, deleted_at, created_by, updated_by, payment_category_id, maker_role_id, checker_role_id, maker_user_id, checker_user_id, legal_entity_id, maker_role_ids, employee_self_service) FROM stdin;
b6066058-6735-48da-894d-65a50e98d7c3	TEST_CONF_001	Test Confidential	\N	OUTGOING	f	f	t	f	t	[]	[]	f	t	1	2026-06-23	\N	2026-06-23 11:29:50.453376+05:30	2026-06-23 11:30:26.572411+05:30	2026-06-23 11:30:26.572411+05:30	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	\N	\N	\N	\N	\N	{}	f
4d730eee-15ce-47da-951a-f2c3e60c3ccd	TRADE_PAYMENT	Trade Payment	Trade payments. Maker: Ops Team. Checker: Accounts Team. Approvers: Ganesh, Pinkesh.	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-06-23	\N	2026-06-23 11:48:30.827131+05:30	2026-06-23 11:48:30.827131+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	6ec3aebe-76f3-46f1-829a-b9d8bd93078f	64424fa9-5141-49d7-84c8-f2b10feeec22	81c68ec5-f574-4031-b9dd-a93a42ef108d	\N	\N	d2837668-c91a-4ae9-8c13-42a26d700e1e	{64424fa9-5141-49d7-84c8-f2b10feeec22}	f
5d0eb666-1435-4593-8ae2-021607a473b5	CHAIRMAN_PAYMENTS	Chairman Payments	Chairman Payments - confidential	OUTGOING	f	f	t	t	t	[]	[]	f	t	1	2026-06-23	\N	2026-06-23 11:37:14.540981+05:30	2026-06-23 12:33:50.797728+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	\N	fb4ee674-45b9-4160-aead-ec4470fb1592	\N	\N	\N	\N	{fb4ee674-45b9-4160-aead-ec4470fb1592}	f
3ebc9866-7b55-4060-bc33-b38833dbf79a	REIMBURSEMENT	Employee Reimbursement	Employee Reimbursement	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-06-23	\N	2026-06-23 12:00:21.754627+05:30	2026-06-23 13:22:16.819042+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	2ef7dc78-ca46-4ab7-b030-7b13031e3321	3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf	0385aa54-b00a-4e55-a9d8-f35ef42568fc	\N	\N	d2837668-c91a-4ae9-8c13-42a26d700e1e	{3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf}	t
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
7753e5de-1270-46e4-acfe-009a2ba450e6	COUNTERPARTY	Counterparty	External counterparty user	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
8b69e37f-b13b-4c4c-9f13-2d2de79d890f	INITIATOR	Initiator	Creates payment requests	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
a57b425b-b2bd-4b7a-a18f-6575f6b4c362	CHECKER	Checker	Verifies documents on payment requests	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
98f8e152-be09-4443-a3ba-e9188aaa4996	APPROVER_1	Approver Level 1	First-level approval authority	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
d21bb134-67b6-409d-8ea8-a2c013ac2e92	APPROVER_2	Approver Level 2	Second-level approval authority	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
654c0f96-738b-4344-802c-f477aed560c2	TREASURY_TEAM	Treasury Team	Treasury — verifies salary payouts	f	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
65af2bfb-41eb-4445-9162-04399f9304c6	HR_TEAM	HR	Human Resources — Maker for Salaries	f	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
a5494d57-aac3-4531-b4a7-3a8f857e91d7	TRADING_TEAM	Trading Team	Commodity trading desk	f	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
2c0a6a9b-f946-40e0-ae16-0324ef23f4e9	ABHISHEK_TEAM	Abhishek Team	Abhishek's verification team	f	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
a1eb9e2c-f098-4c14-a06e-cb5c7b7bec04	AUDIT_TEAM_HEAD	Audit Team Head	Audit Team Head — Approver for Statutory dues	f	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
1e30a840-fee1-459a-bca2-119a2499820b	ROHIT_TEAM	Rohit Team	Rohit's team — Maker for Statutory dues	f	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
ab3409a8-eb70-4ff6-a1f8-1c63ec444edb	SUBSCRIPTION_APPROVERS	Subscription Approvers	Tarang or Ganesh — Annual Subscription approver group	f	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
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
1e244db9-96f7-4634-a893-ea0be5b73997	17587ba5-4ef9-4ceb-93ac-eb2522a1313c	fb4ee674-45b9-4160-aead-ec4470fb1592	2026-06-22 13:48:49.950154+05:30
6e3f8917-0215-4a23-9a4d-af25811dce68	401400ac-215b-4bfe-be5f-d89c884e9320	8b69e37f-b13b-4c4c-9f13-2d2de79d890f	2026-06-23 11:06:49.689369+05:30
2d931a69-1c89-4291-8d29-785e8a2774f4	401400ac-215b-4bfe-be5f-d89c884e9320	a57b425b-b2bd-4b7a-a18f-6575f6b4c362	2026-06-23 11:06:49.689369+05:30
10e72bd4-be8d-4536-864d-06e244883900	a3747b4d-58f3-4751-806a-980777a627f7	8b69e37f-b13b-4c4c-9f13-2d2de79d890f	2026-06-23 11:06:49.689369+05:30
33ff6044-1ff5-478f-aafd-a14a10532d88	666c0362-0318-45f1-a2f8-34c5e1970d94	8b69e37f-b13b-4c4c-9f13-2d2de79d890f	2026-06-23 11:06:49.689369+05:30
3f0cefc3-9f02-4156-aba0-591f8f225ee1	81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	98f8e152-be09-4443-a3ba-e9188aaa4996	2026-06-23 11:06:49.689369+05:30
b9de24e3-8574-4a76-b82e-10634b97a8f0	5a59123f-8a33-462c-a1bc-49efff8668f3	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-06-23 11:06:49.689369+05:30
80b2937a-d3a4-46b8-98fb-f986763f1669	5a59123f-8a33-462c-a1bc-49efff8668f3	81c68ec5-f574-4031-b9dd-a93a42ef108d	2026-06-23 11:06:49.689369+05:30
00852f94-61f2-45bd-a06f-1317b5c93161	5a59123f-8a33-462c-a1bc-49efff8668f3	8b69e37f-b13b-4c4c-9f13-2d2de79d890f	2026-06-23 11:06:49.689369+05:30
b805a37c-b73a-41d0-8bb9-a98581429557	5a59123f-8a33-462c-a1bc-49efff8668f3	a57b425b-b2bd-4b7a-a18f-6575f6b4c362	2026-06-23 11:06:49.689369+05:30
9782caed-8c38-406f-8f35-6d743c830261	5a59123f-8a33-462c-a1bc-49efff8668f3	98f8e152-be09-4443-a3ba-e9188aaa4996	2026-06-23 11:06:49.689369+05:30
6e63db92-a711-4f63-a880-f4014ad31edd	5a59123f-8a33-462c-a1bc-49efff8668f3	d21bb134-67b6-409d-8ea8-a2c013ac2e92	2026-06-23 11:06:49.689369+05:30
d24f7d64-28e6-4000-b755-1c056a4f7568	5a59123f-8a33-462c-a1bc-49efff8668f3	654c0f96-738b-4344-802c-f477aed560c2	2026-06-23 11:06:49.689369+05:30
5eea358e-e080-4bad-9e43-52292a2acee9	5a59123f-8a33-462c-a1bc-49efff8668f3	65af2bfb-41eb-4445-9162-04399f9304c6	2026-06-23 11:06:49.689369+05:30
302c291e-a7a4-45e8-a1bb-4b1071667521	5a59123f-8a33-462c-a1bc-49efff8668f3	a5494d57-aac3-4531-b4a7-3a8f857e91d7	2026-06-23 11:06:49.689369+05:30
1f41ef8d-ef64-4522-94e3-61f2d903eac6	5a59123f-8a33-462c-a1bc-49efff8668f3	2c0a6a9b-f946-40e0-ae16-0324ef23f4e9	2026-06-23 11:06:49.689369+05:30
5621a332-e22d-40e3-bf34-776a04b7b634	5a59123f-8a33-462c-a1bc-49efff8668f3	a1eb9e2c-f098-4c14-a06e-cb5c7b7bec04	2026-06-23 11:06:49.689369+05:30
2ff47135-c16e-4df7-af68-275c379099b1	5a59123f-8a33-462c-a1bc-49efff8668f3	1e30a840-fee1-459a-bca2-119a2499820b	2026-06-23 11:06:49.689369+05:30
7ffac621-bb71-4ffa-b069-d4a8fe31be33	5a59123f-8a33-462c-a1bc-49efff8668f3	ab3409a8-eb70-4ff6-a1f8-1c63ec444edb	2026-06-23 11:06:49.689369+05:30
ee1bd9ff-21e2-4bd3-b16a-121b0e77c765	5651d894-c430-4c34-abfb-0f71e72d8ba4	98f8e152-be09-4443-a3ba-e9188aaa4996	2026-06-23 11:06:49.689369+05:30
3f2c5e22-3a1a-4279-a3f9-39a1d3768447	5651d894-c430-4c34-abfb-0f71e72d8ba4	ab3409a8-eb70-4ff6-a1f8-1c63ec444edb	2026-06-23 11:06:49.689369+05:30
0fc855e0-f0b4-416e-b9e7-bd535db3b51b	0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	d21bb134-67b6-409d-8ea8-a2c013ac2e92	2026-06-23 11:06:49.689369+05:30
ce3e7900-31cf-46a2-b8ed-415ab9744742	29b1615c-4272-4c8b-9a20-f6b5c9e653da	98f8e152-be09-4443-a3ba-e9188aaa4996	2026-06-23 11:06:49.689369+05:30
46824261-9133-43e2-bfee-98d4f7d8d4ad	29b1615c-4272-4c8b-9a20-f6b5c9e653da	d21bb134-67b6-409d-8ea8-a2c013ac2e92	2026-06-23 11:06:49.689369+05:30
0bbe86e1-45e2-4f1f-8617-902ec9a98384	29b1615c-4272-4c8b-9a20-f6b5c9e653da	ab3409a8-eb70-4ff6-a1f8-1c63ec444edb	2026-06-23 11:06:49.689369+05:30
858fc3a5-b052-42bd-8eb7-7c3c1a3b1291	4a2a5eed-a6aa-4008-8019-b08fa7b7c572	7753e5de-1270-46e4-acfe-009a2ba450e6	2026-06-23 11:06:49.689369+05:30
6c25e682-e37d-46af-b519-2da9ac76a594	b314c3e2-f4ec-4515-b617-628029a63c37	8b69e37f-b13b-4c4c-9f13-2d2de79d890f	2026-06-23 11:06:49.689369+05:30
698eeba8-e0e5-4c9b-af54-3354f2b1b080	9c41d017-fb16-4d2a-af01-18e7782b7ba1	a57b425b-b2bd-4b7a-a18f-6575f6b4c362	2026-06-23 11:06:49.689369+05:30
27c8befa-c0b0-4c99-a8bf-73d35fb3f424	9c41d017-fb16-4d2a-af01-18e7782b7ba1	98f8e152-be09-4443-a3ba-e9188aaa4996	2026-06-23 11:06:49.689369+05:30
1546ae1a-6b3d-4f6f-8183-4ad77b415b73	09a5bf1b-e1b7-43d7-88d2-4340ace76b5e	8b69e37f-b13b-4c4c-9f13-2d2de79d890f	2026-06-23 11:06:49.689369+05:30
a5da1073-a415-4324-bd8a-20fef6e0cd2f	09a5bf1b-e1b7-43d7-88d2-4340ace76b5e	a57b425b-b2bd-4b7a-a18f-6575f6b4c362	2026-06-23 11:06:49.689369+05:30
427bf42d-cede-4c39-a737-7c0b26989324	401400ac-215b-4bfe-be5f-d89c884e9320	0385aa54-b00a-4e55-a9d8-f35ef42568fc	2026-06-23 11:44:49.113153+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, full_name, employee_code, is_active, is_platform_admin, last_login_at, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
9b085aa8-7467-461a-afb0-50849bb1fec9	krrish@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Krrish Jain	EMP-012	t	f	2026-06-23 16:16:47.279+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-23 16:16:47.280698+05:30	\N	\N	\N
7e9bf049-b04b-4274-9170-9bed67faaac7	meena@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Meena	EMP-010	t	f	2026-06-18 13:16:06.946+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-18 13:16:06.946918+05:30	\N	\N	\N
8e3f6158-5bff-4d7d-8d6e-5a517d0b1cab	vinay@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Vinay Natrajan	EMP-008	t	f	2026-06-18 13:16:07.399+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-18 13:16:07.40056+05:30	\N	\N	\N
a3747b4d-58f3-4751-806a-980777a627f7	ghizlane@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Ghizlane	\N	t	f	\N	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
17587ba5-4ef9-4ceb-93ac-eb2522a1313c	vivek@radiant.com	$2b$12$OTu/bdKzUc7Breb1cLhztOh80U2w4GXLzFXS10OIe/XKYofx/Oh0e	Vivek	EMP-0071	t	f	2026-06-22 13:49:24.018+05:30	2026-06-22 13:48:19.213886+05:30	2026-06-22 13:49:24.019174+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	System Administrator	\N	t	t	2026-06-23 16:22:44.772+05:30	2026-06-04 15:16:14.034493+05:30	2026-06-23 16:22:44.774256+05:30	\N	\N	\N
81968d94-ae95-4c6a-b1d5-b9525c7c9ebd	ali@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Ali	EMP-004	t	f	2026-06-23 13:31:12.928+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-23 13:31:12.930179+05:30	\N	\N	\N
4913d2c0-cbd4-424b-b51b-ad07deeeaeb8	urvil@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Urvil Anil Shah	EMP-011	t	f	2026-06-18 11:15:18.426+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-18 11:15:18.427016+05:30	\N	\N	\N
f2ec56f8-7fc5-4150-870d-c95304aaae86	keval@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Keval	EMP-013	t	f	2026-06-19 12:33:48.941+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-19 12:33:48.941833+05:30	\N	\N	\N
5651d894-c430-4c34-abfb-0f71e72d8ba4	tarang@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Tarang	EMP-005	t	f	2026-06-18 19:55:06.02+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-18 19:55:06.020943+05:30	\N	\N	\N
fa939508-de63-4abb-b6ca-ff4f4f627c9c	abhishek@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Abhishek	EMP-002	t	f	2026-06-23 15:54:57.449+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-23 15:54:57.450673+05:30	\N	\N	\N
29b1615c-4272-4c8b-9a20-f6b5c9e653da	ganesh@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Ganesh	EMP-003	t	f	2026-06-23 16:00:15.418+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-23 16:00:15.420215+05:30	\N	\N	\N
4a2a5eed-a6aa-4008-8019-b08fa7b7c572	counterparty@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Counterparty	\N	t	f	\N	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
b314c3e2-f4ec-4515-b617-628029a63c37	venessa@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Venessa	\N	t	f	\N	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
803b17c2-2f24-40a3-a3d3-09e7fcf388c1	ankita@firsteconomy.com	$2b$12$7tGFUsI2LD6TMliLT3yNZuerjIfws5RV8FQF9M1irwULRnHTXm.b2	Ankita Verma	EMP-oo2	t	f	2026-06-23 13:06:53.669+05:30	2026-06-05 15:42:53.031444+05:30	2026-06-23 13:06:53.670621+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3
964da820-0264-48cf-8d22-971f8843741d	anushya@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Anushya	EMP-014	t	f	2026-06-23 13:08:18.816+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-23 13:08:18.817587+05:30	\N	\N	\N
9c41d017-fb16-4d2a-af01-18e7782b7ba1	sachin@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Sachin	\N	t	f	\N	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
08201732-f2d9-4568-869d-cd3627bc7484	rohit@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Rohit	EMP-007	t	f	2026-06-18 13:16:06.051+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-18 13:16:06.052184+05:30	\N	\N	\N
09a5bf1b-e1b7-43d7-88d2-4340ace76b5e	magaeshwari@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Magaeshwari	\N	t	f	\N	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N	\N	\N
0a175786-8e1a-4c8c-ab9a-5d242ab7ea6c	pinkesh@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Pinkesh	EMP-006	t	f	2026-06-23 16:08:24.769+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-23 16:08:24.770909+05:30	\N	\N	\N
734361cf-c2cd-4cbc-9c06-8ed37a9ccb16	abirami@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Abirami	EMP-009	t	f	2026-06-23 16:08:31.435+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-23 16:08:31.436907+05:30	\N	\N	\N
666c0362-0318-45f1-a2f8-34c5e1970d94	saritha@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	Saritha	EMP-001	t	f	2026-06-23 16:16:02.268+05:30	2026-06-04 15:41:44.917218+05:30	2026-06-23 16:16:02.272169+05:30	\N	\N	\N
401400ac-215b-4bfe-be5f-d89c884e9320	shivam@radiant.com	$2b$12$QrqH8oCuDKk4DT7ZfrUywugEfHGU0WYT4OmB2abkYF9vqxXVfkCC.	Shivam	\N	t	f	2026-06-23 14:42:27.623+05:30	2026-06-23 11:06:49.689369+05:30	2026-06-23 14:42:27.632595+05:30	\N	\N	\N
\.


--
-- Name: incoming_receipt_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.incoming_receipt_seq', 4, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 5, true);


--
-- Name: payment_request_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_request_seq', 78, true);


--
-- Name: reconciliation_exception_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reconciliation_exception_seq', 13, true);


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
-- Name: approval_delegations approval_delegations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_pkey PRIMARY KEY (id);


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
-- Name: idx_appr_deleg_delegate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appr_deleg_delegate ON public.approval_delegations USING btree (delegate_user_id) WHERE (deleted_at IS NULL);


--
-- Name: idx_appr_deleg_delegator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appr_deleg_delegator ON public.approval_delegations USING btree (delegator_user_id) WHERE (deleted_at IS NULL);


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
-- Name: approval_delegations approval_delegations_delegate_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_delegate_user_id_fkey FOREIGN KEY (delegate_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: approval_delegations approval_delegations_delegator_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_delegator_user_id_fkey FOREIGN KEY (delegator_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: approval_delegations approval_delegations_payment_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_delegations
    ADD CONSTRAINT approval_delegations_payment_type_id_fkey FOREIGN KEY (payment_type_id) REFERENCES public.payment_types(id) ON DELETE CASCADE;


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
-- Name: bank_accounts fk_bank_accounts_legal_entity; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT fk_bank_accounts_legal_entity FOREIGN KEY (legal_entity_id) REFERENCES public.legal_entities(id) ON DELETE SET NULL;


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

\unrestrict o3rDjVIZ03DGJPkncMzhAlm3u9e9QBdmhRtPO0Uzz3y8hDzwnvMuel9SfGKZcKq

