(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.IGraph = factory();
    }
}(this, function () {
    function IGraph() {
    };

    //  Inputs  ---
    IGraph.prototype.setData = function (vertices, edges, append) {
        console.log("setData");
    };

    //  Outputs  ---

    //  Events  ---
    IGraph.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    IGraph.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    IGraph.prototype.vertex_dblclick = function (d, self) {
        console.log("vertex_dblclick");
    };

    IGraph.prototype.vertex_mouseover = function (d, self) {
        console.log("vertex_mouseover");
    };

    IGraph.prototype.vertex_mouseout = function (d, self) {
        console.log("vertex_mouseout");
    };

    IGraph.prototype.edge_click = function (d, self) {
        console.log("edge_click");
    };

    IGraph.prototype.edge_dblclick = function (d, self) {
        console.log("edge_dblclick");
    };

    IGraph.prototype.edge_mouseover = function (d, self) {
        console.log("edge_mouseover");
    };

    IGraph.prototype.edge_mouseout = function (d, self) {
        console.log("edge_mouseout");
    };

    return IGraph;
}));
