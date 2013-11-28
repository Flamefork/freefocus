# Copyright (c) 2013 Ilia Ablamonov. Licensed under the MIT license.

$ = jQuery

# ### $.freefocus({options...}, {moveOptions...})
#
# Set up keyboard navigation.
#
# Options:
#
# - `focusablesSelector` - selector for keyboard navigation targets. default: `'[tabindex]'`
# - `focusedSelector` - selector for currently focused (or active) element. default: `':focus'`
# - `hoverFocus` - focus target elements on mouse enter. default: `false`
#
# Move options are passed to [`$.fn.freefocus`](#section-3)
#
# Usage:
# ```
# $.freefocus({hoverFocus: true})
# ```
#
# ### $.freefocus('remove')
#
# Remove previously set keyboard navigation.

$.freefocus = (setupOptions, moveOptions) ->
  if setupOptions == 'remove'
    removeHandlers()
    return

  setupOptions = $.extend({}, $.freefocus.setupOptions, setupOptions)

  addHandler 'keydown', (event) ->
    move = moveKeys[event.which]
    return unless move
    options = $.extend {}, $.freefocus.moveOptions, moveOptions,
      move: move,
      targets: $(setupOptions.focusablesSelector)
    $(setupOptions.focusedSelector).freefocus(options)

  if setupOptions.hoverFocus
    addHandler 'mouseenter', setupOptions.focusablesSelector, ->
      $(@).trigger(moveOptions?.trigger || $.freefocus.moveOptions.trigger)

# ### .freefocus({moveOptions...})
#
# Move "focus" from active element to one of the targets by triggering specified event.
#
# Options:
#
# - `move` - move direction: `left` | `right` | `up` | `down`. no default
# - `targets` - jQuery object containing "focusable" elements. no default
# - `debug` - print weighting information over targets. default: `false`
# - `trigger` - event to trigger on selected target. default: `'focus'`
# - `useNavProps` - respect `nav-*` directional focus navigation style properties
# - `weightFn` - function to determine the best match in specified direction.
#   Arguments:
#    - `from` - active element and its position summary: `[element, {width, height, top, left, center: {x, y}}]`
#    - `to` - possible target and its position summary
#    - `move` - move direction
#    - `distance` - distance between centers of `from` and `to` elements
#    - `angle` - angle between the move direction and direction to `to` element
#
#   Function should return either `true` (exact match), `false` (no match)
#   or "weight" of the possible target.
#   Target with lowest weight is the best match.
#   Default: `$.freefocus.weightFn`
#
# Usage:
# ```
# $(':focus').freefocus({move: 'right', targets: $('[tabindex]')})
# ```

$.fn.freefocus = (options) ->
  options = $.extend({}, $.freefocus.moveOptions, options)
  throw new Error "Unknown move direction '#{options.move}'" unless angles[options.move]?
  throw new Error "Argument targets should be a jQuery object" unless options.targets instanceof $
  throw new Error "Can't move from multiple elements" if @size() > 1
  return unless @size() # It's useful to be silent here

  to = null
  if options.useNavProps
    toSelector = parseStyleString(@attr('style') || '')["nav-#{options.move}"]
    if toSelector?.indexOf('#') == 0 # CSS3 UI only defines #id value to be directive
      to = $(toSelector).get(0)

  to ||= targetWithMinWeight(@get(0), options)

  return unless to # It's useful to be silent here

  $(to).trigger(options.trigger)

# Defaults:

$.freefocus.weightFn = ({distance, angle}) ->
  if angle > 89
    false
  else
    4 * angle + distance

$.freefocus.moveOptions =
  trigger: 'focus'
  weightFn: $.freefocus.weightFn
  debug: false
  useNavProps: true

$.freefocus.setupOptions =
  focusablesSelector: '[tabindex]'
  focusedSelector: ':focus'
  hoverFocus: false

# Calculations:

angles =
  left:  Math.atan2( 0, -1)
  up:    Math.atan2(-1,  0)
  right: Math.atan2( 0,  1)
  down:  Math.atan2( 1,  0)

moveKeys =
  37: 'left'
  38: 'up'
  39: 'right'
  40: 'down'

elementInfo = (element) ->
  $element = $(element)
  result = $element.offset()
  result.width  = $element.width()
  result.height = $element.height()
  result.center =
    x: result.left + result.width  / 2
    y: result.top  + result.height / 2
  result

distanceAngle = (from, to, move) ->
  dx = to.x - from.x
  dy = to.y - from.y
  distance = Math.sqrt(dx * dx + dy * dy)
  angle = Math.abs(angles[move] - Math.atan2(dy, dx)) / Math.PI * 180
  angle = Math.abs(angle - 360) if angle > 180
  [distance, angle]

targetWithMinWeight = (from, {targets, move, weightFn, debug}) ->
  fromInfo = elementInfo(from)
  to = null
  minWeight = null
  targets.each ->
    return if @ == from
    targetInfo = elementInfo(@)
    [distance, angle] = distanceAngle(fromInfo.center, targetInfo.center, move)

    weight = weightFn
      from: [from, fromInfo]
      to: [@, targetInfo]
      move: move
      distance: distance
      angle: angle

    logWeights(@, distance, angle, weight) if debug

    if weight is true # exact match
      to = @
      return false
    else if weight is false
      # nothing
    else if !minWeight || weight < minWeight
      minWeight = weight
      to = @
  to

parseStyleString = (style) ->
  result = {}
  for rule in style.split(';')
    [k, v] = rule.split(':')
    result[k.trim()] = v.trim() if v
  result

logWeights = (element, distance, angle, weight) ->
  $('span.weights', element).remove()
  $(element).append """
    <span class="weights" style="position: absolute; left: 5px; top: 5px;
                                 font-size: 10px; font-family: monospace;
                                 color: #fff; text-shadow: 0 0 2px #000;">
      d = #{Math.round(distance)}<br>
      a = #{Math.round(angle)}<br>
      w = #{Math.round(weight) if weight}
    </pre>
  """

# Event handlers:

eventHandlers = []

addHandler = (args...) ->
  $(document).on(args...)
  eventHandlers.push(args)

removeHandlers = ->
  $(document).off(args...) for args in eventHandlers
  eventHandlers = []
