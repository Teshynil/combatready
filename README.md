# Combat Ready module for FVTT

[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fcombatready&colorB=006400&style=for-the-badge)](https://forge-vtt.com/bazaar#package=combatready) 

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FTeshynil%2Fcombatready%2Fmaster%2Fsrc%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange&style=for-the-badge)

![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FTeshynil%2Fcombatready%2Fmaster%2Fsrc%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)

[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fcombatready%2Fshield%2Fendorsements&style=for-the-badge)](https://www.foundryvtt-hub.com/package/combatready/)

![GitHub all releases](https://img.shields.io/github/downloads/Teshynil/combatready/total?style=for-the-badge)
![Latest](https://img.shields.io/github/downloads/teshynil/combatready/latest/total?style=for-the-badge)

Shows an animation with sound to players to alert them about their next turn, also an alert when its now their turn.

Combat Ready is a system agnostic module about being ready for combat, it features:

* Timer for combatants
* Alerts players when they are next in the combat
* Alerts players when is their turn in combat
* Plays a clock sound to remind them to hurry up in the lasts seconds of the timer
* Plays an alert when their time runs out
* Auto skip the turn if the time runs out
* Timer on demand
* When its their turn automatically pan to their token and select them (no more where i was?)
* Allows to create themes for animations and timers, see: [Combat Ready Themes Set](https://github.com/Teshynil/combatreadythemes)

**All features are customizables.**

Combat Ready is currently spected to work with FVTT version 9

## Note

This module was originally made by Ken L. Then taken care by Jacob McAuley, later by Shawn Milligan now this is an attempt to give maitenance to the module and add features that i think are useful.

## Usage

Just install it, start a combat and ejoy.

Out of the box it just works

If you want to customize your experience there are plenty of options to do so.

For aditional settings see below.

### Previews
#### Main Demo


https://user-images.githubusercontent.com/5714094/175188901-a303cd48-db3a-4362-a356-86a83c9ff5bb.mp4



*From left to right up to down: GM, Player 1, Player 2, Player 3*

*Using the video theme from [Combat Ready Themes Set](https://github.com/Teshynil/combatreadythemes)*
#### Time running out
https://user-images.githubusercontent.com/5714094/175188918-897daf07-bfd8-461b-bdb2-1057d19fda3e.mp4

#### Wrapping it up
https://user-images.githubusercontent.com/5714094/175188931-031c483d-46d6-4da3-92b2-b546d4811189.mp4

*Setting that allows to not show a timer until you think your player is taking a bit too*

#### Auto Skip
https://user-images.githubusercontent.com/5714094/175188959-e0fb8b92-01be-4ccd-93c0-1e086c669fe8.mp4


*Setting that allows to auto skip the players turn if they run out of time*

## Installation Instructions

### Foundry
Just search for combatready and install from there

### Manual

Copy and paste https://raw.githubusercontent.com/Teshynil/combatready/master/src/module.json into the module installer inside foundry when it asks for the manifest.

OR

Download the zip in the release section, create a folder in Data/modules called 'combatready' and extract
the contents of "combatready-v-x.x.x.zip" there.
