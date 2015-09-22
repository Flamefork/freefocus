/*

jQuery.Freefocus 0.10.3

Copyright (c) 2013-2015 Ilia Ablamonov. Licensed under the MIT license.

*/

(function ($) {
  'use strict';

  var freefocus = window.freefocus;

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
      var cacheOptions = $.extend({}, $.freefocus.cacheOptions, moveOptions);

      var targets = cacheOptions.targets;
      if ($.isFunction(targets)) {
        targets = targets(cacheOptions);
      }
      freefocus.populateDimensionsCache(targets);
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
      if (!moveOptions.focusablesSelector) {
        console.error('focusablesSelector is required for hoverFocus');
        moveOptions.focusablesSelector = 'zzz';
      }

      addHandler('mouseenter', moveOptions.focusablesSelector, function () {
        var trigger = (moveOptions || {}).trigger || $.freefocus.moveOptions.trigger;
        var target = $(this);
        if (setupOptions.focusablesFilter) {
          target = target.filter(setupOptions.focusablesFilter);
        }
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
        console.error('Can\'t get freefocus dimensions for empty jQuery object');
        return { left: 0, top: 0, width: 0, height: 0 };
      }
      if (this.length > 1) {
        console.error('Can\'t use freefocus on multiple element jQuery object');
        // First element will be used
      }

      return freefocus.getDimensions(this[0]);
    }

    if (options === 'moved') {
      freefocus.invalidateDimensionsCache(this);
      return;
    }

    if (options === 'nav') {
      if (navHints === 'clear') {
        this.each(function () {
          freefocus.clearHint(this);
        });
      } else {
        this.each(function () {
          freefocus.setHint(this, navHints);
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
      console.error('Can\'t use freefocus on multiple element jQuery object');
      // First element will be used
    }

    var direction = options.move;
    options = $.extend({}, $.freefocus.moveOptions, options);

    freefocus.configuration.cache = options.cache;
    freefocus.configuration.maxDistance = options.maxDistance;

    if (!freefocus.configuration.directions[direction]) {
      console.error('Unknown move direction "' + direction + '"');
      return this;
    }
    if (!($.isFunction(options.targets) || $.isArray(options.targets) || options.targets.jquery)) {
      console.warn('Argument targets should be a function, array, or jQuery object');
    }

    var candidatesFn = function (hintSelector) {
      if (hintSelector) {
        var targetFn = $.isFunction(options.targets) ? options.targets : defaultTargets;
        var targetFnOptions = $.extend({}, options, { hintSelector: hintSelector });

        return targetFn(targetFnOptions);
      } else {
        var targets = options.targets;
        if ($.isFunction(targets)) {
          targets = targets(options);
        }
        return targets;
      }
    };

    var toEl = freefocus.move(this[0], direction, candidatesFn);

    if (!toEl) {
      // It's useful to be silent in this case
      return this;
    }

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
      console.error('Options should contain either focusablesSelector or targets');
      return [];
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

  freefocus.configuration.hintSources.push(
    function (element, direction) {
      var propName = 'nav' + (direction.charAt(0).toUpperCase()) + (direction.slice(1));
      var hint = element.style[propName];
      return fixToshiba(hint);
    },

    function (element, direction) {
      var style = $.trim(element.getAttribute('style'));
      var hint = style && parseStyleString(style)['nav-' + direction];
      return fixToshiba(hint);
    }
  );

  /*

  Private:

  */

  function fixToshiba(hint) {
    // Toshiba removes "#" from the beginning and adds " ''" to the end
    return hint && hint.replace(/^([^#].*) ''$/, '#$1');
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

  /*

  Event handlers:

  */

  // Rewrite using jQuery's event namespaces instead

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
