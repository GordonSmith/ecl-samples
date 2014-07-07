(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.IGraph = factory();
    }
}(this, function () {
    function IGraph() {
    };

    IGraph.prototype.target = function () {
        console.log("target");
    };

    IGraph.prototype.render = function () {
        console.log("render");
    };

    IGraph.prototype.data = function (data) {
        console.log("data");
    };


    //  API  ---
    //  vertices: [{id: 007, label: "James Bond", __viz: {icons: "\uf013"}}]
    //  edges: [{id: 007, source: 007, target: 007, __viz: {header: "arrowHead", footer: "circleFoot"}}]
    //  merge:  true, false
    IGraph.prototype.setData = function (vertices, edges, merge) {
        console.log("setData");
    };
    
    //  Mode:  Hierarchy, ForceDirected, , ForceDirected2, Circle
    IGraph.prototype.doLayout = function (mode) {
        console.log("doLayout");
    };
  
    //  Events  ---
    IGraph.prototype.vertex_click = function (element, d) {
        console.log("vertex_click");
    };

    IGraph.prototype.vertex_click = function (element, d) {
        console.log("vertex_click");
    };

    IGraph.prototype.vertex_dblclick = function (element, d) {
        console.log("vertex_dblclick");
    };

    IGraph.prototype.vertex_mouseover = function (element, d) {
        console.log("vertex_mouseover");
    };

    IGraph.prototype.vertex_mouseout = function (element, d) {
        console.log("vertex_mouseout");
    };

    IGraph.prototype.edge_click = function (element, d) {
        console.log("edge_click");
    };

    IGraph.prototype.edge_dblclick = function (element, d) {
        console.log("edge_dblclick");
    };

    IGraph.prototype.edge_mouseover = function (element, d) {
        console.log("edge_mouseover");
    };

    IGraph.prototype.edge_mouseout = function (element, d) {
        console.log("edge_mouseout");
    };

    return IGraph;
}));
