(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["d3", "./BarChartBase"], factory);
    } else {
        root.BarChart = factory(root.d3, root.BarChartBase);
    }
}(this, function (d3, BarChartBase) {
    function BarChart(target, width, height) {
        BarChartBase.call(this);

        this.version = "0.0.1";

        this.width = width;
        this.height = height;
        this.defaultMargin = 10;
        this.margin = { left: this.defaultMargin, right: this.defaultMargin, top: this.defaultMargin + 5, bottom: this.defaultMargin + 15 };

        this.data = [];

        var context = this;

        this.x = d3.time.scale().range([this.margin.left, this.width - this.margin.left - this.margin.right]);
        this.xAxis = d3.svg.axis().scale(this.x).orient("bottom");

        this.y = d3.scale.linear().range([this.height - this.margin.bottom, 0]);
        this.yAxis = d3.svg.axis().scale(this.y).orient("left")
                //.tickSize(0)
        ;

        // Bursh ---
        this.brush = d3.svg.brush()
            .x(this.x)
            .on("brush", brushed)
        ;
        function brushed() {
            var d = context.brush.empty() ? context.x.domain() : context.brush.extent();
            context.newSelection(d[0], d[1]);
        }

        //  SVG  ---
        this._svg = d3.select(target).append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
        ;
        this._svg.append("g")
            .attr("class", "x brush")
            .call(this.brush)
        .selectAll("rect")
            //.attr("y", +1)
            .attr("height", this.height - this.margin.bottom)
        ;
        this.svg = this._svg.append("g");
        this.xaxis = this._svg.append("g")
           .attr("class", "x axis")
        ;
        this.yaxis = this._svg.append("g")
           .attr("class", "y axis")
        ;
    };
    BarChart.prototype = Object.create(BarChartBase.prototype);

    BarChart.prototype.resize = function (width, height) {
        if (!this._svg)
            return;

        if (this.width != width || this.height != height) {
            this.width = width;
            this.height = height;

            this._svg
                .attr("width", this.width)
                .attr("height", this.height)
            ;
            this._svg.select(".brush").selectAll("rect")
                .attr("height", this.height - this.margin.bottom)
            ;
            this.x.range([this.margin.left, this.width - this.margin.left - this.margin.right]);
            this.y.range([this.height - this.margin.bottom, 0]);
            this._update();
        }
    };


    BarChart.prototype.setData = function (data, append, pos) {
        if (!append) {
            this.data.length = 0;
        }

        this.first_date = {};
        this.last_date = {};
        var today = new Date();
        this.maxStay = 0;
        var prevFirstSeen = null;
        for (var i = 0; i < data.length; ++i) {
            var item = data[i];
            this.data.push(item);
            if (i === 0) {
                this.first_date = item.dateFirstSeen;
            }
            if (i === data.length - 1) {
                this.last_date = item.dateFirstSeen;
                item.dateFirstSeen.stayLength = today.getFullYear() * 12 + today.getMonth() - (item.dateFirstSeen.year * 12 + item.dateFirstSeen.month);
            }
            if (prevFirstSeen) {
                prevFirstSeen.stayLength = item.dateFirstSeen.year * 12 + item.dateFirstSeen.month - (prevFirstSeen.year * 12 + prevFirstSeen.month);
                if (prevFirstSeen.stayLength > this.maxStay) {
                    this.maxStay = prevFirstSeen.stayLength;
                }
            }
            prevFirstSeen = item.dateFirstSeen;
        }
        if (this.maxStay === 0) {
            this.maxStay = this.last_date.stayLength;
        }
        this.brush.clear();
        this._update();
    };

    BarChart.prototype._update = function () {
        this._svg.selectAll('.brush').call(this.brush);

        this.x.domain([new Date(this.first_date.year - 1, 1, 1), new Date(this.last_date.year + 1, 12, 31)]);
        this.y.domain([0, this.maxStay]);
        this.xaxis.call(this.xAxis).attr("transform", "translate(0," + (this.height - this.margin.bottom) + ")");
        this.yaxis.call(this.yAxis).attr("transform", "translate(" + this.margin.left + ",0)");

        var context = this;
        var bar = this.svg.selectAll(".bar")
            .data(this.data);
        bar.each(transform);
        bar.enter().append("rect")
            .attr("class", "bar")
            .append("title")
            .text(function (d) {
                return d.prim_range + " " + d.prim_name + "\n" + d.city_name + "\n" + d.county_name + "\n" + d.st + " " + d.zip;
            })
        ;
        bar.each(transform);
        function transform(d) {
            return d3.select(this)
                .attr("x", function (d) { return context.x(new Date(d.dateFirstSeen.year, d.dateFirstSeen.month - 1, 1)); })
                .attr("y", function (d) { return context.y(d.dateFirstSeen.stayLength); })
                .attr("width", function (d) {
                    var x = context.x(new Date(d.dateFirstSeen.month - 1, d.dateFirstSeen.month - 1, 1));
                    var x2 = context.x(new Date(d.dateFirstSeen.month - 1, d.dateFirstSeen.month, 1));
                    return x2 - x;
                })
                .attr("height", function (d) { return context.height - context.margin.bottom - context.y(d.dateFirstSeen.stayLength) })
            //.transition()
            //  .attr("width", this.x.rangeBand())
            ;
        }
        bar.exit().remove();
    };

    return BarChart;
}));
