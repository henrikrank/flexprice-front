import {
	BaseModel,
	Metadata,
	Pagination,
	WALLET_TRANSACTION_REASON,
	WALLET_STATUS,
	WALLET_TYPE,
	WALLET_CONFIG_PRICE_TYPE,
	WalletTransaction,
} from '@/models';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';

export interface WalletConfig {
	allowed_price_types: WALLET_CONFIG_PRICE_TYPE[];
}

export interface WalletTransactionResponse {
	items: WalletTransaction[];
	pagination: Pagination;
}

export interface CreateWalletPayload {
	customer_id?: string;
	external_customer_id?: string;
	currency: string;
	description?: string;
	metadata?: Metadata;
	wallet_type?: WALLET_TYPE;
	config?: WalletConfig;
	conversion_rate?: number;
	topup_conversion_rate?: number;
	initial_credits_to_load?: number;
	initial_credits_to_load_expiry_date?: number; // YYYYMMDD format
	initial_credits_expiry_date_utc?: string; // ISO string
	alert_enabled?: boolean;
	alert_config?: {
		threshold: {
			type: 'amount' | 'percentage';
			value: string;
		};
	};
	auto_topup?: {
		enabled: boolean;
		threshold: string;
		amount: string;
		invoicing: boolean;
	};
	price_unit?: string;
}

export interface TopupWalletPayload {
	credits_to_add: number;
	amount?: number; // amount in currency (alternative to credits_to_add)
	walletId: string;
	description?: string;
	priority?: number;
	expiry_date?: number; // YYYYMMDD format
	expiry_date_utc?: string; // ISO string
	metadata?: Record<string, any>;
	idempotency_key?: string;
	transaction_reason: WALLET_TRANSACTION_REASON;
}

export interface DebitWalletPayload {
	credits: number;
	walletId: string;
	idempotency_key: string;
	transaction_reason: WALLET_TRANSACTION_REASON;
}

export interface WalletTransactionPayload extends Pagination {
	walletId: string;
}

export interface GetCustomerWalletsPayload {
	id?: string;
	lookup_key?: string;
	include_real_time_balance?: boolean;
}

export interface UpdateWalletRequest {
	name?: string;
	description?: string;
	metadata?: Metadata;
	config?: WalletConfig;
	auto_topup?: {
		enabled: boolean;
		threshold: string;
		amount: string;
		invoicing: boolean;
	};
	alert_enabled?: boolean;
	alert_config?: {
		threshold: {
			type: 'amount' | 'percentage';
			value: string;
		};
	};
}

export interface WalletResponse {
	id: string;
	customer_id: string;
	name: string;
	currency: string;
	description: string;
	balance: string;
	credit_balance: string;
	wallet_status: WALLET_STATUS;
	metadata: Metadata;
	auto_topup?: {
		enabled: boolean;
		threshold: string;
		amount: string;
		invoicing: boolean;
	};
	wallet_type: WALLET_TYPE;
	config: {
		allowed_price_types: WALLET_CONFIG_PRICE_TYPE[];
	};
	conversion_rate: string;
	topup_conversion_rate?: string;
	created_at: string;
	updated_at: string;
	alert_enabled?: boolean;
	alert_config?: {
		threshold: {
			type: 'amount' | 'percentage';
			value: string;
		};
	};
}

export interface GetCustomerWalletsResponse extends BaseModel {
	auto_topup?: {
		enabled: boolean;
		threshold: string;
		amount: string;
		invoicing: boolean;
	};
	balance: number;
	config: {
		allowed_price_types: WALLET_CONFIG_PRICE_TYPE[];
	};
	conversion_rate: number;
	topup_conversion_rate?: number;
	credit_balance: number;
	currency: string;
	customer_id: string;
	description: string;
	metadata: Record<string, any>;
	name: string;
	wallet_status: WALLET_STATUS;
	wallet_type: WALLET_TYPE;
	alert_enabled?: boolean;
	alert_config?: {
		threshold: {
			type: 'amount' | 'percentage';
			value: string;
		};
	};
}

export interface GetWalletTransactionsByFilterPayload extends Pagination {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	expand?: string;
}

export interface ListWalletsPayload {
	customer_id?: string;
	currency?: string;
	wallet_status?: WALLET_STATUS;
	limit?: number;
	offset?: number;
	sort?: string;
	order?: string;
}

export interface ListWalletsByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
	expand?: string;
}

export interface ListWalletsPayload {
	customer_id?: string;
	currency?: string;
	wallet_status?: WALLET_STATUS;
	limit?: number;
	offset?: number;
	sort?: string;
	order?: string;
}

export interface ListWalletsByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
	expand?: string;
}
export interface ListWalletsResponse {
	items: WalletResponse[];
	pagination: Pagination;
}

// ManualBalanceDebitRequest represents a request to debit credits from a wallet
export interface ManualBalanceDebitRequest {
	credits: number;
	transaction_reason: WALLET_TRANSACTION_REASON;
	idempotency_key: string;
	description?: string;
	metadata?: Metadata;
}
