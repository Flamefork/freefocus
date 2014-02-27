/*

jQuery.Freefocus 0.3.1

Copyright (c) 2013-2014 Ilia Ablamonov. Licensed under the MIT license.

*/

(function($) {
  'use strict';

  /*

  ### $.freefocus({options...}, {moveOptions...})

  Set up keyboard navigation.

  Options:

  - `focusablesSelector` - selector for keyboard navigation targets. default: a long selector describing all focusable options in web browsers.
    You may want to provide something shorter to improve performance or use `:focusable` from jQuery UI.
  - `focusedSelector` - selector for currently focused (or active) element. default: `':focus'`
  - `hoverFocus` - focus target elements on mouse enter. default: `false`
  - `throttle` - throttle key input for specified time (in milliseconds). Uses underscore.js. default: `false`

  Move options are passed to `$.fn.freefocus`

  Usage:
  ```
  $.freefocus({hoverFocus: true})
  ```

  ### $.freefocus('remove')

  Remove previously set keyboard navigation.

  */

  $.freefocus = function(setupOptions, moveOptions) {
    if (setupOptions === 'remove') {
      removeHandlers();
      return;
    }

    setupOptions = $.extend({}, $.freefocus.setupOptions, setupOptions);

    var keyHandler = function(move) {
      var options = $.extend({}, moveOptions, {
        move: move,
        targets: $(setupOptions.focusablesSelector)
      });

      $(setupOptions.focusedSelector).freefocus(options);
    };

    if (setupOptions.throttle !== false)
      keyHandler = _.throttle(keyHandler, setupOptions.throttle);

    addHandler('keydown', function(event) {
      var move = $.freefocus.keys[event.which];

      if (!move)
        return;

      event.preventDefault();

      keyHandler(move);
    });

    if (setupOptions.hoverFocus) {
      addHandler('mouseenter', setupOptions.focusablesSelector, function() {
        var trigger = (moveOptions || {}).trigger || $.freefocus.moveOptions.trigger;
        return $(this).trigger(trigger);
      });
    }
  };


  /*

  ### .freefocus({moveOptions...})

  Move "focus" from active element to one of the targets by triggering specified event.

  Options:

  - `move` - move direction: `left` | `right` | `up` | `down`. no default
  - `targets` - jQuery object containing "focusable" elements. no default
  - `debug` - print weighting information over targets. default: `false`
  - `trigger` - event to trigger on selected target. default: `'focus'`
  - `useNavProps` - respect `nav-*` directional focus navigation style properties. default: `true`

  Usage:
  ```
  $(':focus').freefocus({move: 'right', targets: $('[tabindex]')})
  ```

  */

  $.fn.freefocus = function(options) {
    options = $.extend({}, $.freefocus.moveOptions, options);

    if ($.freefocus.moves[options.move] === null)
      throw new Error("Unknown move direction '" + options.move + "'");
    if (!(options.targets instanceof $))
      throw new Error("Argument targets should be a jQuery object");
    if (this.size() > 1)
      throw new Error("Can't move from multiple elements");
    if (!this.size())
      return this; // It's useful to be silent here

    var to = targetFromNavProps(this, options) || targetWithMinDistance(this, options);

    if (!to)
      return this; // It's useful to be silent here

    moveFocusPoint(to, options.move);

    to.trigger(options.trigger);

    return this;
  };


  /*

  Defaults:

  */

  $.freefocus.moveOptions = {
    trigger: 'focus',
    weightFn: $.freefocus.weightFn,
    debug: false,
    useNavProps: true
  };

  $.freefocus.setupOptions = {
    focusablesSelector: [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '*[tabindex]',
      '*[contenteditable]'
    ].join(', '),
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

  $.freefocus.focusPoint = {
    element: null,
    x: null,
    y: null
  };


  /*

  Private:

  */

  function targetFromNavProps($el, options) {
    var to =
      $el.get(0).style["nav" + (options.move.charAt(0).toUpperCase()) + (options.move.slice(1))] ||
      parseStyleString($el.attr('style') || '')["nav-" + options.move];

    if (!to)
      return;

    if (to.indexOf('#') === 0) {
      return $(to);
    } else {
      throw new Error("Invalid nav-" + options.move + " selector '" + to + "': only #id allowed.");
    }
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

  function targetWithMinDistance($fromEl, options) {
    if (options.debug) {
      putDot($.freefocus.focusPoint, 'red', 'focus point for ' + $fromEl.get(0).id);
    }

    var fromBox = boxToDirection(elementBox($fromEl), options.move);
    var focusPoint = coordsInDirection(focusPointInDirection($fromEl, options.move, options.debug), options.move);


    var minDistance = Infinity;
    var to = null;

    options.targets.each(function() {
      var $toEl = $(this);

      // Skip currently focused element
      if ($toEl.is($fromEl))
        return;

      var toBox = boxToDirection(elementBox($toEl), options.move);

      // Skip elements that are not in the direction of movement
      if (toBox.fwd2 <= fromBox.fwd2)
        return;

      var dist = distance(fromBox, toBox, focusPoint);

      if (dist < minDistance) {
        to = $toEl;
        minDistance = dist;
      }
    });

    return to;
  }

  function focusPointInDirection($el, direction, debug) {
    var box = elementBox($el);
    var fp = $.freefocus.focusPoint;

    // If the element was focused by freefocus,
    // thus we have valid current focus point
    if ($el.is(fp.$el)) {
      // Move focus point to the exit edge for given direction
      switch (direction) {
        case 'left':
          fp.x = box.x1; break;
        case 'right':
          fp.x = box.x2; break;
        case 'up':
          fp.y = box.y1; break;
        case 'down':
          fp.y = box.y2; break;
      }
    } else {
      // Just pick the center of the element
      fp = $.freefocus.focusPoint = {
        element: $el,
        x: Math.round(box.x1 + (box.x2 - box.x1) / 2),
        y: Math.round(box.y1 + (box.y2 - box.y1) / 2)
      };
      if (debug) {
        putDot(fp, 'blue', 'picked focus point for ' + $el.get(0).id);
      }
    }
    return fp;
  }

  function moveFocusPoint($el, direction) {
    var box = elementBox($el);
    var fp = $.freefocus.focusPoint;

    fp.$el = $el;

    switch (direction) {
      case 'left':
        fp.x = box.x2; break;
      case 'right':
        fp.x = box.x1; break;
      case 'up':
        fp.y = box.y2; break;
      case 'down':
        fp.y = box.y1; break;
    }
  }

  function elementBox($el) {
    var offset = $el.offset();
    return {
      x1: offset.left,
      y1: offset.top,
      x2: offset.left + $el.outerWidth(),
      y2: offset.top + $el.outerHeight()
    };
  }

  function boxToDirection(box, direction) {
    switch (direction) {
      case 'left':
        return { fwd1: -box.x2, fwd2: -box.x1, ort1: -box.y2, ort2: -box.y1 };
      case 'right':
        return { fwd1:  box.x1, fwd2:  box.x2, ort1:  box.y1, ort2:  box.y2 };
      case 'up':
        return { fwd1: -box.y2, fwd2: -box.y1, ort1:  box.x1, ort2:  box.x2 };
      case 'down':
        return { fwd1:  box.y1, fwd2:  box.y2, ort1: -box.x2, ort2: -box.x1 };
    }
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

  function distance(fromBox, toBox, fromPoint) {
    var toPoint = possibleFocusPoint(fromPoint, toBox);

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

  function possibleFocusPoint(fromPoint, toBox) {
    var result = {
      fwd: toBox.fwd1,
      ort: fromPoint.ort
    };

    if (result.ort < toBox.ort1)
      result.ort = toBox.ort1;
    if (result.ort > toBox.ort2)
      result.ort = toBox.ort2;

    return result;
  }


  /*

  Debug:

  */

  function putDot(coords, color, title) {
    $('<div title="' + title + '"></div>').appendTo($('body')).css({
      position: 'absolute',
      left: coords.x - 3,
      top: coords.y - 3,
      width: 6,
      height: 6,
      background: color,
      'border-radius': 3
    });
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
