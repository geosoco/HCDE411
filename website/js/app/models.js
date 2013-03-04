/****************************************************************
 *
 *
 * Models
 *
 *
 ****************************************************************/

// Namespace 
var IRA = IRA || {};
IRA.Models = IRA.Models || {};

//
//
//
IRA.Models.SelectedMode = Backbone.Model.extend({
	defaults: {
		mode: -1
	}
})


//
//
//
IRA.Models.SelectedSession = Backbone.Model.extend({
	defaults: {
		year: 0,
		yearIdx: -1,
		date: null,
		data: null
	}
});


//
//
//
IRA.Models.LineGraphModel = Backbone.Model.extend({
	defaults: {
		data: [[]],
		margins: [10, 10, 20, 40],
		xAxisLabel: "",
		yAxisLabel: "",
		lineInterpolation: "linear",
	},

	initialize: function() {

	},

	dataChanged: function(ev) {

	}
});

