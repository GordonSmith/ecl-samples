(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.GridBase = factory();
    }
}(this, function () {
    function GridBase() {
    };

    //  Inputs  ---
    GridBase.prototype.setData = function (vertices, edges, append) {
        console.log("setData");
    };

    //  Outputs  ---

    //  Events  ---
    GridBase.prototype.newSelection = function (from, to) {
    };

    GridBase.prototype.click = function (d, self) {
        console.log("click");
    };

    GridBase.prototype.dblclick = function (d, self) {
        console.log("dblclick");
    };

    GridBase.prototype.mouseover = function (d, self) {
        console.log("mouseover");
    };

    GridBase.prototype.mouseout = function (d, self) {
        console.log("mouseout");
    };

    return GridBase;
}));
