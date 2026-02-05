import type { LucideIcon } from 'lucide-react';
import {
	Home,
	Layers2,
	Landmark,
	Settings,
	CodeXml,
	Puzzle,
	GalleryHorizontalEnd,
	Plus,
	CreditCard,
	Receipt,
	FileText,
	Wallet,
	Key,
	UserCog,
	Webhook,
} from 'lucide-react';

// Paths match RouteNames in @/core/routes/Routes - duplicated here to avoid circular dependency
// (Routes -> MainLayout -> CommandPalette -> commandPaletteCommands -> Routes)
const R = {
	homeDashboard: '/home',
	createFeature: '/product-catalog/features/create-feature',
	features: '/product-catalog/features',
	plan: '/product-catalog/plan',
	coupons: '/product-catalog/coupons',
	addons: '/product-catalog/addons',
	costSheets: '/product-catalog/cost-sheets',
	priceUnits: '/product-catalog/price-units',
	groups: '/product-catalog/groups',
	customers: '/billing/customers',
	subscriptions: '/billing/subscriptions',
	taxes: '/billing/taxes',
	invoices: '/billing/invoices',
	creditNotes: '/billing/credit-notes',
	payments: '/billing/payments',
	customerBilling: '/settings/billing',
	bulkImports: '/tools/bulk-imports',
	exports: '/tools/exports',
	s3Exports: '/tools/exports/s3',
	events: '/usage-tracking/events',
	queryPage: '/usage-tracking/query',
	apiKeys: '/developers/api-keys',
	serviceAccounts: '/developers/service-accounts',
	webhooks: '/developers/webhooks',
	integrations: '/tools/integrations',
	// Individual integration detail routes (path = /tools/integrations/:id, id = name.toLowerCase())
	integrationStripe: '/tools/integrations/stripe',
	integrationRazorpay: '/tools/integrations/razorpay',
	integrationChargebee: '/tools/integrations/chargebee',
	integrationHubspot: '/tools/integrations/hubspot',
	integrationQuickbooks: '/tools/integrations/quickbooks',
	integrationNomod: '/tools/integrations/nomod',
	integrationMoyasar: '/tools/integrations/moyasar',
	pricing: '/product-catalog/pricing-widget',
} as const;

export interface CommandPaletteCommand {
	id: string;
	label: string;
	group: string;
	path?: string;
	keywords?: string[];
	icon?: LucideIcon;
}

export enum CommandPaletteGroup {
	Actions = 'Actions',
	GoTo = 'Go to',
}

/** Command IDs shown when the palette is first opened (before user types). */
export const COMMAND_PALETTE_INITIAL_SUGGESTED_IDS: string[] = [
	'action-create-feature',
	'nav-home',
	'nav-product-catalog-features',
	'nav-product-catalog-plans',
	'nav-billing-customers',
];

