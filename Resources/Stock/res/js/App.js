define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-geometry",

    "hpcc/_Widget",
    "hpcc/ESPResource",

    "d3/d3",

    "dojo/text!./tpl/App.html",

    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane"
], function (declare, lang, on, dom, domGeom,
    _Widget, ESPResource,
    d3,
    tpl) {

    var dc = null;

    return declare([_Widget], {
        templateString: tpl,

        resize: function (args) {
            this.inherited(arguments);
            this.widget.BorderContainer.resize();
            var centerSize = this.getSize(this.widget.Main.domNode);
            this.centerWidth = centerSize.width;
            this.centerHeight = centerSize.height - this.centerHeadersHeight;

            if (this.yearlyBubbleChart) {
                this.resizeCenterCharts();
            }
        },

        resizeCenterCharts: dojoConfig.debounce(function () {
            this.yearlyBubbleChart
                .width(this.centerWidth)
                .height(this.centerHeight * 50 / 100)
            ;
            this.moveChart
                .width(this.centerWidth)
                .height(this.centerHeight * 40 / 100)
            ;
            this.moveChart.legend().x(this.centerWidth - 140);
            this.volumeChart
                .width(this.centerWidth)
                .height(this.centerHeight * 10 / 100)
            ;
            this.yearlyBubbleChart.render();
            this.moveChart.render();
            this.volumeChart.render();
        }),

        postCreate: function (args) {
            this.inherited(arguments);
            require(["dojo/text!hpcc/../crossfilter/crossfilter.js"], lang.hitch(this, function (
                     crossfilterSrc) {
                eval(crossfilterSrc);
                crossfilter = this.crossfilter;
                require(["dc/dc"], lang.hitch(this, function (
                         _dc) {
                    dc = _dc;
                    this.postCreateLHS();
                    this.postCreateCenter();
                    this.postCreateBottom();
                    this.initCharts();

                    ESPResource.callExt("roxie", "fetch_ndx", {
                        dummy: ""
                    }).then(lang.hitch(this, function (response) {
                        /* since its a csv file we need to format the data a bit */
                        this.dateFormat = d3.time.format("%m/%d/%Y");
                        this.numberFormat = d3.format(".2f");

                        response.forEach(function (e) {
                            e.dd = this.dateFormat.parse(e.date);
                            e.month = d3.time.month(e.dd); // pre-calculate month for better performance
                        }, this);
                        this.ndx.add(response);
                        dc.renderAll();
                    }));
                }));
            }));
        },

        postCreateLHS: function () {
            this.quarterChart = dc.pieChart("#quarter-chart");
            this.dayOfWeekChart = dc.rowChart("#day-of-week-chart");
            this.gainOrLossChart = dc.pieChart("#gain-loss-chart");
            this.fluctuationChart = dc.barChart("#fluctuation-chart");
        },
        postCreateCenter: function () {
            this.yearlyBubbleChart = dc.bubbleChart("#yearly-bubble-chart");
            this.moveChart = dc.compositeChart("#monthly-move-chart");
            this.volumeChart = dc.barChart("#monthly-volume-chart");
        },
        postCreateBottom: function () {
            this.dataTable = dc.dataTable(".dc-data-table");
        },

        startup: function () {
            this.inherited(arguments);
        },

        _onResetAll: function (evt) {
            dc.filterAll();
            dc.renderAll();
        },

        _onResetGainOrLoss: function (evt) {
            this.gainOrLossChart.filterAll();
            dc.redrawAll();
        },

        _onResetQuarters: function (evt) {
            this.quarterChart.filterAll();
            dc.redrawAll();
        },

        _onResetDayOfWeek: function (evt) {
            this.dayOfWeekChart.filterAll();
            dc.redrawAll();
        },

        _onFluctuationChart: function (evt) {
            this.fluctuationChart.filterAll();
            dc.redrawAll();
        },

        _onBubbleChart: function (evt) {
            this.yearlyBubbleChart.filterAll();
            dc.redrawAll();
        },

        _onMonthlyMoveChart: function (evt) {
            this.moveChart.filterAll();
            this.volumeChart.filterAll();
            dc.redrawAll();
        },

        getSize: function (node) {
            var pos = domGeom.position(node);
            var pad = domGeom.getPadExtents(node);
            return {
                width: pos.w - pad.w,
                height: pos.h - pad.h
            };
        },

        initCharts: function () {
            var bubbleTitleSize = this.getSize(dom.byId("yearly-bubble-chart"));
            var monthlyMoveSize = this.getSize(dom.byId("monthly-move-chart"));
            var selectTimeSize = this.getSize(dom.byId("select-time"));
            this.centerHeadersHeight = bubbleTitleSize.height + monthlyMoveSize.height + selectTimeSize.height + 12;

            //  Init data  ---
            this.ndx = this.crossfilter();
            var all = this.ndx.groupAll();

            var yearlyDimension = this.ndx.dimension(function (d) {
                return d3.time.year(d.dd).getFullYear();
            });
            var yearlyPerformanceGroup = yearlyDimension.group().reduce(
                /* callback for when data is added to the current filter results */
                function (p, v) {
                    ++p.count;
                    p.absGain += +v.close - +v.open;
                    p.fluctuation += Math.abs(+v.close - +v.open);
                    p.sumIndex += (+v.open + +v.close) / 2;
                    p.avgIndex = p.sumIndex / p.count;
                    p.percentageGain = (p.absGain / p.avgIndex) * 100;
                    p.fluctuationPercentage = (p.fluctuation / p.avgIndex) * 100;
                    return p;
                },
                /* callback for when data is removed from the current filter results */
                function (p, v) {
                    --p.count;
                    p.absGain -= +v.close - +v.open;
                    p.fluctuation -= Math.abs(+v.close - +v.open);
                    p.sumIndex -= (+v.open + +v.close) / 2;
                    p.avgIndex = p.sumIndex / p.count;
                    p.percentageGain = (p.absGain / p.avgIndex) * 100;
                    p.fluctuationPercentage = (p.fluctuation / p.avgIndex) * 100;
                    return p;
                },
                /* initialize p */
                function () {
                    return { count: 0, absGain: 0, fluctuation: 0, fluctuationPercentage: 0, sumIndex: 0, avgIndex: 0, percentageGain: 0 };
                }
            );

            var dateDimension = this.ndx.dimension(function (d) {
                return d.dd;
            });

            /* monthly index avg fluctuation in percentage */
            var moveMonths = this.ndx.dimension(function (d) {
                return d.month;
            });
            var monthlyMoveGroup = moveMonths.group().reduceSum(function (d) {
                return Math.abs(+d.close - +d.open);
            });
            var volumeByMonthGroup = moveMonths.group().reduceSum(function (d) {
                return d.volume / 500000;
            });
            var indexAvgByMonthGroup = moveMonths.group().reduce(
                function (p, v) {
                    ++p.days;
                    p.total += (+v.open + +v.close) / 2;
                    p.avg = Math.round(p.total / p.days);
                    return p;
                },
                function (p, v) {
                    --p.days;
                    p.total -= (+v.open + +v.close) / 2;
                    p.avg = (p.days == 0) ? 0 : Math.round(p.total / p.days);
                    return p;
                },
                function () {
                    return { days: 0, total: 0, avg: 0 };
                }
            );

            var gainOrLoss = this.ndx.dimension(function (d) {
                return +d.open > +d.close ? "Loss" : "Gain";
            });
            var gainOrLossGroup = gainOrLoss.group();

            var fluctuation = this.ndx.dimension(function (d) {
                return Math.round((d.close - d.open) / d.open * 100);
            });
            var fluctuationGroup = fluctuation.group();

            var quarter = this.ndx.dimension(function (d) {
                var month = d.dd.getMonth();
                if (month <= 2)
                    return "Q1";
                else if (month > 3 && month <= 5)
                    return "Q2";
                else if (month > 5 && month <= 8)
                    return "Q3";
                else
                    return "Q4";
            });
            var quarterGroup = quarter.group().reduceSum(function (d) {
                return d.volume;
            });

            var dayOfWeek = this.ndx.dimension(function (d) {
                var day = d.dd.getDay();
                switch (day) {
                    case 0:
                        return "0.Sun";
                    case 1:
                        return "1.Mon";
                    case 2:
                        return "2.Tue";
                    case 3:
                        return "3.Wed";
                    case 4:
                        return "4.Thu";
                    case 5:
                        return "5.Fri";
                    case 6:
                        return "6.Sat";
                }
            });
            var dayOfWeekGroup = dayOfWeek.group();

            //  Init Center Charts ---
            var centerSize = this.getSize(this.widget.Main.domNode);
            var width = centerSize.width;
            var height = centerSize.height - this.centerHeadersHeight;

            this.yearlyBubbleChart
                .width(width)
                .height(height * 50 / 100)
                .margins({ top: 10, right: 50, bottom: 30, left: 40 })
                .dimension(yearlyDimension)
                .group(yearlyPerformanceGroup)
                .transitionDuration(1500)
                .colors(["#a60000", "#ff0000", "#ff4040", "#ff7373", "#67e667", "#39e639", "#00cc00"])
                .colorDomain([-12000, 12000])
                .colorAccessor(function (d) {
                    return d.value.absGain;
                })
                .keyAccessor(function (p) {
                    return p.value.absGain;
                })
                .valueAccessor(function (p) {
                    return p.value.percentageGain;
                })
                .radiusValueAccessor(function (p) {
                    return p.value.fluctuationPercentage;
                })
                .maxBubbleRelativeSize(0.3)
                .x(d3.scale.linear().domain([-2500, 2500]))
                .y(d3.scale.linear().domain([-100, 100]))
                .r(d3.scale.linear().domain([0, 4000]))
                .elasticY(true)
                .yAxisPadding(100)
                .elasticX(true)
                .xAxisPadding(500)
                .renderHorizontalGridLines(true)
                .renderVerticalGridLines(true)
                .renderLabel(true)
                .renderTitle(true)
                .xAxisLabel('Index Gain')
                .yAxisLabel('Index Gain %')
                .label(function (p) {
                    return p.key;
                })
                .title(lang.hitch(this, function (p) {
                    return p.key
                            + "\n"
                            + "Index Gain: " + this.numberFormat(p.value.absGain) + "\n"
                            + "Index Gain in Percentage: " + this.numberFormat(p.value.percentageGain) + "%\n"
                            + "Fluctuation / Index Ratio: " + this.numberFormat(p.value.fluctuationPercentage) + "%";
                }))
                .yAxis().tickFormat(function (v) {
                    return v + "%";
                })
            ;

            this.moveChart
                .width(width)
                .height(height * 40 / 100)
                .transitionDuration(1000)
                .margins({ top: 30, right: 10, bottom: 25, left: 40 })
                .dimension(moveMonths)
                .mouseZoomable(true)
                .x(d3.time.scale().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)]))
                .round(d3.time.month.round)
                .xUnits(d3.time.months)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(width - 140).y(10).itemHeight(13).gap(5))
                .brushOn(false)
                .rangeChart(this.volumeChart)
                .compose([
                    dc.lineChart(this.moveChart)
                            .group(indexAvgByMonthGroup, "Monthly Index Average")
                            .valueAccessor(function (d) {
                                return d.value.avg;
                            })
                            .renderArea(true)
                            .stack(monthlyMoveGroup, "Monthly Index Move", function (d) {
                                return d.value;
                            })
                            .title(lang.hitch(this, function (d) {
                                var value = d.data.value.avg ? d.data.value.avg : d.data.value;
                                if (isNaN(value)) value = 0;
                                return this.dateFormat(d.data.key) + "\n" + this.numberFormat(value);
                            }))
                ])
                .xAxis()
            ;

            this.volumeChart
                .width(width)
                .height(height * 10 / 100)
                .margins({ top: 0, right: 10, bottom: 20, left: 40 })
                .dimension(moveMonths)
                .group(volumeByMonthGroup)
                .elasticY(true)
                .centerBar(true)
                .gap(1)
                .x(d3.time.scale().domain([new Date(1985, 0, 1), new Date(2012, 11, 31)]))
                .round(d3.time.month.round)
                .xUnits(d3.time.months)
            ;

            //  Init LHS Charts ---
            var lhsSize = this.getSize(this.widget.LHS.domNode);

            this.quarterChart
                .width(lhsSize.width)
                .height(lhsSize.width - 40)
                .radius((lhsSize.width - 40) / 2)
                .innerRadius(30)
                .dimension(quarter)
                .group(quarterGroup)
            ;

            this.dayOfWeekChart
                .width(lhsSize.width)
                .height(160)
                .margins({ top: 0, left: 10, right: 20, bottom: 20 })
                .group(dayOfWeekGroup)
                .dimension(dayOfWeek)
                .colors(['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#dadaeb'])
                .label(function (d) {
                    return d.key.split(".")[1];
                })
                .title(function (d) {
                    return d.value;
                })
                .elasticX(true)
                .xAxis().ticks(4)
            ;

            this.gainOrLossChart
                .width(lhsSize.width)
                .height(lhsSize.width - 40)
                .radius((lhsSize.width - 40) / 2)
                .dimension(gainOrLoss) // set dimension
                .group(gainOrLossGroup) // set group
                .label(lang.hitch(this, function (d) {
                    if (this.gainOrLossChart.hasFilter() && !this.gainOrLossChart.hasFilter(d.data.key))
                        return d.data.key + "(0%)";
                    return d.data.key + "(" + Math.floor(d.data.value / all.value() * 100) + "%)";
                }))
            ;

            this.fluctuationChart
                .width(lhsSize.width)
                .height(lhsSize.width - 40)
                .margins({ top: 10, right: 20, bottom: 30, left: 40 })
                .dimension(fluctuation)
                .group(fluctuationGroup)
                .elasticY(true)
                .centerBar(true)
                .gap(1)
                .round(dc.round.floor)
                .x(d3.scale.linear().domain([-10, 10]))
                .renderHorizontalGridLines(true)
                .filterPrinter(lang.hitch(this, function (filters) {
                    var filter = filters[0], s = "";
                    s += this.numberFormat(filter[0]) + "% -> " + this.numberFormat(filter[1]) + "%";
                    return s;
                }))
                .xAxis().ticks(4)
                .tickFormat(function (v) {
                    return v + "%";
                })
            ;
            this.fluctuationChart.yAxis().ticks(5);

            dc.dataCount(".dc-data-count")
                    .dimension(this.ndx)
                    .group(all);

            this.dataTable
                .dimension(dateDimension)
                .group(function (d) {
                    var format = d3.format("02d");
                    return d.dd.getFullYear() + "/" + format((d.dd.getMonth() + 1));
                })
                .size(10)
                .columns([
                    function (d) {
                        return d.date;
                    },
                    function (d) {
                        return d.open;
                    },
                    function (d) {
                        return d.close;
                    },
                    lang.hitch(this, function (d) {
                        return this.numberFormat(d.close - d.open);
                    }),
                    function (d) {
                        return d.volume;
                    }
                ])
                .sortBy(function (d) {
                    return d.dd;
                })
                .order(d3.ascending)
                .renderlet(function (table) {
                    table.selectAll(".dc-table-group").classed("info", true);
                })
            ;
            dc.renderAll();
        }
    });
});
