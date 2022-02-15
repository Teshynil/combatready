import { gsap } from "../combatready";
import { getCanvas, getCombats, getGame, MODULE_NAME } from "./settings";
import { availableThemes, currentTheme } from "./api";
import { CombatReady } from "./combatReady";
import { CombatReadySubSettings, enumerateSettings, SettingsAwareEntity } from "./settingsAwareEntity";

export class CombatReadyAnimationTheme extends SettingsAwareEntity {
    override type = "themes";
    public testMode: boolean;
    public data: {
        currentCombat: Combat,
        currentCombatant: Combatant,
        nextCombatant: Combatant,
        round: number,
        currentTexts: {
            name: string,
            combatantName: string,
            actorName: string,
            playerName: string
        },
        nextTexts: {
            name: string,
            combatantName: string,
            actorName: string,
            playerName: string
        }
    };

    public initialize() {
        throw new Error("A CombatReadyTheme must implement the initialize function")
    }
    public destroy() {
        throw new Error("A CombatReadyTheme must implement the destroy function")
    }
    /**
     * Prefill the data variable with data which would be useful
     * The default behaviour is to get the current combat, current combatant, next combatant and round number
     * This function is called on demand by your themes, use it as you would like.
     */
    public prepare() {
        if (!this.testMode) {
            let curCombat = getCombats().active as Combat;
            let curCombatant = curCombat.combatant;
            let nxtturn = ((curCombat.turn || 0) + 1) % curCombat.turns.length;
            if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
            //@ts-ignore
            if(getGame().settings.get("core","combatTrackerConfig")?.skipDefeated??false){
                while(curCombat.turns[nxtturn].data.defeated){
                    if(nxtturn==curCombat.turn)break;// Avoid running infinitely
                    nxtturn++;
                    if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
                }
            }
            let nxtCombatant = curCombat.turns[nxtturn];
            let name = "";
            let combatantName = curCombatant.name;
            let playerName = <string>getGame().user?.name;
            let actorName = curCombatant.actor?.name ?? playerName;
            let nxtName = "";
            let nxtCombatantName = nxtCombatant.name;
            let nxtPlayerName = <string>getGame().user?.name;
            let nxtActorName = nxtCombatant.actor?.name ?? playerName;
            switch (this.getSetting("combatantnameorigin")) {
                case "LinkedActor":
                    name = actorName;
                    nxtName = nxtActorName;
                    break;
                case "CurrentPlayer":
                    name = playerName;
                    nxtName = nxtPlayerName;
                    break;
                case "Combatant":
                default:
                    name = combatantName;
                    nxtName = nxtCombatantName;
                    break;
            }
            this.data = {
                currentCombat: curCombat,
                currentCombatant: curCombatant,
                nextCombatant: nxtCombatant,
                round: curCombat.round,
                currentTexts: {
                    name: name,
                    combatantName: combatantName,
                    actorName: actorName,
                    playerName: playerName
                },
                nextTexts: {
                    name: nxtName,
                    combatantName: nxtCombatantName,
                    actorName: nxtActorName,
                    playerName: nxtPlayerName
                }
            };
        } else {//In case the test mode is active use the selected token as combatant if none selected use the on
            //@ts-ignore
            var testCombat = new Combat();
            //@ts-ignore
            let selectedToken = (<Token>(getCanvas().tokens?.objects?.children.find(e => e._controlled)))?.id ?? '';
            var testCombatant = new Combatant({ tokenId: selectedToken }, { parent: testCombat });
            if (selectedToken == "") testCombatant.data.name = <string>getGame().user?.name;
            let name = "";
            let combatantName = testCombatant.name;
            let playerName = <string>getGame().user?.name;
            let actorName = testCombatant.actor?.name ?? playerName;
            switch (this.getSetting("combatantnameorigin")) {
                case "LinkedActor":
                    name = actorName;
                    break;
                case "CurrentPlayer":
                    name = playerName;
                    break;
                case "Combatant":
                default:
                    name = combatantName;
                    break;
            }
            this.data = {
                currentCombat: testCombat,
                currentCombatant: testCombatant,
                nextCombatant: testCombatant,
                round: 1,
                currentTexts: {
                    name: name,
                    combatantName: combatantName,
                    actorName: actorName,
                    playerName: playerName
                },
                nextTexts: {
                    name: name,
                    combatantName: combatantName,
                    actorName: actorName,
                    playerName: playerName
                }
            }
        }
    }
    public playAcknowledge() {
        CombatReady.playSound(CombatReady.ACK_SOUND);
        return;
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
    public adjustWidth() {
        return;
    }


    get settings(): Array<{ id: string, setting: any }> {
        return []
    }

    constructor(id) {
        super(id);
    }
}

export class NativeAnimationTheme extends CombatReadyAnimationTheme {
    name = "CombatReady";
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
        $(cover).addClass("combatready-boardcover");