export const commandPaletteCommands: CommandPaletteCommand[] = [
	// Actions (quick create / entry points)
	{
		id: 'action-create-feature',
		label: 'Create Feature',
		group: CommandPaletteGroup.Actions,
		path: R.createFeature,
		keywords: ['new', 'add', 'feature', 'product'],
		icon: Plus,
	},
	// Go to - Home
	{
		id: 'nav-home',
		label: 'Home',
		group: CommandPaletteGroup.GoTo,
		path: R.homeDashboard,
		keywords: ['dashboard', 'overview'],
		icon: Home,
	},

	// Go to - Product Catalog
	{
		id: 'nav-product-catalog-features',
		label: 'Product Catalog → Features',
		group: CommandPaletteGroup.GoTo,
		path: R.features,
		keywords: ['features', 'product', 'catalog'],
		icon: Layers2,
	},
	{
		id: 'nav-product-catalog-plans',
		label: 'Product Catalog → Plans',
		group: CommandPaletteGroup.GoTo,
		path: R.plan,
		keywords: ['plans', 'pricing', 'product', 'catalog'],
		icon: Layers2,
	},
	{
		id: 'nav-product-catalog-coupons',
		label: 'Product Catalog → Coupons',
		group: CommandPaletteGroup.GoTo,
		path: R.coupons,
		keywords: ['coupons', 'discounts', 'product', 'catalog'],
		icon: Layers2,
	},
	{
		id: 'nav-product-catalog-addons',
		label: 'Product Catalog → Addons',
		group: CommandPaletteGroup.GoTo,
		path: R.addons,
		keywords: ['addons', 'add-ons', 'product', 'catalog'],
		icon: Layers2,
	},
	{
		id: 'nav-product-catalog-cost-sheets',
		label: 'Product Catalog → Cost Sheets',
		group: CommandPaletteGroup.GoTo,
		path: R.costSheets,
		keywords: ['cost sheets', 'costs', 'product', 'catalog'],
		icon: Layers2,
	},
	{
		id: 'nav-product-catalog-price-units',
		label: 'Product Catalog → Price Units',
		group: CommandPaletteGroup.GoTo,
		path: R.priceUnits,
		keywords: ['price units', 'units', 'product', 'catalog'],
		icon: Layers2,
	},
	{
		id: 'nav-product-catalog-groups',
		label: 'Product Catalog → Groups',
		group: CommandPaletteGroup.GoTo,
		path: R.groups,
		keywords: ['groups', 'product', 'catalog'],
		icon: Layers2,
	},

	// Go to - Billing
	{
		id: 'nav-billing-customers',
		label: 'Billing → Customers',
		group: CommandPaletteGroup.GoTo,
		path: R.customers,
		keywords: ['customers', 'billing', 'accounts'],
		icon: Landmark,
	},
	{
		id: 'nav-billing-subscriptions',
		label: 'Billing → Subscriptions',
		group: CommandPaletteGroup.GoTo,
		path: R.subscriptions,
		keywords: ['subscriptions', 'billing'],
		icon: CreditCard,
	},
	{
		id: 'nav-billing-taxes',
		label: 'Billing → Taxes',
		group: CommandPaletteGroup.GoTo,
		path: R.taxes,
		keywords: ['taxes', 'tax rates', 'billing'],
		icon: Landmark,
	},
	{
		id: 'nav-billing-invoices',
		label: 'Billing → Invoices',
		group: CommandPaletteGroup.GoTo,
		path: R.invoices,
		keywords: ['invoices', 'billing'],
		icon: Receipt,
	},
	{
		id: 'nav-billing-credit-notes',
		label: 'Billing → Credit Notes',
		group: CommandPaletteGroup.GoTo,
		path: R.creditNotes,
		keywords: ['credit notes', 'credits', 'billing'],
		icon: FileText,
	},
	{
		id: 'nav-billing-payments',
		label: 'Billing → Payments',
		group: CommandPaletteGroup.GoTo,
		path: R.payments,
		keywords: ['payments', 'billing', 'wallet'],
		icon: Wallet,
	},

	// Go to - Settings
	{
		id: 'nav-settings-billing',
		label: 'Settings → Billing',
		group: CommandPaletteGroup.GoTo,
		path: R.customerBilling,
		keywords: ['settings', 'billing', 'payment'],
		icon: Landmark,
	},

	// Go to - Tools
	{
		id: 'nav-tools-imports',
		label: 'Tools → Imports',
		group: CommandPaletteGroup.GoTo,
		path: R.bulkImports,
		keywords: ['imports', 'bulk import', 'tools'],
		icon: Settings,
	},
	{
		id: 'nav-tools-exports',
		label: 'Tools → Exports',
		group: CommandPaletteGroup.GoTo,
		path: R.exports,
		keywords: ['exports', 'tools'],
		icon: Settings,
	},
	{
		id: 'nav-tools-s3-exports',
		label: 'Tools → S3 Exports',
		group: CommandPaletteGroup.GoTo,
		path: R.s3Exports,
		keywords: ['s3', 'exports', 'tools'],
		icon: Settings,
	},

	// Go to - Developers
	{
		id: 'nav-developers-events',
		label: 'Usage Tracking → Events Debugger',
		group: CommandPaletteGroup.GoTo,
		path: R.events,
		keywords: ['events', 'debugger', 'usage', 'developers'],
		icon: CodeXml,
	},
	{
		id: 'nav-usage-tracking-query',
		label: 'Usage Tracking → Query',
		group: CommandPaletteGroup.GoTo,
		path: R.queryPage,
		keywords: ['query', 'usage', 'tracking', 'metrics'],
		icon: CodeXml,
	},
	{
		id: 'nav-developers-api-keys',
		label: 'Developers → API Keys',
		group: CommandPaletteGroup.GoTo,
		path: R.apiKeys,
		keywords: ['api keys', 'keys', 'developers'],
		icon: Key,
	},
	{
		id: 'nav-developers-service-accounts',
		label: 'Developers → Service Accounts',
		group: CommandPaletteGroup.GoTo,
		path: R.serviceAccounts,
		keywords: ['service accounts', 'developers'],
		icon: UserCog,
	},
	{
		id: 'nav-developers-webhooks',
		label: 'Developers → Webhooks',
		group: CommandPaletteGroup.GoTo,
		path: R.webhooks,
		keywords: ['webhooks', 'developers'],
		icon: Webhook,
	},

	// Go to - Integrations & Pricing Widget
	{
		id: 'nav-integrations',
		label: 'Integrations',
		group: CommandPaletteGroup.GoTo,
		path: R.integrations,
		keywords: ['integrations', 'tools', 'quickbooks'],
		icon: Puzzle,
	},
	{
		id: 'nav-integration-stripe',
		label: 'Integrations → Stripe',
		group: CommandPaletteGroup.GoTo,
		path: R.integrationStripe,
		keywords: ['stripe', 'payments', 'invoices', 'integrations'],
		icon: Puzzle,
	},
	{
		id: 'nav-integration-razorpay',
		label: 'Integrations → Razorpay',
		group: CommandPaletteGroup.GoTo,
		path: R.integrationRazorpay,
		keywords: ['razorpay', 'payments', 'invoices', 'integrations'],
		icon: Puzzle,
	},
	{
		id: 'nav-integration-chargebee',
		label: 'Integrations → Chargebee',
		group: CommandPaletteGroup.GoTo,
		path: R.integrationChargebee,
		keywords: ['chargebee', 'payments', 'invoices', 'integrations'],
		icon: Puzzle,
	},
	{
		id: 'nav-integration-hubspot',
		label: 'Integrations → Hubspot',
		group: CommandPaletteGroup.GoTo,
		path: R.integrationHubspot,
		keywords: ['hubspot', 'crm', 'sales', 'marketing', 'integrations'],
		icon: Puzzle,
	},
	{
		id: 'nav-integration-quickbooks',
		label: 'Integrations → QuickBooks',
		group: CommandPaletteGroup.GoTo,
		path: R.integrationQuickbooks,
		keywords: ['quickbooks', 'accounting', 'invoices', 'integrations'],
		icon: Puzzle,
	},
	{
		id: 'nav-integration-nomod',
		label: 'Integrations → Nomod',
		group: CommandPaletteGroup.GoTo,
		path: R.integrationNomod,
		keywords: ['nomod', 'payments', 'invoices', 'integrations'],
		icon: Puzzle,
	},
	{
		id: 'nav-integration-moyasar',
		label: 'Integrations → Moyasar',
		group: CommandPaletteGroup.GoTo,
		path: R.integrationMoyasar,
		keywords: ['moyasar', 'payments', 'invoices', 'integrations'],
		icon: Puzzle,
	},
	{
		id: 'nav-pricing-widget',
		label: 'Pricing Widget',
		group: CommandPaletteGroup.GoTo,
		path: R.pricing,
		keywords: ['pricing', 'widget', 'embed'],
		icon: GalleryHorizontalEnd,
	},
];
