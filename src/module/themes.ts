//@ts-ignore
import { gsap } from "/scripts/greensock/esm/all.js";
import { each, extend } from "jquery"
import { CombatReady } from "./combatReady";
import { addClass, removeClass } from "./helpers";
import { getGame, MODULE_NAME } from "./settings";
import { currentTheme } from "./api";

export class CombatReadyAnimationTheme {
    public id: string;

    public initialize() {
        throw new Error("A CombatReadyTheme must implement the initialize function")
    }
    public destroy() {
        throw new Error("A CombatReadyTheme must implement the destroy function")
    }
    public onChangeRound() {
        return;
    }
    public onChangeTurn() {
        return;
    }
    public yourTurnAnimation() {
        return;
    }
    public nextUpAnimation() {
        return;
    }
    public nextRoundAnimation() {
        return;
    }
    public cleanAnimations() {
        return;
    }
    public adjustWidth(width: Number) {
        return;
    }

    /**
     * Returns an array of configuration options for this module. The settings will be shown in the Animation Settings of Combat Ready.
     * Each configuration option is an object that has the same attributes as a native foundry setting passed to `game.settings.register`,
     * except for these exceptions:
     * - id: A string that identifies the setting. Must be unique for each setting returned. This id will be used to fetch the setting.
     *
     * Implementing this method is optional and only needs to be done if you want to provide customizability for your animations
     */
    get settings(): Array<{ id: string, setting: any }> {
        return []
    }

    /**
     * Returns the value that is currently set for the setting registered with the provided settingId.
     *
     * This function shouldn't be overridden by speed provider implementations. It can be called to fetch speed provider specific settings.
     */
    getSetting(settingId: string) {
        try {
            return getGame().settings.get(MODULE_NAME, `themes.${this.id}.setting.${settingId}`)
        }
        catch (e) {
            if (this.settings.some(setting => setting.id === settingId)) {
                throw e
            }
            throw new Error(`Combat Ready | "${settingId}" is not a registered setting for "${this.id}". If you're the module/system developer, please add it to the return values of your Animations "get settings()" function.`)
        }
    }

    /**
     * Constructs a new instance of he speed provider
     *
     * This function should neither be called or overridden by speed provider implementations
     */
    constructor(id) {
        this.id = id
    }
}

export class NativeAnimationTheme extends CombatReadyAnimationTheme {
    public BANNER: HTMLDivElement;
    public CHEVRONS: HTMLCollectionOf<HTMLElement>;
    public BEAMS: HTMLCollectionOf<HTMLElement>;
    public LABEL: HTMLDivElement;
    public COVER: HTMLDivElement;
    public initialize() {
        let body = document.getElementsByTagName("body")[0] as HTMLElement;
        let sidebar = document.getElementById("sidebar") as HTMLElement;

        // Build HTML to Inject
        let cover = document.createElement("div");
        addClass(cover, "combatready-boardcover");

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
        // Ajust due to DOM elements
        banner.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;


        this.BANNER = banner;
        this.CHEVRONS = chevrons;
        this.BEAMS = beams;
        this.LABEL = label;
        this.COVER = cover;

        // language specific fonts
        switch (getGame().i18n.lang) {
            case "en":
                this.LABEL.style.fontFamily = '"Speedp", "Signika", "Palatino Linotype", serif';
                this.LABEL.style.fontSize = "124px";
                break;
            case "ko":
                this.LABEL.style.fontFamily = '"BMHannaPro", "Signika", "Palatino Linotype", serif';
                this.LABEL.style.fontSize = "100px";
                break;
            case "ja":
                this.LABEL.style.fontFamily = '"GenShinGothicBold", "Signika", "Palatino Linotype", serif';
                this.LABEL.style["font-size"] = "100px";
                break;
            default:
                this.LABEL.style.fontFamily = '"Ethnocentric", "Signika", "Palatino Linotype", serif';
                this.LABEL.style["font-size"] = "90px";
                break;
        }
    }
    public destroy() {
        this.BANNER.remove();
        for (let idx = 0; idx < this.CHEVRONS.length; idx++) {
            const element = this.CHEVRONS[idx];
            element.remove();
        }
        for (let idx = 0; idx < this.BEAMS.length; idx++) {
            const element = this.BEAMS[idx];
            element.remove();
        }
        this.LABEL.remove();
        this.COVER.remove();
    }

