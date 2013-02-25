
/****************************************************************
 *
 *
 * Models
 *
 *
 ****************************************************************/
window.SessionDate = Backbone.Model.extend({

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
		this.selected = this.collection.at(0).attributes.key;
		evSessionYear.trigger("change", this.selected);
	},

	render: function() {
		this.$el.empty();

		var list = _.template('<% _.each(years, function(year) { %> <li><a><%= year.key %></a></li><% }); %>', {years: this.collection.toJSON()} );
		this.$el.html(list);

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
})



/****************************************************************
 *
 *
 * Router
 *
 *
 ****************************************************************/
window.IRAApp = Backbone.Router.extend({
	
	routes: {
		"": 					"main",
		"user/:id": 			"user", 
		"code/:id":				"code"
	},

	initialize: function(options) {
		console.log('router init');

		
	},

	main: function() {
    	this.search = new SearchView({
        	el: '#main',
        	model: query,
      	});
    	this.results = null;
	},

	user: function(id) {
		console.log('user:' + id);
	},

	code: function(id) {
		console.log('code: ' + id);
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


