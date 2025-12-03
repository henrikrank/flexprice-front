import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Loader, Page } from '@/components/atoms';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';
import OAuthApi from '@/api/OAuthApi';

/**
 * QuickBooksOAuthCallback
 *
 * Handles the OAuth callback from QuickBooks after user authorization.
 *
 * NEW SECURE FLOW:
 * 1. QuickBooks redirects here with: code, realmId, state
 * 2. Retrieve session_id from sessionStorage (non-sensitive)
 * 3. Send ALL data to backend via /v1/oauth/complete
 * 4. Backend validates CSRF state, retrieves credentials from cache
 * 5. Backend exchanges code for tokens (NO frontend involvement)
 * 6. Backend encrypts and stores tokens in database
 * 7. Connection created successfully
 *
 * SECURITY:
 * - NO client_secret in frontend (never stored in sessionStorage)
 * - NO access_token in frontend (never exposed)
 * - NO refresh_token in frontend (never exposed)
 * - ONLY session_id stored (non-sensitive, expires in 5 minutes)
 */
const QuickBooksOAuthCallback = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const hasProcessed = useRef(false); // Prevent double processing

	// Parse OAuth callback parameters
	const code = searchParams.get('code');
	const realmId = searchParams.get('realmId');
	const state = searchParams.get('state');
	const errorParam = searchParams.get('error');

	// Retrieve ONLY session_id from sessionStorage (non-sensitive)
	const sessionId = sessionStorage.getItem('qb_oauth_session_id');

	// Debug logging (safe - no sensitive data)
	useEffect(() => {
		console.log('🔍 QuickBooks OAuth Callback:', {
			hasCode: !!code,
			hasRealmId: !!realmId,
			hasState: !!state,
			hasSessionId: !!sessionId,
			hasError: !!errorParam,
			hasProcessed: hasProcessed.current,
		});
	}, [code, realmId, state, sessionId, errorParam]);

	// Handle OAuth errors
	useEffect(() => {
		if (hasProcessed.current) {
			return;
		}

		if (errorParam) {
			setError(`OAuth error: ${errorParam}`);
			toast.error(`QuickBooks authorization failed: ${errorParam}`);
			setTimeout(() => {
				navigate('/tools/integrations/quickbooks');
			}, 3000);
			return;
		}

		if (!code || !realmId || !state) {
			setError('Missing required OAuth parameters');
			toast.error('QuickBooks authorization failed: Missing required parameters');
			setTimeout(() => {
				navigate('/tools/integrations/quickbooks');
			}, 3000);
			return;
		}

		if (!sessionId) {
			setError('Session expired or not found');
			toast.error('OAuth session expired. Please try connecting again.');
			setTimeout(() => {
				navigate('/tools/integrations/quickbooks');
			}, 3000);
			return;
		}
	}, [code, realmId, state, sessionId, errorParam, navigate]);

	// Complete OAuth flow via backend
	const { mutate: completeOAuth, isPending } = useMutation({
		mutationFn: async () => {
			if (!code || !realmId || !state || !sessionId) {
				throw new Error('Missing required parameters');
			}

			// Send to backend - backend handles EVERYTHING securely:
			// - Validates CSRF state
			// - Retrieves encrypted credentials from cache
			// - Exchanges code for tokens
			// - Encrypts tokens
			// - Stores in database
			// - Deletes cache session
			return await OAuthApi.CompleteOAuth({
				provider: 'quickbooks',
				session_id: sessionId,
				code: code,
				realm_id: realmId,
				state: state,
			});
		},
		onSuccess: (response) => {
			// Clean up sessionStorage
			sessionStorage.removeItem('qb_oauth_session_id');

			console.log('✅ QuickBooks connection created:', {
				connection_id: response.connection_id,
			});

			toast.success('QuickBooks connected successfully!');
			navigate('/tools/integrations/quickbooks');
		},
		onError: (error: unknown) => {
			// Clean up sessionStorage on error
			sessionStorage.removeItem('qb_oauth_session_id');

			const errorMessage = error instanceof Error ? error.message : 'Failed to complete OAuth';
			setError(errorMessage);
			toast.error(errorMessage);
			setTimeout(() => {
				navigate('/tools/integrations/quickbooks');
			}, 3000);
		},
	});

	// Trigger OAuth completion when component mounts and validation passes
	useEffect(() => {
		if (code && realmId && state && sessionId && !errorParam && !isPending && !error && !hasProcessed.current) {
			hasProcessed.current = true; // Mark as processed
			console.log('✅ Starting OAuth completion');
			completeOAuth();
		}
	}, [code, realmId, state, sessionId, errorParam, completeOAuth, isPending, error]);

	// Error state
	if (error) {
		return (
			<Page>
				<div className='flex flex-col items-center justify-center min-h-[400px]'>
					<div className='text-red-600 text-lg font-semibold mb-2'>❌ Authorization Failed</div>
					<div className='text-gray-600 mb-4'>{error}</div>
					<div className='text-sm text-gray-500'>Redirecting back to integrations...</div>
				</div>
			</Page>
		);
	}

	// Loading state
	return (
		<Page>
			<div className='flex flex-col items-center justify-center min-h-[400px]'>
				<Loader />
				<div className='mt-4 text-gray-600'>Completing QuickBooks authorization...</div>
				<div className='mt-2 text-sm text-gray-500'>🔒 Securely exchanging authorization code for tokens</div>
			</div>
		</Page>
	);
};

export default QuickBooksOAuthCallback;
