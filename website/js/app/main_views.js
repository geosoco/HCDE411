/****************************************************************
 *
 *
 * Main Views
 *
 *
 ****************************************************************/

// Namespace 
var IRA = IRA || {};
IRA.Views = IRA.Views || {};


//
//
//
IRA.Views.ModeSelect = Backbone.View.extend({
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


//
//
//
IRA.Views.YearSelect = Backbone.View.extend({
	events: {
		"click a": 	"selchanged"
	},

	initialize: function() {
		this.render();
		//this.selected = this.collection.at(0).attributes.key;
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
IRA.Views.SessionDatesView = Backbone.View.extend({
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

		this.model.set({data: sessionData});

		//drawData(sessionData);
		//drawHistogram("#histogram", sessionData.extra.histogram);
		//drawPairNames("#pairnames", sessionData);
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
		this.model.set({data: sessionData});
		/*
		drawData(sessionData);
		drawHistogram("#histogram", sessionData.extra.histogram);
		drawPairNames("#pairnames", sessionData);
		*/
	},


});


//
//
//
IRA.Views.MainView = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		console.log('mainview init');
		this.listenTo(this.model.selectedMode, "change:mode", this.modeChanged);
	}, 

	render: function() {

	},

	modeChanged: function() {
		console.log('>> mainview mode changed');
		var mode = this.model.selectedMode.get("mode");

		var newView = null;
		var viewParams = {el: '#main-view', model: this.model.selectedSession };
		switch(mode) {
			case 0:
				newView = new IRA.Views.Overall.MainView(viewParams);
				break;
			case 1:
				newView = new IRA.Views.Users.MainView(viewParams);
				break;
			case 2:
				newView = new IRA.Views.Codes.MainView(viewParams);
				break;
		}

		this.curView = newView;
	}
});


//
// 
//
IRA.Views.LineGraph = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		this.listenTo(this.model, "change:data", this.dataChanged);
	},

	render: function() {
		var self = this;

		var m = this.model.get("margins"),
			el_w = this.model.get("width") || this.$el.width(),
			el_h = this.model.get("height") || this.$el.height(),
			w = el_w-m[1]-m[3],
			h = el_h - m[0] -m[2],
			data = this.model.get("data");


		/*
		var sortedData = d3.entries(data).sort(function(a,b){
			return +a.key - +b.key;
		});
		*/


		//
		// scales
		//
		this.yscale = this.yscale || d3.scale.linear();
		this.yscale.domain( this.model.get('yDomain') || [0, d3.max(d3.values(data))] )
			.range( [h,0] );

		this.xscale = this.xscale || d3.scale.linear();
		this.xscale.domain( this.model.get('xDomain') || [0, d3.max(d3.keys(data))] )
			.range([0,w]);


		// line generator
		this.line = this.line || d3.svg.line()
			.interpolate(this.model.get("lineInterpolation"))
			.x(function(d) { 
				return self.xscale(+d.key); 
			})
			.y(function(d) { 
				return self.yscale(+d.value); 
			});

		//
		// axes
		//

		this.yAxis = this.yAxis || d3.svg.axis();
		this.yAxis.scale(this.y_scale)
			.orient("left");

		this.xAxis = this.xAxis || d3.svg.axis();
		this.xAxis.scale(this.x_scale)
			.orient("bottom");

		//
		// graph
		//
		if(typeof this.svg == "undefined") {
			this.svg = d3.select(this.el)
				.append("svg")
				.attr("width", width)
				.attr("height", height);

			// draw axes
			this.svg.append("g")
				.attr("transform", "translate(" + (labelWidth + m[3]) + "," + (m[0]+graphHeight) + ")" )
				.attr("class", "x axis")
				.call(this.xAxis);

			this.svg.append("g")
				.attr("transform", "translate(" + (labelWidth + m[3]) + "," + (m[0]) + ")" )
				.attr("class", "y axis")
				.call(this.yAxis);				
		} else 
		{
			// update the axes
			this.svg.select(".x.axis").call(this.xAxis);
			this.svg.select(".y.axis").call(this.yAxis);
		}


		var groups = this.svg.selectAll("g.data")
			.data($.map(data.data,function(v,k) {
				return {value: v, pair: k}; 
			}), function(d){
				return d.pair;
			});

		groups.enter().append("g")
			.attr("class", "data")
			.attr("transform", function(d) {
				return "translate(" + (labelWidth + m[3]) + "," + (m[0]) + ")"
			});
		groups.exit().remove();



		var lines = groups.selectAll(".line")
			.data(function(d){
			//console.dir(d);
				return [$.map(d.value,function(v,k){
					return {value: v, time: k}; 
				})];
			});

		lines.enter().append("path")
			.attr("class", "line")
			.attr("d", this.line);

		lines.exit().remove();
	},

	dataChanged: function() {
		console.log('dataChanged');
	}

});



