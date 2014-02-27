function printFocused() {
  'use strict';

  console.log("Focused: " + document.activeElement.outerHTML);
}

function pressKey(direction) {
  'use strict';

  var keyCode = {
    left: 37,
    up: 38,
    right: 39,
    down: 40
  }[direction];

  $(document).trigger(jQuery.Event('keydown', { which: keyCode }));
}

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
