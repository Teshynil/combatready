import { getCombats, MODULE_NAME } from "./settings";
import { CombatReady, volume } from "./combatReady";
import { currentAnimation } from "./api";
import { CombatReadyTimer } from "./timers";
import { log, warn } from "../combatready";
export const initHooks = () => {
	/**
	 * Toggle pause
	 */
	Hooks.on("pauseGame", function () {
		//@ts-ignore
		if (!game.modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - pauseGame hook aborted"); return; }

		if (!(game.combat?.started ?? false)) return;
		if (CombatReady.isMasterOfTime(game.user)) {
			if (game.paused) {
				CombatReady.timerPause();
			}
			else {
				CombatReady.timerResume();
			}
		}
	});

	/**
	 * Handle combatant removal
	 */
	Hooks.on("deleteCombat", async function () {
		//@ts-ignore
		if (!game.modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - deleteCombat hook aborted"); return; }

		if (CombatReady.isMasterOfTime(game.user)) {
			await CombatReady.timerStop();
		}
		debouncedCheck(false);
	});

	/**
	 * Handle combatant update
	 */
	Hooks.on("updateCombatant", function (combatant: Combatant, change, options, userId) {
		//@ts-ignore
		if (!game.modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - updateCombatant hook aborted"); return; }

		const combat = combatant.combat;
		if (combat) {
			debouncedCheck(false);
		}
	});

	/**
	 * Handle combatant delete
	 */
	Hooks.on("deleteCombatant", function (combatant: Combatant, options, userId) {
		//@ts-ignore
		if (!game.modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - deleteCombatant hook aborted"); return; }
		let combat = combatant.combat;
		if (combat) {
			debouncedCheck(false);
		}
	});

	/**
	 * Sidebar collapse hook
	 */
	Hooks.on("collapseSidebar", function (a, collapsed) {
		//@ts-ignore
		if (!game.modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - collapseSidebar hook aborted"); return; }


		// set width to sidebar offset size
		CombatReady.adjustWidth();
	});

	/**
	 * Combat update hook
	 */
	Hooks.on("updateCombat", async function (data, delta) {
		//@ts-ignore
		if (!game.modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - updateCombat hook aborted"); return; }
		let updateAnimations = false;
		let newRound = false;
		if (Object.keys(delta).some((k) => k === "round")) {
			if (delta["turn"] == 0) {
				newRound = true;
				updateAnimations = true;
			}
		}
		if (Object.keys(delta).some((k) => k === "active")) {
			updateAnimations = true;
		}
		if (Object.keys(delta).some((k) => k === "turn")) {
			updateAnimations = true;
		}
		if (CombatReady.isMasterOfTime(game.user)) {
			if (Object.keys(delta).some((k) => k === "turn")) {
				await CombatReady.timerStop();
			}
			if (Object.keys(delta).some((k) => k === "active")) {
				if (delta["active"] == false) {
					await CombatReady.timerStop();
				} else {
					await CombatReady.timerStart();
				}
			}
		}
		if (updateAnimations) {
			log("Debouncing Animation update");
			debouncedCheck(newRound);
		}
	});

	Hooks.on("closeAnimationSubSettings",function (event){
        currentAnimation.cleanAnimations();
		document.querySelector("combatready-testcover")?.remove();
    });

	var debouncedCheck = debounce((newRound: Boolean) => {
		log("Executing Animation update");
		CombatReady.toggleCheck(newRound);
	}, 1000);
}