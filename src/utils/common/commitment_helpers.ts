import { Price } from '@/models/Price';
import { CommitmentType, LineItemCommitmentConfig, LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';

/**
 * Check if a price has commitment configured
 */
export const hasCommitment = (priceId: string, commitments: LineItemCommitmentsMap): boolean => {
	return commitments[priceId] !== undefined;
};

/**
 * Get commitment config for a specific price
 */
export const getCommitmentConfig = (priceId: string, commitments: LineItemCommitmentsMap): LineItemCommitmentConfig | undefined => {
	return commitments[priceId];
};

/**
 * Validate commitment configuration
 * Returns error message if invalid, null if valid
 * Matches backend validation logic: only validates if commitment is configured
 */
export const validateCommitment = (config: Partial<LineItemCommitmentConfig>): string | null => {
	const hasAmountCommitment = config.commitment_amount !== undefined && config.commitment_amount !== null && config.commitment_amount > 0;
	const hasQuantityCommitment =
		config.commitment_quantity !== undefined && config.commitment_quantity !== null && config.commitment_quantity > 0;
	const hasCommitment = hasAmountCommitment || hasQuantityCommitment;

	// No commitment configured, nothing to validate
	if (!hasCommitment) {
		return null;
	}

	// Rule 1: Cannot set both commitment_amount and commitment_quantity
	if (hasAmountCommitment && hasQuantityCommitment) {
		return 'Cannot set both commitment_amount and commitment_quantity';
	}

	// Rule 2: Validate commitment type matches the provided field
	if (config.commitment_type) {
		if (hasAmountCommitment && config.commitment_type !== CommitmentType.AMOUNT) {
			return 'When commitment_amount is set, commitment_type must be "amount"';
		}
		if (hasQuantityCommitment && config.commitment_type !== CommitmentType.QUANTITY) {
			return 'When commitment_quantity is set, commitment_type must be "quantity"';
		}
	}

	// Rule 3: Overage factor is required and must be greater than 1.0 when commitment is set
	if (config.overage_factor === undefined || config.overage_factor === null) {
		return 'Overage factor is required when commitment is set';
	}

	if (config.overage_factor <= 1) {
		return 'Overage factor must be greater than 1.0';
	}

	// Rule 4: Validate commitment values are non-negative
	if (hasAmountCommitment && config.commitment_amount! < 0) {
		return 'Commitment amount must be non-negative';
	}

	if (hasQuantityCommitment && config.commitment_quantity! < 0) {
		return 'Commitment quantity must be non-negative';
	}

	return null;
};

/**
 * Format commitment configuration for display
 */
export const formatCommitmentSummary = (config: LineItemCommitmentConfig): string => {
	const parts: string[] = [];

	// Determine commitment type from the fields if not explicitly set
	const commitmentType =
		config.commitment_type ||
		(config.commitment_amount !== undefined && config.commitment_amount !== null
			? CommitmentType.AMOUNT
			: config.commitment_quantity !== undefined && config.commitment_quantity !== null
				? CommitmentType.QUANTITY
				: null);

	if (commitmentType === CommitmentType.AMOUNT) {
		parts.push(`$${config.commitment_amount?.toLocaleString() || '0'} commitment`);
	} else if (commitmentType === CommitmentType.QUANTITY) {
		parts.push(`${config.commitment_quantity?.toLocaleString() || '0'} units commitment`);
	}

	if (config.overage_factor && config.overage_factor !== 1) {
		parts.push(`${config.overage_factor}x overage`);
	}

	if (config.enable_true_up) {
		parts.push('true-up enabled');
	}

	if (config.is_window_commitment) {
		parts.push('windowed');
	}

	return parts.join(' • ');
};

/**
 * Check if a price/meter supports window commitment
 * Window commitment is only available for meters with bucket_size configured
 */
export const supportsWindowCommitment = (price: Price): boolean => {
	return price.meter?.aggregation?.bucket_size !== undefined && price.meter?.aggregation?.bucket_size !== null;
};

/**
 * Extract line item commitments from price overrides
 * Converts the frontend ExtendedPriceOverride format to backend LineItemCommitmentsMap
 */
export const extractLineItemCommitments = (
	priceOverrides: Record<string, { commitment?: LineItemCommitmentConfig }>,
): LineItemCommitmentsMap => {
	const commitments: LineItemCommitmentsMap = {};

	Object.entries(priceOverrides).forEach(([priceId, override]) => {
		if (override.commitment) {
			commitments[priceId] = override.commitment;
		}
	});

	return commitments;
};

/**
 * Merge line item commitments into price overrides
 * Used when loading existing subscription data
 */
export const mergeCommitmentsIntoOverrides = (
	priceOverrides: Record<string, any>,
	commitments: LineItemCommitmentsMap,
): Record<string, any> => {
	const merged = { ...priceOverrides };

	Object.entries(commitments).forEach(([priceId, commitment]) => {
		if (merged[priceId]) {
			merged[priceId] = {
				...merged[priceId],
				commitment,
			};
		} else {
			merged[priceId] = {
				price_id: priceId,
				commitment,
			};
		}
	});

	return merged;
};
