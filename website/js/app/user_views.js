/****************************************************************
 *
 *
 * User Views
 *
 *
 ****************************************************************/

// Namespace 
var IRA = IRA || {};
IRA.Views = IRA.Views || {};
IRA.Views.Users = IRA.Views.Users || {};

//
//
// 
//
//

IRA.Views.Users.MainView = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		console.log('mainview-init');

		this.render();

		this.graph = new IRA.Views.Overall.Graph({el: "#graph", model: this.model });
		this.sidePanel = new IRA.Views.Overall.SidePanel({ el: "#sidepanel", model: this.model });
		
	}, 

	render: function() {
		var template = _.template($("#templ-users").html());
		this.$el.html( template );
	},

});


//
//
// 
//
//

IRA.Views.Users.SidePanel = Backbone.View.extend({
	events: {

	},

	initialize: function() {

	},

	render: function() {

	}
});


