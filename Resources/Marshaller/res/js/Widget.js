(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.Widget = factory();
    }
}(this, function () {
    var widgetID = 0;
    function Widget() {
        this._id = "Widget" + widgetID++;
    };

    //  Instance Methods  ---
    Widget.prototype.implements = function(source) {
        for (var prop in source) {
            if (this[prop] === undefined && source.hasOwnProperty(prop)) {
                this[prop] = source[prop];
            }
        }
    };

    Widget.prototype.debounce = function (func, threshold, execAsap) {
        return function debounced() {
            var obj = this, args = arguments;
            function delayed() {
                if (!execAsap)
                    func.apply(obj, args);
                obj.timeout = null;
            };
            if (obj.timeout)
                clearTimeout(obj.timeout);
            else if (execAsap)
                func.apply(obj, args);
            obj.timeout = setTimeout(delayed, threshold || 100);
        }
    };

    return Widget;
}));
