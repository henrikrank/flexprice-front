import { AxiosClient } from '@/core/axios/verbs';
import { Customer, Invoice } from '@/models';
import { UpdateCustomerRequest, GetUsageSummaryResponse } from '@/types/dto';
import {
	GetCustomerUsageSummaryRequest,
	DashboardPaginatedRequest,
	DashboardAnalyticsRequest,
	DashboardCostAnalyticsRequest,
} from '@/types';
import { SubscriptionResponse, ListSubscriptionsResponse } from '@/types/dto/Subscription';
import { GetInvoicesResponse } from '@/types/dto/InvoiceApi';
import { WalletResponse } from '@/types/dto/Wallet';
import { GetUsageAnalyticsResponse } from '@/types/dto/Events';
import { GetDetailedCostAnalyticsResponse } from '@/types/dto/Cost';
import { generateQueryParams } from '@/utils/common/api_helper';

/**
 * CustomerPortalApi - Customer-facing dashboard APIs
 * All methods require dashboard token authentication (set via setRuntimeCredentials)
 */
class CustomerPortalApi {
	private static baseUrl = '/v1/customer-dashboard';

	/**
	 * Get the authenticated customer's information
	 */
	public static async getCustomer(): Promise<Customer> {
		return await AxiosClient.get<Customer>(`${this.baseUrl}/info`);
	}

	/**
	 * Update the authenticated customer's information
	 */
	public static async updateCustomer(payload: UpdateCustomerRequest): Promise<Customer> {
		return await AxiosClient.put<Customer>(`${this.baseUrl}/info`, payload);
	}

	/**
	 * Get usage summary for the authenticated customer
	 */
	public static async getUsageSummary(query?: GetCustomerUsageSummaryRequest): Promise<GetUsageSummaryResponse> {
		const url = generateQueryParams(`${this.baseUrl}/usage`, query || {});
		return await AxiosClient.get<GetUsageSummaryResponse>(url);
	}

	/**
	 * Get subscriptions for the authenticated customer with pagination
	 */
	public static async getSubscriptions(payload: DashboardPaginatedRequest): Promise<ListSubscriptionsResponse> {
		return await AxiosClient.post<ListSubscriptionsResponse>(`${this.baseUrl}/subscriptions`, payload);
	}

	/**
	 * Get a specific subscription by ID for the authenticated customer
	 */
	public static async getSubscription(id: string): Promise<SubscriptionResponse> {
		return await AxiosClient.get<SubscriptionResponse>(`${this.baseUrl}/subscriptions/${id}`);
	}

	/**
	 * Get invoices for the authenticated customer with pagination
	 */
	public static async getInvoices(payload: DashboardPaginatedRequest): Promise<GetInvoicesResponse> {
		return await AxiosClient.post<GetInvoicesResponse>(`${this.baseUrl}/invoices`, payload);
	}

	/**
	 * Get a specific invoice by ID for the authenticated customer
	 */
	public static async getInvoice(id: string): Promise<Invoice> {
		return await AxiosClient.get<Invoice>(`${this.baseUrl}/invoices/${id}`);
	}

	/**
	 * Get wallets for the authenticated customer
	 */
	public static async getWallets(): Promise<WalletResponse[]> {
		return await AxiosClient.post<WalletResponse[]>(`${this.baseUrl}/wallets`, {});
	}

	/**
	 * Get a specific wallet by ID for the authenticated customer
	 */
	public static async getWallet(id: string): Promise<WalletResponse> {
		return await AxiosClient.get<WalletResponse>(`${this.baseUrl}/wallets/${id}`);
	}

	/**
	 * Get usage analytics for the authenticated customer
	 */
	public static async getAnalytics(payload: DashboardAnalyticsRequest): Promise<GetUsageAnalyticsResponse> {
		return await AxiosClient.post<GetUsageAnalyticsResponse>(`${this.baseUrl}/analytics`, payload);
	}

	/**
	 * Get cost analytics for the authenticated customer
	 */
	public static async getCostAnalytics(payload: DashboardCostAnalyticsRequest): Promise<GetDetailedCostAnalyticsResponse> {
		return await AxiosClient.post<GetDetailedCostAnalyticsResponse>(`${this.baseUrl}/cost-analytics`, payload);
	}
}

export default CustomerPortalApi;
