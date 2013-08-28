# Copyright (c) 2013 Ilia Ablamonov. Licensed under the MIT license.

$ = jQuery

# ### $.freefocus({options...}, {move_options...})
#
# Set up keyboard navigation.
#
# Options:
#
# - `focusables_selector` - selector for keyboard navigation targets. default: `'[tabindex]'`
# - `focused_selector` - selector for currently focused (or active) element. default: `':focus'`
# - `hover_focus` - focus target elements on mouse enter. default: `false`
#
# Move options are paseed to [`$.fn.freefocus`](#section-3)
#
# Usage:
# ```
# $.freefocus({hover_focus: true})
# ```
#
# ### $.freefocus('remove')
#
# Remove previously set keyboard navigation.

$.freefocus = (setup_options, move_options) ->
  if setup_options == 'remove'
    remove_handlers()
    return

  setup_options = $.extend({}, $.freefocus.setup_options, setup_options)

  add_handler 'keydown', (event) ->
    move = move_keys[event.which]
    return unless move
    options = $.extend {}, $.freefocus.move_options, move_options,
      move: move,
      targets: $(setup_options.focusables_selector)
    $(setup_options.focused_selector).freefocus(options)

  if setup_options.hover_focus
    add_handler 'mouseenter', setup_options.focusables_selector, ->
      $(@).trigger(move_options?.trigger || $.freefocus.move_options.trigger)

# ### .freefocus({move_options...})
#
# Move "focus" from active element to one of the targets by triggering specified event.
#
# Options:
#
# - `move` - move direction: `left` | `right` | `up` | `down`. no default
# - `targets` - jQuery object containing "focusable" elements. no default
# - `debug` - print weighting information over targets. default: `false`
# - `trigger` - event to trigger on selected target. default: `'focus'`
# - `weight_fn` - function to determine the best match in specified direction.
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
#   Default: `$.freefocus.weight_fn`
#
# Usage:
# ```
# $(':focus').freefocus({move: 'right', targets: $('[tabindex]')})
# ```

$.fn.freefocus = (options) ->
  options = $.extend({}, $.freefocus.move_options, options)
  throw new Error "Unknown move direction '#{options.move}'" unless angles[options.move]?
  throw new Error "Argument targets should be a jQuery object" unless options.targets instanceof $
  throw new Error "Can't move from multiple elements" if @size() > 1
  return unless @size() # It's useful to be silent here

  to = target_with_min_weight(@get(0), options)
  return unless to # It's useful to be silent here

  $(to).trigger(options.trigger)

# Defaults:

$.freefocus.weight_fn = ({distance, angle}) ->
  if angle > 89
    false
  else
    4 * angle + distance

$.freefocus.move_options =
  trigger: 'focus'
  weight_fn: $.freefocus.weight_fn
  debug: false

$.freefocus.setup_options =
  focusables_selector: '[tabindex]'
  focused_selector: ':focus'
  hover_focus: false

# Calculations:

angles =
  left:  Math.atan2( 0, -1)
  up:    Math.atan2(-1,  0)
  right: Math.atan2( 0,  1)
  down:  Math.atan2( 1,  0)

move_keys =
  37: 'left'
  38: 'up'
  39: 'right'
  40: 'down'

element_info = (element) ->
  $element = $(element)
  result = $element.offset()
  result.width  = $element.width()
  result.height = $element.height()
  result.center =
    x: result.left + result.width  / 2
    y: result.top  + result.height / 2
  result

distance_angle = (from, to, move) ->
  dx = to.x - from.x
  dy = to.y - from.y
  distance = Math.sqrt(dx * dx + dy * dy)
  angle = Math.abs(angles[move] - Math.atan2(dy, dx)) / Math.PI * 180
  angle = Math.abs(angle - 360) if angle > 180
  [distance, angle]

target_with_min_weight = (from, {targets, move, weight_fn, debug}) ->
  from_info = element_info(from)
  to = null
  min_weight = null
  targets.each ->
    return if @ == from
    target_info = element_info(@)
    [distance, angle] = distance_angle(from_info.center, target_info.center, move)

    weight = weight_fn
      from: [from, from_info]
      to: [@, target_info]
      move: move
      distance: distance
      angle: angle

    log_weights(@, distance, angle, weight) if debug

    if weight is true # exact match
      to = @
      return false
    else if weight is false
      # nothing
    else if !min_weight || weight < min_weight
      min_weight = weight
      to = @
  to

log_weights = (element, distance, angle, weight) ->
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

event_handlers = []

add_handler = (args...) ->
  $(document).on(args...)
  event_handlers.push(args)

remove_handlers = ->
  $(document).off(args...) for args in event_handlers
  event_handlers = []
