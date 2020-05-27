const registerSettings = () => {
  // module settings
  game.settings.register("combatready", "timeractive", {
    name: "Combat Ready Timer Active",
    scope: "world",
    config: false,
    default: false,
    type: Boolean,
    onChange: () => {
      //NOOP
    },
  });

  game.settings.register("combatready", "timemax", {
    name: "CombatReady.TimeMax",
    hint: "CombatReady.TimeMaxHint",
    scope: "world",
    config: true,
    default: 3,
    type: Number,
    onChange: (value) => {
      let val = Number(value);
      if (isNaN(val)) {
        game.settings.set("combatready", "timemax", 3);
        return;
      }
      if (val > 30) {
        game.settings.set("combatready", "timemax", 30);
        return;
      }
      CombatReady.setTimeMax(val * 60);
    },
  });
  game.settings.register("combatready", "endturndialog", {
    name: "CombatReady.ShowEndTurnDialog",
    hint: "CombatReady.ShowEndTurnDialogHint",
    scope: "world",
    config: true,
    default: false,
    type: Boolean,
  });
  game.settings.register("combatready", "ticksound", {
    name: "CombatReady.TickSound",
    hint: "CombatReady.TickSoundHint",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
  });
  game.settings.register("combatready", "volume", {
    name: "CombatReady.Volume",
    hint: "CombatReady.VolumeHint",
    scope: "client",
    config: true,
    range: {
      min: 0,
      max: 100,
      step: 10,
    },
    default: 60,
    type: Number,
  });
};

const volume = () => {
  const v = game.settings.get("combatready", "volume") / 100.0;
  console.log(v)
  return v;
}

/**
 *
 * Your body is ready, but is your combat tracker?
 *
 *
 *
 *
 *
 *
 *
 */

/**
 * ============================================================
 * KHelpers Module
 *
 * Encapsulates a few handy helpers
 *
 *
 *
 *
 * ============================================================
 */
var KHelpers = (function () {
  function hasClass(el, className) {
    return el.classList
      ? el.classList.contains(className)
      : new RegExp("\\b" + className + "\\b").test(el.className);
  }

  function addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!KHelpers.hasClass(el, className)) el.className += " " + className;
  }

  function removeClass(el, className) {
    if (el.classList) el.classList.remove(className);
    else
      el.className = el.className.replace(
        new RegExp("\\b" + className + "\\b", "g"),
        ""
      );
  }

  function offset(el) {
    var rect = el.getBoundingClientRect(),
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }

  function style(el) {
    return el.currentStyle || window.getComputedStyle(el);
  }
  function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
  }
  function insertBefore(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode);
  }

  /**
   * Helper to grab a parent class via CSS ClassName
   *
   * @param elem (HTMLElement) : the element to start from.
   * @param cls (String) : The class name to search for.
   * @param depth (Number) : The maximum height/depth to look up.
   * @returns (HTMLElement) : the parent class if found, or the current element if not.
   *
   * @private
   */

  function seekParentClass(elem, cls, depth) {
    depth = depth || 5;
    let el = elem;
    for (let i = 0; i < depth; ++i) {
      if (!el) break;
      if (KHelpers.hasClass(el, cls)) break;
      else el = el.parentNode;
    }
    return el;
  }

  return {
    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    offset: offset,
    style: style,
    insertAfter: insertAfter,
    insertBefore: insertBefore,
    seekParentClass: seekParentClass,
  };
})();

/**
 * ============================================================
 * CombatReady class
 *
 * Encapsulates all CombatReady functions in a class
 *
 * Copious amount of Statics used
 *
 *
 *
 *
 * ============================================================
 */
class CombatReady {
  static EndTurnDialog = [];

  static async closeEndTurnDialog() {
    // go through all dialogs that we've opened and closed them
    for (let d of CombatReady.EndTurnDialog) {
      d.close();
    }
    CombatReady.EndTurnDialog.length = 0;
  }

