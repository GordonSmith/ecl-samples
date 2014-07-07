(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.IHierarchicalGraph = factory();
    }
}(this, function () {
    function IHierarchicalGraph() {
    };

    //  Inputs  ---
    IHierarchicalGraph.prototype.setData = function (vertices, edges, append) {
        console.log("setData");
    };

    //  Outputs  ---

    //  Events  ---
    IHierarchicalGraph.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    IHierarchicalGraph.prototype.vertex_click = function (d, self) {
        console.log("vertex_click");
    };

    IHierarchicalGraph.prototype.vertex_dblclick = function (d, self) {
        console.log("vertex_dblclick");
    };

    IHierarchicalGraph.prototype.vertex_mouseover = function (d, self) {
        console.log("vertex_mouseover");
    };

    IHierarchicalGraph.prototype.vertex_mouseout = function (d, self) {
        console.log("vertex_mouseout");
    };

    IHierarchicalGraph.prototype.edge_click = function (d, self) {
        console.log("edge_click");
    };

    IHierarchicalGraph.prototype.edge_dblclick = function (d, self) {
        console.log("edge_dblclick");
    };

    IHierarchicalGraph.prototype.edge_mouseover = function (d, self) {
        console.log("edge_mouseover");
    };

    IHierarchicalGraph.prototype.edge_mouseout = function (d, self) {
        console.log("edge_mouseout");
    };

    return IHierarchicalGraph;
}));
