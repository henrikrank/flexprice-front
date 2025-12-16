import { useSearchParams } from 'react-router';
import { useEffect, useCallback, useMemo } from 'react';

interface UseQueryParamProps<T> {
	key: string;
	defaultValue: T;
	validate?: (value: string) => boolean;
	replace?: boolean; // Whether to use replace instead of push when setting initial value
}

/**
 * Hook to manage a single query parameter in the URL
 * @param key - The query parameter key
 * @param defaultValue - Default value if param doesn't exist or is invalid
 * @param validate - Optional function to validate the param value
 * @param replace - Whether to use replace instead of push when setting initial value (default: true)
 * @returns The current value and a setter function
 */
const useQueryParam = <T extends string>({ key, defaultValue, validate, replace = true }: UseQueryParamProps<T>) => {
	const [searchParams, setSearchParams] = useSearchParams();
	const paramValue = searchParams.get(key);

	// Determine the current value: use URL param if valid, otherwise use defaultValue
	const value = useMemo(() => {
		if (paramValue) {
			// If validation function provided, check if value is valid
			if (validate) {
				return validate(paramValue) ? (paramValue as T) : defaultValue;
			}
			return paramValue as T;
		}
		return defaultValue;
	}, [paramValue, defaultValue, validate]);

	// Ensure param is set in URL if not present
	useEffect(() => {
		if (!paramValue && defaultValue) {
			const newParams = new URLSearchParams(searchParams);
			newParams.set(key, defaultValue);
			setSearchParams(newParams, { replace });
		}
	}, [paramValue, defaultValue, key, searchParams, setSearchParams, replace]);

	const setValue = useCallback(
		(newValue: T) => {
			const newParams = new URLSearchParams(searchParams);
			newParams.set(key, newValue);
			setSearchParams(newParams);
		},
		[searchParams, setSearchParams, key],
	);

	return {
		value,
		setValue,
	};
};

export default useQueryParam;