  static showEndTurnDialog() {
    CombatReady.closeEndTurnDialog().then(() => {
      let d = new Dialog(
        {
          title: "End Turn",
          buttons: {
            endturn: {
              label: "End Turn",
              callback: () => {
                game.combats.active.nextTurn();
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

  static adjustWidth() {
    let sidebar = document.getElementById("sidebar");
    let body = document.getElementsByTagName("body")[0];
    let banner = body.getElementsByClassName("combatready-container");
    let timebar = body.getElementsByClassName("combatready-timebar");

    // re-adjust width
    banner.style.cssText += `width: calc(100% - ${sidebar.style.width})`;
    timebar.style.cssText += `width: calc(100% - ${sidebar.style.width})`;
  }

  /**
   * JQuery stripping
   */
  static init() {
    let body = document.getElementsByTagName("body")[0];
    let sidebar = document.getElementById("sidebar");

    // Build HTML to Inject
    let cover = document.createElement("div");
    KHelpers.addClass(cover, "combatready-boardcover");

    let timebar = document.createElement("div");
    let timefill = document.createElement("div");
    let timeicon = document.createElement("div");
    KHelpers.addClass(timebar, "combatready-timebar");
    KHelpers.addClass(timefill, "combatready-timebar-fill");
    KHelpers.addClass(timeicon, "combatready-timebaricon");
    timefill.appendChild(timeicon);
    timebar.appendChild(timefill);

    let banner = document.createElement("div");
    let label = document.createElement("div");
    KHelpers.addClass(banner, "combatready-container");
    KHelpers.addClass(label, "combatready-label");
    // chevrons
    for (let idx = 0; idx < 6; ++idx) {
      let chevron = document.createElement("div");
      KHelpers.addClass(chevron, "combatready-chevron");
      banner.appendChild(chevron);
    }
    let chevrons = banner.getElementsByClassName("combatready-chevron");
    // beams
    for (let idx = 0; idx < 40; ++idx) {
      let beam = document.createElement("div");
      KHelpers.addClass(beam, "combatready-beam");
      banner.appendChild(beam);
    }
    let beams = banner.getElementsByClassName("combatready-beam");

    // Labels over effects
    banner.appendChild(label);

    // Inject into DOM Body
    body.appendChild(cover);
    body.appendChild(banner);
    body.appendChild(timebar);
    // Ajust due to DOM elements
    banner.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;
    timebar.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;

    // element statics
    CombatReady.READY = true;
    CombatReady.BANNER = banner;
    CombatReady.CHEVRONS = chevrons;
    CombatReady.BEAMS = beams;
    CombatReady.LABEL = label;
    CombatReady.COVER = cover;
    CombatReady.SOCKET = "module.combatready";
    // timer
    CombatReady.TIMEBAR = timebar;
    CombatReady.TIMEFILL = timefill;
    CombatReady.TIMEICO = timeicon;
    CombatReady.TIMECURRENT = 0;
    CombatReady.TIMEMAX = 20;
    CombatReady.INTERVAL_IDS = [];
    // sound statics
    CombatReady.TURN_SOUND = "modules/combatready/sounds/turn.wav";
    CombatReady.NEXT_SOUND = "modules/combatready/sounds/next.wav";
    CombatReady.ROUND_SOUND = "modules/combatready/sounds/round.wav";
    CombatReady.EXPIRE_SOUND = "modules/combatready/sounds/notime.wav";
    CombatReady.ACK_SOUND = "modules/combatready/sounds/ack.wav";
    CombatReady.TICK_SOUND = "modules/combatready/sounds/clocktick.mp3";
    // language specific fonts
    switch (game.i18n.lang) {
      case "en":
        KHelpers.addClass(label, "speedp");
        label.style["font-size"] = "124px";
        //label.style.top = "15px";
        break;
      case "ko":
        KHelpers.addClass(label, "bmhannapro");
        label.style["font-size"] = "100px";
        break;
      case "ja":
        KHelpers.addClass(label, "genshingothicbold");
        label.style["font-size"] = "100px";
        break;
      default:
        KHelpers.addClass(label, "ethnocentric");
        label.style["font-size"] = "90px";
        break;
    }

    registerSettings();

    // init socket
    game.socket.on(CombatReady.SOCKET, (data) => {
      if (!game.user.isGM) {
        if (data.timetick) CombatReady.TIMECURRENT = data.timetick;
        // if not ticking, start doing so to match the GM
        if (
          !CombatReady.INTERVAL_IDS.some((e) => {
            return e.name === "clock";
          })
        )
          CombatReady.timerStart();
      }
    });
  }

  static onClickTurnBanner(ev) {
    CombatReady.stopAnimate();
    // play an acknowledgement sound!
    AudioHelper.play({ src: CombatReady.ACK_SOUND, volume: volume() });
  }
  static onClickNextBanner(ev) {
    // kill next label anim if the user is fast
    let anims = TweenMax.getTweensOf(CombatReady.LABEL);
    for (let tween of anims) {
      tween.kill();
    }

    // hide cover, but keep the beams to let the user know their turn is coming up!
    KHelpers.addClass(CombatReady.BANNER, "combatready-bannerdisable");

    TweenMax.to(CombatReady.LABEL, 0.5, { opacity: 0.3 });
    TweenMax.to(CombatReady.COVER, 0.5, {
      opacity: 0,
      onComplete: function () {
        CombatReady.COVER.style.display = "none";
      },
    });
  }

  /**
   * Animate... Weee
   */
  static doAnimateTurn() {
    if (!CombatReady.READY) {
      CombatReady.init();
    }
    for (let e of CombatReady.CHEVRONS) e.style.left = "-200px";
    for (let e of CombatReady.BEAMS) {
      e.style.left = "-200px";
      e.style.animation = "none";
    }

    CombatReady.LABEL.style.opacity = "0";
    CombatReady.LABEL.textContent = game.i18n.localize("CombatReady.Turn");

    KHelpers.removeClass(CombatReady.BANNER, "combatready-bannerdisable");

    CombatReady.BANNER.style.display = "flex";
    CombatReady.COVER.style.display = "block";
    document.removeEventListener("click", CombatReady.onClickNextBanner);
    document.removeEventListener("click", CombatReady.onClickTurnBanner);
    document.addEventListener("click", CombatReady.onClickTurnBanner);

    TweenMax.staggerTo(CombatReady.CHEVRONS, 3, {
      left: "100%",
      stagger: 0.5,
      repeat: -1,
      ease: SlowMo.ease,
    });
    TweenMax.to(CombatReady.LABEL, 1, { delay: 2, opacity: 1 });
    TweenMax.to(CombatReady.COVER, 2, { opacity: 0.75 });
    // play a sound, meep meep!
    AudioHelper.play({ src: CombatReady.TURN_SOUND, volume: volume() });
  }

  /**
   * Animate the "you're up next" prompt
   */
  static doAnimateNext() {
    if (!CombatReady.READY) {
      CombatReady.init();
    }

    for (let e of CombatReady.CHEVRONS) e.style.left = "-200px";

    CombatReady.LABEL.style.opacity = "0";
    CombatReady.LABEL.textContent = game.i18n.localize("CombatReady.Next");

    KHelpers.removeClass(CombatReady.BANNER, "combatready-bannerdisable");

    CombatReady.BANNER.style.display = "flex";
    CombatReady.COVER.style.display = "block";
    CombatReady.BANNER.style.display = "flex";
    CombatReady.COVER.style.display = "block";
    document.removeEventListener("click", CombatReady.onClickTurnBanner);
    document.removeEventListener("click", CombatReady.onClickNextBanner);
    document.addEventListener("click", CombatReady.onClickNextBanner);

    // Randomize our beams
    for (let beam of CombatReady.BEAMS) {
      let width = Math.floor(Math.random() * 100) + 30;
      let time = Math.floor(Math.random() * 1.5 * 100) / 100 + 2.0;
      let delay = Math.floor(Math.random() * 3 * 100) / 100 + 0.01;
      let toffset = Math.floor(Math.random() * 90) + 10;
      let iheight = Math.floor(Math.random() * 3) + 2;

      beam.style.cssText += `animation: speedbeam ${time}s linear ${delay}s infinite; top: ${toffset}%; width: ${width}px; height: ${iheight}; left: ${-width}px;`;
    }

    TweenMax.to(CombatReady.LABEL, 1, { delay: 2, opacity: 1 });
    TweenMax.to(CombatReady.COVER, 2, { opacity: 0.75 });
    // play a sound, beep beep!
    AudioHelper.play({ src: CombatReady.NEXT_SOUND, volume: volume() });
  }

  /**
   * Stop it
   */
  static stopAnimate() {
    let anims = TweenMax.getTweensOf(CombatReady.CHEVRONS);
    for (let tween of anims) {
      tween.kill();
    }
    anims = TweenMax.getTweensOf(CombatReady.LABEL);
    for (let tween of anims) {
      tween.kill();
    }
    anims = TweenMax.getTweensOf(CombatReady.COVER);
    for (let tween of anims) {
      tween.kill();
    }

    for (let e of CombatReady.BEAMS) e.style.animation = "none";

    CombatReady.BANNER.style.display = "none";
    KHelpers.removeClass(CombatReady.BANNER, "combatready-bannerdisable");
    TweenMax.to(CombatReady.COVER, 0.5, {
      opacity: 0,
      onComplete: function () {
        CombatReady.COVER.style.display = "none";
      },
    });
  }

  /**
   * Check if the current combatant needs to be updated
   */
  static toggleCheck() {
    let curCombat = game.combats.active;

    if (curCombat && curCombat.started) {
      CombatReady.stopAnimate();
      CombatReady.timerStart();
      let entry = curCombat.combatant;
      // next combatant
      let nxtturn = (curCombat.turn || 0) + 1;
      if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
      let nxtentry = curCombat.turns[nxtturn];

      if (!!entry && !game.user.isGM) {
        CombatReady.closeEndTurnDialog().then(() => {
          if (entry.actor.owner) {
            CombatReady.doAnimateTurn();
            if (game.settings.get("combatready", "endturndialog"))
              CombatReady.showEndTurnDialog();
          } else if (nxtentry.actor.owner) {
            CombatReady.doAnimateNext();
          }
        });
      }
    }
  }

  /**
   *
   */
  static timerTick() {
    // If we're GM, we run the clock
    if (game.user.isGM) {
      CombatReady.TIMECURRENT++;
      game.socket.emit(
        CombatReady.SOCKET,
        {
          senderId: game.user._id,
          type: "Number",
          timetick: CombatReady.TIMECURRENT,
        },
        (resp) => {}
      );
    }

    // If we're in the last 25%, tick
    if (CombatReady.TIMECURRENT >= (CombatReady.TIMEMAX / 4) * 3) {
      if (game.settings.get('combatready', 'ticksound')) {
        AudioHelper.play({ src: CombatReady.TICK_SOUND, volume: volume() });
      }
    }

    let width = (CombatReady.TIMECURRENT / CombatReady.TIMEMAX) * 100;
    if (width > 100) {
      CombatReady.timerStop();
      AudioHelper.play({ src: CombatReady.EXPIRE_SOUND, volume: volume() });
    } else CombatReady.TIMEFILL.style.width = `${width}%`;
  }

  /**
   *
   */
  static setTimeMax(num) {
    CombatReady.TIMEMAX = num;
  }

  /**
   *
   */
  static timerStart() {
    CombatReady.TIMEBAR.style.display = "block";
    if (game.user.isGM) {
      // push GM time
      CombatReady.TIMECURRENT = 0;
      game.socket.emit(CombatReady.SOCKET, {
        senderId: game.user._id,
        type: "Number",
        timetick: CombatReady.TIMECURRENT,
      });
      game.settings.set("combatready", "timeractive", true);
    }

    for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
      let interval = CombatReady.INTERVAL_IDS[idx];
      if (interval.name === "clock") {
        if (game.user.isGM) CombatReady.TIMEFILL.style.width = "0%";
        // be content with a reset clock
        return;
      }
    }

    if (!game.paused) {
      // If not a GM, and the actor is hidden, don't show it
      //CombatReady.TIMEFILL.style.width = "0%";
      CombatReady.INTERVAL_IDS.push({
        name: "clock",
        id: window.setInterval(CombatReady.timerTick, 1000),
      });
    }
  }

  /**
   *
   */
  static timerStop() {
    for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
      let interval = CombatReady.INTERVAL_IDS[idx];
      if (interval.name === "clock") {
        window.clearInterval(interval.id);
        CombatReady.INTERVAL_IDS.splice(idx, 1);
        break;
      }
    }
    // kill paused bar
    CombatReady.TIMECURRENT = 0;
    CombatReady.TIMEBAR.style.display = "none";
    if (game.user.isGM) game.settings.set("combatready", "timeractive", false);
  }

  /**
   *
   */
  static timerPause() {
    for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
      let interval = CombatReady.INTERVAL_IDS[idx];
      if (interval.name === "clock") {
        window.clearInterval(interval.id);
        CombatReady.INTERVAL_IDS.splice(idx, 1);
        break;
      }
    }
  }

  /**
   *
   */
  static timerResume() {
    for (let idx = CombatReady.INTERVAL_IDS.length - 1; idx >= 0; --idx) {
      let interval = CombatReady.INTERVAL_IDS[idx];
      if (interval.name === "clock") return;
    }

    // push GM time
    if (game.user.isGM)
      game.socket.emit(CombatReady.SOCKET, {
        senderId: game.user._id,
        type: "Number",
        timetick: CombatReady.TIMECURRENT,
      });

    if (game.settings.get("combatready", "timeractive"))
      CombatReady.INTERVAL_IDS.push({
        name: "clock",
        id: window.setInterval(CombatReady.timerTick, 1000),
      });
  }
}

/**
 * Assorted hooks
 */

/**
 * Toggle pause
 */
Hooks.on("pauseGame", function () {
  if (game.paused) CombatReady.timerPause();
  else CombatReady.timerResume();
});

/**
 * Handle combatant removal
 */
Hooks.on("deleteCombat", function () {
  CombatReady.timerStop();
  CombatReady.stopAnimate();
});

/**
 * Handle combatant update
 */
Hooks.on("updateCombatant", function (context, parentId, data) {
  const combat = game.combats.get(parentId);
  if (combat) {
    const combatant = combat.data.combatants.find((o) => o.id === data.id);

    if (combatant.actor.owner) CombatReady.toggleCheck();
  }
});

/**
 * Handle combatant delete
 */
Hooks.on("deleteCombatant", function (context, parentId, data) {
  let combat = game.combats.get(parentId);

  if (combat) {
    CombatReady.stopAnimate();
    CombatReady.toggleCheck();
  }
});

/**
 * Handle combatant added
 */
Hooks.on("addCombatant", function (context, parentId, data) {
  let combat = game.combats.get(parentId);
  let combatant = combat.data.combatants.find((o) => o.id === data.id);

  if (combatant.actor.owner) CombatReady.toggleCheck();
});

/**
 * Sidebar collapse hook
 */
Hooks.on("sidebarCollapse", function (a, collapsed) {
  let sidebar = document.getElementById("sidebar");
  let body = document.getElementsByTagName("body")[0];
  let banner = body.getElementsByClassName("combatready-container")[0];
  let timebar = body.getElementsByClassName("combatready-timebar")[0];

  if (collapsed) {
    // set width to 100%
    banner.style.width = "100%";
    timebar.style.width = "100%";
  } else {
    // set width to sidebar offset size
    banner.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;
    timebar.style.width = `calc(100% - ${sidebar.offsetWidth}px)`;
  }
});

/**
 * Combat update hook
 */
Hooks.on("updateCombat", function (data, delta) {
  CombatReady.toggleCheck();

  if (!game.user.isGM && Object.keys(delta).some((k) => k === "round")) {
    AudioHelper.play({ src: "modules/combatready/sounds/round.wav", volume: volume() });
  }
});

/**
 * Ready hook
 */
Hooks.on("ready", function () {
  CombatReady.init();
  // 3m
  //CombatReady.setTimeMax(180);
  let timemax = game.settings.get("combatready", "timemax") || 3;
  CombatReady.setTimeMax(timemax * 60);

  //check if it's our turn! since we're ready
  CombatReady.toggleCheck();
});
