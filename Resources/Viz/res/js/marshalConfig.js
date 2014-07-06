var dojoConfig = (function () {
    var espUrl = "/esp/files";
    var pathNodes = location.pathname.split("/");
    pathNodes.pop();
    var localUrl = pathNodes.join("/");
    return {
        async: true,
        selectorEngine: "lite",
        packages: [{
            name: "d3",
            location: espUrl + "/d3",
            main:"d3"
        }, {
            name: "topojson",
            location: espUrl + "/topojson"
        }, {
            name: "lib",
            location: localUrl + "/lib"
        }, {
            name: "js",
            location: localUrl + "/js"
        }]
    };
})();
