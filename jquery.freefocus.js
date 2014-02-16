/*

jQuery.Freefocus 0.3.0

Copyright (c) 2013-2014 Ilia Ablamonov. Licensed under the MIT license.

*/

(function($) {
  'use strict';

  /*

  ### $.freefocus({options...}, {moveOptions...})

  Set up keyboard navigation.

  Options:

  - `focusablesSelector` - selector for keyboard navigation targets. default: `'[tabindex]'`
  - `focusedSelector` - selector for currently focused (or active) element. default: `':focus'`
  - `hoverFocus` - focus target elements on mouse enter. default: `false`

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

    addHandler('keydown', function(event) {
      var move = $.freefocus.moveKeys[event.which];

      if (!move)
        return;

      event.preventDefault();

      var options = $.extend({}, moveOptions, {
        move: move,
        targets: $(setupOptions.focusablesSelector)
      });

      $(setupOptions.focusedSelector).freefocus(options);
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
  - `weightFn` - function to determine the best match in specified direction.
    Arguments:
     - `from` - active element and its position summary: `[element, {width, height, top, left, center: {x, y}}]`
     - `to` - possible target and its position summary
     - `move` - move direction
     - `distance` - distance between centers of `from` and `to` elements
     - `angle` - angle between the move direction and direction to `to` element

    Function should return either `true` (exact match), `false` (no match)
    or "weight" of the possible target.
    Target with lowest weight is the best match.
    Default: `$.freefocus.weightFn`

  Usage:
  ```
  $(':focus').freefocus({move: 'right', targets: $('[tabindex]')})
  ```

  */

  $.fn.freefocus = function(options) {
    options = $.extend({}, $.freefocus.moveOptions, options);

    if ($.freefocus.angles[options.move] === null)
      throw new Error("Unknown move direction '" + options.move + "'");
    if (!(options.targets instanceof $))
      throw new Error("Argument targets should be a jQuery object");
    if (this.size() > 1)
      throw new Error("Can't move from multiple elements");
    if (!this.size())
      return this; // It's useful to be silent here

    var to = null;

    if (options.useNavProps) {
      var toSelector = this.get(0).style["nav" + (options.move.charAt(0).toUpperCase()) + (options.move.slice(1))];
      toSelector || (toSelector = parseStyleString(this.attr('style') || '')["nav-" + options.move]);
      if (toSelector && (toSelector.indexOf('#') === 0)) // CSS3 UI only defines #id value to be directive
        to = $(toSelector).get(0);
    }

    to || (to = targetWithMinWeight(this.get(0), options));

    if (!to)
      return this; // It's useful to be silent here

    $(to).trigger(options.trigger);

    return this;
  };


  /*

  Defaults:

  */

  $.freefocus.weightFn = function(info) {
    if (info.angle > 89) {
      return false;
    } else {
      return 4 * info.angle + info.distance;
    }
  };

  $.freefocus.moveOptions = {
    trigger: 'focus',
    weightFn: $.freefocus.weightFn,
    debug: false,
    useNavProps: true
  };

  $.freefocus.setupOptions = {
    focusablesSelector: '[tabindex]',
    focusedSelector: ':focus',
    hoverFocus: false
  };

  $.freefocus.moveKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  $.freefocus.angles = {
    left: Math.atan2(0, -1),
    up: Math.atan2(-1, 0),
    right: Math.atan2(0, 1),
    down: Math.atan2(1, 0)
  };


  /*

  Calculations:

  */

  function elementInfo(element) {
    var $el = $(element);
    var result = $el.offset();
    result.width = $el.width();
    result.height = $el.height();
    result.center = {
      x: result.left + result.width / 2,
      y: result.top + result.height / 2
    };
    return result;
  }

  function distanceAngle(from, to, move) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    var angle = Math.abs($.freefocus.angles[move] - Math.atan2(dy, dx)) / Math.PI * 180;
    if (angle > 180) {
      angle = Math.abs(angle - 360);
    }
    return {
      distance: distance,
      angle: angle
    };
  }

  function targetWithMinWeight(from, options) {
    var fromInfo = elementInfo(from);
    var to = null;
    var minWeight = null;

    options.targets.each(function() {
      if (this === from)
        return;

      var targetInfo = elementInfo(this);

      var info = distanceAngle(fromInfo.center, targetInfo.center, options.move);

      var weight = options.weightFn({
        from: [from, fromInfo],
        to: [this, targetInfo],
        move: options.move,
        distance: info.distance,
        angle: info.angle
      });

      if (options.debug) {
        logWeights(this, info.distance, info.angle, weight);
      }

      if (weight === true) { // exact match
        to = this;
        return false;
      } else if (weight === false) {
        // nothing
      } else if (!minWeight || weight < minWeight) {
        minWeight = weight;
        to = this;
      }
    });
    return to;
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

  function logWeights(element, distance, angle, weight) {
    var style = [
      'position: absolute',
      'left: 5px',
      'top: 5px',
      'font-size: 10px',
      'font-family: monospace',
      'color: #fff',
      'text-shadow: 0 0 2px #000'
    ].join(';');

    var content = [
      'd = ' + Math.round(distance),
      'a = ' + Math.round(angle),
      'w = ' + weight ? Math.round(weight) : ''
    ].join('<br/>');

    var span = '<span class="weights" style="' + style + '">' + content + '</span>';

    $('span.weights', element).remove();
    $(element).append(span);
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
