window.expectFocus = (selector, fn) ->
  spy = spyOnEvent(selector, 'focus')
  fn()
  expect(spy).toHaveBeenTriggered()
  spy.reset()

window.printFocused = ->
  console.log "Focused: #{document.activeElement.className}"

window.printDebug = (className) ->
  el = $(".#{className}").get(0)
  info = $('span.weights', el).text().trim().split(/\s+/).join(' ')
  console.log "#{className}: #{info}"

window.pressKey = (direction) ->
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
  oldInit = jQuery.fn.init
  jQuery.fn.init = (selector, others...) ->
    if selector == ':focus'
      oldInit.apply(@, [document.activeElement].concat(others))
    else
      oldInit.apply(@, arguments)
  jQuery.fn.init.prototype = jQuery.fn

  oldIs = jQuery.fn.is
  jQuery.fn.is = (selector) ->
    if selector == ':focus'
      return @ is document.activeElement
    else
      oldIs.apply(@, arguments)
