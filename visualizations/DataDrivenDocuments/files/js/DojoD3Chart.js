define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/dom",

  "js/DojoD3"

], function (declare, lang, arrayUtil, dom,
    DojoD3) {
    return declare(DojoD3, {
        data: null,
        constructor: function (title, data, mappings) {
            this.data = this.delegateArray(data, mappings);
            this.mappedData = d3.map();
            var context = this;
            arrayUtil.forEach(this.data, function (item, idx) {
                context.mappedData.set(item.x, +item.y);
            });
        },

        Choropeth: function (_target) {
            this.createSvgG(_target);

            var colourArray = [
                "rgb(247,251,255)",
                "rgb(222,235,247)",
                "rgb(198,219,239)",
                "rgb(158,202,225)",
                "rgb(107,174,214)",
                "rgb(66,146,198)",
                "rgb(33,113,181)",
                "rgb(8,81,156)",
                "rgb(8,48,107)"
            ];
            var quantize = d3.scale.quantize()
                .domain([0, .15])
                .range(d3.range(9).map(function (i) { return colourArray[i]; }))
            ;
            var path = d3.geo.path();
            queue()
                .defer(d3.json, "map/us.json")
                .await(ready)
            ;
            var context = this;
            function ready(error, us) {
                context.SvgG
                    .style("fill", "none")
                ;
                context.SvgG.selectAll("path").data(topojson.feature(us, us.objects.counties).features).enter().append("path")
                    .style("fill", function (d) { return quantize(context.mappedData.get(d.id)); })
                    .attr("d", path)
                ;
                context.SvgG.append("path").datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
                    .style("fill", "none")
                    .style("stroke", "#fff")
                    .style("stroke-linejoin", "round")
                    .attr("d", path)
                ;
            }
        }
    });
});
