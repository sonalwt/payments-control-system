# Payments Control System — Master Data & Sample Transactions

_Generated from the current database._

## Summary

| Master | Records |
|---|---|
| currencies | 11 |
| countries | 14 |
| legal_entities | 13 |
| employees | 8 |
| banks | 17 |
| account_types | 7 |
| counterparties | 8 |
| beneficiary_accounts | 13 |
| bank_accounts | 29 |
| payment_requests | 3 |
| incoming_receipts | 1 |

## Currencies

- **AED** — UAE Dirham
- **CHF** — Swiss Franc
- **CNH** — Chinese Yuan (Offshore)
- **EUR** — Euro
- **GBP** — Pound Sterling
- **HKD** — Hong Kong Dollar
- **INR** — Indian Rupee
- **MUR** — Mauritian Rupee
- **SGD** — Singapore Dollar
- **USD** — US Dollar
- **ZAR** — South African Rand

## Countries

| Code | Country | Currency |
|---|---|---|
| AT | Austria | EUR |
| CN | China | CNH |
| FR | France | EUR |
| DE | Germany | EUR |
| HK | Hong Kong | HKD |
| IN | India | INR |
| MU | Mauritius | MUR |
| NL | Netherlands | EUR |
| SG | Singapore | SGD |
| ZA | South Africa | ZAR |
| CH | Switzerland | CHF |
| AE | United Arab Emirates | AED |
| GB | United Kingdom | GBP |
| US | United States | USD |

## Legal Entities

| Code | Name | Country |
|---|---|---|
| RAWSTEEL-SG | Rawsteel Minmetals Pte Ltd | SG |
| RGL-HK | RGL COMPANY LIMITED | HK |
| RLT-SG | Royalline Trading Pte Ltd | SG |
| RWCAP-SG | Radiant World Capital Pte Ltd | SG |
| RWCOMM-CH | RADIANT WORLD COMMODITIES S.A. | CH |
| RWCOMM-DMCC | RADIANT WORLD COMMODITIES S.A. -DMCC | AE |
| RWCOMM-US | Radiant World Commodities USA LLC | US |
| RWCORP-CH | Radiant World Corporation S.A. | CH |
| RWCORP-SG | Radiant World Corporation Pte Ltd | SG |
| RWCORP-UK | Radiant World Corporation (UK) Limited | GB |
| RWCORP-US | Radiant World Corporation USA LLC | US |
| RWGHC-HK | Radiant World Group Holding Company Limited | HK |
| RWINV-UK | RADIANT WORLD INVESTMENT UK LTD | GB |

## Banks

| Bank | Short | SWIFT | Country |
|---|---|---|---|
| Arab Bank Switzerland Ltd | Arab Bank CH | ARBSCHZZ | CH |
| BCGE Bank | BCGE | BCGECHGGXXX | CH |
| Deutsche Bank AG | Deutsche Bank | DEUTSGSG | SG |
| Garanti Bank | Garanti | UGBINL2A | NL |
| HSBC | HSBC | HSBCSGSG | SG |
| Intesa Sanpaolo | Intesa | BCITISGSGXXX | SG |
| MCB - The Mauritius Commercial Bank Ltd | MCB | MCBLMUMU | MU |
| Mizuho Bank Ltd | Mizuho | MHCBSGSG | SG |
| NEXENT BANK | Nexent | FSUICHGG | CH |
| QNB | QNB | QNBASGSG | SG |
| RBI Raiffeisen Bank International AG | Raiffeisen | RZBAATWW | AT |
| Societe Generale | SocGen | SGBACHZZ | CH |
| TradeX Bank AG | TradeX | TXBZCHZZ | CH |
| Triland Metals Limited | Triland |  | GB |
| UCO Bank | UCO | UCBASGSGXXX | SG |
| UOB Bank | UOB | UOVBSGSG | SG |
| Valley Bank | Valley | MBNYUS33 | US |

## Account Types

- Business Current Account
- Call Account
- Current Account
- Fixed Deposit
- Interest Account
- Nostro Account
- Savings Account

## Bank Accounts (group-own)