    onClickTurnBanner(ev) {
        document.removeEventListener("click", (<NativeAnimationTheme>currentTheme).onClickTurnBanner);
        (<NativeAnimationTheme>currentTheme).cleanAnimations();
    }
    onClickNextBanner(ev) {
        document.removeEventListener("click", (<NativeAnimationTheme>currentTheme).onClickNextBanner);
        // kill next label anim if the user is fast
        let anims = gsap.getTweensOf((<NativeAnimationTheme>currentTheme).LABEL);
        for (let tween of anims) {
            tween.kill();
        }

        // hide cover, but keep the beams to let the user know their turn is coming up!
        addClass((<NativeAnimationTheme>currentTheme).BANNER, "combatready-bannerdisable");

        gsap.to((<NativeAnimationTheme>currentTheme).LABEL, 0.5, {
            opacity: 0.3,
            onComplete: function () {
                if ((<NativeAnimationTheme>currentTheme).getSetting("disablenextuplingering")) {
                    (<NativeAnimationTheme>currentTheme).BANNER.style.display = "none";
                }
            },
        });
        gsap.to((<NativeAnimationTheme>currentTheme).COVER, 0.5, {
            opacity: 0,
            onComplete: function () {
                (<NativeAnimationTheme>currentTheme).COVER.style.display = "none";
            },
        });
    }

