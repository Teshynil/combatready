//@ts-ignore
import { gsap } from "/scripts/greensock/esm/all.js";
import { addClass, removeClass } from "./helpers";
import { getCombats, getGame, MODULE_NAME, registerSettings } from "./settings";

export const volume = () => {
    return (Number)(getGame().settings.get("combatready", "volume")) / 100.0;
};

export class CombatReady {
    public static EndTurnDialog: Array<Dialog> = [];
    public static WrapItUpDialog: Array<Dialog> = [];
    public static READY: boolean;
    public static BANNER: HTMLDivElement;
    public static CHEVRONS: HTMLCollectionOf<HTMLElement>;
    public static BEAMS: HTMLCollectionOf<HTMLElement>;
    public static LABEL: HTMLDivElement;
    public static COVER: HTMLDivElement;
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
                            label: getGame().i18n.localize("CombatReady.WrapItUp"),
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
            CombatReady.BANNER.style.width = `calc(100% - ${width}px)`;
            CombatReady.TIMEBAR.style.width = `calc(100% - ${width}px)`;
        }
    }
    /**
     * JQuery stripping
     */
    static init() {

        let body = document.getElementsByTagName("body")[0] as HTMLElement;
        let sidebar = document.getElementById("sidebar") as HTMLElement;

        // Build HTML to Inject
        let cover = document.createElement("div");
        addClass(cover, "combatready-boardcover");

        let timebar = document.createElement("div");
        let timefill = document.createElement("div");
        addClass(timebar, "combatready-timebar");
        addClass(timefill, "combatready-timebar-fill");
        timebar.appendChild(timefill);

        let banner = document.createElement("div");
        let label = document.createElement("div");
        addClass(banner, "combatready-container");
        addClass(label, "combatready-label");
        // chevrons
        for (let idx = 0; idx < 6; ++idx) {
            let chevron = document.createElement("div");
            addClass(chevron, "combatready-chevron");
            banner.appendChild(chevron);
        }
        let chevrons = banner.getElementsByClassName("combatready-chevron") as HTMLCollectionOf<HTMLElement>;
        // beams
        for (let idx = 0; idx < 40; ++idx) {
            let beam = document.createElement("div");
            addClass(beam, "combatready-beam");
            banner.appendChild(beam);
        }
        let beams = banner.getElementsByClassName("combatready-beam") as HTMLCollectionOf<HTMLElement>;

        // Labels over effects
        banner.appendChild(label);

        // Inject into DOM Body
        body.appendChild(cover);
        body.appendChild(banner);
        body.appendChild(timebar);
        // Ajust due to DOM elements
        banner.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;
        timebar.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;

        // element statics
        CombatReady.READY = true;
        CombatReady.BANNER = banner;
        CombatReady.CHEVRONS = chevrons;
        CombatReady.BEAMS = beams;
        CombatReady.LABEL = label;
        CombatReady.COVER = cover;
        CombatReady.SOCKET = "module.combatready";
        // timer
        CombatReady.TIMEBAR = timebar;
        CombatReady.TIMEFILL = timefill;
        CombatReady.TIMECURRENT = 0;
        CombatReady.TIMEMAX = 20;
        CombatReady.INTERVAL_IDS = [];
        // sound statics
        CombatReady.TURN_SOUND = { file: "modules/combatready/sounds/turn.wav", setting: "turnsound" };
        CombatReady.NEXT_SOUND = { file: "modules/combatready/sounds/next.wav", setting: "nextsound" };
        CombatReady.ROUND_SOUND = { file: "modules/combatready/sounds/round.wav", setting: "roundsound" };
        CombatReady.EXPIRE_SOUND = { file: "modules/combatready/sounds/notime.wav", setting: "expiresound" };
        CombatReady.ACK_SOUND = { file: "modules/combatready/sounds/ack.wav", setting: "acksound" };
        CombatReady.TICK_SOUND = { file: "modules/combatready/sounds/clocktick.mp3", setting: "ticksound" };
        // language specific fonts
        switch (getGame().i18n.lang) {
            case "en":
                addClass(label, "speedp");
                label.style["font-size"] = "124px";
                //label.style.top = "15px";
                break;
            case "ko":
                addClass(label, "bmhannapro");
                label.style["font-size"] = "100px";
                break;
            case "ja":
                addClass(label, "genshingothicbold");
                label.style["font-size"] = "100px";
                break;
            default:
                addClass(label, "ethnocentric");
                label.style["font-size"] = "90px";
                break;
        }

        registerSettings();

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

    static onClickTurnBanner(ev) {
        document.removeEventListener("click", CombatReady.onClickTurnBanner);
        CombatReady.stopAnimate();
        // play an acknowledgement sound!
        CombatReady.playSound(CombatReady.ACK_SOUND);
    }
    static onClickNextBanner(ev) {
        document.removeEventListener("click", CombatReady.onClickNextBanner);
        // kill next label anim if the user is fast
        let anims = gsap.getTweensOf(CombatReady.LABEL);
        for (let tween of anims) {
            tween.kill();
        }

        // hide cover, but keep the beams to let the user know their turn is coming up!
        addClass(CombatReady.BANNER, "combatready-bannerdisable");

        gsap.to(CombatReady.LABEL, 0.5, {
            opacity: 0.3,
            onComplete: function () {
                if (getGame().settings.get("combatready", "disablenextuplingering")) {
                    CombatReady.BANNER.style.display = "none";
                }
            },
        });
        gsap.to(CombatReady.COVER, 0.5, {
            opacity: 0,
            onComplete: function () {
                CombatReady.COVER.style.display = "none";
            },
        });
    }

    /**
     * Animate... Weee
     */
    static doAnimateTurn() {
        if (!CombatReady.READY) {
            CombatReady.init();
        }
        if (<string>getGame().settings.get("combatready", "animationstyle") !== "None") {
            for (let e of CombatReady.CHEVRONS) e.style.left = "-200px";
            for (let e of CombatReady.BEAMS) {
                e.style.left = "-200px";
                e.style.animation = "none";
            }

            CombatReady.LABEL.style.opacity = "0";
            CombatReady.LABEL.textContent = getGame().i18n.localize("CombatReady.Turn");

            removeClass(CombatReady.BANNER, "combatready-bannerdisable");

            CombatReady.BANNER.style.display = "flex";
            CombatReady.COVER.style.display = "block";
            document.removeEventListener("click", CombatReady.onClickNextBanner);
            document.removeEventListener("click", CombatReady.onClickTurnBanner);
            document.addEventListener("click", CombatReady.onClickTurnBanner);

            if (<string>getGame().settings.get("combatready", "animationstyle") == "Complete") {
                gsap.to(CombatReady.CHEVRONS, {
                    left: "100%",
                    stagger: {
                        repeat: -1,
                        each: 3,
                    },
                    ease: "ease",
                });
                gsap.to(CombatReady.COVER, 2, { opacity: 0.75 });
            }
            gsap.to(CombatReady.LABEL, 1, { delay: 2, opacity: 1 });
        }
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
        if (<string>getGame().settings.get("combatready", "animationstyle") !== "None") {
            for (let e of CombatReady.CHEVRONS) e.style.left = "-200px";
            if (<string>getGame().settings.get("combatready", "animationstyle") == "Complete") {


                // Randomize our beams
                for (let beam of CombatReady.BEAMS) {
                    let width = Math.floor(Math.random() * 100) + 30;
                    let time = Math.floor(Math.random() * 1.5 * 100) / 100 + 2.0;
                    let delay = Math.floor(Math.random() * 3 * 100) / 100 + 0.01;
                    let toffset = Math.floor(Math.random() * 90) + 10;
                    let iheight = Math.floor(Math.random() * 3) + 2;

                    beam.style.cssText += `animation: speedbeam ${time}s linear ${delay}s infinite; top: ${toffset}%; width: ${width}px; height: ${iheight}; left: ${-width}px;`;
                }

                gsap.to(CombatReady.COVER, 2, { opacity: 0.75 });
            }
            removeClass(CombatReady.BANNER, "combatready-bannerdisable");
            CombatReady.BANNER.style.display = "flex";
            CombatReady.COVER.style.display = "block";
            CombatReady.BANNER.style.display = "flex";
            CombatReady.COVER.style.display = "block";
            document.removeEventListener("click", CombatReady.onClickTurnBanner);
            document.removeEventListener("click", CombatReady.onClickNextBanner);
            document.addEventListener("click", CombatReady.onClickNextBanner);
            CombatReady.LABEL.style.opacity = "0";
            CombatReady.LABEL.textContent = getGame().i18n.localize("CombatReady.Next");
            gsap.to(CombatReady.LABEL, 1, { delay: 2, opacity: 1 });
        }
        // play a sound, beep beep!
        CombatReady.playSound(CombatReady.NEXT_SOUND);
    }

    /**
     * Stop it
     */
    static stopAnimate() {
        let anims = gsap.getTweensOf(CombatReady.CHEVRONS);
        for (let tween of anims) {
            tween.kill();
        }
        anims = gsap.getTweensOf(CombatReady.LABEL);
        for (let tween of anims) {
            tween.kill();
        }
        anims = gsap.getTweensOf(CombatReady.COVER);
        for (let tween of anims) {
            tween.kill();
        }

        for (let e of CombatReady.BEAMS) e.style.animation = "none";

        CombatReady.BANNER.style.display = "none";
        removeClass(CombatReady.BANNER, "combatready-bannerdisable");
        gsap.to(CombatReady.COVER, 0.5, {
            opacity: 0,
            onComplete: function () {
                CombatReady.COVER.style.display = "none";
            },
        });
    }

    /**
     * Check if the current combatant needs to be updated
     */
    static toggleCheck() {
        let curCombat = getCombats().active;

        if (curCombat && curCombat.started) {
            let entry = curCombat.combatant;
            CombatReady.stopAnimate();
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
    static timerTick() {
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
            CombatReady.timerStop();
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
    static timerStart() {
        CombatReady.TIMEBAR.style.display = "block";
        if (getGame().user?.isGM) {
            // push GM time
            CombatReady.TIMECURRENT = 0;
            getGame().socket?.emit(CombatReady.SOCKET, {
                senderId: getGame().user?.id,
                type: "Number",
                timetick: CombatReady.TIMECURRENT,
            });
            getGame().settings.set("combatready", "timeractive", true);
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
    static timerStop() {
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
        if (getGame().user?.isGM) getGame().settings.set("combatready", "timeractive", false);
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

        if (getGame().settings.get("combatready", "timeractive"))
            CombatReady.INTERVAL_IDS.push({
                name: "clock",
                id: window.setInterval(CombatReady.timerTick, 1000),
            });
    }
}