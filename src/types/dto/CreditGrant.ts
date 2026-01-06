import {
	CreditGrant,
	Pagination,
	CREDIT_GRANT_CADENCE,
	CREDIT_GRANT_PERIOD,
	CREDIT_GRANT_EXPIRATION_TYPE,
	CREDIT_GRANT_PERIOD_UNIT,
	CREDIT_SCOPE,
	Metadata,
} from '@/models';
import { QueryFilter, TimeRangeFilter } from './base';

// ============================================
// Credit Grant Request Types
// ============================================

export interface CreateCreditGrantRequest {
	name: string;
	scope: CREDIT_SCOPE;
	plan_id?: string;
	subscription_id?: string;
	credits: number;
	cadence: CREDIT_GRANT_CADENCE;
	period?: CREDIT_GRANT_PERIOD;
	period_count?: number;
	expiration_type?: CREDIT_GRANT_EXPIRATION_TYPE;
	expiration_duration?: number;
	expiration_duration_unit?: CREDIT_GRANT_PERIOD_UNIT;
	priority?: number;
	metadata?: Metadata;
	conversion_rate?: number;
	topup_conversion_rate?: number;
}

export interface UpdateCreditGrantRequest {
	name?: string;
	metadata?: Metadata;
}

// ============================================
// Internal Credit Grant Request Types
// ============================================

/**
 * InternalCreditGrantRequest extends CreateCreditGrantRequest with an id field
 * This makes it easier to handle edit and delete operations in the UI
 */
export interface InternalCreditGrantRequest extends CreateCreditGrantRequest {
	id: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Converts a CreditGrant (from API response) to InternalCreditGrantRequest
 */
export const creditGrantToInternal = (grant: CreditGrant): InternalCreditGrantRequest => {
	return {
		id: grant.id,
		name: grant.name,
		scope: grant.scope,
		plan_id: grant.plan_id,
		subscription_id: grant.subscription_id,
		credits: grant.credits,
		cadence: grant.cadence,
		period: grant.period,
		period_count: grant.period_count,
		expiration_type: grant.expiration_type,
		expiration_duration: grant.expiration_duration,
		expiration_duration_unit: grant.expiration_duration_unit,
		priority: grant.priority,
		metadata: grant.metadata,
		conversion_rate: grant.conversion_rate,
		topup_conversion_rate: grant.topup_conversion_rate,
	};
};

/**
 * Converts an InternalCreditGrantRequest to CreateCreditGrantRequest (removes id)
 */
export const internalToCreateRequest = (internal: InternalCreditGrantRequest): CreateCreditGrantRequest => {
	const { id, ...createRequest } = internal;
	return createRequest;
};

// ============================================
// Credit Grant Response Types
// ============================================

export type CreditGrantResponse = CreditGrant;

export interface ListCreditGrantsResponse extends Pagination {
	items: CreditGrantResponse[];
}

export interface GetCreditGrantsResponse extends Pagination {
	items: CreditGrant[];
}

export interface GetCreditGrantsRequest extends QueryFilter, TimeRangeFilter {
	subscription_ids?: string[];
	plan_ids?: string[];
}

export interface ProcessScheduledCreditGrantApplicationsResponse {
	success_applications_count: number;
	failed_applications_count: number;
	total_applications_count: number;
}
