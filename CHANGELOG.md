# CHANGELOG

## [3.2.0] 2021-10-31
* Added option to automatic end the animations after N seconds

## [3.1.0] 2021-10-31
* Some bug fixing
* Added compatibility with Simple-Mobile
* Some corrections in the native Themes and Timers
* New Package Related: [Combat Ready! Themes Pack](https://github.com/Teshynil/combatreadythemes) in which i will be adding some themes and timers for the module

## [3.0.0] 2021-10-28
* [BREAKING CHANGES] If anyone was working using the api, now its changed to allow timer modules *Tutorial coming soon*

* Add option to get the name for the animations from different sources and bug fixing
> Takes care of #12 
* Add option to change color for the chevrons and the text for the animations
* Now in "Just Text" mode the text appears sooner
* Now the timer config are in a submenu
* Added support for custom timers
* Added dependency to socketlib 
* Reworked all the socket calls
* Change how the timer renders
> Takes care of #13 

## [2.0.0] 2021-10-07

* Change all sounds included in the module in order to avoid any copyright problems
* Added option to customize all the sounds used in the module
* Reestructure all the localization files to use json properly
* Implement an API for future use
* Added support to custom animations themes
* Added option to test the animations
* Added option in the native theme to use the combatant name in the alert
* Added option in the native theme  to use custom HTML for the alerts

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
