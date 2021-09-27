//@ts-ignore
import { gsap } from "/scripts/greensock/esm/all.js";
import { addClass, removeClass } from "./helpers";
import { getCombats, getGame, MODULE_NAME, registerSettings } from "./settings";
import { currentTheme } from "./api";

export const volume = () => {
    return (Number)(getGame().settings.get("combatready", "volume")) / 100.0;
};

export class CombatReady {
    public static EndTurnDialog: Array<Dialog> = [];
    public static WrapItUpDialog: Array<Dialog> = [];
    public static READY: boolean;
    public static SOCKET: string;
    public static TIMEBAR: HTMLDivElement;
    public static TIMEFILL: HTMLDivElement;
    public static TIMECURRENT: number;
    public static TIMEMAX: number;
    public static INTERVAL_IDS: Array<{ name, id }>;
    public static TURN_SOUND: { file: string, setting: string };
    public static NEXT_SOUND: { file: string, setting: string };
    public static ROUND_SOUND: { file: string, setting: string };
    public static EXPIRE_SOUND: { file: string, setting: string };
    public static ACK_SOUND: { file: string, setting: string };
    public static TICK_SOUND: { file: string, setting: string };

    static playSound(sound: { file: string, setting: string }): void {
        let curCombat = getCombats().active as StoredDocument<Combat>;
        let entry = curCombat.combatant;
        let playTo = "Everyone";
        try {
            playTo = <string>getGame().settings.get("combatready", sound.setting);
        } catch (e) { }

        switch (playTo) {
            case "None":
                break;
            case "GM+Player":
                if (getGame().user?.isGM || entry.actor?.isOwner) {
                    AudioHelper.play({ src: sound.file, volume: volume() });
                }
                break;
            case "GM":
                if (getGame().user?.isGM) {
                    AudioHelper.play({ src: sound.file, volume: volume() });
                }
                break;
            case "OnlyPlayers":
                if (!getGame().user?.isGM) {
                    AudioHelper.play({ src: sound.file, volume: volume() });
                }
                break;
            case "Player":
                if ((entry.actor?.isOwner && !getGame().user?.isGM) || entry.players.length == 0 && getGame().user?.isGM) {
                    AudioHelper.play({ src: sound.file, volume: volume() });
                }
                break;
            case "Everyone":
            default:
                AudioHelper.play({ src: sound.file, volume: volume() });
                break;
        }
    }
    static async closeEndTurnDialog() {
        // go through all dialogs that we've opened and closed them
        for (let d of CombatReady.EndTurnDialog) {
            d.close();
        }
        CombatReady.EndTurnDialog.length = 0;
    }

    static showEndTurnDialog() {
        CombatReady.closeEndTurnDialog().then(() => {
            let d = new Dialog(
                {
                    title: "End Turn",
                    default: "",
                    content: "",
                    buttons: {
                        endturn: {
                            label: "End Turn",
                            callback: () => {
                                getCombats().active?.nextTurn();
                            },
                        },
                    },
                },
                {
                    width: 30,
                    top: 5,
                }
            );
            d.render(true);
            // add dialog to array of dialogs. when using just a single object we'd end up with multiple dialogs
            CombatReady.EndTurnDialog.push(d);
        });
    }

