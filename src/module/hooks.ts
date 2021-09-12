import { getCombats, getGame } from "./settings";
import { CombatReady, volume } from "./combatReady";
export const initHooks = () => {
    /**
     * Toggle pause
     */
    Hooks.on("pauseGame", function () {
        if (getGame().paused) CombatReady.timerPause();
        else CombatReady.timerResume();
    });

    /**
     * Handle combatant removal
     */
    Hooks.on("deleteCombat", function () {
        CombatReady.timerStop();
        CombatReady.stopAnimate();
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
            CombatReady.stopAnimate();
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
    Hooks.on("sidebarCollapse", function (a, collapsed) {
        let sidebar = document.getElementById("sidebar") as HTMLElement;
        let body = document.getElementsByTagName("body")[0] as HTMLElement;
        let banner = body.getElementsByClassName("combatready-container")[0] as HTMLElement;
        let timebar = body.getElementsByClassName("combatready-timebar")[0] as HTMLElement;

        if (collapsed) {
            // set width to 100%
            banner.style.width = "100%";
            timebar.style.width = "100%";
        } else {
            // set width to sidebar offset size
            banner.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;
            timebar.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;
        }
    });

    /**
     * Combat update hook
     */
    Hooks.on("updateCombat", function (data, delta) {
        CombatReady.toggleCheck();

        console.log("update combat", data);

        if (!getGame().user?.isGM && Object.keys(delta).some((k) => k === "round")) {
            AudioHelper.play({
                src: "modules/combatready/sounds/round.wav",
                volume: volume(),
            });
        }
    });


}