# Combat Ready module for FVTT

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
https://raw.githubusercontent.com/Teshynil/combatready/master/support/Main_demo.mp4

*From left to right up to down: GM, Player 1, Player 2, Player 3*

*Using the video theme from [Combat Ready Themes Set](https://github.com/Teshynil/combatreadythemes)*
#### Time running out
https://raw.githubusercontent.com/Teshynil/combatready/master/support/TimeRunsOut.mp4

#### Wrapping it up
https://raw.githubusercontent.com/Teshynil/combatready/master/support/WrapItUp.mp4
*Setting that allows to not show a timer until you think your player is taking a bit too*

#### Auto Skip
https://raw.githubusercontent.com/Teshynil/combatready/master/support/AutoSkip.mp4
*Setting that allows to auto skip the players turn if they run out of time*

## Installation Instructions

### Foundry
Just search for combatready and install from there

### Manual

Copy and paste https://raw.githubusercontent.com/Teshynil/combatready/master/src/module.json into the module installer inside foundry when it asks for the manifest.

OR

Download the zip in the release section, create a folder in Data/modules called 'combatready' and extract
the contents of "combatready-v-x.x.x.zip" there.
