import { CombatReady } from "./module/combatReady";
import { addClass, removeClass } from "./module/helpers";
import { initHooks } from "./module/hooks";
import { getGame, registerSettings } from "./module/settings";


/**
 * Ready hook
 */
Hooks.on("ready", function () {
  //@ts-ignore
  try { window.Ardittristan.ColorSetting.tester } catch {
    ui?.notifications?.notify('Please make sure you have the "lib - ColorSettings" module installed and enabled.', "error");
  }
  initHooks();
  CombatReady.init();
  let timemax = (Number)(getGame().settings.get("combatready", "timemax")) ?? 3;
  CombatReady.setTimeMax(timemax * 60);

  //check if it's our turn! since we're ready
  CombatReady.toggleCheck();
});