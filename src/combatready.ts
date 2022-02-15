import { CombatReadyTimer } from "./module/timers";
import { CombatReadyAnimationTheme } from "./module/themes";
import { CombatReadyApi, initApi, updateAnimation, updateTimer } from "./module/api";
import { CombatReady } from "./module/combatReady";
import { initHooks } from "./module/hooks";
import { getGame, MODULE_NAME, registerSettings } from "./module/settings";

export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3
export const debug = (...args) => {
  if (debugEnabled > 1) console.log(`DEBUG:${MODULE_NAME} | `, ...args);
};
export const log = function (...args) {
  console.log(`${MODULE_NAME} | `, ...args);
};
export const warn = (...args) => {
  if (debugEnabled > 0) console.warn(`${MODULE_NAME} | `, ...args);
};
export const error = (...args) => console.error(`${MODULE_NAME} | `, ...args);
export const timelog = (...args) => warn(`${MODULE_NAME} | `, Date.now(), ...args);

Hooks.once('socketlib.ready', () => {
  log("Register module to SocketLib");
  //@ts-ignore
  CombatReady.SOCKET = socketlib.registerModule(MODULE_NAME);
  CombatReady.SOCKET.register('timerTick', CombatReady.timerTick);
  CombatReady.SOCKET.register('timerStart', CombatReady.timerStart);
  CombatReady.SOCKET.register('timerStop', CombatReady.timerStop);
  CombatReady.SOCKET.register('timerPause', CombatReady.timerPause);
  CombatReady.SOCKET.register('timerResume', CombatReady.timerResume);
});
Hooks.once("init", () => {
});
/**
 * Ready hook
 */
Hooks.on("ready", function () {
  log("Registering Settings");
  registerSettings();
  log("Initializing API");
  initApi();
  log("Dependencies verification");
  //@ts-ignore
  try { window.Ardittristan.ColorSetting.tester } catch {
    ui?.notifications?.notify('Please make sure you have the "lib - ColorSettings" module installed and enabled.', "error");
    error(`ColorSettings is needed in order to work - ending initialization`);
    return;
  }

  log("Registering Main Hooks");
  initHooks();
  log("Calling Hook combatready.ready");
  Hooks.callAll("combatready.ready", CombatReadyAnimationTheme, CombatReadyTimer);
  let masteroftime = <string>getGame().settings.get(MODULE_NAME, "masteroftime");
  if (getGame().users?.find((user) => user.active && user.id == masteroftime) == undefined) {//Master of time not found seting first gm on list of connected players
    masteroftime = getGame().users?.find((user) => user.active && user.isGM)?.id ?? "";
    if (masteroftime !== "") {
      getGame().settings.set(MODULE_NAME, "masteroftime", masteroftime);
    } else {
      ui?.notifications?.notify('Please make sure there is a GM connected and reload the page.', "error");
      return;
    }
  }
  CombatReady.MASTEROFTIME = masteroftime;
  //if master of time connected do noting all is good
  updateAnimation();
  updateTimer();
  CombatReady.init();
  log("Initializing Timer");
  let timemax = (Number)(getGame().settings.get(MODULE_NAME, "timemax")) ?? 3;
  CombatReady.setTimeMax(timemax * 60);
  //check if it's our turn! since we're ready
  CombatReady.toggleCheck();
  //@ts-ignore
  if (getGame().modules.get(MODULE_NAME)?.api??false) {
    //@ts-ignore
    getGame().modules.get(MODULE_NAME).api.isActive = true;
  }
});
//@ts-ignore
const gmodule = await import(`../../../../${ROUTE_PREFIX}/scripts/greensock/esm/all.js`);
export const gsap = gmodule.gsap;