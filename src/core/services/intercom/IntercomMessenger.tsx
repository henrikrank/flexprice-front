import { useEffect, useRef, useCallback } from 'react';
import Intercom from '@intercom/messenger-js-sdk';
import './index.css';
import { BotMessageSquare } from 'lucide-react';
import { Button } from '@/components/atoms';
import { getCommandPaletteActionEventName, CommandPaletteActionId } from '@/core/actions';
import useUser from '@/hooks/useUser';
import { useQuery, useMutation } from '@tanstack/react-query';
import TenantApi from '@/api/TenantApi';
import { TenantMetadataKey } from '@/models/Tenant';
import { toast } from 'react-hot-toast';
import { refetchQueries } from '../tanstack/ReactQueryProvider';

// mseconds * seconds * minutes
const INACTIVITY_TIMEOUT = 1000 * 60 * 15; // 15 minutes

const IntercomMessenger = () => {
	const { user } = useUser();
	const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
	const isInitialized = useRef(false);
	const isIntercomOpen = useRef(false);
	const hideEventTriggered = useRef(false);

	const openIntercom = useCallback(() => {
		// @ts-expect-error - Intercom types don't include messenger
		window.Intercom('show');
		isIntercomOpen.current = true;
		hideEventTriggered.current = false;
	}, []);

	// Open from command palette (Cmd+K → Open Intercom)
	useEffect(() => {
		const eventName = getCommandPaletteActionEventName(CommandPaletteActionId.OpenIntercom);
		const handler = () => openIntercom();
		window.addEventListener(eventName, handler);
		return () => window.removeEventListener(eventName, handler);
	}, [openIntercom]);

	const { data: tenant, isLoading: isTenantLoading } = useQuery({
		queryKey: ['tenant'],
		queryFn: async () => {
			return await TenantApi.getTenantById(user?.tenant?.id ?? '');
		},
		enabled: !!user?.tenant?.id,
	});

	// Mutation to update tenant when user closes Intercom
	const { mutate: updateTenantOnIntercomClose } = useMutation({
		mutationFn: () =>
			TenantApi.updateTenant({
				name: tenant?.name || '',
				metadata: {
					...tenant?.metadata,
					[TenantMetadataKey.ONBOARDING_COMPLETED]: 'true',
				},
			}),
		onSuccess: async () => {
			// Refetch user data to update the UI
			await refetchQueries(['user', 'tenant']);
			toast.success("Welcome! You've been marked as onboarded.");
		},
		onError: (error: any) => {
			console.error('Failed to mark user as onboarded:', error);
			toast.error('Failed to update onboarding status. Please try again.');
		},
	});

	// Handle Intercom events
	const handleIntercomHide = useCallback(() => {
		if (hideEventTriggered.current) return; // Prevent multiple calls

		hideEventTriggered.current = true;
		isIntercomOpen.current = false;

		// Check if user hasn't completed onboarding
		const onboardingMetadata = tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
		const onboardingCompleted = onboardingMetadata === 'true';

		if (!onboardingCompleted && user && tenant) {
			// Mark user as onboarded when they close Intercom
			updateTenantOnIntercomClose();
		}

		// Add your custom actions here
		// For example:
		// - Track analytics event
		// - Update user preferences
		// - Show a follow-up message
		// - Reset inactivity timer
		// - etc.

		// Example: Track that user closed the messenger
		if (typeof window !== 'undefined' && (window as any).gtag) {
			(window as any).gtag('event', 'intercom_messenger_closed', {
				user_id: user?.id,
				tenant_id: user?.tenant?.id,
				onboarding_completed: onboardingCompleted,
			});
		}

		// Example: Store in localStorage that user has seen the messenger
		if (typeof window !== 'undefined') {
			localStorage.setItem('intercom_messenger_seen', 'true');
		}

		// Example: You could also trigger other actions
		// like showing a different UI element or updating state
	}, [user, tenant, updateTenantOnIntercomClose]);

	const handleIntercomShow = useCallback(() => {
		isIntercomOpen.current = true;
		hideEventTriggered.current = false;

		// Add your custom actions here when messenger is shown
		// For example:
		// - Track that user opened messenger
		// - Update analytics
		// - etc.

		if (typeof window !== 'undefined' && (window as any).gtag) {
			(window as any).gtag('event', 'intercom_messenger_opened', {
				user_id: user?.id,
				tenant_id: user?.tenant?.id,
			});
		}
	}, [user]);

	// Poll for Intercom state changes
	useEffect(() => {
		if (!isInitialized.current) return;

		const checkIntercomState = () => {
			try {
				// @ts-expect-error - Intercom types don't include messenger
				const isVisible = window.Intercom('isVisible');

				if (isVisible && !isIntercomOpen.current) {
					// Intercom was opened
					handleIntercomShow();
				} else if (!isVisible && isIntercomOpen.current && !hideEventTriggered.current) {
					// Intercom was closed
					handleIntercomHide();
				}
			} catch (error) {
				// Intercom might not be ready yet
			}
		};

		const interval = setInterval(checkIntercomState, 1000); // Check every second

		return () => {
			clearInterval(interval);
		};
	}, [handleIntercomShow, handleIntercomHide]);

	// Initialize Intercom with user data
	useEffect(() => {
		if (!user || isInitialized.current) return;

		Intercom({
			app_id: 'yprjoygg',
			user_id: user.id,
			name: user.tenant?.name,
			email: user.email,
			created_at: user.tenant?.created_at ? new Date(user.tenant.created_at).getTime() : undefined,
			hide_default_launcher: true,
		});

		isInitialized.current = true;

		// Add event listeners for Intercom events
		const handleMessage = (event: MessageEvent) => {
			if (event.data && typeof event.data === 'object') {
				// Handle Intercom events
				if (event.data.type === 'intercom:hide' || event.data.type === 'hide') {
					handleIntercomHide();
				} else if (event.data.type === 'intercom:show' || event.data.type === 'show') {
					handleIntercomShow();
				}
			}
		};

		window.addEventListener('message', handleMessage);

		// Cleanup
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [user, handleIntercomHide, handleIntercomShow]);

	// Create resetTimer callback outside useEffect
	const resetTimer = useCallback(() => {
		// Clear existing timer
		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
		}

		// Set new timer if onboarding is not completed (metadata is null, field doesn't exist, or isn't 'true')
		const onboardingMetadata = tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
		const onboardingCompleted = onboardingMetadata === 'true';

		if (!onboardingCompleted) {
			inactivityTimer.current = setTimeout(() => {
				openIntercom();
			}, INACTIVITY_TIMEOUT);
		}
	}, [tenant?.metadata, openIntercom]);

	// Handle inactivity timer for onboarding users
	useEffect(() => {
		// Clear any existing timer first
		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
			inactivityTimer.current = null;
		}

		// Don't set up timer if:
		// 1. User is not loaded
		// 2. Tenant is still loading
		if (!user || isTenantLoading) {
			return;
		}

		// Check onboarding status - show timer if metadata is null, field doesn't exist, or isn't 'true'
		const onboardingMetadata = tenant?.metadata?.[TenantMetadataKey.ONBOARDING_COMPLETED];
		const onboardingCompleted = onboardingMetadata === 'true';

		// Show timer if:
		// 1. Metadata is null/undefined
		// 2. Onboarding field doesn't exist in metadata
		// 3. Onboarding field exists but isn't set to 'true'
		if (onboardingCompleted) {
			return;
		}
		const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart'];

		// Add event listeners
		activityEvents.forEach((event) => {
			window.addEventListener(event, resetTimer, { passive: true });
		});

		// Start initial timer
		resetTimer();

		// Cleanup function
		return () => {
			// Clear timer
			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
				inactivityTimer.current = null;
			}

			// Remove event listeners
			activityEvents.forEach((event) => {
				window.removeEventListener(event, resetTimer);
			});
		};
	}, [user, tenant?.metadata, isTenantLoading, resetTimer]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
				inactivityTimer.current = null;
			}
		};
	}, []);

	return (
		<Button size='sm' variant='outline' onClick={openIntercom}>
			<BotMessageSquare absoluteStrokeWidth />
			Help
		</Button>
	);
};

export default IntercomMessenger;
