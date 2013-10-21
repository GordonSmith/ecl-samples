define([
  "dojo/_base/declare",
  "dojo/_base/lang"

], function (declare, lang) {
    return declare(null, {
        delegateItem: function (item, mappings) {
            if (!item)
                return item;

            var retVal = {};
            for (var key in mappings) {
                if (lang.exists(mappings[key], item)) {
                    if (Object.prototype.toString.call(item[mappings[key]]) === '[object Array]') {
                        retVal[key] = this.delegateArray(item[mappings[key]], mappings);
                    } else if (!isNaN(parseFloat(item[mappings[key]]))) {
                        retVal[key] = parseFloat(item[mappings[key]]);
                    } else {
                        retVal[key] = item[mappings[key]].trim();
                    }
                }
            }
            return retVal;
        },

        delegateArray: function (arr, mappings) {
            if (!arr)
                return arr;

            return arr.map(lang.hitch(this, function (item) {
                return this.delegateItem(item, mappings);
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
            this.SvgG = d3.select(this.target.domNode).append("svg")
                .attr("width", this.target.width)
                .attr("height", this.target.height).append("g")
            ;
        }
    });
});