        let banner = document.createElement("div");
        let label = document.createElement("div");
        $(banner).addClass("combatready-container");
        $(label).addClass("combatready-label");
        label.style.color = <string>this.getSetting("fontcolor");
        // chevrons
        for (let idx = 0; idx < 6; ++idx) {
            let chevron = document.createElement("div");
            $(chevron).addClass("combatready-chevron");
            $(chevron).addClass("fas");
            $(chevron).addClass("fa-chevron-right");
            chevron.style.color = <string>this.getSetting("arrowscolor");
            banner.appendChild(chevron);
        }
        let chevrons = banner.getElementsByClassName("combatready-chevron") as HTMLCollectionOf<HTMLElement>;
        // beams
        for (let idx = 0; idx < 40; ++idx) {
            let beam = document.createElement("div");
            $(beam).addClass("combatready-beam");
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
        this.ready = true;
    }
    public destroy() {
        for (let idx = 0; idx < this.CHEVRONS?.length ?? 0; idx++) {
            const element = this.CHEVRONS[idx];
            element.remove();
        }
        for (let idx = 0; idx < this.BEAMS?.length ?? 0; idx++) {
            const element = this.BEAMS[idx];
            element.remove();
        }
        this.BANNER?.remove();
        this.LABEL?.remove();
        this.COVER?.remove();
        this.ready = false;
    }

