(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["lib/graphlib/graphlib"], factory);
    } else {
        root.GraphData = factory();
    }
}(this, function () {
    function GraphData() {
        graphlib.Digraph.call(this);
    };
    GraphData.prototype = Object.create(graphlib.Digraph.prototype);

    GraphData.prototype.setData = function (vertices, edges, merge) {
        var context = this;
        var retVal = {
            addedVertices: [],
            addedEdges: []
        }

        //  Add new items  ---
        for (var i = 0; i < vertices.length; ++i) {
            var entity = vertices[i];
            var item = entity.data();
            if (!merge || !this.hasNode(item.id)) {
                try {
                    var newItem = {
                        id: item.id,
                        __entity: entity,
                        //__data: item,
                        __viz: item.__viz ? item.__viz : {}
                    };
                    this.addNode(item.id, newItem)
                    retVal.addedVertices.push(newItem);
                } catch (e) {
                    var d = 0;
                }
            }
        }
        for (var i = 0; i < edges.length; ++i) {
            var edge = edges[i];
            var item = edge.data();
            if (item.id === undefined) {
                item.id = item.source + "->" + item.target;
            }
            if (!merge || !this.hasEdge(item.id)) {
                edge.__source = this.node(item.source);
                edge.__target = this.node(item.target);
                try {
                    this.addEdge(item.id, item.source, item.target, {
                        id: item.id,
                        __edge: edge,
                        __data: item,
                        __viz: item.__viz ? item.__viz : {}
                    });
                } catch (e) {
                    var d = 0;
                }
            }
        }
        //  Remove old items  ---
        if (merge) {
            var edgeIDs = edges.map(function (item) { return item.data().id; });
            this.filterEdges(function (item) { return edgeIDs.indexOf(item) < 0; })
                .forEach(function (item) {
                    try {
                        context.delEdge(item);
                    } catch (e) {
                        var d = 0;
                    }
                })
            ;
            var vertexIDs = vertices.map(function (item) { return item.data().id; });
            this.filterNodes(function (item) { return vertexIDs.indexOf(item) < 0; }).nodes()
                .forEach(function (item) {
                    try {
                        context.delNode(item);
                    } catch (e) {
                        var d = 0;
                    }
                })
            ;
        }
        return retVal;
    };

    GraphData.prototype.filterEdges = function (pred) {
        var filtered = [];
        this.eachEdge(function (e) {
            if (pred(e)) {
                filtered.push(e);
            }
        });
        return filtered;
    };

    GraphData.prototype.nodeValues = function () {
        var retVal = [];
        this.eachNode(function (u, value) {
            value.id = u;
            retVal.push(value);
        });
        return retVal;
    };

    GraphData.prototype.edgeValues = function () {
        var retVal = [];
        var context = this;
        this.eachEdge(function (e, source, target, value) {
            value.id = e;
            value.source = context.node(source);
            value.target = context.node(target);
            retVal.push(value);
        });
        return retVal;
    };


    return GraphData;
}));
