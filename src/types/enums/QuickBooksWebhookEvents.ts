/**
 * Enum for QuickBooks webhook events used in the application
 * This provides type safety and prevents typos when working with webhook events
 */
export enum QuickBooksWebhookEvents {
	// Payment events
	PAYMENT_CREATE = 'Payment.Create',
}

/**
 * Helper function to get default webhook events
 * @returns Array of default QuickBooks webhook events
 */
export const getDefaultQuickBooksWebhookEvents = (): QuickBooksWebhookEvents[] => [QuickBooksWebhookEvents.PAYMENT_CREATE];
