(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["d3", "./IForceDirected", "./EntityIcon"], factory);
    } else {
        root.ForceDirected = factory(root.d3, root.IForceDirected, root.EntityIcon);
    }
}(this, function (d3, IForceDirected, EntityIcon) {
    function ForceDirected(target, width, height) {
        IForceDirected.call(this);

        this.version = "0.0.1";

        this.width = width;
        this.height = height;

        this.highlight = {
            zoom: 1.1,
            opacity: 0.33,
            transition: 500
        };

        this.icon = {
            diameter: 24,
            padding: 8
        };

        var context = this;
        this.entityIcon = new EntityIcon("circle", "person", true, 24, 24);
        this.entityIcon.click = function (icon, self) { context.vertex_click(icon, self); }
        this.entityIcon.dblclick = function (icon, self) { context.vertex_dblclick(icon, self); }
        this.entityIcon.mouseover = function (icon, self) { context.vertex_mouseover(icon, self); }
        this.entityIcon.mouseout = function (icon, self) { context.vertex_mouseout(icon, self); }

        this.vertexMeta = {
            categoryIcon: []
        };
        this.vertices = [];
        this.verticesCache = {};
        this.edges = [];
        this.edgesCache = {};

        //  Force  ---
        this.force = d3.layout.force()
            .charge(-400)
            .linkDistance(150)
            .size([this.width, this.height])
            .nodes(this.vertices)
            .links(this.edges)
            .on("tick", function (d) { return tick(d); })
        ;
        function tick() {
            context.svg.selectAll(".edge").attr("d", function (d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy) * 2;
                return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
            });
            context.svg.selectAll(".translateVertex").attr("transform", function (d) {
                if (d.fixed) {
                    d.x = d.px;
                    d.y = d.py;
                }
                d.px = d.x;
                d.py = d.y;
                return "translate(" + [d.x, d.y] + ")";
            });
        };

        //  Zoom  ---
        this.zoom = d3.behavior.zoom()
            .scaleExtent([0.2, 2])
            .on("zoom", zoom)
        ;
        function zoom() {
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
        this.svg = this._svg.append("g");
    };
    ForceDirected.prototype = Object.create(IForceDirected.prototype);

    //  Private  ---
    ForceDirected.prototype._update = function () {
        this._updateEdges();
        this._updateVertices();
        this.force.start();
    };

    ForceDirected.prototype._updateEdges = function () {
        var context = this;
        var edge = this.svg.selectAll(".edge").data(this.edges, function (d, index) { return d.id; });
        edge.enter().insert("path", ":first-child")
            .attr("class", "edge")
            .on("click", function (d) { context.edge_click(d, this); })
            .on("dblclick", function (d) { context.edge_dblclick(d, this); })
            .on("mouseover", function (d) { context.edge_mouseover(d, this); })
            .on("mouseout", function (d) { context.edge_mouseout(d, this); })
        ;
        edge.exit().remove();
    };

    ForceDirected.prototype._updateVertices = function () {
        var context = this;
        var vertex = context.svg.selectAll(".translateVertex").data(this.vertices, function (d) { return d.id; });
        vertex.call(this.entityIcon._update.bind(this.entityIcon))
            .call(this.force.drag)
        ;
        return;

        var translateVertex = vertex.enter().append("g")
            .attr("class", "translateVertex")
            .on("click", function (d) { context.vertex_click(d, this); })
            .on("dblclick", function (d) { context.vertex_dblclick(d, this); })
            .on("mouseover", function (d) { context.vertex_mouseover(d, this); })
            .on("mouseout", function (d) { context.vertex_mouseout(d, this); })
            .call(this.force.drag)
        ;
        var scaleVertex = translateVertex.append("g")
            .attr("class", function (d) { return "scaleVertex category" + d.category; })
        ;
        scaleVertex.append("rect")
            .attr("class", "labelRect")
        ;
        scaleVertex.append("circle")
            .attr("class", "circle")
            .attr("r", this.icon.diameter / 2)
        ;
        scaleVertex.append("title").text(function (d) {
            return d.name + " [" + d.id + "]";
        });
        var text = scaleVertex.append("text")
            .attr("class", "label")
            .style("text-anchor", "middle")
            .attr("dy", this.icon.diameter - 1)
            .text(function (d) {
                return d.name;
            })
        ;
        text.each(function () {
            var bbox = this.getBBox();
            d3.select(this.parentNode).select(".labelRect")
                .attr("x", bbox.x - 4)
                .attr("y", bbox.y - 2)
                .attr("width", bbox.width + 8)
                .attr("height", bbox.height + 2)
            ;
        });
        scaleVertex.append("image")
            .attr("class", "icon")
            .attr("xlink:href", function (d) {
                //  Unable to set SVG image via CSS  ---
                return context.vertexMeta.categoryIcon[d.category];
            })
            .attr("transform", function (d) {
                return "translate(-" + (context.icon.diameter - context.icon.padding) / 2 + ",-" + (context.icon.diameter - context.icon.padding) / 2 + ")";
            })
            .attr("width", this.icon.diameter - this.icon.padding)
            .attr("height", this.icon.diameter - this.icon.padding)
        ;
        vertex.exit().remove();
    };

    //  Meta  ---
    ForceDirected.prototype.setVertexMeta = function (meta) {
        this.vertexMeta = meta;
    };

    //  Widget  ---
    ForceDirected.prototype.resize = function (width, height) {
        if (this.width != width || this.height != height) {
            this.width = width;
            this.height = height;

            this.force
                .size([this.width, this.height])
            ;
            this._svg
                .attr("width", this.width)
                .attr("height", this.height)
            ;
            this._svg.select(".zoomLayer")
                .attr("width", this.width)
                .attr("height", this.height)
            ;
            this.force.start();
        }
    };

    //  Data  ---
    ForceDirected.prototype.setData = function (vertices, edges, append, pos) {
        if (!append) {
            this.vertices.length = 0;
            this.verticesCache = {};
            this.edges.length = 0;
            this.edgesCache = {};
        }
        if (!pos) {
            pos = {
                x: this.width / 2,
                y: this.width / 2
            }
        }
        pos.r = 100;
        for (var i = 0; i < vertices.length; ++i) {
            var item = vertices[i];
            if (!this.verticesCache[item.id]) {
                this.verticesCache[item.id] = item;
                this.vertices.push(item);

                //  Initial Positions  ---
                if (!item.x || !item.y) {
                    var x = (i * 2 * pos.r / vertices.length) - pos.r;
                    var y = Math.sqrt(pos.r * pos.r - x * x) + 0.5;
                    item.x = pos.x + x;
                    item.y = pos.y + (i % 2 ? y : -y);
                }
            }
        }
        for (var i = 0; i < edges.length; ++i) {
            var item = edges[i];
            var source = item.source;
            var target = item.target;
            if (source !== target) {
                item.source = this.verticesCache[source];
                item.target = this.verticesCache[target];
                item.id = item.source.id + "-" + item.target.id;
                if (!this.edgesCache[item.id]) {
                    this.edgesCache[item.id] = item;
                    this.edges.push(item);
                }
            }
        }
        this._update();
    };

    ForceDirected.prototype.removeVertex = function (id) {
        for (var i = 0; i < this.vertices.length; ++i) {
            if (this.vertices[i].id === id) {
                this.vertices.splice(i, 1);
                delete this.verticesCache[id];
                break;
            }
        }
        for (var i = 0; i < this.edges.length; ++i) {
            if (this.edges[i].source.id === id || this.edges[i].target.id === id) {
                delete this.edgesCache[this.edges[i].id];
                this.edges.splice(i, 1);
                --i;
            }
        }
        this._update();
    }

    ForceDirected.prototype.highlightVertex = function (d) {
        //  Causes issues in IE  ---
        //  self.parentNode.appendChild(self);
        var zoomScale = this.zoom.scale();
        if (zoomScale > 1)
            zoomScale = 1;

        var context = this;
        neighboring = function (a, b) {
            return context.edgesCache[a.id + "-" + b.id] || context.edgesCache[b.id + "-" + a.id];
        };
        d3.selectAll(".scaleVertex").transition().duration(context.highlight.transition)
            .style("opacity", function (o) {
                if (!d || d.id === o.id || neighboring(d, o)) {
                    return 1;
                }
                return context.highlight.opacity;
            })
            .attr("transform", function (o) {
                if (d && (d.id === o.id || neighboring(d, o))) {
                    return "scale(" + context.highlight.zoom / zoomScale + ")";
                }
                return "scale(1)";
            })
        ;
        d3.selectAll(".edge")
            .classed("edge-active", function (o) {
                return d && (o.source.id === d.id || o.target.id === d.id) ? true : false;
            })
        ;
    };

    ForceDirected.prototype.highlightEdge = function (d, self) {
        //  Causes issues in IE  ---
        //  self.parentNode.appendChild(self);
        var zoomScale = this.zoom.scale();
        if (zoomScale > 1)
            zoomScale = 1;

        var context = this;
        d3.selectAll(".scaleVertex").transition().duration(context.highlight.transition)
            .style("opacity", function (o) {
                if (!d || d.source.id === o.id || d.target.id === o.id) {
                    return 1;
                }
                return context.highlight.opacity;
            })
            .attr("transform", function (o) {
                if (d && (d.source.id === o.id || d.target.id === o.id)) {
                    return "scale(" + context.highlight.zoom / zoomScale + ")";
                }
                return "scale(1)";
            })
        ;
        d3.selectAll(".edge")
            .classed("edge-active", function (o) {
                return d && (d.id === o.id) ? true : false;
            })
        ;
    };

    ForceDirected.prototype.vertex_mouseover = function (d, self) {
        this.highlightVertex(d, self);
    };

    ForceDirected.prototype.vertex_mouseout = function (d, self) {
        this.highlightVertex(null);
    };

    ForceDirected.prototype.edge_mouseover = function (d, self) {
        this.highlightEdge(d, self);
    };

    ForceDirected.prototype.edge_mouseout = function (d, self) {
        this.highlightEdge(null);
    };

    return ForceDirected;
}));
