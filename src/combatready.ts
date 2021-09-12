import { CombatReady } from "./module/combatReady";
import { addClass, removeClass } from "./module/helpers";
import { initHooks } from "./module/hooks";
import { getGame, registerSettings } from "./module/settings";


/**
 * Ready hook
 */
Hooks.on("ready", function () {
  initHooks();
  CombatReady.init();
  let timemax = (Number)(getGame().settings.get("combatready", "timemax")) ?? 3;
  CombatReady.setTimeMax(timemax * 60);

  //check if it's our turn! since we're ready
  CombatReady.toggleCheck();
});