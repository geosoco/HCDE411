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
		

		this.render();

		var modeName = 'main';
		switch(+newMode) {
			case 1: modeName = 'users'; break;
			case 2: modeName = 'codes'; break;

		}

		// update the framework
		this.model.set({'mode': newMode });
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

	remove: function() {
		this.$el.unbind();
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
				.attr("data-year", function(d) { return d.key; })
				.attr("data-yearIdx", function(d,i) { return i; })
				.text(function(d){ 
					return d.key; 
				})
				.datum(function(d,i){
					return {idx: i}
				});

		var selected = this.model.get('yearIdx');
		$('li',this.$el).removeClass('active');
		$('li:nth-child(' + (selected+1) + ')', this.$el).addClass('active');

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

		var yearIdx = this.model.get("yearIdx");
		this.data = dataMap[yearIdx];
		if(this.data) {
			this.render();
		}
	},

	render: function() {
				var width = 600,
					height = 70,
					format = d3.time.format("%b %d"),
					self = this;

				// sort our data first
				this.data.values.sort(function(a,b){
					return Date.parse(a.key) - Date.parse(b.key);
				});


				// build our scale
				this.x_scale = this.x_scale || d3.scale.ordinal()
						.rangeRoundBands([0,width],0);

				this.x_scale.domain(this.data.values.map(function(d2) { return d2.key; }))
						

				this.color = this.color || d3.scale.quantize()
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
								return "translate(" + self.x_scale(d.key) + ",0)";
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
						return "day " + self.color(d.values.length); 
					});

				days.append("text")
					.attr("x", 0)
					.attr("y", 20)
					.attr("text-anchor", "start")
					.text(function(d){ return format(new Date(d.key)); })
					.attr("transform", "translate(22,20)rotate(90)");

				days.transition(100)
					.attr("transform", function(d){
						return "translate(" + self.x_scale(d.key) + ",0)";
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
		$('#main-view').html('');
		var viewParams = {el: '#main-view', model: this.model.selectedSession };
		switch(+mode) {
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
		this.render();
	},

	onClose: function() {
		console.log('IRA.Views.LineGraph');
		this.model.unbind("change:data", this.dataChanged);
	},

	extent: function(arr, accessor) {
		// rewrite to be more efficient
		var min = Number.MAX_VALUE,
			max = Number.MIN_VALUE;

		if(arr) {
			arr.forEach(function(d,i){
				d.forEach(function(d2,i2){
					min = Math.min(min, accessor(d2,i2));
					max = Math.max(max, accessor(d2,i2));
				});
			});
		}

		return [min,max];
	},

	render: function() {
		var self = this;

		var m = this.model.get("margins"),
			el_w = this.model.get("width") || this.$el.width(),
			el_h = this.model.get("height") || this.$el.height(),
			w = el_w-m[1]-m[3],
			h = el_h - m[0] -m[2],
			data = this.model.get("data");

		if(typeof data == "undefined" || data === null || data.length == 0) {
			return;
		}

		//
		// scales
		//
		this.yscale = this.yscale || d3.scale.linear();
		var ydomain = this.model.get('yDomain') || this.extent(data, function(d) { return d.y; });
		this.yscale.domain( ydomain )
			.range( [h,0] );

		this.xscale = this.xscale || d3.scale.linear();
		var xdomain = this.model.get('xDomain') || this.extent(data, function(d) { return d.x; });
		this.xscale.domain( xdomain )
			.range([0,w]);


		// line generator
		this.line = this.line || d3.svg.line()
			.interpolate(this.model.get("lineInterpolation"))
			.x(function(d) { 
				return self.xscale(+d.x); 
			})
			.y(function(d) { 
				return self.yscale(+d.y); 
			});

		//
		// axes
		//

		this.yAxis = this.yAxis || d3.svg.axis();
		this.yAxis.scale(this.yscale)
			.orient("left");
		var yTicks = this.model.get("yTicks");
		if(yTicks) {
			this.yAxis.ticks(yTicks);
		}

		this.xAxis = this.xAxis || d3.svg.axis();
		this.xAxis.scale(this.xscale)
			.orient("bottom");
		var xTicks = this.model.get("xTicks");
		if(xTicks) {
			this.xAxis.ticks(xTicks);
		}

		//
		// graph
		//
		if(typeof this.svg == "undefined") {
			this.svg = d3.select(this.el)
				.append("svg")
				.attr("width", el_w)
				.attr("height", el_h);

			// draw axes
			this.svg.append("g")
				.attr("transform", "translate(" + (m[3]) + "," + (m[0]+h) + ")" )
				.attr("class", "x axis")
				.call(this.xAxis);

			this.svg.append("g")
				.attr("transform", "translate(" + (m[3]) + "," + (m[0]) + ")" )
				.attr("class", "y axis")
				.call(this.yAxis);				
		} else 
		{
			// update the axes
			this.svg.select(".x.axis").transition(200).call(this.xAxis);
			this.svg.select(".y.axis").transition(200).call(this.yAxis);
		}


		var groups = this.svg.selectAll("g.data")
			.data(data);

		groups.enter().append("g")
			.attr("class", "data")
			.attr("transform", function(d) {
				return "translate(" + (m[3]) + "," + (m[0]) + ")"
			});
		groups.exit().remove();



		var lines = groups.selectAll(".line")
			.data(function(d,i){
			//console.dir(d);
				return [d];
			});

		lines.enter().append("path")
			.attr("class", "line")
			.attr("d", this.line);

		lines.exit().remove();

		lines.transition(500).attr("d", this.line);
	},

	dataChanged: function() {
		console.log('dataChanged');

		this.render();
	}

});



