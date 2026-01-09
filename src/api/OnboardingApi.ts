import { AxiosClient } from '@/core/axios/verbs';
import { FireEventsPayload } from '@/types/dto';

export interface SetupDemoRequest {
	// Add fields based on backend requirements
	// This may need to be updated once backend structure is known
	[key: string]: any;
}

export interface SetupDemoResponse {
	// Add fields based on backend response
	// This may need to be updated once backend structure is known
	message?: string;
	[key: string]: any;
}

class OnboardingApi {
	private static baseUrl = '/portal/onboarding';

	/**
	 * Generate events for onboarding
	 * POST /portal/onboarding/events
	 */
	public static async generateEvents(payload: FireEventsPayload): Promise<void> {
		return await AxiosClient.post<void>(`${this.baseUrl}/events`, payload);
	}

	/**
	 * Setup demo
	 * POST /portal/onboarding/setup
	 */
	public static async setupDemo(payload: SetupDemoRequest): Promise<SetupDemoResponse> {
		return await AxiosClient.post<SetupDemoResponse>(`${this.baseUrl}/setup`, payload);
	}
}

export default OnboardingApi;
