(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./Graph", "lib/d3/d3",
            "lib/graphlib/graphlib",
            "lib/dagre/dagre"], factory);
    } else {
        root.HierarchicalGraph = factory(root.Graph, root.d3);
    }
}(this, function (Graph, d3) {
    function HierarchicalGraph(target, width, height) {
        Graph.call(this, target, width, height);

        this.version = "0.0.1";

        this.vertexPadding = {
            width: 16,
            height: 8
        };
    };
    HierarchicalGraph.prototype = Object.create(Graph.prototype);

    HierarchicalGraph.prototype.resize = function (width, height) {
        Graph.prototype.resize.call(this, width, height);
    };

    HierarchicalGraph.prototype._update = function () {
        this.layout = dagre.layout().run(this.graphData);
        Graph.prototype._update.call(this);
    };

    HierarchicalGraph.prototype._updateVertices = function () {
        var context = this;

        var svgNodes = this.svg.selectAll(".vertex")
            .data(this.nodeValues(), function (d) { return d.id; })
        ;

        //  Add new  ---
        var nodes = svgNodes.enter().append("g")
            .attr("class", "vertex")
            .each(init)
        ;
        function init(d) {
            var node = d3.select(this);
            context._appendLabel(node, d.__data.label, "vertexLabel", context.vertexPadding, d.__data.__icon);
            return node;
        }

        //  Update current  ---
        svgNodes.each(updatePos);
        function updatePos(d) {
            var pos = context.layout.node(d.id);
            var node = d3.select(this);

            return node
                .attr("transform", function (d) { return "translate(" + pos.x + "," + pos.y + ")"; })
            ;
        };

        //  Remove old  ---
        svgNodes.exit()
            .style('opacity', 0)
            .remove()
        ;

    };

    HierarchicalGraph.prototype._updateEdges = function () {
        var context = this;

        var svgEdgePaths = this.svg.selectAll(".edge")
            .data(this.edgeValues(), function (e) { return e.id; })
        ;

        //  Add new  ---
        var edges = svgEdgePaths.enter().append("g")
            .attr("class", "edge")
            .each(init)
        ;
        function init(d) {
            var node = d3.select(this);

            var edgePath = node.append("path");
            if (d.__data.__viz.footer) {
                edgePath.attr("marker-start", "url(#" + d.__data.__viz.footer + ")");
            }
            if (d.__data.__viz.header) {
                edgePath.attr("marker-end", "url(#" + d.__data.__viz.header + ")");
            }
            if (d.__data.label) {
                context._appendLabel(node, d.__data.label, "edgeLabel");
            }
        }

        //  Update current  ---
        svgEdgePaths.each(updatePos);
        function updatePos(d) {
            var node = d3.select(this);
            var source = context.layout.node(context.layout.incidentNodes(d.id)[0]);
            var target = context.layout.node(context.layout.incidentNodes(d.id)[1]);

            var pos = context.layout.edge(d.id);
            var points = context._calculateEdgePoints(source, target, pos.points);

            var line = d3.svg.line()
                  .x(function (d) { return d.x; })
                  .y(function (d) { return d.y; })
                  .interpolate("basis")
                  //.tension(0.095)
                  (points)
            ;

            var path = node.select("path")
                .attr("d", function (d) { return line; })
            ;

            if (d.__data.label) {
                var bbox = path.node().getBBox();
                var point = context._findMidPoint(points);

                node.select("g")
                    .attr("transform", function (d) { return 'translate(' + point.x + ',' + point.y + ')'; })
                ;
            }
        };

        //  Remove old  ---
        svgEdgePaths.exit()
            .remove()
        ;

        this._fixIEMarkers();
    };

    HierarchicalGraph.prototype.setData = function (vertices, edges, append) {
        Graph.prototype.setData.call(this, vertices, edges, append);
        var context = this;
        var nodes = this.graphData.eachNode(function (u, value) {
            var pos = context._calcTextSize(value.__data.label, "vertexLabel", context.vertexPadding);
            value.width = pos.w;
            value.height = pos.h;
        });
        this._update();
    };

    return HierarchicalGraph;
}));
