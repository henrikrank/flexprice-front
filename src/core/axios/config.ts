import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import EnvironmentApi from '@/api/EnvironmentApi';
import AuthService from '@/core/auth/AuthService';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const axiosClient: AxiosInstance = axios.create({
	baseURL: API_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

axiosClient.interceptors.request.use(
	async (config: InternalAxiosRequestConfig) => {
		const token = await AuthService.getAcessToken();
		// add active environment to the request
		const activeEnvId = EnvironmentApi.getActiveEnvironmentId();
		if (activeEnvId) {
			config.headers['X-Environment-ID'] = activeEnvId;
		}

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

axiosClient.interceptors.response.use(
	(response: AxiosResponse) => {
		return response.data;
	},
	async (error) => {
		if (error.response) {
			switch (error.response.status) {
				case 401:
					await AuthService.logout();
					// Redirect to login or show message
					break;
				case 403:
					// Handle forbidden access
					break;
				case 404:
					// Handle not found
					break;
				case 500:
					// Handle server error
					break;
				default:
					// Handle other errors
					break;
			}
			// Ensure we reject with the error response data if available
			const errorData = error.response.data;
			return Promise.reject(errorData || error);
		} else if (error.request) {
			// Request was made but no response received
			console.error('No response received:', error.request);
			return Promise.reject(new Error('No response received from server'));
		} else {
			// Error in setting up the request
			console.error('Error:', error.message);
			return Promise.reject(error);
		}
	},
);

/**
 * Creates a stateless axios client instance that uses provided token and environment ID.
 * This is used for out-of-auth-scope pages like the customer portal where credentials
 * are passed via query parameters instead of being stored in session/localStorage.
 *
 * @param getToken - Function that returns the access token (typically from query params)
 * @param getEnvId - Function that returns the environment ID (typically from query params)
 * @returns Configured axios instance
 */
export const createStatelessAxiosClient = (getToken: () => string | null, getEnvId: () => string | null): AxiosInstance => {
	const statelessClient: AxiosInstance = axios.create({
		baseURL: API_URL,
		timeout: 10000,
		headers: {
			'Content-Type': 'application/json',
		},
	});

	statelessClient.interceptors.request.use(
		(config: InternalAxiosRequestConfig) => {
			const token = getToken();
			const envId = getEnvId();

			// Add environment ID to the request if provided
			if (envId) {
				config.headers['X-Environment-ID'] = envId;
			}

			// Add authorization token if provided
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}

			return config;
		},
		(error) => {
			return Promise.reject(error);
		},
	);

	statelessClient.interceptors.response.use(
		(response: AxiosResponse) => {
			return response.data;
		},
		async (error) => {
			if (error.response) {
				switch (error.response.status) {
					case 401:
						// For stateless client, we don't redirect - let the component handle it
						break;
					case 403:
						// Handle forbidden access
						break;
					case 404:
						// Handle not found
						break;
					case 500:
						// Handle server error
						break;
					default:
						// Handle other errors
						break;
				}
				// Ensure we reject with the error response data if available
				const errorData = error.response.data;
				return Promise.reject(errorData || error);
			} else if (error.request) {
				// Request was made but no response received
				console.error('No response received:', error.request);
				return Promise.reject(new Error('No response received from server'));
			} else {
				// Error in setting up the request
				console.error('Error:', error.message);
				return Promise.reject(error);
			}
		},
	);

	return statelessClient;
};

export default axiosClient;
