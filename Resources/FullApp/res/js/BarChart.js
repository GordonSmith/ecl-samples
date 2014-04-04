define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/Evented",
    "dojo/store/util/QueryResults",

    "dijit/registry",

    "d3/d3"

], function (declare, lang, dom, domConstruct, domStyle, Evented, QueryResults,
    registry,
    d3) {

    return declare([Evented], {

        constructor: function (targetID) {
            this.targetID = targetID;
            this.margin = { top: 20, right: 20, bottom: 60, left: 40 };
        },

        resize: function (args) {
            this.inherited(arguments);

            var svgWidth = domStyle.get(this.targetID, "width");
            var svgHeight = domStyle.get(this.targetID, "height");
            this.width = svgWidth - this.margin.left - this.margin.right;
            this.height = svgHeight - this.margin.top - this.margin.bottom;

            this._svg
                .attr("width", svgWidth)
                .attr("height", svgHeight);

            this.x0.rangeRoundBands([0, this.width], .1);
            this.x1.rangeRoundBands([0, this.x0.rangeBand()]);
            this.y.range([this.height, 0]);

            this.svg.select(".x.axis")
                .attr("transform", "translate(0," + this.height + ")");

            this.svg.select(".x").call(this.xAxis);
            this.svg.select(".y").call(this.yAxis);

            this.svg.select(".label")
                .attr("x", this.width);

            this.svg.selectAll(".a1")
                .attr("transform", lang.hitch(this, function (d) { return "translate(" + this.x0(d.a1) + ",0)"; }));

            this.svg.selectAll(".barRect")
                .attr("x", lang.hitch(this, function (d) { return this.x1(d.name); }))
                .attr("y", lang.hitch(this, function (d) { return this.y(d.value); }))
                .attr("width", this.x1.rangeBand())
                .attr("height", lang.hitch(this, function (d) { return this.height - this.y(d.value); }));

            //  Legend  ---
            this.svg.selectAll(".legendItemBox")
                .attr("x", this.width - 18);

            this.svg.selectAll(".legendItemText")
                .attr("x", this.width - 24);
        },

        init: function () {
            var svgWidth = domStyle.get(this.targetID, "width");
            var svgHeight = domStyle.get(this.targetID, "height");
            this.width = svgWidth - this.margin.left - this.margin.right;
            this.height = svgHeight - this.margin.top - this.margin.bottom;

            this.x0 = d3.scale.ordinal()
                .rangeRoundBands([0, this.width], .1);

            this.x1 = d3.scale.ordinal();

            this.y = d3.scale.linear()
                .range([this.height, 0])
                .domain([0, 0]);

            this.color = d3.scale.ordinal()
                .range(["#80CEED", "#C795C6"]);

            this.xAxis = d3.svg.axis()
                .scale(this.x0)
                .orient("bottom");

            this.yAxis = d3.svg.axis()
                .scale(this.y)
                .orient("left")
                .tickFormat(d3.format(".2s"));

            this._svg = d3.select("#" + this.targetID).append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight);

            this.svg = this._svg
                .append("g")
                .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

            this.svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + this.height + ")")
                .call(this.xAxis)
                .append("text")
                .attr("class", "label")
                .attr("x", this.width)
                .attr("y", 36)
                .style("text-anchor", "end")
                .text("Accounts Owned");

            this.svg.append("g")
                .attr("class", "y axis")
                .call(this.yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Population");
        },

        kill: function () {
            domConstruct.empty(this.targetID);
        },

        render: function (dataArray) {
            //  Preprocess Data  ---
            var data = QueryResults(dataArray);
            this.accountCount = d3.keys(data[0]).filter(function (key) { return key !== "a1" && key !== "state" && key !== "groupcount"; });
            data.forEach(lang.hitch(this, function (d) {
                d.genders = this.accountCount.map(function (name) { return { name: name, value: +d[name] }; });
            }));

            //  Update Domains  ---
            this.x0.domain(data.map(function (d) { return d.a1; }));
            this.x1.domain(this.accountCount).rangeRoundBands([0, this.x0.rangeBand()]);
            this.y.domain([0, d3.max(data, function (d) { return d3.max(d.genders, function (d) { return d.value; }); })]);

            //  Merge Data  ---
            this.state = this.svg.selectAll(".a1")
                .data(data, function (d) { return d.a1; });

            //  Update Axis's  ---
            this.svg.select(".x").transition().duration(750).call(this.xAxis);
            this.svg.select(".y").transition().duration(750).call(this.yAxis);

            //  New Items ---
            this.state.enter().append("g")
                .attr("class", "a1")
                .attr("transform", lang.hitch(this, function (d) { return "translate(" + this.x0(d.a1) + ",0)"; }));

            //  Old Items ---
            this.state.exit().selectAll("rect").transition().duration(750)
                .attr("y", lang.hitch(this, function (d) { return this.y(0); }))
                .attr("height", lang.hitch(this, function (d) { return this.height - this.y(0); }));

            //  Update Items ---
            var bar = this.state.selectAll("rect")
                .data(function (d) { return d.genders; });

            //  New Bar  ---
            var rect = bar.enter().append("rect")
                .attr("class", "barRect")
                .attr("y", lang.hitch(this, function (d) { return this.y(0); }))
                .attr("height", lang.hitch(this, function (d) { return this.height - this.y(0); }))
                .style("fill", lang.hitch(this, function (d) { return this.color(d.name); }));

            //  Update Bar  ---
            bar.transition().duration(750)
                .attr("width", this.x1.rangeBand())
                .attr("x", lang.hitch(this, function (d) { return this.x1(d.name); }))
                .attr("y", lang.hitch(this, function (d) { return this.y(d.value); }))
                .attr("height", lang.hitch(this, function (d) { return this.height - this.y(d.value); }));

            //  Legend  ---
            this.legend = this.svg.selectAll(".legend")
                .data(this.accountCount.slice().reverse())
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", lang.hitch(this, function (d, i) { return "translate(0," + i * 20 + ")"; }));

            this.legend.append("rect")
                .attr("class", "legendItemBox")
                .attr("x", this.width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", this.color);

            this.legend.append("text")
                .attr("class", "legendItemText")
                .attr("x", this.width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(lang.hitch(this, function (d) { return d === "malecount" ? "Males" : "Females"; }));
        }
    });
});
