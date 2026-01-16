import { AxiosClient } from '@/core/axios/verbs';
import { FireEventsPayload } from '@/types/dto';
import axios from 'axios';

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

export type OnboardingDataRequest = Record<string, string>;

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

	/**
	 * Record onboarding data to Google Sheets
	 * POST to Google Apps Script Web App URL
	 */
	public static async recordOnboardingData(payload: OnboardingDataRequest): Promise<void> {
		const webAppUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL;

		if (!webAppUrl) {
			console.warn('VITE_GOOGLE_SHEETS_WEB_APP_URL is not configured. Skipping onboarding data recording.');
			return;
		}

		// Create a clean axios instance without auth interceptors for external API calls
		const externalClient = axios.create({
			headers: {
				'Content-Type': 'application/json',
			},
			timeout: 10000, // 10 second timeout
		});

		await externalClient.post(webAppUrl, payload);
	}
}

export default OnboardingApi;
