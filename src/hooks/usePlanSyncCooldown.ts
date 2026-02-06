import { useCallback, useEffect, useRef, useState } from 'react';
import { getCooldown, setCooldown, PLAN_SYNC_COOLDOWN_MS } from '@/utils/planSyncCooldown';

export function usePlanSyncCooldown(planId: string | undefined): {
	canSync: boolean;
	cooldownEndsAt: number | null;
	triggerCooldown: () => void;
} {
	const [state, setState] = useState<{ canSync: boolean; cooldownEndsAt: number | null }>(() => getCooldown(planId || ''));
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearTimeoutRef = useCallback(() => {
		if (timeoutRef.current != null) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, []);

	const refreshFromStorage = useCallback((pid: string) => {
		const next = getCooldown(pid);
		setState((prev) => {
			if (prev.canSync === next.canSync && prev.cooldownEndsAt === next.cooldownEndsAt) return prev;
			return { canSync: next.canSync, cooldownEndsAt: next.cooldownEndsAt };
		});
		if (next.canSync || next.cooldownEndsAt == null) return;
		const remaining = Math.max(0, next.cooldownEndsAt - Date.now());
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			refreshFromStorage(pid);
		}, remaining);
	}, []);

	// Init and when planId changes: clear any existing timeout, read from storage, optionally schedule re-check
	useEffect(() => {
		const pid = planId || '';
		clearTimeoutRef();
		if (!pid) {
			setState({ canSync: true, cooldownEndsAt: null });
			return;
		}
		refreshFromStorage(pid);
		return clearTimeoutRef;
	}, [planId, refreshFromStorage, clearTimeoutRef]);

	const triggerCooldown = useCallback(() => {
		if (!planId) return;
		clearTimeoutRef();
		setCooldown(planId);
		const cooldownEndsAt = Date.now() + PLAN_SYNC_COOLDOWN_MS;
		setState({ canSync: false, cooldownEndsAt });
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			refreshFromStorage(planId);
		}, PLAN_SYNC_COOLDOWN_MS);
	}, [planId, clearTimeoutRef, refreshFromStorage]);

	return {
		canSync: state.canSync,
		cooldownEndsAt: state.cooldownEndsAt,
		triggerCooldown,
	};
}
