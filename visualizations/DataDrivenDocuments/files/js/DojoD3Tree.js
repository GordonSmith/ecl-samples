define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/dom",

  "js/DojoD3"

], function (declare, lang, arrayUtil, dom,
    DojoD3) {
    return declare(DojoD3, {
        tree: null,
        constructor: function (title, tree, mappings) {
            if (tree.length == 1) {
                this.tree = this.delegateItem(lang.clone(tree[0]), mappings);
            } else {
                this.tree = {
                    label: title,
                    children: this.delegateArray(lang.clone(tree), mappings)
                };
            }
        },

        ClusterDendrogram: function (_target) {
            this.createSvgG(_target);

            var cluster = d3.layout.cluster().size([this.target.height, this.target.width - 160]);
            var diagonal = d3.svg.diagonal().projection(function (e) {
                return [e.y, e.x]
            });
            this.SvgG
                .style("font", "10px sans-serif")
                .attr("transform", "translate(40,0)")
            ;
            var nodes = cluster.nodes(this.tree);
            var links = cluster.links(nodes);
            var link = this.SvgG.selectAll(".link").data(links).enter().append("path")
                .style("fill", "none")
                .style("stroke", "#ccc")
                .style("stroke-width", "1.5px")
                .attr("d", diagonal)
            ;
            var node = this.SvgG.selectAll(".node").data(nodes).enter().append("g")
                .attr("transform", function (e) { return "translate(" + e.y + "," + e.x + ")" })
            ;
            node.append("circle")
                .style("fill", "#fff")
                .style("stroke", "steelBlue")
                .style("stroke-width", "1.5px")
                .attr("r", 4.5)
            ;
            node.append("text")
                .style("text-anchor", function (e) { return e.children ? "end" : "start" })
                .attr("dx", function (e) { return e.children ? -8 : 8 })
                .attr("dy", 3)
                .text(function (e) { return e.label; })
            ;
        },

        ReingoldTilfordTree: function (_target) {
            this.createSvgG(_target);

            var tree = d3.layout.tree().size([360, this.target.radius - 20]).separation(function (e, t) {
                return (e.parent == t.parent ? 1 : 2) / e.depth
            });
            var diagonal = d3.svg.diagonal.radial().projection(function (e) {
                return [e.y, e.x / 180 * Math.PI]
            });
            this.SvgG
                .style("font", "10px sans-serif")
                .attr("transform", "translate(" + this.target.radius + "," + this.target.radius + ")")
            ;
            var nodes = tree.nodes(this.tree)
            var links = tree.links(nodes);
            var link = this.SvgG.selectAll(".link").data(links).enter().append("path")
                .style("fill", "none")
                .style("stroke", "#ccc")
                .style("stroke-width", "1.5px;")
                .attr("d", diagonal)
            ;
            var node = this.SvgG.selectAll(".node").data(nodes).enter().append("g")
                .attr("transform", function (e) { return "rotate(" + (e.x - 90) + ")translate(" + e.y + ")" })
            ;
            node.append("circle")
                .style("fill", "#fff")
                .style("stroke", "steelblue")
                .style("stroke-width", "1.5px")
                .attr("r", 4.5)
            ;
            node.append("text")
                .attr("dy", ".31em")
                .attr("text-anchor", function (e) { return e.x < 180 ? "start" : "end" })
                .attr("transform", function (e) { return e.x < 180 ? "translate(8)" : "rotate(180)translate(-8)" })
                .text(function (e) { return e.label })
            ;
        },

        CirclePacking: function (_target) {
            this.createSvgG(_target);

            var format = d3.format(",d");
            var pack = d3.layout.pack().size([this.target.diameter - 4, this.target.diameter - 4]);
            this.SvgG
                .style("font", "10px sans-serif")
                .attr("transform", "translate(2,2)")
            ;
            var node = this.SvgG.datum(this.tree).selectAll(".node").data(pack.nodes).enter().append("g")
                .style("fill", function (e) { return e.children ? "rgb(31, 119, 180)" : "#ff7f0e" })
                .style("fill-opacity", function (e) { return e.children ? " .25" : "1" })
                .style("stroke", "rgb(31, 119, 180)")
                .style("stroke-width", "1px")
                .attr("transform", function (e) { return "translate(" + e.x + "," + e.y + ")" })
            ;
            node.append("title")
                .text(function (e) { return e.label + e.children ? "" : ": " + format(e.value) })
            ;
            node.append("circle")
                .attr("r", function (e) { return e.r })
            ;
            node.filter(function (e) { return !e.children }).append("text")
                .style("text-anchor", "middle")
                .style("fill", "black")
                .style("stroke", "none")
                .attr("dy", ".3em")
                .text(function (e) { return e.label.substring(0, e.r / 3) })
            ;
        },

        SunburstPartition: function (_target) {
            this.createSvgG(_target);

            function computeTextRotation(e) {
                var t = x(e.x + e.dx / 2) - Math.PI / 2;
                return t / Math.PI * 180
            }
            var x = d3.scale.linear().range([0, 2 * Math.PI]);
            var y = d3.scale.sqrt().range([0, this.target.radius]);
            var color = d3.scale.category20c();
            this.SvgG
                .style("font", "10px sans-serif")
                .attr("transform", "translate(" + this.target.width / 2 + "," + (this.target.height / 2 + 10) + ")")
            ;
            var partition = d3.layout.partition();
            var arc = d3.svg.arc().startAngle(function (e) { return Math.max(0, Math.min(2 * Math.PI, x(e.x))) })
                .endAngle(function (e) { return Math.max(0, Math.min(2 * Math.PI, x(e.x + e.dx))) })
                .innerRadius(function (e) { return Math.max(0, y(e.y)) })
                .outerRadius(function (e) { return Math.max(0, y(e.y + e.dy)) })
            ;
            var g = this.SvgG.selectAll("g").data(partition.nodes(this.tree)).enter().append("g");
            var path = g.append("path")
                .style("fill", function (e) { return color(e.children ? e.label : e.parent.label) })
                .style("stroke", "#fff")
                .style("fill-rule", "evenodd")
                .attr("d", arc)
            ;
            var text = g.append("text")
                .attr("x", function (e) { return y(e.y) })
                .attr("dx", "6")
                .attr("dy", ".35em")
                .text(function (e) { return e.label; })
            ;
            text
                .attr("transform", function (e) { return "rotate(" + computeTextRotation(e) + ")" })
            ;
        }
    });
});
