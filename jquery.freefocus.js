/*

jQuery.Freefocus 0.7.0

Copyright (c) 2013-2014 Ilia Ablamonov. Licensed under the MIT license.

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
  - `useNavProps` - respect `nav-*` directional focus navigation style properties. default: `true`
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

  Clears cache for element.

  */

  $.fn.freefocus = function (options) {
    if (options === 'dimensions') {
      var box = getElementBox(this, true, false);
      return {
        left: box.x1,
        top: box.y1,
        width: box.x2 - box.x1,
        height: box.y2 - box.y1
      };
    }

    if (options === 'moved') {
      this.data('freefocus-dimensions', null);
      return;
    }

    options = $.extend({}, $.freefocus.moveOptions, options);

    if ($.freefocus.moves[options.move] === null)
      throw new Error('Unknown move direction "' + options.move + '"');
    if (!options.targets && !options.focusablesSelector)
      throw new Error('Options should contain either focusablesSelector or targets');
    if (options.targets && !(options.targets instanceof $))
      throw new Error('Argument targets should be a jQuery object');
    if (this.size() > 1)
      throw new Error('Can\'t move from multiple elements');
    if (!this.size())
      return this; // It's useful to be silent here

    if (options.debug) {
      clearDots();
    }

    updateFocusPoint(this, options.move, options.cache);

    var to = targetFromNavProps(this, options) || targetWithMinDistance(this, options);

    if (!to || !to.length)
      return this; // It's useful to be silent here

    moveFocusPoint(to, options.move, options.debug, options.cache);

    if (options.preTrigger) {
      to.trigger(options.preTrigger);
    }
    to.trigger(options.trigger);

    return this;
  };

  /*

  Defaults:

  */

  $.freefocus.moveOptions = {
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
    trigger: 'focus',
    preTrigger: false,
    debug: false,
    useNavProps: true,
    maxDistance: Infinity
  };

  $.freefocus.setupOptions = {
    focusedSelector: ':focus',
    hoverFocus: false,
    throttle: false
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

  function targetFromNavProps($el, options) {
    var to = $el.get(0).style['nav' + (options.move.charAt(0).toUpperCase()) + (options.move.slice(1))];

    if (to && to.length) {
      // Toshiba adds garbage to the end
      to = to.split(' ')[0];
    } else {
      to = parseStyleString($el.attr('style') || '')['nav-' + options.move];
    }

    if (!to || !to.length)
      return;

    if (to === 'none')
      return $();

    if (to.indexOf('#') !== 0)
      to = '#' + to;

    var target = $(to);

    if (options.focusablesFilter && !target.is(options.focusablesFilter))
      return;

    return target;
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

  function updateFocusPoint($el, direction, cache) {
    var box = getElementBox($el, cache, cache);
    var fp = $.freefocus.focusPoint;

    // If the element was focused by freefocus,
    // thus we have valid current focus point
    if (!$el.is(fp.$el)) {
      fp.$el = $el;
      fp.box = {
        x: (box.x2 - box.x1) / 2,
        y: (box.y2 - box.y1) / 2
      };
    }
    fp.updatedInDirection = coordsInDirection(boxCoordsToClient(fp.box, box), direction);
    fp.updatedInDirection.fwd = boxInDirection(box, direction).fwd2;
  }

  function moveFocusPoint($el, direction, debug, cache) {
    var box = getElementBox($el, cache, cache);
    var fp = $.freefocus.focusPoint;

    fp.$el = $el;

    var boxInDir = boxInDirection(box, direction);
    var movedInDirection = {
      fwd: boxInDir.fwd1,
      ort: bound(fp.updatedInDirection.ort, boxInDir.ort1, boxInDir.ort2)
    };
    fp.box = clientCoordsToBox(coordsFromDirection(movedInDirection, direction), box);

    if (debug) {
      putDot(coordsFromDirection(movedInDirection, direction), '#00f', 'entry focus point for ' + $el.html());
    }
  }

  function targetWithMinDistance($fromEl, options) {
    var fromBox = boxInDirection(getElementBox($fromEl, options.cache, options.cache), options.move);

    if (options.debug) {
      putDot(coordsFromDirection($.freefocus.focusPoint.updatedInDirection, options.move), '#0f0', 'exit focus point for ' + $fromEl.html());
    }

    var minDistance = Infinity;
    var $resultEl = null;

    var targets;
    if (options.targets) {
      targets = options.targets;
    } else {
      targets = $(options.focusablesSelector, options.focusablesContext);
      if (options.focusablesFilter)
        targets = targets.filter(options.focusablesFilter);
    }

    targets.each(function () {
      var $toEl = $(this);

      // Skip currently focused element
      if ($toEl.is($fromEl))
        return;

      var toBox = boxInDirection(getElementBox($toEl, options.cache, options.cache), options.move);

      // Skip elements that are not in the direction of movement
      if (toBox.fwd2 <= fromBox.fwd2)
        return;

      var dist = distance(fromBox, toBox);

      if (dist < options.maxDistance && dist < minDistance) {
        $resultEl = $toEl;
        minDistance = dist;
      }
    });

    if (options.debug && $resultEl) {
      console.log('Distance from', $fromEl.get(0), 'to', $resultEl.get(0), 'is', minDistance);
    }

    return $resultEl;
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

  function computeElementBox($el) {
    var offset = $el.offset();
    return {
      x1: offset.left,
      y1: offset.top,
      x2: offset.left + $el.outerWidth(),
      y2: offset.top + $el.outerHeight()
    };
  }

  function getElementBox($el, readCache, writeCache) {
    var box;

    if (readCache)
      box = $el.data('freefocus-dimensions');
    if (!box)
      box = computeElementBox($el);
    if (writeCache)
      $el.data('freefocus-dimensions', box);

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
    var targets = $(options.focusablesSelector, options.focusablesContext);
    if (options.focusablesFilter)
      targets = targets.filter(options.focusablesFilter);
    targets.each(function () {
      getElementBox($(this), true, true);
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
})(jQuery);