| Legal entity | Bank | Account # | Cur | Type | Balance | Min | SWIFT | Correspondent |
|---|---|---|---|---|---|---|---|---|
| Radiant World Corporation Pte Ltd | Arab Bank Switzerland Ltd | CH9808719107221120003 | CHF | Current Account | 2,400,000 | 25,000 | ARBSCHZZ |  |
| Radiant World Corporation Pte Ltd | Arab Bank Switzerland Ltd | CH28087191072211200002 | USD | Current Account | 3,100,000 | 50,000 | ARBSCHZZ |  |
| Radiant World Corporation Pte Ltd | BCGE Bank | CH700788000050725102 | CHF | Current Account | 1,900,000 | 50,000 | BCGECHGGXXX |  |
| Radiant World Corporation Pte Ltd | BCGE Bank | CH9200788000050691465 | USD | Current Account | 1,199,000 | 25,000 | BCGECHGGXXX |  |
| Radiant World Corporation Pte Ltd | Deutsche Bank AG | 2025682-048 | CNH | Current Account | 1,800,000 | 75,000 | DEUTSGSG | Deutsche Bank AG, New York (DEUTUS33) |
| Radiant World Corporation Pte Ltd | Deutsche Bank AG | 2025682-050 | USD | Current Account | 400,000 | 25,000 | DEUTSGSG | Deutsche Bank AG, New York (DEUTUS33) |
| Radiant World Corporation Pte Ltd | Deutsche Bank AG | 2025682-051 | USD | Current Account | 1,100,000 | 50,000 | DEUTSGSG | Deutsche Bank AG, New York (DEUTUS33) |
| Radiant World Corporation Pte Ltd | Garanti Bank | NL11UGBI5000147790 | EUR | Current Account | 1,000,000 | 75,000 | UGBINL2A |  |
| Radiant World Corporation Pte Ltd | Garanti Bank | NL67UGBI8263429609 | GBP | Call Account | 1,700,000 | 100,000 | UGBINL2A |  (CITIUS33) |
| Radiant World Corporation Pte Ltd | Intesa Sanpaolo | SS484-001-0001 | USD | Current Account | 2,592,500 | 75,000 | BCITISGSGXXX |  (CHASUS33XXX) |
| Radiant World Corporation Pte Ltd | Mizuho Bank Ltd | F10 749 409646 | USD | Current Account | 4,000,000 | 25,000 | MHCBSGSG |  |
| Radiant World Corporation Pte Ltd | Mizuho Bank Ltd | F10 749 409476 | USD | Call Account | 3,300,000 | 100,000 | MHCBSGSG |  |
| Radiant World Corporation Pte Ltd | TradeX Bank AG | CH4708825116524462002 | CHF | Current Account | 3,800,000 | 75,000 | TXBZCHZZ |  |
| Radiant World Corporation Pte Ltd | TradeX Bank AG | CH7708825116524462002 | USD | Call Account | 500,000 | 100,000 | TXBZCHZZ |  |
| Royalline Trading Pte Ltd | HSBC | 142-864438-001 | SGD | Current Account | 2,200,000 | 75,000 | HSBCSGSG |  (MRMDUS33) |
| Royalline Trading Pte Ltd | HSBC | 261-014997-178 | SGD | Current Account | 1,500,000 | 50,000 | HSBCSGSG |  (MRMDUS33) |
| Royalline Trading Pte Ltd | MCB - The Mauritius Commercial Bank Ltd | 000455783632 | USD | Current Account | 800,000 | 25,000 | MCBLMUMU |  |
| Royalline Trading Pte Ltd | NEXENT BANK | 711000460 | CHF | Current Account | 3,900,000 | 50,000 | FSUICHGG |  (IRVTUS3NXXX) |
| Royalline Trading Pte Ltd | NEXENT BANK | 711000457 | USD | Current Account | 3,200,000 | 25,000 | FSUICHGG |  (IRVTUS3NXXX) |
| Royalline Trading Pte Ltd | QNB | 5305-001172-002 | SGD | Current Account | 3,400,000 | 75,000 | QNBASGSG | JP Morgan Chase Bank, New York, USA (CHASUS33XXX) |
| Royalline Trading Pte Ltd | QNB | 5305001172001 | USD | Current Account | 2,700,000 | 50,000 | QNBASGSG | JP Morgan Chase Bank, New York, USA (CHASUS33XXX) |
| Royalline Trading Pte Ltd | RBI Raiffeisen Bank International AG | 070-56.909.047 | USD | Call Account | 100,000 | 100,000 | RZBAATWW |  (SCBLUS33XXX) |
| Royalline Trading Pte Ltd | Societe Generale | 08705999102825600 | USD | Current Account | 600,000 | 75,000 | SGBACHZZ |  (SOGEUS33XXX) |
| Royalline Trading Pte Ltd | Triland Metals Limited | 53650 | USD | Call Account | 2,500,000 | 100,000 |  |  |
| Royalline Trading Pte Ltd | UCO Bank | 103702104200S5 | SGD | Current Account | 2,000,000 | 25,000 | UCBASGSGXXX | Standard Chartered Bank, New York, USA (SCBLUS33XXX) |
| Royalline Trading Pte Ltd | UCO Bank | 303702108200S6 | USD | Call Account | 1,300,000 | 100,000 | UCBASGSGXXX | Standard Chartered Bank, New York, USA (SCBLUS33XXX) |
| Royalline Trading Pte Ltd | UOB Bank | 7703284039 | SGD | Current Account | 300,000 | 50,000 | UOVBSGSG |  (IRVTUS3NXXX) |
| Royalline Trading Pte Ltd | UOB Bank | 7739938108 | USD | Current Account | 3,600,000 | 25,000 | UOVBSGSG |  (IRVTUS3NXXX) |
| Royalline Trading Pte Ltd | Valley Bank | 1853293493 | USD | Call Account | 2,900,000 | 100,000 | MBNYUS33 |  |

