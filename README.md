# FreeFocus

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

VanillaJS core:

- [Core](https://raw.github.com/Flamefork/freefocus/master/freefocus.js)
- [Minified version](https://raw.github.com/Flamefork/freefocus/master/freefocus.min.js)

jQuery plugin:

- [Core (plugin dependency)](https://raw.github.com/Flamefork/freefocus/master/freefocus.js)
- [Plugin](https://raw.github.com/Flamefork/freefocus/master/jquery.freefocus.js)
- [Minified merged version](https://raw.github.com/Flamefork/freefocus/master/jquery.freefocus.min.js)

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

That's it, now you have it all set up.

## Core Documentation

TBD, sorry. See [Source](https://github.com/Flamefork/freefocus/blob/master/freefocus.js) for now.

## jQuery Plugin Documentation

### `$.freefocus({options...}, {moveOptions...})`

Set up keyboard navigation.

Options:

- `focusedSelector` - selector for currently focused (or active) element. default: `':focus'`
- `hoverFocus` - focus target elements on mouse enter. default: `false`
- `throttle` - throttle key input for specified time (in milliseconds).
  You'll need underscore.js included to use this feature. default: `false`

Move options are passed to [`$.fn.freefocus`](#fnfreefocusoptions)


### `$.freefocus('remove')`

Remove previously set keyboard navigation.


### `$.freefocus('cache', options)`

Compute and cache dimension information for focusable elements. Options: `focusablesSelector`, `focusablesFilter`, `focusablesContext`


### `$.fn.freefocus({options...})`

Move "focus" from active element to one of the targets by triggering specified event.

Options:

- `move` - move direction: `left` | `right` | `up` | `down`. no default
- `focusablesSelector` - selector for navigation targets. default: a long selector describing all focusable options in web browsers.
  You may want to provide something shorter to improve performance or use `:focusable` from jQuery UI.
- `focusablesFilter` — selector that filters targets after they were selected using `focusablesSelector`.
  Separated for performance reasons. default: `':visible'`
- `focusablesContext` — element or selector, conext for navigation targets search. default: `undefined`
- `targets` - jQuery object containing "focusable" elements. no default
  You should supply either focusablesSelector/Filter (preferred if you use nav-*) or explicit targets.
- `debug` - print weighting information over targets. default: `false`
- `trigger` - event to trigger on selected target. default: `'focus'`
- `preTrigger` - event to trigger on selected target before the `trigger` one. default: `false` (don't trigger)
  Useful if `trigger` is `focus` to move the next focused element into view to avoid native behavior.
- `maxDistance` - maximum distance to element to still consider moving to it. default: `Infinity`
- `cache` - cache dimension information for element. default: `false`
  You'll need to manually reset cache for moved elements by using `$(element).freefocus('moved')`


### `$.fn.freefocus('dimensions')`

Get element dimensions `{top, left, width, height}`. Uses cache, if it's enabled.


### `$.fn.freefocus('moved')`

Clear cached dimension info for element. Should be triggered for every element that is moved, if using `cache`.


### `$.fn.freefocus('nav', hints)`

Set hints (see next chapter for details).

Hints argument is either:

- hints object - example: `{ left: 'none', right: '#someId' }`. no default
- `clear` - special string value, clear all nav hints from the element


### nav-* hints

Allows for fine-grained control over focus movements.
FreeFocus implements [CSS3 UI `nav-*` directional focus navigation](http://www.w3.org/TR/css3-ui/#nav-dir) specification with few differences:

- targeting frames is not supported
- added special value `none`, which disables focus movement in the specified direction. e.g. `nav-left: none;` means that pressing left arrow does nothing
- added reading JavaScript counterparts to css properties: `navLeft`, `navRight`, `navUp`, `navDown`. e.g. `domNode.navLeft = '#someId';`
- full jQuery selector syntax allowed. In case of multiple elements matching the selector, FreeFocus would navigate to the first that is really focusable (using `focusablesSelector` and `focusablesFilter`)
- if the hint targets multiple elements, FreeFoucs will search for the best target using spacial navigation rules
- listing multiple hints separated by `;` allows to set priorities: they will be matched in a listed order one by one. first that matches any vaild tagret would be taken

Hints could be specified using

- HTML tags `style` attribute: `nav-left`, `nav-right`, `nav-up`, `nav-down`
- JavaScript counterparts to CSS properties: `navLeft`, `navRight`, `navUp`, `navDown`
- data attributes: `<button data-nav-left="selector">`
- FreeFocus API on top of data attributes: `$.fn.freefocus('nav')`

## Changelog

- 0.11.0 Extracted the jQuery-less core into `freefocus.js`
- 0.10.3 Freefocus now logs errors to console and uses safe fallback instead of throwing errors 
- 0.10.2 Fixed `freefocus('cache')`
- 0.10.1 Removed lots of jQuery calls from code, speedup is imminent
- 0.10.0 Supported `targets` option to be a function that returns focusable elements instead of using `focusablesSelector` and `focusablesFilter`
- 0.9.0 Freefocus returns focus target (or self if no target found) instead of self
- 0.8.8 Optimized custom event triggering
- 0.8.7 Element dimensions doesn't include border anymore
- 0.8.6 Allowed nav hints to target outside `focusablesContext`
- 0.8.5 Fixed contiguous target navigation
- 0.8.4 Supported clearing nav hints
- 0.8.3 Supported merging nav hints
- 0.8.2 Changed target separator to `;`
- 0.8.1 Added `data-nav-*` attributes support
- 0.8.0 Added jQuery syntax support, added `$.fn.freefocus('nav')` method
- 0.7.0 Added `focusablesContext` option. Moved `focusables*` options from `setupOptions` to `moveOptions`.
- 0.6.0 Added `focusablesFilter` setup option. Added optional `focusablesSelector` and `focusablesFilter` move options which has better performance over `targets` when used with `nav-*` props.
- 0.5.4 Added special `none` value for nav-* properties.
- 0.5.3 Fixed the bug when freefocus tries to focus invisible element if it's found by CSS3 directional props.
- 0.5.2 Added `preTrigger` event.
- 0.5.1 Added selector parameter to caching function. Cleaned up code a bit.
- 0.5.0 Added support for caching focusable elements dimensions. Speeds up navigation on slow devices.
- 0.4.2 Fixed using spatial navigation algorithm as a fallback for nav-* properties.
- 0.4.1 Added maxDistance option. Focus point now stored relative to focused element, so it's consistent even if element is moved / scrolled.
- 0.4.0 Implemented WICD Current focus point focus navigation algorithm.
- 0.3.1 Support for non-standard arrow key codes. Added input throttling option (using UnderscoreJS, if available).
- 0.3.0 Rewritten in vanilla JavaScript for easier maintenance.
- 0.2.2 Fixed double movement for platforms that already implement spatial navigation.
- 0.2.1 Added support for navLeft DOM properties in addition to nav-left CSS properties.
- 0.2.0 Added support for CSS3 UI `nav-*` directional focus navigation properties. Changed naming style from under_scores to camelCase.
- 0.1.1 Updated minor stuff like readme, packaging, documentation
- 0.1.0 Initial version
