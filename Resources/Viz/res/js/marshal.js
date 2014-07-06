define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/json",
    "dojo/dom-geometry",
    "dojo/aspect",

    "dijit/registry",
    "dijit/layout/ContentPane",

    "hpcc/_Widget",
    "hpcc/ESPResource",
    "hpcc/WsEcl",

    "js/Graph",

    "dojo/text!./tpl/marshal.html",

    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/form/SimpleTextarea"

], function (declare, lang, arrayUtil, JSON, domGeom, aspect,
    registry, ContentPane,
    _Widget, ESPResource, WsEcl,
    Graph,
    tpl) {

    var debounce = function (func, threshold, execAsap) {
        var timeout;
        return function debounced() {
            var obj = this, args = arguments;
            function delayed() {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null;
            };
            if (timeout)
                clearTimeout(timeout);
            else if (execAsap)
                func.apply(obj, args);
            timeout = setTimeout(delayed, threshold || 100);
        }
    };

    var Parser = declare(null, {
        isValid: false,
        prettyJson: "",

        constructor: function (json) {
            try {
                this.obj = JSON.parse(json);
                this.json = JSON.stringify(this.obj);
                this.prettyJson = JSON.stringify(this.obj, null, "  ");
                this.isValid = true;
            } catch (e) {
                this.prettyJson = e.message;
            }
        }
    });

    var Marshaller = declare(null, {
        constructor: function (dashboards) {
            this.dashboards = {};
            arrayUtil.forEach(dashboards, function (item, idx) {
                this.dashboards[item.id] = new Dashboard(this, item);
            }, this);
            var d = 0;
        },

        gatherNodes: function (nodes) {
            for (var key in this.dashboards) {
                this.dashboards[key].gatherNodes(nodes);
            }
        },

        gatherEdges: function (edges) {
        for (var key in this.dashboards) {
            this.dashboards[key].gatherEdges(edges);
        }
    }
});

    var Dashboard = declare(null, {
        constructor: function (marshaller, args) {
            this.marshaller = marshaller;
            declare.safeMixin(this, args);

            this.dataSources = {};
            arrayUtil.forEach(this.DataSources, function (item, idx) {
                this.dataSources[item.id] = new DataSource(this, item);
            }, this);
            delete this.DataSources;

            this.visualisations = {};
            arrayUtil.forEach(this.Visualizations, function (item, idx) {
                this.visualisations[item.id] = new Visualization(this, item);
            }, this);
            delete this.Visualizations;
        },

        gatherNodes: function (nodes) {
            for (var key in this.dataSources) {
                this.dataSources[key].gatherNodes(nodes);
            }
            for (var key in this.visualisations) {
                this.visualisations[key].gatherNodes(nodes);
            }
        },

        gatherEdges: function (edges) {
            for (var key in this.dataSources) {
                this.dataSources[key].gatherEdges(edges);
            }
            for (var key in this.visualisations) {
                this.visualisations[key].gatherEdges(edges);
            }
        }
    });

    var DataSource = declare(null, {
        constructor: function (dashboard, args) {
            this.dashboard = dashboard;
            declare.safeMixin(this, args);
        },

        gatherNodes: function (nodes) {
            nodes.push(lang.mixin({
                label: this.id
            }, this));
            arrayUtil.forEach(this.outputs, function (item, idx) {
                var d = nodes.push(lang.mixin({}, item, {
                    id: this.id + "." + item.id,
                    label: item.id
                }));
                var d2 = 0;
            }, this);
        },

        gatherEdges: function (edges) {
            arrayUtil.forEach(this.outputs, function (item, idx) {
                edges.push(lang.mixin({}, item, {
                    id: this.id + "." + item.id,
                    source: this.id,
                    target: this.id + "." + item.id,
                    __viz: {
                    }
                }));
            }, this);
        }
    });

    var Visualization = declare(null, {
        constructor: function (dashboard, args) {
            this.dashboard = dashboard;
            declare.safeMixin(this, args);
        },
        gatherNodes: function (nodes) {
            nodes.push(lang.mixin({
                label: this.id + "\n[" + this.type + "]"
            }, this));
        },

        gatherEdges: function (edges) {
            if (lang.exists("source.name", this)) {
                edges.push({
                    source: this.source.name + "." + this.source.output,
                    target: this.id,
                    type: "source",
                    __viz: {
                        footer: "circleFoot",
                        header: "circleHead"
                    }
                });
            }
            if (lang.exists("onSelect.updates.visualization", this)) {
                edges.push({
                    source: this.id, target: this.onSelect.updates.visualization, __viz: {
                        header: "arrowHead"
                    }
                });
            }
        }
    });

    return declare([_Widget], {
        templateString: tpl,

        constructor: function() {
        },

        resize: function (args) {
            this.inherited(arguments);
            this.widget.BorderContainer.resize();
        },

        postCreate: function (args) {
            this.inherited(arguments);
            this.tabConatiner = registry.byId(this.id + "Main");
            this.jsJson = registry.byId(this.id + "MarshalJS");
            this.ppJson = registry.byId(this.id + "MarshalPP");
        },

        startup: function () {
            this.inherited(arguments);
            //this.initCenter();
            this._onChangeJS(this.jsJson.get("value"));
        },

        getSize: function (node) {
            var pos = domGeom.position(node);
            var pad = domGeom.getPadExtents(node);
            return {
                width: pos.w - pad.w,
                height: pos.h - pad.h
            };
        },

        initTab: function (tab, nodes, edges) {
            var size = this.getSize(tab.domNode);
            var graph = new Graph("#" + tab.id, size.width, size.height);

            var context = this;
            aspect.after(tab, "resize", debounce(function () {
                var size = context.getSize(tab.domNode);
                graph.resize(size.width, size.height);
            }));

            graph.setData(nodes, edges);

            //this.Graph.setData([
            //    { id: "kspacey", label: "Kevin Spacey"},
            //    { id: "swilliams", label: "Saul Williams"},
            //    { id: "bpitt", label: "Brad Pitt"},
            //    { id: "hford", label: "Harrison Ford"},
            //    { id: "lwilson", label: "Luke Wilson"},
            //    { id: "kbacon", label: "Kevin Bacon"}
            //], [
            //      { source: "kspacey", target: "kbacon" },
            //      { source: "kspacey", target: "swilliams" },
            //      { source: "swilliams", target: "kbacon" },
            //      { source: "bpitt", target: "kbacon" },
            //      { source: "hford", target: "lwilson" },
            //      { source: "lwilson", target: "kbacon" }
            //]);
        },

        //  ---
        _onChangeJS: function (newValue) {
            var parser = new Parser(newValue);
            this.ppJson.set("value", parser.prettyJson);
            this.render(parser.obj);
        },

        _onChangePP: function (newValue) {
            var parser = new Parser(newValue);
            this.jsJson.set("value", parser.json);
            this.render(parser.obj);
        },

        render: debounce(function (dashboards) {
            var children = this.tabConatiner.getChildren();
            arrayUtil.forEach(children, function (child, idx) {
                this.tabConatiner.removeChild(child);
                child.destroy();
            }, this);

            if (dashboards) {
                var marshaller = new Marshaller(dashboards);
                arrayUtil.forEach(dashboards, function (dashboard, idx) {
                    var tab = new ContentPane({
                        id: this.id + dashboard.id,
                        title: dashboard.id
                    });
                    this.tabConatiner.addChild(tab);

                    var nodes = [];
                    marshaller.gatherNodes(nodes);
                    var edges = [];
                    marshaller.gatherEdges(edges);
                    this.initTab(tab, nodes, edges);
                }, this);
            }
        })
    });
});
