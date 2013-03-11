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
		mode: -1,
		data: null,
		overall_data: null,
		code_data: null,
		user_data: null
	},

	getData: function() {
		switch(+this.get("mode")) {
			case 0:
				return this.get("overall_data");
			case 1:
				return this.get("user_data");
			case 2:
				return this.get("code_data");
		}
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
		data: null,
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


//
// Layer Model
//
IRA.Models.Layer = Backbone.Model.extend({
	defaults: {
		id: -1,
		name: "",
		details: "",
		visible: true,
		spotlight: false
	},

	initialize: function() {

	}
});


IRA.Models.LayerCollection = Backbone.Collection.extend({
	model: IRA.Models.Layer
});

//
// 
//




