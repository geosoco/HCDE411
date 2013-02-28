
/****************************************************************
 *
 *
 * Models
 *
 *
 ****************************************************************/

window.SelectedMode = Backbone.Model.extend({
	defaults: {
		mode: 0
	}
})

window.SelectedSession = Backbone.Model.extend({
	defaults: {
		year: 2004,
		date: null
	},

	initialize: function() {

	}
});




window.SessionDates = Backbone.Collection.extend({
	model: SessionDate
})

window.SessionYear = Backbone.Model.extend({
	initialize: function(options) {
        this.dates = new SessionDates(options.values);
    },

    parse: function(res) {
        res.values && this.dates.reset(res.values);

        return res;
    },

    toJSON: function(){
        return _.extend(
            _.pick(this.attributes, 'key'), {
            dates: this.dates.toJSON(),
        });
    }
});


window.YearList = Backbone.Collection.extend({
	model: SessionYear
});

/****************************************************************
 *
 *
 * Views
 *
 *
 ****************************************************************/



window.YearSelect = Backbone.View.extend({
	events: {
		"click a": 	"selchanged"
	},

	initialize: function() {
		this.render();
		//this.selected = this.collection.at(0).attributes.key;
		evSessionYear.trigger("change", this.selected);
	},

	render: function() {
		/*
		this.$el.empty();

		var list = _.template('<% _.each(years, function(year) { %> <li><a><%= year.key %></a></li><% }); %>', {years: this.collection.toJSON()} );
		this.$el.html(list);
		*/
	},

	selchanged: function(ev) {
		console.dir(ev);
		this.selected = ev.srcElement.text;

		// should be in render
		$('li', this.$el).attr('class','');
        $(ev.target).parent().attr('class','active');

        // trigger event
		evSessionYear.trigger("change", this.selected);
	}
});



window.SessionDatesView = Backbone.View.extend({
	events: {
		"click g.session"
	},

	initialize: function() {

	},

	render: function() {

	},


	selchanged: function(ev) {

	}
});



/****************************************************************
 *
 *
 * Router
 *
 *
 ****************************************************************/
window.IRAApp = Backbone.Router.extend({
	dateFormat: d3.time.format("%Y-%m-%d"),
	
	routes: {
		":date": 				"main",
		"users/:date": 			"users", 
		"codes/:date":			"codes"
	},

	initialize: function(options) {
		console.log('router init');

		
	},

	main: function(date) {
    	
    	this.results = null;
	},

	user: function(date) {
		console.log('user:' + date);
	},

	code: function(date) {
		console.log('code: ' + date);
	}


});


/*
 *
 *
 *
 *
 *
 *
 */

evSessionYear = {}
_.extend(evSessionYear, Backbone.Events);

evSessionYear.on("change", function(year){
	console.dir("SessionYear Changed");
});