## Counterparties

| Code | Name | Role | Country | Contact |
|---|---|---|---|---|
| CP-001 | Acme Supplies Pvt Ltd | VENDOR | IN | Ramesh Iyer <ramesh@acmesupplies.in> |
| CP-002 | Asia Metals Pte Ltd | CUSTOMER | SG | Lim Wei <lim.wei@asiametals.sg> |
| CP-003 | Britannia Logistics Ltd | VENDOR | GB | Oliver Hughes <oliver@britannialog.co.uk> |
| CP-004 | Gulf Trade Partners LLC | BOTH | AE | Khalid Hassan <khalid@gulftrade.ae> |
| CP-005 | Helvetia Trade Finance AG | VENDOR | CH | Anna Keller <anna.keller@helvetiatf.ch> |
| CP-006 | Meridian Commodities Inc | CUSTOMER | US | Sarah Johnson <sarah@meridiancomm.com> |
| CP-007 | Shenzhen Hardware Co Ltd | VENDOR | CN | Zhang Wei <zhang.wei@szhardware.cn> |
| CP-008 | Royal Crescent Trading FZE | BOTH | AE | Fatima Noor <fatima@royalcrescent.ae> |

## Beneficiary Accounts

| Owner | Holder | Account # | Cur | Direction | Status | Bank |
|---|---|---|---|---|---|---|
| Counterparty | Acme Supplies Pvt Ltd | BEN1000000 | INR | PAY_TO | ACTIVE | Arab Bank Switzerland Ltd |
| Counterparty | Asia Metals Pte Ltd | BEN1000037 | SGD | RECEIVE_FROM | ACTIVE | BCGE Bank |
| Counterparty | Britannia Logistics Ltd | BEN1000074 | GBP | PAY_TO | ACTIVE | Deutsche Bank AG |
| Counterparty | Gulf Trade Partners LLC | BEN1000111 | AED | BOTH | ACTIVE | Garanti Bank |
| Counterparty | Helvetia Trade Finance AG | BEN1000148 | CHF | PAY_TO | ACTIVE | HSBC |
| Counterparty | Meridian Commodities Inc | BEN1000185 | USD | RECEIVE_FROM | ACTIVE | Intesa Sanpaolo |
| Counterparty | Royal Crescent Trading FZE | BEN1000259 | AED | BOTH | ACTIVE | Mizuho Bank Ltd |
| Counterparty | Shenzhen Hardware Co Ltd | BEN1000222 | CNH | PAY_TO | ACTIVE | MCB - The Mauritius Commercial Bank Ltd |
| Employee | Ahmed Al-Farsi | EMP2000106 | AED | PAY_TO | ACTIVE | Intesa Sanpaolo |
| Employee | James Carter | EMP2000053 | GBP | PAY_TO | ACTIVE | HSBC |
| Employee | Olivia Brown | EMP2000159 | USD | PAY_TO | ACTIVE | MCB - The Mauritius Commercial Bank Ltd |
| Employee | Sonal Tamboli | 0291234567 | SGD | PAY_TO | ACTIVE | HSBC |
| Employee | Wei Chen | EMP2000000 | SGD | PAY_TO | ACTIVE | Garanti Bank |

## Payment Requests

| Request | Type | Amount | Cur | Status | Source account |
|---|---|---|---|---|---|
| PR-2026-00074 | REIMBURSEMENT | 1,000 | SGD | PENDING_APPROVAL |   |
| PR-2026-00073 | CHAIRMAN_PAYMENTS | 1,000 | USD | COMPLETED | BCGE Bank CH9200788000050691465 |
| PR-2026-00072 | TRADE_PAYMENT | 7,500 | USD | COMPLETED | Intesa Sanpaolo SS484-001-0001 |

## Incoming Receipts

| Receipt | Legal entity | Counterparty | Receive into | Expected | Status |
|---|---|---|---|---|---|
| IR-2026-0001 | Radiant World Corporation Pte Ltd | Asia Metals Pte Ltd | Intesa Sanpaolo SS484-001-0001 | USD 7,500 | AWAITING_RECEIPT |

> **IR-2026-0001** — Expected trade settlement — same account as TRADE_PAYMENT PR-2026-00072
