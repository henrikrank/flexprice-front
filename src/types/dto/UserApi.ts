import { User } from '@/models';

export interface GetServiceAccountsResponse {
	service_accounts: User[];
	pagination?: {
		total: number;
		limit: number;
		offset: number;
	};
}
