(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./IGraph", "d3",
            "lib/graphlib/graphlib",
            "lib/dagre/dagre"], factory);
    } else {
        root.Graph = factory(root.IGraph, root.d3);
    }
}(this, function (IGraph, d3) {
    function Graph(target, width, height) {
        IGraph.call(this);

        this.version = "0.0.1";

        this.nodePadding = {
            width: 16,
            height: 8
        };
        this.width = width;
        this.height = height;

        this.graphData = new dagre.Digraph();
        var context = this;

        //  Zoom  ---
        this.zoom = d3.behavior.zoom()
            .scaleExtent([0.2, 2])
            .on("zoom", zoom)
        ;
        function zoom() {
            context._addMarker(true); //  IE Bug Workaround  (Arrow Heads) ---
            context.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        //  SVG  ---
        this._svg = d3.select(target).append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
        ;
        this._svg.append("rect")
            .attr("class", "zoomLayer")
            .attr("width", this.width)
            .attr("height", this.height)
            .call(this.zoom)
        ;

        this.defs = this._svg.append("defs");
        this._addMarker();
        this.svg = this._svg.append("g");
    };
    Graph.prototype = Object.create(IGraph.prototype);

    Graph.prototype.resize = function (width, height) {
        if (this.width != width || this.height != height) {
            this.width = width;
            this.height = height;

            this._svg
                .attr("width", this.width)
                .attr("height", this.height)
            ;
        }
    };

    Graph.prototype._update = function () {
        this.layout = dagre.layout().run(this.graphData);
        this._updateVertices();
        this._updateEdges();
    };

    Graph.prototype._updateVertices = function () {
        var context = this;

        var svgNodes = this.svg
            .selectAll(".node")
            .data(this.graphData.nodes(), function (d) { return d; })
        ;

        //  Add new  ---
        var nodes = svgNodes.enter().append("g")
            .attr("class", "node")
            .each(init)
        ;
        function init(d) {
            var obj = context.graphData.node(d);
            var pos = context.layout.node(d);
            var node = d3.select(this);
            node.append("rect")
                .attr("x", function (d) { return -pos.width / 2; })
                .attr("y", function (d) { return -pos.height / 2; })
                .attr("width", function (d) { return pos.width; })
                .attr("height", function (d) { return pos.height; })
            ;
            context._appendLabel(node, obj.data.label);
            return node;
        }

        //  Update current  ---
        svgNodes.each(updatePos);
        function updatePos(d) {
            var pos = context.layout.node(d);

            return d3.select(this)
                .attr("transform", function (d) { return "translate(" + pos.x + "," + pos.y + ")"; })
            ;
        };

        //  Remove old  ---
        svgNodes.exit().remove();
    };

    Graph.prototype._updateEdges = function () {
        var context = this;
        this._addMarker(true); //  IE Bug Workaround  (Arrow Heads) ---

        var svgEdgePaths = this.svg
            .selectAll(".edge")
            .data(this.graphData.edges(), function (e) { return e; })
        ;

        //  Add new  ---
        var edges = svgEdgePaths.enter().append("g")
            .attr("class", "edge")
            .each(init)
        ;
        function init(d) {
            var obj = context.graphData.edge(d);
            var edge = d3.select(this);
            var edgePath = edge.append("path");
            if (obj.data.__viz.footer) {
                edgePath.attr("marker-start", "url(#" + obj.data.__viz.footer + ")");
            }
            if (obj.data.__viz.header) {
                edgePath.attr("marker-end", "url(#" + obj.data.__viz.header + ")");
            }
            if (obj.data.label) {
                var edgeLabel = edge.append("g");
                context._appendLabel(edgeLabel, obj.data.label);
            }
        }

        //  Update current  ---
        svgEdgePaths.each(updatePos);
        function updatePos(d) {
            var obj = context.graphData.edge(d);
            var pos = context.layout.edge(d);

            function calculateEdgePoints(e) {
                var value = context.layout.edge(e);
                var source = context.layout.node(context.layout.incidentNodes(e)[0]);
                var target = context.layout.node(context.layout.incidentNodes(e)[1]);
                var points = value.points.slice();

                var p0 = points.length === 0 ? target : points[0];
                var p1 = points.length === 0 ? source : points[points.length - 1];

                points.unshift(context._intersectRect(source, p0));
                // TODO: use bpodgursky"s shortening algorithm here
                points.push(context._intersectRect(target, p1));
                return points;
            }

            var points = calculateEdgePoints(d);
            var line = d3.svg.line()
                  .x(function (d) { return d.x; })
                  .y(function (d) { return d.y; })
                  .interpolate("basis")
                  //.tension(0.095)
                  (points)
            ;

            var path = d3.select(this).select("path")
                .attr("d", function (d) { return line; })
            ;

            if (obj.data.label) {
                var bbox = path.node().getBBox();
                var point = context._findMidPoint(points);

                d3.select(this).select("g")
                    .attr("transform", function (d) { return 'translate(' + point.x + ',' + point.y + ')'; })
                ;
            }
        };

        //  Remove old  ---
        svgEdgePaths.exit().remove();
    };

    Graph.prototype.setData = function (vertices, edges, append, pos) {
        if (!append) {
            this.graphData = new dagre.Digraph();
        }
        for (var i = 0; i < vertices.length; ++i) {
            var item = vertices[i];
            var pos = this._calcTextSize(item.label, "label");
            this.graphData.addNode(item.id, {
                data: item,
                width: pos.w + this.nodePadding.width,
                height: pos.h + this.nodePadding.height
            });
        }
        for (var i = 0; i < edges.length; ++i) {
            var item = edges[i];
            var pos = this._calcTextSize(item.label, "label");
            this.graphData.addEdge(null, item.source, item.target, {
                data: item,
                width: pos.w,
                height: pos.h
            });
        }
        this._update();
    };

    Graph.prototype._addMarker = function (clearFirst) {
        if (clearFirst) {
            this.defs.select("#arrowHead").remove();
            this.defs.select("#circleFoot").remove();
            this.defs.select("#circleHead").remove();
        }
        this.defs.append("marker")
            .attr("class", "marker")
            .attr("id", "arrowHead")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 10)
            .attr("refY", 5)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("markerUnits", "strokeWidth")
            .attr("orient", "auto")
            .append("polyline")
                .attr("points", "0,0 10,5 0,10 1,5");
        ;
        this.defs.append("marker")
            .attr("class", "marker")
            .attr("id", "circleFoot")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 1)
            .attr("refY", 5)
            .attr("markerWidth", 7)
            .attr("markerHeight", 7)
            .attr("markerUnits", "strokeWidth")
            .attr("orient", "auto")
            .append("circle")
                .attr("cx", 5)
                .attr("cy", 5)
                .attr("r", 4)
        ;
        this.defs.append("marker")
            .attr("class", "marker")
            .attr("id", "circleHead")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 9)
            .attr("refY", 5)
            .attr("markerWidth", 7)
            .attr("markerHeight", 7)
            .attr("markerUnits", "strokeWidth")
            .attr("orient", "auto")
            .append("circle")
                .attr("cx", 5)
                .attr("cy", 5)
                .attr("r", 4)
        ;
    },

    Graph.prototype._calcTextSize = function (text, _class) {
        var retVal = {
            w: 0,
            h: 0
        };
        if (!text)
            return retVal;

        var tmpNode = this.defs.append("g")
            .attr("id", "calcTextSize")
        ;

        var label = this._appendLabel(tmpNode, text);
        var bbox = label.node().getBBox();
        retVal.w = bbox.width;
        retVal.h = bbox.height;

        this.defs.select("#calcTextSize").remove();
        return retVal
    },

    Graph.prototype._appendLabel = function (node, label) {
        var textNode = node.append("text")
            .attr("class", "label")
            .style("text-anchor", "middle")
        ;
        var textParts = label.split("\n");
        for (var i = 0; i < textParts.length; ++i) {
            textNode.append("tspan")
                .attr("dy", "1em")
                .attr("x", "1")
                .text(textParts[i])
            ;
        }
        var bbox = textNode.node().getBBox();
        textNode
            .attr("transform", function (d) { return "translate(0," + ((-bbox.height / 2) - 1) + ")"; })
        ;
        return textNode;
    };

    Graph.prototype._findMidPoint = function (points) {
        var midIdx = points.length / 2;
        if (points.length % 2) {
            return points[Math.floor(midIdx)];
        } else {
            var p0 = points[midIdx - 1];
            var p1 = points[midIdx];
            return { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        }
    };

    Graph.prototype._intersectRect = function (rect, point) {
        var x = rect.x;
        var y = rect.y;

        // For now we only support rectangles

        // Rectangle intersection algorithm from:
        // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
        var dx = point.x - x;
        var dy = point.y - y;
        var w = rect.width / 2;
        var h = rect.height / 2;

        var sx, sy;
        if (Math.abs(dy) * w > Math.abs(dx) * h) {
            // Intersection is top or bottom of rect.
            if (dy < 0) {
                h = -h;
            }
            sx = dy === 0 ? 0 : h * dx / dy;
            sy = h;
        } else {
            // Intersection is left or right of rect.
            if (dx < 0) {
                w = -w;
            }
            sx = w;
            sy = dx === 0 ? 0 : w * dy / dx;
        }

        return { x: x + sx, y: y + sy };
    };

    return Graph;
}));
