define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/json",
    "dojo/dom-geometry",
    "dojo/aspect",
    "dojo/has",

    "dijit/registry",
    "dijit/layout/ContentPane",

    "hpcc/_Widget",
    "hpcc/ESPResource",
    "hpcc/WsEcl",

    "js/Graph",
    "js/Entity",

    "dojo/text!./tpl/marshal.html",

    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/form/SimpleTextarea"

], function (declare, lang, arrayUtil, JSON, domGeom, aspect, has,
    registry, ContentPane,
    _Widget, ESPResource, WsEcl,
    Graph, Entity,
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

        accept: function(visitor) {
            visitor.visit(this);
            for (var key in this.dashboards) {
                this.dashboards[key].accept(visitor);
            }
        }
    });

    var Dashboard = declare(null, {
        constructor: function (marshaller, args) {
            this.marshaller = marshaller;
            declare.safeMixin(this, args);

            var DataSources = {};
            arrayUtil.forEach(this.datasources, function (item, idx) {
                DataSources[item.id] = new DataSource(this, item);
            }, this);
            this.DataSources = DataSources;

            var Visualizations = {};
            arrayUtil.forEach(this.visualizations, function (item, idx) {
                Visualizations[item.id] = new Visualization(this, item);
            }, this);
            this.Visualizations = Visualizations;
        },

        accept: function (visitor) {
            visitor.visit(this);
            for (var key in this.DataSources) {
                this.DataSources[key].accept(visitor);
            }
            for (var key in this.Visualizations) {
                this.Visualizations[key].accept(visitor);
            }
        }
    });

    var DataSource = declare(null, {
        constructor: function (dashboard, args) {
            this.dashboard = dashboard;
            declare.safeMixin(this, args);
            var outputs = {};
            arrayUtil.forEach(this.outputs, function (item, idx) {
                outputs[item.id] = new Output(this, item);
            }, this);
            this.outputs = outputs;
        },

        accept: function (visitor) {
            visitor.visit(this);
            for (var key in this.outputs) {
                this.outputs[key].accept(visitor);
            }
        }
    });

    var Output = declare(null, {
        constructor: function (dataSource, args) {
            this.dataSource = dataSource;
            declare.safeMixin(this, args);
        },

        accept: function (visitor) {
            visitor.visit(this);
        }
    });

    var Visualization = declare(null, {
        constructor: function (dashboard, args) {
            this.dashboard = dashboard;
            declare.safeMixin(this, args);
        },

        accept: function (visitor) {
            visitor.visit(this);
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
            this.initCenter();
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

        initCenter: function() {
            this.entity = new Entity("entity", "vertexLabel");

            var size = this.getSize(this.widget.Main.domNode);
            this.graph = new Graph(this.widget.Main.id, size.width, size.height, has("ie") || has("trident"));
            this.graph.layoutHierarchy();

            var context = this;
            this.graph.vertex_click = function(element, d) {
                Graph.prototype.vertex_click.call(this, element, d);
                context.entity
                    .data(d)
                    .render()
                ;
                context.entity._svg.select(".vertexLabel").attr("transform", "translate(" + [200 / 2, 200 / 2] + ")");
            }

            aspect.after(this.widget.Main, "resize", debounce(function () {
                var size = context.getSize(context.widget.Main.domNode);
                context.graph.resize(size.width, size.height);
            }));

        },

        //  ---
        _onCircle: function (evt) {
            this.graph.layoutCircle();
        },
        _onForceDirected: function (evt) {
            this.graph.layoutForceDirected();
        },
        _onForceDirected2: function (evt) {
            this.graph.layoutForceDirected2();
        },
        _onHierarchy: function (evt) {
            this.graph.layoutHierarchy();
        },
        
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
                var vertices = [];
                marshaller.accept({
                    visit: function (item) {
                        if (item instanceof DataSource) {
                            var params = "(";
                            arrayUtil.forEach(item.filter, function (item, idx) {
                                if (idx > 0) {
                                    params += ", ";
                                }
                                params += item;
                            });
                            params += ")";
                            vertices.push(lang.mixin({}, item, {
                                label: item.id + params,
                                __viz: {
                                    icon: "\uf1c0"
                                }
                            }));
                        } else if(item instanceof Output) {
                            vertices.push(lang.mixin({}, item, {
                                id: item.dataSource.id + "." + item.id,
                                label: item.id,
                                __viz: {
                                    icon: "\uf0ce"
                                }
                            }));
                        } else if (item instanceof Visualization) {
                            vertices.push(lang.mixin({}, item, {
                                label: item.id + "\n[" + item.type + "]",
                                __viz: {
                                    icon: "\uf080"
                                }
                            }));
                        }
                    }
                });
                var edges = [];
                marshaller.accept({
                    visit: function (item) {
                        if (item instanceof DataSource) {
                        } else if (item instanceof Output) {
                            edges.push(lang.mixin({}, item, {
                                id: item.dataSource.id + "-" + item.dataSource.id + "." + item.id,
                                source: item.dataSource.id,
                                target: item.dataSource.id + "." + item.id
                            }));
                        } else if (item instanceof Visualization) {
                            if (lang.exists("source.id", item)) {
                                edges.push({
                                    id: item.source.id + "-" + item.source.output,
                                    source: item.source.id + "." + item.source.output,
                                    target: item.id,
                                    __viz: {
                                        footer: "circleFoot",
                                        header: "circleHead"
                                    }
                                });
                            }
                            if (lang.exists("onSelect.updates.visualization", item)) {
                                edges.push({
                                    id: item.id + "-" + item.onSelect.updates.visualization,
                                    source: item.id,
                                    target: item.onSelect.updates.visualization,
                                    label: "onSelect",
                                    __viz: {
                                        header: "arrowHead"
                                    }
                                });
                            }
                        }
                    }
                });
                this.graph
                    .data({
                        vertices: vertices,
                        edges: edges,
                        merge: true
                    })
                    .render()
                ;
            }
        })
    });
});
