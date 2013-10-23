define([
  "dojo/_base/declare",
  "dojo/_base/lang"

], function (declare, lang) {
    return declare(null, {
        constructor: function (mappings) {
            this.mappings = mappings;
            this.rmappings = {};
            for (var key in mappings) {
                this.rmappings[mappings[key]] = key;
            }
        },

        delegateItem: function (item) {
            if (!item)
                return item;

            var retVal = {};
            for (var key in this.mappings) {
                if (lang.exists(this.mappings[key], item)) {
                    var val = item[this.mappings[key]];
                    if (val == null) {
                        retVal[key] = "";
                    } else if (Object.prototype.toString.call(val) === '[object Array]') {
                        retVal[key] = this.delegateArray(val);
                    } else if (!isNaN(parseFloat(val))) {
                        retVal[key] = parseFloat(val);
                    } else {
                        retVal[key] = val.trim();
                    }
                }
            }
            return retVal;
        },

        delegateArray: function (arr) {
            if (!arr)
                return arr;

            return arr.map(lang.hitch(this, function (item) {
                return this.delegateItem(item);
            }));
        },

        mixinTarget: function (_target) {
            this.target = lang.mixin({
                domNode: "",
                width: 500,
                height: 500
            }, _target);
            lang.mixin(this.target, {
                diameter: Math.min(this.target.width, this.target.height)
            });
            lang.mixin(this.target, {
                radius: this.target.diameter / 2
            });
            return this.target;
        },

        createSvgG: function (_target) {
            this.mixinTarget(_target);
            this.Svg = d3.select(this.target.domNode).append("svg")
                .attr("width", this.target.width)
                .attr("height", this.target.height)
            ;
            this.SvgG = this.Svg.append("g");
        }
    });
});
