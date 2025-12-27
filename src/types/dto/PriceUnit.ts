import { PriceUnit, Pagination, Metadata } from '@/models';
import { QueryFilter, TimeRangeFilter } from './base';
import { TypedBackendFilter, TypedBackendSort } from '../formatters/QueryBuilder';

// ============================================
// PriceUnit Request Types
// ============================================

export interface CreatePriceUnitRequest {
	name: string;
	code: string;
	symbol: string;
	base_currency: string;
	conversion_rate: string;
	metadata?: Metadata;
}

export interface UpdatePriceUnitRequest {
	name?: string;
	metadata?: Metadata;
}

// ============================================
// PriceUnit Response Types
// ============================================

export type PriceUnitResponse = PriceUnit;

export type CreatePriceUnitResponse = PriceUnit;

export interface ListPriceUnitsResponse {
	items: PriceUnitResponse[];
	pagination: Pagination;
}

// ============================================
// PriceUnit Filter Types
// ============================================

export interface PriceUnitFilter extends QueryFilter, TimeRangeFilter {
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
	price_unit_ids?: string[];
}
