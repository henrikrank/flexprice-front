import { AxiosClient } from '@/core/axios/verbs';
import {
	CreatePriceUnitRequest,
	UpdatePriceUnitRequest,
	PriceUnitResponse,
	CreatePriceUnitResponse,
	ListPriceUnitsResponse,
	PriceUnitFilter,
} from '@/types/dto';
import { generateQueryParams } from '@/utils/common/api_helper';

export class PriceUnitApi {
	private static baseUrl = '/prices/units';

	/**
	 * Create a new price unit
	 * @param data - Price unit details
	 * @returns Promise<CreatePriceUnitResponse>
	 */
	public static async CreatePriceUnit(data: CreatePriceUnitRequest) {
		return await AxiosClient.post<CreatePriceUnitResponse>(this.baseUrl, data);
	}

	/**
	 * List price units with optional filters
	 * @param filters - Optional price unit filters
	 * @returns Promise<ListPriceUnitsResponse>
	 */
	public static async ListPriceUnits(filters?: PriceUnitFilter) {
		const url = filters ? generateQueryParams(this.baseUrl, filters) : this.baseUrl;
		return await AxiosClient.get<ListPriceUnitsResponse>(url);
	}

	/**
	 * Get a price unit by ID
	 * @param id - Price unit ID
	 * @returns Promise<PriceUnitResponse>
	 */
	public static async GetPriceUnit(id: string) {
		return await AxiosClient.get<PriceUnitResponse>(`${this.baseUrl}/${id}`);
	}

	/**
	 * Get a price unit by code
	 * @param code - Price unit code
	 * @returns Promise<PriceUnitResponse>
	 */
	public static async GetPriceUnitByCode(code: string) {
		return await AxiosClient.get<PriceUnitResponse>(`${this.baseUrl}/code/${code}`);
	}

	/**
	 * Update a price unit
	 * @param id - Price unit ID
	 * @param data - Price unit details to update
	 * @returns Promise<PriceUnitResponse>
	 */
	public static async UpdatePriceUnit(id: string, data: UpdatePriceUnitRequest) {
		return await AxiosClient.put<PriceUnitResponse>(`${this.baseUrl}/${id}`, data);
	}

	/**
	 * Delete a price unit
	 * @param id - Price unit ID
	 * @returns Promise<void>
	 */
	public static async DeletePriceUnit(id: string) {
		return await AxiosClient.delete<void>(`${this.baseUrl}/${id}`);
	}

	/**
	 * List price units by filter (POST request with complex filters)
	 * @param filter - Price unit filter with complex filtering options
	 * @returns Promise<ListPriceUnitsResponse>
	 */
	public static async ListPriceUnitsByFilter(filter: PriceUnitFilter) {
		return await AxiosClient.post<ListPriceUnitsResponse>(`${this.baseUrl}/search`, filter);
	}
}
