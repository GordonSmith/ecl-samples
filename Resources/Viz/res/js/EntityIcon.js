(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["d3", "./IEntityIcon"], factory);
    } else {
        root.EntityIcon = factory(root.d3, root.IEntityIcon);
    }
}(this, function (d3, IEntityIcon) {
    function Shape(targetRect) {
        this.targetRect = targetRect;
        this.nativeRect = targetRect;
        this.innerRect = targetRect;
    }
    Shape.prototype.render = function (selection) {
    }
    maxDimension = function (rect) {
        return rect.width > rect.height ? rect.width : rect.height;
    }
    Shape.prototype.scale = function () {
        return maxDimension(this.targetRect) / maxDimension(this.nativeRect);
    }
    Shape.prototype.diameter = function () {
        return maxDimension(this.targetRect);
    }
    Shape.prototype.radius = function () {
        return this.diameter() / 2;
    }
    offsetRect = function (rect, offset) {
        return {
            x: rect.x + offset.x,
            y: rect.y + offset.y,
            width: rect.width,
            height: rect.height
        };
    };
    scaledRect = function (rect, scale) {
        return {
            x: rect.x * scale,
            y: rect.y * scale,
            width: rect.width * scale,
            height: rect.height * scale
        };
    };
    offsetCircle = function (rect, offset) {
        return {
            x: rect.x + offset.x,
            y: rect.y + offset.y,
            radius: rect.radius
        };
    };
    scaledCircle = function (circle, scale) {
        return {
            x: circle.x * scale,
            y: circle.y * scale,
            radius: circle.radius * scale,
        };
    };
    Shape.prototype.scaledRect = function () {
        return scaledRect(offsetRect(this.nativeRect, this.targetRect), this.scale());
    };

    //  Circle  ---
    function Circle(targetRect) {
        Shape.call(this, targetRect);
        this.nativeRect = {
            x: -8,
            y: -8,
            width: 16,
            height: 16
        };
        this.center = {
            x: 0,
            y: 0,
            radius: 5
        };
    }
    Circle.prototype = Object.create(Shape.prototype);

    Circle.prototype.appendTo = function (target) {
        target.append("circle")
            .attr("class", "shape")
            .attr("r", this.radius())
        ;
        /*
        var scaledRect = this.scaledRect();
        target.append("rect")
            .attr("class", "zoomLayer")
            .attr("x", scaledRect.x)
            .attr("y", scaledRect.y)
            .attr("width", scaledRect.width)
            .attr("height", scaledRect.height)
        ;
        */
    }

    //  Pin  ---
    function Pin(targetRect) {
        Shape.call(this, targetRect);
        this.d = "m15.99495,7.68919c-0.00048,-4.2467 -3.57992,-7.68919 -7.99626,-7.68919c-4.4178,0 -7.99869,3.4425 -7.99869,7.68919c0,3.66536 5.95742,13.45748 7.58975,16.07044c0.08588,0.13841 0.24107,0.22287 0.40844,0.22287c0.16739,0 0.32305,-0.08446 0.40845,-0.2224c1.63185,-2.61249 7.58829,-12.40555 7.58829,-16.07091l0.00001,0.00001zm-7.99626,5.94988";
        this.nativeRect = {
            x:-8,
            y:-24,
            width: 16,
            height: 24
        };
        this.center = {
            x: 0,
            y: -21,
            radius: 6
        };
    }
    Pin.prototype = Object.create(Shape.prototype);

    Pin.prototype.appendTo = function (target) {
        var scaledRect = this.scaledRect();
        target.append("path")
            .attr("class", "shape")
            .attr("d", this.d)
            .attr("transform", "translate(" + scaledRect.x + "," + scaledRect.y + ")scale(" + this.scale() + ")");
        ;
    }

    function House(targetRect) {
        Shape.call(this, targetRect);
        this.points = "1.875,13.125 6.562,13.125 6.562,9.375 8.438,9.375 8.438,13.125 13.125,13.125 13.125,7.5 15,7.5 7.5,0 0,7.5 1.875,7.5 ";
        this.nativeRect = {
            x:-8,
            y:-8,
            width: 16,
            height: 16
        };
        this.center = {
            x: -8,
            y: -8,
            radius: 3
        };
    }
    House.prototype = Object.create(Shape.prototype);

    House.prototype.appendTo = function (target) {
        var scaledRect = this.scaledRect();
        target.append("polygon")
            .attr("class", "shape")
            .attr("points", this.points)
            .attr("transform", "translate(" + scaledRect.x + "," + scaledRect.y + ")scale(" + this.scale() + ")");
        ;
    }

    function Person(targetRect) {
        Shape.call(this, targetRect);
        this.d = "m7.90292,6.58626c0.97475,-0.63642 1.62219,-1.74489 1.62219,-3.009c0,-1.97552 -1.57698,-3.57726 -3.52157,-3.57726c-1.9454,0 -3.52198,1.60174 -3.52198,3.57726c0,1.2641 0.64724,2.37279 1.62219,3.009c-2.29684,0.20881 -4.10376,2.17395 -4.10376,4.56045l0,3.71294l0.00921,0.05797l0.25202,0.07999c2.37253,0.75277 4.43413,1.00438 6.13098,1.00438c3.31373,0 5.23479,-0.96013 5.35385,-1.02101l0.23525,-0.12134l0.02475,0l0,-3.71273c0.00021,-2.3865 -1.8061,-4.35143 -4.10314,-4.56066z";
        this.nativeRect = {
            x: -6,
            y: -8,
            width: 12,
            height: 16
        };
    }
    Person.prototype = Object.create(Shape.prototype);

    Person.prototype.appendTo = function (target) {
        var scaledRect = this.scaledRect();
        return target.append("path")
            .attr("class", "icon")
            .attr("d", this.d)
            .attr("transform", "translate(" + scaledRect.x + "," + scaledRect.y + ")scale(" + this.scale() + ")");
        ;
    }

    function EntityIcon(shape, icon, showLabel, width, height) {
        IEntityIcon.call(this);

        this.showLabel = showLabel;
        this.width = width;
        this.height = height;

        var rect = {
            x: 0,
            y: 0,
            width: this.width,
            height: this.height
        };

        switch (shape) {
            case "pin":
                this.shape = new Pin(rect);
                break;
            default:
                this.shape = new Circle(rect);
                break;
        }

        switch (icon) {
            case "person":
                this.icon = new Person({
                    x: this.shape.center.x,
                    y: this.shape.center.y,
                    width: this.shape.center.radius * this.shape.scale() * 2,
                    height: this.shape.center.radius * this.shape.scale() * 2
                });
                break;
        }
    };
    EntityIcon.prototype = Object.create(IEntityIcon.prototype);

    //  Private  ---
    EntityIcon.prototype._update = function (selection, drag) {
        var context = this;
        var entityIcon = selection.enter().append("g")
            .attr("class", "translateVertex")
            .on("click", function (d) { context.click(d, this); })
            .on("dblclick", function (d) { context.dblclick(d, this); })
            .on("mouseover", function (d) { context.mouseover(d, this); })
            .on("mouseout", function (d) { context.mouseout(d, this); })
        ;
        var scaleVertex = entityIcon.append("g")
            .attr("class", function (d) { return "scaleVertex category" + d.category; })
        ;
        scaleVertex.append("rect")
            .attr("class", "labelRect")
        ;
        this.shape.appendTo(scaleVertex);
        if (this.icon) {
            this.icon.appendTo(scaleVertex);
        }
        if (this.showLabel) {
            var shapeRect = this.shape.scaledRect();
            var text = scaleVertex.append("text")
                .attr("class", "label")
                .style("text-anchor", "middle")
                .text(function (d) {
                    return d.name;
                })
            ;
            text.each(function () {
                var bbox = this.getBBox();
                var y = -bbox.y + shapeRect.y + shapeRect.height - 1;
                d3.select(this.parentNode).select(".label")
                    .attr("dy", y)
                ;
                bbox = this.getBBox();
                d3.select(this.parentNode).select(".labelRect")
                    .attr("x", bbox.x - 4)
                    .attr("y", bbox.y - 2)
                    .attr("width", bbox.width + 8)
                    .attr("height", bbox.height + 2)
                ;
            });
        }
        /*
        scaleVertex.append("path")
            .attr("class", "icon")
            .attr("d", this.person.d)
            .attr("transform", function (d) {
                return "translate(-" + (context.pin.center.x + context.person.point.x / 2) + ",-" + (context.pin.center.x + context.person.point.y / 2) + ")";
            })
        ;
        */
        /*
        scaleVertex.append("circle")
            .attr("class", "circle")
            .attr("r", this.diameter / 2)
        ;
        scaleVertex.append("title").text(function (d) {
            return d.name + " [" + d.id + "]";
        });
        var text = scaleVertex.append("text")
            .attr("class", "label")
            .style("text-anchor", "middle")
            .attr("dy", this.diameter - 1)
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
                return context.image;
            })
            .attr("transform", function (d) {
                return "translate(-" + context.pin.center.x + ",-" + context.pin.center.y + ")";
            })
            .attr("width", this.diameter - this.padding)
            .attr("height", this.diameter - this.padding)
        ;
        */
        selection.exit().remove();

        return entityIcon;
    };

    //  Meta  ---
    EntityIcon.prototype.setVertexMeta = function (meta) {
    };

    //  Widget  ---
    EntityIcon.prototype.resize = function (width, height) {
    };

    //  Data  ---
    EntityIcon.prototype.setData = function (vertices, edges, append, pos) {
    };

    return EntityIcon;
}));
