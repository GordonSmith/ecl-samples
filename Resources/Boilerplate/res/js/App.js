define([
    "dojo/_base/declare",
    "dojo/on",
    "dojo/dom",

    "hpcc/_Widget",
    "hpcc/ESPResource",

    "dojo/text!./tpl/App.html"

], function (declare, on, dom,
    _Widget, ESPResource,
    tpl) {
    return declare([_Widget], {
        templateString: tpl,

        main: function () {
            var str1Input = dom.byId("Str1Input");
            var str2Input = dom.byId("Str2Input");
            var submitButton = dom.byId("SubmitButton");
            var ResultInput = dom.byId("ResultInput");

            on(submitButton, "click", function (evt) {
                //  Fetch Data  ---
                ESPResource.call({
                    str1: Str1Input.value,
                    str2: Str2Input.value
                }).then(function (response) {
                    ResultInput.value = response["Result 1"][0].Result_1;
                });
            });
        }
    });
});
