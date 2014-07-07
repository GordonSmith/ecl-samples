define([
    "dojo/_base/declare",
    "dojo/dom",

    "hpcc/_Widget",
    "hpcc/ESPResource",

    "./USAMap",
    "./BarChart",
    "dojo/text!./tpl/App.html",

    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane"
], function (declare, dom,
    _Widget, ESPResource,
    USAMap, BarChart,
    tpl) {
    return declare([_Widget], {
        templateString: tpl,
        usaSummary: null,
        stateSummary: null,

        resize: function (args) {
            this.inherited(arguments);
            this.widget.BorderContainer.resize();
            this.barChart.resize();
            this.usaMap.resize();
        },

        postCreate: function () {
            this.inherited(arguments);

            //  Process Meta Information For Page (Colours, Title etc.)
            ESPResource.call({}).then(function (response) {
                // var meta = ESPResource.arrayToMap(response.Meta, "key");
                //  TODO - configure page based on meta  ---
            });

            //  Bar Chart  ---
            this.barChart = new BarChart(this.id + "Center");
            this.barChart.init();

            //  Map  ---
            this.usaMap = new USAMap(this.id + "Map");
            this.usaMap.init();

            var context = this;
            this.usaMap.on("clicked", function (d) {
                context.refreshSummaryPage(d);
                context.refreshBarChart(d);
            });

            //  Fetch Summary Data  ---
            var context = this;
            this.fetchSummaryData().then(function (response) {
                context.stateSummary = response;

                //  Total all states for USA Stats  (TODO - Do in ECL) ---
                context.usaSummary = {
                    a1: 0,
                    groupcount: 0
                };
                for (var key in context.stateSummary) {
                    context.usaSummary.a1 += context.stateSummary[key].a1;
                    context.usaSummary.groupcount += context.stateSummary[key].groupcount;
                }

                context.refreshSummaryPage();
            });
        },

        startup: function () {
            this.inherited(arguments);
        },

        fetchSummaryData: function() {
            return ESPResource.callExt("roxie", "statesummary", {
                stateid: ""
            }).then(function (response) {
                return ESPResource.arrayToMap(response.Result, "state");
            });
        },

        refreshSummaryPage: function (stateInfo) {
            var title = stateInfo ? stateInfo.name : "USA";
            var summary = stateInfo ? this.stateSummary[stateInfo.code] : this.usaSummary;

            dom.byId(this.id + "SummaryTitle").innerHTML = title;
            dom.byId(this.id + "PeopleCount").innerHTML = summary.groupcount;
            dom.byId(this.id + "AccountCount").innerHTML = summary.a1;
        },

        refreshBarChart: function (stateInfo) {
            if (stateInfo) {
                var context = this;
                ESPResource.callExt("roxie", "statesummary2", {
                    stateid: stateInfo.code
                }).then(function (response) {
                    context.barChart.render(response.Result);
                });
            } else {
                this.barChart.render([]);
            }
        }
    });
});