    static async closeWrapItUpDialog() {
        // go through all dialogs that we've opened and closed them
        for (let d of CombatReady.WrapItUpDialog) {
            d.close();
        }
        CombatReady.WrapItUpDialog.length = 0;
    }
    static showWrapItUpDialog() {
        CombatReady.closeWrapItUpDialog().then(() => {
            if (getGame().settings.get("combatready", "disabletimer")) {
                return;
            }
            let d = new Dialog(
                {
                    title: "Wrap It Up",
                    default: "",
                    content: "",
                    buttons: {
                        wrapitup: {
                            label: getGame().i18n.localize("combatReady.text.wrapItUp"),
                            callback: () => {
                                CombatReady.timerStart()
                            },
                        },
                    },
                },
                {
                    width: 30,
                    top: 5,
                }
            );
            d.render(true);
            // add dialog to array of dialogs. when using just a single object we'd end up with multiple dialogs
            CombatReady.WrapItUpDialog.push(d);
        });
    }
    static adjustWidth() {
        let sidebar = document.getElementById("sidebar") as HTMLElement;
        let width = sidebar.offsetWidth;
        if (getGame().settings.get(MODULE_NAME, "timebarlocation") == "sidebar") {
            CombatReady.TIMEBAR.style.width = `100%`;
        } else {
            if (getGame().settings.get(MODULE_NAME, "timebarlocation") == "bottom" && width == 30) width = 0;
            currentTheme.adjustWidth(width);
            CombatReady.TIMEBAR.style.width = `calc(100% - ${width}px)`;
        }
    }
    /**
     * JQuery stripping
     */
    static init() {

        let body = document.getElementsByTagName("body")[0] as HTMLElement;
        let sidebar = document.getElementById("sidebar") as HTMLElement;

        let timebar = document.createElement("div");
        let timefill = document.createElement("div");
        addClass(timebar, "combatready-timebar");
        addClass(timefill, "combatready-timebar-fill");
        timebar.appendChild(timefill);

        body.appendChild(timebar);
        // Ajust due to DOM elements
        timebar.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;

        // element statics
        CombatReady.READY = true;
        CombatReady.SOCKET = "module.combatready";
        // timer
        CombatReady.TIMEBAR = timebar;
        CombatReady.TIMEFILL = timefill;
        CombatReady.TIMECURRENT = 0;
        CombatReady.TIMEMAX = 20;
        CombatReady.INTERVAL_IDS = [];
        CombatReady.TIMEFILL.style.backgroundColor = <string>getGame().settings.get(MODULE_NAME, "timercolor");
        addClass(CombatReady.TIMEBAR, "combatready-timebar-" + getGame().settings.get(MODULE_NAME, "timebarlocation"));
        // sound statics
        CombatReady.TURN_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "turnsoundfile"), setting: "turnsound" };
        CombatReady.NEXT_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "nextsoundfile"), setting: "nextsound" };
        CombatReady.ROUND_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "roundsoundfile"), setting: "roundsound" };
        CombatReady.EXPIRE_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "expiresoundfile"), setting: "expiresound" };
        CombatReady.ACK_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "acksoundfile"), setting: "acksound" };
        CombatReady.TICK_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "ticksoundfile"), setting: "ticksound" };

        // init socket
        getGame().socket?.on(CombatReady.SOCKET, (data) => {
            if (!getGame().user?.isGM) {
                if (data.timetick) CombatReady.TIMECURRENT = data.timetick;
                // if not ticking, start doing so to match the GM
                if (
                    !CombatReady.INTERVAL_IDS.some((e) => {
                        return e.name === "clock";
                    })
                )
                    CombatReady.timerStart();
            }
        });
    }

    /**
     * Animate... Weee
     */
    static doAnimateTurn() {
        if (!CombatReady.READY) {
            CombatReady.init();
        }
        currentTheme.yourTurnAnimation();
        // play a sound, meep meep!
        CombatReady.playSound(CombatReady.TURN_SOUND);
    }

    /**
     * Animate the "you're up next" prompt
     */
    static doAnimateNext() {
        if (getGame().settings.get("combatready", "disablenextup")) {
            return;
        }

        if (!CombatReady.READY) {
            CombatReady.init();
        }
        currentTheme.nextUpAnimation();
        // play a sound, beep beep!
        CombatReady.playSound(CombatReady.NEXT_SOUND);
    }

    /**
     * Check if the current combatant needs to be updated
     */
    static toggleCheck() {
        let curCombat = getCombats().active;

        if (curCombat && curCombat.started) {
            let entry = curCombat.combatant;
            currentTheme.cleanAnimations();
            if (<boolean>getGame().settings.get("combatready", "wrapitupdialog")) {
                if (getGame().user?.isGM && entry.players.length > 0) {
                    CombatReady.showWrapItUpDialog();
                } else {
                    CombatReady.closeWrapItUpDialog();
                }
            } else {
                CombatReady.timerStart();
            }
            // next combatant
            let nxtturn = (curCombat.turn || 0) + 1;
            if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
            let nxtentry = curCombat.turns[nxtturn];

            if (entry !== undefined) {
                CombatReady.closeEndTurnDialog().then(() => {
                    let isActive = entry.actor?.isOwner && !getGame().user?.isGM;
                    let isNext = nxtentry.actor?.isOwner && !getGame().user?.isGM;

                    if (isActive) {
                        CombatReady.doAnimateTurn();
                        if (<boolean>getGame().settings.get("combatready", "endturndialog"))
                            CombatReady.showEndTurnDialog();
                    } else if (isNext) {
                        if (nxtturn == 0 && <boolean>getGame().settings.get("combatready", "disablenextuponlastturn"))
                            return;
                        CombatReady.doAnimateNext();
                    }
                });
            }
        } else if (!curCombat) {
            CombatReady.closeEndTurnDialog();
            CombatReady.closeWrapItUpDialog();
        }
    }

    static nextRound() {
        this.playSound(CombatReady.ROUND_SOUND);
    }
    /**
     *
     */
    static async timerTick() {
        let curCombat = getCombats().active as StoredDocument<Combat>;
        let entry = curCombat.combatant;
        if (getGame().settings.get("combatready", "disabletimer")) {
            return;
        }
        if (getGame().settings.get("combatready", "disabletimerGM")) {
            if (entry.players.length == 0) return;
        }

        // If we're GM, we run the clock
        if (getGame().user?.isGM) {
            CombatReady.TIMECURRENT++;
            getGame().socket?.emit(
                CombatReady.SOCKET,
                {
                    senderId: getGame().user?.id,
                    type: "Number",
                    timetick: CombatReady.TIMECURRENT,
                },
                (resp) => { }
            );
        }

        // If we're in the last seconds defined we tick
        if (CombatReady.TIMEMAX - CombatReady.TIMECURRENT <= <Number>getGame().settings.get(MODULE_NAME, "tickonlast")) {
            CombatReady.playSound(CombatReady.TICK_SOUND);
        }
        let width = (CombatReady.TIMECURRENT / CombatReady.TIMEMAX) * 100;
        if (width > 100) {
            await CombatReady.timerStop();
            if (<boolean>getGame().settings.get(MODULE_NAME, "autoendontimer")) {
                if (getGame().user?.isGM) {//run only from the GM side
                    if (entry.players.length > 0) {//run only if the actor has owners
                        getCombats().active?.nextTurn();
                    }
                }
            }
            CombatReady.playSound(CombatReady.EXPIRE_SOUND);
        } else {
            CombatReady.TIMEFILL.style.transition = "";
            CombatReady.TIMEFILL.style.width = `${width}%`;
        }
    }

    /**
     *
     */
    static setTimeMax(num) {
        CombatReady.TIMEMAX = num;
    }

    /**
     *
     */
    static async timerStart() {
        CombatReady.TIMEBAR.style.display = "block";
        if (getGame().user?.isGM) {
            // push GM time
            CombatReady.TIMECURRENT = 0;
            getGame().socket?.emit(CombatReady.SOCKET, {
                senderId: getGame().user?.id,
                type: "Number",
                timetick: CombatReady.TIMECURRENT,
            });
            /*setTimeout(async () => {
                await getGame().settings.set("combatready", "timeractive", true);
            }, 300);*/
        }

        for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
            let interval = CombatReady.INTERVAL_IDS[idx];
            if (interval.name === "clock") {
                CombatReady.TIMEFILL.style.width = "0%";
                CombatReady.TIMEFILL.style.transition = "none";
                // be content with a reset clock
                return;
            }
        }

        if (!getGame().paused) {
            // If not a GM, and the actor is hidden, don't show it
            CombatReady.TIMEFILL.style.width = "0%";
            CombatReady.TIMEFILL.style.transition = "none";
            CombatReady.INTERVAL_IDS.push({
                name: "clock",
                id: window.setInterval(CombatReady.timerTick, 1000),
            });
        }
    }

    /**
     *
     */
    static async timerStop() {
        for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
            let interval = CombatReady.INTERVAL_IDS[idx];
            if (interval.name === "clock") {
                window.clearInterval(interval.id);
                CombatReady.INTERVAL_IDS.splice(idx, 1);
                break;
            }
        }
        // kill paused bar
        CombatReady.TIMECURRENT = 0;
        CombatReady.TIMEBAR.style.display = "none";
        /*if (getGame().user?.isGM) {
            setTimeout(async () => {
                await getGame().settings.set("combatready", "timeractive", false);
            }, 300);
        }*/
    }

    /**
     *
     */
    static timerPause() {
        for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
            let interval = CombatReady.INTERVAL_IDS[idx];
            if (interval.name === "clock") {
                window.clearInterval(interval.id);
                CombatReady.INTERVAL_IDS.splice(idx, 1);
                break;
            }
        }
    }

    /**
     *
     */
    static timerResume() {
        for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
            let interval = CombatReady.INTERVAL_IDS[idx];
            if (interval.name === "clock") return;
        }

        // push GM time
        if (getGame().user?.isGM)
            getGame().socket?.emit(CombatReady.SOCKET, {
                senderId: getGame().user?.id,
                type: "Number",
                timetick: CombatReady.TIMECURRENT,
            });

        //if (getGame().settings.get("combatready", "timeractive"))
        CombatReady.INTERVAL_IDS.push({
            name: "clock",
            id: window.setInterval(CombatReady.timerTick, 1000),
        });
    }
}