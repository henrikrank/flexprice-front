/**
 * Enum for dashboard regions used in the application
 * This provides type safety and prevents typos when working with regions
 */
export enum Region {
	INDIA = 'india',
	US = 'us',
}

/**
 * Type helper for region values
 */
export type RegionType = Region.INDIA | Region.US;