    cleanAnimations() {
        let anims = gsap.getTweensOf(this.CHEVRONS);
        for (let tween of anims) {
            tween.kill();
        }
        anims = gsap.getTweensOf(this.LABEL);
        for (let tween of anims) {
            tween.kill();
        }
        anims = gsap.getTweensOf(this.COVER);
        for (let tween of anims) {
            tween.kill();
        }

        for (let e of this.BEAMS) e.style.animation = "none";

        this.BANNER.style.display = "none";
        removeClass(this.BANNER, "combatready-bannerdisable");
        const x = (_this) => { this.COVER.style.display = "none"; }
        x.bind(this);
        gsap.to(this.COVER, 0.5, {
            opacity: 0,
            onComplete: x,
        });
    }
    nextUpAnimation() {
        if (this.getSetting("animationstyle") !== "None") {
            for (let e of this.CHEVRONS) e.style.left = "-200px";
            if (this.getSetting("animationstyle") == "Complete") {


                // Randomize our beams
                for (let beam of this.BEAMS) {
                    let width = Math.floor(Math.random() * 100) + 30;
                    let time = Math.floor(Math.random() * 1.5 * 100) / 100 + 2.0;
                    let delay = Math.floor(Math.random() * 3 * 100) / 100 + 0.01;
                    let toffset = Math.floor(Math.random() * 90) + 10;
                    let iheight = Math.floor(Math.random() * 3) + 2;

                    beam.style.cssText += `animation: speedbeam ${time}s linear ${delay}s infinite; top: ${toffset}%; width: ${width}px; height: ${iheight}; left: ${-width}px;`;
                }

                gsap.to(this.COVER, 2, { opacity: 0.75 });
            }
            removeClass(this.BANNER, "combatready-bannerdisable");
            this.BANNER.style.display = "flex";
            this.COVER.style.display = "block";
            this.BANNER.style.display = "flex";
            this.COVER.style.display = "block";
            document.removeEventListener("click", this.onClickTurnBanner);
            document.removeEventListener("click", this.onClickNextBanner);
            document.addEventListener("click", this.onClickNextBanner);
            this.LABEL.style.opacity = "0";
            this.LABEL.textContent = getGame().i18n.localize("combatReady.text.next");
            gsap.to(this.LABEL, 1, { delay: 2, opacity: 1 });
        }
    }
    yourTurnAnimation() {
        if (this.getSetting("animationstyle") !== "None") {
            for (let e of this.CHEVRONS) e.style.left = "-200px";
            for (let e of this.BEAMS) {
                e.style.left = "-200px";
                e.style.animation = "none";
            }

            this.LABEL.style.opacity = "0";
            this.LABEL.textContent = getGame().i18n.localize("combatReady.text.turn");

            removeClass(this.BANNER, "combatready-bannerdisable");

            this.BANNER.style.display = "flex";
            this.COVER.style.display = "block";
            document.removeEventListener("click", this.onClickNextBanner);
            document.removeEventListener("click", this.onClickTurnBanner);
            document.addEventListener("click", this.onClickTurnBanner);

            if (this.getSetting("animationstyle") == "Complete") {
                gsap.to(this.CHEVRONS, {
                    left: "100%",
                    stagger: {
                        repeat: -1,
                        each: 3,
                    },
                    ease: "ease",
                });
                gsap.to(this.COVER, 2, { opacity: 0.75 });
            }
            gsap.to(this.LABEL, 1, { delay: 2, opacity: 1 });
        }
    }
    adjustWidth(width: Number) {
        this.BANNER.style.width = `calc(100% - ${width}px)`;
    }
    get settings() {
        return [
            {
                id: "disablenextuplingering",
                setting: {
                    name: "combatReady.themes.native.settings.disableNextUpLingering.name",
                    hint: "combatReady.themes.native.settings.disableNextUpLingering.hint",
                    scope: "world",
                    config: true,
                    default: false,
                    type: Boolean,
                }
            },
            {
                id: "usecombatantnameassubtitle",
                setting: {
                    name: "combatReady.themes.native.settings.useCombatantNameAsSubtitle.name",
                    hint: "combatReady.themes.native.settings.useCombatantNameAsSubtitle.hint",
                    scope: "world",
                    config: true,
                    default: "None",
                    choices: {
                        "Neither": "combatReady.themes.native.settings.useCombatantNameAsSubtitle.neither",
                        "NextUp": "combatReady.themes.native.settings.useCombatantNameAsSubtitle.nextUp",
                        "YourTurn": "combatReady.themes.native.settings.useCombatantNameAsSubtitle.yourTurn",
                        "Both": "combatReady.themes.native.settings.useCombatantNameAsSubtitle.both"
                    },
                    type: String,
                }
            },
            {
                id: "customtextfornextup",
                setting: {
                    name: "combatReady.themes.native.settings.customTextForNextUp.name",
                    hint: "combatReady.themes.native.settings.customTextForNextUp.hint",
                    scope: "world",
                    config: true,
                    default: "",
                    type: String,
                    multiline: true
                }
            },
            {
                id: "customtextforyourturn",
                setting: {
                    name: "combatReady.themes.native.settings.customTextForYourTurn.name",
                    hint: "combatReady.themes.native.settings.customTextForYourTurn.hint",
                    scope: "world",
                    config: true,
                    default: "",
                    type: String,
                    multiline: true
                }
            },
            {
                id: "animationstyle",
                setting: {
                    name: "combatReady.themes.native.settings.animationStyle.name",
                    hint: "combatReady.themes.native.settings.animationStyle.hint",
                    scope: "world",
                    config: true,
                    default: "Complete",
                    choices: {
                        "Complete": "combatReady.themes.native.settings.text.complete",
                        "Reduced": "combatReady.themes.native.settings.text.reduced",
                        "None": "combatReady.themes.native.settings.text.none"
                    },
                    type: String,
                }
            }
        ]
    }
}