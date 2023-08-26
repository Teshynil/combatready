import { gsap } from "../combatready";
import { getCombats, MODULE_NAME } from "./settings";
import { availableAnimations, currentAnimation } from "./api";
import { CombatReady } from "./combatReady";
import { CombatReadySubSettings, enumerateSettings, SettingsAwareEntity } from "./settingsAwareEntity";

export class CombatReadyAnimation extends SettingsAwareEntity {
	override type = "animations";
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

	public initialize(): void {
		throw new Error("A CombatReadyAnimation must implement the initialize function")
	}
	public destroy(): void {
		throw new Error("A CombatReadyAnimation must implement the destroy function")
	}
	/**
	 * Prefill the data variable with data which would be useful
	 * The default behaviour is to get the current combat, current combatant, next combatant and round number
	 * This function is called on demand by your animations, use it as you would like.
	 */
	public prepare(): boolean {
		if (!this.testMode) {
			let combats = getCombats();
			if (combats == undefined) return false;
			let curCombat = combats.active as StoredDocument<Combat>;
			if (curCombat == undefined) return false;
			let curCombatant = curCombat.combatant;
			if (curCombatant == undefined) return false;

			let nextTurn = ((curCombat.turn || 0) + 1) % curCombat.turns.length;
			if (nextTurn > curCombat.turns.length - 1) nextTurn = 0;
			//@ts-ignore
			if (game.settings.get("core", "combatTrackerConfig")?.skipDefeated ?? false) {
				while (curCombat.turns[nextTurn].isDefeated) {
					if (nextTurn == curCombat.turn) break;// Avoid running infinitely
					nextTurn++;
					if (nextTurn > curCombat.turns.length - 1) nextTurn = 0;
				}
			}
			let nxtCombatant = curCombat.turns[nextTurn];
			let name = "";
			let combatantName = curCombatant.name;
			let playerName = <string>game.user?.name;
			let actorName = curCombatant.actor?.name ?? playerName;
			let nxtName = "";
			let nxtCombatantName = nxtCombatant.name;
			let nxtPlayerName = <string>game.user?.name;
			let nxtActorName = nxtCombatant.actor?.name ?? playerName;
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

			let selectedToken: Token | undefined = <Token>(canvas.tokens?.objects?.children.find(e => {
				//@ts-ignore
				return (<Token>e).controlled;
			})
			) ?? undefined;
			var testCombatant = new Combatant({
				tokenId: selectedToken?.id ?? '',
				name: (selectedToken == undefined) ? <string>game.user?.name : selectedToken.name,
				actorId: selectedToken?.actor?.id ?? ''
			}, {
				parent: testCombat
			});
			let name = "";
			let combatantName = testCombatant.name;
			let playerName = <string>game.user?.name;
			let actorName = testCombatant.actor?.name ?? playerName;
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
		return true;
	}
	public playAcknowledge(): void {
		CombatReady.playSound(CombatReady.ACK_SOUND);
		return;
	}
	public onChangeRound(): void {
		return;
	}
	public onChangeTurn(): void {
		return;
	}
	public yourTurnAnimation(): void {
		return;
	}
	public nextUpAnimation(): void {
		return;
	}
	public nextRoundAnimation(): void {
		return;
	}
	public cleanAnimations(): void {
		return;
	}
	public adjustWidth(): void {
		return;
	}


	get settings(): Array<{ id: string, setting: any }> {
		return []
	}

	constructor(id) {
		super(id);
	}
}

export class NativeAnimation extends CombatReadyAnimation {
	name = "CombatReady";
	public BANNER: HTMLDivElement;
	public CHEVRONS: HTMLCollectionOf<HTMLElement>;
	public BEAMS: HTMLCollectionOf<HTMLElement>;
	public LABEL: HTMLDivElement;
	public COVER: HTMLDivElement;
	public prepare(): boolean {
		if (!super.prepare()) return false;
		switch (this.getSetting("combatantnameorigin")) {
			case "LinkedActor":
				this.data.currentTexts.name = this.data.currentTexts.actorName;
				this.data.nextTexts.name = this.data.nextTexts.actorName;
				break;
			case "CurrentPlayer":
				this.data.currentTexts.name = this.data.currentTexts.playerName;
				this.data.nextTexts.name = this.data.nextTexts.playerName;
				break;
			case "Combatant":
			default:
				this.data.currentTexts.name = this.data.currentTexts.combatantName;
				this.data.nextTexts.name = this.data.nextTexts.combatantName;
				break;
		}
		return true;
	}
	public initialize(): void {
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
		switch (game.i18n.lang) {
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
	public destroy(): void {
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

	onClickTurnBanner(ev): void {
		document.removeEventListener("click", (<NativeAnimation>currentAnimation).onClickTurnBanner);
		(<NativeAnimation>currentAnimation).playAcknowledge();
		(<NativeAnimation>currentAnimation).cleanAnimations();
	}
	onClickNextBanner(ev): void {
		document.removeEventListener("click", (<NativeAnimation>currentAnimation).onClickNextBanner);
		// kill next label anim if the user is fast
		let anims = gsap.getTweensOf((<NativeAnimation>currentAnimation).LABEL);
		for (let tween of anims) {
			tween.kill();
		}

		// hide cover, but keep the beams to let the user know their turn is coming up!
		$((<NativeAnimation>currentAnimation).BANNER).addClass("combatready-bannerdisable");

		gsap.to((<NativeAnimation>currentAnimation).LABEL, 0.5, {
			opacity: 0.3,
			onComplete: function () {
				if ((<NativeAnimation>currentAnimation).getSetting("disablenextuplingering")) {
					(<NativeAnimation>currentAnimation).BANNER.style.display = "none";
				}
			},
		});
		gsap.to((<NativeAnimation>currentAnimation).COVER, 0.5, {
			opacity: 0,
			onComplete: function () {
				(<NativeAnimation>currentAnimation).COVER.style.display = "none";
			},
		});
	}

	cleanAnimations(): void {
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
	nextUpAnimation(): void {
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
				this.LABEL.innerHTML = `<span>${game.i18n.localize("combatReady.text.next")}</span><span>${this.data.nextTexts.name}</span>`;
			} else {
				this.LABEL.textContent = game.i18n.localize("combatReady.text.next");
			}
			this.LABEL.style.opacity = "0";
			gsap.to(this.LABEL, 1, {
				delay: 2, opacity: 1,
				onComplete: function () {
					if (<number>currentAnimation.getSetting("removeanimationsafter") >= 0) {
						setTimeout(() => { currentAnimation.cleanAnimations(); }, <number>currentAnimation.getSetting("removeanimationsafter") * 1000);
					}
				}
			});
		}
	}
	yourTurnAnimation(): void {
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
				this.LABEL.innerHTML = `<span>${game.i18n.localize("combatReady.text.turn")}</span><span>${this.data.currentTexts.name}</span>`;
			} else {
				this.LABEL.textContent = game.i18n.localize("combatReady.text.turn");
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
				if (<number>currentAnimation.getSetting("removeanimationsafter") >= 0) {
					setTimeout(() => { currentAnimation.cleanAnimations(); }, (<number>currentAnimation.getSetting("removeanimationsafter")) * 1000);
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
	adjustWidth(): void {
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
					name: "combatReady.animations.native.settings.removeAnimationsAfter.name",
					hint: "combatReady.animations.native.settings.removeAnimationsAfter.hint",
					scope: "world",
					config: true,
					default: -1,
					type: Number,
				}
			},
			{
				id: "disablenextuplingering",
				setting: {
					name: "combatReady.animations.native.settings.disableNextUpLingering.name",
					hint: "combatReady.animations.native.settings.disableNextUpLingering.hint",
					scope: "world",
					config: true,
					default: false,
					type: Boolean,
				}
			},
			{
				id: "combatantnameorigin",
				setting: {
					name: "combatReady.animations.native.settings.combatantNameOrigin.name",
					hint: "combatReady.animations.native.settings.combatantNameOrigin.hint",
					scope: "world",
					config: true,
					default: "None",
					choices: {
						"LinkedActor": "combatReady.animations.native.settings.combatantNameOrigin.linkedActor",
						"CurrentPlayer": "combatReady.animations.native.settings.combatantNameOrigin.currentPlayer",
						"Combatant": "combatReady.animations.native.settings.combatantNameOrigin.combatant"
					},
					type: String,
				}
			},
			{
				id: "usecombatantnameassubtitle",
				setting: {
					name: "combatReady.animations.native.settings.useCombatantNameAsSubtitle.name",
					hint: "combatReady.animations.native.settings.useCombatantNameAsSubtitle.hint",
					scope: "world",
					config: true,
					default: "None",
					choices: {
						"Neither": "combatReady.animations.native.settings.useCombatantNameAsSubtitle.neither",
						"NextUp": "combatReady.animations.native.settings.useCombatantNameAsSubtitle.nextUp",
						"YourTurn": "combatReady.animations.native.settings.useCombatantNameAsSubtitle.yourTurn",
						"Both": "combatReady.animations.native.settings.useCombatantNameAsSubtitle.both"
					},
					type: String,
				}
			},
			{
				id: "customtextfornextup",
				setting: {
					name: "combatReady.animations.native.settings.customTextForNextUp.name",
					hint: "combatReady.animations.native.settings.customTextForNextUp.hint",
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
					name: "combatReady.animations.native.settings.customTextForYourTurn.name",
					hint: "combatReady.animations.native.settings.customTextForYourTurn.hint",
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
					name: "combatReady.animations.native.settings.arrowsColor.name",
					hint: "combatReady.animations.native.settings.arrowsColor.hint",
					label: "Color Picker",
					default: "#6fcf6f",
					scope: "world",
					type: "Color",
					onChange: (value) => {
						//@ts-ignore
						for (let e of this.CHEVRONS) e.style.color = value;
					}
				}
			},
			{
				id: "fontcolor",
				setting: {
					name: "combatReady.animations.native.settings.fontColor.name",
					hint: "combatReady.animations.native.settings.fontColor.hint",
					label: "Color Picker",
					default: "#ffffff",
					scope: "world",
					type: "Color",
					onChange: (value) => {
						//@ts-ignore
						currentAnimation.LABEL.style.color = value;
					}
				}
			},
			{
				id: "animationstyle",
				setting: {
					name: "combatReady.animations.native.settings.animationStyle.name",
					hint: "combatReady.animations.native.settings.animationStyle.hint",
					scope: "world",
					config: true,
					default: "Complete",
					choices: {
						"Complete": "combatReady.animations.native.settings.text.complete",
						"Reduced": "combatReady.animations.native.settings.text.reduced",
						"None": "combatReady.animations.native.settings.text.none"
					},
					type: String,
				}
			}
		]
	}
}

export class AnimationSubSettings extends CombatReadySubSettings {
	private windowsStates: Map<number, boolean> = new Map<number, boolean>();
	private endPreviewDialog: Array<Dialog> = [];
	override type = "animations";
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "combatready-animations-settings",
			title: game.i18n.localize("combatReady.settings.animations.settings.name"),
			template: "modules/combatready/templates/animations_settings.html"
		})
	}
	getData(options: Application.RenderOptions): FormApplication.Data<{}, FormApplicationOptions> | Promise<FormApplication.Data<{}, FormApplicationOptions>> {
		type Data = { object: {}, options: FormApplicationOptions, title: string, isGM: Boolean, animations: Array<any>, selectedAnimationName: String, selectedAnimation: any };
		const data: Data = {
			isGM: false,
			animations: [],
			selectedAnimationName: "",
			selectedAnimation: undefined,
			object: {},
			options: AnimationSubSettings.defaultOptions,
			title: ""
		};
		data.isGM = game.user?.isGM ?? false;
		const selectedAnimation = currentAnimation.id;

		data.animations = Object.values(availableAnimations).map(iAnimation => {
			const animation: { id: string, hasSettings: boolean, settings: any, selectTitle: string, isSelected: boolean } = {
				id: "",
				hasSettings: false,
				settings: undefined,
				selectTitle: "",
				isSelected: false
			}
			animation.id = iAnimation.id
			animation.hasSettings = iAnimation instanceof CombatReadyAnimation
			if (animation.hasSettings)
				animation.settings = enumerateSettings(iAnimation)
			animation.selectTitle = `${iAnimation.id} | ${iAnimation.name}`;
			if (iAnimation.id == "native") animation.selectTitle = iAnimation.name;
			animation.isSelected = animation.id === selectedAnimation
			return animation
		})
		data.selectedAnimationName = data.animations.find(animation => animation.isSelected).selectTitle

		data.selectedAnimation = {
			id: "selectedAnimation",
			name: game.i18n.localize("combatReady.settings.animations.selectAnimation.name"),
			hint: game.i18n.localize("combatReady.settings.animations.selectAnimation.hint"),
			type: String,
			choices: data.animations.reduce((choices, animations) => {
				choices[animations.id] = animations.selectTitle
				return choices
			}, {}),
			value: selectedAnimation,
			isCheckbox: false,
			isSelect: true,
			isRange: false,
		}
		return data;
	}
	activateListeners(html: JQuery): void {
		super.activateListeners(html)
		html.find("button#combatready\\.animations\\.test\\.yourTurn").on("click", this.onAnimationTestClick.bind(this))
		html.find("button#combatready\\.animations\\.test\\.nextUp").on("click", this.onAnimationTestClick.bind(this))
		html.find("button#combatready\\.animations\\.test\\.nextRound").on("click", this.onAnimationTestClick.bind(this))
	} animations

	onAnimationTestClick(event): void {
		Object.values(ui.windows).forEach(async (window) => {
			//@ts-ignore
			this.windowsStates.set(<Number>(window.appId), window._minimized);
			await window.minimize();
		});
		this.showEndPreviewDialog();
		currentAnimation.testMode = true;
		setTimeout(() => {
			switch (event.currentTarget.value) {
				case "yourTurn":
					currentAnimation.yourTurnAnimation();
					break;
				case "nextUp":
					currentAnimation.nextUpAnimation();
					break;
				case "nextRound":
					currentAnimation.nextRoundAnimation();
					break;

				default:
					break;
			}
			currentAnimation.testMode = false;
		}, 64);
	}

	async closeEndPreviewDialog(): Promise<void> {
		// go through all dialogs that we've opened and closed them
		for (let d of this.endPreviewDialog) {
			d.close();
		}
		this.endPreviewDialog.length = 0;
	}

	showEndPreviewDialog(): void {
		this.closeEndPreviewDialog().then(() => {
			let d = new Dialog(
				{
					title: "End Preview",
					default: "",
					content: "",
					buttons: {
						endpreview: {
							label: game.i18n.localize("combatReady.settings.animations.endPreview"),
							callback: () => {
								currentAnimation.cleanAnimations();
								this.windowsStates.forEach(async (windowState, index) => {
									if (ui.windows[index] !== undefined) {
										if (!windowState) {
											await ui.windows[index].maximize();
										}
									}
									this.setPosition({ height: "auto", width: 600 });
								});
							},
						},
					},
				},
				{
					width: 300,
					top: 5,
				}
			);
			d.render(true);
			// add dialog to array of dialogs. when using just a single object we'd end up with multiple dialogs
			this.endPreviewDialog.push(d);
		});
	}
}