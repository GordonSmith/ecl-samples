define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/aspect",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-geometry",

    "dijit/registry",

    "hpcc/_Widget",
    "hpcc/ESPResource",
    "hpcc/WsEcl",
    "hpcc/ECLPlaygroundResultsWidget",

    "d3/d3",
    "./ForceDirected",
    "./GMap",
    "./BarChart",

    "dojo/text!./tpl/App.html",

    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "dijit/form/TextBox"

], function (declare, lang, aspect, on, dom, domGeom,
    registry,
    _Widget, ESPResource, WsEcl, ECLPlaygroundResultsWidget,
    d3, ForceDirected, GMap, BarChart,
    tpl) {

    var dc = null;

    return declare([_Widget], {
        templateString: tpl,

        resize: function (args) {
            this.inherited(arguments);
            this.widget.BorderContainer.resize();
        },

        postCreate: function (args) {
            this.inherited(arguments);
            this.postCreateLHSMain();
            this.postCreateCenter();
            this.postCreateBottom();
            this.urlParams = dojo.queryToObject(dojoConfig.urlInfo.params);
        },

        postCreateLHSMain: function () {},
        postCreateCenter: function () {},
        postCreateBottom: function () {},

        startup: function () {
            this.inherited(arguments);
            this.initLHSMain();
            this.initLHSFooter();
            this.initCenter();
            this.initFooter();

            //  Just for debugging  ---
            var context = this;
            setTimeout(function () {
                context._onGo();
            }, 100);
        },

        _onGo: function () {
            var lexId = registry.byId(this.id + "ID").get("value");
            this.fetchData(lexId, false);

            var context = this;
            this.fetchAddresses(lexId, false).then(function (response) {
                context.gMap.setData(context.addresses, context.migrations);
                context.dateChart.setData(context.addresses);
            });
        },

        getSize: function (node) {
            var pos = domGeom.position(node);
            var pad = domGeom.getPadExtents(node);
            return {
                width: pos.w - pad.w,
                height: pos.h - pad.h
            };
        },

        fetchData: function (id, append, pos) {
            var context = this;
            var service = lang.mixin({
                getURL: function () {
                    return "http://" + this.ip + ":" + this.port + "/WsEcl/submit/query/" + this.server + "/" + this.action + "/json";
                }
            }, this.urlParams);
            return WsEcl.CallURL(service.getURL(), {
                cluster_id: id
            }).then(function (response) {
                var vertexCache = {};
                var vertices = [];
                var edges = [];
                for (var i = 0; i < response.nodes.length; ++i) {
                    var item = response.nodes[i];
                    item.category = item.group;
                    delete item.group;
                    vertexCache[item.nodeid] = item;
                    vertices.push(item);
                }
                for (var i = 0; i < response.links.length; ++i) {
                    var item = response.links[i];
                    item.source = vertexCache[item.source].id;
                    item.target = vertexCache[item.target].id;
                    item.weight = 1;
                    if (item.source !== item.target) {
                        edges.push(item);
                    }
                }
                context.ForceDirected.setData(vertices, edges, append, pos);
                return response;
            });
        },

        fetchAddresses: function (id, append, pos) {
            var context = this;
            var service = lang.mixin({
                getURL: function () {
                    return "http://" + this.ip + ":" + this.port + "/WsEcl/submit/query/" + this.server + "/personaddresses/json";
                }
            }, this.urlParams);
            return WsEcl.CallURL(service.getURL(), {
                lexid: id
            }).then(function (response) {
                if (lang.exists("Exceptions.Exception", response)) {
                    var msg = "";
                    for (var i = 0; i < response.Exceptions.Exception.length; ++i) {
                        var item = response.Exceptions.Exception[i];
                        msg += item.Code + ":  " + item.Message + "\n";
                    }
                    alert(msg);
                    return response;
                }
                var addresses = response.Addresses;
                addresses.sort(function (l, r) {
                    return l.dt_first_seen - r.dt_first_seen;
                });
                var migrations = [];
                var prevAddr = null;
                for (var i = 0; i < addresses.length; ++i) {
                    var address = addresses[i];
                    if (!address.geo_lat || !address.geo_long || (prevAddr && address.geo_lat === prevAddr.geo_lat && address.geo_long === prevAddr.geo_long)) {
                        addresses.splice(i, 1);
                        --i;
                        continue;
                    }
                    address.id = id + "_" + i;
                    if (prevAddr) {
                        migrations.push({
                            sourceID: prevAddr.id,
                            targetID: address.id
                        });
                    }
                    address.dateFirstSeen = {
                        year: parseInt(address.dt_first_seen.toString().substring(0, 4)),
                        month: parseInt(address.dt_first_seen.toString().substring(4, 6))
                    };
                    prevAddr = address;
                }
                context.addresses = addresses;
                context.migrations = migrations;
                return response;
            });
        },

        initCenter: function () {
            this.centerSize = this.getSize(this.widget.Main.domNode);
            this.ForceDirected = new ForceDirected("#" + this.id + "Main", this.centerSize.width, this.centerSize.height);

            var vertexMeta = {
                categoryIcon: [
                    "img/people.svg",
                    "img/people.svg",
                    "img/people.svg"
                ]
            };
            this.ForceDirected.setVertexMeta(vertexMeta);

            var context = this;
            aspect.after(this.widget.Main, "resize", dojoConfig.debounce(function () {
                context.centerSize = context.getSize(context.widget.Main.domNode);
                context.ForceDirected.resize(context.centerSize.width, context.centerSize.height);
            }));
            this.ForceDirected.vertex_dblclick = function (vertex, self) {
                var scaleVertex = d3.select(self).select(".scaleVertex");
                scaleVertex.classed("loading", true);
                context.fetchData(vertex.id, true, vertex).then(function (response) {
                    scaleVertex.select(".icon").attr("xlink:href", "img/person.svg");
                    scaleVertex.classed("loading", false);
                });
            };
            this.ForceDirected.vertex_click = function (vertex, self) {
                var scaleVertex = d3.select(self).select(".scaleVertex");
                scaleVertex.classed("loading", true);
                context.fetchAddresses(vertex.id, false, vertex).then(function (response) {
                    scaleVertex.classed("loading", false);
                    context.gMap.setData(context.addresses, context.migrations);
                    context.dateChart.setData(context.addresses);
                });
            };
        },
        initFooter: function () {
        },
        initLHSMain: function () {
            this.LHSMainSize = this.getSize(this.widget.LHSMain.domNode);
            this.gMap = new GMap("#" + this.id + "LHSMain", this.LHSMainSize.width, this.LHSMainSize.height);

            var context = this;
            aspect.after(registry.byId(context.id + "LHSMain"), "resize", dojoConfig.debounce(function () {
                context.LHSMainSize = context.getSize(context.widget.LHSMain.domNode);
                context.gMap.resize(context.LHSMainSize.width, context.LHSMainSize.height);
            }));
        },
        initLHSFooter: function () {
            this.LHSFooterSize = this.getSize(this.widget.LHSFooter.domNode);
            this.dateChart = new BarChart("#" + this.id + "LHSFooter", this.LHSFooterSize.width, this.LHSFooterSize.height);

            var context = this;
            aspect.after(registry.byId(context.id + "LHSFooter"), "resize", dojoConfig.debounce(function () {
                context.LHSFooterSize = context.getSize(context.widget.LHSFooter.domNode);
                context.dateChart.resize(context.LHSFooterSize.width, context.LHSFooterSize.height);
            }));

            this.dateChart.newSelection = dojoConfig.debounce(function (from, to) {
                inRange = function (from, to, address) {
                    var fromMonths = from.getFullYear() * 12 + from.getMonth() + 1;
                    var toMonths = to.getFullYear() * 12 + to.getMonth() + 1;
                    var addrMonths = address.dateFirstSeen.year * 12 + address.dateFirstSeen.month;
                    return fromMonths <= addrMonths && toMonths >= addrMonths;
                };

                var addresses = [];
                for (var i = 0; i < context.addresses.length; ++i) {
                    var address = context.addresses[i];
                    if (inRange(from, to, address)) {
                        addresses.push(address);
                    }
                }
                var migrations = [];
                for (var i = 0; i < context.migrations.length; ++i) {
                    var migration = context.migrations[i];
                    if (inRange(from, to, migration.source) &&
                        inRange(from, to, migration.target)) {
                        migrations.push(migration);
                    }
                }
                context.gMap.setData(addresses, migrations);
            }, 500, false);
        },
    });
});
