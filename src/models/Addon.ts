import { BaseModel, Metadata } from './base';

export enum ADDON_TYPE {
	ONETIME = 'onetime',
	/** @deprecated Use MULTIPLE_INSTANCE for new addons; kept for backward compatibility with API responses */
	MULTIPLE = 'multiple',
	MULTIPLE_INSTANCE = 'multiple_instance',
}

interface Addon extends BaseModel {
	readonly name: string;
	readonly description: string;
	readonly lookup_key: string;
	readonly type: ADDON_TYPE;
	readonly metadata: Metadata;
}

export default Addon;
