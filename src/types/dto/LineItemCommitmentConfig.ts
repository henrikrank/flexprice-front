export enum CommitmentType {
	AMOUNT = 'amount',
	QUANTITY = 'quantity',
}

export interface LineItemCommitmentConfig {
	// CommitmentAmount is the minimum amount committed for this line item
	commitment_amount?: number;

	// CommitmentQuantity is the minimum quantity committed for this line item
	commitment_quantity?: number;

	// CommitmentType specifies whether commitment is based on amount or quantity
	commitment_type?: CommitmentType;

	// OverageFactor is a multiplier applied to usage beyond the commitment
	overage_factor?: number;

	// EnableTrueUp determines if true-up fee should be applied when usage is below commitment
	enable_true_up?: boolean;

	// IsWindowCommitment determines if commitment is applied per window (e.g., per day) rather than per billing period
	is_window_commitment?: boolean;
}

export type LineItemCommitmentsMap = Record<string, LineItemCommitmentConfig>;
