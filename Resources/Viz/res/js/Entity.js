(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./D3Widget", "./IEntity", "lib/d3/d3"], factory);
    } else {
        root.Entity = factory(root.D3Widget, root.IEntity, root.d3);
    }
}(this, function (D3Widget, IEntity, d3) {
    function Entity(target, _class) {
        D3Widget.call(this, target);
        IEntity.call(this);

        this._class = _class || "";
        this.icon = "";
        this.label = "";
        this._padding = {
            width: 8,
            height: 2
        };
        this.r = 12;
        this.fontHeight = 14;        
        this._showPinned = false;
    };
    Entity.prototype = Object.create(D3Widget.prototype);
    Entity.prototype.implements(IEntity.prototype);

    Entity.prototype.resize = function (width, height) {
        if (D3Widget.prototype.resize.call(this, width, height)) {
        }
    };

    Entity.prototype.padding = function (_) {
        if (!arguments.length) return this._padding;
        this._padding = _;
        return this;
    };

    Entity.prototype.showPinned = function (_) {
        if (!arguments.length) return this._showPinned;
        this._showPinned = _;
        return this;
    };

    Entity.prototype.render = function () {
        var context = this;
        this.icon = this._data.__viz && this._data.__viz.icon ? this._data.__viz.icon : "";
        this.label = this._data.label;
        var elements = this._svg.selectAll("g").data([this._data], function (d) { return d.id; });
        var node = elements.enter().append("g")
            .attr("class", this._class)
            .on("click", function (d) { context.click(d3.select(this), context._data); })
            .on("dblclick", function (d) { context.dblclick(d3.select(this), context._data); })
            .on("mouseover", function (d) { context.mouseover(d3.select(this), context._data); })
            .on("mouseout", function (d) { context.mouseout(d3.select(this), context._data); })
            .each(create)
        ;
        function create(d) {
            var element = d3.select(this);

            var iconShape, iconIcon, iconPinned;
            if (context.icon) {
                iconShape = element.append("circle")
                    .attr("class", context._class + "Shape")
                ;
                iconIcon = element.append("text")
                    .attr("class", context._class + "Icon")
                    .style("text-anchor", "middle")
                    .attr("font-family", "FontAwesome")
                    .attr("font-size", function (d) { return context.fontHeight + "px" })
                    .text(function (d) { return context.icon })
                ;
            }
            if (context._showPinned) {
                iconPinned = element.append("text")
                    .attr("class", context._class + "Unpinned")
                    .style("text-anchor", "middle")
                    .attr("font-family", "FontAwesome")
                    .attr("font-size", function (d) { return context.fontHeight - 2 + "px" })
                    .text("\uf08d")
                ;
            }
            var rectNode = element.append("rect")
            ;
            var textNode = element.append("text")
                .style("text-anchor", "middle")
            ;

            var textParts = context.label.split("\n");
            for (var i = 0; i < textParts.length; ++i) {
                textNode.append("tspan")
                    .attr("dy", "1em")
                    .attr("x", "0")
                    .text(textParts[i])
                ;
            }

            var bbox = textNode.node().getBBox();
            var w = bbox.width + context._padding.width;
            var h = bbox.height + context._padding.height;

            rectNode
                .attr("x", function (d) { return -w / 2; })
                .attr("y", function (d) { return -h / 2; })
                .attr("width", function (d) { return w; })
                .attr("height", function (d) { return h; })
            ;
            textNode
                .attr("transform", function (d) { return "translate(0," + ((-bbox.height / 2)) + ")"; })
            ;

            context.width = w;
            context.height = h;

            if (iconShape) {
                iconShape
                    .attr("cx", function (d) { return context.r - (w / 2); })
                    .attr("cy", function (d) { return -context.r + ((context._padding.height - h) / 2); })
                    .attr("r", 13)
                ;
            }
            if (iconIcon) {
                iconIcon
                .attr("transform", "translate(" + (context.r - (w / 2)) + "," + ((context._padding.height - context.fontHeight - h) / 2) + ")")
                ;
            }
            if (iconPinned) {
                iconPinned
                .attr("transform", "translate(" + ((w - context.r) / 2) + "," + ((context._padding.height - context.fontHeight - h) / 2) + ")")
                .on("click", function (d) {
                    d.fixed = !d.fixed;
                    d3.select(this)
                        .attr("class", function (d) {
                            return context._class + (d.fixed ? "Pinned" : "Unpinned");
                        })
                    ;
                })
                ;
            }
        }
        elements.exit().remove();
    };

    return Entity;
}));
