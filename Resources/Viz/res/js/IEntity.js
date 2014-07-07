(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else {
        root.IEntity = factory();
    }
}(this, function () {
    function IEntity() {
    };

    //  API  ---
    IEntity.prototype.target = function () {
        console.log("target");
    };

    IEntity.prototype.render = function () {
        console.log("render");
    };

    IEntity.prototype.data = function (data) {
        console.log("data");
    };
    
    //  Mode:  Hierarchy, ForceDirected, , ForceDirected2, Circle
    IEntity.prototype.doLayout = function (mode) {
        console.log("doLayout");
    };
  
    //  Events  ---
    IEntity.prototype.click = function (element, d) {
        console.log("click");
    };

    IEntity.prototype.dblclick = function (element, d) {
        console.log("dblclick");
    };

    IEntity.prototype.mouseover = function (element, d) {
        console.log("mouseover");
    };

    IEntity.prototype.mouseout = function (element, d) {
        console.log("mouseout");
    };

    return IEntity;
}));
