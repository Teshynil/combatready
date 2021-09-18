# CHANGELOG

## [1.4.1] 2021-09-18

* Fix of unpause sometimes does not continue timer

## [1.4.0] 2021-09-18

* Added option to autoend the current turn if the timer runs out
    > Feature suggested by [remiverdel](https://github.com/remiverdel)

* Added option to change the color of the timer
* Added option to change the location of the timer
* Some changes and cleaning in the code
* Removing the stopwatch icon and styles

## [1.3.0] 2021-09-17

### The after adoption update

* Added some fields from Manifest+ to module.json
* Added option to remove the 'Next up' Notification after its clicked
    > Takes care of #8 Original [#6](https://github.com/smilligan93/combatready/issues/14)

* Added option to control the animations of the module
    > Takes care of #7 Original [#14](https://github.com/smilligan93/combatready/issues/14)

* Added option to manual activate the timer on a player turn
    > Takes care of #6 Original [#18](https://github.com/smilligan93/combatready/issues/18)

* Added multiple options to control who can listen the sounds notifications
    > Takes care of #3 Original [#23](https://github.com/smilligan93/combatready/issues/23)

* Added option to disable the timer on non owned characters
    > Takes care of #2 Original [#25](https://github.com/smilligan93/combatready/issues/25)

* Added option to disable 'Next up' Notification on round change
    > Takes care of #1 Original [#26](https://github.com/smilligan93/combatready/issues/26)

## [1.2.2] 2021-09-12

* Update, cleaning and changing to TypeScript
* Added function to set at wich time to start the ticking sound

## [1.2.1] 2021-06-16

* Updated module.json for 0.8.7 (Compatible 0.8.x & 0.7.x)

## [1.2.0] 2021-05-18

* Updated module.json for 0.7.9
* Removed unnecessary images
* Added option to avoid the timer on non-owned NPC (GM NPC)
* Reduced size in half to avoid cluttering the window
* Changed animation to a fluid one instead of a step-like 
* Added verification to avoid negative values in timer
