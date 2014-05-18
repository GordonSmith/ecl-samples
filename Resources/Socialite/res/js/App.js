define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-geometry",

    "dijit/registry",

    "hpcc/_Widget",
    "hpcc/ESPResource",
    "hpcc/WsEcl",

    "d3/d3",
    "./SpringViz",

    "dojo/text!./tpl/App.html",

    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "dijit/form/TextBox"

], function (declare, lang, on, dom, domGeom,
    registry,
    _Widget, ESPResource, WsEcl,
    d3, SpringViz,
    tpl) {

    var dc = null;

    return declare([_Widget], {
        templateString: tpl,

        resize: function (args) {
            this.inherited(arguments);
            this.widget.BorderContainer.resize();
            var centerSize = this.getSize(this.widget.Main.domNode);
            this.centerWidth = centerSize.width;
            this.centerHeight = centerSize.height;
            this.resizeCenterCharts();
        },

        resizeCenterCharts: dojoConfig.debounce(function () {
            if (this.springViz) {
                this.springViz.resize(this.centerWidth, this.centerHeight);
            }
        }),

        postCreate: function (args) {
            this.inherited(arguments);
            this.postCreateLHS();
            this.postCreateCenter();
            this.postCreateBottom();
            this.urlParams = dojo.queryToObject(dojoConfig.urlInfo.params);
        },

        postCreateLHS: function () {},
        postCreateCenter: function () {},
        postCreateBottom: function () {},

        startup: function () {
            this.inherited(arguments);
            this.initCharts();
        },

        _onGo: function () {
            var context = this;
            this.fetchData(registry.byId(this.id + "ID").get("value"), false);
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
                getURL: function() {
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
                context.springViz.setData(vertices, edges, append, pos);
                return response;
            });
        },

        initCharts: function () {
            this.springViz = new SpringViz("#" + this.id + "Main", this.centerWidth, this.centerHeight);
            var vertexMeta = {
                categoryIcon: [
                    "img/people.svg",
                    "img/people.svg",
                    "img/people.svg"
                ]
            };
            this.springViz.setVertexMeta(vertexMeta);
            var context = this;
            this.springViz.vertex_dblclick = function (vertex, self) {
                var scaleVertex = d3.select(self).select(".scaleVertex");
                scaleVertex.classed("loading", true);
                context.fetchData(vertex.id, true, vertex).then(function (response) {
                    scaleVertex.select(".icon").attr("xlink:href", "img/person.svg");
                    scaleVertex.classed("loading", false);
                });
            };

            //  Just for debugging  ---
            this._onGo(); 
        }
    });
});
