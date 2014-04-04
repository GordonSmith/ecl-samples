define([
    "dojo/_base/declare",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/Evented",

    "d3/d3",

    "topojson/topojson",

    "hpcc/viz/map/us-states"

], function (declare, dom, domConstruct, domStyle, Evented,
    d3,
    topojson,
    usStates) {

    return declare([Evented], {
        constructor: function (targetID) {
            this.targetID = targetID;
            this.margin = { top: 0, right: 0, bottom: 0, left: 0 };
        },

        resize: function () {
            this.inherited(arguments);
            var width = domStyle.get(this.targetID, "width"),
                height = domStyle.get(this.targetID, "height");

            if (this.width !== width || this.height !== height) {
                this.kill();
                this.init();
                this.width = width;
                this.height = height;
            }
        },

        init: function () {
            var width = domStyle.get(this.targetID, "width"),
                height = domStyle.get(this.targetID, "height"),
                centered;

            var projection = d3.geo.albersUsa()
                .scale(300)
                .translate([width / 2, height / 2]);

            var path = d3.geo.path()
                .projection(projection);

            var svg = d3.select("#" + this.targetID).append("svg")
                .attr("width", width)
                .attr("height", height);

            svg.append("rect")
                .attr("class", "mapBackground")
                .attr("width", width)
                .attr("height", height)
                .on("click", clicked);

            var g = svg.append("g");

            g.append("g")
                .attr("id", "states")
                .selectAll("path")
                .data(topojson.feature(usStates.topology, usStates.topology.objects.states).features)
                .enter().append("path")
                .attr("d", path)
                .on("click", clicked);

            g.append("path")
                .datum(topojson.mesh(usStates.topology, usStates.topology.objects.states, function (a, b) { return a !== b; }))
                .attr("id", "state-borders")
                .attr("d", path);

            var context = this;
            function clicked(d) {
                var x, y, k;

                if (d && centered !== d) {
                    var centroid = path.centroid(d);
                    x = centroid[0];
                    y = centroid[1];
                    k = 3;
                    centered = d;
                } else {
                    x = width / 2;
                    y = height / 2;
                    k = 1;
                    centered = null;
                }

                g.selectAll("path")
                    .classed("active", centered && function (d) { return d === centered; });

                g.transition()
                    .duration(750)
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
                    .style("stroke-width", 0.5 / k + "px");

                context.emit("clicked", centered ? usStates.stateNames[centered.id] : null);
            }
        },

        kill: function () {
            domConstruct.empty(this.targetID);
        }
    });
});