    onClickTurnBanner(ev) {
        document.removeEventListener("click", (<NativeAnimationTheme>currentTheme).onClickTurnBanner);
        (<NativeAnimationTheme>currentTheme).playAcknowledge();
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
        $((<NativeAnimationTheme>currentTheme).BANNER).addClass("combatready-bannerdisable");

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
        if (!this.ready) return;
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
        $(this.BANNER).removeClass("combatready-bannerdisable");
        const x = (_this) => { this.COVER.style.display = "none"; }
        x.bind(this);
        gsap.to(this.COVER, 0.1, {
            opacity: 0,
            onComplete: x,
        });
    }
    nextUpAnimation() {
        if (!this.ready) return;
        this.prepare();
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
                this.COVER.style.display = "block";
                this.COVER.style.opacity = "0";
                gsap.to(this.COVER, 2, { opacity: 0.75 });
            }
            $(this.BANNER).removeClass("combatready-bannerdisable");
            this.BANNER.style.display = "flex";
            this.COVER.style.display = "block";
            document.removeEventListener("click", this.onClickTurnBanner);
            document.removeEventListener("click", this.onClickNextBanner);
            if (<number>this.getSetting("removeanimationsafter") < 0) {
                document.addEventListener("click", this.onClickNextBanner);
            }
            this.LABEL.style.opacity = "0";
            if (this.getSetting("customtextfornextup") != "") {
                let html = this.getSetting("customtextfornextup");
                let label = Handlebars.compile(html);
                this.LABEL.innerHTML = label({ name: this.data.nextTexts.name, actor: this.data.nextTexts.actorName, player: this.data.nextTexts.playerName, combatant: this.data.nextTexts.combatantName });
            } else if (this.getSetting("usecombatantnameassubtitle") == "NextUp" || this.getSetting("usecombatantnameassubtitle") == "Both") {
                this.LABEL.innerHTML = `<span>${getGame().i18n.localize("combatReady.text.next")}</span><span>${this.data.nextTexts.name}</span>`;
            } else {
                this.LABEL.textContent = getGame().i18n.localize("combatReady.text.next");
            }
            this.LABEL.style.opacity = "0";
            gsap.to(this.LABEL, 1, {
                delay: 2, opacity: 1,
                onComplete: function () {
                    if (<number>currentTheme.getSetting("removeanimationsafter") >= 0) {
                        setTimeout(() => { currentTheme.cleanAnimations(); }, <number>currentTheme.getSetting("removeanimationsafter")*1000);
                    }
                }
            });
        }
    }
    yourTurnAnimation() {
        if (!this.ready) return;
        this.prepare();
        if (this.getSetting("animationstyle") !== "None") {
            for (let e of this.CHEVRONS) e.style.left = "-200px";
            for (let e of this.BEAMS) {
                e.style.left = "-200px";
                e.style.animation = "none";
            }

            this.LABEL.style.opacity = "0";

            if (this.getSetting("customtextforyourturn") != "") {
                let html = this.getSetting("customtextforyourturn");
                let label = Handlebars.compile(html);
                this.LABEL.innerHTML = label({ name: this.data.currentTexts.name, actor: this.data.currentTexts.actorName, player: this.data.currentTexts.playerName, combatant: this.data.currentTexts.combatantName });
            } else if (this.getSetting("usecombatantnameassubtitle") == "YourTurn" || this.getSetting("usecombatantnameassubtitle") == "Both") {
                this.LABEL.innerHTML = `<span>${getGame().i18n.localize("combatReady.text.turn")}</span><span>${this.data.currentTexts.name}</span>`;
            } else {
                this.LABEL.textContent = getGame().i18n.localize("combatReady.text.turn");
            }

            $(this.BANNER).removeClass("combatready-bannerdisable");

            this.BANNER.style.display = "flex";
            this.COVER.style.display = "block";
            document.removeEventListener("click", this.onClickNextBanner);
            document.removeEventListener("click", this.onClickTurnBanner);
            if (<number>this.getSetting("removeanimationsafter") < 0) {
                document.addEventListener("click", this.onClickTurnBanner);
            }
            const x = () => {
                if (<number>currentTheme.getSetting("removeanimationsafter") >= 0) {
                    setTimeout(() => { currentTheme.cleanAnimations(); }, (<number>currentTheme.getSetting("removeanimationsafter")) * 1000);
                }
            }
            if (this.getSetting("animationstyle") == "Complete") {
                gsap.to(this.CHEVRONS, {
                    left: "100%",
                    stagger: {
                        repeat: -1,
                        each: 3,
                    },
                    ease: "ease",
                });
                gsap.to(this.COVER, 2, { display: "block", opacity: 0.75, onComplete: x });
                gsap.to(this.LABEL, 1, { delay: 1, opacity: 1 });
            } else {
                gsap.to(this.COVER, 2, { display: "block", opacity: 0.75, onComplete: x });
                gsap.to(this.LABEL, 1, { delay: 0, opacity: 1 });
            }
        }
    }
    adjustWidth() {
        let sidebar = document.getElementById("sidebar") as HTMLElement;
        let width = sidebar.offsetWidth;
        if ($(document.body).hasClass("mobile-improvements")) width = 0;
        this.BANNER.style.width = `calc(100% - ${width}px)`;
    }
    get settings() {
        return [
            {
                id: "removeanimationsafter",
                setting: {
                    name: "combatReady.themes.native.settings.removeAnimationsAfter.name",
                    hint: "combatReady.themes.native.settings.removeAnimationsAfter.hint",
                    scope: "world",
                    config: true,
                    default: -1,
                    type: Number,
                }
            },
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
                id: "combatantnameorigin",
                setting: {
                    name: "combatReady.themes.native.settings.combatantNameOrigin.name",
                    hint: "combatReady.themes.native.settings.combatantNameOrigin.hint",
                    scope: "world",
                    config: true,
                    default: "None",
                    choices: {
                        "LinkedActor": "combatReady.themes.native.settings.combatantNameOrigin.linkedActor",
                        "CurrentPlayer": "combatReady.themes.native.settings.combatantNameOrigin.currentPlayer",
                        "Combatant": "combatReady.themes.native.settings.combatantNameOrigin.combatant"
                    },
                    type: String,
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
                id: "arrowscolor",
                setting: {
                    name: "combatReady.themes.native.settings.arrowsColor.name",
                    hint: "combatReady.themes.native.settings.arrowsColor.hint",
                    label: "Color Picker",
                    default: "#6fcf6f",
                    scope: "world",
                    type: "Color",
                    onChange: (value) => {
                        //@ts-ignore
                        for (let e of currentTheme.CHEVRONS) e.style.color = value;
                    }
                }
            },
            {
                id: "fontcolor",
                setting: {
                    name: "combatReady.themes.native.settings.fontColor.name",
                    hint: "combatReady.themes.native.settings.fontColor.hint",
                    label: "Color Picker",
                    default: "#ffffff",
                    scope: "world",
                    type: "Color",
                    onChange: (value) => {
                        //@ts-ignore
                        currentTheme.LABEL.style.color = value;
                    }
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

export class ThemeSubSettings extends CombatReadySubSettings {
    override type = "themes";
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "combatready-themes-settings",
            title: getGame().i18n.localize("combatReady.settings.themes.settings.name"),
            template: "modules/combatready/templates/themes_settings.html"
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
                theme.settings = enumerateSettings(iTheme)
            theme.selectTitle = `${iTheme.id} | ${iTheme.name}`;
            if (iTheme.id == "native") theme.selectTitle = iTheme.name;
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
    activateListeners(html: JQuery) {
        super.activateListeners(html)
        html.find("button#combatready\\.themes\\.test\\.yourTurn").on("click", this.onThemeTestClick.bind(this))
        html.find("button#combatready\\.themes\\.test\\.nextUp").on("click", this.onThemeTestClick.bind(this))
        html.find("button#combatready\\.themes\\.test\\.nextRound").on("click", this.onThemeTestClick.bind(this))
    }

    onThemeTestClick(event) {
        currentTheme.testMode = true;
        setTimeout(() => {
            switch (event.currentTarget.value) {
                case "yourTurn":
                    currentTheme.yourTurnAnimation();
                    break;
                case "nextUp":
                    currentTheme.nextUpAnimation();
                    break;
                case "nextRound":
                    currentTheme.nextRoundAnimation();
                    break;

                default:
                    break;
            }
            currentTheme.testMode = false;
        }, 64);
    }
}