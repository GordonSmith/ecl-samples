(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./D3Widget", "./IEntity", "d3/d3"], factory);
    } else {
        root.Pie = factory(root.D3Widget, root.IPie, root.d3);
    }
}(this, function (D3Widget, IPie, d3) {
    function Pie(target) {
        D3Widget.call(this, target);
        this._class = "Pie";
        this.width = 240;
        this.height = 240;
    };
    Pie.prototype = Object.create(D3Widget.prototype);
    Pie.prototype.color = d3.scale.category20();

    Pie.prototype.id = function (_) {
        if (!arguments.length) return this._id;
        this._id = _;
        return this;
    };

    Pie.prototype.target = function (_) {
        var retVal = D3Widget.prototype.target.call(this, _);

        return retVal;
    };

    Pie.prototype.enter = function (domNode, element, d) {
        element.append("rect")
            .attr("x", -d.width/2 + "px")
            .attr("y", -d.height / 2 + "px")
            .attr("width", d.width + "px")
            .attr("height", d.height + "px")
        ;

        return element;
    };

    Pie.prototype.update = function (domNode, element, d) {
        var context = this;

        var arcFunc = d3.svg.arc()
            .outerRadius((d.height - 20) / 2)
            .innerRadius(0)
        ;

        var pie = d3.layout.pie()
            .sort(null)
            .value(function (d) { return d.weight; })
        ;

        var arc = element.selectAll(".arc").data(pie(this._data))
        ;

        arc.enter().append("g")
            .attr("class", "arc")
            .each(create)
        ;
        function create(d) {
            var element = d3.select(this);
            element.append("path")
                .style("fill", function (d) { return context.color(d.data.label); })
                .on("click", function (d) {
                    context.click(d3.select(this), d.data);
                })
                .append("title")
            ;

            element.append("text")
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
            ;
        }
        arc
            .each(update)
        ;
        function update(d) {
            var element = d3.select(this);
            element.select("path")
                .attr("d", arcFunc)
                .select("title")
                    .text(function (d) { return d.data.label + " (" + d.data.weight + ")"; })
            ;
            element.select("text")
                .attr("transform", function (d) { return "translate(" + arcFunc.centroid(d) + ")"; })
                .text(function (d) { return d.data.label; })
            ;
        }
        arc.exit()
            .remove()
        ;
        return element;
    };

    return Pie;
}));
