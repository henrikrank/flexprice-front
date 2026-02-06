const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY_PREFIX = 'planSyncCooldown_';

function getStorageKey(planId: string): string {
	return `${STORAGE_KEY_PREFIX}${planId}`;
}

export function getCooldown(planId: string): { canSync: boolean; cooldownEndsAt: number | null } {
	if (!planId) {
		return { canSync: true, cooldownEndsAt: null };
	}

	const key = getStorageKey(planId);
	try {
		const raw = localStorage.getItem(key);
		if (raw == null) {
			return { canSync: true, cooldownEndsAt: null };
		}

		const timestamp = Number(raw);
		if (Number.isNaN(timestamp)) {
			localStorage.removeItem(key);
			return { canSync: true, cooldownEndsAt: null };
		}

		const elapsed = Date.now() - timestamp;
		if (elapsed >= COOLDOWN_MS) {
			localStorage.removeItem(key);
			return { canSync: true, cooldownEndsAt: null };
		}

		return {
			canSync: false,
			cooldownEndsAt: timestamp + COOLDOWN_MS,
		};
	} catch {
		return { canSync: true, cooldownEndsAt: null };
	}
}

export function setCooldown(planId: string): void {
	if (!planId) return;

	const key = getStorageKey(planId);
	try {
		localStorage.setItem(key, String(Date.now()));
	} catch {
		// ignore storage errors
	}
}

export const PLAN_SYNC_COOLDOWN_MS = COOLDOWN_MS;
