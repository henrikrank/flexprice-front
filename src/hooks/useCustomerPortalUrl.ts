import { useMemo } from 'react';
import CustomerApi from '@/api/CustomerApi';
import { RouteNames } from '@/core/routes/Routes';
import toast from 'react-hot-toast';
import { logger } from '@/utils/common/Logger';

/**
 * Custom hook to generate and manage customer portal URL
 * @param customerExternalId - The customer external ID to generate portal URL for
 * @returns Object with portalUrl and copyToClipboard function
 */
export const useCustomerPortalUrl = (customerExternalId: string | undefined) => {
	const portalUrl = useMemo(() => {
		if (!customerExternalId) return null;

		try {
			// Build the base customer portal URL (token will be added dynamically)
			const baseUrl = window.location.origin;
			const portalPath = RouteNames.customerPortal;
			const url = new URL(portalPath, baseUrl);

			return url.toString();
		} catch (error) {
			logger.error('Failed to generate customer portal URL', error);
			return null;
		}
	}, [customerExternalId]);

	/**
	 * Generates a complete portal URL with dashboard session token and copies it to clipboard
	 */
	const copyToClipboard = async () => {
		if (!customerExternalId) {
			toast.error('Customer external ID is missing');
			return;
		}

		if (!portalUrl) {
			toast.error('Unable to generate portal URL');
			return;
		}

		try {
			// Create dashboard session to get token
			const sessionData = await CustomerApi.createDashboardSession(customerExternalId);
			if (!sessionData?.token) {
				toast.error('Unable to create dashboard session.');
				return;
			}

			// Add token to URL
			const urlWithToken = new URL(portalUrl);
			urlWithToken.searchParams.set('token', sessionData.token);

			// Copy to clipboard
			await navigator.clipboard.writeText(urlWithToken.toString());
			toast.success('Customer portal link copied to clipboard!');
		} catch (error) {
			logger.error('Failed to copy customer portal link', error);
			toast.error('Failed to copy customer portal link. Please try again.');
		}
	};

	/**
	 * Opens the customer portal in a new tab with dashboard session token
	 */
	const openInNewTab = async () => {
		if (!customerExternalId) {
			toast.error('Customer external ID is missing');
			return;
		}

		if (!portalUrl) {
			toast.error('Unable to generate portal URL');
			return;
		}

		try {
			// Create dashboard session to get token
			const sessionData = await CustomerApi.createDashboardSession(customerExternalId);
			if (!sessionData?.token) {
				toast.error('Unable to create dashboard session.');
				return;
			}

			// Add token to URL
			const urlWithToken = new URL(portalUrl);
			urlWithToken.searchParams.set('token', sessionData.token);

			// Open in new tab
			window.open(urlWithToken.toString(), '_blank', 'noopener,noreferrer');
		} catch (error) {
			logger.error('Failed to open customer portal', error);
			toast.error('Failed to open customer portal. Please try again.');
		}
	};

	return {
		portalUrl,
		copyToClipboard,
		openInNewTab,
	};
};
