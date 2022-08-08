import { getCanvas, getCombats, getGame, MODULE_NAME } from "./settings";
import { currentAnimation, currentTimer } from "./api";
import { warn } from "../combatready";
import { updateYield } from "typescript";

export const volume = () => {
	return (Number)(getGame().settings.get(MODULE_NAME, "volume")) / 100.0;
};
enum Difference {
	Current = 1,
	Next = 2,
	Both = 3
}
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
		currentCombatant: Combatant,
		nextCombatant: Combatant
	};
	public static OLD_DATA: {
		combats: CombatEncounters,
		currentCombat: StoredDocument<Combat>,
		currentCombatant: Combatant,
		nextCombatant: Combatant
	};

	/**
	 * This function fills common used DATA through the module
	 *
	 * @static
	 * @returns {[boolean, Difference]} the boolean indicates if the data was correctly filled and the Difference if it is necessary to update themes
	 */
	static fillData(): [boolean, Difference] {
		let combats = getCombats();
		if (combats == undefined) {
			warn("Combats undefined failing fillData()"); return [false, Difference.Both];
		}
		let curCombat = combats.active as StoredDocument<Combat>;
		if (curCombat == undefined) {
			warn("Current Combat undefined failing fillData()"); return [false, Difference.Both];
		}
		let curCombatant = curCombat.combatant;
		if (curCombatant == undefined) {
			warn("Current Combatant undefined failing fillData()"); return [false, Difference.Both];
		}
		curCombatant = deepClone(curCombatant);

		let nextTurn = ((curCombat.turn || 0) + 1) % curCombat.turns.length;
		let nextCombatant = curCombat.turns[nextTurn];
		if (nextCombatant == undefined) {
			warn("Next Combatant undefined failing fillData()"); return [false, Difference.Both];
		}
		nextCombatant = deepClone(nextCombatant);
		CombatReady.OLD_DATA = CombatReady.DATA;
		CombatReady.DATA = { combats: combats, currentCombat: curCombat, currentCombatant: curCombatant, nextCombatant: nextCombatant };
		let newState = Difference.Both;
		if (CombatReady.OLD_DATA !== undefined) {
			newState = CombatReady.checkForNewState();
		}
		return [true, newState];
	}

	/**
	 * This functions verifies if the old Data is the same as the new data
	 * This would mean that even if we change turns or rounds or delete a combatant there is not
	 * necessary an update to the animations.
	 *
	 * @static
	 * @returns {Boolean}
	 */
	static checkForNewState(): Difference {
		let diff = 0;
		diff |= (CombatReady.OLD_DATA.currentCombatant != CombatReady.DATA.currentCombatant) ? 1 : 0;
		diff |= (CombatReady.OLD_DATA.nextCombatant != CombatReady.DATA.nextCombatant) ? 2 : 0;
		return diff;
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
		let isUnlinked = getGame().release.isGenerationalChange("9.") ? CombatReady.DATA.currentCombat.scene == null : CombatReady.DATA.currentCombat.data.scene == null;
		if (isUnlinked) {
			//Get if this is a player token or an NPC token
			let combatantIsLinked = CombatReady?.DATA?.currentCombatant?.token?.isLinked ?? false;
			//Get the actor Id
			let combatantActorId = CombatReady?.DATA?.currentCombatant?.actor?.id ?? null;
			//Get the token Id
			let combatantTokenId = CombatReady?.DATA?.currentCombatant?.token?.id ?? null;
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
			//Check if there is a token that shares the actorId (Player Tokens, tokens on the original scene before unlinked)
			combatantToken = getCanvas().tokens?.placeables.find((token) => {
				return token?.id === combatantTokenId ?? false;
			});
			if (combatantToken !== undefined) return combatantToken;
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
					//@ts-ignore
					token.control();
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

	static runAnimationForPlayer(combatant: Combatant): boolean {
		if (combatant.actor !== null) {
			let isSelectedCharacter = getGame().users?.filter(u => {
				if (u.active && !u.isGM) {
					//@ts-ignore
					return combatant.actor == u.character;
				}
				return false;
			});
			let isCurrentUserCharacter = getGame().user?.character == combatant.actor;
			let isOwned = combatant.actor.isOwner && !getGame().user?.isGM;
			let runAnimation = isCurrentUserCharacter || isSelectedCharacter?.length == 0 && isOwned;
			return runAnimation;
		}
		return false;
	}
	static async checkForCurrentTurnAnimation(): Promise<boolean> {
		currentAnimation.cleanAnimations();
		let closing = CombatReady.closeEndTurnDialog();
		await closing;

		let runAnimation = CombatReady.runAnimationForPlayer(CombatReady.DATA.currentCombatant);

		let panToTokenPerm = <string>getGame().settings.get(MODULE_NAME, "pantotoken");
		if (runAnimation) {
			//replace with config dependant // Only to player whom token is
			CombatReady.resolvePlayersPermission(panToTokenPerm, () => { CombatReady.doPanToToken(true) });
			CombatReady.doAnimateTurn();
			if (<boolean>getGame().settings.get(MODULE_NAME, "endturndialog"))
				CombatReady.showEndTurnDialog();
			return true;
		} else if (getGame().user?.isGM) {
			CombatReady.resolvePlayersPermission(panToTokenPerm, () => { CombatReady.doPanToToken(true) });
		} else {
			CombatReady.resolvePlayersPermission(panToTokenPerm, () => { CombatReady.doPanToToken(false) });
		}
		return false;
	}
	static async checkForNextTurnAnimation(): Promise<boolean> {
		currentAnimation.cleanAnimations();
		// next combatant
		let nextTurn = ((CombatReady.DATA.currentCombat.turn || 0) + 1) % CombatReady.DATA.currentCombat.turns.length;
		let nextCombatant = CombatReady.DATA.nextCombatant
		//@ts-ignore
		if (getGame().settings.get("core", "combatTrackerConfig")?.skipDefeated ?? false) {
			while (nextCombatant.isDefeated) {
				if (nextTurn == CombatReady.DATA.currentCombat.turn) break;// Avoid running infinitely
				nextTurn = (nextTurn + 1) % CombatReady.DATA.currentCombat.turns.length;
				nextCombatant = CombatReady.DATA.currentCombat.turns[nextTurn];
			}
		}

		let closing = CombatReady.closeEndTurnDialog();
		await closing;

		let runAnimation = CombatReady.runAnimationForPlayer(CombatReady.DATA.nextCombatant);
		if (runAnimation) {
			if (nextTurn == 0 && <boolean>getGame().settings.get(MODULE_NAME, "disablenextuponlastturn"))
				return false;
			CombatReady.doAnimateNext();
			return true;
		}
		return false;
	}

	/**
	 * Check if the current combatant needs to be updated
	 */
	static async toggleCheck(newRound: Boolean = false): Promise<void> {
		let result = CombatReady.fillData();
		if (!result[0]) {
			//Clean animations because we are in a possible invalid state
			currentAnimation.cleanAnimations();
			return;
		};
		let difference = result[1];
		if (CombatReady.DATA.currentCombat && CombatReady.DATA.currentCombat.started) {
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
			let animationRan = false;
			let nextTurn;
			if (difference & 1) {
				animationRan = await CombatReady.checkForCurrentTurnAnimation();
			}
			if (difference & 2 && !animationRan) {
				nextTurn = CombatReady.checkForNextTurnAnimation();
			}
			animationRan ||= await nextTurn;

			if (!animationRan && newRound) {
				CombatReady.nextRound();
			}
		} else if (!CombatReady.DATA.currentCombat) {
			CombatReady.closeEndTurnDialog();
			CombatReady.closeWrapItUpDialog();
		}
	}

	static nextRound(): void {
		let roundSoundPerm = <string>getGame().settings.get(MODULE_NAME, "roundsound");
		currentAnimation.nextRoundAnimation();
		CombatReady.resolvePlayersPermission(roundSoundPerm, () => { CombatReady.playSound(CombatReady.ROUND_SOUND) });
	}
	/**
	 *
	 */
	static async timerTick(TIMECURRENT: number | null = null): Promise<void> {
		if (!CombatReady.READY) return;

		if (getGame().settings.get(MODULE_NAME, "disabletimer")) {
			return;
		}
		if (getGame().settings.get(MODULE_NAME, "disabletimerGM")) {
			if (CombatReady.DATA.currentCombatant.players.length == 0) return;
		}
		if (getGame().settings.get(MODULE_NAME, "disabletimerOnHidden")) {
			if (CombatReady.DATA.currentCombatant.hidden && CombatReady.DATA.currentCombatant.players.length == 0) return;
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