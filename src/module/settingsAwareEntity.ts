//@ts-ignore
import { type } from "jquery";
import { Type } from "typescript";
import { currentTheme, currentTimer, updateAnimation, updateTimer } from "./api";
import { getCanvas, getCombats, getGame, MODULE_NAME } from "./settings";

export class SettingsAwareEntity {
    public id: string;
    public name: string;
    public type: string;
    public ready: boolean;

    get settings(): Array<{ id: string, setting: any }> {
        return []
    }

    getSetting(settingId: string) {
        try {
            return getGame().settings.get(MODULE_NAME, `${this.type}.${this.id}.setting.${settingId}`)
        }
        catch (e) {
            if (this.settings.some(setting => setting.id === settingId)) {
                throw e
            }
            throw new Error(`Combat Ready | "${settingId}" is not a registered setting for "${this.id}". If you're the module/system developer, please add it to the return values of your "get settings()" function.`)
        }
    }
    constructor(id) {
        this.id = id;
    }
}
export function enumerateSettings(settingEntity: SettingsAwareEntity) {
    const settings: any = []
    for (const setting of settingEntity.settings) {
        try {
            if (setting.setting.scope === "world" && !getGame().user?.isGM)
                continue
            let s: any = duplicate(setting.setting);
            s.id = `${settingEntity.id}.setting.${setting.id}`
            s.name = getGame().i18n.localize(<string>setting.setting.name)
            s.hint = getGame().i18n.localize(<string>setting.setting.hint)
            s.value = settingEntity.getSetting(setting.id)
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

export class CombatReadySubSettings extends FormApplication {
    public type: string;
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 600
        });
    }

    getSelected(): SettingsAwareEntity {
        switch (this.type) {
            case "timers":
                return currentTimer;
            case "themes":
                return currentTheme;
            default:
                throw new Error("Incorrect Type for subsettings");
                break;
        }
    }

    async _onSubmit(event: SubmitEvent, { updateData = {}, preventClose = false, preventRender = false }: FormApplication.OnSubmitOptions = {}): Promise<Partial<Record<string, unknown>>> {
        if ((<HTMLButtonElement>event.submitter).name == "apply") {
            preventClose = true;
        }
        return super._onSubmit(event, { updateData, preventClose, preventRender });
    }

    async _updateObject(event: SubmitEvent, formData: object) {
        let mainKey = (this.type == "timers" ? "selectedTimer" : this.type == "themes" ? "selectedTheme" : "");
        if (mainKey == "") throw new Error("Incorrect Type for subsettings");

        let selectedObject = <string>getGame().settings.get(MODULE_NAME, mainKey);
        if (getGame().user?.isGM) {
            //@ts-ignore
            selectedObject = (this.type == "timers" ? formData.selectedTimer : this.type == "themes" ? formData.selectedTheme : "");
        }
        for (let [key, value] of Object.entries(formData)) {

            if (key !== mainKey && !key.startsWith(selectedObject))
                continue
            let setting
            if (key === mainKey)
                setting = mainKey
            else
                setting = `${this.type}.${key}`

            // Get the old setting value
            const oldValue = getGame().settings.get(MODULE_NAME, setting)

            // Only update the setting if it has been changed (this leaves the default in place if it hasn't been touched)
            if (value !== oldValue)
                await getGame().settings.set(MODULE_NAME, setting, value)
        }
        switch (this.type) {
            case "timers":
                updateTimer();
                break;
            case "themes":
                updateAnimation();
                break;
        }
    }

    activateListeners(html: JQuery) {
        let mainKey = (this.type == "timers" ? "selectedTimer" : this.type == "themes" ? "selectedTheme" : "");
        if (mainKey == "") throw new Error("Incorrect Type for subsettings");
        super.activateListeners(html);
        html.find(`select[name=${mainKey}]`).on("change", this.onObjectSelectedChange.bind(this))
    }

    onObjectSelectedChange(event) {
        let mainKey = (this.type == "timers" ? "selectedTimer" : this.type == "themes" ? "selectedTheme" : "");
        if (mainKey == "") throw new Error("Incorrect Type for subsettings");
        // Hide all module settings
        document.querySelectorAll(`.combatready-${this.type}-settings`).forEach(element => (<HTMLElement>element).style.display = "none");
        // Show the settings block for the currently selected module
        (<HTMLElement>document.getElementById(`combatready.${this.type}.${event.currentTarget.value}`)).style.display = "";

        // Recalculate window height
        (<HTMLElement>this.element[0]).style.height = ""
        this.position.height = null
    }
}
