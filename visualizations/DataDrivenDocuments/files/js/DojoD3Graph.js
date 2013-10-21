define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/dom",

  "js/DojoD3"

], function (declare, lang, arrayUtil, dom,
    DojoD3) {
    return declare(DojoD3, {

        constructor: function (title, vertices, vMappings, edges, eMappings) {
            this.vertices = this.delegateArray(lang.clone(vertices), vMappings);
            this.edges = this.delegateArray(lang.clone(edges), eMappings);
        },

        ForceDirected: function (_target) {
            this.createSvgG(_target);

            var color = d3.scale.category20();
            var force = d3.layout.force().charge(-120).linkDistance(30).size([this.target.width, this.target.height]);
            force.nodes(this.vertices).links(this.edges);

            var link = this.SvgG.selectAll(".linkFD").data(this.edges).enter().append("line")
                .style("stroke-width", function (e) { return Math.sqrt(e.weight) })
                .style("stroke", "#999")
                .style("stroke-opacity", ".6")
            ;
            var node = this.SvgG.selectAll(".nodeFD").data(this.vertices).enter().append("circle")
                .style("fill", function (e) { return color(e.category) })
                .style("stroke", "#fff")
                .style("stroke-width", "1.5px")
                .attr("r", 5)
                .call(force.drag)
            ;
            node.append("title").text(function (e) { return e.name });
            force.on("tick", function () {
                link
                    .attr("x1", function (e) { return e.source.x })
                    .attr("y1", function (e) { return e.source.y })
                    .attr("x2", function (e) { return e.target.x })
                    .attr("y2", function (e) { return e.target.y })
                ;
                node
                    .attr("cx", function (e) { return e.x })
                    .attr("cy", function (e) { return e.y })
                ;
            });

            var n = this.vertices.length;
            var context = this;
            arrayUtil.forEach(this.vertices, function (e, t) {
                e.x = e.y = context.target.width / n * t
            });

            force.start();
            for (var i = n; i > 0; --i) {
                force.tick()
            }
            force.stop();
        },

        CoOccurrence: function (_target) {
            var margin = {
                top: 80,
                right: 0,
                bottom: 20,
                left: 100
            };

            this.createSvgG(_target);
            this.SvgG
                .style("font", "10px sans-serif")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            ;

            function row(e) {
                var t = d3.select(this).selectAll(".cell").data(e.filter(function (e) {
                    return e.z
                })).enter().append("rect").attr("class", "cell").attr("x", function (e) {
                    return x(e.x)
                }).attr("width", x.rangeBand()).attr("height", x.rangeBand()).style("fill-opacity", function (e) {
                    return z(e.z)
                }).style("fill", function (e) {
                    return nodes[e.x].category == nodes[e.y].category ? c(nodes[e.x].category) : null
                }).on("mouseover", mouseover).on("mouseout", mouseout)
            }
            function mouseover(e) {
                d3.selectAll(".row text").classed("active", function (t, n) {
                    return n == e.y
                });
                d3.selectAll(".column text").classed("active", function (t, n) {
                    return n == e.x
                })
            }
            function mouseout() {
                d3.selectAll("text").classed("active", false)
            }
            function order(e) {
                x.domain(orders[e]);
                var t = this.SvgG.transition().duration(2500);
                t.selectAll(".row").delay(function (e, t) {
                    return x(t) * 4
                }).attr("transform", function (e, t) {
                    return "translate(0," + x(t) + ")"
                }).selectAll(".cell").delay(function (e) {
                    return x(e.x) * 4
                }).attr("x", function (e) {
                    return x(e.x)
                });
                t.selectAll(".column").delay(function (e, t) {
                    return x(t) * 4
                }).attr("transform", function (e, t) {
                    return "translate(" + x(t) + ")rotate(-90)"
                })
            }
            dojo.query("head").append("<style>text.active { fill: red; } </style>");
            this.target.width -= margin.left + margin.right;
            this.target.height -= margin.top + margin.bottom;
            var x = d3.scale.ordinal().rangeBands([0, this.target.width]), z = d3.scale.linear().domain([0, 4]).clamp(true), c = d3.scale.category10().domain(d3.range(10));
            var matrix = [];
            var nodes = this.vertices;
            var n = nodes.length;
            nodes.forEach(function (e, t) {
                e.index = t;
                e.count = 0;
                matrix[t] = d3.range(n).map(function (e) {
                    return {
                        x: e,
                        y: t,
                        z: 0
                    }
                })
            });
            this.edges.forEach(function (e) {
                matrix[e.source.index][e.target.index].z += e.weight;
                matrix[e.target.index][e.source.index].z += e.weight;
                matrix[e.source.index][e.source.index].z += e.weight;
                matrix[e.target.index][e.target.index].z += e.weight;
                nodes[e.source.index].count += e.weight;
                nodes[e.target.index].count += e.weight
            });
            var orders = {
                name: d3.range(n).sort(function (e, t) {
                    return d3.ascending(nodes[e].name, nodes[t].name)
                }),
                count: d3.range(n).sort(function (e, t) {
                    return nodes[t].count - nodes[e].count
                }),
                category: d3.range(n).sort(function (e, t) {
                    return nodes[t].category - nodes[e].category
                })
            };
            x.domain(orders.category);
            this.SvgG.append("rect").attr("width", this.target.width).attr("height", this.target.height).style("fill", "#eee");
            var row = this.SvgG.selectAll(".row").data(matrix).enter().append("g").attr("class", "row").attr("transform", function (e, t) {
                return "translate(0," + x(t) + ")"
            }).each(row);
            row.append("line").attr("x2", this.target.width).style("stroke", "#fff");
            row.append("text").attr("x", -6).attr("y", x.rangeBand() / 2).attr("dy", ".32em").attr("text-anchor", "end").text(function (e, t) {
                return nodes[t].name
            });
            var column = this.SvgG.selectAll(".column").data(matrix).enter().append("g").attr("class", "column").attr("transform", function (e, t) {
                return "translate(" + x(t) + ")rotate(-90)"
            });
            column.append("line").attr("x1", -this.target.width).style("stroke", "#fff");
            column.append("text").attr("x", 6).attr("y", x.rangeBand() / 2).attr("dy", ".32em").attr("text-anchor", "start").text(function (e, t) {
                return nodes[t].name
            });
        }
    });
});
