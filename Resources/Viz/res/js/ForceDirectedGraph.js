(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./Graph", "lib/d3/d3",
            "lib/graphlib/graphlib",
            "lib/dagre/dagre"], factory);
    } else {
        root.ForceDirectedGraph = factory(root.Graph, root.d3);
    }
}(this, function (Graph, d3) {
   
    function ForceDirectedGraph(target, width, height) {
        Graph.call(this, target, width, height);
    };
    ForceDirectedGraph.prototype = Object.create(Graph.prototype);

    ForceDirectedGraph.prototype.resize = function (width, height) {
        Graph.prototype.resize.call(this, width, height);
    };
    
    ForceDirectedGraph.prototype._update = function () {
        Graph.prototype._update.call(this);
    };

    ForceDirectedGraph.prototype.setData = function (vertices, edges, append) {
        Graph.prototype.setData.call(this, vertices, edges, append);
    };

    
    return ForceDirectedGraph;
}));
