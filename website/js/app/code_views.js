/****************************************************************
 *
 *
 * Codes Views
 *
 *
 ****************************************************************/

// Namespace 
var IRA = IRA || {};
IRA.Views = IRA.Views || {};
IRA.Views.Codes = IRA.Views.Codes || {};

//
//
// 
//
//

IRA.Views.Codes.MainView = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		console.log('Codesview-init');

		this.render();

		//this.graph = new IRA.Views.Codes.Graph({el: "#graph", model: this.model });
		//this.sidePanel = new IRA.Views.Codes.SidePanel({ el: "#sidepanel", model: this.model });
		
	}, 

	render: function() {
		var template = _.template($("#templ-codes").html());
		this.$el.html( template );
	},

});


//
//
// 
//
//

IRA.Views.Codes.SidePanel = Backbone.View.extend({
	events: {

	},

	initialize: function() {

	},

	render: function() {

	}
});


