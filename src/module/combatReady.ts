import { getCombats, getGame, MODULE_NAME } from "./settings";
import { currentTheme, currentTimer } from "./api";

export const volume = () => {
    return (Number)(getGame().settings.get(MODULE_NAME, "volume")) / 100.0;
};

export class CombatReady {
    public static EndTurnDialog: Array<Dialog> = [];
    public static WrapItUpDialog: Array<Dialog> = [];
    public static READY: boolean = false;
    public static SOCKET: any;
    public static TIMECURRENT: number;
    public static TIMEMAX: number;
    public static INTERVAL_IDS: Array<{ name, id }>;
    public static TURN_SOUND: { file: string, setting: string };
    public static NEXT_SOUND: { file: string, setting: string };
    public static ROUND_SOUND: { file: string, setting: string };
    public static EXPIRE_SOUND: { file: string, setting: string };
    public static ACK_SOUND: { file: string, setting: string };
    public static TICK_SOUND: { file: string, setting: string };
    public static MASTEROFTIME: string;

    static playSound(sound: { file: string, setting: string }): void {
        let curCombat = getCombats().active as StoredDocument<Combat>;
        let entry = curCombat.combatant;
        let playTo = "Everyone";
        try {
            playTo = <string>getGame().settings.get(MODULE_NAME, sound.setting);
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
                if (((entry?.actor?.isOwner ?? false) && !getGame().user?.isGM) || (entry?.players.length == 0 ?? false) && getGame().user?.isGM) {
                    AudioHelper.play({ src: sound.file, volume: volume() });
                }
                break;
            case "Everyone":
            default:
                AudioHelper.play({ src: sound.file, volume: volume() });
                break;
        }
    }
    static isMasterOfTime(user: User | StoredDocument<User> | null) {
        if (user == null) return false;
        return user.isGM && user.id == CombatReady.MASTEROFTIME;
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
            if (getGame().settings.get(MODULE_NAME, "disabletimer")) {
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
        currentTheme.adjustWidth();
        currentTimer.adjustWidth();
    }
    /**
     * JQuery stripping
     */
    static init() {
        CombatReady.READY = true;
        CombatReady.INTERVAL_IDS = [];
        // sound statics
        CombatReady.TURN_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "turnsoundfile"), setting: "turnsound" };
        CombatReady.NEXT_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "nextsoundfile"), setting: "nextsound" };
        CombatReady.ROUND_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "roundsoundfile"), setting: "roundsound" };
        CombatReady.EXPIRE_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "expiresoundfile"), setting: "expiresound" };
        CombatReady.ACK_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "acksoundfile"), setting: "acksound" };
        CombatReady.TICK_SOUND = { file: <string>getGame().settings.get(MODULE_NAME, "ticksoundfile"), setting: "ticksound" };
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
        if (getGame().settings.get(MODULE_NAME, "disablenextup")) {
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
            if (<boolean>getGame().settings.get(MODULE_NAME, "wrapitupdialog")) {
                if (getGame().user?.isGM && entry.players.length > 0) {
                    CombatReady.showWrapItUpDialog();
                } else {
                    CombatReady.closeWrapItUpDialog();
                }
            } else {
                if (CombatReady.isMasterOfTime(getGame().user)) {
                    CombatReady.timerStart();
                }
            }
            // next combatant
            let nxtturn = ((curCombat.turn || 0) + 1) % curCombat.turns.length;
            let nxtentry = curCombat.turns[nxtturn];
            //@ts-ignore
            if (getGame().settings.get("core", "combatTrackerConfig")?.skipDefeated ?? false) {
                while (nxtentry.data.defeated) {
                    if (nxtturn == curCombat.turn) break;// Avoid running infinitely
                    nxtturn = (nxtturn + 1) % curCombat.turns.length;
                    nxtentry = curCombat.turns[nxtturn];
                }
            }

            if (entry !== undefined) {
                CombatReady.closeEndTurnDialog().then(() => {
                    let isActive = entry.actor?.isOwner && !getGame().user?.isGM;
                    let isNext = nxtentry.actor?.isOwner && !getGame().user?.isGM;

                    if (isActive) {
                        CombatReady.doAnimateTurn();
                        if (<boolean>getGame().settings.get(MODULE_NAME, "endturndialog"))
                            CombatReady.showEndTurnDialog();
                    } else if (isNext) {
                        if (nxtturn == 0 && <boolean>getGame().settings.get(MODULE_NAME, "disablenextuponlastturn"))
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
    static async timerTick(TIMECURRENT: number | null = null) {
        if (!CombatReady.READY) return;
        let curCombat = getCombats().active as StoredDocument<Combat>;
        let entry = curCombat.combatant;
        if (getGame().settings.get(MODULE_NAME, "disabletimer")) {
            return;
        }
        if (getGame().settings.get(MODULE_NAME, "disabletimerGM")) {
            if (entry.players.length == 0) return;
        }
        if(getGame().settings.get(MODULE_NAME,"disabletimerOnHidden")){
            if (entry.data.hidden && entry.players.length == 0) return;
        }
        if (CombatReady.isMasterOfTime(getGame().user)) {
            CombatReady.TIMECURRENT++;
            CombatReady.SOCKET.executeForOthers('timerTick', CombatReady.TIMECURRENT);
        } else {
            if (TIMECURRENT == null) {
                CombatReady.TIMECURRENT++;
            } else {
                CombatReady.TIMECURRENT = TIMECURRENT;
            }
        }

        // If we're in the last seconds defined we tick
        if (CombatReady.TIMEMAX - CombatReady.TIMECURRENT <= <Number>getGame().settings.get(MODULE_NAME, "tickonlast")) {
            CombatReady.playSound(CombatReady.TICK_SOUND);
        }
        let width = (CombatReady.TIMECURRENT * 100) / CombatReady.TIMEMAX;
        if (width > 100) {
            if (CombatReady.isMasterOfTime(getGame().user)) {
                await CombatReady.timerStop();
            }
            if (<boolean>getGame().settings.get(MODULE_NAME, "autoendontimer")) {
                if (CombatReady.isMasterOfTime(getGame().user)) {//run only from the GM side
                    if (entry.players.length > 0) {//run only if the actor has owners
                        getCombats().active?.nextTurn();
                    }
                }
            }
            CombatReady.playSound(CombatReady.EXPIRE_SOUND);
        } else {
            currentTimer.tick();
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
        if (!CombatReady.READY) return;
        CombatReady.TIMECURRENT = 0;
        if (CombatReady.isMasterOfTime(getGame().user)) {
            CombatReady.SOCKET.executeForOthers('timerStart');
            if (!getGame().paused) {
                for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
                    let interval = CombatReady.INTERVAL_IDS[idx];
                    if (interval.name === "clock") {
                        window.clearInterval(interval.id);
                        CombatReady.INTERVAL_IDS.splice(idx, 1);
                        break;
                    }
                }
                // If not a GM, and the actor is hidden, don't show it
                CombatReady.INTERVAL_IDS.push({
                    name: "clock",
                    id: window.setInterval(CombatReady.timerTick, 1000),
                });
            }
        }
        currentTimer.start();
    }

    /**
     *
     */
    static async timerStop() {
        if (!CombatReady.READY) return;
        if (CombatReady.isMasterOfTime(getGame().user)) {
            for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
                let interval = CombatReady.INTERVAL_IDS[idx];
                if (interval.name === "clock") {
                    window.clearInterval(interval.id);
                    CombatReady.INTERVAL_IDS.splice(idx, 1);
                    break;
                }
            }
            CombatReady.SOCKET.executeForOthers('timerStop');
        }
        // kill paused bar
        CombatReady.TIMECURRENT = 0;
        currentTimer.stop();
    }

    /**
     *
     */
    static timerPause() {
        if (!CombatReady.READY) return;
        if (CombatReady.isMasterOfTime(getGame().user)) {
            CombatReady.SOCKET.executeForOthers('timerPause');
            for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
                let interval = CombatReady.INTERVAL_IDS[idx];
                if (interval.name === "clock") {
                    window.clearInterval(interval.id);
                    CombatReady.INTERVAL_IDS.splice(idx, 1);
                    break;
                }
            }
        }
        currentTimer.pause();
    }

    /**
     *
     */
    static timerResume() {
        if (!CombatReady.READY) return;
        if (CombatReady.isMasterOfTime(getGame().user)) {
            for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
                let interval = CombatReady.INTERVAL_IDS[idx];
                if (interval.name === "clock") return;
            }
            CombatReady.INTERVAL_IDS.push({
                name: "clock",
                id: window.setInterval(CombatReady.timerTick, 1000),
            });
            CombatReady.SOCKET.executeForOthers('timerResume');
        }
        currentTimer.resume();
    }
}