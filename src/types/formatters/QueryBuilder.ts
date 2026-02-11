import { SortDirection, SortOption } from '@/types/common/QueryBuilder';
import { FilterCondition, DataType, FilterOperator } from '../common/QueryBuilder';

// ============================================================================
// TYPE DEFINITIONS - Matches backend types exactly
// ============================================================================

/**
 * Backend filter operator - matches backend FilterOperatorType
 * Values: "eq", "contains", "not_contains", "gt", "lt", "in", "not_in", "before", "after"
 */
export type BackendFilterOperator = FilterOperator;

/**
 * Backend filter value - matches backend Value struct
 * Only one field should be set based on data_type
 */
export interface BackendFilterValue {
	string?: string;
	number?: number;
	boolean?: boolean;
	date?: string;
	array?: string[];
}

/**
 * Backend filter format - matches backend FilterCondition
 */
export interface TypedBackendFilter {
	field: string;
	operator: BackendFilterOperator;
	data_type: DataType;
	value: BackendFilterValue;
}

/**
 * Backend query payload with filters
 */
export interface TypedBackendQueryPayload {
	filters: TypedBackendFilter[];
}

/**
 * Backend sort format - matches backend SortCondition
 */
export interface TypedBackendSort {
	field: string;
	direction: SortDirection;
}

/**
 * Backend sort payload
 */
export interface TypedBackendSortPayload {
	sorts: TypedBackendSort[];
}

/**
 * Combined payload with filters and sorts
 */
export interface TypedBackendQueryWithSortPayload {
	filters: TypedBackendFilter[];
	sorts: TypedBackendSort[];
}

// ============================================================================
// VALIDATION & CONVERSION HELPERS
// ============================================================================

/**
 * Validates and converts a single filter condition to backend format
 * Returns null if validation fails (filter will be skipped)
 */
const convertFilterToBackend = (condition: FilterCondition): TypedBackendFilter | null => {
	// Validate required fields
	if (!condition.field?.trim() || !condition.operator || !condition.dataType) {
		return null;
	}

	// Validate operator is supported by backend
	if (!Object.values(FilterOperator).includes(condition.operator)) {
		console.warn(`Unsupported filter operator: ${condition.operator}. Skipping filter.`);
		return null;
	}

	// Validate data type
	if (!Object.values(DataType).includes(condition.dataType)) {
		console.warn(`Invalid data type: ${condition.dataType}. Skipping filter.`);
		return null;
	}

	// Extract and validate value based on data type
	let value: BackendFilterValue | null = null;

	try {
		switch (condition.dataType) {
			case DataType.STRING: {
				const stringValue = condition.valueString?.trim();
				if (stringValue) {
					value = { string: stringValue };
				}
				break;
			}
			case DataType.NUMBER: {
				// INPUT fields often set only valueString; parse it when valueNumber is missing
				const num =
					typeof condition.valueNumber === 'number' && Number.isFinite(condition.valueNumber)
						? condition.valueNumber
						: condition.valueString != null && condition.valueString.trim() !== ''
							? parseFloat(condition.valueString.trim())
							: NaN;
				if (!Number.isNaN(num) && isFinite(num)) {
					value = { number: num };
				}
				break;
			}
			case DataType.DATE: {
				const date = condition.valueDate;
				if (date instanceof Date && !isNaN(date.getTime())) {
					value = { date: date.toISOString() };
				}
				break;
			}
			case DataType.ARRAY: {
				if (Array.isArray(condition.valueArray) && condition.valueArray.length > 0) {
					// Filter out non-string items
					const validArray = condition.valueArray.filter((item): item is string => typeof item === 'string');
					if (validArray.length > 0) {
						value = { array: validArray };
					}
				}
				break;
			}
		}
	} catch (error) {
		console.error('Error processing filter value:', error, condition);
		return null;
	}

	// Return null if value validation failed
	if (!value) {
		return null;
	}

	// Return valid backend filter
	return {
		field: condition.field.trim(),
		operator: condition.operator,
		data_type: condition.dataType,
		value,
	};
};

// ============================================================================
// PUBLIC API - Filter Sanitization
// ============================================================================

/**
 * Sanitizes filter conditions - validates and converts to backend format
 * Invalid filters are silently skipped with console warnings
 */
export const sanitizeFilterConditions = (conditions: FilterCondition[]): TypedBackendFilter[] => {
	if (!Array.isArray(conditions)) {
		console.warn('sanitizeFilterConditions: expected array, got', typeof conditions);
		return [];
	}

	return conditions.map(convertFilterToBackend).filter((f): f is TypedBackendFilter => f !== null);
};

/**
 * Converts filter conditions to backend query payload
 */
export const convertFilterConditionToQuery = (conditions: FilterCondition[]): TypedBackendQueryPayload => {
	return { filters: sanitizeFilterConditions(conditions) };
};

// ============================================================================
// PUBLIC API - Sort Sanitization
// ============================================================================

/**
 * Sanitizes sort conditions - validates and converts to backend format
 */
export const sanitizeSortConditions = (conditions: SortOption[]): TypedBackendSort[] => {
	if (!Array.isArray(conditions)) {
		console.warn('sanitizeSortConditions: expected array, got', typeof conditions);
		return [];
	}

	return conditions
		.filter((sort) => typeof sort?.field === 'string' && sort.field.trim() !== '')
		.map((sort) => ({
			field: sort.field.trim(),
			direction: [SortDirection.ASC, SortDirection.DESC].includes(sort.direction || SortDirection.ASC)
				? sort.direction || SortDirection.ASC
				: SortDirection.ASC,
		}));
};

/**
 * Converts sort options to backend sort payload
 */
export const convertSortOptionsToQuery = (sortOptions: SortOption[]): TypedBackendSortPayload => {
	return { sorts: sanitizeSortConditions(sortOptions) };
};

// ============================================================================
// PUBLIC API - Combined Filters & Sorts
// ============================================================================

/**
 * Converts filters and sorts to combined backend payload
 * Single function for convenience when both are needed
 */
export const convertFiltersAndSortToBackendPayload = (
	filters: FilterCondition[],
	sortOptions: SortOption[],
): TypedBackendQueryWithSortPayload => {
	return {
		filters: sanitizeFilterConditions(filters),
		sorts: sanitizeSortConditions(sortOptions),
	};
};
