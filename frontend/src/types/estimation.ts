export interface EstimationResponse {
	suggestedTime: string; // Format: "X.XX"
	taskSummary?: string;
	userInfo?: string;
	preferredTimeOfDay?: string;
	preferredDay?: string;
	originalPrompt?: string;
}
