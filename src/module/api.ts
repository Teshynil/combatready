import { NativeAnimationTheme, CombatReadyAnimationTheme } from "./themes";
import { getGame, MODULE_NAME } from "./settings";

export const availableThemes: Array<CombatReadyAnimationTheme> = []
export let currentTheme: CombatReadyAnimationTheme;

export function initApi() {
    const CombatReadyTheme = new NativeAnimationTheme("native")
    setupTheme(CombatReadyTheme)
    setupTheme(new NativeAnimationTheme("testeo"))
}
function setupTheme(theme) {
    if (theme instanceof CombatReadyAnimationTheme) {
        for (const setting of theme.settings) {
            setting.setting.config = false
            if (setting.setting.type == "Color") {
                //@ts-ignore
                new window.Ardittristan.ColorSetting(MODULE_NAME, `themes.${theme.id}.setting.${setting.id}`, setting.setting);
            } else {
                getGame().settings.register(MODULE_NAME, `themes.${theme.id}.setting.${setting.id}`, setting.setting)
            }
        }
    }

    availableThemes[theme.id] = theme;
    (<ClientSettings.CompleteSetting>getGame().settings.settings.get(MODULE_NAME + ".selectedTheme")).default = getDefaultTheme()
    updateAnimation();
}
export function getDefaultTheme() {
    const ThemeIds = Object.keys(availableThemes)
    return ThemeIds[0]
}

export function updateAnimation() {
    const selectedTheme = <String>getGame().settings.get(MODULE_NAME, "selectedTheme")
    try {
        currentTheme.destroy();
    } catch (error) {
    }
    //@ts-ignore
    currentTheme = availableThemes[selectedTheme] ?? availableThemes[<String>getGame().settings?.settings?.get(MODULE_NAME + ".themes").default]

    currentTheme.initialize();
}