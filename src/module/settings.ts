import { each, extend } from "jquery";
import { CombatReadyAnimationTheme } from "./themes";
import { getDefaultTheme, updateAnimation, currentTheme, availableThemes } from "./api";
import { CombatReady } from "./combatReady";
import { addClass, removeClass } from "./helpers";
export const MODULE_NAME = "combatready";

export function getCanvas(): Canvas {
    if (!(canvas instanceof Canvas) || !canvas.ready) {
        throw new Error('Canvas Is Not Initialized');
    }
    return canvas;
}

export function getGame(): Game {
    if (!(game instanceof Game)) {
        throw new Error('Game Is Not Initialized');
    }
    return game;
}

export function getCombats(): CombatEncounters {
    if (!(getGame().combats instanceof CombatEncounters)) {
        throw new Error('CombatEncounters Is Not Initialized');
    }
    return <CombatEncounters>getGame().combats;
}

export const registerSettings = () => {
    // This setting will be modified by the api if modules register to it
    getGame().settings.register(MODULE_NAME, "selectedTheme", {
        scope: "world",
        config: false,
        type: String,
        default: getDefaultTheme(),
        onChange: updateAnimation,
    })
    getGame().settings.registerMenu(MODULE_NAME, "themeSettings", {
        name: "combatReady.settings.themes.themeSettings.name",
        hint: "combatReady.settings.themes.themeSettings.hint",
        label: "combatReady.settings.themes.themeSettings.button",
        icon: "fas fa-magic",
        type: ThemeSettings,
        restricted: true,
    })
    getGame().settings.register(MODULE_NAME, "timemax", {
        name: "combatReady.settings.timeMax.name",
        hint: "combatReady.settings.timeMax.hint",
        scope: "world",
        config: true,
        default: 3,
        type: Number,
        onChange: (value) => {
            let val = Number(value);
            if (isNaN(val) || val <= 0) {
                getGame().settings.set(MODULE_NAME, "timemax", 3);
                return;
            }
            if (val > 30) {
                getGame().settings.set(MODULE_NAME, "timemax", 30);
                return;
            }
            CombatReady.setTimeMax(val * 60);
        },
    });
    getGame().settings.register(MODULE_NAME, "disablenextup", {
        name: "combatReady.settings.disableNextUp.name",
        hint: "combatReady.settings.disableNextUp.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    //@ts-ignore
    new window.Ardittristan.ColorSetting(MODULE_NAME, "timercolor", {
        name: "combatReady.settings.timerColor.name",
        hint: "combatReady.settings.timerColor.hint",
        label: "Color Picker",
        restricted: true,
        defaultColor: "#B71703ff",
        scope: "world",
        onChange: (value) => { CombatReady.TIMEFILL.style.backgroundColor = value }
    });
    getGame().settings.register(MODULE_NAME, "timebarlocation", {
        name: "combatReady.settings.timeBarLocation.name",
        hint: "combatReady.settings.timeBarLocation.hint",
        scope: "world",
        config: true,
        default: "bottom",
        choices: {
            "top": "combatReady.settings.text.top",
            "sidebar": "combatReady.settings.text.sidebar",
            "bottom": "combatReady.settings.text.bottom"
        },
        type: String,
        onChange: (value) => {
            removeClass(CombatReady.TIMEBAR, "combatready-timebar-top");
            removeClass(CombatReady.TIMEBAR, "combatready-timebar-sidebar");
            removeClass(CombatReady.TIMEBAR, "combatready-timebar-bottom");
            addClass(CombatReady.TIMEBAR, "combatready-timebar-" + value);
            CombatReady.adjustWidth();
        }
    });
    getGame().settings.register(MODULE_NAME, "disablenextuponlastturn", {
        name: "combatReady.settings.disableNextUpOnLastTurn.name",
        hint: "combatReady.settings.disableNextUpOnLastTurn.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "disabletimer", {
        name: "combatReady.settings.disableTimer.name",
        hint: "combatReady.settings.disableTimer.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "disabletimerGM", {
        name: "combatReady.settings.disableTimerGM.name",
        hint: "combatReady.settings.disableTimerGM.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "endturndialog", {
        name: "combatReady.settings.showEndTurnDialog.name",
        hint: "combatReady.settings.showEndTurnDialog.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "wrapitupdialog", {
        name: "combatReady.settings.showWrapItUpDialog.name",
        hint: "combatReady.settings.showWrapItUpDialog.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "autoendontimer", {
        name: "combatReady.settings.autoEndOnTimer.name",
        hint: "combatReady.settings.autoEndOnTimer.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "ticksound", {
        name: "combatReady.settings.tickSound.name",
        hint: "combatReady.settings.tickSound.hint",
        scope: "world",
        config: true,
        choices: {
            "Everyone": "combatReady.settings.text.everyone",
            "OnlyPlayers": "combatReady.settings.text.onlyPlayers",
            "Player": "combatReady.settings.text.currentCombatant",
            "GM": "combatReady.settings.text.GM",
            "GM+Player": "combatReady.settings.text.GMAndPlayer",
            "None": "combatReady.settings.text.none"
        },
        default: "Everyone",
        type: String,
    });
    getGame().settings.register(MODULE_NAME, "ticksoundfile", {
        name: "combatReady.settings.tickSoundFile.name",
        hint: "combatReady.settings.tickSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/clocktick.mp3",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.TICK_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "expiresound", {
        name: "combatReady.settings.expireSound.name",
        hint: "combatReady.settings.expireSound.hint",
        scope: "world",
        config: true,
        choices: {
            "Everyone": "combatReady.settings.text.everyone",
            "OnlyPlayers": "combatReady.settings.text.onlyPlayers",
            "Player": "combatReady.settings.text.currentCombatant",
            "GM": "combatReady.settings.text.GM",
            "GM+Player": "combatReady.settings.text.GMAndPlayer",
            "None": "combatReady.settings.text.none"
        },
        default: "Everyone",
        type: String,
    });
    getGame().settings.register(MODULE_NAME, "expiresoundfile", {
        name: "combatReady.settings.expireSoundFile.name",
        hint: "combatReady.settings.expireSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/notime.wav",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.EXPIRE_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "roundsound", {
        name: "combatReady.settings.roundSound.name",
        hint: "combatReady.settings.roundSound.hint",
        scope: "world",
        config: true,
        choices: {
            "Everyone": "combatReady.settings.text.everyone",
            "OnlyPlayers": "combatReady.settings.text.onlyPlayers",
            "GM": "combatReady.settings.text.GM",
            "None": "combatReady.settings.text.none"
        },
        default: "Everyone",
        type: String,
    });
    getGame().settings.register(MODULE_NAME, "roundsoundfile", {
        name: "combatReady.settings.roundSoundFile.name",
        hint: "combatReady.settings.roundSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/round.wav",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.ROUND_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "acksoundfile", {
        name: "combatReady.settings.ackSoundFile.name",
        hint: "combatReady.settings.ackSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/ack.wav",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.ACK_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "nextsoundfile", {
        name: "combatReady.settings.nextSoundFile.name",
        hint: "combatReady.settings.nextSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/next.wav",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.NEXT_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "turnsoundfile", {
        name: "combatReady.settings.turnSoundFile.name",
        hint: "combatReady.settings.turnSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/turn.wav",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.TURN_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "tickonlast", {
        name: "combatReady.settings.tickOnLast.name",
        hint: "combatReady.settings.tickOnLast.hint",
        scope: "world",
        config: true,
        default: 10,
        type: Number,
        onChange: (value) => {
            let val = Number(value);
            if (isNaN(val) || val < 0) {
                getGame().settings.set(MODULE_NAME, "tickonlast", 0);
                return;
            }
        },
    });
    getGame().settings.register(MODULE_NAME, "volume", {
        name: "combatReady.settings.volume.name",
        hint: "combatReady.settings.volume.hint",
        scope: "client",
        config: true,
        //@ts-ignore
        range: {
            min: 0,
            max: 100,
            step: 10,
        },
        default: 60,
        type: Number,
    });
};

class ThemeSettings extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "combatready-theme-settings",
            title: getGame().i18n.localize("combatReady.settings.themes.themeSettings.name"),
            template: "modules/combatready/templates/theme_settings.html",
            width: 600,
        })
    }

    getData(options: Application.RenderOptions): FormApplication.Data<{}, FormApplication.Options> | Promise<FormApplication.Data<{}, FormApplication.Options>> {
        const data: any = {}
        data.isGM = getGame().user?.isGM
        const selectedTheme = currentTheme.id

        data.themes = Object.values(availableThemes).map(iTheme => {
            const theme: any = {}
            theme.id = iTheme.id
            theme.hasSettings = iTheme instanceof CombatReadyAnimationTheme
            if (theme.hasSettings)
                theme.settings = enumerateThemeSettings(iTheme)
            theme.selectTitle = iTheme.id
            theme.isSelected = theme.id === selectedTheme
            return theme
        })
        data.selectedThemeName = data.themes.find(theme => theme.isSelected).selectTitle

        data.selectedTheme = {
            id: "selectedTheme",
            name: getGame().i18n.localize("combatReady.settings.themes.selectTheme.name"),
            hint: getGame().i18n.localize("combatReady.settings.themes.selectTheme.hint"),
            type: String,
            choices: data.themes.reduce((choices, themes) => {
                choices[themes.id] = themes.selectTitle
                return choices
            }, {}),
            value: selectedTheme,
            isCheckbox: false,
            isSelect: true,
            isRange: false,
        }
        return data
    }
    async _onSubmit(event: SubmitEvent, { updateData = {}, preventClose = false, preventRender = false }: FormApplication.OnSubmitOptions = {}): Promise<Partial<Record<string, unknown>>> {
        if ((<HTMLButtonElement>event.submitter).name == "apply") {
            preventClose = true;
        }
        return super._onSubmit(event, { updateData, preventClose, preventRender });
    }

    async _updateObject(event: SubmitEvent, formData: object) {
        //@ts-ignore
        const selectedTheme = getGame().user?.isGM ? formData.selectedTheme : getGame().settings.get(MODULE_NAME, "selectedTheme")
        for (let [key, value] of Object.entries(formData)) {

            if (key !== "selectedTheme" && !key.startsWith(selectedTheme))
                continue


            let setting
            if (key === "selectedTheme")
                setting = "selectedTheme"
            else
                setting = `themes.${key}`

            // Get the old setting value
            const oldValue = getGame().settings.get(MODULE_NAME, setting)

            // Only update the setting if it has been changed (this leaves the default in place if it hasn't been touched)
            if (value !== oldValue)
                getGame().settings.set(MODULE_NAME, setting, value)
        }

        // Activate the configured speed provider
        updateAnimation()
    }

    activateListeners(html: JQuery) {
        super.activateListeners(html)
        html.find("select[name=selectedTheme]").on("change", this.onThemeSelectedChange.bind(this))
        html.find("button#combatready\\.theme\\.test\\.yourTurn").on("click", this.onThemeTestClick.bind(this))
        html.find("button#combatready\\.theme\\.test\\.nextUp").on("click", this.onThemeTestClick.bind(this))
        html.find("button#combatready\\.theme\\.test\\.nextRound").on("click", this.onThemeTestClick.bind(this))
    }

    onThemeTestClick(event) {
        switch (event.currentTarget.value) {
            case "yourTurn":
                setTimeout(() => {
                    currentTheme.yourTurnAnimation();
                }, 64);
                break;
            case "nextUp":
                setTimeout(() => {
                    currentTheme.nextUpAnimation();
                }, 64);
                break;
            case "nextRound":
                setTimeout(() => {
                    currentTheme.nextRoundAnimation();
                }, 64);
                break;

            default:
                break;
        }
    }

    onThemeSelectedChange(event) {
        // Hide all module settings
        document.querySelectorAll(".combatready-theme-settings").forEach(element => (<HTMLElement>element).style.display = "none");
        // Show the settings block for the currently selected module
        (<HTMLElement>document.getElementById(`combatready.theme.${event.currentTarget.value}`)).style.display = "";

        // Recalculate window height
        (<HTMLElement>this.element[0]).style.height = ""
        this.position.height = null
    }
}

function enumerateThemeSettings(theme: CombatReadyAnimationTheme) {
    const settings: any = []
    for (const setting of theme.settings) {
        try {
            if (setting.setting.scope === "world" && !getGame().user?.isGM)
                continue
            let s: any = duplicate(setting.setting);
            s.id = `${theme.id}.setting.${setting.id}`
            s.name = getGame().i18n.localize(<string>setting.setting.name)
            s.hint = getGame().i18n.localize(<string>setting.setting.hint)
            s.value = theme.getSetting(setting.id)
            s.type = setting.setting.type instanceof Function ? setting.setting.type.name : "String"
            s.isCheckbox = setting.setting.type === Boolean
            s.isSelect = setting.setting.choices !== undefined
            s.isRange = (setting.setting.type === Number) && setting.setting.range
            s.isColor = (setting.setting.type === "Color")
            s.isMultiline = (setting.setting.multiline)
            settings.push(s)
        }
        catch (e) {
            console.warn(`CombatReady | The following error occured while rendering setting "${setting.id}" of module/system "${this.id}. It won't be displayed.`)
            console.error(e)
        }
    }

    return settings;
}
