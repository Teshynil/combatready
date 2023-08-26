import { debug } from "../combatready";
import { CombatReady } from "./combatReady";
import { MODULE_NAME } from "./settings";
import { SettingsAwareEntity } from "./settingsAwareEntity";
import { CombatReadyAnimation, NativeAnimation } from "./animations";
import { CombatReadyTimer, NativeTimer } from "./timers";

/**
 * Stores all the available animations for the module
 *
 * @type {Array<CombatReadyAnimation>}
 */
export const availableAnimations: Array<CombatReadyAnimation> = [];
/**
 * Stores all the available timers for the module
 *
 * @type {Array<CombatReadyTimer>}
 */
export const availableTimers: Array<CombatReadyTimer> = [];
/**
 * The current animation
 *
 * @type {CombatReadyAnimation}
 */
export var currentAnimation: CombatReadyAnimation;
/**
 * The current timer
 *
 * @type {CombatReadyTimer}
 */
export var currentTimer: CombatReadyTimer;
/**
 * The API
 * isActive: Currently unused
 * setupAnimation: Function to setup a new animation
 * setupTimer: Function to setup a new timer
 * getCurrentTime: Function to get the current combat time
 * getMaxTime: Function to get the max time per combat
 *
 * @type {{
	isActive: boolean,
	setupAnimation: Function,
	setupTimer: Function,
	getCurrentTime: Function,
	getMaxTime: Function
}}
 */
export const CombatReadyApi: {
	isActive: boolean,
	setupAnimation: Function,
	setupTimer: Function,
	getCurrentTime: Function,
	getMaxTime: Function
} = {
	isActive: false,
	setupAnimation,
	setupTimer,
	getCurrentTime,
	getMaxTime
};

/**
 * Initialize the API by setting the default animation and timer
 *
 * @export
 */
export function initApi(): void {
	//@ts-ignore
	game.modules.get(MODULE_NAME).api = CombatReadyApi;
	debug("Setting default animation and timer");
	setupAnimation(new NativeAnimation("native"));
	setupTimer(new NativeTimer("native"));
}
/**
 * Get the current time in the active combat in seconds
 *
 * @returns {number}
 */
function getCurrentTime(): number {
	return CombatReady.TIMECURRENT;
}
/**
 * Get the max time for the timer in seconds
 *
 * @returns {number}
 */
function getMaxTime(): number {
	return CombatReady.TIMEMAX;
}
/**
 * Create and register the settings for animations and timers
 *
 * @param {*} settingsAwareEntity
 */
function setupSettings(settingsAwareEntity): void {
	if (settingsAwareEntity instanceof SettingsAwareEntity) {
		for (const setting of settingsAwareEntity.settings) {
			setting.setting.config = false
			if (setting.setting.type == "Color") {
				setting.setting.type = String;
			}
			if (setting.setting.type == "Separator") {
				continue;
			}
			game.settings.register(MODULE_NAME, `${settingsAwareEntity.type}.${settingsAwareEntity.id}.setting.${setting.id}`, setting.setting);
		}
	}
}
/**
 * Register an animation in the module
 *
 * @param {*} animation
 */
function setupAnimation(animation): void {
	if (availableAnimations[animation.id] != undefined) {
		throw new Error('You can not register an animation with an id that is already used');
	}
	setupSettings(animation);
	availableAnimations[animation.id] = animation;
	(<SettingConfig<String>>game.settings.settings.get(MODULE_NAME + ".selectedAnimation")).default = getDefaultAnimation()
}
/**
 * Register a timer in the module
 *
 * @param {*} timer
 */
function setupTimer(timer): void {
	if (availableTimers[timer.id] != undefined) {
		throw new Error('You can not register a timer with an id that is already used');
	}
	setupSettings(timer);
	availableTimers[timer.id] = timer;
	(<SettingConfig<String>>game.settings.settings.get(MODULE_NAME + ".selectedTimer")).default = getDefaultTimer()
}
/**
 * Retrieve the default animation id
 *
 * @export
 * @returns {string} 
 */
export function getDefaultAnimation(): string {
	const AnimationsIds = Object.keys(availableAnimations)
	return AnimationsIds[0]
}
/**
 * Retrieve the default timer id
 *
 * @export
 * @returns {string}
 */
export function getDefaultTimer(): string {
	const TimerId = Object.keys(availableTimers)
	return TimerId[0]
}

/**
 * Update the animation and initialize them, if it fails fallback to default
 *
 * @export
 * @async
 * @returns {Promise<void>}
 */
export async function updateAnimation(): Promise<void> {
	const selectedAnimation = <String>game.settings.get(MODULE_NAME, "selectedAnimation")
	currentAnimation?.destroy();
	//@ts-ignore
	currentAnimation = availableAnimations[selectedAnimation] ?? availableAnimations[<String>game.settings?.settings?.get(MODULE_NAME + ".selectedAnimation").default]
	//@ts-ignore
	if (availableAnimations[selectedAnimation] == undefined) {
		await game.settings.set(MODULE_NAME, "selectedAnimation", currentAnimation.id);
	}
	currentAnimation?.initialize();
}
/**
 * Update the timer and initialize them, if it fails fallback to default
 *
 * @export
 * @async
 * @returns {Promise<void>}
 */
export async function updateTimer(): Promise<void> {
	const selectedTimer = <String>game.settings.get(MODULE_NAME, "selectedTimer")
	currentTimer?.destroy();
	//@ts-ignore
	currentTimer = availableTimers[selectedTimer] ?? availableTimers[<String>game.settings?.settings?.get(MODULE_NAME + ".selectedTimer").default]
	//@ts-ignore
	if (availableTimers[selectedTimer] == undefined) {
		await game.settings.set(MODULE_NAME, "selectedTimer", currentTimer.id);
	}
	currentTimer?.initialize();
}