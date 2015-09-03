/*

jQuery.Freefocus 0.10.1

Copyright (c) 2013-2015 Ilia Ablamonov. Licensed under the MIT license.

*/

(function ($) {
  'use strict';

  /*

  ### $.freefocus({options...}, {moveOptions...})

  Set up keyboard navigation.

  Options:

  - `focusedSelector` - selector for currently focused (or active) element. default: `':focus'`
  - `hoverFocus` - focus target elements on mouse enter. default: `false`
  - `throttle` - throttle key input for specified time (in milliseconds).
    You'll need underscore.js included to use this feature. default: `false`

  Move options are passed to `$.fn.freefocus`

  Usage:
  ```
  $.freefocus({hoverFocus: true})
  ```

  ### $.freefocus('remove')

  Remove previously set keyboard navigation.

  ### $.freefocus('cache', options)

  Compute and cache dimension information for focusable elements. Options: `focusablesSelector`, `focusablesFilter`

  */

  $.freefocus = function (setupOptions, moveOptions) {
    if (setupOptions === 'remove') {
      removeHandlers();
      return;
    }

    if (setupOptions === 'cache') {
      cacheFocusables(moveOptions);
      return;
    }

    setupOptions = $.extend({}, $.freefocus.setupOptions, setupOptions);

    var keyHandler = function (move) {
      var options = $.extend({}, moveOptions, { move: move });

      $(setupOptions.focusedSelector).freefocus(options);
    };

    if (typeof setupOptions.throttle === 'number') {
      keyHandler = _.throttle(keyHandler, setupOptions.throttle);
    }

    addHandler('keydown', function (event) {
      var move = $.freefocus.keys[event.which];

      if (!move)
        return;

      event.preventDefault();

      keyHandler(move);
    });

    if (setupOptions.hoverFocus) {
      if (!moveOptions.focusablesSelector)
        throw new Error('focusablesSelector is required for hoverFocus');
      addHandler('mouseenter', moveOptions.focusablesSelector, function () {
        var trigger = (moveOptions || {}).trigger || $.freefocus.moveOptions.trigger;
        var target = $(this);
        if (setupOptions.focusablesFilter)
          target = target.filter(setupOptions.focusablesFilter);
        return target.trigger(trigger);
      });
    }
  };

  /*

  ### .freefocus({moveOptions...})

  Move 'focus' from active element to one of the targets by triggering specified event.

  Options:

  - `move` - move direction: `left` | `right` | `up` | `down`. no default
  - `focusablesSelector` - selector for navigation targets. default: a long selector describing all focusable options in web browsers.
    You may want to provide something shorter to improve performance or use `:focusable` from jQuery UI.
  - `focusablesFilter` — selector that filters targets after they were selected using `focusablesSelector`.
    Separated for performance reasons. default: `':visible'`
  - `focusablesContext` — element or selector, conext for navigation targets search. default: `undefined`
  - `targets` - jQuery object containing 'focusable' elements. no default
    You should supply either focusablesSelector/Filter (preferred if you use nav-*) or explicit targets.
  - `debug` - print weighting information over targets. default: `false`
  - `trigger` - event to trigger on selected target. default: `'focus'`
  - `preTrigger` - event to trigger on selected target before the `trigger` one. default: `false` (don't trigger)
    Useful if `trigger` is `focus` to move the next focused element into view to avoid native behavior.
  - `maxDistance` - maximum distance to element to still consider moving to it. default: `Infinity`
  - `cache` - cache dimension information for element. default: `false`.
    You'll need to manually reset cache for moved elements by using `$(element).freefocus('moved')`

  Usage:
  ```
  $(':focus').freefocus({move: 'right', targets: $('[tabindex]')})
  ```

  ### .freefocus('dimensions')

  Get element dimensions `{top, left, width, height}`. Uses cache, if it's enabled.


  ### .freefocus('moved')

  Clear cached dimension info for element. Should be triggered for every element that is moved, if using `cache`.


  ### `$.fn.freefocus('nav', hints)`

  Set hints (see next chapter for details).

  Hints is either:

  - opbject: `{ left: 'none', right: '#someId' }`
  - special string value `clear`, which would clear all nav hints from the element

  */

  $.fn.freefocus = function (options, navHints) {
    if (options === 'dimensions') {
      if (!this.length) {
        throw new Error('Can\'t get freefocus dimensions for empty jQuery object');
      }
      if (this.length > 1) {
        throw new Error('Can\'t use freefocus on multiple element jQuery object');
      }

      var box = getElementBox(this[0], true, false);
      return {
        left: box.x1,
        top: box.y1,
        width: box.x2 - box.x1,
        height: box.y2 - box.y1
      };
    }

    if (options === 'moved') {
      this.removeData('freefocus-dimensions');
      return;
    }

    if (options === 'nav') {
      var self = this;
      if (navHints === 'clear') {
        $.each($.freefocus.moves, function (k) {
          self.removeAttr('data-nav-' + k);
        });
      } else {
        $.each(navHints, function (k, v) {
          self.attr('data-nav-' + k, v);
        });
      }
      return;
    }

    if (!this.length) {
      if (options.debug) {
        console.warn('freefocus called on empty jQuery object');
      }
      // It's useful to be silent in this case
      return this;
    }
    if (this.length > 1) {
      throw new Error('Can\'t use freefocus on multiple element jQuery object');
    }
    var el = this[0];

    options = $.extend({}, $.freefocus.moveOptions, options);

    if ($.freefocus.moves[options.move] === null) {
      throw new Error('Unknown move direction "' + options.move + '"');
    }
    if (!options.targets || !(options.targets instanceof $ || $.isFunction(options.targets))) {
      throw new Error('Argument targets should be a jQuery object or function');
    }

    if (options.debug) {
      clearDots();
    }

    updateFocusPoint(el, options.move, options.cache);

    var toEl;
    var toEls = targetsFromHints(el, options);
    if (toEls) {
      if (toEls.length > 1) {
        // choose the best option from target set
        toEl = targetWithMinDistance(el, $.extend({}, options, { targets: toEls }));
      } else {
        toEl = toEls[0];
      }
    } else {
      toEl = targetWithMinDistance(el, options);
    }

    if (!toEl) {
      // It's useful to be silent in this case
      return this;
    }

    moveFocusPoint(toEl, options.move, options.debug, options.cache);

    if (options.preTrigger) {
      triggerEvent(toEl, options.preTrigger);
    }
    if (options.trigger) {
      triggerEvent(toEl, options.trigger);
    }

    return $(toEl);
  };

  /*

  Defaults:

  */

  function defaultTargets(options) {
    var result;
    if (!options.focusablesSelector) {
      throw new Error('Options should contain either focusablesSelector or targets');
    }
    if (options.hintSelector) {
      var context = options.ignoreContextForHints ? undefined : options.focusablesContext;
      result = $(options.hintSelector, context).filter(options.focusablesSelector);
    } else {
      result = $(options.focusablesSelector, options.focusablesContext);
    }
    if (options.focusablesFilter) {
      result = result.filter(options.focusablesFilter);
    }
    return result.toArray();
  }

  $.freefocus.moveOptions = {
    targets: defaultTargets,
    focusablesSelector: [
      'a[href]',
      'area[href]',
      'input:enabled',
      'select:enabled',
      'textarea:enabled',
      'button:enabled',
      'iframe',
      'object',
      'embed',
      '*[tabindex]',
      '*[contenteditable]'
    ].join(', '),
    focusablesFilter: ':visible',
    focusablesContext: undefined,
    ignoreContextForHints: true,
    trigger: 'focus',
    preTrigger: false,
    debug: false,
    maxDistance: Infinity
  };

  $.freefocus.setupOptions = {
    focusedSelector: ':focus',
    hoverFocus: false,
    throttle: false
  };

  $.freefocus.cacheOptions = {
    targets: defaultTargets
  };

  $.freefocus.keys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  $.freefocus.moves = {
    left: {},
    right: {},
    up: {},
    down: {}
  };

  /*

  Private:

  */

  $.freefocus.focusPoint = {};

  $.freefocus.hintSources = [
    function (el, options) {
      return el.getAttribute('data-nav-' + options.move);
    },
    function (el, options) {
      var propName = 'nav' + (options.move.charAt(0).toUpperCase()) + (options.move.slice(1));
      return el.style[propName];
    },
    function (el, options) {
      var style = $.trim(el.getAttribute('style'));
      return style && parseStyleString(style)['nav-' + options.move];
    }
  ];

  function firstMatch(array, fn) {
    for (var i = 0; i < array.length; i++) {
      var result = fn(array[i]);
      if (result)
        return result;
    }
  }

  function targetsFromHints(el, options) {
    var hint = firstMatch($.freefocus.hintSources, function (source) {
      return $.trim(source(el, options));
    });

    if (!hint) {
      return undefined;
    }

    if (hint === 'none') {
      return [];
    }

    // Fix Toshiba that removes "#" from the beginning and adds " ''" to the end
    hint = hint.replace(/^([^#].*) ''$/, '#$1');

    // Allow to set explicit order by enumerating selectors
    return firstMatch(hint.split(/\s*;\s*/), function (hintSelector) {
      if (!hintSelector) {
        // A `hint` with a trailing `;` creates an empty hintSelector.
        return undefined;
      }

      var targetFn = $.isFunction(options.targets) ? options.targets : defaultTargets;

      var targets = targetFn($.extend({}, options, {
        hintSelector: hintSelector,
        focusablesContext: options.focusablesContext
      }));

      return targets.length ? targets : undefined;
    });
  }

  function parseStyleString(style) {
    var result = {};
    style.split(';').forEach(function (rule) {
      var kv = rule.split(':');
      if (kv[1])
        result[kv[0].trim()] = kv[1].trim();
    });
    return result;
  }

  function updateFocusPoint(el, direction, cache) {
    var box = getElementBox(el, cache, cache);
    var fp = $.freefocus.focusPoint;

    // If the element was focused by freefocus,
    // thus we have valid current focus point
    if (el !== fp.el) {
      fp.el = el;
      fp.box = {
        x: (box.x2 - box.x1) / 2,
        y: (box.y2 - box.y1) / 2
      };
    }
    fp.updatedInDirection = coordsInDirection(boxCoordsToClient(fp.box, box), direction);
    fp.updatedInDirection.fwd = boxInDirection(box, direction).fwd2;
  }

  function moveFocusPoint(el, direction, debug, cache) {
    var box = getElementBox(el, cache, cache);
    var fp = $.freefocus.focusPoint;

    fp.el = el;

    var boxInDir = boxInDirection(box, direction);
    var movedInDirection = {
      fwd: boxInDir.fwd1,
      ort: bound(fp.updatedInDirection.ort, boxInDir.ort1, boxInDir.ort2)
    };
    fp.box = clientCoordsToBox(coordsFromDirection(movedInDirection, direction), box);

    if (debug) {
      putDot(coordsFromDirection(movedInDirection, direction), '#00f', 'entry focus point for ' + el.innerHTML);
    }
  }

  function targetWithMinDistance(fromEl, options) {
    var fromBox = boxInDirection(getElementBox(fromEl, options.cache, options.cache), options.move);

    if (options.debug) {
      putDot(coordsFromDirection($.freefocus.focusPoint.updatedInDirection, options.move), '#0f0', 'exit focus point for ' + fromEl.innerHTML);
    }

    var targets = options.targets;
    if ($.isFunction(targets)) {
      targets = targets(options);
    }

    var minDistance = Infinity;
    var resultEl = null;

    $.each(targets, function (i, toEl) {
      // Skip currently focused element
      if (toEl === fromEl) {
        return;
      }

      var toBox = boxInDirection(getElementBox(toEl, options.cache, options.cache), options.move);

      // Skip elements that are not in the direction of movement
      if (toBox.fwd1 < fromBox.fwd2) {
        return;
      }

      var dist = distance(fromBox, toBox);

      if (dist < options.maxDistance && dist < minDistance) {
        resultEl = toEl;
        minDistance = dist;
      }
    });

    if (options.debug && resultEl) {
      console.log('Distance from', fromEl, 'to', resultEl, 'is', minDistance);
    }

    return resultEl;
  }

  function distance(fromBox, toBox) {
    var fromPoint = $.freefocus.focusPoint.updatedInDirection;

    var toPoint = {
      fwd: toBox.fwd1,
      ort: bound(fromPoint.ort, toBox.ort1, toBox.ort2)
    };

    var fwdDist = Math.abs(toPoint.fwd - fromPoint.fwd);
    var ortDist = Math.abs(toPoint.ort - fromPoint.ort);

    // The Euclidian distance between the current focus point position and
    // its potential position in the candidate.
    // If the two positions have the same coordinate on the axis orthogonal
    // to the navigation direction, dotDist is forced to 0 in order to favor
    // elements in direction of navigation
    var dotDist;
    if (toPoint.ort === fromPoint.ort) {
      dotDist = 0;
    } else {
      dotDist = Math.sqrt(fwdDist * fwdDist + ortDist * ortDist);
    }

    // The overlap between the opposing edges of currently focused element and the candidate.
    // Elements are rewarded for having high overlap with the currently focused element.
    var overlap = boxOverlap(fromBox, toBox);

    return dotDist + fwdDist + 2 * ortDist - Math.sqrt(overlap);
  }

  function boxOverlap(box1, box2) {
    var orts = {
      ort1: box1.ort1,
      ort2: box1.ort2
    };

    if (box2.ort1 > orts.ort1)
      orts.ort1 = box2.ort1;
    if (box2.ort2 < orts.ort2)
      orts.ort2 = box2.ort2;

    var result = orts.ort2 - orts.ort1;
    if (result < 0)
      result = 0;

    return result;
  }

  function computeElementBox(el) {
    var rect = el.getBoundingClientRect();
    return {
      x1: rect.left,
      y1: rect.top,
      x2: rect.right,
      y2: rect.bottom
    };
  }

  function getElementBox(el, readCache, writeCache) {
    var box;

    if (readCache) {
      box = $.data(el, 'freefocus-dimensions');
    }
    if (!box) {
      box = computeElementBox(el);
    }
    if (writeCache) {
      $.data(el, 'freefocus-dimensions', box);
    }

    return box;
  }

  function boxInDirection(box, direction) {
    var p1 = coordsInDirection({ x: box.x1, y: box.y1 }, direction);
    var p2 = coordsInDirection({ x: box.x2, y: box.y2 }, direction);
    return {
      fwd1: Math.min(p1.fwd, p2.fwd),
      ort1: Math.min(p1.ort, p2.ort),
      fwd2: Math.max(p1.fwd, p2.fwd),
      ort2: Math.max(p1.ort, p2.ort)
    };
  }

  function coordsInDirection(coords, direction) {
    switch (direction) {
      case 'left':
        return { fwd: -coords.x, ort: -coords.y };
      case 'right':
        return { fwd:  coords.x, ort:  coords.y };
      case 'down':
        return { fwd:  coords.y, ort: -coords.x };
      case 'up':
        return { fwd: -coords.y, ort:  coords.x };
    }
  }

  function coordsFromDirection(coords, direction) {
    switch (direction) {
      case 'left':
        return { x: -coords.fwd, y: -coords.ort };
      case 'right':
        return { x:  coords.fwd, y:  coords.ort };
      case 'down':
        return { x: -coords.ort, y:  coords.fwd };
      case 'up':
        return { x:  coords.ort, y: -coords.fwd };
    }
  }

  function boxCoordsToClient(coords, box) {
    return {
      x: coords.x + box.x1,
      y: coords.y + box.y1
    };
  }

  function clientCoordsToBox(coords, box) {
    return {
      x: coords.x - box.x1,
      y: coords.y - box.y1
    };
  }

  function bound(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function cacheFocusables(options) {
    options = $.extend({}, $.freefocus.cacheOptions, options);

    var targets = options.targets(options);
    targets.each(function () {
      getElementBox(this, true, true);
    });
  }

  /*

  Debug:

  */

  function clearDots() {
    $('.freefocus-debug').remove();
  }

  function putDot(coords, color, title) {
    $('<div class="freefocus-debug"></div>').appendTo($('body')).css({
      position: 'absolute',
      left: coords.x - 3,
      top: coords.y - 3,
      width: 6,
      height: 6,
      background: color,
      'border-radius': 3
    }).attr('title', title);
  }

  /*

  Event handlers:

  */

  var eventHandlers = [];
  var $document = $(document);

  function addHandler() {
    $document.on.apply($document, arguments);
    eventHandlers.push(arguments);
  }

  function removeHandlers() {
    eventHandlers.forEach(function (args) {
      $document.off.apply($document, args);
    });
    eventHandlers = [];
  }

  /*

  Trigger event optimization:

  */

  function triggerEvent(target, eventName) {
    if (document.createEvent && target.dispatchEvent && eventName !== 'focus') {
      // Native dispatchEvent is way faster than $.fn.trigger
      // Focus is a special event, handled natively by jQuery itself
      var event = document.createEvent('Event');
      event.initEvent(eventName, true, true);
      target.dispatchEvent(event);
    } else {
      // Safe fallback
      $(target).trigger($.Event(eventName));
    }
  }
})(jQuery);
