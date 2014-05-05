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

It can be used as a polyfill for [CSS3 UI `nav-*` directional focus navigation](http://www.w3.org/TR/css3-ui/#nav-dir).

Uses [W3C WICD Current Focus Point Algorithm](http://www.w3.org/TR/WICD/#current-focus-point-algorithm) for focus traversal.

## Download

- [Minified version](https://raw.github.com/Flamefork/freefocus/master/jquery.freefocus.min.js)
- [Development version](https://raw.github.com/Flamefork/freefocus/master/jquery.freefocus.js)

## Getting Started

```html
<script src="jquery.js"></script>
<script src="jquery.freefocus.min.js"></script>
<script>
$(function() {
  $.freefocus({hoverFocus: true});
});
</script>
```

## Documentation

### `$.freefocus({options...}, {moveOptions...})`

Set up keyboard navigation.

Options:

- `focusablesSelector` - selector for keyboard navigation targets. default: a long selector describing all focusable options in web browsers.
  You may want to provide something shorter to improve performance or use `:focusable` if you use jQuery UI.
- `focusedSelector` - selector for currently focused (or active) element. default: `':focus'`
- `hoverFocus` - focus target elements on mouse enter. default: `false`
  - `throttle` - throttle key input for specified time (in milliseconds).
    You'll need underscore.js included to use this feature. default: `false`

Move options are passed to [`$.fn.freefocus`](#fnfreefocusoptions)


### `$.freefocus('remove')`

Remove previously set keyboard navigation.


### `$.freefocus('cache', focusablesSelector)`

Compute and cache dimension information for focusable elements.


### `$.fn.freefocus({options...})`

Move "focus" from active element to one of the targets by triggering specified event.

Options:

- `move` - move direction: `left` | `right` | `up` | `down`. no default
- `targets` - jQuery object containing "focusable" elements. no default
- `debug` - print weighting information over targets. default: `false`
- `trigger` - event to trigger on selected target. default: `'focus'`
- `useNavProps` - respect `nav-*` directional focus navigation style properties. default: `true`
- `maxDistance` - maximum distance to element to still consider moving to it. default: `Infinity`
- `cache` - cache dimension information for element. default: `false`
  You'll need to manually reset cache for moved elements by using `$(element).freefocus('moved')`


### `$.fn.freefocus('dimensions')`

Get element dimensions `{top, left, width, height}`. Uses cache, if it's enabled.


### `$.fn.freefocus('moved')`

Clears cached dimension info for element. Should be triggered for every element that is moved, if using `cache`.


## Changelog

- 0.5.1 Added selector parameter to caching function. Cleaned up code a bit.
- 0.5.0 Added support for caching focusable elements dimensions. Speeds up navigation on slow devices.
- 0.4.2 Fixed using spatial navigation algorithm as a fallback for nav properties.
- 0.4.1 Added maxDistance option. Focus point now stored relative to focused element, so it's consistent even if element is moved / scrolled.
- 0.4.0 Implemented WICD Current focus point focus navigation algorithm.
- 0.3.1 Support for non-standard arrow key codes. Added input throttling (depends on UnderscoreJS).
- 0.3.0 Rewritten in vanilla JavaScript for easier maintenance.
- 0.2.2 Fixed double movement for platforms that already implement spatial navigation.
- 0.2.1 Added support for navLeft DOM properties in addition to nav-left CSS properties.
- 0.2.0 Added support for CSS3 UI `nav-*` directional focus navigation properties. Changed naming style from under_scores to camelCase.
- 0.1.1 Updated minor stuff like readme, packaging, documentation
- 0.1.0 Initial version
