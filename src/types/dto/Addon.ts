import { Pagination, Addon, ADDON_TYPE, Metadata, Price, Entitlement } from '@/models';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';
import { QueryFilter, TimeRangeFilter } from './base';
import { FilterCondition } from '../common/QueryBuilder';
import { SortOption } from '../common/QueryBuilder';
import { LineItemCommitmentsMap } from './LineItemCommitmentConfig';

export interface ExtendedAddon extends Addon {
	prices: Price[];
	entitlements: Entitlement[];
}

export interface CreateAddonRequest {
	name: string;
	lookup_key: string;
	description?: string;
	type: ADDON_TYPE;
	metadata?: Metadata;
}

export interface AddonResponse extends Addon {
	prices: Price[];
	entitlements: Entitlement[];
}

export interface UpdateAddonRequest {
	name?: string;
	description?: string;
	metadata?: Metadata;
}

export interface AddAddonToSubscriptionRequest {
	addon_id: string;
	start_date?: string;
	end_date?: string;
	metadata?: Metadata;
	line_item_commitments?: LineItemCommitmentsMap;
}

export interface GetAddonsPayload {
	end_time?: string;
	expand?: string;
	addon_ids?: string[];
	limit?: number;
	lookup_key?: string;
	offset?: number;
	order?: string;
	sort?: string;
	start_time?: string;
	status?: string;
	addon_type?: ADDON_TYPE;
	lookup_keys?: string[];
}

export interface GetAddonsResponse extends Pagination {
	items: AddonResponse[];
	pagination: Pagination;
}

export interface GetAddonByFilterPayload extends Pagination {
	filters: TypedBackendFilter[];
	sort: TypedBackendSort[];
}

export interface AddonFilter extends QueryFilter, TimeRangeFilter {
	filters?: FilterCondition[];
	sort?: SortOption[];
	addon_ids?: string[];
	addon_type?: ADDON_TYPE;
	lookup_keys?: string[];
}
