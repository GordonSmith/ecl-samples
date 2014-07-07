(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["lib/d3/d3", "lib/dagre/dagre"], factory);
    } else {
        root.GraphLayouts = factory(root.d3);
    }
}(this, function (d3) {
    function Circle(graphData, width, height, radius) {
        var context = this;
        this.graphData = graphData;
        this.pos = {};

        //  Initial Positions  ---
        var padding = 100;
        radius = radius || (width < height ? width - padding : height - padding) / 2;
        var order = graphData.order();
        var currStep = -Math.PI / 2;
        var step = 2 * Math.PI / order;
        graphData.eachNode(function (u, value) {
            context.pos[u] = {
                x: value.fixed ? value.x : width / 2 + Math.cos(currStep) * radius,
                y: value.fixed ? value.y : height / 2 + Math.sin(currStep) * radius,
                width: value.width,
                height: value.height
            }
            currStep += step; 
        });
    };
    Circle.prototype.node = function(u) {
        return this.pos[u];        
    };
    Circle.prototype.edge = function(e) {
        return { points: [] };        
    };

    function ForceDirected(graphData, width, height) {
        var context = this;
        this.graphData = graphData;
        this.pos = {};

        this.force = d3.layout.force()
            .charge(-800)
            .linkDistance(300)
            .size([width, height])
            .nodes(this.graphData.nodeValues())
            .links(this.graphData.edgeValues())
        ;
        this.force.start();
        var total = this.graphData.size();
        for (var i = 0; i < total; ++i) {
            this.force.tick();
        }
        this.force.stop();
    };
    ForceDirected.prototype.node = function (u) {
        return this.graphData.node(u);
    };
    ForceDirected.prototype.edge = function (e) {
        return { points: [] };
    };

    function Hierarchy(graphData, width, height) {
        this.dagreLayout = dagre.layout().run(graphData);
        var deltaX = (width - this.dagreLayout._value.width) / 2;
        var deltaY = (height - this.dagreLayout._value.height) / 2;
        this.dagreLayout.eachNode(function (u, value) {
            value.x += deltaX;
            value.y += deltaY;
        });
        this.dagreLayout.eachEdge(function (e, s, t, value) {
            for (var i = 0; i < value.points.length; ++i) {
                value.points[i].x += deltaX;
                value.points[i].y += deltaY;
            }
        });
    };
    Hierarchy.prototype.node = function (u) {
        return this.dagreLayout.node(u);
    };
    Hierarchy.prototype.edge = function (e) {
        return this.dagreLayout.edge(e);
    };

    Layouts = {
        Circle: Circle,
        ForceDirected: ForceDirected,
        Hierarchy: Hierarchy
    };

    return Layouts;
}));
