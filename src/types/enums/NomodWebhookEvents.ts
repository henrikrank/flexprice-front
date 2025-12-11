/**
 * Enum for Nomod webhook events used in the application
 * This provides type safety and prevents typos when working with webhook events
 */
export enum NomodWebhookEvents {
	// Invoice events
	INVOICE_CREATED = 'invoice.created',
	INVOICE_PAID = 'invoice.paid',
	INVOICE_FAILED = 'invoice.failed',
	// Payment link events
	PAYMENT_LINK_CREATED = 'payment_link.created',
	PAYMENT_LINK_PAID = 'payment_link.paid',
	PAYMENT_LINK_EXPIRED = 'payment_link.expired',
}

/**
 * Helper function to get default webhook events
 * @returns Array of default Nomod webhook events
 */
export const getDefaultNomodWebhookEvents = (): NomodWebhookEvents[] => [
	NomodWebhookEvents.INVOICE_CREATED,
	NomodWebhookEvents.INVOICE_PAID,
	NomodWebhookEvents.INVOICE_FAILED,
	NomodWebhookEvents.PAYMENT_LINK_CREATED,
	NomodWebhookEvents.PAYMENT_LINK_PAID,
	NomodWebhookEvents.PAYMENT_LINK_EXPIRED,
];
