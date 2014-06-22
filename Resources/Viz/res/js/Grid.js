(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(["dojo/_base/declare",
            "dgrid/Grid", "dgrid/Keyboard", "dgrid/Selection",
            "./GridBase"], factory);
    } else {
        root.Grid = factory(root.dgridGrid, root.GridBase);
    }
}(this, function (declare,
    dgridGrid, dgridKeyboard, dgridSelection,
    GridBase) {
    function Grid(target, width, height) {
        GridBase.call(this);

        this.version = "0.0.1";

        this.width = width;
        this.height = height;
        this.defaultMargin = 10;
        this.margin = { left: this.defaultMargin, right: this.defaultMargin, top: this.defaultMargin + 5, bottom: this.defaultMargin + 15 };

        this.data = [];

        // Create a new constructor by mixing in the components
        var CustomGrid = declare([dgridGrid, dgridKeyboard, dgridSelection]);

        // Now, create an instance of our custom grid which
        // have the features we added!
        this.grid = new CustomGrid({
            columns: {
            },
            selectionMode: "single", // for Selection; only select a single row at a time
            cellNavigation: false // for Keyboard; allow only row-level keyboard navigation
        }, target);
        this.grid.resize();
        this.grid.renderArray(this.data);
        var context = this;
        this.grid.on(".dgrid-row:click", function (event) {
            var row = context.grid.row(event);
            context.click(row);
        });

        var context = this;

    };
    Grid.prototype = Object.create(GridBase.prototype);

    Grid.prototype.resize = function (width, height) {
        if (this.width != width || this.height != height) {
            this.width = width;
            this.height = height;
        }
        this.grid.resize();
    };

    Grid.prototype.setColumns = function (columns) {
        this.columns = columns;
    },

    Grid.prototype.setData = function (data, append) {
        if (!append) {
            this.data.length = 0;
        }

        var columns = this.columns;
        for (var i = 0; i < data.length; ++i) {
            var row = data[i];
            if (!columns) {
                columns = {};
                if (i === 0) {
                    for (var key in row) {
                        columns[key] = {
                            label: key
                        };
                    }
                }
            }
            this.data.push(row);
        }
        this.grid.set("columns", columns);
        this._update();
    };

    Grid.prototype._update = function () {
        this.grid.setData(this.data);
        this.grid.refresh();
    };

    return Grid;
}));
