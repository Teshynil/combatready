//@ts-ignore
import { gsap } from "/scripts/greensock/esm/all.js";
import { getCanvas, getCombats, getGame, MODULE_NAME } from "./settings";
import { availableTimers, currentTheme, currentTimer } from "./api";
import { CombatReady } from "./combatReady";
import { CombatReadySubSettings, enumerateSettings, SettingsAwareEntity } from "./settingsAwareEntity";

export class CombatReadyTimer extends SettingsAwareEntity {
    override type = "timers";
    public testMode: boolean;
    public initialize() {
        throw new Error("A CombatReadyTimer must implement the initialize function")
    }
    public destroy() {
        throw new Error("A CombatReadyTimer must implement the destroy function")
    }
    public start() {
        throw new Error("A CombatReadyTimer must implement the start function")
    }
    public stop() {
        throw new Error("A CombatReadyTimer must implement the stop function")
    }
    public pause() {
        throw new Error("A CombatReadyTimer must implement the pause function")
    }
    public resume() {
        throw new Error("A CombatReadyTimer must implement the resume function")
    }
    public tick() {
        return;
    }
    public adjustWidth() {
        return;
    }
    constructor(id) {
        super(id);
    }
    get settings(): Array<{ id: string, setting: any }> {
        return []
    }

}
export class NativeTimer extends CombatReadyTimer {
    name = "CombatReady";
    public TIMEBAR: HTMLDivElement;
    public TIMEFILL: HTMLDivElement;
    public initialize() {
        let body = document.getElementsByTagName("body")[0] as HTMLElement;
        let sidebar = document.getElementById("sidebar") as HTMLElement;

        let timebar = document.createElement("div");
        let timefill = document.createElement("div");
        timebar.id = "combatready-timebar";
        $(timebar).addClass("combatready-timebar");
        $(timefill).addClass("combatready-timebar-fill");
        timebar.appendChild(timefill);

        body.appendChild(timebar);
        // Ajust due to DOM elements
        timebar.style.width = `0px`;
        this.TIMEBAR = timebar;
        this.TIMEFILL = timefill;
        this.adjustWidth();
        this.TIMEFILL.style.backgroundColor = <string>this.getSetting("timercolor");
        $(this.TIMEBAR).addClass("combatready-timebar-" + this.getSetting("timebarlocation"));

        this.tick();//Do a tick to redraw in case is a reload;
        this.ready = true;
    }
    public destroy() {
        this.TIMEBAR?.remove();
        this.TIMEFILL?.remove();
        this.ready = false;
    }
    public start() {
        if (!this.ready) return;
        this.TIMEBAR.style.display = "block";
        this.TIMEFILL.style.width = "0%";
        this.TIMEFILL.style.transition = "none";
    }
    public stop() {
        if (!this.ready) return;
        this.TIMEBAR.style.display = "none";
        this.TIMEFILL.style.width = "0%";
        this.TIMEFILL.style.transition = "none";
    }
    public pause() {
        if (!this.ready) return;
        this.TIMEBAR.style.display = "block";
    }
    public resume() {
        if (!this.ready) return;
        this.TIMEBAR.style.display = "block";
    }
    public tick() {
        if (!this.ready) return;
        this.TIMEBAR.style.display = "block";
        //@ts-ignore
        let width = (getGame().modules.get(MODULE_NAME)?.api?.getCurrentTime() / getGame().modules.get(MODULE_NAME)?.api?.getMaxTime()) * 100;
        this.TIMEFILL.style.transition = "";
        this.TIMEFILL.style.width = `${width}%`;
    }
    public adjustWidth() {
        let sidebar = document.getElementById("sidebar") as HTMLElement;
        let width = sidebar.offsetWidth;
        if (<string>this.getSetting("timebarlocation") == "sidebar") {
            this.TIMEBAR.style.width = `100vh`;
        } else {
            if (<string>this.getSetting("timebarlocation") == "bottom" && width == 30) width = 0;
            if ($(document.body).hasClass("mobile-improvements")) width = 0;
            this.TIMEBAR.style.width = `calc(100vw - ${width}px)`;
        }

    }

    get settings() {
        return [
            {
                id: "timercolor",
                setting: {
                    name: "combatReady.timers.native.settings.timerColor.name",
                    hint: "combatReady.timers.native.settings.timerColor.hint",
                    label: "Color Picker",
                    default: "#B71703ff",
                    scope: "world",
                    //@ts-ignore
                    onChange: (value) => { currentTimer.TIMEFILL.style.backgroundColor = value; },
                    type: "Color"
                }
            },
            {
                id: "timebarlocation",
                setting: {
                    name: "combatReady.timers.native.settings.timeBarLocation.name",
                    hint: "combatReady.timers.native.settings.timeBarLocation.hint",
                    scope: "world",
                    config: true,
                    default: "bottom",
                    choices: {
                        "top": "combatReady.timers.native.settings.timeBarLocation.text.top",
                        "sidebar": "combatReady.timers.native.settings.timeBarLocation.text.sidebar",
                        "bottom": "combatReady.timers.native.settings.timeBarLocation.text.bottom"
                    },
                    type: String,
                    onChange: (value) => {
                        //@ts-ignore
                        $(currentTimer.TIMEBAR).removeClass("combatready-timebar-top");
                        //@ts-ignore
                        $(currentTimer.TIMEBAR).removeClass("combatready-timebar-sidebar");
                        //@ts-ignore
                        $(currentTimer.TIMEBAR).removeClass("combatready-timebar-bottom");
                        //@ts-ignore
                        $(currentTimer.TIMEBAR).addClass("combatready-timebar-" + value);
                        CombatReady.adjustWidth();
                    }
                }
            }
        ]
    }
}
export class TimerSubSettings extends CombatReadySubSettings {
    override type = "timers";
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "combatready-timers-settings",
            title: getGame().i18n.localize("combatReady.settings.timers.settings.name"),
            template: "modules/combatready/templates/timers_settings.html"
        })
    }
    getData(options: Application.RenderOptions): FormApplication.Data<{}, FormApplication.Options> | Promise<FormApplication.Data<{}, FormApplication.Options>> {
        const data: any = {}
        data.isGM = getGame().user?.isGM
        const selectedTimer = currentTimer.id

        data.timers = Object.values(availableTimers).map(iTimer => {
            const timer: any = {}
            timer.id = iTimer.id
            timer.hasSettings = iTimer instanceof CombatReadyTimer
            if (timer.hasSettings)
                timer.settings = enumerateSettings(iTimer)
            timer.selectTitle = `${iTimer.id} | ${iTimer.name}`;
            if (iTimer.id == "native") timer.selectTitle = iTimer.name;
            timer.isSelected = timer.id === selectedTimer
            return timer
        })
        data.selectedTimerName = data.timers.find(theme => theme.isSelected).selectTitle

        data.selectedTimer = {
            id: "selectedTimer",
            name: getGame().i18n.localize("combatReady.settings.timers.selectTimer.name"),
            hint: getGame().i18n.localize("combatReady.settings.timers.selectTimer.hint"),
            type: String,
            choices: data.timers.reduce((choices, timers) => {
                choices[timers.id] = timers.selectTitle
                return choices
            }, {}),
            value: selectedTimer,
            isCheckbox: false,
            isSelect: true,
            isRange: false,
        }
        return data
    }
}