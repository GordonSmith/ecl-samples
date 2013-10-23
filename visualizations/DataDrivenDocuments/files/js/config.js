var hpccConfig = {
    ESPRoot: "/esp/files",
    LocalRoot: location.pathname.replace(/\/[^/]+$/, ""),
    HostName: location.hostname,
    Port: location.port,

    getBaseUrl: function (service, action) {
        var retVal = "";
        if (service == "WsEcl") {
            retVal = "http://" + this.HostName + ":8002";
        } else if (this.Crosssite == true) {
            retVal = "http://" + this.HostName + ":8010";
        }
        retVal += "/" + service + "/" + action + "/";
        return retVal;
    }
};
var LocalRootParts = hpccConfig.LocalRoot.split("/");
hpccConfig.Wuid = LocalRootParts[this.LocalRootParts.length - 1];

//  Are we local debug mode?  ---
if (hpccConfig.Wuid === "files") {
    hpccConfig.Crosssite = true;
    hpccConfig.ServerIP = "192.168.1.201";
    hpccConfig.HostName = hpccConfig.ServerIP;
}

var dojoConfig = {
    async: true,
    parseOnLoad: false,
    ServerIP: hpccConfig.ServerIP,
    packages: [
    {
        name: "js",
        location: hpccConfig.LocalRoot + "/js"
    }, {
        name: "hpcc",
        location: hpccConfig.getBaseUrl("esp", "files/scripts")
    }]
};
