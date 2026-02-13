import { Pagination } from '@/models';
import type { TypedBackendFilter, TypedBackendSort } from '@/types/formatters/QueryBuilder';

/** Workflow execution summary (list item from POST /workflows/search) */
export interface WorkflowExecutionDTO {
	workflow_id: string;
	run_id: string;
	workflow_type: string;
	task_queue: string;
	status?: string;
	entity?: string;
	entity_id?: string;
	start_time: string;
	close_time?: string;
	duration_ms?: number;
	total_duration?: string;
	created_by?: string;
}

export interface WorkflowExecutionFilterRequest {
	limit?: number;
	offset?: number;
	filters?: TypedBackendFilter[];
	sort?: TypedBackendSort[];
}

/** Response for POST /workflows/search */
export interface ListWorkflowsResponse {
	items: WorkflowExecutionDTO[];
	pagination: Pagination;
}

/** Activity execution within a workflow */
export interface WorkflowActivityDTO {
	activity_id: string;
	activity_type: string;
	status: string;
	start_time?: string;
	close_time?: string;
	duration_ms?: number;
	retry_attempt: number;
	error?: ActivityErrorDTO;
}

/** Activity error details */
export interface ActivityErrorDTO {
	message: string;
	type: string;
}

/** Timeline event/item */
export interface WorkflowTimelineItemDTO {
	id: string;
	group: string;
	content: string;
	start: string;
	end?: string;
	status?: string;
	event_type?: string;
}

/** Full details for GET /workflows/:workflow_id/:run_id */
export interface WorkflowDetailsResponse {
	workflow_id: string;
	run_id: string;
	workflow_type: string;
	status: string;
	start_time: string;
	close_time?: string;
	duration_ms?: number;
	total_duration?: string;
	task_queue: string;
	history_size: number;
	activities: WorkflowActivityDTO[];
	timeline?: WorkflowTimelineItemDTO[];
	metadata?: Record<string, unknown>;
}

/** Summary for GET /workflows/:workflow_id/:run_id/summary */
export interface WorkflowSummaryResponse {
	workflow_id: string;
	run_id: string;
	workflow_type: string;
	status: string;
	start_time: string;
	close_time?: string;
	duration_ms?: number;
	total_duration?: string;
	activity_count: number;
	failed_activities: number;
}

/** Timeline for GET /workflows/:workflow_id/:run_id/timeline */
export interface WorkflowTimelineResponse {
	workflow_id: string;
	run_id: string;
	start_time: string;
	close_time?: string;
	items: WorkflowTimelineItemDTO[];
}

/** Identifies a workflow execution (workflow_id + run_id) */
export interface WorkflowIdentifier {
	workflow_id: string;
	run_id: string;
}

/** Request body for POST /workflows/batch */
export interface BatchWorkflowsRequest {
	workflows: WorkflowIdentifier[];
	include_activities: boolean;
}

/** Response for POST /workflows/batch */
export interface BatchWorkflowsResponse {
	workflows: WorkflowDetailsResponse[];
}
