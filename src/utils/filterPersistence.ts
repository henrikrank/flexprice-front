import type { FilterCondition, SortOption } from '@/types/common/QueryBuilder';

/** FilterCondition with valueDate as ISO string for JSON serialization */
type SerializedFilterCondition = Omit<FilterCondition, 'valueDate'> & { valueDate?: string };

/**
 * Serialize filter conditions to a URL-safe JSON string (Date -> ISO string).
 */
export function serializeFilters(filters: FilterCondition[]): string {
	if (!filters?.length) return '';
	const serialized: SerializedFilterCondition[] = filters.map((f) => ({
		id: f.id,
		field: f.field,
		operator: f.operator,
		dataType: f.dataType,
		valueString: f.valueString,
		valueNumber: f.valueNumber,
		valueArray: f.valueArray,
		valueDate: f.valueDate instanceof Date ? f.valueDate.toISOString() : undefined,
		valueBoolean: f.valueBoolean,
	}));
	return JSON.stringify(serialized);
}

/**
 * Deserialize a string back to FilterCondition[] (ISO string -> Date).
 */
export function deserializeFilters(value: string | null): FilterCondition[] | null {
	if (!value?.trim()) return null;
	try {
		const parsed = JSON.parse(value) as SerializedFilterCondition[];
		if (!Array.isArray(parsed)) return null;
		return parsed.map((f) => ({
			id: f.id,
			field: f.field,
			operator: f.operator,
			dataType: f.dataType,
			valueString: f.valueString,
			valueNumber: f.valueNumber,
			valueArray: f.valueArray,
			valueDate: f.valueDate ? new Date(f.valueDate) : undefined,
			valueBoolean: f.valueBoolean,
		}));
	} catch {
		return null;
	}
}

/**
 * Serialize sort options to a URL-safe JSON string.
 * SortOption is already JSON-serializable (field, label, direction).
 */
export function serializeSorts(sorts: SortOption[]): string {
	if (!sorts?.length) return '';
	return JSON.stringify(sorts);
}

/**
 * Deserialize a string back to SortOption[].
 */
export function deserializeSorts(value: string | null): SortOption[] | null {
	if (!value?.trim()) return null;
	try {
		const parsed = JSON.parse(value) as SortOption[];
		if (!Array.isArray(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}

/** URL param key for filters (key = list identifier, e.g. fetchCustomers) */
export function getFiltersParamKey(key: string): string {
	return `${key}_filters`;
}

/** URL param key for sorts */
export function getSortsParamKey(key: string): string {
	return `${key}_sorts`;
}

/** SessionStorage key for a list's filter/sort state (survives tab switch, cleared when tab closes) */
export function getFilterStateSessionKey(key: string): string {
	return `filter_state_${key}`;
}

const EMPTY_FILTER_STATE: { filters: FilterCondition[] | null; sorts: SortOption[] | null } = {
	filters: null,
	sorts: null,
};

/**
 * Read filters and sorts from sessionStorage for a list key.
 * Used when user navigates back to a list (e.g. Features) and URL has no params.
 */
export function readFiltersAndSortsFromSession(key: string): {
	filters: FilterCondition[] | null;
	sorts: SortOption[] | null;
} {
	if (typeof window === 'undefined') return EMPTY_FILTER_STATE;
	try {
		const raw = sessionStorage.getItem(getFilterStateSessionKey(key));
		if (!raw?.trim()) return EMPTY_FILTER_STATE;
		const parsed = JSON.parse(raw) as { filters?: string; sorts?: string };
		return {
			filters: parsed?.filters != null ? deserializeFilters(parsed.filters) : null,
			sorts: parsed?.sorts != null ? deserializeSorts(parsed.sorts) : null,
		};
	} catch {
		return EMPTY_FILTER_STATE;
	}
}

/**
 * Write filters and sorts to sessionStorage for a list key.
 * Called when filters/sorts change so they can be restored when user navigates back.
 */
export function writeFiltersAndSortsToSession(key: string, filters: FilterCondition[], sorts: SortOption[]): void {
	if (typeof window === 'undefined') return;
	try {
		sessionStorage.setItem(
			getFilterStateSessionKey(key),
			JSON.stringify({
				filters: serializeFilters(filters),
				sorts: serializeSorts(sorts),
			}),
		);
	} catch {
		// ignore quota or disabled storage
	}
}
