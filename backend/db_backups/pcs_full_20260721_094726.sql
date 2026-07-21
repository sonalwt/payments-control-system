--
-- PostgreSQL database dump
--

\restrict nMS5lJESGKpHl1TGGGaqPoYQcPlWgxncDVcoW0N8QSMGeBg5yjdfm0oTjSk7GHZ

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
ALTER TABLE IF EXISTS ONLY public.password_reset_otps DROP CONSTRAINT IF EXISTS password_reset_otps_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.legal_entities DROP CONSTRAINT IF EXISTS legal_entities_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipts DROP CONSTRAINT IF EXISTS incoming_receipts_receive_from_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipts DROP CONSTRAINT IF EXISTS incoming_receipts_legal_entity_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipts DROP CONSTRAINT IF EXISTS incoming_receipts_counterparty_id_fkey;
ALTER TABLE IF EXISTS ONLY public.incoming_receipt_documents DROP CONSTRAINT IF EXISTS incoming_receipt_documents_incoming_receipt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_rejections DROP CONSTRAINT IF EXISTS fk_prr_rejected_by;
ALTER TABLE IF EXISTS ONLY public.payment_request_rejections DROP CONSTRAINT IF EXISTS fk_prr_payment_request;
ALTER TABLE IF EXISTS ONLY public.payment_request_messages DROP CONSTRAINT IF EXISTS fk_prm_sender;
ALTER TABLE IF EXISTS ONLY public.payment_request_messages DROP CONSTRAINT IF EXISTS fk_prm_recipient;
ALTER TABLE IF EXISTS ONLY public.payment_request_messages DROP CONSTRAINT IF EXISTS fk_prm_payment_request;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_maker_role;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_maker;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_checker_role;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_checker;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_authoriser_role;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_pr_treasury_authoriser;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_payment_requests_treasury_swift_by;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS fk_payment_requests_legal_entity;
ALTER TABLE IF EXISTS ONLY public.bank_accounts DROP CONSTRAINT IF EXISTS fk_bank_accounts_legal_entity;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS fk_am_treasury_maker_role;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS fk_am_treasury_checker_role;
ALTER TABLE IF EXISTS ONLY public.approval_matrices DROP CONSTRAINT IF EXISTS fk_am_treasury_authoriser_role;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_legal_entity_id_fkey;
ALTER TABLE IF EXISTS ONLY public.employees DROP CONSTRAINT IF EXISTS employees_country_of_employment_id_fkey;
ALTER TABLE IF EXISTS ONLY public.employee_login_otps DROP CONSTRAINT IF EXISTS employee_login_otps_employee_id_fkey;
ALTER TABLE IF EXISTS ONLY public.countries DROP CONSTRAINT IF EXISTS countries_currency_id_fkey;
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
DROP INDEX IF EXISTS public.uq_users_username;
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
DROP INDEX IF EXISTS public.idx_prr_request_rejected_at;
DROP INDEX IF EXISTS public.idx_prm_request_created_at;
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
DROP INDEX IF EXISTS public.idx_password_reset_otps_user;
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
DROP INDEX IF EXISTS public.idx_countries_currency_id;
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
ALTER TABLE IF EXISTS ONLY public.payment_request_rejections DROP CONSTRAINT IF EXISTS pk_payment_request_rejections;
ALTER TABLE IF EXISTS ONLY public.payment_request_messages DROP CONSTRAINT IF EXISTS pk_payment_request_messages;
ALTER TABLE IF EXISTS ONLY public.payment_types DROP CONSTRAINT IF EXISTS payment_types_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_request_number_key;
ALTER TABLE IF EXISTS ONLY public.payment_requests DROP CONSTRAINT IF EXISTS payment_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_documents DROP CONSTRAINT IF EXISTS payment_request_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_request_approvals DROP CONSTRAINT IF EXISTS payment_request_approvals_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_categories DROP CONSTRAINT IF EXISTS payment_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_otps DROP CONSTRAINT IF EXISTS password_reset_otps_pkey;
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
DROP TABLE IF EXISTS public.payment_request_rejections;
DROP TABLE IF EXISTS public.payment_request_messages;
DROP TABLE IF EXISTS public.payment_request_documents;
DROP TABLE IF EXISTS public.payment_request_approvals;
DROP TABLE IF EXISTS public.payment_categories;
DROP TABLE IF EXISTS public.password_reset_otps;
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
    payment_nature character varying(10),
    kyc_status character varying(10) DEFAULT 'APPROVED'::character varying NOT NULL,
    kyc_flagged boolean DEFAULT false NOT NULL,
    kyc_reviewed_by uuid,
    kyc_reviewed_at timestamp with time zone,
    kyc_rejection_reason text,
    CONSTRAINT chk_counterparty_role CHECK (((role)::text = ANY (ARRAY[('VENDOR'::character varying)::text, ('CUSTOMER'::character varying)::text, ('BOTH'::character varying)::text]))),
    CONSTRAINT chk_cp_kyc_status CHECK (((kyc_status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
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
    is_sanctioned boolean DEFAULT false NOT NULL,
    currency_id uuid
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
-- Name: password_reset_otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_otps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    code_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
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
-- Name: payment_request_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_request_messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_request_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid,
    message text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payment_request_rejections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_request_rejections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    payment_request_id uuid NOT NULL,
    stage character varying(30) NOT NULL,
    step_order integer,
    attempt_no integer DEFAULT 1 NOT NULL,
    rejected_by uuid,
    reason text,
    rejected_at timestamp with time zone DEFAULT now() NOT NULL,
    snapshot jsonb
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
    legal_entity_id uuid,
    tt_document_url character varying(500),
    treasury_swift_by uuid,
    treasury_swift_at timestamp with time zone,
    treasury_checker_comments text,
    reopen_reason text,
    reopened_at timestamp with time zone,
    reopened_by uuid,
    CONSTRAINT chk_pr_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT chk_pr_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PENDING_APPROVAL'::character varying, 'TREASURY_MAKER'::character varying, 'TREASURY_CHECKER'::character varying, 'TREASURY_AUTHORISER'::character varying, 'TREASURY_SWIFT'::character varying, 'AWAITING_CLOSURE'::character varying, 'COMPLETED'::character varying, 'REJECTED'::character varying, 'WITHDRAWN'::character varying, 'CANCELLED'::character varying, 'AWAITING_MAKER_PREP'::character varying, 'AWAITING_CHECKER_REVIEW'::character varying, 'AWAITING_HEAD_APPROVAL'::character varying, 'UNDER_INVESTIGATION'::character varying])::text[])))
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
    legal_entity_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
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
    updated_by uuid,
    username public.citext NOT NULL
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: account_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_types (id, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
fa0a734b-581b-43ab-aa56-65f84cdc80eb	Collateral	t	2026-07-21 07:08:35.729732+05:30	2026-07-21 07:08:35.729732+05:30	\N	\N	\N
a2d42312-9b0a-4ddd-bc8b-5554a463e398	Current	t	2026-07-21 07:08:35.729732+05:30	2026-07-21 07:11:18.243468+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3
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
b0ef3cc1-e6ad-412c-b007-9b5e38fb3705	Trade related payments - Iron Ore (USD)	\N	8cf29542-6a44-4c74-8d86-13999e661902	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-07-21	\N	t	2026-07-21 07:56:34.482585+05:30	2026-07-21 09:15:05.582464+05:30	\N	\N	\N	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
5644fbf3-6aca-4cc6-8f6b-59bd02c18e7b	Consultants, Corp sec, Renewals - Radiant (USD)	\N	aa8fd303-92dc-4837-9866-756a8d0317ff	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-07-21	\N	t	2026-07-21 08:15:56.364363+05:30	2026-07-21 09:15:05.582464+05:30	\N	\N	\N	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
306707e9-6114-42e2-b5b1-9890c9c5808d	Consultants, Corp sec, Renewals - RSML (USD)	\N	3809af3e-0f0a-4564-a2c7-65335c4b2fb1	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-07-21	\N	t	2026-07-21 08:15:56.364363+05:30	2026-07-21 09:15:05.582464+05:30	\N	\N	\N	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
65270021-3b1a-4902-8d93-9d135de3e7a6	Trade related payments - basemetal (USD)	\N	763f3558-8f32-4542-8b26-c20668e78dea	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-07-21	\N	t	2026-07-21 08:20:22.640999+05:30	2026-07-21 09:15:05.582464+05:30	\N	\N	\N	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
c988e90e-ffd4-4db5-98cb-6b1319876365	IRD Tax related payments (USD)	\N	5814d3a0-36a2-4ab2-9efa-960464716018	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-07-21	\N	t	2026-07-21 08:38:09.963511+05:30	2026-07-21 09:15:05.582464+05:30	\N	\N	\N	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
8fb5b54f-ed79-485c-996b-1945012f442d	Office and other utility payments (USD)	\N	55058829-bab8-43bd-bdf3-6cd43ce3de6e	91a86e49-bd04-41e3-99f6-76548ee5df83	2026-07-21	\N	t	2026-07-21 08:38:09.963511+05:30	2026-07-21 09:15:05.582464+05:30	\N	\N	\N	ONLINE_TT	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	adcb32d4-e1f3-498d-96aa-33018a941d24	15ab6892-78f6-4e88-aa6a-34d5358460c6
\.


--
-- Data for Name: approval_matrix_bands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_matrix_bands (id, matrix_id, sort_order, min_amount, max_amount, created_at) FROM stdin;
59c1ad74-a360-4405-ad94-f5717be6d810	b0ef3cc1-e6ad-412c-b007-9b5e38fb3705	1	0.0000	\N	2026-07-21 07:56:34.482585+05:30
cada8e5d-aff7-46e1-8b75-8b0bc15f26a0	5644fbf3-6aca-4cc6-8f6b-59bd02c18e7b	1	0.0000	50000.0000	2026-07-21 08:15:56.364363+05:30
c7b79e1e-6aac-44eb-9fcc-2bc163018c6c	306707e9-6114-42e2-b5b1-9890c9c5808d	1	0.0000	25000.0000	2026-07-21 08:15:56.364363+05:30
fac19f8e-032d-4060-903a-f6051a4827ca	65270021-3b1a-4902-8d93-9d135de3e7a6	1	0.0000	\N	2026-07-21 08:20:22.640999+05:30
217adc38-bf75-419f-8501-67fe96779775	c988e90e-ffd4-4db5-98cb-6b1319876365	1	0.0000	25000.0000	2026-07-21 08:38:09.963511+05:30
2ca168e3-180b-4596-afa7-0562c8cf5819	8fb5b54f-ed79-485c-996b-1945012f442d	1	0.0000	25000.0000	2026-07-21 08:38:09.963511+05:30
\.


--
-- Data for Name: approval_matrix_steps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.approval_matrix_steps (id, band_id, step_order, approver_type, approver_user_id, approver_role_id, is_optional, created_at) FROM stdin;
cb70f464-2034-42fb-bb0e-c533048c317c	59c1ad74-a360-4405-ad94-f5717be6d810	1	USER	ce83209c-bd98-4930-8c55-b50b42c2385d	\N	f	2026-07-21 07:56:34.482585+05:30
fb9f601f-1d67-4f45-ab3e-c9fe4b4f8d01	59c1ad74-a360-4405-ad94-f5717be6d810	2	USER	e8fe5cb3-f253-4861-b900-1959b9e74182	\N	f	2026-07-21 07:56:34.482585+05:30
2c62cd83-02bd-4568-9a05-3c3eb12f3d2e	cada8e5d-aff7-46e1-8b75-8b0bc15f26a0	1	USER	e8fe5cb3-f253-4861-b900-1959b9e74182	\N	f	2026-07-21 08:15:56.364363+05:30
2f66de19-9028-4769-b4bf-c97cc0481a10	c7b79e1e-6aac-44eb-9fcc-2bc163018c6c	1	USER	4913ef43-3f79-44ce-ab9e-0b3965491660	\N	f	2026-07-21 08:15:56.364363+05:30
348bfc90-cd9f-4f8c-81ab-fb78c02b0a70	fac19f8e-032d-4060-903a-f6051a4827ca	1	USER	ce83209c-bd98-4930-8c55-b50b42c2385d	\N	f	2026-07-21 08:20:22.640999+05:30
120639e0-6a63-43d2-b2a1-a253cab24133	fac19f8e-032d-4060-903a-f6051a4827ca	2	USER	e8fe5cb3-f253-4861-b900-1959b9e74182	\N	f	2026-07-21 08:20:22.640999+05:30
ef197f7d-f079-4421-962c-4849898043db	217adc38-bf75-419f-8501-67fe96779775	1	ROLE	\N	a1eb9e2c-f098-4c14-a06e-cb5c7b7bec04	f	2026-07-21 08:38:09.963511+05:30
b9f8f7d7-add1-4e85-942e-e5510747d504	2ca168e3-180b-4596-afa7-0562c8cf5819	1	USER	897a8844-01e3-4603-b569-908c48884345	\N	f	2026-07-21 08:38:09.963511+05:30
7fd2abdc-c053-4b93-9823-f57e364f9a06	2ca168e3-180b-4596-afa7-0562c8cf5819	2	USER	e8fe5cb3-f253-4861-b900-1959b9e74182	\N	f	2026-07-21 08:38:09.963511+05:30
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, action, entity_type, entity_id, user_id, user_email, http_method, path, status_code, success, params, request_body, error_message, ip_address, user_agent, duration_ms, created_at) FROM stdin;
a27452de-8a9f-4425-844a-568b6c6c454a	UPDATE	AccountTypes	a2d42312-9b0a-4ddd-bc8b-5554a463e398	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	PUT	/api/v1/account-types/a2d42312-9b0a-4ddd-bc8b-5554a463e398	200	t	{"id": "a2d42312-9b0a-4ddd-bc8b-5554a463e398"}	{"name": "Current", "isActive": true}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	24	2026-07-21 07:11:18.254588+05:30
e2c33efa-b819-4168-91ca-b55491a0b385	CREATE	Roles	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/roles	500	f	\N	{"code": "ACCOUNTS_TEAM", "name": "Accounts Team"}	duplicate key value violates unique constraint "roles_code_key"	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	75	2026-07-21 07:40:23.85605+05:30
2e28fb68-99c5-4722-9086-5887f1538890	LOGIN	Auth	\N	\N	\N	POST	/api/v1/auth/login	400	f	\N	\N	Bad Request Exception	::1	curl/8.18.0	2	2026-07-21 08:27:02.485753+05:30
2fd0fcdc-85fc-4ecb-bd9f-5b6b59580681	FORGOT_PASSWORD	Auth	\N	\N	mona@radiant.com	POST	/api/v1/auth/forgot-password	204	t	\N	{"email": "mona@radiant.com"}	\N	::1	curl/8.18.0	3361	2026-07-21 08:27:45.675994+05:30
6626c05a-dac7-474e-b846-9035041782e0	CREATE	Auth	\N	\N	mona@radiant.com	POST	/api/v1/auth/verify-reset-otp	404	f	\N	\N	Cannot POST /api/v1/auth/verify-reset-otp	::1	curl/8.18.0	\N	2026-07-21 08:27:45.772738+05:30
77a07ea8-b7a7-42f7-9990-c62e495d8585	CREATE	Auth	\N	\N	mona@radiant.com	POST	/api/v1/auth/verify-reset-otp	404	f	\N	\N	Cannot POST /api/v1/auth/verify-reset-otp	::1	curl/8.18.0	\N	2026-07-21 08:28:17.973628+05:30
a8acea41-cc51-4016-bfcd-f4d7aa3a6ec8	LOGIN	Auth	\N	\N	\N	POST	/api/v1/auth/login	400	f	\N	\N	Bad Request Exception	::1	curl/8.18.0	3	2026-07-21 08:29:36.974203+05:30
ce196b1c-1008-4b3d-9f0e-cc0e40e960fa	FORGOT_PASSWORD	Auth	\N	\N	mona@radiant.com	POST	/api/v1/auth/forgot-password	204	t	\N	{"email": "mona@radiant.com"}	\N	::1	curl/8.18.0	3144	2026-07-21 08:29:49.872028+05:30
2f67277f-e608-40d2-9b62-f24e22224b00	CREATE	Auth	\N	\N	mona@radiant.com	POST	/api/v1/auth/verify-reset-otp	400	f	\N	{"code": "000000", "email": "mona@radiant.com"}	Invalid or expired code	::1	curl/8.18.0	13	2026-07-21 08:29:49.969266+05:30
8faa37a5-5b4e-4bda-9e9c-eef06692bfd7	FORGOT_PASSWORD	Auth	\N	\N	pwreset_test@radiant.com	POST	/api/v1/auth/forgot-password	204	t	\N	{"email": "pwreset_test@radiant.com"}	\N	::1	curl/8.18.0	3210	2026-07-21 08:30:44.629702+05:30
8e978fdc-9cc8-4a91-b92e-d7850d6a076c	CREATE	Auth	\N	\N	pwreset_test@radiant.com	POST	/api/v1/auth/verify-reset-otp	200	t	\N	{"code": "654321", "email": "pwreset_test@radiant.com"}	\N	::1	curl/8.18.0	12	2026-07-21 08:30:44.938198+05:30
09423eda-1984-4401-b41d-9ca7de2c205c	RESET_PASSWORD	Auth	\N	\N	\N	POST	/api/v1/auth/reset-password	204	t	\N	{"token": "[REDACTED]", "newPassword": "[REDACTED]"}	\N	::1	curl/8.18.0	386	2026-07-21 08:30:45.459598+05:30
77d14d45-92b4-425f-8279-c15ac7e29b5d	LOGIN	Auth	99c681f0-76e7-45ae-b03b-579a35667f8d	99c681f0-76e7-45ae-b03b-579a35667f8d	pwreset_test@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "pwreset_test"}	\N	::1	curl/8.18.0	365	2026-07-21 08:30:45.87957+05:30
c328af42-72ea-46e1-a41f-b4cbc2cf411c	RESET_PASSWORD	Auth	\N	\N	\N	POST	/api/v1/auth/reset-password	400	f	\N	{"token": "[REDACTED]", "newPassword": "[REDACTED]"}	This reset link has already been used or has expired.	::1	curl/8.18.0	3	2026-07-21 08:30:45.974003+05:30
470b965a-d83d-4add-be9f-9d6896d4d65b	CREATE	Auth	\N	\N	pwreset_test@radiant.com	POST	/api/v1/auth/verify-reset-otp	400	f	\N	{"code": "654321", "email": "pwreset_test@radiant.com"}	Invalid or expired code	::1	curl/8.18.0	74	2026-07-21 08:30:58.411578+05:30
8dace7d3-d13e-4242-a2a1-124aefb04d5d	LOGIN	Auth	\N	\N	\N	POST	/api/v1/auth/login	401	f	\N	{"password": "[REDACTED]", "username": "mona@radiant.com"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	373	2026-07-21 08:39:56.543621+05:30
19c51d9d-3f98-46f3-a983-d45269142d18	LOGIN	Auth	42e90d82-87d6-4cae-b31d-098e25730774	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "mona@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	359	2026-07-21 08:40:03.372533+05:30
04a145cc-b7ae-4589-84ac-37eb7a79733c	CREATE	Uploads	\N	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	528	2026-07-21 08:41:05.450348+05:30
ef2c7f99-9b1a-466c-8f0c-11cc220eb656	CREATE	Uploads	\N	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/uploads/extract-invoice	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	267	2026-07-21 08:41:05.793893+05:30
355e8fcb-8404-4a87-b562-2987f1dc8fdf	CREATE	Uploads	\N	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	202	2026-07-21 08:41:45.649253+05:30
17455652-ca67-4422-9746-498f9f422d3a	CREATE	Uploads	\N	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/uploads/extract-invoice	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	81	2026-07-21 08:41:45.75666+05:30
87b02712-6b44-4201-ba0c-17a5ebafdbc7	CREATE	Uploads	\N	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	260	2026-07-21 08:42:14.617274+05:30
267a343f-fd5d-4e73-b34b-4fefe30d26e4	CREATE	Uploads	\N	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/uploads/extract-invoice	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	44	2026-07-21 08:42:14.681946+05:30
34e934cb-ee98-4d70-96f4-571998b5a624	CREATE	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/payment-requests	201	t	\N	{"amount": "3131537.52", "dueDate": "2026-07-22", "documents": [{"fileUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1784603534356-965202.pdf", "fileName": "ISBP25-0242S(M) 999.747mt.pdf", "documentCode": "INVOICE", "documentLabel": "Invoice"}], "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "invoiceNumber": "115732", "legalEntityId": "2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf", "paymentTypeId": "8cf29542-6a44-4c74-8d86-13999e661902", "counterpartyId": "e9439123-ad25-4229-a522-7abb124acced", "purposeDescription": "testing", "beneficiaryAccountId": "e036853a-fcd1-43f6-beaf-620749697d0b"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	94	2026-07-21 08:42:23.624354+05:30
4a475d2b-170d-447f-876a-dd417302aa84	LOGIN	Auth	42e90d82-87d6-4cae-b31d-098e25730774	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "mona@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	592	2026-07-21 08:44:44.694231+05:30
570e4fc6-500e-482e-b4a0-b7c5b6f7c831	UPDATE	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	PUT	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956	200	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	{"amount": "3131537.5200", "dueDate": "2026-07-22", "currencyId": "91a86e49-bd04-41e3-99f6-76548ee5df83", "invoiceNumber": "115732", "legalEntityId": "2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf", "paymentTypeId": "8cf29542-6a44-4c74-8d86-13999e661902", "counterpartyId": "e9439123-ad25-4229-a522-7abb124acced", "purposeDescription": "testing", "beneficiaryAccountId": "e036853a-fcd1-43f6-beaf-620749697d0b"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	52	2026-07-21 08:54:42.681224+05:30
da3dc233-c838-4d1b-85e7-b077e7c092c8	SUBMIT	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/submit	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	60	2026-07-21 08:54:44.921701+05:30
bea82618-5a8e-4e7f-a2fe-35c3e89b1943	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "admin@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	354	2026-07-21 08:54:59.720255+05:30
669f9e15-d2b3-4050-b276-96cb44b02f60	LOGIN	Auth	41efa003-34e4-4667-8e96-95503d22a889	41efa003-34e4-4667-8e96-95503d22a889	abhishek@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "abhishek@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	358	2026-07-21 08:55:07.225858+05:30
8ef1ab7d-7afa-4545-ad0b-6109cb5a98b3	APPROVE	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	41efa003-34e4-4667-8e96-95503d22a889	abhishek@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/approve	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	94	2026-07-21 08:55:23.181361+05:30
bb34cd6e-aed2-40ea-ac43-38ed197b379a	LOGIN	Auth	ce83209c-bd98-4930-8c55-b50b42c2385d	ce83209c-bd98-4930-8c55-b50b42c2385d	ganesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "ganesh@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	364	2026-07-21 08:55:39.678026+05:30
0380a5ff-ba92-487a-a51e-b8ff075612a1	APPROVE	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	ce83209c-bd98-4930-8c55-b50b42c2385d	ganesh@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/approve	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	80	2026-07-21 08:56:01.590336+05:30
d28547ca-19cc-4834-96da-969b238b67ab	LOGIN	Auth	e8fe5cb3-f253-4861-b900-1959b9e74182	e8fe5cb3-f253-4861-b900-1959b9e74182	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "pinkesh@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	371	2026-07-21 08:56:14.851487+05:30
52966129-c5da-4bdd-98c3-d9960bbbcf0f	APPROVE	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	e8fe5cb3-f253-4861-b900-1959b9e74182	pinkesh@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/approve	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	82	2026-07-21 08:56:24.015502+05:30
7364da37-f941-4fc3-a350-49ef6327046e	LOGIN	Auth	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "abirami@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	526	2026-07-21 09:12:30.398371+05:30
3ae138c2-7f75-4973-a7ea-6103ad4a56ef	LOGIN	Auth	d05544a3-fdd1-4cfd-b20e-10c25b8eb9d8	d05544a3-fdd1-4cfd-b20e-10c25b8eb9d8	meena@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "meena@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	409	2026-07-21 09:12:52.629588+05:30
b7ffd79d-ccd7-4d63-85ed-619da40dab80	LOGIN	Auth	e8fe5cb3-f253-4861-b900-1959b9e74182	e8fe5cb3-f253-4861-b900-1959b9e74182	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "pinkesh@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	350	2026-07-21 09:13:05.476411+05:30
f7e0ad79-4ea2-432f-ab11-4b471b87934c	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "admin@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	354	2026-07-21 09:13:12.208802+05:30
426646a9-46f7-4d30-bd32-2fabd0f17bdf	LOGIN	Auth	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "abirami@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	393	2026-07-21 09:16:52.243041+05:30
dd0b7d17-e5d0-4454-8aad-326b515e512f	LOGIN	Auth	e8fe5cb3-f253-4861-b900-1959b9e74182	e8fe5cb3-f253-4861-b900-1959b9e74182	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "pinkesh@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	369	2026-07-21 09:17:04.750707+05:30
005a4bb4-a330-45ed-8ad9-c651610f9bdf	LOGIN	Auth	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "abirami@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	372	2026-07-21 09:18:07.335074+05:30
e604a954-c4ef-43ee-976f-462031343b96	LOGIN	Auth	e8fe5cb3-f253-4861-b900-1959b9e74182	e8fe5cb3-f253-4861-b900-1959b9e74182	pinkesh@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "pinkesh@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	392	2026-07-21 09:18:23.306322+05:30
41e0ed3d-29d7-46d1-a672-5681c4cb7604	LOGIN	Auth	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "abirami@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	390	2026-07-21 09:21:21.696934+05:30
9098e1e8-9a92-47b2-8f24-25adf4526f95	CREATE	Uploads	\N	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	304	2026-07-21 09:21:40.301353+05:30
ba484ec6-7a77-4717-a763-8e9175637132	TREASURY_SUBMIT	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/treasury/submit	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	{"ttDocumentUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1784605900002-437984.pdf", "sourceAccountId": "52a9ee2c-df3a-422f-98b6-fba7a732ca62"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	46	2026-07-21 09:21:43.771976+05:30
7ef00921-1c9c-4512-bfcb-7367744a675e	LOGIN	Auth	269753e8-9865-43eb-8e7f-cc28c5dc7011	269753e8-9865-43eb-8e7f-cc28c5dc7011	urvil@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "urvil@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	418	2026-07-21 09:22:24.369938+05:30
964f3ea4-2c18-41be-a9d9-c1f006b30ed8	LOGIN	Auth	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "admin@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	352	2026-07-21 09:23:41.621339+05:30
884d848c-466a-4ded-9a38-c71e2c7d9d6a	DELETE	Roles	de65d55a-3e24-4007-b0e4-47f20db52ed1	5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	DELETE	/api/v1/roles/de65d55a-3e24-4007-b0e4-47f20db52ed1	204	t	{"id": "de65d55a-3e24-4007-b0e4-47f20db52ed1"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	15	2026-07-21 09:24:10.574887+05:30
98bbc56d-a300-4a39-b496-ba643d8433a8	LOGIN	Auth	\N	\N	\N	POST	/api/v1/auth/login	401	f	\N	{"password": "[REDACTED]", "username": "urvi.anil@radiant.com"}	Invalid credentials	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	62	2026-07-21 09:37:56.412234+05:30
7a345af1-f1c9-4a76-8c49-691bbfb934b8	LOGIN	Auth	269753e8-9865-43eb-8e7f-cc28c5dc7011	269753e8-9865-43eb-8e7f-cc28c5dc7011	urvil@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "urvil@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	710	2026-07-21 09:38:07.265947+05:30
b5c95690-e4b5-43bd-9737-06d70ba18706	TREASURY_CHECK	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	269753e8-9865-43eb-8e7f-cc28c5dc7011	urvil@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/treasury/check	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	{"comments": "testing"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	135	2026-07-21 09:38:21.299586+05:30
f7de481a-4141-4eba-913d-507256c47b4b	LOGIN	Auth	ea679108-16c6-49e3-a166-667e8d0b109f	ea679108-16c6-49e3-a166-667e8d0b109f	anushya@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "anushya@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	744	2026-07-21 09:39:23.864866+05:30
d3184dee-d8a3-4dfe-b167-4d456fc6e8f9	TREASURY_COMPLETE	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	ea679108-16c6-49e3-a166-667e8d0b109f	anushya@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/treasury/complete	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	101	2026-07-21 09:39:37.999019+05:30
afbae87a-440a-4b62-85a8-dce150c28f03	LOGIN	Auth	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "abirami@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	704	2026-07-21 09:40:39.230171+05:30
2beb3c6e-7fc4-4a9e-9c15-68887ee1414a	CREATE	Uploads	\N	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/uploads/file	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	296	2026-07-21 09:40:55.464408+05:30
4792953b-e6bd-4ee7-aaf7-62258b7469e5	CREATE	Uploads	\N	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/uploads/extract-remittance	201	t	\N	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	80	2026-07-21 09:40:55.604435+05:30
bdf04ddf-6ecb-4d9a-9f60-c581359001ff	CREATE	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/treasury/upload-swift	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	{"swiftCopyUrl": "https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1784607055219-215985.pdf", "referenceNumber": "FT123REF988"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	226	2026-07-21 09:41:11.989511+05:30
a55cdc2b-38e7-4963-a7fd-be629abd207a	LOGIN	Auth	42e90d82-87d6-4cae-b31d-098e25730774	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/auth/login	200	t	\N	{"password": "[REDACTED]", "username": "mona@radiant.com"}	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	713	2026-07-21 09:41:50.678686+05:30
0794dd0d-641f-4fd1-a9ff-41f1c87e5dc1	CREATE	PaymentRequests	8ac57121-54f4-4774-9370-02a8a0383956	42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	POST	/api/v1/payment-requests/8ac57121-54f4-4774-9370-02a8a0383956/close	201	t	{"id": "8ac57121-54f4-4774-9370-02a8a0383956"}	\N	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36	80	2026-07-21 09:42:18.447454+05:30
\.


--
-- Data for Name: balance_changes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.balance_changes (id, account_id, kind, previous_balance, new_balance, delta, reason, payment_request_id, receipt_id, statement_upload_id, changed_by, created_at) FROM stdin;
\.


--
-- Data for Name: bank_account_charge_bands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_account_charge_bands (id, bank_account_id, sort_order, min_amount, max_amount, percentage, created_at) FROM stdin;
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bank_accounts (id, bank_id, bank_nickname, currency_id, account_type_id, account_number, branch_name, branch_code, opening_balance, minimum_balance, is_chairman_designated, is_active, created_at, updated_at, deleted_at, created_by, updated_by, bank_name, is_counterparty, remaining_balance, counterparty_id, account_holder_name, swift_bic, iban, bank_address, correspondent_bank, correspondent_swift, contact_name, contact_phone, contact_phone_alt, contact_email, legal_entity_id) FROM stdin;
960de65c-5a1e-4b23-b062-aecc790c5be1	b03f241f-30bd-4f31-b326-e4b6812fb6f6	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	F10 749 409476	\N	\N	3300000.0000	100000.0000	f	t	2026-06-23 10:24:26.567737+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Mizuho Bank Ltd	f	3300000.0000	\N	Radiant World Corporation Pte Ltd	MHCBSGSG	\N	\N	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
07b2bd47-e332-4099-9c2b-3e2d87b00080	e83b83e1-a992-4978-8268-4dabde459d2c	Radiant World Corporation Pte Ltd	65f144d3-5ed6-42b7-add7-4e79abaa770c	fa0a734b-581b-43ab-aa56-65f84cdc80eb	CH700788000050725102	\N	\N	1900000.0000	50000.0000	f	t	2026-06-23 10:24:26.566822+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	BCGE Bank	f	1900000.0000	\N	Radiant World Corporation Pte Ltd	BCGECHGGXXX	CH700788000050725102	Geneve 2, 1211 Switzerland	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
28125913-f80c-438a-8714-f92e2eafb26c	32ce3f16-51e8-4bc4-985c-d5c0942c25b5	Radiant World Corporation Pte Ltd	65f144d3-5ed6-42b7-add7-4e79abaa770c	fa0a734b-581b-43ab-aa56-65f84cdc80eb	CH4708825116524462002	\N	\N	3800000.0000	75000.0000	f	t	2026-06-23 10:24:26.565431+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	TradeX Bank AG	f	3800000.0000	\N	Radiant World Corporation Pte Ltd	TXBZCHZZ	CH4708825116524462002	Gartenstrasse 24, Postfach 2136, 8027 Zurich	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
3d8caf35-f900-4ac8-954a-5577e8c9c884	e40249c8-3688-4ad0-97df-3242e8ac5821	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	CH28087191072211200002	\N	\N	3100000.0000	50000.0000	f	t	2026-06-23 10:24:26.564923+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Arab Bank Switzerland Ltd	f	3100000.0000	\N	Radiant World Corporation Pte Ltd	ARBSCHZZ	CH28087191072211200002	Nuschelerstrasse 1, PO Box 8001, Zurich	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
53acb2ec-36c5-451b-a11c-604d052ffc45	e40249c8-3688-4ad0-97df-3242e8ac5821	Radiant World Corporation Pte Ltd	65f144d3-5ed6-42b7-add7-4e79abaa770c	fa0a734b-581b-43ab-aa56-65f84cdc80eb	CH9808719107221120003	\N	\N	2400000.0000	25000.0000	f	t	2026-06-23 10:24:26.564374+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Arab Bank Switzerland Ltd	f	2400000.0000	\N	Radiant World Corporation Pte Ltd	ARBSCHZZ	CH9808719107221120003	Nuschelerstrasse 1, PO Box 8001, Zurich	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
014f4163-3509-4538-a453-db917e5c62ae	2bc48e8c-f98f-4095-bd00-637b0e9ffdc1	Radiant World Corporation Pte Ltd	3d6970b1-652a-42da-a255-ba4c9d00deab	fa0a734b-581b-43ab-aa56-65f84cdc80eb	NL67UGBI8263429609	\N	\N	1700000.0000	100000.0000	f	t	2026-06-23 10:24:26.563714+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Garanti Bank	f	1700000.0000	\N	Radiant World Corporation Pte Ltd	UGBINL2A	NL67UGBI8263429609	Amsterdam, Netherlands	\N	CITIUS33	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
415bdadf-9405-4bae-8e9f-557f3e334fe4	2bc48e8c-f98f-4095-bd00-637b0e9ffdc1	Radiant World Corporation Pte Ltd	190044fe-1aa0-4386-a3d1-f9c1cb5ad26b	fa0a734b-581b-43ab-aa56-65f84cdc80eb	NL11UGBI5000147790	\N	\N	1000000.0000	75000.0000	f	t	2026-06-23 10:24:26.563105+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Garanti Bank	f	1000000.0000	\N	Radiant World Corporation Pte Ltd	UGBINL2A	NL11UGBI5000147790	Amsterdam, Netherlands	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
4244e4fd-e2c8-4e16-9d4d-0feda91b2a5c	b366beba-bb1b-4b01-b75e-03a3d7e0ced5	Radiant World Corporation Pte Ltd	99913d2a-9ff8-408d-9cd6-135aff4e9809	fa0a734b-581b-43ab-aa56-65f84cdc80eb	2025682-048	\N	\N	1800000.0000	75000.0000	f	t	2026-06-23 10:24:26.549823+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Deutsche Bank AG	f	1800000.0000	\N	Radiant World Corporation Pte Ltd	DEUTSGSG	\N	Singapore	Deutsche Bank AG, New York	DEUTUS33	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
dce629d4-8d88-498c-bd45-9d80304bb65d	b366beba-bb1b-4b01-b75e-03a3d7e0ced5	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	2025682-051	\N	\N	1100000.0000	50000.0000	f	t	2026-06-23 10:24:26.548987+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Deutsche Bank AG	f	1100000.0000	\N	Radiant World Corporation Pte Ltd	DEUTSGSG	\N	Singapore	Deutsche Bank AG, New York	DEUTUS33	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
66f5d9cc-ba85-4bc0-a1d3-ff7ce54aacdf	b366beba-bb1b-4b01-b75e-03a3d7e0ced5	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	2025682-050	\N	\N	400000.0000	25000.0000	f	t	2026-06-23 10:24:26.532954+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Deutsche Bank AG	f	400000.0000	\N	Radiant World Corporation Pte Ltd	DEUTSGSG	\N	Singapore	Deutsche Bank AG, New York	DEUTUS33	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
a3d4a144-9fa5-453a-b9a1-308963fdfc35	c22c09d0-52e7-44ac-9964-282b5da56b31	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	fa0a734b-581b-43ab-aa56-65f84cdc80eb	7703284039	\N	\N	300000.0000	50000.0000	f	t	2026-06-23 10:24:26.562311+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	UOB Bank	f	300000.0000	\N	Royalline Trading Pte Ltd	UOVBSGSG	\N	80 Raffles Place, Singapore 048624	\N	IRVTUS3NXXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
b44c4a8f-05a4-4bf0-bbf1-c51e7c9ce984	c22c09d0-52e7-44ac-9964-282b5da56b31	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	7739938108	\N	\N	3600000.0000	25000.0000	f	t	2026-06-23 10:24:26.561631+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	UOB Bank	f	3600000.0000	\N	Royalline Trading Pte Ltd	UOVBSGSG	\N	80 Raffles Place, Singapore 048624	\N	IRVTUS3NXXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
643e2b3d-3161-47f4-8ccf-5b578d0a037a	135f391e-ff59-4c87-b6dc-0bae8e2b0808	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	1853293493	\N	\N	2900000.0000	100000.0000	f	t	2026-06-23 10:24:26.56092+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Valley Bank	f	2900000.0000	\N	Royalline Trading Pte Ltd	MBNYUS33	\N	\N	\N	\N	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
89a52914-587a-4f49-b7cb-550c9d121482	09d000e1-5664-4216-8d2d-180b58eb5013	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	fa0a734b-581b-43ab-aa56-65f84cdc80eb	142-864438-001	\N	\N	2200000.0000	75000.0000	f	t	2026-06-23 10:24:26.559586+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	HSBC	f	2200000.0000	\N	Royalline Trading Pte Ltd	HSBCSGSG	\N	50 Raffles Place, Singapore Land Tower #01-03, Singapore 048623	\N	MRMDUS33	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
d69330c6-5fce-4319-8192-9fbeb48280e3	09d000e1-5664-4216-8d2d-180b58eb5013	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	fa0a734b-581b-43ab-aa56-65f84cdc80eb	261-014997-178	\N	\N	1500000.0000	50000.0000	f	t	2026-06-23 10:24:26.558839+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	HSBC	f	1500000.0000	\N	Royalline Trading Pte Ltd	HSBCSGSG	\N	50 Raffles Place, Singapore Land Tower #01-03, Singapore 048623	\N	MRMDUS33	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
6d591d90-9d77-455d-95b3-2f34f107c6d1	be47f0c8-5e25-45ca-9d2a-1e2cc74cc65d	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	070-56.909.047	\N	\N	100000.0000	100000.0000	f	t	2026-06-23 10:24:26.556606+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	RBI Raiffeisen Bank International AG	f	100000.0000	\N	Royalline Trading Pte Ltd	RZBAATWW	AT0431000007056909047	Am Stadtpark 9, 1030 Vienna, Austria	\N	SCBLUS33XXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
f8e8e4d5-0653-4f4d-9a31-3e59b6d961b7	5c1a6a80-f530-484d-9840-f0878daaedcc	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	fa0a734b-581b-43ab-aa56-65f84cdc80eb	5305-001172-002	\N	\N	3400000.0000	75000.0000	f	t	2026-06-23 10:24:26.555661+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	QNB	f	3400000.0000	\N	Royalline Trading Pte Ltd	QNBASGSG	\N	\N	JP Morgan Chase Bank, New York, USA	CHASUS33XXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
bb57cf0e-6c21-4712-a21a-14c4f27b4a98	5c1a6a80-f530-484d-9840-f0878daaedcc	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	5305001172001	\N	\N	2700000.0000	50000.0000	f	t	2026-06-23 10:24:26.554873+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	QNB	f	2700000.0000	\N	Royalline Trading Pte Ltd	QNBASGSG	\N	\N	JP Morgan Chase Bank, New York, USA	CHASUS33XXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
6843da5f-b6f0-4f3f-9692-2796f8adc13f	c84c669d-4867-43ac-92c5-df165e604534	Royalline Trading Pte Ltd	6be7f785-72a8-4db8-9a4c-22230f831200	fa0a734b-581b-43ab-aa56-65f84cdc80eb	103702104200S5	\N	\N	2000000.0000	25000.0000	f	t	2026-06-23 10:24:26.554194+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	UCO Bank	f	2000000.0000	\N	Royalline Trading Pte Ltd	UCBASGSGXXX	\N	No.3 Raffles Place, Bharat Building, Singapore 048617	Standard Chartered Bank, New York, USA	SCBLUS33XXX	Pranab Kumar Biswas	(65) 6535 0676	(65) 9488 8578	cmsgmain@ucob.com.sg	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
63acdd36-02f4-4696-9368-3def8020c948	c84c669d-4867-43ac-92c5-df165e604534	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	303702108200S6	\N	\N	1300000.0000	100000.0000	f	t	2026-06-23 10:24:26.55352+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	UCO Bank	f	1300000.0000	\N	Royalline Trading Pte Ltd	UCBASGSGXXX	\N	No.3 Raffles Place, Bharat Building, Singapore 048617	Standard Chartered Bank, New York, USA	SCBLUS33XXX	Pranab Kumar Biswas	(65) 6535 0676	(65) 9488 8578	cmsgmain@ucob.com.sg	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
9dcf2dbb-0583-4eed-bd86-a81db1b8cd99	5a9fe5b9-33e2-49f4-ac09-374acf364e5d	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	SS484-001-0001	\N	\N	2600000.0000	75000.0000	f	t	2026-06-23 10:24:26.567302+05:30	2026-07-14 13:07:55.029811+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	Intesa Sanpaolo	f	1552037.5200	\N	Radiant World Corporation Pte Ltd	BCITISGSGXXX	\N	\N	\N	CHASUS33XXX	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
56e56ac2-e38b-4aed-82f4-da8fca9f1f1c	e83b83e1-a992-4978-8268-4dabde459d2c	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	CH9200788000050691465	\N	\N	1200000.0000	25000.0000	f	t	2026-06-23 10:24:26.566382+05:30	2026-06-23 13:08:32.466224+05:30	\N	\N	\N	BCGE Bank	f	1199000.0000	\N	Radiant World Corporation Pte Ltd	BCGECHGGXXX	CH9200788000050691465	Geneve 2, 1211 Switzerland	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
aff1be49-3506-46da-b887-6bf61901b9f3	b03f241f-30bd-4f31-b326-e4b6812fb6f6	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	F10 749 409646	\N	\N	4000000.0000	4000001.0000	f	t	2026-06-23 10:24:26.568224+05:30	2026-06-23 14:20:37.027664+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	Mizuho Bank Ltd	f	4000000.0000	\N	Radiant World Corporation Pte Ltd	MHCBSGSG	\N	Singapore Branch, 12 Marina View, 08-01 Asia Square Tower 2, Singapore	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
17780bd6-58b9-4a8b-b4db-c9c64e05d9a3	0fa1b7e2-f792-417d-8049-6fa239d479b7	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	000455783632	\N	\N	800000.0000	25000.0000	f	t	2026-06-23 10:24:26.557574+05:30	2026-06-23 13:35:48.923441+05:30	\N	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	MCB - The Mauritius Commercial Bank Ltd	f	800000.0000	\N	Royalline Trading Pte Ltd	MCBLMUMU	MU38MCBL0944000455783632000USD	\N	\N	\N	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
9e58c016-d56d-4dfb-8e0f-c8f20317745c	6f3a8064-aec1-4291-8473-d097ca939079	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	08705999102825600	\N	\N	600000.0000	75000.0000	f	t	2026-06-23 10:24:26.552797+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Societe Generale	f	600000.0000	\N	Royalline Trading Pte Ltd	SGBACHZZ	CH09 0870 5999 1028 2560 0	Societe Generale, Paris, ZURICH BRANCH, RUE DU RHONE 8, 1204 GENEVA, SWITZERLAND	\N	SOGEUS33XXX	Alberto Kuttel	(41) 58 272 30 12	(41) 79 536 05 82	alberto.kuttel@sgclb.com	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
3cf5a6d3-8c65-4cd1-8122-4d9d1ce2795f	729ca7aa-8c25-45e9-830e-3dea9b2aa409	Royalline Trading Pte Ltd	65f144d3-5ed6-42b7-add7-4e79abaa770c	fa0a734b-581b-43ab-aa56-65f84cdc80eb	711000460	\N	\N	3900000.0000	50000.0000	f	t	2026-06-23 10:24:26.552044+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	NEXENT BANK	f	3900000.0000	\N	Royalline Trading Pte Ltd	FSUICHGG	CH090870599910282560 0	\N	\N	IRVTUS3NXXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
108bf6ab-a7d2-48b3-a7bc-1346a48bfe40	729ca7aa-8c25-45e9-830e-3dea9b2aa409	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	711000457	\N	\N	3200000.0000	25000.0000	f	t	2026-06-23 10:24:26.551308+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	NEXENT BANK	f	3200000.0000	\N	Royalline Trading Pte Ltd	FSUICHGG	CH9000823600071100045 7	\N	\N	IRVTUS3NXXX	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
d06ff253-efb3-44f1-bf76-2ed72c3983d6	0bd081dc-5f1d-4dc7-b31d-4eeca77ea7f2	Royalline Trading Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	53650	\N	\N	2500000.0000	100000.0000	f	t	2026-06-23 10:24:26.550538+05:30	2026-06-23 10:51:15.586682+05:30	\N	\N	\N	Triland Metals Limited	f	2500000.0000	\N	Royalline Trading Pte Ltd	\N	\N	Trading acc	\N	\N	\N	\N	\N	\N	c2aa6f23-7d9f-4f56-89a5-a048baadb76d
52a9ee2c-df3a-422f-98b6-fba7a732ca62	32ce3f16-51e8-4bc4-985c-d5c0942c25b5	Radiant World Corporation Pte Ltd	91a86e49-bd04-41e3-99f6-76548ee5df83	fa0a734b-581b-43ab-aa56-65f84cdc80eb	CH7708825116524462002	\N	\N	500000.0000	100000.0000	f	t	2026-06-23 10:24:26.565908+05:30	2026-07-21 09:41:11.677789+05:30	\N	\N	\N	TradeX Bank AG	f	-2631537.5200	\N	Radiant World Corporation Pte Ltd	TXBZCHZZ	CH7708825116524462002	Gartenstrasse 24, Postfach 2136, 8027 Zurich	\N	\N	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf
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

COPY public.counterparties (id, code, name, legal_name, role, country_id, country_code, tax_identifiers, addresses, primary_contact_name, primary_contact_email, primary_contact_phone, notes, is_active, created_at, updated_at, deleted_at, created_by, updated_by, kyc_done, payment_nature, kyc_status, kyc_flagged, kyc_reviewed_by, kyc_reviewed_at, kyc_rejection_reason) FROM stdin;
5ac38e04-2f21-4d3d-8b3a-281bd269980f	CP-001	Acme Supplies Pvt Ltd	Acme Supplies Private Limited	VENDOR	a7a8f78e-67f7-4dca-88f0-68831fa7a0ff	IN	[{"type": "GSTIN", "value": "27AABCA1234M1Z5"}]	[]	Ramesh Iyer	ramesh@acmesupplies.in	+91 22 4000 1000	\N	t	2026-06-23 11:03:15.437943+05:30	2026-06-23 11:03:15.437943+05:30	\N	\N	\N	t	\N	APPROVED	f	\N	\N	\N
88d9a2fb-089a-4e14-8707-20009364b231	CP-002	Asia Metals Pte Ltd	Asia Metals Pte. Ltd.	CUSTOMER	cb09aa2a-b6b6-41ff-96c8-356f4f35906c	SG	[{"type": "GST", "value": "201812345A"}]	[]	Lim Wei	lim.wei@asiametals.sg	+65 6500 2000	\N	t	2026-06-23 11:03:15.464751+05:30	2026-06-23 11:03:15.464751+05:30	\N	\N	\N	t	\N	APPROVED	f	\N	\N	\N
418c9eca-7680-4411-abbe-7d0904be5d5f	CP-003	Britannia Logistics Ltd	Britannia Logistics Limited	VENDOR	6fde955c-c9fd-49c7-9c4d-35710523d49b	GB	[{"type": "VAT", "value": "GB123456789"}]	[]	Oliver Hughes	oliver@britannialog.co.uk	+44 20 7100 3000	\N	t	2026-06-23 11:03:15.465655+05:30	2026-06-23 11:03:15.465655+05:30	\N	\N	\N	t	\N	APPROVED	f	\N	\N	\N
91bb0080-571e-43e9-84e8-ff957c08b0a4	CP-004	Gulf Trade Partners LLC	Gulf Trade Partners LLC	BOTH	510b1066-f4dd-4d84-abd5-83d428caad49	AE	[{"type": "TRN", "value": "100123456700003"}]	[]	Khalid Hassan	khalid@gulftrade.ae	+971 4 300 4000	\N	t	2026-06-23 11:03:15.466977+05:30	2026-06-23 11:03:15.466977+05:30	\N	\N	\N	t	\N	APPROVED	f	\N	\N	\N
80ec1d1d-7141-439f-bd42-36f304e8baf5	CP-005	Helvetia Trade Finance AG	Helvetia Trade Finance AG	VENDOR	89e707e6-19d3-4d6a-afd7-60ceffa50895	CH	[{"type": "VAT", "value": "CHE-123.456.789"}]	[]	Anna Keller	anna.keller@helvetiatf.ch	+41 44 500 5000	\N	t	2026-06-23 11:03:15.468339+05:30	2026-06-23 11:03:15.468339+05:30	\N	\N	\N	t	\N	APPROVED	f	\N	\N	\N
75937bba-48b0-42bc-bbcb-b80af964a83f	CP-006	Meridian Commodities Inc	Meridian Commodities Inc.	CUSTOMER	44b7d4db-47fc-4ed0-a998-aa0698ffd315	US	[{"type": "EIN", "value": "12-3456789"}]	[]	Sarah Johnson	sarah@meridiancomm.com	+1 212 555 6000	\N	t	2026-06-23 11:03:15.469476+05:30	2026-06-23 11:03:15.469476+05:30	\N	\N	\N	t	\N	APPROVED	f	\N	\N	\N
e9439123-ad25-4229-a522-7abb124acced	CP-007	Shenzhen Hardware Co Ltd	Shenzhen Hardware Co., Ltd.	VENDOR	c1b07583-a883-444e-b5a9-6b366ba1e8f5	CN	[{"type": "OTHER", "value": "9144030012345678XA"}]	[]	Zhang Wei	zhang.wei@szhardware.cn	+86 755 8000 7000	\N	t	2026-06-23 11:03:15.470285+05:30	2026-06-23 11:03:15.470285+05:30	\N	\N	\N	t	\N	APPROVED	f	\N	\N	\N
9beb07aa-2fcd-4925-8840-3a384ade6f22	CP-008	Royal Crescent Trading FZE	Royal Crescent Trading FZE	BOTH	510b1066-f4dd-4d84-abd5-83d428caad49	AE	[{"type": "TRN", "value": "100987654300003"}]	[]	Fatima Noor	fatima@royalcrescent.ae	+971 4 300 8000	\N	t	2026-06-23 11:03:15.471389+05:30	2026-06-23 11:03:15.471389+05:30	\N	\N	\N	t	\N	APPROVED	f	\N	\N	\N
650d3122-c58e-48a9-9913-24c48dc19b34	CP-0001000	testing	ACME	VENDOR	\N	\N	[]	[]	\N	acme@gmail.com	\N	\N	t	2026-06-30 10:41:33.635016+05:30	2026-06-30 10:41:33.635016+05:30	\N	666c0362-0318-45f1-a2f8-34c5e1970d94	666c0362-0318-45f1-a2f8-34c5e1970d94	f	NON_TRADE	APPROVED	t	\N	\N	\N
db9d472d-3617-42fe-88bf-63e7ec8d2b7e	CP-100	First Economy	First Economy	VENDOR	a7a8f78e-67f7-4dca-88f0-68831fa7a0ff	\N	[]	[]	Sonal Tamboli	sonal@firsteconomy.com	9876543210	\N	t	2026-07-08 12:02:54.751993+05:30	2026-07-08 12:02:54.751993+05:30	\N	5a59123f-8a33-462c-a1bc-49efff8668f3	5a59123f-8a33-462c-a1bc-49efff8668f3	f	\N	APPROVED	f	\N	\N	\N
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.countries (id, country_name, country_short_name, code, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_sanctioned, currency_id) FROM stdin;
510b1066-f4dd-4d84-abd5-83d428caad49	United Arab Emirates	UAE	AE	t	2026-06-23 09:49:36.508008+05:30	2026-06-23 09:49:36.508008+05:30	\N	\N	\N	f	\N
89e707e6-19d3-4d6a-afd7-60ceffa50895	Switzerland	Switzerland	CH	t	2026-06-23 09:49:36.522721+05:30	2026-06-23 09:49:36.522721+05:30	\N	\N	\N	f	\N
c1b07583-a883-444e-b5a9-6b366ba1e8f5	China	China	CN	t	2026-06-23 09:49:36.524096+05:30	2026-06-23 09:49:36.524096+05:30	\N	\N	\N	f	\N
8f79357b-c279-4cb1-bbb4-770c03c3ac95	Germany	Germany	DE	t	2026-06-23 09:49:36.52531+05:30	2026-06-23 09:49:36.52531+05:30	\N	\N	\N	f	\N
6fde955c-c9fd-49c7-9c4d-35710523d49b	United Kingdom	UK	GB	t	2026-06-23 09:49:36.526928+05:30	2026-06-23 09:49:36.526928+05:30	\N	\N	\N	f	\N
6c81583f-198a-4d8c-a826-fac186a89436	Hong Kong	Hong Kong	HK	t	2026-06-23 09:49:36.52793+05:30	2026-06-23 09:49:36.52793+05:30	\N	\N	\N	f	\N
a7a8f78e-67f7-4dca-88f0-68831fa7a0ff	India	India	IN	t	2026-06-23 09:49:36.529826+05:30	2026-06-23 09:49:36.529826+05:30	\N	\N	\N	f	\N
cb09aa2a-b6b6-41ff-96c8-356f4f35906c	Singapore	Singapore	SG	t	2026-06-23 09:49:36.530722+05:30	2026-06-23 09:49:36.530722+05:30	\N	\N	\N	f	\N
44b7d4db-47fc-4ed0-a998-aa0698ffd315	United States	USA	US	t	2026-06-23 09:49:36.531812+05:30	2026-06-23 09:49:36.531812+05:30	\N	\N	\N	f	\N
d74b89d6-f6c6-477c-9c4f-4060cef6a368	France	France	FR	t	2026-06-23 09:51:16.372112+05:30	2026-06-23 09:51:16.372112+05:30	\N	\N	\N	f	\N
2e1fc220-dd9a-455a-9226-082c1b6a1d49	South Africa	South Africa	ZA	t	2026-06-23 09:54:09.272325+05:30	2026-06-23 09:54:09.272325+05:30	\N	\N	\N	f	\N
74dbb0eb-4df4-4408-8046-7ab9d8059a22	Austria	Austria	AT	t	2026-06-23 10:29:05.232012+05:30	2026-06-23 10:29:05.232012+05:30	\N	\N	\N	f	\N
a033e999-778e-4c2c-aaa4-01a4ab9d40d3	Netherlands	Netherlands	NL	t	2026-06-23 10:29:05.236324+05:30	2026-06-23 10:29:05.236324+05:30	\N	\N	\N	f	\N
54e61a70-a3e6-4738-8863-7573f72f37aa	Mauritius	Mauritius	MU	t	2026-06-23 10:29:05.237115+05:30	2026-06-23 10:29:05.237115+05:30	\N	\N	\N	f	\N
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
\.


--
-- Data for Name: incoming_receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incoming_receipts (id, receipt_number, legal_entity_id, counterparty_id, receive_from_account_id, expected_amount, expected_currency_code, purpose_description, status, submitted_at, received_at, received_amount, received_currency_code, inward_bank_reference, received_remarks, cancellation_reason, created_at, updated_at, deleted_at, created_by, updated_by, received_from_account) FROM stdin;
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
6	1782000000003	AddLegalEntityIdsToPaymentTypes1782000000003
7	1782000000004	AddLegalEntityToPaymentRequests1782000000004
8	1782000000005	RemoveExtraAdminRoles1782000000005
9	1782000000006	AddPaymentRequestRejections1782000000006
10	1782000000007	AddSnapshotToPaymentRequestRejections1782000000007
11	1782000000008	AddTtDocumentAndSwiftStage1782000000008
12	1782000000009	AddTreasuryCheckerComments1782000000009
13	1782000000010	AddTreasurySwiftToStatusCheck1782000000010
14	1782000000011	AddAwaitingClosureStatus1782000000011
15	1782000000012	AddPaymentRequestMessages1782000000012
16	1782000000012	AddReopenInvestigation1782000000012
17	1782000000013	AddCounterpartyKyc1782000000013
19	1782000000014	AddUsernameToUsers1782000000014
\.


--
-- Data for Name: password_reset_otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_otps (id, user_id, code_hash, expires_at, consumed_at, attempts, created_at) FROM stdin;
503b445a-6c33-4f81-bc7b-0cd541588913	42e90d82-87d6-4cae-b31d-098e25730774	c06b9f7c2f57d332f387c4c1f5a637777685e13f2db528abd9bf38b8b6376b6c	2026-07-21 08:39:46.74+05:30	2026-07-21 08:30:58.745093+05:30	1	2026-07-21 08:29:46.749989+05:30
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
a1d4a01d-09a4-4a5b-b169-1cd14deca7e7	8ac57121-54f4-4774-9370-02a8a0383956	1	ROLE	\N	81c68ec5-f574-4031-b9dd-a93a42ef108d	APPROVED	41efa003-34e4-4667-8e96-95503d22a889	2026-07-21 08:55:23.091+05:30	testing	2026-07-21 08:54:44.861507+05:30	2026-07-21 08:55:23.086842+05:30
5a56e3ea-a3fb-466f-bcbc-9db63fc4ec05	8ac57121-54f4-4774-9370-02a8a0383956	2	USER	ce83209c-bd98-4930-8c55-b50b42c2385d	\N	APPROVED	ce83209c-bd98-4930-8c55-b50b42c2385d	2026-07-21 08:56:01.517+05:30	testing	2026-07-21 08:55:23.086842+05:30	2026-07-21 08:56:01.509543+05:30
fc2296ff-3687-405d-856f-83e82d9131d6	8ac57121-54f4-4774-9370-02a8a0383956	3	USER	e8fe5cb3-f253-4861-b900-1959b9e74182	\N	APPROVED	e8fe5cb3-f253-4861-b900-1959b9e74182	2026-07-21 08:56:23.934+05:30	testing	2026-07-21 08:55:23.086842+05:30	2026-07-21 08:56:23.932764+05:30
\.


--
-- Data for Name: payment_request_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_request_documents (id, payment_request_id, document_code, document_label, file_name, file_url, file_size_bytes, mime_type, uploaded_by, uploaded_at, created_at, updated_at) FROM stdin;
1ab2efa1-1fa5-4547-80f0-fa66f603be4a	8ac57121-54f4-4774-9370-02a8a0383956	INVOICE	Invoice	ISBP25-0242S(M) 999.747mt.pdf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1784603534356-965202.pdf	\N	\N	42e90d82-87d6-4cae-b31d-098e25730774	2026-07-21 08:42:23.538685+05:30	2026-07-21 08:42:23.538685+05:30	2026-07-21 08:42:23.538685+05:30
\.


--
-- Data for Name: payment_request_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_request_messages (id, payment_request_id, sender_id, recipient_id, message, attachments, created_at) FROM stdin;
\.


--
-- Data for Name: payment_request_rejections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_request_rejections (id, payment_request_id, stage, step_order, attempt_no, rejected_by, reason, rejected_at, snapshot) FROM stdin;
\.


--
-- Data for Name: payment_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_requests (id, request_number, payment_type_id, counterparty_id, employee_id, beneficiary_account_id, source_account_id, currency_id, amount, purpose_description, invoice_number, due_date, status, submitted_at, approved_at, released_at, paid_at, matrix_id, current_step_order, bank_reference, value_date, proof_of_payment_url, sanction_warning, sanction_override_reason, counterparty_snapshot, beneficiary_snapshot, rejection_reason, cancellation_reason, withdrawn_reason, created_at, updated_at, deleted_at, created_by, updated_by, anomaly_flag, anomaly_notes, tt_mode, treasury_reference_number, swift_copy_url, treasury_maker_by, treasury_maker_at, treasury_checker_by, treasury_checker_at, treasury_authoriser_by, treasury_authoriser_at, completed_at, treasury_maker_role_id, treasury_checker_role_id, treasury_authoriser_role_id, raised_by_employee_id, legal_entity_id, tt_document_url, treasury_swift_by, treasury_swift_at, treasury_checker_comments, reopen_reason, reopened_at, reopened_by) FROM stdin;
8ac57121-54f4-4774-9370-02a8a0383956	PR-2026-00089	8cf29542-6a44-4c74-8d86-13999e661902	e9439123-ad25-4229-a522-7abb124acced	\N	e036853a-fcd1-43f6-beaf-620749697d0b	52a9ee2c-df3a-422f-98b6-fba7a732ca62	91a86e49-bd04-41e3-99f6-76548ee5df83	3131537.5200	testing	115732	2026-07-22	COMPLETED	2026-07-21 08:54:44.886+05:30	2026-07-21 08:56:23.938+05:30	\N	\N	b0ef3cc1-e6ad-412c-b007-9b5e38fb3705	\N	\N	\N	\N	f	\N	{"id": "e9439123-ad25-4229-a522-7abb124acced", "countryId": "c1b07583-a883-444e-b5a9-6b366ba1e8f5", "legalName": "Shenzhen Hardware Co., Ltd."}	{"id": "e036853a-fcd1-43f6-beaf-620749697d0b", "iban": null, "bankId": "0fa1b7e2-f792-417d-8049-6fa239d479b7", "swiftBic": "MCBLMUMU", "countryId": "c1b07583-a883-444e-b5a9-6b366ba1e8f5", "currencyId": "99913d2a-9ff8-408d-9cd6-135aff4e9809", "accountNumber": "BEN1000222", "accountHolderName": "Shenzhen Hardware Co Ltd"}	\N	\N	\N	2026-07-21 08:42:23.538685+05:30	2026-07-21 09:42:18.366398+05:30	\N	42e90d82-87d6-4cae-b31d-098e25730774	42e90d82-87d6-4cae-b31d-098e25730774	f	\N	ONLINE_TT	FT123REF988	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1784607055219-215985.pdf	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	2026-07-21 09:21:43.729+05:30	269753e8-9865-43eb-8e7f-cc28c5dc7011	2026-07-21 09:38:21.168+05:30	ea679108-16c6-49e3-a166-667e8d0b109f	2026-07-21 09:39:37.831+05:30	2026-07-21 09:42:18.364+05:30	\N	\N	\N	\N	2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf	https://pcs-documents-prod.s3.ap-south-1.amazonaws.com/uploads/1784605900002-437984.pdf	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	2026-07-21 09:41:11.734+05:30	testing	\N	\N	\N
\.


--
-- Data for Name: payment_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_types (id, code, name, description, direction, requires_approval_chain, is_batch_based, is_confidential, mobile_initiation_only, allows_cross_currency, document_policy, field_config, is_system, is_active, version, effective_from, effective_to, created_at, updated_at, deleted_at, created_by, updated_by, payment_category_id, maker_role_id, checker_role_id, maker_user_id, checker_user_id, legal_entity_id, maker_role_ids, employee_self_service, legal_entity_ids) FROM stdin;
8cf29542-6a44-4c74-8d86-13999e661902	TRADE_IRON_ORE	Trade related payments - Iron Ore	\N	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-07-21	\N	2026-07-21 07:56:34.482585+05:30	2026-07-21 07:56:34.482585+05:30	\N	\N	\N	6ec3aebe-76f3-46f1-829a-b9d8bd93078f	64424fa9-5141-49d7-84c8-f2b10feeec22	81c68ec5-f574-4031-b9dd-a93a42ef108d	\N	\N	\N	{64424fa9-5141-49d7-84c8-f2b10feeec22}	f	{2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf,bbf4e3a4-3487-45d6-9262-ca681e3ffe83}
aa8fd303-92dc-4837-9866-756a8d0317ff	CONSULT_CORPSEC_RENEWALS_RADIANT	Consultants, Corp sec, Renewals	\N	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-07-21	\N	2026-07-21 08:15:56.364363+05:30	2026-07-21 08:15:56.364363+05:30	\N	\N	\N	2ef7dc78-ca46-4ab7-b030-7b13031e3321	\N	\N	\N	\N	\N	{4750850c-b248-49d0-b0f1-8089bff72304,a4380039-15ec-4e81-8a2f-31e33c320ddd,51044feb-481f-4fc7-ac99-0be56ba30120}	f	{2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf}
3809af3e-0f0a-4564-a2c7-65335c4b2fb1	CONSULT_CORPSEC_RENEWALS_RSML	Consultants, Corp sec, Renewals	\N	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-07-21	\N	2026-07-21 08:15:56.364363+05:30	2026-07-21 08:15:56.364363+05:30	\N	\N	\N	2ef7dc78-ca46-4ab7-b030-7b13031e3321	\N	\N	\N	\N	\N	{4750850c-b248-49d0-b0f1-8089bff72304,a4380039-15ec-4e81-8a2f-31e33c320ddd,51044feb-481f-4fc7-ac99-0be56ba30120}	f	{bbf4e3a4-3487-45d6-9262-ca681e3ffe83}
763f3558-8f32-4542-8b26-c20668e78dea	TRADE_BASEMETAL	Trade related payments - basemetal	\N	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-07-21	\N	2026-07-21 08:20:22.640999+05:30	2026-07-21 08:20:22.640999+05:30	\N	\N	\N	6ec3aebe-76f3-46f1-829a-b9d8bd93078f	8ce60573-2430-4484-9bea-dc7984d6523e	81c68ec5-f574-4031-b9dd-a93a42ef108d	\N	\N	\N	{8ce60573-2430-4484-9bea-dc7984d6523e}	f	{c2aa6f23-7d9f-4f56-89a5-a048baadb76d,e1f5c453-f4da-44be-8d96-fab306c94ece}
5814d3a0-36a2-4ab2-9efa-960464716018	IRD_TAX	IRD Tax related payments	\N	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-07-21	\N	2026-07-21 08:38:09.963511+05:30	2026-07-21 08:38:09.963511+05:30	\N	\N	\N	2ef7dc78-ca46-4ab7-b030-7b13031e3321	a1eb9e2c-f098-4c14-a06e-cb5c7b7bec04	81c68ec5-f574-4031-b9dd-a93a42ef108d	\N	\N	\N	{a1eb9e2c-f098-4c14-a06e-cb5c7b7bec04}	f	{2bfb7abf-ccbd-4e42-ae0d-a00a109c75cf,bbf4e3a4-3487-45d6-9262-ca681e3ffe83}
55058829-bab8-43bd-bdf3-6cd43ce3de6e	OFFICE_UTILITY	Office and other utility payments	\N	OUTGOING	t	f	f	f	t	[]	[]	f	t	1	2026-07-21	\N	2026-07-21 08:38:09.963511+05:30	2026-07-21 08:38:09.963511+05:30	\N	\N	\N	2ef7dc78-ca46-4ab7-b030-7b13031e3321	851cb1eb-1ea2-44c7-b47f-720621f340ce	81c68ec5-f574-4031-b9dd-a93a42ef108d	\N	\N	\N	{851cb1eb-1ea2-44c7-b47f-720621f340ce}	f	{e1f5c453-f4da-44be-8d96-fab306c94ece}
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
7ea68dff-db3b-4af0-a5c9-68d37dfcd703	APPROVER	Approver	APPROVER	f	2026-06-04 15:31:41.102141+05:30	2026-06-04 15:31:41.102141+05:30	\N
9f4e11e9-8c7a-4d4a-a563-190625caa263	TREASURY_MAKER_OFFLINE	Treasury Maker (Offline)	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	TREASURY_MAKER_ONLINE	Treasury Maker (Online)	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
15ab6892-78f6-4e88-aa6a-34d5358460c6	TREASURY_AUTHORISER	Treasury Authoriser	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
adcb32d4-e1f3-498d-96aa-33018a941d24	TREASURY_CHECKER	Treasury Checker	\N	t	2026-06-04 15:32:46.396186+05:30	2026-06-04 15:32:46.396186+05:30	\N
fb4ee674-45b9-4160-aead-ec4470fb1592	CHAIRMAN	Chairman	Initiates confidential (chairman-style) payments.	t	2026-06-05 15:40:49.812089+05:30	2026-06-05 15:40:49.812089+05:30	\N
0082be8d-052d-499a-94f6-2019d8dff9e7	TREASURY_TEAM_FOR_CHAIRMAN	Treasury Team (Chairman)	Completes confidential (chairman-style) payments in a single step: records the reference number, attaches the SWIFT copy / MT103, picks the source account and completes the payment. No maker/checker/authoriser chain.	f	2026-06-05 15:40:49.812089+05:30	2026-06-05 15:40:49.812089+05:30	\N
fdf3fc9a-2e7f-4b56-9987-553d0f0a69b7	SUPER_ADMIN	Platform administrator	Platform administrator	t	2026-06-05 17:14:07.493871+05:30	2026-06-05 17:14:07.493871+05:30	\N
3bc8fcfd-1f2f-48c5-ba4f-3ab487e650bf	EMPLOYEE	Employee	Employee	f	2026-06-08 14:45:49.189872+05:30	2026-06-08 14:45:49.189872+05:30	\N
7753e5de-1270-46e4-acfe-009a2ba450e6	COUNTERPARTY	Counterparty	External counterparty user	t	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
65af2bfb-41eb-4445-9162-04399f9304c6	HR_TEAM	HR	Human Resources — Maker for Salaries	f	2026-06-23 11:06:49.689369+05:30	2026-06-23 11:06:49.689369+05:30	\N
98f8e152-be09-4443-a3ba-e9188aaa4996	APPROVER_1	Approver Level 1	First-level approval authority	t	2026-06-23 11:06:49.689369+05:30	2026-07-21 06:38:45.640229+05:30	2026-07-21 06:38:45.640229+05:30
d21bb134-67b6-409d-8ea8-a2c013ac2e92	APPROVER_2	Approver Level 2	Second-level approval authority	t	2026-06-23 11:06:49.689369+05:30	2026-07-21 06:38:50.124967+05:30	2026-07-21 06:38:50.124967+05:30
8b69e37f-b13b-4c4c-9f13-2d2de79d890f	INITIATOR	Initiator	Creates payment requests	t	2026-06-23 11:06:49.689369+05:30	2026-07-21 06:39:23.036051+05:30	2026-07-21 06:39:23.036051+05:30
9297ad11-6e3c-4215-ab53-7c09547baf1b	NT_VENDOR_PAYMENT_TEAM	Non Trade  - vendor Payment	Non Trade  - vendor Payment	f	2026-06-04 16:07:40.962028+05:30	2026-07-21 06:39:32.917611+05:30	2026-07-21 06:39:32.917611+05:30
0385aa54-b00a-4e55-a9d8-f35ef42568fc	REIMBURSEMENT_CHECKER	Reimbursements_checker	Reimbursements_checker	f	2026-06-08 15:13:56.238667+05:30	2026-07-21 06:39:40.575775+05:30	2026-07-21 06:39:40.575775+05:30
ab3409a8-eb70-4ff6-a1f8-1c63ec444edb	SUBSCRIPTION_APPROVERS	Subscription Approvers	Tarang or Ganesh — Annual Subscription approver group	f	2026-06-23 11:06:49.689369+05:30	2026-07-21 06:40:03.884138+05:30	2026-07-21 06:40:03.884138+05:30
654c0f96-738b-4344-802c-f477aed560c2	TREASURY_TEAM	Treasury Team	Treasury — verifies salary payouts	f	2026-06-23 11:06:49.689369+05:30	2026-07-21 06:40:16.200776+05:30	2026-07-21 06:40:16.200776+05:30
1e30a840-fee1-459a-bca2-119a2499820b	ROHIT_TEAM	Rohit Team	Rohit's team — Maker for Statutory dues	f	2026-06-23 11:06:49.689369+05:30	2026-07-21 06:40:37.818816+05:30	2026-07-21 06:40:37.818816+05:30
2c0a6a9b-f946-40e0-ae16-0324ef23f4e9	ABHISHEK_TEAM	Abhishek Team	Abhishek's verification team	f	2026-06-23 11:06:49.689369+05:30	2026-07-21 06:41:39.631929+05:30	2026-07-21 06:41:39.631929+05:30
8ce60573-2430-4484-9bea-dc7984d6523e	BASEMETAL_TEAM	Basemetal Team	\N	f	2026-07-21 07:12:50.121018+05:30	2026-07-21 07:12:50.121018+05:30	\N
4750850c-b248-49d0-b0f1-8089bff72304	COMPANY_SECRETARY	Company secretary	\N	f	2026-07-21 07:12:50.121018+05:30	2026-07-21 07:12:50.121018+05:30	\N
5e7a435a-fc71-4169-a7d7-a0aa59c15e31	IT	IT	\N	f	2026-07-21 07:12:50.121018+05:30	2026-07-21 07:12:50.121018+05:30	\N
14cddee6-2bde-4ed7-9316-8a76c2f6225a	LEGAL_TEAM	Legal Team	\N	f	2026-07-21 07:12:50.121018+05:30	2026-07-21 07:12:50.121018+05:30	\N
a4380039-15ec-4e81-8a2f-31e33c320ddd	TRADE_FINANCE_TEAM	Trade finance team	\N	f	2026-07-21 07:12:50.121018+05:30	2026-07-21 07:12:50.121018+05:30	\N
6b3ebaaf-821d-492c-bf1c-ea8aaa669016	ADMIN_DXB	Admin DXB	\N	f	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N
c7d42925-c42d-46be-987b-786206225810	ADMIN_SG	Admin SG	\N	f	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N
3eacf2b0-8952-45ac-9daf-7a49ebc244ca	ADMIN_GENEVA	Admin Geneva	\N	f	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N
51044feb-481f-4fc7-ac99-0be56ba30120	ADMIN	Admin	\N	f	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N
efa80e5d-78f8-4ffb-94f6-3ebc709a68c7	SENIOR_TRADER	Senior Trader	\N	f	2026-07-21 08:02:59.94857+05:30	2026-07-21 08:02:59.94857+05:30	\N
81c68ec5-f574-4031-b9dd-a93a42ef108d	ACCOUNTS_TEAM	Accounts Team	Trade payments checker	f	2026-06-04 15:31:12.814415+05:30	2026-07-21 08:05:59.612979+05:30	\N
a5494d57-aac3-4531-b4a7-3a8f857e91d7	TRADING_TEAM	Trading Team	Commodity trading desk	f	2026-06-23 11:06:49.689369+05:30	2026-07-21 08:06:42.633803+05:30	\N
a1eb9e2c-f098-4c14-a06e-cb5c7b7bec04	AUDIT_TEAM_HEAD	Audit Team Head	Audit Team Head — Approver for Statutory dues	f	2026-06-23 11:06:49.689369+05:30	2026-07-21 08:38:09.963511+05:30	\N
851cb1eb-1ea2-44c7-b47f-720621f340ce	ADMIN_SA	Admin SA	\N	f	2026-07-21 08:38:09.963511+05:30	2026-07-21 08:38:09.963511+05:30	\N
a57b425b-b2bd-4b7a-a18f-6575f6b4c362	CHECKER	Checker	Verifies documents on payment requests	t	2026-06-23 11:06:49.689369+05:30	2026-07-21 08:58:36.353597+05:30	\N
2c8577d8-1e46-4087-a25d-d17d2eb4106b	AUTHORISER	Authoriser	\N	f	2026-07-21 08:58:36.353597+05:30	2026-07-21 08:58:36.353597+05:30	\N
7361467f-9324-403a-b224-e34fef57b114	KYC_TEAM	KYC Team	\N	t	2026-06-04 15:32:46.396186+05:30	2026-07-21 09:12:12.607043+05:30	\N
de65d55a-3e24-4007-b0e4-47f20db52ed1	MAKER	Maker	\N	f	2026-07-21 08:58:36.353597+05:30	2026-07-21 09:24:10.561719+05:30	2026-07-21 09:24:10.561719+05:30
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role_id, created_at) FROM stdin;
6d44c9fa-ae37-4aee-a986-ad523e572600	8558f6fa-ebf6-45b3-baf6-b6c2c705faea	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-07-21 07:43:30.917437+05:30
365a7446-a8a7-4d99-b341-04097a47e837	41efa003-34e4-4667-8e96-95503d22a889	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-07-21 07:43:30.917437+05:30
c0e5537e-4a3f-409e-b53e-3746f27a99c0	36f4de66-4fee-49a0-aab6-ef046df181c9	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-07-21 07:43:30.917437+05:30
155bd9eb-0834-4d26-a64b-32b0a738939a	e8fe5cb3-f253-4861-b900-1959b9e74182	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-07-21 07:43:30.917437+05:30
5f95c37f-123d-45b4-8180-5d9630c915ac	9efa5419-6bbf-43be-84df-356dda997548	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-07-21 07:43:30.917437+05:30
42b758cc-0028-4484-b0d5-646656203738	897a8844-01e3-4603-b569-908c48884345	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-07-21 07:43:30.917437+05:30
daac0688-54ac-4f67-b550-45c3991b0456	8558f6fa-ebf6-45b3-baf6-b6c2c705faea	81c68ec5-f574-4031-b9dd-a93a42ef108d	2026-07-21 07:45:09.079867+05:30
79124d9a-b4c5-4347-8899-424fcbaa6b47	41efa003-34e4-4667-8e96-95503d22a889	81c68ec5-f574-4031-b9dd-a93a42ef108d	2026-07-21 07:45:09.079867+05:30
7b831d7d-ebe6-4388-9b1b-4c7dea172013	ce83209c-bd98-4930-8c55-b50b42c2385d	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-07-21 07:56:34.482585+05:30
e5d7bb73-0d08-4007-9b90-b2f29a35bb0a	4913ef43-3f79-44ce-ab9e-0b3965491660	7ea68dff-db3b-4af0-a5c9-68d37dfcd703	2026-07-21 08:15:56.364363+05:30
8b3a473f-a550-4e38-834c-c3ffd7e31370	5a59123f-8a33-462c-a1bc-49efff8668f3	fdf3fc9a-2e7f-4b56-9987-553d0f0a69b7	2026-06-05 17:14:07.493871+05:30
fa52b7ce-921b-4d2b-b2b5-78e28f090bc2	47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	2026-07-21 09:20:46.436684+05:30
521871d6-936b-4208-ac5c-921a89fabfd3	2b20594e-f5b5-4fb5-a6db-bb55a2711155	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	2026-07-21 09:25:38.586602+05:30
0816b6ac-969f-4c5c-952d-2aa8e62b2283	d05544a3-fdd1-4cfd-b20e-10c25b8eb9d8	10c71ec6-3cc0-4d5a-a96c-0c0e47778d3f	2026-07-21 09:25:38.586602+05:30
42082f31-426d-4c6c-9a97-7d3db8665623	269753e8-9865-43eb-8e7f-cc28c5dc7011	adcb32d4-e1f3-498d-96aa-33018a941d24	2026-07-21 09:25:38.586602+05:30
7aee48ac-10ac-439e-b5b5-2005285b9c03	247e9ebf-723d-4fae-9c4d-06c9f20335d4	15ab6892-78f6-4e88-aa6a-34d5358460c6	2026-07-21 09:25:38.586602+05:30
75342cca-128a-4c04-8f9f-93167708b98b	ea679108-16c6-49e3-a166-667e8d0b109f	15ab6892-78f6-4e88-aa6a-34d5358460c6	2026-07-21 09:25:38.586602+05:30
f4446e0b-fd58-4696-b4ad-c499df1b940a	c41c0956-a56f-4e05-b81c-2c03ab5558cd	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
15df61b4-d3e8-4e34-a2fd-16ada16c6aa0	42e90d82-87d6-4cae-b31d-098e25730774	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
eeb091e9-8050-4625-bcff-ba720e150adb	21bf8f52-8412-4e74-b4f8-14f708aa2884	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
9ce4248a-8483-46a6-a69d-d517486bc37b	4ec880df-0f5f-4543-a4f7-d138cf54983a	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
c23b07b8-28ff-4d7e-a739-c6c29672a75f	12828d09-9ad4-4bcf-a873-8eba0e3d288e	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
79b03453-f8a2-4523-bb8e-f6d990b99e4f	f72f287f-bd29-4f86-83ab-2893ea360f5e	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
a94ddcb3-70cd-42cc-89aa-d1f612500e42	8d9f5a8d-b1b2-47ba-b84c-779bfdb1f94c	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
4223d357-76ed-4dd1-b0af-e99c57468621	4a90ebf5-7302-411c-9fe0-3d027e524e18	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
854abbc8-e7e2-467f-8850-d5807a29937c	15a30726-d34a-438f-82ee-a01e7796c18b	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
eef4cdf7-e090-4979-8ae9-6f66e6ac9a29	2d79155c-4149-4240-8542-c5cdaa68faee	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
b2479e92-7bf1-4858-80bd-c320fa7e3e51	9d1c6641-ca2d-428d-8585-199ac1d10818	64424fa9-5141-49d7-84c8-f2b10feeec22	2026-07-21 07:17:05.141046+05:30
9acbb9cc-22b3-4016-8ff0-9e0c76808cee	6e12df04-27f2-4ade-8d38-06e7e30545f4	8ce60573-2430-4484-9bea-dc7984d6523e	2026-07-21 07:23:17.113733+05:30
1d100216-ce31-4eeb-856d-f819fcf62c5a	457c53a2-bb81-470e-b961-8c52ca3f5a4e	8ce60573-2430-4484-9bea-dc7984d6523e	2026-07-21 07:23:17.113733+05:30
129bb6dd-7cd7-4377-89bb-c8761768ea27	6b62ee4b-f9b5-48cc-97ec-d417a18a8786	8ce60573-2430-4484-9bea-dc7984d6523e	2026-07-21 07:23:17.113733+05:30
1facaec5-e4ca-48cb-87c9-87e02f63bd28	5fdc8dfc-8087-45cb-b9f9-86c637daeb21	a5494d57-aac3-4531-b4a7-3a8f857e91d7	2026-07-21 07:30:34.411211+05:30
2b9b535d-70f8-4201-85fc-2f6c22d7af6f	ccd95d1c-990e-4bf6-b182-cdfcf985c3a4	a5494d57-aac3-4531-b4a7-3a8f857e91d7	2026-07-21 07:30:34.411211+05:30
e87d1f2b-c5c0-45ac-b288-084111c7e089	94f85a5e-7bb9-4967-b6cb-78e71242ee08	a5494d57-aac3-4531-b4a7-3a8f857e91d7	2026-07-21 07:30:34.411211+05:30
0c4af104-81be-445c-ba45-538895313037	92c057cc-abea-4852-80c8-b87e21d94f99	a5494d57-aac3-4531-b4a7-3a8f857e91d7	2026-07-21 07:30:34.411211+05:30
bacf33fb-8f4e-428f-bacf-fa8aa85f231a	4d38e4ce-51e6-4299-a631-d4b50f6ced09	a5494d57-aac3-4531-b4a7-3a8f857e91d7	2026-07-21 07:30:34.411211+05:30
f98a82e1-f8a9-4fd4-8f31-6c06c8daa975	7f520e97-c990-4ec2-8f6e-43192510d259	4750850c-b248-49d0-b0f1-8089bff72304	2026-07-21 07:30:34.411211+05:30
529227a0-828d-45d5-9481-77fbbd15a54f	93c05dcc-cbfb-47b2-a231-82986553fbe9	6b3ebaaf-821d-492c-bf1c-ea8aaa669016	2026-07-21 07:30:34.411211+05:30
2b573f87-e515-4ec4-9fde-8a0e268769ae	ca366f4e-6eec-4daf-b625-ba561497eb97	c7d42925-c42d-46be-987b-786206225810	2026-07-21 07:30:34.411211+05:30
f57fd68b-886a-4a28-9222-6f41907860a4	d2489888-fc92-4065-a2b4-ea5e114b9748	3eacf2b0-8952-45ac-9daf-7a49ebc244ca	2026-07-21 07:30:34.411211+05:30
3f3f6bcc-b65a-4821-b43b-f14f84e36af6	6b6ee8ce-d11a-49b3-813d-f77321f3c909	5e7a435a-fc71-4169-a7d7-a0aa59c15e31	2026-07-21 07:30:34.411211+05:30
2e7d9a94-4459-4d1a-a6cf-e20f98625a39	b435ad2d-b175-4eee-996e-d4790beb4558	65af2bfb-41eb-4445-9162-04399f9304c6	2026-07-21 07:30:34.411211+05:30
380d9412-f77d-46b4-914b-d809128d91c2	cd3482fd-9acc-402b-a2d4-639de204472d	65af2bfb-41eb-4445-9162-04399f9304c6	2026-07-21 07:30:34.411211+05:30
5b701312-66ec-4b81-9c3f-5297bbbabdca	3b018ce7-c06b-4f40-ad4e-6d6d3b169c15	a4380039-15ec-4e81-8a2f-31e33c320ddd	2026-07-21 07:30:34.411211+05:30
eedc2309-1b61-47ca-afc6-f0c557126b14	e7637995-95c7-4dd4-8d7a-b6ec1b7d389b	a4380039-15ec-4e81-8a2f-31e33c320ddd	2026-07-21 07:30:34.411211+05:30
f4f32ad2-3b8a-4519-8680-743c80b22a7d	74008261-2704-4da5-bb75-3261c55e2015	a4380039-15ec-4e81-8a2f-31e33c320ddd	2026-07-21 07:30:34.411211+05:30
9309b5d0-05b3-46b2-8663-8f4549af0037	d97d5f3a-30e5-4eee-833b-470ba19ad14c	51044feb-481f-4fc7-ac99-0be56ba30120	2026-07-21 07:30:34.411211+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, full_name, employee_code, is_active, is_platform_admin, last_login_at, created_at, updated_at, deleted_at, created_by, updated_by, username) FROM stdin;
c41c0956-a56f-4e05-b81c-2c03ab5558cd	mindy@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Mindy	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	mindy@radiant.com
21bf8f52-8412-4e74-b4f8-14f708aa2884	elsie@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Elsie	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	elsie@radiant.com
4ec880df-0f5f-4543-a4f7-d138cf54983a	karen@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Karen	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	karen@radiant.com
12828d09-9ad4-4bcf-a873-8eba0e3d288e	snow@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Snow	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	snow@radiant.com
f72f287f-bd29-4f86-83ab-2893ea360f5e	selvam@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Selvam	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	selvam@radiant.com
8d9f5a8d-b1b2-47ba-b84c-779bfdb1f94c	vilesh@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Vilesh	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	vilesh@radiant.com
4a90ebf5-7302-411c-9fe0-3d027e524e18	salina@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Salina	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	salina@radiant.com
15a30726-d34a-438f-82ee-a01e7796c18b	ianian@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Ianian	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	ianian@radiant.com
2d79155c-4149-4240-8542-c5cdaa68faee	summer@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Summer	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	summer@radiant.com
9d1c6641-ca2d-428d-8585-199ac1d10818	jessielu@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Jessie Lu	\N	t	f	\N	2026-07-21 07:17:05.141046+05:30	2026-07-21 07:17:05.141046+05:30	\N	\N	\N	jessielu@radiant.com
6e12df04-27f2-4ade-8d38-06e7e30545f4	savita@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Savita	\N	t	f	\N	2026-07-21 07:23:17.113733+05:30	2026-07-21 07:23:17.113733+05:30	\N	\N	\N	savita@radiant.com
457c53a2-bb81-470e-b961-8c52ca3f5a4e	shoaib@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Shoaib	\N	t	f	\N	2026-07-21 07:23:17.113733+05:30	2026-07-21 07:23:17.113733+05:30	\N	\N	\N	shoaib@radiant.com
6b62ee4b-f9b5-48cc-97ec-d417a18a8786	shiva@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Shiva	\N	t	f	\N	2026-07-21 07:23:17.113733+05:30	2026-07-21 07:23:17.113733+05:30	\N	\N	\N	shiva@radiant.com
5fdc8dfc-8087-45cb-b9f9-86c637daeb21	vinayak@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Vinayak	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	vinayak@radiant.com
ccd95d1c-990e-4bf6-b182-cdfcf985c3a4	anubhav@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Anubhav	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	anubhav@radiant.com
94f85a5e-7bb9-4967-b6cb-78e71242ee08	ankkit@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Ankkit	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	ankkit@radiant.com
92c057cc-abea-4852-80c8-b87e21d94f99	shashi@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Shashi	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	shashi@radiant.com
4d38e4ce-51e6-4299-a631-d4b50f6ced09	nilesh@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Nilesh	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	nilesh@radiant.com
7f520e97-c990-4ec2-8f6e-43192510d259	saritha@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Saritha	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	saritha@radiant.com
93c05dcc-cbfb-47b2-a231-82986553fbe9	shivam@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Shivam	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	shivam@radiant.com
ca366f4e-6eec-4daf-b625-ba561497eb97	magaeshwari@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Magaeshwari	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	magaeshwari@radiant.com
d2489888-fc92-4065-a2b4-ea5e114b9748	ghizlane@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Ghizlane	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	ghizlane@radiant.com
6b6ee8ce-d11a-49b3-813d-f77321f3c909	dushyant@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Dushyant	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	dushyant@radiant.com
b435ad2d-b175-4eee-996e-d4790beb4558	azhar@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Azhar	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	azhar@radiant.com
cd3482fd-9acc-402b-a2d4-639de204472d	shyam@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Shyam	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	shyam@radiant.com
3b018ce7-c06b-4f40-ad4e-6d6d3b169c15	bhavin@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Bhavin	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	bhavin@radiant.com
e7637995-95c7-4dd4-8d7a-b6ec1b7d389b	dalal@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Dalal	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	dalal@radiant.com
74008261-2704-4da5-bb75-3261c55e2015	aarti@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Aarti	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	aarti@radiant.com
41efa003-34e4-4667-8e96-95503d22a889	abhishek@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Abhishek	\N	t	f	2026-07-21 08:55:07.217+05:30	2026-07-21 07:34:42.404689+05:30	2026-07-21 08:55:07.218905+05:30	\N	\N	\N	abhishek@radiant.com
d97d5f3a-30e5-4eee-833b-470ba19ad14c	venessa@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Venessa	\N	t	f	\N	2026-07-21 07:30:34.411211+05:30	2026-07-21 07:30:34.411211+05:30	\N	\N	\N	venessa@radiant.com
8558f6fa-ebf6-45b3-baf6-b6c2c705faea	sachin@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Sachin	\N	t	f	\N	2026-07-21 07:34:42.404689+05:30	2026-07-21 07:34:42.404689+05:30	\N	\N	\N	sachin@radiant.com
36f4de66-4fee-49a0-aab6-ef046df181c9	harit@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Harit	\N	t	f	\N	2026-07-21 07:34:42.404689+05:30	2026-07-21 07:34:42.404689+05:30	\N	\N	\N	harit@radiant.com
9efa5419-6bbf-43be-84df-356dda997548	ali@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Ali	\N	t	f	\N	2026-07-21 07:34:42.404689+05:30	2026-07-21 07:34:42.404689+05:30	\N	\N	\N	ali@radiant.com
897a8844-01e3-4603-b569-908c48884345	tarang@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Tarang	\N	t	f	\N	2026-07-21 07:34:42.404689+05:30	2026-07-21 07:34:42.404689+05:30	\N	\N	\N	tarang@radiant.com
4913ef43-3f79-44ce-ab9e-0b3965491660	rakesh@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Rakesh	\N	t	f	\N	2026-07-21 08:15:56.364363+05:30	2026-07-21 08:15:56.364363+05:30	\N	\N	\N	rakesh@radiant.com
42e90d82-87d6-4cae-b31d-098e25730774	mona@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Mona	\N	t	f	2026-07-21 09:41:50.618+05:30	2026-07-21 07:17:05.141046+05:30	2026-07-21 09:41:50.624751+05:30	\N	\N	\N	mona@radiant.com
ce83209c-bd98-4930-8c55-b50b42c2385d	ganesh@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Ganesh	\N	t	f	2026-07-21 08:55:39.672+05:30	2026-07-21 07:56:34.482585+05:30	2026-07-21 08:55:39.674177+05:30	\N	\N	\N	ganesh@radiant.com
269753e8-9865-43eb-8e7f-cc28c5dc7011	urvil@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Urvil Anil Shah	\N	t	f	2026-07-21 09:38:07.226+05:30	2026-07-21 08:58:36.353597+05:30	2026-07-21 09:38:07.227567+05:30	\N	\N	\N	urvil@radiant.com
2b20594e-f5b5-4fb5-a6db-bb55a2711155	vinay@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Vinay Natrajan	\N	t	f	\N	2026-07-21 08:58:36.353597+05:30	2026-07-21 08:58:36.353597+05:30	\N	\N	\N	vinay@radiant.com
d05544a3-fdd1-4cfd-b20e-10c25b8eb9d8	meena@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Meena	\N	t	f	2026-07-21 09:12:52.62+05:30	2026-07-21 08:58:36.353597+05:30	2026-07-21 09:12:52.62074+05:30	\N	\N	\N	meena@radiant.com
e8fe5cb3-f253-4861-b900-1959b9e74182	pinkesh@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Pinkesh	\N	t	f	2026-07-21 09:18:23.296+05:30	2026-07-21 07:34:42.404689+05:30	2026-07-21 09:18:23.297381+05:30	\N	\N	\N	pinkesh@radiant.com
5a59123f-8a33-462c-a1bc-49efff8668f3	admin@radiant.com	$2b$12$9g3YvpIDmE2mWpmtvScxDOjQMpt9HAjbXljKst7YfTOunXXfZ58aK	System Administrator	\N	t	t	2026-07-21 09:23:41.615+05:30	2026-06-04 15:16:14.034493+05:30	2026-07-21 09:23:41.616052+05:30	\N	\N	\N	admin@radiant.com
247e9ebf-723d-4fae-9c4d-06c9f20335d4	keval@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Keval	\N	t	f	\N	2026-07-21 08:58:36.353597+05:30	2026-07-21 08:58:36.353597+05:30	\N	\N	\N	keval@radiant.com
ea679108-16c6-49e3-a166-667e8d0b109f	anushya@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Anushya	\N	t	f	2026-07-21 09:39:23.811+05:30	2026-07-21 08:58:36.353597+05:30	2026-07-21 09:39:23.813191+05:30	\N	\N	\N	anushya@radiant.com
47aa6d4f-2773-4f3b-989d-3bc5ee163ec5	abirami@radiant.com	$2b$12$senwKs/as3.rRjA7AkylA.BhpUJTyE32f.L2mPB60FyaZJ0qzcgwu	Abirami	\N	t	f	2026-07-21 09:40:39.203+05:30	2026-07-21 08:58:36.353597+05:30	2026-07-21 09:40:39.205013+05:30	\N	\N	\N	abirami@radiant.com
\.


--
-- Name: incoming_receipt_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.incoming_receipt_seq', 4, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 19, true);


--
-- Name: payment_request_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_request_seq', 89, true);


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
-- Name: password_reset_otps password_reset_otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_otps
    ADD CONSTRAINT password_reset_otps_pkey PRIMARY KEY (id);


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
-- Name: payment_request_messages pk_payment_request_messages; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_messages
    ADD CONSTRAINT pk_payment_request_messages PRIMARY KEY (id);


--
-- Name: payment_request_rejections pk_payment_request_rejections; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_rejections
    ADD CONSTRAINT pk_payment_request_rejections PRIMARY KEY (id);


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
-- Name: idx_password_reset_otps_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_otps_user ON public.password_reset_otps USING btree (user_id, expires_at);


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
-- Name: idx_prm_request_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prm_request_created_at ON public.payment_request_messages USING btree (payment_request_id, created_at);


--
-- Name: idx_prr_request_rejected_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prr_request_rejected_at ON public.payment_request_rejections USING btree (payment_request_id, rejected_at);


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
-- Name: uq_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_users_username ON public.users USING btree (username);


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
-- Name: countries countries_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id) ON DELETE SET NULL;


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
-- Name: payment_requests fk_payment_requests_legal_entity; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT fk_payment_requests_legal_entity FOREIGN KEY (legal_entity_id) REFERENCES public.legal_entities(id) ON DELETE RESTRICT;


--
-- Name: payment_requests fk_payment_requests_treasury_swift_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_requests
    ADD CONSTRAINT fk_payment_requests_treasury_swift_by FOREIGN KEY (treasury_swift_by) REFERENCES public.users(id) ON DELETE SET NULL;


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
-- Name: payment_request_messages fk_prm_payment_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_messages
    ADD CONSTRAINT fk_prm_payment_request FOREIGN KEY (payment_request_id) REFERENCES public.payment_requests(id) ON DELETE CASCADE;


--
-- Name: payment_request_messages fk_prm_recipient; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_messages
    ADD CONSTRAINT fk_prm_recipient FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_request_messages fk_prm_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_messages
    ADD CONSTRAINT fk_prm_sender FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payment_request_rejections fk_prr_payment_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_rejections
    ADD CONSTRAINT fk_prr_payment_request FOREIGN KEY (payment_request_id) REFERENCES public.payment_requests(id) ON DELETE CASCADE;


--
-- Name: payment_request_rejections fk_prr_rejected_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_request_rejections
    ADD CONSTRAINT fk_prr_rejected_by FOREIGN KEY (rejected_by) REFERENCES public.users(id) ON DELETE SET NULL;


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
-- Name: password_reset_otps password_reset_otps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_otps
    ADD CONSTRAINT password_reset_otps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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

\unrestrict nMS5lJESGKpHl1TGGGaqPoYQcPlWgxncDVcoW0N8QSMGeBg5yjdfm0oTjSk7GHZ

