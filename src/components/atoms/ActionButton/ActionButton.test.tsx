import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import toast from 'react-hot-toast';
import ActionButton from './ActionButton';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
	default: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock('@/core/services/tanstack/ReactQueryProvider', () => ({
	refetchQueries: vi.fn(),
}));

// Mock Supabase and auth services
vi.mock('@/core/services/supbase/config', () => ({
	default: {},
}));

vi.mock('@/core/auth/AuthService', () => ({
	default: {},
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: {
				retry: false,
			},
		},
	});

	return (
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>{children}</BrowserRouter>
		</QueryClientProvider>
	);
};

// Mock delete function
const mockDeleteMutationFn = vi.fn();

const defaultProps = {
	id: 'test-id',
	deleteMutationFn: mockDeleteMutationFn,
	refetchQueryKey: 'test-query',
	entityName: 'Test Entity',
};

describe('ActionButton Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render the trigger button', () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			expect(triggerButton).toBeInTheDocument();
		});

		it('should render with custom trigger icon', () => {
			const customIcon = <span data-testid='custom-icon'>Custom</span>;

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} triggerIcon={customIcon} />
				</TestWrapper>,
			);

			expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
		});
	});

	describe('Dropdown Menu Items', () => {
		it('should render edit action when enabled', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} edit={{ enabled: true, text: 'Edit Item' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Edit Item')).toBeInTheDocument();
			});
		});

		it('should render archive action when enabled', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete Item' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Delete Item')).toBeInTheDocument();
			});
		});

		it('should render custom actions', async () => {
			const customActions = [
				{ text: 'Custom Action 1', onClick: vi.fn(), enabled: true },
				{ text: 'Custom Action 2', onClick: vi.fn(), enabled: true },
			];

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} customActions={customActions} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Custom Action 1')).toBeInTheDocument();
				expect(screen.getByText('Custom Action 2')).toBeInTheDocument();
			});
		});

		it('should not render disabled actions', async () => {
			render(
				<TestWrapper>
					<ActionButton
						{...defaultProps}
						edit={{ enabled: false, text: 'Edit Item' }}
						archive={{ enabled: false, text: 'Delete Item' }}
						customActions={[{ text: 'Custom Action', onClick: vi.fn(), enabled: false }]}
					/>
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
				expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
				expect(screen.queryByText('Custom Action')).not.toBeInTheDocument();
			});
		});
	});

	describe('Edit Action', () => {
		it('should call onClick when edit action is clicked', async () => {
			const onEditClick = vi.fn();

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} edit={{ enabled: true, onClick: onEditClick }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const editButton = screen.getByText('Edit');
				fireEvent.click(editButton);
			});

			expect(onEditClick).toHaveBeenCalledTimes(1);
		});

		it('should navigate when edit path is provided', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} edit={{ enabled: true, path: '/edit/123' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const editButton = screen.getByText('Edit');
				fireEvent.click(editButton);
			});

			expect(mockNavigate).toHaveBeenCalledWith('/edit/123');
		});
	});

	describe('Archive/Delete Action', () => {
		it('should open confirmation dialog when archive action is clicked', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			await waitFor(() => {
				expect(screen.getByText('Are you sure you want to delete this Test Entity?')).toBeInTheDocument();
			});
		});

		it('should call delete mutation when confirmed', async () => {
			mockDeleteMutationFn.mockResolvedValue(undefined);

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			// Open dropdown and click delete
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			// Confirm in dialog
			await waitFor(() => {
				const confirmButton = screen.getByRole('button', { name: 'Delete' });
				fireEvent.click(confirmButton);
			});

			await waitFor(() => {
				expect(mockDeleteMutationFn).toHaveBeenCalledWith('test-id', expect.any(Object));
			});
		});

		it('should show success toast on successful deletion', async () => {
			mockDeleteMutationFn.mockResolvedValue(undefined);

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Archive' }} />
				</TestWrapper>,
			);

			// Trigger delete flow
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const archiveButton = screen.getByText('Archive');
				fireEvent.click(archiveButton);
			});

			await waitFor(() => {
				const confirmButton = screen.getByRole('button', { name: 'Archive' });
				fireEvent.click(confirmButton);
			});

			await waitFor(() => {
				expect(toast.success).toHaveBeenCalledWith('Successfully archived Test Entity');
			});
		});

		it('should show error toast on deletion failure', async () => {
			const error = { error: { message: 'Delete failed' } };
			mockDeleteMutationFn.mockRejectedValue(error);

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			// Trigger delete flow
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			await waitFor(() => {
				const confirmButton = screen.getByRole('button', { name: 'Delete' });
				fireEvent.click(confirmButton);
			});

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith('Delete failed');
			});
		});

		it('should not show toast when disableToast is true', async () => {
			mockDeleteMutationFn.mockResolvedValue(undefined);

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} disableToast={true} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			// Trigger delete flow
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			await waitFor(() => {
				const confirmButton = screen.getByRole('button', { name: 'Delete' });
				fireEvent.click(confirmButton);
			});

			await waitFor(() => {
				expect(toast.success).not.toHaveBeenCalled();
			});
		});
	});

	describe('Custom Actions', () => {
		it('should call onClick when custom action is clicked', async () => {
			const customOnClick = vi.fn();
			const customActions = [{ text: 'Custom Action', onClick: customOnClick, enabled: true }];

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} customActions={customActions} />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const customButton = screen.getByText('Custom Action');
				fireEvent.click(customButton);
			});

			expect(customOnClick).toHaveBeenCalledTimes(1);
		});
	});

	describe('Legacy Props Support', () => {
		it('should support legacy edit props', async () => {
			const onEdit = vi.fn();

			render(
				<TestWrapper>
					<ActionButton {...defaultProps} editPath='/edit/123' onEdit={onEdit} editText='Legacy Edit' />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const editButton = screen.getByText('Legacy Edit');
				fireEvent.click(editButton);
			});

			expect(onEdit).toHaveBeenCalledTimes(1);
		});

		it('should support legacy archive props', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archiveText='Legacy Archive' />
				</TestWrapper>,
			);

			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				expect(screen.getByText('Legacy Archive')).toBeInTheDocument();
			});
		});
	});

	describe('Dialog Behavior', () => {
		it('should close dialog when cancel is clicked', async () => {
			render(
				<TestWrapper>
					<ActionButton {...defaultProps} archive={{ enabled: true, text: 'Delete' }} />
				</TestWrapper>,
			);

			// Open dialog
			const triggerButton = screen.getByRole('button');
			fireEvent.click(triggerButton);

			await waitFor(() => {
				const deleteButton = screen.getByText('Delete');
				fireEvent.click(deleteButton);
			});

			await waitFor(() => {
				expect(screen.getByText('Are you sure you want to delete this Test Entity?')).toBeInTheDocument();
			});

			// Click cancel
			const cancelButton = screen.getByRole('button', { name: 'Cancel' });
			fireEvent.click(cancelButton);

			await waitFor(() => {
				expect(screen.queryByText('Are you sure you want to delete this Test Entity?')).not.toBeInTheDocument();
			});
		});
	});
});
