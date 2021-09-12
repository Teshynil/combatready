export function hasClass(el, className) {
    return el.classList
        ? el.classList.contains(className)
        : new RegExp("\\b" + className + "\\b").test(el.className);
}

export function addClass(el, className) {
    if (el.classList) el.classList.add(className);
    else if (!hasClass(el, className)) el.className += " " + className;
}

export function removeClass(el, className) {
    if (el.classList) el.classList.remove(className);
    else
        el.className = el.className.replace(
            new RegExp("\\b" + className + "\\b", "g"),
            ""
        );
}

export function offset(el) {
    var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
}

export function style(el) {
    return el.currentStyle || window.getComputedStyle(el);
}
export function insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}
export function insertBefore(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode);
}

/**
 * Helper to grab a parent class via CSS ClassName
 *
 * @param elem (HTMLElement) : the element to start from.
 * @param cls (String) : The class name to search for.
 * @param depth (Number) : The maximum height/depth to look up.
 * @returns (HTMLElement) : the parent class if found, or the current element if not.
 *
 * @private
 */

 export function seekParentClass(elem, cls, depth) {
    depth = depth || 5;
    let el = elem;
    for (let i = 0; i < depth; ++i) {
        if (!el) break;
        if (hasClass(el, cls)) break;
        else el = el.parentNode;
    }
    return el;
}