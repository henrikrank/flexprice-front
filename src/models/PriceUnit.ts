import { BaseModel, Metadata } from './base';

export interface PriceUnit extends BaseModel {
	readonly name: string;
	readonly code: string;
	readonly symbol: string;
	readonly base_currency: string;
	readonly conversion_rate: string;
	readonly metadata: Metadata | null;
}
