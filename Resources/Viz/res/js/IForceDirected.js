(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.IForceDirected = factory();
    }
}(this, function () {
    function IForceDirected() {
    };

    //  Inputs  ---
    IForceDirected.prototype.setData = function (vertices, edges, append) {
        console.log("setData");
    };

    //  Outputs  ---

    //  Events  ---
    IForceDirected.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    IForceDirected.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    IForceDirected.prototype.vertex_dblclick = function (d, self) {
        console.log("vertex_dblclick");
    };

    IForceDirected.prototype.vertex_mouseover = function (d, self) {
        console.log("vertex_mouseover");
    };

    IForceDirected.prototype.vertex_mouseout = function (d, self) {
        console.log("vertex_mouseout");
    };

    IForceDirected.prototype.edge_click = function (d, self) {
        console.log("edge_click");
    };

    IForceDirected.prototype.edge_dblclick = function (d, self) {
        console.log("edge_dblclick");
    };

    IForceDirected.prototype.edge_mouseover = function (d, self) {
        console.log("edge_mouseover");
    };

    IForceDirected.prototype.edge_mouseout = function (d, self) {
        console.log("edge_mouseout");
    };

    return IForceDirected;
}));
