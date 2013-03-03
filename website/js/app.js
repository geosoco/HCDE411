
/****************************************************************
 *
 *
 * Models
 *
 *
 ****************************************************************/

//
//
//
window.SelectedMode = Backbone.Model.extend({
	defaults: {
		mode: 0
	}
})


//
//
//
window.SelectedSession = Backbone.Model.extend({
	defaults: {
		year: 0,
		yearIdx: -1,
		date: null
	}
});



//
//
//
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


//
//
//
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


window.ModeSelect = Backbone.View.extend({
	events: {
		"click button": "selchanged"
	},

	initialize: function() {
		this.listenTo(this.model, "change:mode", this.modechanged);
	},

	render: function() {
		$('button.active', this.$el).removeClass('active');
		$('button[data-mode="' + this.model.get('mode') + '"]', this.$el).addClass('active');
	}, 

	selchanged: function(ev) {
		console.log('ModeSelect changed');
		//console.dir(ev);
		//console.dir($(ev.srcElement).attr('data-mode'));

		var newMode = $(ev.srcElement).attr('data-mode');
		console.dir(newMode);
		//this.model.set({'mode': newMode });

		this.render();

		var modeName = 'main';
		switch(+newMode) {
			case 1: modeName = 'users'; break;
			case 2: modeName = 'codes'; break;

		}
		router.navigate('/' + modeName );
	},

	modechanged: function(ev) {
		console.log('ModeView: mode changed');

		var mode = this.model.get('mode');
		console.dir(mode);

		this.render();
	}


});


window.YearSelect = Backbone.View.extend({
	events: {
		"click a": 	"selchanged"
	},

	initialize: function() {
		this.render();
		//this.selected = this.collection.at(0).attributes.key;
		//evSessionYear.trigger("change", this.selected);
		this.listenTo(this.model, "change:yearIdx", this.yearChanged);
	},

	render: function() {
		/*
		this.$el.empty();

		var list = _.template('<% _.each(years, function(year) { %> <li><a><%= year.key %></a></li><% }); %>', {years: this.collection.toJSON()} );
		this.$el.html(list);
		*/
		var yearButtons = d3.select("#yearselect > ul")
				.selectAll("li")
				.data(dataMap)
				.enter().append("li")
				.append("a")
				.attr("href", "#")
				.text(function(d){ 
					return d.key; 
				})
				.datum(function(d,i){
					return {idx: i}
				});

		//$('#yearselect li:first-child').attr('class', 'active');
		//drawSessions(dataMap[0]);
	},

	yearChanged: function() {
		console.log('year changed');
		var selected = this.model.get('yearIdx');
		$('li',this.$el).removeClass('active');
		$('li:nth-child(' + (selected+1) + ')', this.$el).addClass('active');
	},

	selchanged: function(ev) {
		this.selected = ev.srcElement.text;

		console.log('clicked: ' + ev.target.innerText);
		var yearIdx = d3.select(ev.target).datum().idx;
		this.model.set({yearIdx: yearIdx, year: ev.target.innerText});
		console.dir(dataMap[yearIdx]);
		$('li', this.$el).attr('class','');
		$(ev.target).parent().attr('class','active');

	}
});



