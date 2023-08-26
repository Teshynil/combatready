//@ts-nocheck
import { each, extend } from "jquery";
import { CombatReadyAnimation, AnimationSubSettings } from "./animations";
import { getDefaultAnimation, updateAnimation, currentAnimation, availableAnimations, getDefaultTimer, updateTimer, currentTimer, availableTimers } from "./api";
import { CombatReady } from "./combatReady";
import { SettingsAwareEntity, enumerateSettings } from "./settingsAwareEntity";
import { CombatReadyTimer, TimerSubSettings } from "./timers";
export const MODULE_NAME = "combatready";

export function getCombats(): CombatEncounters {
	if (!(game.combats instanceof CombatEncounters)) {
		throw new Error('CombatEncounters Is Not Initialized');
	}
	return <CombatEncounters>game.combats;
}

export const registerSettings = () => {
	game.settings.register(MODULE_NAME, "masteroftime", {
		scope: "world",
		config: false,
		default: "",
		type: String
	})
	game.settings.register(MODULE_NAME, "lasttime", {
		scope: "world",
		config: false,
		default: "",
		type: Number
	})
	// This setting will be modified by the api if modules register to it
	game.settings.register(MODULE_NAME, "selectedAnimation", {
		scope: "world",
		config: false,
		type: String,
		default: "native",
		onChange: updateAnimation,
	})
	game.settings.register(MODULE_NAME, "selectedTimer", {
		scope: "world",
		config: false,
		type: String,
		default: "native",
		onChange: updateTimer,
	})
	game.settings.registerMenu(MODULE_NAME, "animationSettings", {
		name: "combatReady.settings.animations.settings.name",
		hint: "combatReady.settings.animations.settings.hint",
		label: "combatReady.settings.animations.settings.button",
		icon: "fas fa-magic",
		type: AnimationSubSettings,
		restricted: true,
	})
	game.settings.registerMenu(MODULE_NAME, "timerSettings", {
		name: "combatReady.settings.timers.settings.name",
		hint: "combatReady.settings.timers.settings.hint",
		label: "combatReady.settings.timers.settings.button",
		icon: "fas fa-clock",
		type: TimerSubSettings,
		restricted: true,
	})
	game.settings.registerMenu(MODULE_NAME, "soundSettings", {
		name: "combatReady.settings.sounds.settings.name",
		hint: "combatReady.settings.sounds.settings.hint",
		label: "combatReady.settings.sounds.settings.button",
		icon: "fas fa-volume-up",
		type: SoundSubSettings,
		restricted: false,
	})
	game.settings.register(MODULE_NAME, "timemax", {
		name: "combatReady.settings.timeMax.name",
		hint: "combatReady.settings.timeMax.hint",
		scope: "world",
		config: true,
		default: 3,
		type: Number,
		onChange: (value) => {
			let val = Number(value);
			if (isNaN(val) || val <= 0) {
				game.settings.set(MODULE_NAME, "timemax", 3);
				return;
			}
			if (val > 30) {
				game.settings.set(MODULE_NAME, "timemax", 30);
				return;
			}
			CombatReady.setTimeMax(val * 60);
		},
	});
	game.settings.register(MODULE_NAME, "disablenextup", {
		name: "combatReady.settings.disableNextUp.name",
		hint: "combatReady.settings.disableNextUp.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(MODULE_NAME, "disablenextuponlastturn", {
		name: "combatReady.settings.disableNextUpOnLastTurn.name",
		hint: "combatReady.settings.disableNextUpOnLastTurn.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(MODULE_NAME, "disabletimer", {
		name: "combatReady.settings.disableTimer.name",
		hint: "combatReady.settings.disableTimer.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: (value) => {
			if (value)
				CombatReady.timerStop();
			else
				CombatReady.timerStart();
		}
	});
	game.settings.register(MODULE_NAME, "disabletimerGM", {
		name: "combatReady.settings.disableTimerGM.name",
		hint: "combatReady.settings.disableTimerGM.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(MODULE_NAME, "disabletimerOnHidden", {
		name: "combatReady.settings.disableTimerOnHidden.name",
		hint: "combatReady.settings.disableTimerOnHidden.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(MODULE_NAME, "endturndialog", {
		name: "combatReady.settings.showEndTurnDialog.name",
		hint: "combatReady.settings.showEndTurnDialog.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(MODULE_NAME, "wrapitupdialog", {
		name: "combatReady.settings.showWrapItUpDialog.name",
		hint: "combatReady.settings.showWrapItUpDialog.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(MODULE_NAME, "autoendontimer", {
		name: "combatReady.settings.autoEndOnTimer.name",
		hint: "combatReady.settings.autoEndOnTimer.hint",
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(MODULE_NAME, "ticksound", {
		name: "combatReady.settings.tickSound.name",
		hint: "combatReady.settings.tickSound.hint",
		scope: "world",
		config: false,
		choices: {
			"Everyone": "combatReady.settings.text.everyone",
			"OnlyPlayers": "combatReady.settings.text.onlyPlayers",
			"Player": "combatReady.settings.text.currentCombatant",
			"GM": "combatReady.settings.text.GM",
			"GM+Player": "combatReady.settings.text.GMAndPlayer",
			"None": "combatReady.settings.text.none"
		},
		default: "Everyone",
		type: String,
	});
	game.settings.register(MODULE_NAME, "ticksoundfile", {
		name: "combatReady.settings.tickSoundFile.name",
		hint: "combatReady.settings.tickSoundFile.hint",
		scope: "world",
		config: false,
		default: "modules/combatready/sounds/ticksound_clocktick.ogg",
		filePicker: 'audio',
		onChange: (value) => { CombatReady.TICK_SOUND.file = value }
	});
	game.settings.register(MODULE_NAME, "expiresound", {
		name: "combatReady.settings.expireSound.name",
		hint: "combatReady.settings.expireSound.hint",
		scope: "world",
		config: false,
		choices: {
			"Everyone": "combatReady.settings.text.everyone",
			"OnlyPlayers": "combatReady.settings.text.onlyPlayers",
			"Player": "combatReady.settings.text.currentCombatant",
			"GM": "combatReady.settings.text.GM",
			"GM+Player": "combatReady.settings.text.GMAndPlayer",
			"None": "combatReady.settings.text.none"
		},
		default: "Everyone",
		type: String,
	});
	game.settings.register(MODULE_NAME, "expiresoundfile", {
		name: "combatReady.settings.expireSoundFile.name",
		hint: "combatReady.settings.expireSoundFile.hint",
		scope: "world",
		config: false,
		default: "modules/combatready/sounds/expiresound_dundundun.ogg",
		filePicker: 'audio',
		onChange: (value) => { CombatReady.EXPIRE_SOUND.file = value }
	});
	game.settings.register(MODULE_NAME, "roundsound", {
		name: "combatReady.settings.roundSound.name",
		hint: "combatReady.settings.roundSound.hint",
		scope: "world",
		config: false,
		choices: {
			"Everyone": "combatReady.settings.text.everyone",
			"OnlyPlayers": "combatReady.settings.text.onlyPlayers",
			"GM": "combatReady.settings.text.GM",
			"None": "combatReady.settings.text.none"
		},
		default: "Everyone",
		type: String,
	});
	game.settings.register(MODULE_NAME, "roundsoundfile", {
		name: "combatReady.settings.roundSoundFile.name",
		hint: "combatReady.settings.roundSoundFile.hint",
		scope: "world",
		config: false,
		default: "modules/combatready/sounds/roundsound_Deep_Whoosh_2.ogg",
		filePicker: 'audio',
		onChange: (value) => { CombatReady.ROUND_SOUND.file = value }
	});
	game.settings.register(MODULE_NAME, "acksoundfile", {
		name: "combatReady.settings.ackSoundFile.name",
		hint: "combatReady.settings.ackSoundFile.hint",
		scope: "world",
		config: false,
		default: "modules/combatready/sounds/acksound_pin.ogg",
		filePicker: 'audio',
		onChange: (value) => { CombatReady.ACK_SOUND.file = value }
	});
	game.settings.register(MODULE_NAME, "nextsoundfile", {
		name: "combatReady.settings.nextSoundFile.name",
		hint: "combatReady.settings.nextSoundFile.hint",
		scope: "world",
		config: false,
		default: "modules/combatready/sounds/nextup_storm.ogg",
		filePicker: 'audio',
		onChange: (value) => { CombatReady.NEXT_SOUND.file = value }
	});
	game.settings.register(MODULE_NAME, "turnsoundfile", {
		name: "combatReady.settings.turnSoundFile.name",
		hint: "combatReady.settings.turnSoundFile.hint",
		scope: "world",
		config: false,
		default: "modules/combatready/sounds/yourturnsound_movieswell.ogg",
		filePicker: 'audio',
		onChange: (value) => { CombatReady.TURN_SOUND.file = value }
	});
	game.settings.register(MODULE_NAME, "tickonlast", {
		name: "combatReady.settings.tickOnLast.name",
		hint: "combatReady.settings.tickOnLast.hint",
		scope: "world",
		config: false,
		default: 10,
		type: Number,
		onChange: (value) => {
			let val = Number(value);
			if (isNaN(val) || val < 0) {
				game.settings.set(MODULE_NAME, "tickonlast", 0);
				return;
			}
		},
	});
	game.settings.register(MODULE_NAME, "volume", {
		name: "combatReady.settings.volume.name",
		hint: "combatReady.settings.volume.hint",
		scope: "client",
		config: false,
		range: {
			min: 0,
			max: 100,
			step: 10,
		},
		default: 60,
		type: Number,
	});
	game.settings.register(MODULE_NAME, "pantotoken", {
		name: "combatReady.settings.panToToken.name",
		hint: "combatReady.settings.panToToken.hint",
		scope: "world",
		config: true,
		choices: {
			"Everyone": "combatReady.settings.text.everyone",
			"OnlyPlayers": "combatReady.settings.text.onlyPlayers",
			"Player": "combatReady.settings.text.currentCombatant",
			"GM": "combatReady.settings.text.GM",
			"GM+Player": "combatReady.settings.text.GMAndPlayer",
			"None": "combatReady.settings.text.none"
		},
		default: "Player",
		type: String,
	});
};

export class SoundSubSettings extends FormApplication<any, any, any> {
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: 600,
			resizable: true,
			id: "combatready-sound-settings",
			title: game.i18n.localize("combatReady.settings.sounds.settings.name"),
			template: "modules/combatready/templates/sound_settings.html"
		})
	}
	getData(options: Application.RenderOptions): FormApplication.Data<{}, FormApplicationOptions> | Promise<FormApplication.Data<{}, FormApplicationOptions>> {
		const data: any = {};
		data.settings = [];
		const settings = [];
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".ticksound"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".ticksoundfile"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".expiresound"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".expiresoundfile"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".roundsound"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".roundsoundfile"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".acksoundfile"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".nextsoundfile"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".turnsoundfile"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".tickonlast"));
		data.settings.push(game.settings.settings.get(MODULE_NAME + ".volume"));
		for (const setting of data.settings) {
			if (setting.scope === "world" && !game.user?.isGM)
				continue
			let s: any = duplicate(setting);
			s.isSeparator = (setting.type === "Separator")
			if (!s.isSeparator) {
				s.id = setting.key
				s.value = game.settings.get(MODULE_NAME, s.id)
				s.type = setting.type instanceof Function ? setting.type.name : "String"
				s.isCheckbox = setting.type === Boolean
				s.isSelect = setting.choices !== undefined
				s.isRange = (setting.type === Number) && setting.range
				s.isColor = (setting.type === "Color")
				s.isMultiline = (setting.multiline)
				s.isFilePicker = (setting.filePicker !== undefined)
				s.isSoundPicker = (setting.filePicker == "audio")
			}
			s.name = game.i18n.localize(<string>setting.name)
			s.hint = game.i18n.localize(<string>setting.hint)
			settings.push(s)
		}
		return settings;
	}
	async _onSubmit(event: SubmitEvent, { updateData = {}, preventClose = false, preventRender = false }: FormApplication.OnSubmitOptions = {}): Promise<Partial<Record<string, unknown>>> {
		return super._onSubmit(event, { updateData, preventClose, preventRender });
	}

	async _updateObject(event: SubmitEvent, formData: object): Promise<void> {
		for (let [key, value] of Object.entries(formData)) {
			// Get the old setting value
			const oldValue = game.settings.get(MODULE_NAME, key)
			// Only update the setting if it has been changed (this leaves the default in place if it hasn't been touched)
			if (value !== oldValue)
				await game.settings.set(MODULE_NAME, key, value)
		}
	}

	activateListeners(html) {
		super.activateListeners(html);
		html.find(".audio-preview").click(this.onAudioPreview.bind(this));
	}

	onAudioPreview(event) {
		const src = event.target.parentElement.querySelector('input').value;
		const volume: Number = this.form.volume.value;
		game.audio.play(src, { volume: volume / 100 });
	}
}