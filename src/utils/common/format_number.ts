/**
 * Format a number with thousands separators and optional decimal places
 * @param value The number to format
 * @param decimals Number of decimal places (default: 0)
 * @returns Formatted number string
 */
const formatNumber = (value: number | undefined, decimals: number = 0): string => {
	if (value === undefined || value === null) return '-';

	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value);
};

export default formatNumber;
