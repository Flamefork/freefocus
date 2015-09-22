/*

Freefocus 0.11.1

Copyright (c) 2013-2015 Ilia Ablamonov. Licensed under the MIT license.

*/

(function () {
  'use strict';

  // ==================== Public ===============================================

  var freefocus = window.freefocus = {
    move: move,

    getDimensions: getDimensions,

    populateDimensionsCache: populateDimensionsCache,
    invalidateDimensionsCache: invalidateDimensionsCache,

    setHint: setHint,
    clearHint: clearHint,

    // Will be set later in code
    configuration: undefined
  };

  function getDimensions(element) {
    if (!element) {
      console.error('Can\'t get freefocus dimensions for nothing');
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    var box = getElementBox(element, true, false);
    return {
      left: box.x1,
      top: box.y1,
      width: box.x2 - box.x1,
      height: box.y2 - box.y1
    };
  }

  function populateDimensionsCache(element) {
    if (!element) {
      console.error('Can\'t populate freefocus cache for nothing');
      return;
    }
    getElementBox(element, true, true);
  }

  function invalidateDimensionsCache(element) {
    if (!element) {
      console.error('Can\'t invalidate freefocus cache for nothing');
      return;
    }
    delete element.freefocusDimensions;
  }

  function clearHint(element) {
    if (!element) {
      console.error('Can\'t clear freefocus hint for nothing');
      return;
    }
    for (var move in directions) {
      element.removeAttribute('data-nav-' + move);
    }
  }

  function setHint(element, hint) {
    if (!element) {
      console.error('Can\'t set freefocus hints for nothing');
      return;
    }
    for (var move in hint) {
      element.setAttribute('data-nav-' + move, hint[move]);
    }
  }

  function move(fromElement, direction, candidatesFn) {
    var target;

    if (!fromElement) {
      console.error('Can\'t move freefocus from nothing');
      return target;
    }

    if (!directions[direction]) {
      console.error('Unknown freefocus direction "' + direction + '"');
      return target;
    }

    if (!candidatesFn) {
      console.error('Can\'t move freefocus without candidates function');
      return target;
    }

    updateFocusPoint(fromElement, direction, configuration.cache);

    var targets = findTargetsFromHint(fromElement, direction, candidatesFn);
    if (targets) {
      if (targets.length <= 1) {
        // If targets is empty, return nothing, it's the result of a `none` hint
        target = targets[0];
      } else {
        // Find the nearest target from ones set by hint
        var targetsFn = function () { return targets; };
        target = findNearestTarget(fromElement, direction, targetsFn);
      }
    } else {
      // If no hint found, find the nearest target from all available candidates
      target = findNearestTarget(fromElement, direction, candidatesFn);
    }

    if (target) {
      moveFocusPoint(target, direction, configuration.cache);
    }

    return target;
  }

  var directions = {
    left: {
      toUnified: function (coords) {
        return { fwd: -coords.x, ort: -coords.y };
      },
      fromUnified: function (coords) {
        return { x: -coords.fwd, y: -coords.ort };
      }
    },
    right: {
      toUnified: function (coords) {
        return { fwd:  coords.x, ort:  coords.y };
      },
      fromUnified: function (coords) {
        return { x:  coords.fwd, y:  coords.ort };
      }
    },
    up: {
      toUnified: function (coords) {
        return { fwd: -coords.y, ort:  coords.x };
      },
      fromUnified: function (coords) {
        return { x:  coords.ort, y: -coords.fwd };
      }
    },
    down: {
      toUnified: function (coords) {
        return { fwd:  coords.y, ort: -coords.x };
      },
      fromUnified: function (coords) {
        return { x: -coords.ort, y:  coords.fwd };
      }
    }
  };

  var hintSources = [
    function (el, direction) {
      return el.getAttribute('data-nav-' + direction);
    }
  ];

  var configuration = freefocus.configuration = {
    maxDistance: Infinity,
    cache: false,

    directions: directions,
    hintSources: hintSources
  };

  // ==================== Private ==============================================

  var focusPoint = {
    freefocusId: -1
  };

  function findTargetsFromHint(element, direction, candidatesFn) {
    var hint = firstMatch(hintSources, function (source) {
      var hint = source(element, direction);
      return hint && hint.trim();
    });

    if (hint) {
      hint = hint.trim();
    }

    if (!hint) {
      return undefined;
    }

    if (hint === 'none') {
      // Empty set => no movement
      return [];
    }

    // Allow to set explicit order by enumerating selectors
    return firstMatch(hint.split(/\s*;\s*/), function (hintSelector) {
      if (!hintSelector) {
        // A `hint` with a trailing `;` creates an empty hintSelector.
        return undefined;
      }
      var candidates = candidatesFn(hintSelector);

      if (!candidates.length) {
        // Avoid firstMatch ending with an empty array
        return undefined;
      }
      return candidates;
    });
  }

  function findNearestTarget(fromElement, direction, candidatesFn) {
    var fromBox = boxInDirection(getElementBox(fromElement, configuration.cache, configuration.cache), direction);

    var candidates = candidatesFn();
    var minDistance = configuration.maxDistance;

    var target;

    for (var i = 0, len = candidates.length; i < len; i++) {
      var candidate = candidates[i];

      // Skip currently focused element
      if (candidate === fromElement) {
        continue;
      }

      var toBox = boxInDirection(getElementBox(candidate, configuration.cache, configuration.cache), direction);

      // Skip elements that are not in the direction of movement
      if (toBox.fwd1 < fromBox.fwd2) {
        continue;
      }

      var dist = distance(fromBox, toBox);

      if (dist < minDistance) {
        target = candidate;
        minDistance = dist;
      }
    }

    return target;
  }

  function distance(fromBox, toBox) {
    var fromPoint = focusPoint.updatedInDirection;

    var toPoint = {
      fwd: toBox.fwd1,
      ort: bound(fromPoint.ort, toBox.ort1, toBox.ort2)
    };

    var fwdDist = Math.abs(toPoint.fwd - fromPoint.fwd);
    var ortDist = Math.abs(toPoint.ort - fromPoint.ort);

    // The Euclidian distance between the current focus point position and
    // its potential position in the candidate.
    // If the two positions have the same coordinate on the axis orthogonal
    // to the navigation direction, dotDist is forced to 0 in order to favor
    // elements in direction of navigation
    var dotDist;
    if (toPoint.ort === fromPoint.ort) {
      dotDist = 0;
    } else {
      dotDist = Math.sqrt(fwdDist * fwdDist + ortDist * ortDist);
    }

    // The overlap between the opposing edges of currently focused element and the candidate.
    // Elements are rewarded for having high overlap with the currently focused element.
    var overlap = boxOverlap(fromBox, toBox);

    return dotDist + fwdDist + 2 * ortDist - Math.sqrt(overlap);
  }

  function boxOverlap(box1, box2) {
    var orts = {
      ort1: box1.ort1,
      ort2: box1.ort2
    };

    if (box2.ort1 > orts.ort1)
      orts.ort1 = box2.ort1;
    if (box2.ort2 < orts.ort2)
      orts.ort2 = box2.ort2;

    var result = orts.ort2 - orts.ort1;
    if (result < 0)
      result = 0;

    return result;
  }

  function computeElementBox(el) {
    var rect = el.getBoundingClientRect();
    return {
      x1: rect.left,
      y1: rect.top,
      x2: rect.right,
      y2: rect.bottom
    };
  }

  function getElementBox(element, readCache, writeCache) {
    var box;

    if (readCache) {
      box = element.freefocusDimensions;
    }
    if (!box) {
      box = computeElementBox(element);
    }
    if (writeCache) {
      element.freefocusDimensions = box;
    }

    return box;
  }

  function boxInDirection(box, direction) {
    var p1 = directions[direction].toUnified({ x: box.x1, y: box.y1 });
    var p2 = directions[direction].toUnified({ x: box.x2, y: box.y2 });
    return {
      fwd1: Math.min(p1.fwd, p2.fwd),
      ort1: Math.min(p1.ort, p2.ort),
      fwd2: Math.max(p1.fwd, p2.fwd),
      ort2: Math.max(p1.ort, p2.ort)
    };
  }

  function boxCoordsToClient(coords, box) {
    return {
      x: coords.x + box.x1,
      y: coords.y + box.y1
    };
  }

  function clientCoordsToBox(coords, box) {
    return {
      x: coords.x - box.x1,
      y: coords.y - box.y1
    };
  }

  function updateFocusPoint(element, direction, cache) {
    var box = getElementBox(element, cache, cache);

    // If the element wasn't focused by freefocus, calculate it
    if (!element.freefocusId || element.freefocusId !== focusPoint.elementId) {
      focusPoint.elementId = assignId(element);
      focusPoint.box = {
        x: (box.x2 - box.x1) / 2,
        y: (box.y2 - box.y1) / 2
      };
    }
    focusPoint.updatedInDirection = directions[direction].toUnified(boxCoordsToClient(focusPoint.box, box));
    focusPoint.updatedInDirection.fwd = boxInDirection(box, direction).fwd2;
  }

  function moveFocusPoint(element, direction, cache) {
    var box = getElementBox(element, cache, cache);

    // Hold reference only for numeric id instead of a full DOM node
    focusPoint.elementId = assignId(element);

    var boxInDir = boxInDirection(box, direction);
    var movedInDirection = {
      fwd: boxInDir.fwd1,
      ort: bound(focusPoint.updatedInDirection.ort, boxInDir.ort1, boxInDir.ort2)
    };
    focusPoint.box = clientCoordsToBox(directions[direction].fromUnified(movedInDirection), box);
  }

  // ==================== Utilities ============================================

  function bound(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function firstMatch(array, fn) {
    for (var i = 0, len = array.length; i < len; i++) {
      var result = fn(array[i]);
      if (result) {
        return result;
      }
    }
  }

  var lastElementId = 0;
  function assignId(element) {
    var elementId = element.freefocusId;
    if (!elementId) {
      elementId = element.freefocusId = ++lastElementId;
    }
    return elementId;
  }
})();
