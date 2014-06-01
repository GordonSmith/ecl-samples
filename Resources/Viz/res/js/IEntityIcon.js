(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.IEntityIcon = factory();
    }
}(this, function () {
    function IEntityIcon() {
    };

    //  Inputs  ---
    //  Outputs  ---
    //  Events  ---
    IEntityIcon.prototype.click = function (d, self) {
        console.log("click");
    };

    IEntityIcon.prototype.dblclick = function (d, self) {
        console.log("dblclick");
    };

    IEntityIcon.prototype.mouseover = function (d, self) {
        console.log("mouseover");
    };

    IEntityIcon.prototype.mouseout = function (d, self) {
        console.log("mouseout");
    };

    return IEntityIcon;
}));
