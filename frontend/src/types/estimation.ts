export interface EstimationResponse {
	suggestedTime: string; // Format: "X.XX"
	taskSummary?: string;
	customerName?: string;
	customerEmail?: string;
	preferredTimeOfDay?: string;
	preferredDay?: string;
	originalPrompt?: string;
}
