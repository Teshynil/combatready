import { getCanvas, getCombats, getGame, MODULE_NAME } from "./settings";
import { currentAnimation, currentTimer } from "./api";
import { warn } from "../combatready";

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
	public static WAITING_FOR_UPDATE: boolean = false;
	public static MASTEROFTIME: string;
	public static DATA: {
		combats: CombatEncounters,
		currentCombat: StoredDocument<Combat>,
		currentCombatant: Combatant
	};

	static fillData(): boolean {
		let combats = getCombats();
		if (combats == undefined) {
			warn("Combats undefined failing fillData()"); return false;
		}
		let curCombat = combats.active as StoredDocument<Combat>;
		if (curCombat == undefined) {
			warn("Current Combat undefined failing fillData()"); return false;
		}
		let entry = curCombat.combatant;
		if (entry == undefined) {
			warn("Current Combatant undefined failing fillData()"); return false;
		}
		CombatReady.DATA = { combats: combats, currentCombat: curCombat, currentCombatant: entry };
		return true;
	}
	static resolvePlayersPermission(permString: string, callback: Function): void {
		switch (permString) {
			case "None":
				break;
			case "GM+Player":
				if (getGame().user?.isGM || CombatReady.DATA.currentCombatant.actor?.isOwner) {
					callback();
				}
				break;
			case "GM":
				if (getGame().user?.isGM) {
					callback();
				}
				break;
			case "OnlyPlayers":
				if (!getGame().user?.isGM) {
					callback();
				}
				break;
			case "Player":
				if (
					((CombatReady.DATA.currentCombatant?.actor?.isOwner ?? false) && !getGame().user?.isGM)
					|| (CombatReady.DATA.currentCombatant?.players.length == 0 ?? false) && getGame().user?.isGM
				) {
					callback();
				}
				break;
			case "Everyone":
			default:
				callback();
				break;
		}
	}
	static playSound(sound: { file: string, setting: string }): void {
		if (!CombatReady.fillData()) return;
		let playTo = "Everyone";
		try {
			playTo = <string>getGame().settings.get(MODULE_NAME, sound.setting);
		} catch (e) { }
		CombatReady.resolvePlayersPermission(playTo, () => { AudioHelper.play({ src: sound.file, volume: volume() }); });
	}
	static isMasterOfTime(user: User | StoredDocument<User> | null): boolean {
		if (user == null) return false;
		return user.isGM && user.id == CombatReady.MASTEROFTIME;
	}
	static async closeEndTurnDialog(): Promise<void> {
		// go through all dialogs that we've opened and closed them
		for (let d of CombatReady.EndTurnDialog) {
			d.close();
		}
		CombatReady.EndTurnDialog.length = 0;
	}

	static showEndTurnDialog(): void {
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

	static async closeWrapItUpDialog(): Promise<void> {
		// go through all dialogs that we've opened and closed them
		for (let d of CombatReady.WrapItUpDialog) {
			d.close();
		}
		CombatReady.WrapItUpDialog.length = 0;
	}
	static showWrapItUpDialog(): void {
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
	static adjustWidth(): void {
		currentAnimation.adjustWidth();
		currentTimer.adjustWidth();
	}
	/**
	 * JQuery stripping
	 */
	static init(): void {
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
	static doAnimateTurn(): void {
		if (!CombatReady.READY) {
			CombatReady.init();
		}
		currentAnimation.yourTurnAnimation();
		// Panning to current token and taking control

		// play a sound, meep meep!
		CombatReady.playSound(CombatReady.TURN_SOUND);
	}

	static getCombatantToken(): Token | undefined {
		//Check if this combat is unlinked
		if (CombatReady.DATA.currentCombat.data.scene == null) {
			//Get if this is a player token or an NPC token
			let combatantIsLinked = CombatReady?.DATA?.currentCombatant?.token?.isLinked ?? false;
			//Get the actor Id
			let combatantActorId = CombatReady?.DATA?.currentCombatant?.actor?.id ?? null;
			//Get the token name
			let combatantTokenName = CombatReady?.DATA?.currentCombatant?.token?.name;
			let combatantToken: Token | undefined;
			let combatantsTokens: Token[] | undefined;
			if (combatantIsLinked) {
				combatantToken = getCanvas().tokens?.placeables.find((token) => {
					return token?.actor?.id === combatantActorId ?? false;
				});
				if (combatantToken !== undefined) return combatantToken;
			}
			//If there is not a token that share the actorId is possible to be a placeholder token
			//We retrieve the list of tokens that share the same name if only one is present that token we will return

			combatantsTokens = getCanvas().tokens?.placeables.filter((token) => {
				return token?.name === combatantTokenName ?? false;
			});
			if (combatantsTokens !== undefined) {
				if ((combatantsTokens.length) == 1) {
					return combatantsTokens[0];
				}
			}
		} else {
			return <Token>(CombatReady?.DATA?.currentCombatant?.token?.object);
		}
	}
	static doPanToToken(control: boolean): void {
		let token = CombatReady.getCombatantToken();
		if (token !== undefined) {
			let x = token.center.x ?? 0;
			let y = token.center.y ?? 0;
			getCanvas().animatePan({
				x: x,
				y: y,
				duration: 250
			}).then(() => {
				if (control) {
					CombatReady.getCombatantToken()?.control();
				}
			});
		}
	}

	/**
	 * Animate the "you're up next" prompt
	 */
	static doAnimateNext(): void {
		if (getGame().settings.get(MODULE_NAME, "disablenextup")) {
			return;
		}

		if (!CombatReady.READY) {
			CombatReady.init();
		}
		currentAnimation.nextUpAnimation();
		// play a sound, beep beep!
		CombatReady.playSound(CombatReady.NEXT_SOUND);
	}

	/**
	 * Check if the current combatant needs to be updated
	 */
	static toggleCheck(newRound: Boolean = false): void {
		if (!CombatReady.fillData()) {
			//Clean animations because we are in a possible invalid state
			currentAnimation.cleanAnimations();
			return;
		};

		if (CombatReady.DATA.currentCombat && CombatReady.DATA.currentCombat.started) {
			let entry = CombatReady.DATA.currentCombat.combatant;
			currentAnimation.cleanAnimations();
			if (<boolean>getGame().settings.get(MODULE_NAME, "wrapitupdialog")) {
				if (getGame().user?.isGM && CombatReady.DATA.currentCombatant.players.length > 0) {
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
			let nextTurn = ((CombatReady.DATA.currentCombat.turn || 0) + 1) % CombatReady.DATA.currentCombat.turns.length;
			let nextCombatant = CombatReady.DATA.currentCombat.turns[nextTurn];
			//@ts-ignore
			if (getGame().settings.get("core", "combatTrackerConfig")?.skipDefeated ?? false) {
				while (nextCombatant.data.defeated) {
					if (nextTurn == CombatReady.DATA.currentCombat.turn) break;// Avoid running infinitely
					nextTurn = (nextTurn + 1) % CombatReady.DATA.currentCombat.turns.length;
					nextCombatant = CombatReady.DATA.currentCombat.turns[nextTurn];
				}
			}

			if (entry !== undefined) {
				CombatReady.closeEndTurnDialog().then(() => {
					let isActive = CombatReady.DATA.currentCombatant.actor?.isOwner && !getGame().user?.isGM;
					let isNext = nextCombatant.actor?.isOwner && !getGame().user?.isGM;
					let panToTokenPerm = <string>getGame().settings.get(MODULE_NAME, "pantotoken");
					if (isActive) {
						//replace with config dependant // Only to player whom token is
						CombatReady.resolvePlayersPermission(panToTokenPerm, () => { CombatReady.doPanToToken(true) });
						CombatReady.doAnimateTurn();
						if (<boolean>getGame().settings.get(MODULE_NAME, "endturndialog"))
							CombatReady.showEndTurnDialog();
					} else if (isNext) {
						if (nextTurn == 0 && <boolean>getGame().settings.get(MODULE_NAME, "disablenextuponlastturn"))
							return;
						CombatReady.doAnimateNext();
					} else if (getGame().user?.isGM) {
						CombatReady.resolvePlayersPermission(panToTokenPerm, () => { CombatReady.doPanToToken(true) });
					} else {
						CombatReady.resolvePlayersPermission(panToTokenPerm, () => { CombatReady.doPanToToken(false) });
						if (newRound) {
							CombatReady.nextRound();
						}
					}
				});
			}
		} else if (!CombatReady.DATA.currentCombat) {
			CombatReady.closeEndTurnDialog();
			CombatReady.closeWrapItUpDialog();
		}
	}

	static nextRound(): void {
		currentAnimation.nextRoundAnimation();
		CombatReady.playSound(CombatReady.ROUND_SOUND);
	}
	/**
	 *
	 */
	static async timerTick(TIMECURRENT: number | null = null): Promise<void> {
		if (!CombatReady.READY) return;
		if (!CombatReady.fillData()) return;

		if (getGame().settings.get(MODULE_NAME, "disabletimer")) {
			return;
		}
		if (getGame().settings.get(MODULE_NAME, "disabletimerGM")) {
			if (CombatReady.DATA.currentCombatant.players.length == 0) return;
		}
		if (getGame().settings.get(MODULE_NAME, "disabletimerOnHidden")) {
			if (CombatReady.DATA.currentCombatant.data.hidden && CombatReady.DATA.currentCombatant.players.length == 0) return;
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
					if (CombatReady.DATA.currentCombatant.players.length > 0) {//run only if the actor has owners
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
	static setTimeMax(num): void {
		CombatReady.TIMEMAX = num;
	}

	/**
	 *
	 */
	static async timerStart(): Promise<void> {
		if (!CombatReady.READY) return;
		CombatReady.TIMECURRENT = 0;
		if (getGame().settings.get(MODULE_NAME, "disabletimer")) return;
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
	static async timerStop(): Promise<void> {
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
	static timerPause(): void {
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
	static timerResume(): void {
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