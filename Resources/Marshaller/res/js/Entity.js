(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./D3Widget", "./IEntity", "./IEdge", "d3/d3"], factory);
    } else {
        root.Entity = factory(root.D3Widget, root.IEntity, root.IEdge, root.d3);
    }
}(this, function (D3Widget, IEntity, IEdge, d3) {
    function FAIcon(target) {
        D3Widget.call(this, target);
        this._class = "FAIcon";
        this._icon = "";
        this._shape = "";
        this._label = "";
        this._fontSize = 0;
    };
    FAIcon.prototype = Object.create(D3Widget.prototype);

    FAIcon.prototype.id = function (_) {
        if (!arguments.length) return this._id;
        this._id = _;
        return this;
    };

    FAIcon.prototype.fontSize = function (_) {
        if (!arguments.length) return this._fontSize;
        this._fontSize = _;
        return this;
    };

    FAIcon.prototype.icon = function (_) {
        if (!arguments.length) return this._icon;
        this._icon = _;
        return this;
    };

    FAIcon.prototype.shape = function (_) {
        if (!arguments.length) return this._shape;
        this._shape = _;
        return this;
    };

    FAIcon.prototype.label = function (_) {
        if (!arguments.length) return this._label;
        this._label = _;
        return this;
    };

    FAIcon.prototype.enter = function (domNode, element, d) {
        var context = this;
        element
            .on("click", function (d) { context.click(d3.select(this), d); })
        ;
        if (!d._fontSize) {
            var style = window.getComputedStyle(domNode, null);
            d._fontSize = parseInt(style.fontSize);
        }
        if (d._shape) {
            element.append("circle")
                .attr("class", d._class + "Shape")
            ;
        }
        element.append("text")
            .attr("class", d._class + "Icon")
            .attr("font-family", "FontAwesome")
            .attr("text-anchor", "middle")
            .attr("font-size", d._fontSize)
            .attr("x", 0)
            .attr("y", d._fontSize / 3) //  Aproximation for font "drop" offset
        ;
        return element;
    };

    FAIcon.prototype.update = function (domNode, element, d) {
        element
            .attr("transform", function (d) { return "translate(" + d._pos.x + " " + d._pos.y + ")"; })
        ;
        element.select("." + d._class + "Shape")
            .attr("r", d._fontSize - 1);
        ;
        element.select("." + d._class + "Icon")
            .text(d._icon)
        ;
        return element;
    };

    FAIcon.prototype.click = function (element, d) {
    };

    function TextBox(target) {
        D3Widget.call(this, target);
        this._class = "TextBox";
        this._shape = "rect";
        this._text = "";
        this._padding = {
            width: 8,
            height: 2
        };
    };
    TextBox.prototype = Object.create(D3Widget.prototype);

    TextBox.prototype.id = function (_) {
        if (!arguments.length) return this._id;
        this._id = _;
        return this;
    };

    TextBox.prototype.shape = function (_) {
        if (!arguments.length) return this._shape;
        this._shape = _;
        return this;
    };

    TextBox.prototype.text = function (_) {
        if (!arguments.length) return this._text;
        this._text = _;
        return this;
    };

    TextBox.prototype.enter = function (domNode, element, d) {
        element.append("rect")
            .attr("class", d._class + "Rect")
        ;
        element.append("text")
            .attr("class", d._class + "Text")
            .style("text-anchor", "middle")
        ;
    };

    TextBox.prototype.update = function (domNode, element, d) {
        var textNode = element.select("." + d._class + "Text")

        var textParts = d._text.split("\n");
        var textLine = textNode.selectAll("tspan").data(textParts, function (d) { return d; });
        textLine.enter().append("tspan")
            .attr("dy", "1em")
            .attr("x", "0")
        ;
        textLine
            .text(function (d) { return d; })
        ;
        textLine.exit()
            .remove()
        ;

        var bbox = textNode.node().getBBox();
        var w = bbox.width + d._padding.width;
        var h = bbox.height + d._padding.height;

        var rectNode = element.select("." + d._class + "Rect")
        rectNode
            .attr("x", function (d) { return -w / 2; })
            .attr("y", function (d) { return -h / 2; })
            .attr("width", function (d) { return w; })
            .attr("height", function (d) { return h; })
        ;
        textNode
            .attr("transform", function (d) { return "translate(0," + ((-bbox.height / 2)) + ")"; })
        ;
    };

    function Actions(target) {
        D3Widget.call(this, target);
        this._class = "Actions";
        this._actions = [];
        this._fontSize = 12;
    };
    Actions.prototype = Object.create(D3Widget.prototype);

    Actions.prototype.add = function (id, icon) {
        var context = this;
        var newAction = new FAIcon()
            .data({ id: id })
            .icon(icon)
            .fontSize(this._fontSize)
        ;
        newAction.click = function (element, d) {
            context.click(d.data().id, d);
        }
        this._actions.push(newAction);
    };

    Actions.prototype.enter = function (domNode, element, d) {
        if (!d._actions.length) {
            return;
        }
        for (var i = 0; i < d._actions.length; ++i) {
            d._actions[i]
                .target(domNode)
                .pos({ x: i * d._fontSize, y: 0 })
                .render()
            ;
        }
    };

    Actions.prototype.update = function (domNode, element, d) {
        if (!d._actions.length) {
            return;
        }
        element
            .attr("transform", function (d) { return "translate(" + d._pos.x + "," + d._pos.y + ")"; })
        ;
    };

    function Vertex(target, _class) {
        D3Widget.call(this, target);
        IEntity.call(this);

        this._class = _class || "";
        this.icon = "";
        this.label = "";
        this._actions = new Actions().class("Indic");
        this._actions.add("debug", "\uf188");

        var context = this;
        this._actions.click = function (id, d) {
            switch(id) {
                case "debug":
                    if (context.textBox) {
                        d._debugOn = !d._debugOn;
                        var newText = context._data.label;
                        if (d._debugOn) {
                             newText += "\n \n"
                            for (var key in context._data) {
                                if (context._data[key] instanceof Object) {
                                } else {
                                    newText += key + ":  " + context._data[key] + "\n";
                                }
                            }
                        }
                        context.textBox
                            .text(newText)
                            .render()
                        ;
                        context.render();
                    }
                    break;
            }
        };
    };
    Vertex.prototype = Object.create(D3Widget.prototype);
    Vertex.prototype.implements(IEntity.prototype);

    Vertex.prototype.padding = function (_) {
        if (!arguments.length) return this._padding;
        this._padding = _;
        return this;
    };

    Vertex.prototype.showPinned = function (_) {
        if (!arguments.length) return this._showPinned;
        this._showPinned = _;
        return this;
    };

    Vertex.prototype.enter = function (domNode, element, d) {
        var context = this;
        element
            .on("click", function (d) { context.click(d3.select(this), d); })
            .on("dblclick", function (d) { context.dblclick(d3.select(this), d); })
            .on("mouseover", function (d) { context.mouseover(d3.select(this), d); })
            .on("mouseout", function (d) { context.mouseout(d3.select(this), d); })
        ;
        if (d._data.__viz && d._data.__viz.icon) {
            d.icon = new FAIcon()
                .icon(d._data.__viz.icon)
                .shape(d._data.__viz.shape ? d._data.__viz.shape : "circle")
                .target(domNode)
                .render()
            ;
        }
        if (d._data.label) {
            d.textBox = new TextBox()
                .text(d._data.label)
                .target(domNode)
                .render()
            ;
        }
        d._actions
            .target(domNode)
            .render()
        ;
    };

    Vertex.prototype.update = function (domNode, element, d) {
        var pos = d.textBox.pos();
        var bbox = d.textBox.size();
        var w = bbox.width;
        var h = bbox.height;
        //var actionsSize = d._actions.size();
        //if (w < (actionsSize.width + 12 + d.r * 2)) {
        //    w = actionsSize.width + 12 + d.r * 2;
        //}

        d.width = w;
        d.height = h;

        if (d.icon) {
            d.icon
                .pos({ x: -(w / 2) + (d.icon.size().width / 3), y: -(h / 2) - (d.icon.size().height / 3) })
                .render()
            ;
        }
        var bbox = domNode.getBBox();
        var actionsSize2 = d._actions.size();
        d._actions
            .pos({
                x: (bbox.width / 2) - actionsSize2.width,
                y: -(h / 2) - (actionsSize2.height / 2) - 2
            })
            .render()
        ;
    };

    Vertex.prototype.mouseover = function (element, d) {
        var d = 0;
    };

    function Edge(target) {
        D3Widget.call(this, target);
        IEdge.call(this);
    };
    Edge.prototype = Object.create(D3Widget.prototype);
    Edge.prototype.implements(IEdge.prototype);

    Edge.prototype.layout = function (_) {
        if (!arguments.length) return this._layout;
        this._layout = _;
        return this;
    };

    Edge.prototype.enter = function (domNode, element, d) {
        var elementPath = element.append("path");

        if (d._data.__viz && d._data.__viz.footer) {
            elementPath.attr("marker-start", "url(#" + d._data.__viz.footer + ")");
        }
        if (d._data.__viz && d._data.__viz.header) {
            elementPath.attr("marker-end", "url(#" + d._data.__viz.header + ")");
        }
        if (d._data.label) {
            d.__labelEntity = new TextBox()
                .class(d._class + "Label")
                .text(d._data.label)
                .target(domNode)
                .render();
            ;
        }
    };

    Edge.prototype.update = function (domNode, element, d) {
        var context = this;
        var pathElements = element.select("path");

        var points = [];
        if (d._layout) {
            points = d._layout.edge(this._data.id).points;
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

        var labelElement = element.select("g");
        if (labelElement) {
            var point = this._findMidPoint(points);

            labelElement
                .attr("transform", function (d) { return 'translate(' + point.x + ',' + point.y + ')'; })
            ;
        }
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
        rect.x = rect.x || 0;
        rect.y = rect.y || 0;
        rect.width = rect.width || 0;
        rect.height = rect.height || 0;

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

    //  Dahsboard  ---
    function Window(marshaller, args) {
        Vertex.call(this);
    };
    Window.prototype = Object.create(Vertex.prototype);

    return {
        FAIcon: FAIcon,
        TextBox: TextBox,
        Vertex: Vertex,
        Edge: Edge,
        Window: Window
    };
}));
