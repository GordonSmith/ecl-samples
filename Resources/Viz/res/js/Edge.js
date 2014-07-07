(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./D3Widget", "./IEdge", "./Entity", "lib/d3/d3"], factory);
    } else {
        root.Edge = factory(root.D3Widget, root.IEdge, root.Entity, root.d3);
    }
}(this, function (D3Widget, IEdge, Entity, d3) {
    function Edge(target) {
        D3Widget.call(this, target);
        IEdge.call(this);
    };
    Edge.prototype = Object.create(D3Widget.prototype);
    Edge.prototype.implements(IEdge.prototype);

    Edge.prototype.resize = function (width, height) {
        if (D3Widget.prototype.resize.call(this, width, height)) {
        }
    };

    Edge.prototype.render = function (layout) {
        var context = this;

        var elements = this._svg.selectAll("path").data([this._data], function (d) {
            return d.id;
        });

        var pathElements = elements;
        elements.enter().append("path")
            .each(create)
        ;
        function create(d) {
            var element = d3.select(this);
            if (d.__viz && d.__viz.footer) {
                element.attr("marker-start", "url(#" + d.__viz.footer + ")");
            }
            if (d.__viz && d.__viz.header) {
                element.attr("marker-end", "url(#" + d.__viz.header + ")");
            }
            if (d.label) {
                var labelElement = context._svg.append("g");
                context.__labelEntity = (new Entity())
                    .class(context._class + "Label")
                    .padding({ width: 8, height: 2 })
                    .data({ label: d.label })
                    .target(labelElement.node())
                    .render();
                ;
            }
        }
        var labelElement = context._svg.select("g");

        var points = [];
        if (layout) {
            points = layout.edge(this._data.id).points;
            this._svg.transition()
                .each("start", function (d) {
                    context._pushMarkers(d3.select(this), d);
                })
                .each("end", function (d) {
                    context._popMarkers(d3.select(this), d);
                })
            ;
            pathElements = pathElements.transition();
            if (labelElement) {
                labelElement = labelElement.transition();
            }
        } else {
            //context._pushMarkers(this._svg, this._data);
        }
        points = context._calculateEdgePoints(this.__source, this.__target, points);

        var line = d3.svg.line()
                .x(function (d) { return d.x; })
                .y(function (d) { return d.y; })
                .interpolate("bundle")
                .tension(0.75)
                (points)
        ;

        pathElements
            .attr("d", function (d) { return line; })
        ;
        if (!layout) {
            //context._popMarkersDebounced(this._svg, this._data);
        }

        if (labelElement) {
            var bbox = elements.node().getBBox();
            var point = this._findMidPoint(points);

            labelElement
                .attr("transform", function (d) { return 'translate(' + point.x + ',' + point.y + ')'; })
            ;
        }
        elements.exit().remove();
    };

    Edge.prototype._findMidPoint = function (points) {
        var midIdx = points.length / 2;
        if (points.length % 2) {
            return points[Math.floor(midIdx)];
        } else {
            var p0 = points[midIdx - 1];
            var p1 = points[midIdx];
            return { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
        }
    };

    Edge.prototype._intersectRect = function (rect, point) {
        var status = "";

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


    Edge.prototype._calculateEdgePoints = function (source, target, _points) {
        var points = _points ? _points.slice() : [];
        var p0 = points.length === 0 ? target : points[0];
        var p1 = points.length === 0 ? source : points[points.length - 1];

        points.unshift(this._intersectRect(source, p0));
        points.push(this._intersectRect(target, p1));

        if (points.length === 2) {
            var dx = points[0].x - points[1].x;
            var dy = points[0].y - points[1].y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            dx /= dist;
            dy /= dist;
            var midX = (points[0].x + points[1].x) / 2 - dist * dy / 8;
            var midY = (points[0].y + points[1].y) / 2 + dist * dx / 8;
            points = [{ x: points[0].x, y: points[0].y }, { x: midX, y: midY }, { x: points[1].x, y: points[1].y }];
        }

        return points;
    };

    return Edge;
}));
