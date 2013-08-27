(function() {
  var $;

  $ = jQuery;

  $.fn.freefocus = function() {
    return this.each(function(i) {
      return $(this).html('stub' + i);
    });
  };

  $.freefocus = function(options) {
    options = $.extend({}, $.freefocus.options, options);
    return 'stub' + options.stub;
  };

  $.freefocus.options = {
    stub: 'stub'
  };

}).call(this);