//
//
//
window.SessionDatesView = Backbone.View.extend({
	events: {
		"click rect": "selchanged"
	},

	sessionSVG: null,
	data: null,

	initialize: function() {
		this.listenTo(this.model, "change:yearIdx", this.yearChanged);
		this.listenTo(this.model, "change:date", this.sessionChanged);
	},

	render: function() {
				var width = 600,
					height = 70,
					format = d3.time.format("%b %d");

				// sort our data first
				this.data.values.sort(function(a,b){
					return Date.parse(a.key) - Date.parse(b.key);
				});


				// build our scale
				var x_scale = d3.scale.ordinal()
						.domain(this.data.values.map(function(d2) { return d2.key; }))
						.rangeRoundBands([0,width],0);

				var color = d3.scale.quantize()
						.domain([0, 32])
						.range(d3.range(5).map(function(d) { return "q" + d + "-5"; }));

				this.sessionSVG = this.sessionSVG || d3.select("#sessions")
							.append("svg")
							.attr("width", width)
							.attr("height", height)
							.append("g")
							.attr("class", "Greys");




				var daysGraph = this.sessionSVG.selectAll("g.session")
								.data(this.data.values, function(d,i){
									return d.key;
								});

				daysGraph.transition()
							.attr("transform", function(d){
								return "translate(" + x_scale(d.key) + ",0)";
							});

				var days = daysGraph.enter()
					.append("g")
					.attr("class", "session")
					.attr("transform", function(d){
						return "translate(" + width + ",0)";
					});

				
				daysGraph.exit().transition(100).attr("transform", function(d){
						return "translate(-30,0)";
					})
					.remove();




				days.append("rect")
					.attr("x", 0)
					.attr("y", 1)
					.attr("width", 16)
					.attr("height", 16)
					.attr("data-date", function(d,i){
						return d.key;
					})
					.attr("class", function(d){ 
						return "day " + color(d.values.length); 
					});

				days.append("text")
					.attr("x", 0)
					.attr("y", 20)
					.attr("text-anchor", "start")
					.text(function(d){ return format(new Date(d.key)); })
					.attr("transform", "translate(22,20)rotate(90)");

				days.transition(100)
					.attr("transform", function(d){
						return "translate(" + x_scale(d.key) + ",0)";
					});

	},

	yearChanged: function(ev) {
		console.log('yearChanged');

		var yearIdx = this.model.get("yearIdx");
		this.data = dataMap[yearIdx];
		this.render();
	},

	sessionChanged: function(ev) {
		console.log('session Changed');
		console.dir(ev);

		var date = this.model.get("date");
		var data = d3.select($('rect[data-date="' + date + '"]', this.$el).first()[0]).datum();
		var selected_values = data.values;

		sessionData = transformPairs(selected_values);
		drawData(sessionData);
		drawHistogram("#histogram", sessionData.extra.histogram);
		drawPairNames("#pairnames", sessionData);
	},


	selchanged: function(ev) {
		//console.log('clicky2');
		//console.dir(ev);

		var data = d3.select(ev.srcElement).datum();

		var selected_date = data.key;
		var selected_values = data.values;

		
		//console.dir(ev);
		//console.dir("clicked " + data.key);

		sessionData = transformPairs(selected_values);
		drawData(sessionData);
		drawHistogram("#histogram", sessionData.extra.histogram);
		drawPairNames("#pairnames", sessionData);
	},


});


//
//
// 
//
//
window.MainView = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		this.listenTo(this.model, "change:mode", this.modeChanged);
	}, 

	render: function() {

	},

	modeChanged: function() {

	}
});

window.AlllView = Backbone.View.extend({
	events: {

	},

	initialize: function() {

	}, 

	render: function() {

	}
});

window.AllSidePanel = Backbone.View.extend({
	events: {

	},

	initialize: function() {

	},

	render: function() {

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
	dateFormat: d3.time.format("%Y-%m-%d"),
	
	routes: {
		"": 						"main",
		"main/:date": 				"main",
		"users(/:date)": 			"users", 
		"codes(/:date)":			"codes"
	},

	initialize: function(options) {
		console.log('router init');

		// models
		this.selectedMode = new SelectedMode();
		this.selectedSession = new SelectedSession();

		// views 
		this.modeSelectView = new ModeSelect({el: "#mode-select", model: this.selectedMode });
		this.yearSelectView = new YearSelect({el: "#yearselect", model: this.selectedSession });
		this.sessionDatesView = new SessionDatesView({el: '#sessions', model: this.selectedSession });
		this.mainView = new MainView({el: '#main-view', model: this.selectedMode });

		this.selectedSession.set({ year: 2004, yearIdx: 0});

		Backbone.history.start();
	},

	main: function(date) {
    	console.log('main:' + date);

    	this.selectedMode.set({mode: 0});
    	this.setDate(date);


    	this.results = null;
	},

	users: function(date) {
		this.selectedMode.set({mode: 1});

		console.log('users:' + date);
	},

	codes: function(date) {
		this.selectedMode.set({mode: 2});

		console.log('codes: ' + date);
		this.setDate(date);
	},


	setDate: function(date) {
		if(typeof date == "undefined") {
			return;
		}

		var parsedDate = this.dateFormat.parse(date);
		if(parsedDate != null) {
			console.dir(parsedDate);
			var yearnum = parsedDate.getFullYear();
			this.selectedSession.set({year: yearnum, yearIdx: (yearnum-2004), date: date});
		}
		else {
			console.log("Invalid date in URL: " + date);
		}
		
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

/*
 *
 *
 * model declarations
 *
 *
 */





