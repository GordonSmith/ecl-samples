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
            this.mappedData = d3.map();

            queue()
                .defer(d3.json, "map/us.json")
                .await(lang.hitch(this, function (error, us) {
                    this.us = us;
                    this.emit("ready", {});
                }))
            ;
        },

        _prepData: function (data) {
            this.data = this.delegateArray(data, this.mappings);
            var maxVal = 0;
            this.mappedData = d3.map();
            arrayUtil.forEach(this.data, lang.hitch(this, function (item, idx) {
                if (+item.value > maxVal) {
                    maxVal = +item.value;
                }
                this.mappedData.set(item.id, +item.value);
            }));
            return maxVal;
        },

        renderTo: function (_target) {
            this.createSvgG(_target);
            this.SvgG
                .style("fill", "none")
            ;
            var path = d3.geo.path();
            var p = this.SvgG.selectAll("path").data(topojson.feature(this.us, this.us.objects.counties).features);
            p.enter().append("path")
                .style("fill", "white")
                .style("stroke", "grey")
                .style("stroke-width", 0.25)
                .attr("d", path)
                .on("click", lang.hitch(this, function (d) {
                    var evt = {};
                    evt[this.mappings["id"]] = d.id;
                    this.emit("click", evt);
                }))
                .append("title").text(lang.hitch(this, function (d) { return d.id; }))
            ;
            p.exit().remove();
            this.Svg.append("path").datum(topojson.mesh(this.us, this.us.objects.states, function (a, b) { return a !== b; }))
                .attr("class", "states")
                .attr("d", path)
            ;
            this.Svg.append("path").datum(topojson.feature(this.us, this.us.objects.land))
                .attr("class", "usa")
                .attr("d", path)
            ;
        },

        render: function (data) {
            if (!this.SvgG) {
                setTimeout(lang.hitch(this, this.render), 100, data);
                return;
            }
            var maxVal = this._prepData(data);
            var quantize = d3.scale.quantize()
                            .domain([0, maxVal])
                            .range(d3.range(255).map(lang.hitch(this, function (i) {
                                var negRed = 255 - i;
                                return "rgb(255, " + negRed + ", " + negRed + ")";
                            })))
            ;
            this.SvgG.selectAll("path")
                .style("fill", lang.hitch(this, function (d) { return this.mappedData.get(d.id) == null ? "lightgrey" : quantize(this.mappedData.get(d.id)); }))
                .select("title")
                .text(lang.hitch(this, function (d) { return d.id + " (" + this.mappedData.get(d.id) + ")"; }))
            ;
        }
    });
});
