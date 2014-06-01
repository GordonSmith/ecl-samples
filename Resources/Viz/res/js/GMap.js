(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["d3", "./GMapBase", "./EntityIcon"], factory);
    } else {
        root.GMap = factory(root.d3, root.GMapBase, root.EntityIcon);
    }
}(this, function (d3, GMapBase, EntityIcon) {
    function GMap(target, width, height) {
        GMapBase.call(this);

        this.version = "0.0.1";

        this.width = width;
        this.height = height;
        this.offsetX = 0;
        this.offsetY = 0;

        this.vertices = [];
        this.verticesCache = {};
        this.edges = [];
        this.edgesCache = {};
        this.arrows = ["arrow"];

        this.entityIcon = new EntityIcon("pin", "", false, 12, 12);

        var context = this;

        //  Zoom  ---
        this.zoom = d3.behavior.zoom()
            .scaleExtent([0.2, 2])
            .on("zoom", zoom)
        ;
        function zoom() {
            context.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        // Create the Google Map
        this.map = new google.maps.Map(d3.select(target).node(), {
            zoom: 3,
            center: new google.maps.LatLng(41.850033, -87.6500523),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        //  SVG  ---
        this.overlay = new google.maps.OverlayView();
        this.overlay.onAdd = function () {
            context.layer = d3.select(this.getPanes().overlayMouseTarget).append("div")
                .attr("class", "stations")
            ;
            context._svg = context.layer.append("svg")
                .attr("width", context.width)
                .attr("height", context.height)
            ;
            context.rect = context._svg.append("rect")
                .attr("class", "zoomLayer")
                .attr("width", context.width - 2)
                .attr("height", context.height - 2)
            ;

            context.defs = context._svg.append("defs");
            context.svg = context._svg.append("g");

            context.overlay.draw = function () {
                var overlayProjection = context.overlay.getProjection();

                var bounds_ = context.map.getBounds();
                var sw = overlayProjection.fromLatLngToDivPixel(bounds_.getSouthWest());
                var ne = overlayProjection.fromLatLngToDivPixel(bounds_.getNorthEast());

                var div = context.layer.node();
                div.style.left = sw.x + 'px';
                div.style.top = ne.y + 'px';
                div.style.width = (ne.x - sw.x) + 'px';
                div.style.height = (sw.y - ne.y) + 'px';

                context.offsetX = sw.x;
                context.offsetY = ne.y;

                context._update();
            };
            google.maps.event.addListener(this.map, 'center_changed', function () {
                context.overlay.draw();
            });
        };
        this.overlay.setMap(this.map);
    };
    GMap.prototype = Object.create(GMapBase.prototype);

    GMap.prototype.resize = function (width, height) {
        if (!this._svg)
            return;

        if (this.width != width || this.height != height) {
            this.width = width;
            this.height = height;

            var div = this.layer.node();
            div.style.width = width + 'px';
            div.style.height = height + 'px';

            this._svg
                .attr("width", this.width)
                .attr("height", this.height)
            ;

            this._svg.select(".zoomLayer")
                .attr("width", this.width - 2)
                .attr("height", this.height - 2)
            ;

            this._update();
        }
    };


    GMap.prototype.setData = function (vertices, edges, append, pos) {
        if (!append) {
            this.vertices.length = 0;
            this.verticesCache = {};
            this.edges.length = 0;
            this.edgesCache = {};
        }
        var latlngbounds = new google.maps.LatLngBounds();
        for (var i = 0; i < vertices.length; ++i) {
            var item = vertices[i];
            item.first = (i === 0);
            item.last = (i === vertices.length - 1);

            if (!this.verticesCache[item.id]) {
                this.verticesCache[item.id] = item;
                this.vertices.push(item);
                var gLatLong = new google.maps.LatLng(item.geo_lat, item.geo_long);
                latlngbounds.extend(gLatLong);
            }
        }
        for (var i = 0; i < edges.length; ++i) {
            var item = edges[i];
            var source = item.sourceID;
            var target = item.targetID;
            if (source !== target) {
                item.source = this.verticesCache[source];
                item.target = this.verticesCache[target];
                item.id = item.source.id + "-" + item.target.id;
                if (!this.edgesCache[item.id]) {
                    this.edgesCache[item.id] = item;
                    this.edges.push(item);
                }
            }
        }
        this._update();
        this.map.setCenter(latlngbounds.getCenter());
        this.map.fitBounds(latlngbounds);
    };

    GMap.prototype._update = function () {
        if (!this.svg)
            return;

        this._updateArrows();
        this._updateVertices();
        this._updateEdges();
    };

    GMap.prototype._updateArrows = function () {
        var projection = this.overlay.getProjection();

        var arrow = this.defs.selectAll("marker").data(this.arrows);
        arrow.each(transform);
        arrow.enter().append("marker")
            .each(transform)
            .attr("id", function (d) { return d; })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
          .append("path")
            .attr("d", "M0,-5L10,0L0,5")
        ;
        arrow.exit().remove();

        function transform(d) {
        }
    };
    
    GMap.prototype._updateEdges = function () {
        var context = this;
        var edge = this.svg.selectAll(".edge").remove();    //  IE Bug Workaround  ---
        var edge = this.svg.selectAll(".edge").data(this.edges, function (d, index) {
            return d.id;
        });
        edge.each(transform);
        edge.enter().insert("path", ":first-child")
            .each(transform)
            .attr("class", "edge")
            .attr("marker-end", "url(#arrow)")
            .on("click", function (d) { context.edge_click(d, this); })
            .on("dblclick", function (d) { context.edge_dblclick(d, this); })
            .on("mouseover", function (d) { context.edge_mouseover(d, this); })
            .on("mouseout", function (d) { context.edge_mouseout(d, this); })
        ;
        edge.exit().remove();
        function transform(d) {
            var dx = d.target.geo_x - d.source.geo_x,
                dy = d.target.geo_y - d.source.geo_y,
                dr = Math.sqrt(dx * dx + dy * dy) * 2;
            return d3.select(this)
                .attr("d", function (d) {
                    return "M" + d.source.geo_x + "," + d.source.geo_y + "A" + dr + "," + dr + " 0 0,1 " + d.target.geo_x + "," + d.target.geo_y;
                })
            ;
        };
    };

    GMap.prototype._updateVertices = function () {
        var padding = 0;
        var projection = this.overlay.getProjection();

        var context = this;
        var vertex = this.svg.selectAll(".translateVertex").data(this.vertices, function (d) { return d.id; });
        vertex.each(transform);
        var translateVertex = vertex.call(this.entityIcon._update.bind(this.entityIcon))
            .attr("class", "translateVertex")
            .each(transform)
        ;
        vertex.exit().remove();

        function transform(d) {
            var tmp = new google.maps.LatLng(d.geo_lat, d.geo_long);
            tmp = projection.fromLatLngToDivPixel(tmp);
            d.geo_x = tmp.x - context.offsetX;
            d.geo_y = tmp.y - context.offsetY;

            if (d.first || d.last) {
                this.parentNode.appendChild(this);
            }
            var skew = 0;
            if (d.first) {
                skew = 10;
            } else if (d.last) {
                skew = -10;
            }
            return d3.select(this)
                .attr("class", function (d) {
                    if (d.first && d.last) {
                    } else if (d.first) {
                        return "translateVertex first";
                    } else if (d.last) {
                        return "translateVertex last";
                    }
                    return "translateVertex";
                })
                .attr("transform", "translate(" + [d.geo_x - padding, d.geo_y - padding] + ")skewX(" + skew + ")")
            ;
        }
    };

    return GMap;
}));
