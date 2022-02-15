import { each, extend } from "jquery";
import { CombatReadyAnimationTheme, ThemeSubSettings } from "./themes";
import { getDefaultTheme, updateAnimation, currentTheme, availableThemes, getDefaultTimer, updateTimer, currentTimer, availableTimers } from "./api";
import { CombatReady } from "./combatReady";
import { SettingsAwareEntity } from "./settingsAwareEntity";
import { CombatReadyTimer, TimerSubSettings } from "./timers";
export const MODULE_NAME = "combatready";

export function getCanvas(): Canvas {
    if (!(canvas instanceof Canvas) || !canvas.ready) {
        throw new Error('Canvas Is Not Initialized');
    }
    return canvas;
}

export function getGame(): Game {
    if (!(game instanceof Game)) {
        throw new Error('Game Is Not Initialized');
    }
    return game;
}

export function getCombats(): CombatEncounters {
    if (!(getGame().combats instanceof CombatEncounters)) {
        throw new Error('CombatEncounters Is Not Initialized');
    }
    return <CombatEncounters>getGame().combats;
}

export const registerSettings = () => {
    getGame().settings.register(MODULE_NAME, "masteroftime", {
        scope: "world",
        config: false,
        default: "",
        type: String
    })
    // This setting will be modified by the api if modules register to it
    getGame().settings.register(MODULE_NAME, "selectedTheme", {
        scope: "world",
        config: false,
        type: String,
        default: "native",
        onChange: updateAnimation,
    })
    getGame().settings.register(MODULE_NAME, "selectedTimer", {
        scope: "world",
        config: false,
        type: String,
        default: "native",
        onChange: updateTimer,
    })
    getGame().settings.registerMenu(MODULE_NAME, "themeSettings", {
        name: "combatReady.settings.themes.settings.name",
        hint: "combatReady.settings.themes.settings.hint",
        label: "combatReady.settings.themes.settings.button",
        icon: "fas fa-magic",
        type: ThemeSubSettings,
        restricted: true,
    })
    getGame().settings.registerMenu(MODULE_NAME, "timerSettings", {
        name: "combatReady.settings.timers.settings.name",
        hint: "combatReady.settings.timers.settings.hint",
        label: "combatReady.settings.timers.settings.button",
        icon: "fas fa-clock",
        type: TimerSubSettings,
        restricted: true,
    })
    getGame().settings.register(MODULE_NAME, "timemax", {
        name: "combatReady.settings.timeMax.name",
        hint: "combatReady.settings.timeMax.hint",
        scope: "world",
        config: true,
        default: 3,
        type: Number,
        onChange: (value) => {
            let val = Number(value);
            if (isNaN(val) || val <= 0) {
                getGame().settings.set(MODULE_NAME, "timemax", 3);
                return;
            }
            if (val > 30) {
                getGame().settings.set(MODULE_NAME, "timemax", 30);
                return;
            }
            CombatReady.setTimeMax(val * 60);
        },
    });
    getGame().settings.register(MODULE_NAME, "disablenextup", {
        name: "combatReady.settings.disableNextUp.name",
        hint: "combatReady.settings.disableNextUp.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "disablenextuponlastturn", {
        name: "combatReady.settings.disableNextUpOnLastTurn.name",
        hint: "combatReady.settings.disableNextUpOnLastTurn.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "disabletimer", {
        name: "combatReady.settings.disableTimer.name",
        hint: "combatReady.settings.disableTimer.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "disabletimerGM", {
        name: "combatReady.settings.disableTimerGM.name",
        hint: "combatReady.settings.disableTimerGM.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "disabletimerOnHidden", {
        name: "combatReady.settings.disableTimerOnHidden.name",
        hint: "combatReady.settings.disableTimerOnHidden.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "endturndialog", {
        name: "combatReady.settings.showEndTurnDialog.name",
        hint: "combatReady.settings.showEndTurnDialog.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "wrapitupdialog", {
        name: "combatReady.settings.showWrapItUpDialog.name",
        hint: "combatReady.settings.showWrapItUpDialog.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "autoendontimer", {
        name: "combatReady.settings.autoEndOnTimer.name",
        hint: "combatReady.settings.autoEndOnTimer.hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
    });
    getGame().settings.register(MODULE_NAME, "ticksound", {
        name: "combatReady.settings.tickSound.name",
        hint: "combatReady.settings.tickSound.hint",
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
        default: "Everyone",
        type: String,
    });
    getGame().settings.register(MODULE_NAME, "ticksoundfile", {
        name: "combatReady.settings.tickSoundFile.name",
        hint: "combatReady.settings.tickSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/ticksound_clocktick.ogg",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.TICK_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "expiresound", {
        name: "combatReady.settings.expireSound.name",
        hint: "combatReady.settings.expireSound.hint",
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
        default: "Everyone",
        type: String,
    });
    getGame().settings.register(MODULE_NAME, "expiresoundfile", {
        name: "combatReady.settings.expireSoundFile.name",
        hint: "combatReady.settings.expireSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/expiresound_dundundun.ogg",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.EXPIRE_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "roundsound", {
        name: "combatReady.settings.roundSound.name",
        hint: "combatReady.settings.roundSound.hint",
        scope: "world",
        config: true,
        choices: {
            "Everyone": "combatReady.settings.text.everyone",
            "OnlyPlayers": "combatReady.settings.text.onlyPlayers",
            "GM": "combatReady.settings.text.GM",
            "None": "combatReady.settings.text.none"
        },
        default: "Everyone",
        type: String,
    });
    getGame().settings.register(MODULE_NAME, "roundsoundfile", {
        name: "combatReady.settings.roundSoundFile.name",
        hint: "combatReady.settings.roundSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/roundsound_Deep_Whoosh_2.ogg",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.ROUND_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "acksoundfile", {
        name: "combatReady.settings.ackSoundFile.name",
        hint: "combatReady.settings.ackSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/acksound_pin.ogg",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.ACK_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "nextsoundfile", {
        name: "combatReady.settings.nextSoundFile.name",
        hint: "combatReady.settings.nextSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/nextup_storm.ogg",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.NEXT_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "turnsoundfile", {
        name: "combatReady.settings.turnSoundFile.name",
        hint: "combatReady.settings.turnSoundFile.hint",
        scope: "world",
        config: true,
        default: "modules/combatready/sounds/yourturnsound_movieswell.ogg",
        filePicker: 'audio',
        onChange: (value) => { CombatReady.TURN_SOUND.file = value }
    });
    getGame().settings.register(MODULE_NAME, "tickonlast", {
        name: "combatReady.settings.tickOnLast.name",
        hint: "combatReady.settings.tickOnLast.hint",
        scope: "world",
        config: true,
        default: 10,
        type: Number,
        onChange: (value) => {
            let val = Number(value);
            if (isNaN(val) || val < 0) {
                getGame().settings.set(MODULE_NAME, "tickonlast", 0);
                return;
            }
        },
    });
    getGame().settings.register(MODULE_NAME, "volume", {
        name: "combatReady.settings.volume.name",
        hint: "combatReady.settings.volume.hint",
        scope: "client",
        config: true,
        //@ts-ignore
        range: {
            min: 0,
            max: 100,
            step: 10,
        },
        default: 60,
        type: Number,
    });
};
