function expectFocus(selector, fn) {
  'use strict';

  var spy = spyOnEvent(selector, 'focus');
  fn();
  expect(spy).toHaveBeenTriggered();
  spy.reset();
}

function printFocused() {
  'use strict';

  console.log("Focused: " + document.activeElement.className);
}

function printDebug(className) {
  'use strict';

  var el = document.getElementsByClassName(className)[0];
  var info = $('span.weights', el).text().trim().split(/\s+/).join(' ');
  console.log("" + className + ": " + info);
}

function pressKey(direction) {
  'use strict';

  var e = jQuery.Event('keydown');
  e.which = keycodes[direction];
  $(document).trigger(e);
}

var keycodes = {
  left: 37,
  up: 38,
  right: 39,
  down: 40
};

// Fix few uses of `:focus` selector on PhantomJS

if (navigator.userAgent.match(/PhantomJS/)) {
  var oldInit = jQuery.fn.init;
  var oldIs = jQuery.fn.is;

  jQuery.fn.init = function(selector) {
    'use strict';

    if (selector === ':focus') {
      arguments[0] = document.activeElement;
    }
    return oldInit.apply(this, arguments);
  };
  jQuery.fn.init.prototype = jQuery.fn;

  jQuery.fn.is = function(selector) {
    'use strict';

    if (selector === ':focus') {
      return this === document.activeElement;
    } else {
      return oldIs.apply(this, arguments);
    }
  };
}
