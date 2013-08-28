window.expect_focus = (selector, fn) ->
  spy = spyOnEvent(selector, 'focus')
  fn()
  expect(spy).toHaveBeenTriggered()
  spy.reset()

window.print_focused = ->
  console.log "Focused: #{document.activeElement.className}"

window.print_debug = (class_name) ->
  el = $(".#{class_name}").get(0)
  info = $('span.weights', el).text().trim().split(/\s+/).join(' ')
  console.log "#{class_name}: #{info}"

window.press_key = (direction) ->
  e = jQuery.Event('keydown')
  e.which = keycodes[direction]
  $(document).trigger(e)

keycodes =
  left: 37
  up: 38
  right: 39
  down: 40

window.phantomjs = !!navigator.userAgent.match(/PhantomJS/)

# Hack to fix few uses of `:focus` selector on PhantomJS

if phantomjs
  old_init = jQuery.fn.init
  jQuery.fn.init = (selector, others...) ->
    if selector == ':focus'
      old_init.apply(@, [document.activeElement].concat(others))
    else
      old_init.apply(@, arguments)
  jQuery.fn.init.prototype = jQuery.fn

  old_is = jQuery.fn.is
  jQuery.fn.is = (selector) ->
    if selector == ':focus'
      return @ is document.activeElement
    else
      old_is.apply(@, arguments)
