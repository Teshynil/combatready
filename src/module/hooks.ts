import { getCombats, getGame, MODULE_NAME } from "./settings";
import { CombatReady, volume } from "./combatReady";
import { currentTheme } from "./api";
import { CombatReadyTimer } from "./timers";
import { warn } from "../combatready";
export const initHooks = () => {
    /**
     * Toggle pause
     */
    Hooks.on("pauseGame", function () {
        //@ts-ignore
        if (!getGame().modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - pauseGame hook aborted"); return; }

        if (!(getGame().combat?.started ?? false)) return;
        if (CombatReady.isMasterOfTime(getGame().user)) {
            if (getGame().paused) {
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
        if (!getGame().modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - deleteCombat hook aborted"); return; }

        if (CombatReady.isMasterOfTime(getGame().user)) {
            await CombatReady.timerStop();
        }
        currentTheme.cleanAnimations();
        CombatReady.toggleCheck();
    });

    /**
     * Handle combatant update
     */
    Hooks.on("updateCombatant", function (context, parentId, data) {
        //@ts-ignore
        if (!getGame().modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - updateCombatant hook aborted"); return; }


        const combat = getCombats().get(parentId);
        if (combat) {
            const combatant = combat.data.combatants.find((o) => o.id === data.id);
            if (combatant instanceof Combatant) {
                if (combatant.actor?.hasPlayerOwner) CombatReady.toggleCheck();
            }
        }
    });

    /**
     * Handle combatant delete
     */
    Hooks.on("deleteCombatant", function (context, parentId, data) {
        //@ts-ignore
        if (!getGame().modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - deleteCombatant hook aborted"); return; }


        let combat = getCombats().get(parentId);

        if (combat) {
            currentTheme.cleanAnimations();
        }
        CombatReady.toggleCheck();
    });

    /**
     * Handle combatant added
     */
    Hooks.on("addCombatant", function (context, parentId, data) {
        //@ts-ignore
        if (!getGame().modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - addCombatant hook aborted"); return; }


        let combat = getCombats().get(parentId);
        if (combat instanceof Combat) {
            let combatant = combat.data.combatants.find((o) => o.id === data.id);
            if (combatant instanceof Combatant) {
                if (combatant.actor?.hasPlayerOwner) CombatReady.toggleCheck();
            }
        }
    });

    /**
     * Sidebar collapse hook
     */
    Hooks.on("collapseSidebar", function (a, collapsed) {
        //@ts-ignore
        if (!getGame().modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - collapseSidebar hook aborted"); return; }


        // set width to sidebar offset size
        CombatReady.adjustWidth();
    });

    /**
     * Combat update hook
     */
    Hooks.on("updateCombat", async function (data, delta) {
        //@ts-ignore
        if (!getGame().modules.get(MODULE_NAME)?.api.isActive) { warn("Module not initialized yet - updateCombat hook aborted"); return; }

        if (CombatReady.isMasterOfTime(getGame().user)) {
            if (Object.keys(delta).some((k) => k === "turn")) {
                await CombatReady.timerStop();
            }
            if (Object.keys(delta).some((k) => k === "active")) {
                if (delta["active"] == false) {
                    await CombatReady.timerStop();
                }
            }
        }
        CombatReady.toggleCheck();
        if (Object.keys(delta).some((k) => k === "round")) {
            if (delta["turn"] == 0) {
                CombatReady.nextRound();
            }
        }
    });


}