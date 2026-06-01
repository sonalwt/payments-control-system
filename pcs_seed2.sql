SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
COPY public.countries (id, country_name, country_short_name, code, currency_id, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_sanctioned) FROM stdin;
2d4054ef-f857-4191-92ec-e316b8630a65	INDIA	IND	IN	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	t	2026-05-28 12:06:08.098397+05:30	2026-05-28 12:06:08.098397+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	f
177f2b9e-8e65-4be5-afce-5474e63e17af	Iran	IR	IRN	9cd9c270-6608-4c47-bdde-fab9d950673e	t	2026-05-28 17:19:37.36539+05:30	2026-05-28 17:19:37.36539+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	t
\.

COPY public.account_types (id, name, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
bd44575d-7c7d-44be-88bb-33a41cd757db	Current	t	2026-05-28 08:57:38.562382+05:30	2026-05-28 08:57:38.562382+05:30	\N	\N	\N
a46ce9b0-80ba-4192-8ac6-c984366dec89	Savings	t	2026-05-28 08:57:38.562382+05:30	2026-05-28 08:57:38.562382+05:30	\N	\N	\N
ac939c85-1298-4c4f-8bb9-2999ccba4a75	Deposit	t	2026-05-28 08:57:38.562382+05:30	2026-05-28 08:57:38.562382+05:30	\N	\N	\N
91caa7d2-54ae-42ac-a3f3-6572555c5461	Collateral	t	2026-05-28 08:57:38.562382+05:30	2026-05-28 08:57:38.562382+05:30	\N	\N	\N
\.

COPY public.employees (id, employee_code, full_name, work_email, country_of_employment_id, start_date, end_date, national_id, tax_identifier, date_of_birth, mobile_number, address, compensation_band, is_active, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
f147d3c7-61fa-4c8e-af4a-8d487551c3e3	EMP-oo1	Jane Doe	jane.doe@radient.com	2d4054ef-f857-4191-92ec-e316b8630a65	2026-05-25	2026-05-27	12343r4	test	2026-05-28	9119505008	testing	B1	t	2026-05-28 12:23:06.474581+05:30	2026-05-28 16:24:59.742965+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66
\.

COPY public.banks (id, name, short_name, country_id, swift_bic, is_active, created_at, updated_at, deleted_at, created_by, updated_by, is_counterparty) FROM stdin;
84a3c9fb-d098-4b4c-be70-ed354e034208	HDFC Bank	HDFC- CP sales	2d4054ef-f857-4191-92ec-e316b8630a65	HDFCIN11122	t	2026-05-28 14:39:12.619745+05:30	2026-05-28 14:39:12.619745+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	t
e1c9cb02-fbc7-46df-828e-27bb293b7d45	HDFC Bank	HDFC	2d4054ef-f857-4191-92ec-e316b8630a65	HDFC0002805	t	2026-05-28 12:17:59.227756+05:30	2026-05-28 15:04:49.045828+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	f
\.

COPY public.counterparties (id, code, name, legal_name, role, country_id, country_code, tax_identifiers, addresses, primary_contact_name, primary_contact_email, primary_contact_phone, notes, is_active, created_at, updated_at, deleted_at, created_by, updated_by, kyc_done) FROM stdin;
a0386cbb-1da6-4021-a6be-16b2746c1d9a	KOSMOS	Kosmos Resources	Kosmos 	VENDOR	2d4054ef-f857-4191-92ec-e316b8630a65	\N	[]	[]	Sonal Tamboli	sonal@firsteconomy.com	9876543210	\N	t	2026-05-28 17:10:26.606448+05:30	2026-05-28 17:10:26.606448+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	f
\.

COPY public.bank_accounts (id, bank_id, bank_nickname, currency_id, account_type_id, account_number, branch_name, branch_code, opening_balance, minimum_balance, is_chairman_designated, is_active, created_at, updated_at, deleted_at, created_by, updated_by, bank_name, is_counterparty, remaining_balance, counterparty_id) FROM stdin;
d0b8c38c-5d01-412c-af86-a919d36b6b90	e1c9cb02-fbc7-46df-828e-27bb293b7d45	HDFC - Main Operating	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	bd44575d-7c7d-44be-88bb-33a41cd757db	50100123456789	Vidyavihar	HDFC0007811	1000000.0000	50000.0000	f	t	2026-05-28 12:20:36.743976+05:30	2026-05-29 14:18:13.028231+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	41b975e3-6fba-4363-a3fe-06e37c8b2f66	\N	f	75000.0000	\N
02f068cd-f0a5-4fe9-a027-051e14929346	84a3c9fb-d098-4b4c-be70-ed354e034208	HDFC - Main Operating	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	bd44575d-7c7d-44be-88bb-33a41cd757db	500003424242332434	Vidyavihar	HDFC0007811	10000000000.0000	50000.0000	f	t	2026-05-28 14:41:15.740312+05:30	2026-05-30 07:02:52.41568+05:30	\N	41b975e3-6fba-4363-a3fe-06e37c8b2f66	45a844e3-fd35-40d9-8633-4d15abf5ed9f	\N	t	0.0000	a0386cbb-1da6-4021-a6be-16b2746c1d9a
\.

COPY public.beneficiary_accounts (id, counterparty_id, employee_id, account_holder_name, account_number, bank_id, branch_name, swift_bic, iban, currency_id, country_id, account_direction, status, cooling_off_until, created_at, updated_at, deleted_at, created_by, updated_by) FROM stdin;
9e9e60cd-dba5-4b96-a2e5-0d07671cec86	a0386cbb-1da6-4021-a6be-16b2746c1d9a	\N	Kosmos Resources Ltd	50100412345678	84a3c9fb-d098-4b4c-be70-ed354e034208	Fort Branch	HDFCINBB	\N	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	2d4054ef-f857-4191-92ec-e316b8630a65	PAY_TO	ACTIVE	\N	2026-05-30 14:09:52.744267+05:30	2026-05-30 14:09:52.744267+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
2a7fb1ff-6397-4f2e-85c3-44d77617d2ba	a0386cbb-1da6-4021-a6be-16b2746c1d9a	\N	Kosmos Resources Ltd	AE070331234567890123456	e1c9cb02-fbc7-46df-828e-27bb293b7d45	Dubai Main	HDFCAEAD	AE070331234567890123456	7e1cf5ef-0fdc-437f-803e-065df5986651	2d4054ef-f857-4191-92ec-e316b8630a65	PAY_TO	ACTIVE	\N	2026-05-30 14:10:09.709827+05:30	2026-05-30 14:10:09.709827+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
7f2c071c-3b5c-4740-9ca2-370f88399b56	a0386cbb-1da6-4021-a6be-16b2746c1d9a	\N	Kosmos Resources Ltd	50100498765432	84a3c9fb-d098-4b4c-be70-ed354e034208	Nariman Point	HDFCINBB	\N	9cd9c270-6608-4c47-bdde-fab9d950673e	2d4054ef-f857-4191-92ec-e316b8630a65	BOTH	ACTIVE	\N	2026-05-30 14:10:17.171298+05:30	2026-05-30 14:10:17.171298+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
e40c6e2a-54af-495b-83c2-f408ced0899c	\N	f147d3c7-61fa-4c8e-af4a-8d487551c3e3	Jane Doe	50100455544332	84a3c9fb-d098-4b4c-be70-ed354e034208	Bandra Kurla Complex	HDFCINBB	\N	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	2d4054ef-f857-4191-92ec-e316b8630a65	PAY_TO	ACTIVE	\N	2026-05-30 14:10:25.97939+05:30	2026-05-30 14:10:25.97939+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
09989095-b878-4914-a245-87d9f7b0cd23	\N	f147d3c7-61fa-4c8e-af4a-8d487551c3e3	Jane Doe	AE190351111222333444555	e1c9cb02-fbc7-46df-828e-27bb293b7d45	DIFC Branch	HDFCAEAD	AE190351111222333444555	7e1cf5ef-0fdc-437f-803e-065df5986651	2d4054ef-f857-4191-92ec-e316b8630a65	PAY_TO	ACTIVE	\N	2026-05-30 14:10:33.292652+05:30	2026-05-30 14:10:33.292652+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
130e1d9b-9730-4754-9a35-de09da83abd7	a0386cbb-1da6-4021-a6be-16b2746c1d9a	\N	Kosmos Resources Ltd	50200012345678	e1c9cb02-fbc7-46df-828e-27bb293b7d45	Nariman Point Branch, Mumbai	HDFC0002805	\N	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	2d4054ef-f857-4191-92ec-e316b8630a65	PAY_TO	ACTIVE	\N	2026-05-30 15:36:23.021303+05:30	2026-05-30 15:36:23.021303+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
cda94e38-c9af-42aa-832d-00dc51149a64	a0386cbb-1da6-4021-a6be-16b2746c1d9a	\N	Kosmos Resources Ltd	50200087654321	e1c9cb02-fbc7-46df-828e-27bb293b7d45	Fort Branch, Mumbai	HDFC0002805	\N	9cd9c270-6608-4c47-bdde-fab9d950673e	2d4054ef-f857-4191-92ec-e316b8630a65	PAY_TO	ACTIVE	\N	2026-05-30 15:36:23.021303+05:30	2026-05-30 15:36:23.021303+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
3287a61d-6329-43bc-be31-f8a8a2c35760	\N	f147d3c7-61fa-4c8e-af4a-8d487551c3e3	Employee 001	50200011111111	e1c9cb02-fbc7-46df-828e-27bb293b7d45	Koramangala Branch, Bengaluru	HDFC0002805	\N	60d3e4b5-8c0d-456c-8eb6-60fbd19d46da	2d4054ef-f857-4191-92ec-e316b8630a65	PAY_TO	ACTIVE	\N	2026-05-30 15:36:23.021303+05:30	2026-05-30 15:36:23.021303+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
beadf117-f0ad-4654-a20c-5c6cf51f49a3	\N	f147d3c7-61fa-4c8e-af4a-8d487551c3e3	Employee 001	50200022222222	e1c9cb02-fbc7-46df-828e-27bb293b7d45	BKC Branch, Mumbai	HDFC0002805	\N	255fcd2e-8660-43b2-872f-00ea3aa81a39	2d4054ef-f857-4191-92ec-e316b8630a65	PAY_TO	ACTIVE	\N	2026-05-30 15:36:23.021303+05:30	2026-05-30 15:36:23.021303+05:30	\N	98fdb496-53fe-474c-8829-25e94569ab82	98fdb496-53fe-474c-8829-25e94569ab82
\.

