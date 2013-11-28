(function() {
  var $, addHandler, angles, distanceAngle, elementInfo, eventHandlers, logWeights, moveKeys, removeHandlers, targetWithMinWeight,
    __slice = [].slice;

  $ = jQuery;

  $.freefocus = function(setupOptions, moveOptions) {
    if (setupOptions === 'remove') {
      removeHandlers();
      return;
    }
    setupOptions = $.extend({}, $.freefocus.setupOptions, setupOptions);
    addHandler('keydown', function(event) {
      var move, options;
      move = moveKeys[event.which];
      if (!move) {
        return;
      }
      options = $.extend({}, $.freefocus.moveOptions, moveOptions, {
        move: move,
        targets: $(setupOptions.focusablesSelector)
      });
      return $(setupOptions.focusedSelector).freefocus(options);
    });
    if (setupOptions.hoverFocus) {
      return addHandler('mouseenter', setupOptions.focusablesSelector, function() {
        return $(this).trigger((moveOptions != null ? moveOptions.trigger : void 0) || $.freefocus.moveOptions.trigger);
      });
    }
  };

  $.fn.freefocus = function(options) {
    var to;
    options = $.extend({}, $.freefocus.moveOptions, options);
    if (angles[options.move] == null) {
      throw new Error("Unknown move direction '" + options.move + "'");
    }
    if (!(options.targets instanceof $)) {
      throw new Error("Argument targets should be a jQuery object");
    }
    if (this.size() > 1) {
      throw new Error("Can't move from multiple elements");
    }
    if (!this.size()) {
      return;
    }
    to = targetWithMinWeight(this.get(0), options);
    if (!to) {
      return;
    }
    return $(to).trigger(options.trigger);
  };

  $.freefocus.weightFn = function(_arg) {
    var angle, distance;
    distance = _arg.distance, angle = _arg.angle;
    if (angle > 89) {
      return false;
    } else {
      return 4 * angle + distance;
    }
  };

  $.freefocus.moveOptions = {
    trigger: 'focus',
    weightFn: $.freefocus.weightFn,
    debug: false
  };

  $.freefocus.setupOptions = {
    focusablesSelector: '[tabindex]',
    focusedSelector: ':focus',
    hoverFocus: false
  };

  angles = {
    left: Math.atan2(0, -1),
    up: Math.atan2(-1, 0),
    right: Math.atan2(0, 1),
    down: Math.atan2(1, 0)
  };

  moveKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  elementInfo = function(element) {
    var $element, result;
    $element = $(element);
    result = $element.offset();
    result.width = $element.width();
    result.height = $element.height();
    result.center = {
      x: result.left + result.width / 2,
      y: result.top + result.height / 2
    };
    return result;
  };

  distanceAngle = function(from, to, move) {
    var angle, distance, dx, dy;
    dx = to.x - from.x;
    dy = to.y - from.y;
    distance = Math.sqrt(dx * dx + dy * dy);
    angle = Math.abs(angles[move] - Math.atan2(dy, dx)) / Math.PI * 180;
    if (angle > 180) {
      angle = Math.abs(angle - 360);
    }
    return [distance, angle];
  };

  targetWithMinWeight = function(from, _arg) {
    var debug, fromInfo, minWeight, move, targets, to, weightFn;
    targets = _arg.targets, move = _arg.move, weightFn = _arg.weightFn, debug = _arg.debug;
    fromInfo = elementInfo(from);
    to = null;
    minWeight = null;
    targets.each(function() {
      var angle, distance, targetInfo, weight, _ref;
      if (this === from) {
        return;
      }
      targetInfo = elementInfo(this);
      _ref = distanceAngle(fromInfo.center, targetInfo.center, move), distance = _ref[0], angle = _ref[1];
      weight = weightFn({
        from: [from, fromInfo],
        to: [this, targetInfo],
        move: move,
        distance: distance,
        angle: angle
      });
      if (debug) {
        logWeights(this, distance, angle, weight);
      }
      if (weight === true) {
        to = this;
        return false;
      } else if (weight === false) {

      } else if (!minWeight || weight < minWeight) {
        minWeight = weight;
        return to = this;
      }
    });
    return to;
  };

  logWeights = function(element, distance, angle, weight) {
    $('span.weights', element).remove();
    return $(element).append("<span class=\"weights\" style=\"position: absolute; left: 5px; top: 5px;\n                             font-size: 10px; font-family: monospace;\n                             color: #fff; text-shadow: 0 0 2px #000;\">\n  d = " + (Math.round(distance)) + "<br>\n  a = " + (Math.round(angle)) + "<br>\n  w = " + (weight ? Math.round(weight) : void 0) + "\n</pre>");
  };

  eventHandlers = [];

  addHandler = function() {
    var args, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    (_ref = $(document)).on.apply(_ref, args);
    return eventHandlers.push(args);
  };

  removeHandlers = function() {
    var args, _i, _len, _ref;
    for (_i = 0, _len = eventHandlers.length; _i < _len; _i++) {
      args = eventHandlers[_i];
      (_ref = $(document)).off.apply(_ref, args);
    }
    return eventHandlers = [];
  };

}).call(this);
