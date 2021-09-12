# Combat Ready module for FVTT,

Shows a graphic + sound for players a round just before a player's turn (Next Up) and
during their turn.

It uses a light-box style darkening of the canvas to catch their attention as
well as an animated graphic + sound. The player then needs to click the banner to
either acknowledge their turn is coming up, or take their turn. If they somehow 
*still* don't know its their turn then that's a problem between chair and keyboard.

Note that for "Next UP" rather than having the graphic go away entirely, it just
puts opacity on the banner as a constant reminder for the player to plan for
their turn for when it does come up. Works with hidden combatants too, such that
even if there's a block of hidden enemies you're working on as GM, they'll know
when their turn is 'next' due to the graphic as to not catch them by surprise.

The combat timer is simply a bar along the bottom of the screen. By default it is 
configured for 3m, but this can be changed in the settings. When the bar
reaches 3m, or the custom value, an 'expired' sound will play, but it does not 
automatically advance the turn. Shame is good enough in my opinion. If you need 
to pause the timer, it responds to FVTT's pause mechanic.

Combat Ready is currently spected to work with FVTT version 0.8.9

## Note

This module was made by Ken L. Then taken care by Jacob McAuley, later by Shawn Milligan now this is an attempt to give maitenance to the module.

## Usage

Just install it, start a combat and ejoy.

For aditional settings see below.

### Module
![Combat](https://raw.githubusercontent.com/Teshynil/combatready/master/support/Combat.png)
![NextUp](https://raw.githubusercontent.com/Teshynil/combatready/master/support/NextUp.png)
![YourTurn](https://raw.githubusercontent.com/Teshynil/combatready/master/support/YourTurn.png)
![Settings](https://raw.githubusercontent.com/Teshynil/combatready/master/support/Settings.png)

## Installation Instructions

Copy https://raw.githubusercontent.com/Teshynil/combatready/master/src/module.json into the module installer
inside foundry when it asks for the manifest.

OR

Download the zip in the release section, create a folder in Data/modules called 'combatready' and extract
the contents of "combatready-v-x.x.x.zip" there.
