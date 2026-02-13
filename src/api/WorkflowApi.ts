import { AxiosClient } from '@/core/axios/verbs';
import type {
	WorkflowExecutionFilterRequest,
	ListWorkflowsResponse,
	WorkflowDetailsResponse,
	WorkflowSummaryResponse,
	WorkflowTimelineResponse,
	BatchWorkflowsRequest,
	BatchWorkflowsResponse,
} from '@/types/dto';

class WorkflowApi {
	private static baseUrl = '/workflows';

	public static async search(payload: WorkflowExecutionFilterRequest): Promise<ListWorkflowsResponse> {
		return await AxiosClient.post<ListWorkflowsResponse>(`${this.baseUrl}/search`, payload);
	}

	/**
	 * Get full workflow details (GET /workflows/:workflow_id/:run_id).
	 */
	public static async getDetails(workflowId: string, runId: string): Promise<WorkflowDetailsResponse> {
		return await AxiosClient.get<WorkflowDetailsResponse>(`${this.baseUrl}/${workflowId}/${runId}`);
	}

	/**
	 * Get workflow summary (GET /workflows/:workflow_id/:run_id/summary).
	 */
	public static async getSummary(workflowId: string, runId: string): Promise<WorkflowSummaryResponse> {
		return await AxiosClient.get<WorkflowSummaryResponse>(`${this.baseUrl}/${workflowId}/${runId}/summary`);
	}

	/**
	 * Get workflow timeline (GET /workflows/:workflow_id/:run_id/timeline).
	 */
	public static async getTimeline(workflowId: string, runId: string): Promise<WorkflowTimelineResponse> {
		return await AxiosClient.get<WorkflowTimelineResponse>(`${this.baseUrl}/${workflowId}/${runId}/timeline`);
	}

	/**
	 * Batch fetch workflows (POST /workflows/batch).
	 */
	public static async getBatch(payload: BatchWorkflowsRequest): Promise<BatchWorkflowsResponse> {
		return await AxiosClient.post<BatchWorkflowsResponse>(`${this.baseUrl}/batch`, payload);
	}
}

export default WorkflowApi;
