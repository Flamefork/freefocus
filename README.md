# jQuery.FreeFocus

"Visual", no-hassle navigation in HTML using IR remote / arrow keys.

Intended for HTML5 applications where arrow keys or IR remote control is essential:
SmartTV applications, set-top box UI, etc.

Many current devices are able to use mouse pointer: LG Magic Remote, Samsung Smart Touch Remote,
USB Wireless mouse, etc. Implementing two different navigation schemes is hard.

FreeFocus lets you stick with the easy one (pointer device, we used to it in Web UI)
and handles the hard one (direction keys) in the most unobtrusive way.

No need to operate separate logical navigation structures (lists, grids, etc).
Just use HTML for UI and let FreeFocus navigate it "visually" — using positions of
focusable elements on page. If user pressed "right", just move focus to focusable
element placed to the right of the current focused one. It's that easy.

## Download

- [Minified version](https://raw.github.com/Flamefork/freefocus/master/dist/jquery.freefocus.min.js)
- [Development version](https://raw.github.com/Flamefork/freefocus/master/dist/jquery.freefocus.js)

## Getting Started

```html
<script src="jquery.js"></script>
<script src="dist/jquery.freefocus.min.js"></script>
<script>
$(function() {
  $.freefocus({hover_focus: true});
});
</script>
```

## Documentation

### `$.freefocus({options...}, {move_options...})`

Set up keyboard navigation.

Options:

- `focusables_selector` - selector for keyboard navigation targets. default: `'[tabindex]'`
- `focused_selector` - selector for currently focused (or active) element. default: `':focus'`
- `hover_focus` - focus target elements on mouse enter. default: `false`

Move options are passed to [`$.fn.freefocus`](#fnfreefocusoptions)

### `$.freefocus('remove')`

Remove previously set keyboard navigation.

### `$.fn.freefocus({options...})`

Move "focus" from active element to one of the targets by triggering specified event.

Options:

- `move` - move direction: `left` | `right` | `up` | `down`. no default
- `targets` - jQuery object containing "focusable" elements. no default
- `debug` - print weighting information over targets. default: `false`
- `trigger` - event to trigger on selected target. default: `'focus'`
- `weight_fn` - function to determine the best match in specified direction. default: `$.freefocus.weight_fn`

    `weight_fn` arguments:

    - `from` - active element and its position summary: `[element, {width, height, top, left, center: {x, y}}]`
    - `to` - possible target and its position summary
    - `move` - move direction
    - `distance` - distance between centers of `from` and `to` elements
    - `angle` - angle between the move direction and direction to `to` element

    Function should return either `true` (exact match), `false` (no match)
    or "weight" of the possible target.Target with lowest weight is the best match.

### [Annotated source](http://flamefork.github.io/freefocus/freefocus.html)
