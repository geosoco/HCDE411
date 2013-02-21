
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

		var spinner = $('body').spin("small");

		d3.csv("data/10line.csv", function(csv) {
            console.log('got csv!');
            console.dir(csv);
            data = csv;

            dataMap = d3.nest()
              .key(function(d){
                return ((new Date(format.parse(d.time))).getYear() + 1900);
              })
              .key(function(d){ 
                fulldate = new Date(format.parse(d.time));
                date = new Date(fulldate.getYear() + 1900, fulldate.getMonth(), fulldate.getDate())
                return dayFormat(date); 
              })
              .entries(data);

            console.log("dataMap");
            console.dir(dataMap);

            yearlist = new YearList(dataMap);
            console.dir(yearlist);


            //dataMap = dataMap.map();

            console.dir(d3.keys(dataMap));

            // grab our possible pairs
            possible_pairs = Object.keys(csv[0]);
            possible_pairs = possible_pairs.filter(function(d){
              return (d.indexOf('-') != -1);
            });
            console.dir(possible_pairs);

            this.yearSelect = new YearSelect({el: "#yearselect > ul", collection: yearlist});

            spinner.spin(false);

        });

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


