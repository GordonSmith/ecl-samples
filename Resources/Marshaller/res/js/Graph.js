(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./D3Widget", "./IGraph", "./Entity", "./GraphData", "./GraphLayouts",
            "d3/d3"], factory);
    } else {
        root.Graph = factory(root.D3Widget, root.IGraph, root.Entity, root.GraphData, root.GraphLayouts, root.d3);
    }
}(this, function (D3Widget, IGraph, Entity, GraphData, GraphLayouts, d3) {
    function Graph(target) {
        D3Widget.call(this, target);
        IGraph.call(this);

        this.graphData = new GraphData();

        var context = this;

        //  Meta  ---
        this.highlight = {
            zoom: 1.1,
            opacity: 0.33,
            transition: 500
        };

        //  Zoom  ---
        this.zoom = d3.behavior.zoom()
            .scaleExtent([0.2, 4])
            .on("zoom", zoom)
        ;
        var prevScale = 1;
        function zoom() {
            context.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

            //  IE Bug Workaround  (Arrow Heads) ---
            if (prevScale !== d3.event.scale) {
                context._fixIEMarkers();
                prevScale = d3.event.scale;
            }
        }
        
        //  Drag  ---
        this.drag = d3.behavior.drag()
            .origin(function(d) { 
                return d; 
            })
            .on("dragstart", dragstart)
            .on("dragend", dragend)
            .on("drag", drag)
        ;
        function dragstart(d) {
            context.svgE.selectAll(".edge")
                .filter(function (e) { return e.source.id === d.id || e.target.id === d.id; })
                .each(function (e) {
                    context._pushMarkers(d3.select(this), e);
                })
            ;
        }
        function dragend(d) {
            context.svgE.selectAll(".edge")
                .filter(function (e) { return e.source.id === d.id || e.target.id === d.id; })
                .each(function (e) {
                    context._popMarkers(d3.select(this), e);
                })
            ;
        }
        function drag(d) {
            var element = d3.select(this);
            //element.node().parentNode.appendChild(element.node());
            d.px = d.x = d3.event.x;
            d.py = d.y = d3.event.y;
            context.renderVertex(d3.select(this), d);
            context.svgE.selectAll(".edge")
                .filter(function (e) { return e.source.id === d.id || e.target.id === d.id; })
                .each(function (e) {
                    context.renderEdge(d3.select(this), e);
                })
            ;
        }
        
        //  Force  ---
        this.force = d3.layout.force()
            .charge(-800)
            .linkDistance(300)
            .size([this._size.width, this._size.height])
            .on("start", function (d) { context._pushMarkers(); })
            .on("end", function (d) { context._popMarkers(); })
            .on("tick", function (d) {
                context.svgV.selectAll(".vertex")
                    .each(function (d) { context.renderVertex(d3.select(this), d); })
                ;
                context.svgE.selectAll(".edge")
                    .each(function(d) { context.renderEdge(d3.select(this), d); })
                ;
            })
        ;

        //  SVG  ---
        this._svgZoom = this._svg.append("rect")
            .attr("class", "zoomLayer")
            .attr("width", this._size.width)
            .attr("height", this._size.height)
            .call(this.zoom)
        ;

        this.defs = this._svg.append("defs");
        this._addMarker();
        this.svg = this._svg.append("g");
        this.svgE = this.svg.append("g");
        this.svgV = this.svg.append("g");
    };
    Graph.prototype = Object.create(D3Widget.prototype);
    Graph.prototype.implements(IGraph.prototype);

    Graph.prototype.resize = function (width, height) {
        if (D3Widget.prototype.resize.call(this, width, height)) {
            this._svgZoom
                .attr("width", this._size.width)
                .attr("height", this._size.height)
            ;
        }
    };

    Graph.prototype.render = function () {
        var context = this;
        this.force.stop();
        this.layout = null;

        if (!this._data.merge) {
            this.graphData = new GraphData();
            this.renderAll();
        }
        var vertices = this._data.vertices.map(function (item) {
            return item;
            return (new Entity.Vertex())
                .class("vertexLabel")
                .data(item)
                .on("click", function (element, d) { context.vertex_click(d3.select(element.node().parentNode), d.data()); })
                .on("dblclick", function (element, d) { context.vertex_dblclick(d3.select(element.node().parentNode), d.data()); })
                .on("mouseover", function (element, d) {
                    Entity.Vertex.prototype.mouseover.call(this, element, d);
                    context.vertex_mouseover(d3.select(element.node().parentNode), d.data());
                })
                .on("mouseout", function (element, d) { context.vertex_mouseout(d3.select(element.node().parentNode), d.data()); })
            ;
        });
        var edges = this._data.edges.map(function (item) {
            return (new Entity.Edge())
                .class("edgePath")
                .data(item)
            ;
        });
        var data = this.graphData.setData(vertices, edges, this._data.merge);
        data.addedVertices.forEach(function (item) {
            item.x = context._size.width / 2 + Math.random() * 10 / 2 - 5;
            item.y = context._size.height / 2 + Math.random() * 10 / 2 - 5;
        })

        this.force
            .nodes(this.graphData.nodeValues())
            .links(this.graphData.edgeValues())
        ;
        this.renderAll();
        this.doLayout(this.layoutMode);
    };

    Graph.prototype.renderAll = function () {
        this.renderVertices();
        this.renderEdges();
    };

    Graph.prototype.renderVertices = function () {
        var context = this;

        var svgNodes = this.svgV.selectAll(".vertex")
            .data(this.graphData.nodeValues(), function (d) { return d.id; })
        ;

        //  Add new  ---
        var nodes = svgNodes.enter().append("g")
            .attr("class", "vertex")
            .call(this.drag)
            .each(function (d) {
                d.__entity
                    .target(this)
                    .render()
                ;
                //d.width = d.__entity.width;//TODO Remove from here
                //d.height = d.__entity.height;//TODO Remove from here
            })
        ;

        //  Update current  ---
        svgNodes.each(function(d) {
            context.renderVertex(d3.select(this), d);
        });

        //  Remove old  ---
        svgNodes.exit().transition()
            .style("opacity", "0")
            .remove()
        ;
    };
    
    Graph.prototype.renderVertex = function (element, d) {
        if (this.layout) {
            var pos = this.layout.node(d.id);
            d.px = d.x = pos.x;
            d.py = d.y = pos.y;
            element = element.transition();
        } else {
            if (d.fixed) {
                d.x = d.px;
                d.y = d.py;
            }
            d.px = d.x;
            d.py = d.y;
        }
        
        return element
            .attr("transform", function (d) { return "translate(" + [d.x, d.y] + ")"; })
        ;            
    };    

    Graph.prototype.renderEdges = function () {
        var context = this;

        var svgEdgePaths = this.svgE.selectAll(".edge")
            .data(this.graphData.edgeValues(), function (e) { return e.id; })
        ;

        //  Add new  ---
        svgEdgePaths.enter().append("g")
            .attr("class", "edge")
            .each(create)
        ;
        function create(d) {
            d.__edge
                .target(this)
                .render()
            ;
        }
        //  Update current  ---
        svgEdgePaths.each(function(d) {
            context.renderEdge(d3.select(this), d);
        });

        //  Remove old  ---
        svgEdgePaths.exit()
           .remove()
        ;
    };
    
    Graph.prototype.renderEdge = function(element, d) {
        d.__edge
            .layout(this.layout)
            .render()
        ;
        //element.call(this.Edge);
    };

    //  Layouts  ---
    Graph.prototype.doLayout = function (mode) {
        switch (mode) {
            case "Circle":
                this.layoutCircle();
                break;
            case "ForceDirected":
                this.layoutForceDirected();
                break;
            case "ForceDirected2":
                this.layoutForceDirected2();
                break;
            case "Hierarchy":
                this.layoutHierarchy();
                break;
            default:
                this.renderAll();
                break;
        }
    };

    Graph.prototype.layoutCircle = function () {
        this.layoutMode = "Circle";
        this.force.stop();
        this.layout = new GraphLayouts.Circle(this.graphData, this._size.width, this._size.height);
        this.renderAll();
        this.layout = null;
    };

    Graph.prototype.layoutForceDirected = function () {
        this.layoutMode = "ForceDirected";
        this.layout = null;
        this.force
            .size([this._size.width, this._size.height])
            .start()
        ;
    };

    Graph.prototype.layoutForceDirected2 = function () {
        this.layoutMode = "ForceDirected2";
        this.force.stop();
        this.layout = new GraphLayouts.ForceDirected(this.graphData, this._size.width, this._size.height);
        this.renderAll();
        this.layout = null;
    };
    
    Graph.prototype.layoutHierarchy = function () {
        this.layoutMode = "Hierarchy";
        this.force.stop();
        this.layout = new GraphLayouts.Hierarchy(this.graphData, this._size.width, this._size.height);
        this.renderAll();
        this.layout = null;
    };

    //  Highlighters  ---
    Graph.prototype.highlightVertex = function (element, d) {
        //  Causes issues in IE  ---
        var zoomScale = this.zoom.scale();
        if (zoomScale > 1)
            zoomScale = 1;

        var context = this;
        var highlightVertices = {};
        var highlightEdges = {};
        if (d) {
            var edges = this.graphData.incidentEdges(d.id);
            for (var i = 0; i < edges.length; ++i) {
                var edge = this.graphData.edge(edges[i]);
                highlightEdges[edge.id] = true;
                highlightVertices[edge.source.id] = true;
                highlightVertices[edge.target.id] = true;
            }
        }

        var vertexElements = this.svgV.selectAll(".vertex");
        vertexElements.transition().duration(this.highlight.transition)
            .each("end", function (d) {
                if (element) {
                    element.node().parentNode.appendChild(element.node());
                }
            })
            .style("opacity", function (o) {
                if (!d || highlightVertices[o.id]) {
                    return 1;
                }
                return context.highlight.opacity;
            })
        ;
        vertexElements.select(".vertexLabelXXX").transition().duration(this.highlight.transition)
            .attr("transform", function (o) {
                if (d && highlightVertices[o.id]) {
                    return "scale(" + context.highlight.zoom / zoomScale + ")";
                }
                return "scale(1)";
            })
        ;
        d3.selectAll(".edge")
            .classed("edge-active", function (o) {
                return (d && highlightEdges[o.id]) ? true : false;
            }).transition().duration(this.highlight.transition)
            .style("opacity", function (o) {
                if (!d || highlightEdges[o.id]) {
                    return 1;
                }
                return context.highlight.opacity;
            })
        ;
    };

    //  Events  ---
    Graph.prototype.vertex_click = function (element, d) {
        IGraph.prototype.vertex_click.call(this, element, d);
        element.node().parentNode.appendChild(element.node());
    };

    Graph.prototype.vertex_mouseover = function (element, d) {
        this.highlightVertex(element, d);
    };

    Graph.prototype.vertex_mouseout = function (d, self) {
        this.highlightVertex(null, null);
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
    };

    return Graph;
}));
