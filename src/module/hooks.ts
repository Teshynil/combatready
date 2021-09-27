import { getCombats, getGame, MODULE_NAME } from "./settings";
import { CombatReady, volume } from "./combatReady";
import { currentTheme } from "./api";
export const initHooks = () => {
    /**
     * Toggle pause
     */
    Hooks.on("pauseGame", function () {
        if (getGame().combats?.active == undefined) return;
        if (getGame().paused) {
            CombatReady.timerPause();
        }
        else {
            CombatReady.timerResume();
        }
    });

    /**
     * Handle combatant removal
     */
    Hooks.on("deleteCombat", async function () {
        await CombatReady.timerStop();
        currentTheme.cleanAnimations();
        CombatReady.toggleCheck();
    });

    /**
     * Handle combatant update
     */
    Hooks.on("updateCombatant", function (context, parentId, data) {
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
        // set width to sidebar offset size
        CombatReady.adjustWidth();
    });

    /**
     * Combat update hook
     */
    Hooks.on("updateCombat", async function (data, delta) {
        if (Object.keys(delta).some((k) => k === "turn")) {
            await CombatReady.timerStop();
        }
        CombatReady.toggleCheck();

        console.log("update combat", data);

        if (Object.keys(delta).some((k) => k === "round")) {
            if (delta["turn"] == 0) {
                CombatReady.nextRound();
            }
        }
    });


}