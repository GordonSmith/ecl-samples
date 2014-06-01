(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.BarChartBase = factory();
    }
}(this, function () {
    function BarChartBase() {
    };

    //  Inputs  ---
    BarChartBase.prototype.setData = function (vertices, edges, append) {
        console.log("setData");
    };

    //  Outputs  ---

    //  Events  ---
    BarChartBase.prototype.newSelection = function (from, to) {
    };

    BarChartBase.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    BarChartBase.prototype.vertex_dblclick = function (d, self) {
        console.log("vertex_dblclick");
    };

    BarChartBase.prototype.vertex_mouseover = function (d, self) {
        console.log("vertex_mouseover");
    };

    BarChartBase.prototype.vertex_mouseout = function (d, self) {
        console.log("vertex_mouseout");
    };

    BarChartBase.prototype.edge_click = function (d, self) {
        console.log("edge_click");
    };

    BarChartBase.prototype.edge_dblclick = function (d, self) {
        console.log("edge_dblclick");
    };

    BarChartBase.prototype.edge_mouseover = function (d, self) {
        console.log("edge_mouseover");
    };

    BarChartBase.prototype.edge_mouseout = function (d, self) {
        console.log("edge_mouseout");
    };

    return BarChartBase;
}));
