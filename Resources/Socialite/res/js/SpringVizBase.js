(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.SpringVizBase = factory();
    }
}(this, function () {
    function SpringVizBase() {
    };

    //  Inputs  ---
    SpringVizBase.prototype.setData = function (vertices, edges, append) {
        console.log("setData");
    };

    //  Outputs  ---

    //  Events  ---
    SpringVizBase.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    SpringVizBase.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    SpringVizBase.prototype.vertex_dblclick = function (d, self) {
        console.log("vertex_dblclick");
    };

    SpringVizBase.prototype.vertex_mouseover = function (d, self) {
        console.log("vertex_mouseover");
    };

    SpringVizBase.prototype.vertex_mouseout = function (d, self) {
        console.log("vertex_mouseout");
    };

    SpringVizBase.prototype.edge_click = function (d, self) {
        console.log("edge_click");
    };

    SpringVizBase.prototype.edge_dblclick = function (d, self) {
        console.log("edge_dblclick");
    };

    SpringVizBase.prototype.edge_mouseover = function (d, self) {
        console.log("edge_mouseover");
    };

    SpringVizBase.prototype.edge_mouseout = function (d, self) {
        console.log("edge_mouseout");
    };

    return SpringVizBase;
}));
