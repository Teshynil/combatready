import { NativeAnimationTheme, CombatReadyAnimationTheme } from "./themes";
import { getGame, MODULE_NAME } from "./settings";
import { CombatReadyTimer, NativeTimer } from "./timers";
import { SettingsAwareEntity } from "./settingsAwareEntity";

export const availableThemes: Array<CombatReadyAnimationTheme> = [];
export const availableTimers: Array<CombatReadyTimer> = [];
export let currentTheme: CombatReadyAnimationTheme;
export let currentTimer: CombatReadyTimer;
export const CombatReadyApi: { setupTheme: Function, setupTimer: Function } = { setupTheme, setupTimer };

export function initApi() {
    //@ts-ignore
    window.CombatReady = CombatReadyApi;
    setupTheme(new NativeAnimationTheme("native"))
    setupTimer(new NativeTimer("native"));
}
function setupSettings(settingsAwareEntity) {
    if (settingsAwareEntity instanceof SettingsAwareEntity) {
        for (const setting of settingsAwareEntity.settings) {
            setting.setting.config = false
            if (setting.setting.type == "Color") {
                setting.setting.type = String;
            }
            getGame().settings.register(MODULE_NAME, `${settingsAwareEntity.type}.${settingsAwareEntity.id}.setting.${setting.id}`, setting.setting);
        }
    }
}
function setupTheme(theme) {
    if (availableThemes[theme.id] != undefined) {
        throw new Error('You can not register a theme with an id that is already used');
    }
    setupSettings(theme);
    availableThemes[theme.id] = theme;
    (<ClientSettings.CompleteSetting>getGame().settings.settings.get(MODULE_NAME + ".selectedTheme")).default = getDefaultTheme()
    updateAnimation();
}
function setupTimer(timer) {
    if (availableTimers[timer.id] != undefined) {
        throw new Error('You can not register a timer with an id that is already used');
    }
    setupSettings(timer);
    availableTimers[timer.id] = timer;
    (<ClientSettings.CompleteSetting>getGame().settings.settings.get(MODULE_NAME + ".selectedTimer")).default = getDefaultTimer()
    updateTimer();
}
export function getDefaultTheme() {
    const ThemeIds = Object.keys(availableThemes)
    return ThemeIds[0]
}
export function getDefaultTimer() {
    const TimerId = Object.keys(availableTimers)
    return TimerId[0]
}

export async function updateAnimation() {
    const selectedTheme = <String>getGame().settings.get(MODULE_NAME, "selectedTheme")
    //@ts-ignore
    currentTheme = availableThemes[selectedTheme] ?? availableThemes[<String>getGame().settings?.settings?.get(MODULE_NAME + ".selectedTheme").default]
    currentTheme.destroy();

    await getGame().settings.set(MODULE_NAME, "selectedTheme", currentTheme.id);
    currentTheme.initialize();
}
export async function updateTimer() {
    const selectedTimer = <String>getGame().settings.get(MODULE_NAME, "selectedTimer")
    //@ts-ignore
    currentTimer = availableTimers[selectedTimer] ?? availableTimers[<String>getGame().settings?.settings?.get(MODULE_NAME + ".selectedTimer").default]
    currentTimer.destroy();

    await getGame().settings.set(MODULE_NAME, "selectedTimer", currentTimer.id);
    currentTimer.initialize();
}