(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./Widget", "lib/d3/d3"], factory);
    } else {
        root.D3Widget = factory(root.Widget, root.d3);
    }
}(this, function (Widget, d3) {
    function D3Widget(target, data) {
        Widget.call(this);

        this.width = 0;
        this.height = 0;
        this._target = null;
        this._svg = null;
        this._data = null;

        if (target) {
            this.target(target);
        }
        if (data) {
            this.data(data);
        }
    };
    D3Widget.prototype = Object.create(Widget.prototype);
    D3Widget.prototype.isIE = (/trident/i.test(navigator.userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []));

    //  Target + Resize  ---
    D3Widget.prototype.resize = function (width, height) {
        if (this._size.width != width || this._size.height != height) {
            this.size({ width: width, height: height });
            this._svg
                .attr("width", this._size.width)
                .attr("height", this._size.height)
            ;
            return true;
        }
        return false;
    };

    D3Widget.prototype.calcSize = function () {
        var style = window.getComputedStyle(this._target, null);
        return {
            width: parseInt(style.getPropertyValue("width")),
            height: parseInt(style.getPropertyValue("height"))
        }
    };

    D3Widget.prototype.size = function (_) {
        if (!arguments.length) return this._size;
        this._size = _;
    };

    D3Widget.prototype.target = function (_) {
        if (!arguments.length) return this._target;
        this._target = _;
        if (typeof (this._target) === 'string' || this._target instanceof String) {
            this._target = document.getElementById(this._target);
        }
        this.size(this.calcSize());

        if (this._target instanceof SVGElement) {
            this._svg = d3.select(this._target);
        } else {
            var context = this;
            this._svg = d3.select(this._target).append("svg")
                .attr("width", this._size.width)
                .attr("height", this._size.height)
            ;
        }
        return this;
    };

    //  Properties  ---
    D3Widget.prototype.class = function (_) {
        if (!arguments.length) return this._class;
        this._class = _;
        return this;
    };

    D3Widget.prototype.data = function (_) {
        if (!arguments.length) return this._data;
        this._data = _;
        return this;
    };

    D3Widget.prototype.on = function (callbackID, callback) {
        this[callbackID] = callback;
        return this;
    };

    //  IE Helpers  ---    
    D3Widget.prototype._pushMarkers = function (element, d) {
        if (this.isIE) {
            element = element || this.svg;
            element.selectAll("path[marker-start],path[marker-end]")
                .attr("fixme-start", function (d) { return this.getAttribute("marker-start"); })
                .attr("fixme-end", function (d) { return this.getAttribute("marker-end"); })
                .attr("marker-start", null)
                .attr("marker-end", null)
            ;
        }
    };

    D3Widget.prototype._popMarkers = function (element, d) {
        if (this.isIE) {
            element = element || this.svg;
            element.selectAll("path[fixme-start],path[fixme-end]")
                .attr("marker-start", function (d) {
                    var x = this.getAttribute("fixme-start");
                    return this.getAttribute("fixme-start");
                })
                .attr("marker-end", function (d) { return this.getAttribute("fixme-end"); })
                .attr("fixme-start", null)
                .attr("fixme-end", null)
            ;
        }
    }

    D3Widget.prototype._popMarkersDebounced = Widget.prototype.debounce(function (element, d) {
        this._popMarkers(element, d);
    }, 250);

    D3Widget.prototype._fixIEMarkers = function (element, d) {
        if (this.isIE) {
            this._pushMarkers(element, d);
            this._popMarkersDebounced(element, d);
        }
    };

    return D3Widget;
}));
