# freefocus
# Copyright (c) 2013 Ilia Ablamonov
# Licensed under the MIT license.

$ = jQuery

$.fn.freefocus = ->
  @each (i) ->
    $(this).html 'stub' + i

$.freefocus = (options) ->
  options = $.extend({}, $.freefocus.options, options)
  'stub' + options.stub

$.freefocus.options = stub: 'stub'
