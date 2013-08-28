(function() {
  var $, add_handler, angles, distance_angle, element_info, event_handlers, log_weights, move_keys, remove_handlers, target_with_min_weight,
    __slice = [].slice;

  $ = jQuery;

  $.freefocus = function(setup_options, move_options) {
    if (setup_options === 'remove') {
      remove_handlers();
      return;
    }
    setup_options = $.extend({}, $.freefocus.setup_options, setup_options);
    add_handler('keydown', function(event) {
      var move, options;
      move = move_keys[event.which];
      if (!move) {
        return;
      }
      options = $.extend({}, $.freefocus.move_options, move_options, {
        move: move,
        targets: $(setup_options.focusables_selector)
      });
      return $(setup_options.focused_selector).freefocus(options);
    });
    if (setup_options.hover_focus) {
      return add_handler('mouseenter', setup_options.focusables_selector, function() {
        return $(this).trigger((move_options != null ? move_options.trigger : void 0) || $.freefocus.move_options.trigger);
      });
    }
  };

  $.fn.freefocus = function(options) {
    var to;
    options = $.extend({}, $.freefocus.move_options, options);
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
    to = target_with_min_weight(this.get(0), options);
    if (!to) {
      return;
    }
    return $(to).trigger(options.trigger);
  };

  $.freefocus.weight_fn = function(_arg) {
    var angle, distance;
    distance = _arg.distance, angle = _arg.angle;
    if (angle > 89) {
      return false;
    } else {
      return 4 * angle + distance;
    }
  };

  $.freefocus.move_options = {
    trigger: 'focus',
    weight_fn: $.freefocus.weight_fn,
    debug: false
  };

  $.freefocus.setup_options = {
    focusables_selector: '[tabindex]',
    focused_selector: ':focus',
    hover_focus: false
  };

  angles = {
    left: Math.atan2(0, -1),
    up: Math.atan2(-1, 0),
    right: Math.atan2(0, 1),
    down: Math.atan2(1, 0)
  };

  move_keys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
  };

  element_info = function(element) {
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

  distance_angle = function(from, to, move) {
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

  target_with_min_weight = function(from, _arg) {
    var debug, from_info, min_weight, move, targets, to, weight_fn;
    targets = _arg.targets, move = _arg.move, weight_fn = _arg.weight_fn, debug = _arg.debug;
    from_info = element_info(from);
    to = null;
    min_weight = null;
    targets.each(function() {
      var angle, distance, target_info, weight, _ref;
      if (this === from) {
        return;
      }
      target_info = element_info(this);
      _ref = distance_angle(from_info.center, target_info.center, move), distance = _ref[0], angle = _ref[1];
      weight = weight_fn({
        from: [from, from_info],
        to: [this, target_info],
        move: move,
        distance: distance,
        angle: angle
      });
      if (debug) {
        log_weights(this, distance, angle, weight);
      }
      if (weight === true) {
        to = this;
        return false;
      } else if (weight === false) {

      } else if (!min_weight || weight < min_weight) {
        min_weight = weight;
        return to = this;
      }
    });
    return to;
  };

  log_weights = function(element, distance, angle, weight) {
    $('span.weights', element).remove();
    return $(element).append("<span class=\"weights\" style=\"position: absolute; left: 5px; top: 5px;\n                             font-size: 10px; font-family: monospace;\n                             color: #fff; text-shadow: 0 0 2px #000;\">\n  d = " + (Math.round(distance)) + "<br>\n  a = " + (Math.round(angle)) + "<br>\n  w = " + (weight ? Math.round(weight) : void 0) + "\n</pre>");
  };

  event_handlers = [];

  add_handler = function() {
    var args, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    (_ref = $(document)).on.apply(_ref, args);
    return event_handlers.push(args);
  };

  remove_handlers = function() {
    var args, _i, _len, _ref;
    for (_i = 0, _len = event_handlers.length; _i < _len; _i++) {
      args = event_handlers[_i];
      (_ref = $(document)).off.apply(_ref, args);
    }
    return event_handlers = [];
  };

}).call(this);
