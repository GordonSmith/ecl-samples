define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/json",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/aspect",
    "dojo/has",

    "dijit/registry",
    "dijit/layout/ContentPane",

    "dojox/widget/Portlet",

    "hpcc/_Widget",
    "hpcc/ESPResource",
    "hpcc/WsEcl",

    "js/Graph",
    "js/Entity",
    "js/Choropleth",
    "js/Pie",

    "dojo/text!./tpl/marshal.html",

    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/form/SimpleTextarea",
    "dojox/layout/GridContainer"

], function (declare, lang, arrayUtil, JSON, dom, domConstruct, domGeom, aspect, has,
    registry, ContentPane,
    Portlet,
    _Widget, ESPResource, WsEcl,
    Graph, Entity, Choropleth, Pie,
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

            this.call({}, true);
        },

        accept: function (visitor) {
            visitor.visit(this);
            for (var key in this.outputs) {
                this.outputs[key].accept(visitor);
            }
        },

        call: function (request, refresh) {
            this.request = {
                refresh: refresh ? true : false
            };
            arrayUtil.forEach(this.filter, function (item) {
                this.request[item] = "";
                this.request[item + "_changed"] = false;
            }, this);
            lang.mixin(this.request, request);
            for (var key in request) {
                this.request[key + "_changed"] = true;
            }

            var context = this;
            return WsEcl.CallURL(this.URL, this.request).then(function (response) {
                for (var key in context.outputs) {
                    if (lang.exists(key.toLowerCase(), response) && lang.exists(key.toLowerCase() + "_changed", response) && response[key.toLowerCase() + "_changed"].length && response[key.toLowerCase() + "_changed"][0][key.toLowerCase() + "_changed"]) {
                        context.outputs[key].setData(response[key.toLowerCase()]);
                    }
                };
            });
        }
    });

    var Output = declare(null, {
        constructor: function (dataSource, args) {
            this.dataSource = dataSource;
            declare.safeMixin(this, args);
        },

        accept: function (visitor) {
            visitor.visit(this);
        },

        setData: function (data) {
            this.data = data;
            arrayUtil.forEach(this.notify, function (item, idx) {
                var viz = this.dataSource.dashboard.Visualizations[item];
                viz.notify();
            }, this);
        }
    });

    var Visualization = declare(null, {
        constructor: function (dashboard, args) {
            this.dashboard = dashboard;
            declare.safeMixin(this, args);
        },

        accept: function (visitor) {
            visitor.visit(this);
        },

        notify: function () {
            var dataSource = this.dashboard.DataSources[this.source.id];
            var context = this;
            if (dataSource.outputs[this.source.output].data) {
                var data = dataSource.outputs[this.source.output].data.map(function (item) {
                    var retVal = {};
                    for (var key in context.source.mappings) {
                        var rhsKey = context.source.mappings[key].toLowerCase();
                        var val = item[rhsKey];
                        retVal[key] = val;
                    }
                    return retVal;
                });
                this.viz
                    .data(data)
                    .render()
                ;
            }
        },

        click: function (d) {

            if (this.onSelect) {
                //  Temp Hack  ---
                var reverseSourceMappings = {};
                for (var key in this.source.mappings) {
                    reverseSourceMappings[this.source.mappings[key]] = key;
                }

                var request = {};
                for (var key in this.onSelect.mappings) {
                    var hackKey = reverseSourceMappings[key];
                    request[key] = d[hackKey];
                }
                var dataSource = this.dashboard.DataSources[this.source.id];
                dataSource.call(request);
            }
        },

        //  Debug  ---
        sourceMappingLabel: function () {
            if (!this.source.mappings)
                return null;

            var retVal = "";
            for (var key in this.source.mappings) {
                if (retVal) {
                    retVal += "\n";
                }
                retVal += this.source.mappings[key] + " -> " + key;
            }
            return retVal;
        },

        onSelectMappingLabel: function () {
            if (!this.onSelect || !this.onSelect.mappings)
                return null;

            var retVal = "onSelect";
            for (var key in this.onSelect.mappings) {
                if (retVal) {
                    retVal += "\n";
                }
                retVal += this.onSelect.mappings[key] + " -> " + key;
            }
            return retVal;
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
            this.jsJson = registry.byId(this.id + "MarshalJS");
            this.ppJson = registry.byId(this.id + "MarshalPP");
        },

        startup: function () {
            this.inherited(arguments);
            this.initCenter();

            var context = this;
            this._onGo();
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
            //this.choropleth = new Choropleth()
            //    .target("choropleth")
            //;

            var size = this.getSize(this.widget.Main.domNode);
            this.graph = new Graph(this.widget.Main.id, size.width, size.height);
            this.graph.layoutHierarchy();

            var context = this;
            this.graph.vertex_click = function(element, d) {
                Graph.prototype.vertex_click.call(this, element, d);
                //context.entity
                 //   .data(d)
                  //  .render()
                //;
                //context.entity._svg.select(".vertexLabel").attr("transform", "translate(" + [200 / 2, 200 / 2] + ")");
            }

            aspect.after(this.widget.Main, "resize", debounce(function () {
                var size = context.getSize(context.widget.Main.domNode);
                context.graph.resize(size.width, size.height);
            }));
        },

        //  ---
        _onGo: function (evt) {
            var targetURL = this.widget.URL.get("value");
            var context = this;
            return WsEcl.CallURL(targetURL, {
            }).then(function (response) {
                if (lang.exists("HIPIE_DDL", response) && response.HIPIE_DDL.length) {
                    var ddl = response.HIPIE_DDL[0].HIPIE_DDL;
                    var ddlParts = ddl.split("<RoxieBase>\\");
                    var urlEndQuote = ddlParts[1].indexOf("\"");
                    ddlParts[1] = ddlParts[1].substring(urlEndQuote);
                    ddl = ddlParts.join(targetURL);
                    context._onChangeJS(ddl);
                    //context._onChangePP(ddl);
                }
            });
        },

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
            //this.jsJson.set("value", parser.json);
            this.render(parser.obj);
        },

        render: debounce(function (dashboards) {
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
                            vertices.push(new Entity.Vertex()
                                .class("vertexLabel")
                                .id(item.id)
                                .data(lang.mixin({}, item, {
                                    label: item.id + params,
                                    __viz: {
                                        icon: "\uf1c0"
                                    }
                                }))
                            );
                        } else if(item instanceof Output) {
                            vertices.push(new Entity.Vertex()
                                .class("vertexLabel")
                                .id(item.dataSource.id + "." + item.id)
                                .data(lang.mixin({}, item, {
                                    id: item.dataSource.id + "." + item.id,
                                    label: item.id,
                                    __viz: {
                                        icon: "\uf0ce"
                                    }
                                }))
                            );
                        } else if (item instanceof Visualization) {
                            item.viz = null;
                            switch (item.type) {
                                case "CHORO":
                                    item.viz = new Choropleth()
                                        .class("vertexChoro")
                                        .id(item.id)
                                    ;
                                    break;
                                case "PIE":
                                    item.viz = new Pie()
                                        .class("vertexPie")
                                        .id(item.id)
                                    ;
                                    break;
                                default:
                                    item.viz = new Entity.Vertex()
                                        .class("vertexLabel")
                                        .id(item.id)
                                        .data(lang.mixin({}, item, {
                                            label: item.id + "\n[" + item.type + "]",
                                            __viz: {
                                                icon: "\uf080"
                                            }
                                        }))
                                    ;
                                    break;
                            }
                            item.viz.click = function (element, d) {
                                item.click(d);
                            }
                            vertices.push(item.viz);
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
                                    label: item.sourceMappingLabel(),
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
                                    label: item.onSelectMappingLabel(),
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
