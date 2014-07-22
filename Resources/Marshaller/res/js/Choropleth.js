(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["./D3Widget", "./IEntity", "d3/d3", "topojson/topojson", "hpcc/viz/map/us-states"], factory);
    } else {
        root.Choropleth = factory(root.D3Widget, root.IChoropleth, root.d3, root.topojson, root.usStates);
    }
}(this, function (D3Widget, IChoropleth, d3, topojson, usStates) {
    function Choropleth(target) {
        D3Widget.call(this, target);
        this._class = "Choropleth";
        this.width = 320;
        this.height = 240;
    };
    Choropleth.prototype = Object.create(D3Widget.prototype);

    Choropleth.prototype.id = function (_) {
        if (!arguments.length) return this._id;
        this._id = _;
        return this;
    };

    Choropleth.prototype.target = function (_) {
        var retVal = D3Widget.prototype.target.call(this, _);

        return retVal;
    };

    Choropleth.prototype.data = function (_) {
        var retVal = D3Widget.prototype.data.call(this, _);
        if (arguments.length) {
            this._dataMap = {};
            this._dataMax = 0;
            var context = this;
            this._data.forEach(function (item) {
                context._dataMap[item.state] = item.weight;
                if (item.weight > context._dataMax) {
                    context._dataMax = item.weight;
                }
            });
        }
        return retVal;
    };

    Choropleth.prototype.enter = function (domNode, element, d) {
        var context = this;
        element.append("rect")
            .attr("x", -d.width/2 + "px")
            .attr("y", -d.height / 2 + "px")
            .attr("width", d.width + "px")
            .attr("height", d.height + "px")
                .on("click", function (d) {
                    var x = d;
                })
        ;
        var projection = d3.geo.albersUsa()
            .scale(d.width * 110 / 100)
            .translate([0, 0])
        ;

        var path = d3.geo.path()
            .projection(projection)
        ;

        element.selectAll("path").data(topojson.feature(usStates.topology, usStates.topology.objects.states).features)
            .enter().append("path")
                .attr("d", path)
                .on("click", function (d) {
                    context.click(d3.select(this), {state: usStates.stateNames[d.id].code});
                })
                .attr("id", function (d) {
                    return usStates.stateNames[d.id].code;
                })
                .append("title")
        ;

        return element;
    };

    Choropleth.prototype.update = function (domNode, element, d) {
        var context = this;
        var quantize = d3.scale.quantize()
            .domain([0, this._dataMax])
            .range(d3.range(255).map(function (i) {
                var negRed = 255 - i;
                return "rgb(255, " + negRed + ", " + negRed + ")";
            }))
        ;

        element.selectAll("path")
            .style("fill", function (d) {
                if (context._dataMap) {
                    var code = usStates.stateNames[d.id].code;
                    return quantize(context._dataMap[code]);
                }
                return "whitesmoke";
            })
            .select("title")
                .text(function (d) {
                    if (context._dataMap) {
                        var code = usStates.stateNames[d.id].code;
                        return usStates.stateNames[d.id].name + " (" + context._dataMap[code] + ")";
                    }
                    return "";
                })

        ;
        return element;
    };

    return Choropleth;
}));
