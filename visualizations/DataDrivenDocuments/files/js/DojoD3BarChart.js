define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/Evented",

  "js/DojoD3"

], function (declare, lang, arrayUtil, Evented,
    DojoD3) {
    return declare([DojoD3, Evented], {
        data: null,
        constructor: function (mappings) {
        },

        renderTo: function (_target) {
            this.createSvgG(_target);
            this.SvgG
                .style("fill", "none")
            ;
            var margin = { top: 0, right: 0, bottom: 0, left: 50 },
                width = this.target.width - margin.left - margin.right,
                height = this.target.height - margin.top - margin.bottom;

            var formatPercent = d3.format(".0%");

            this.x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .1);

            this.y = d3.scale.linear()
                .range([height, 0]);

            this.xAxis = d3.svg.axis()
                .scale(this.x)
                .orient("bottom")
            ;

            this.yAxis = d3.svg.axis()
                .scale(this.y)
                .orient("left")
            ;

            this.SvgG
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            ;

            this.SvgX = this.Svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + height + ")")
                .attr("class", "x axis")
                .call(this.xAxis)
            ;

            this.SvgY = this.Svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .attr("class", "y axis")
                .call(this.yAxis)
            ;

            this.update([]);

        },
        update: function(data) {
            // DATA JOIN
            // Join new data with old elements, if any.
            var bar = this.SvgG.selectAll(".bar").data(data);

            // UPDATE
            // Update old elements as needed.
            bar
                .attr("class", "bar")
            ;

            // ENTER
            // Create new elements as needed.
            bar.enter().append("rect")
                .attr("class", "bar")
                .on("click", lang.hitch(this, function (d) {
                    var evt = {};
                    evt[this.mappings["x"]] = d.x;
                    this.emit("click", evt);
                }))
            ;

            // ENTER + UPDATE
            // Appending to the enter selection expands the update selection to include
            // entering elements; so, operations on the update selection after appending to
            // the enter selection will apply to both entering and updating nodes.
            bar.transition()
                .attr("x", lang.hitch(this, function (d) { return this.x(d.x); }))
                .attr("width", this.x.rangeBand())
                .attr("y", lang.hitch(this, function (d) { return this.y(d.y); }))
                .attr("height", lang.hitch(this, function (d) { return this.target.height - this.y(d.y); }))
            ;

            // EXIT
            // Remove old elements as needed.
            bar.exit().remove();
        },

        render: function (_data) {
            var height = 200;
            var data = this.delegateArray(_data);
            this.x.domain(data.map(function (d) { return d.x; }));
            this.y.domain([0, d3.max(data, function (d) { return d.y; })]);

            this.Svg.selectAll("g.y.axis").transition()
                .call(this.yAxis)
            ;

            this.Svg.selectAll("g.x.axis").transition()
                 .call(this.xAxis)
            ;
            this.update(data);
        }
    });
});
