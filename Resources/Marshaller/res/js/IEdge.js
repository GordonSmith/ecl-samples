(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.IEdge = factory();
    }
}(this, function () {
    function IEdge() {
    };

    //  API  ---
    IEdge.prototype.setData = function (item) {
        console.log("setData");
    };
    
    //  Events  ---
    IEdge.prototype.click = function (element, d) {
        console.log("click");
    };

    IEdge.prototype.dblclick = function (element, d) {
        console.log("dblclick");
    };

    IEdge.prototype.mouseover = function (element, d) {
        console.log("mouseover");
    };

    IEdge.prototype.mouseout = function (element, d) {
        console.log("mouseout");
    };

    return IEdge;
}));
