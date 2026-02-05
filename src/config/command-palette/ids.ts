/** Single source of truth for command palette command IDs. Values are kebab-case. */
export const CommandPaletteCommandId = {
	// Actions (quick create / entry points)
	actionCreateFeature: 'action-create-feature',
	actionSimulateIngestEvents: 'action-simulate-ingest-events',
	// Help
	actionOpenDocumentation: 'action-open-documentation',
	actionKeyboardShortcuts: 'action-keyboard-shortcuts',
	actionContactUs: 'action-contact-us',
	actionBookCall: 'action-book-call',
	actionJoinSlack: 'action-join-slack',
	actionOpenIntercom: 'action-open-intercom',
	actionLogout: 'action-logout',
	// Go to - Home
	navHome: 'nav-home',
	// Go to - Product Catalog
	navProductCatalogFeatures: 'nav-product-catalog-features',
	navProductCatalogPlans: 'nav-product-catalog-plans',
	navProductCatalogCoupons: 'nav-product-catalog-coupons',
	navProductCatalogAddons: 'nav-product-catalog-addons',
	navProductCatalogCostSheets: 'nav-product-catalog-cost-sheets',
	navProductCatalogPriceUnits: 'nav-product-catalog-price-units',
	navProductCatalogGroups: 'nav-product-catalog-groups',
	// Go to - Billing
	navBillingCustomers: 'nav-billing-customers',
	navBillingSubscriptions: 'nav-billing-subscriptions',
	navBillingTaxes: 'nav-billing-taxes',
	navBillingInvoices: 'nav-billing-invoices',
	navBillingCreditNotes: 'nav-billing-credit-notes',
	navBillingPayments: 'nav-billing-payments',
	// Go to - Settings
	navSettingsBilling: 'nav-settings-billing',
	// Go to - Tools
	navToolsImports: 'nav-tools-imports',
	navToolsExports: 'nav-tools-exports',
	navToolsS3Exports: 'nav-tools-s3-exports',
	// Go to - Developers / Usage
	navDevelopersEvents: 'nav-developers-events',
	navUsageTrackingQuery: 'nav-usage-tracking-query',
	navDevelopersApiKeys: 'nav-developers-api-keys',
	navDevelopersServiceAccounts: 'nav-developers-service-accounts',
	navDevelopersWebhooks: 'nav-developers-webhooks',
	// Go to - Integrations & Pricing Widget
	navIntegrations: 'nav-integrations',
	navIntegrationStripe: 'nav-integration-stripe',
	navIntegrationRazorpay: 'nav-integration-razorpay',
	navIntegrationChargebee: 'nav-integration-chargebee',
	navIntegrationHubspot: 'nav-integration-hubspot',
	navIntegrationQuickbooks: 'nav-integration-quickbooks',
	navIntegrationNomod: 'nav-integration-nomod',
	navIntegrationMoyasar: 'nav-integration-moyasar',
	navPricingWidget: 'nav-pricing-widget',
} as const;

export type CommandPaletteCommandIdType = (typeof CommandPaletteCommandId)[keyof typeof CommandPaletteCommandId];

export const CommandPaletteGroup = {
	Actions: 'Actions',
	Help: 'Help',
	GoTo: 'Go to',
} as const;

export type CommandPaletteGroupType = (typeof CommandPaletteGroup)[keyof typeof CommandPaletteGroup];

/** Command IDs shown when the palette is first opened (before user types). */
export const COMMAND_PALETTE_INITIAL_SUGGESTED_IDS: CommandPaletteCommandIdType[] = [
	CommandPaletteCommandId.actionCreateFeature,
	CommandPaletteCommandId.actionOpenDocumentation,
	CommandPaletteCommandId.navHome,
	CommandPaletteCommandId.navProductCatalogFeatures,
	CommandPaletteCommandId.navProductCatalogPlans,
	CommandPaletteCommandId.navBillingCustomers,
];
