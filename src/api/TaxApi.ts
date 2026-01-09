import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import {
	CreateTaxRateRequest,
	UpdateTaxRateRequest,
	TaxRateResponse,
	ListTaxRatesResponse,
	TaxRateFilter,
	CreateTaxAssociationRequest,
	TaxAssociationUpdateRequest,
	TaxAssociationResponse,
	ListTaxAssociationsResponse,
	TaxAssociationFilter,
} from '@/types/dto';

class TaxApi {
	private static baseUrl = '/taxes';

	// Tax Rate Methods
	public static async createTaxRate(payload: CreateTaxRateRequest): Promise<TaxRateResponse> {
		return await AxiosClient.post<TaxRateResponse>(`${this.baseUrl}/rates`, payload);
	}

	public static async getTaxRate(id: string): Promise<TaxRateResponse> {
		return await AxiosClient.get<TaxRateResponse>(`${this.baseUrl}/rates/${id}`);
	}

	public static async listTaxRates(filter?: TaxRateFilter): Promise<ListTaxRatesResponse> {
		const url = filter ? generateQueryParams(`${this.baseUrl}/rates`, filter) : `${this.baseUrl}/rates`;
		return await AxiosClient.get<ListTaxRatesResponse>(url);
	}

	public static async updateTaxRate(id: string, payload: UpdateTaxRateRequest): Promise<TaxRateResponse> {
		return await AxiosClient.put<TaxRateResponse>(`${this.baseUrl}/rates/${id}`, payload);
	}

	public static async deleteTaxRate(id: string): Promise<void> {
		return await AxiosClient.delete(`${this.baseUrl}/rates/${id}`);
	}

	// Tax Association Methods
	public static async createTaxAssociation(payload: CreateTaxAssociationRequest): Promise<TaxAssociationResponse> {
		return await AxiosClient.post<TaxAssociationResponse>(`${this.baseUrl}/associations`, payload);
	}

	public static async getTaxAssociation(id: string): Promise<TaxAssociationResponse> {
		return await AxiosClient.get<TaxAssociationResponse>(`${this.baseUrl}/associations/${id}`);
	}

	public static async updateTaxAssociation(id: string, payload: TaxAssociationUpdateRequest): Promise<TaxAssociationResponse> {
		return await AxiosClient.put<TaxAssociationResponse>(`${this.baseUrl}/associations/${id}`, payload);
	}

	public static async deleteTaxAssociation(id: string): Promise<void> {
		return await AxiosClient.delete(`${this.baseUrl}/associations/${id}`);
	}

	public static async listTaxAssociations(filter?: TaxAssociationFilter): Promise<ListTaxAssociationsResponse> {
		const url = filter ? generateQueryParams(`${this.baseUrl}/associations`, filter) : `${this.baseUrl}/associations`;
		return await AxiosClient.get<ListTaxAssociationsResponse>(url);
	}
}

export default TaxApi;
