/****************************************************************
 *
 *
 * Overall Views
 *
 *
 ****************************************************************/

// Namespace 
var IRA = IRA || {};
IRA.Views = IRA.Views || {};
IRA.Views.Overall = IRA.Views.Overall || {};

//
//
// 
//
//

IRA.Views.Overall.MainView = Backbone.View.extend({

	events: {

	},

	initialize: function() {
		//console.log('mainview-init');
		this.listenTo(this.model, "change:date", this.dateChanged );

		this.render();

		this.yearSelectView = new IRA.Views.YearSelect({el: "#yearselect", model: this.model });
		this.sessionDatesView = new IRA.Views.SessionDatesView({el: '#sessions', model: this.model });
		this.graph = new IRA.Views.Overall.Graph({el: "#graph", model: this.model });
		this.sidePanel = new IRA.Views.Overall.SidePanel({ el: "#sidepanel", model: this.model });
		
	}, 

	onClose: function() {
		this.model.unbind("change:date", this.dateChanged );

		this.yearSelectView.close();
		this.sessionDatesView.close();
		this.graph.close();
		this.sidePanel.close();
	},

	render: function() {
		var template = _.template($("#templ-main").html());
		this.$el.html( template );
	},

	// handles grabbing appropriate data when the date changes
	// needs to be here because sessionSelect is a shared view, and this handles the mode
	// specific stuff
	dateChanged: function(ev) {
		console.log('overall.mainview.datechanged');

		var date = this.model.get("date");
		var data = d3.select($('rect[data-date="' + date + '"]', this.$el).first()[0]).datum();
		var selected_values = data.values;

		sessionData = transformPairs(selected_values);

		this.model.set({data: sessionData});
	},



});

//
//
//
//
//

IRA.Views.Overall.Graph = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		//console.log('mainview-init');

		this.listenTo(this.model, "change:data", this.dataChanged );

		this.render();
	}, 

	onClose: function() {
		//console.log('mainview-overall-close');
		this.model.unbind("change:data", this.dataChanged);
	},

	render: function() {
		var yearIdx = this.model.get("yearIdx");
		var data = this.model.get("data");

		if(data && yearIdx >= 0) {
			this.drawData(this.model.get("data"));	
		}
		
	},

	drawData: function(data) {
		var m = [30, 30, 30, 30],
			width = this.$el.width(),
			height = this.$el.height(),
			labelWidth = 30,
			yAxisWidth = 10,
			xAxisHeight = 20,
			graphWidth = width- labelWidth - yAxisWidth - m[1] - m[3],
			graphHeight = height - xAxisHeight - m[0] - m[2];

		var self = this;

		//
		// scales
		//
		this.y_scale = this.y_scale || d3.scale.linear();
		this.y_scale.domain( [100.0, 0] )
			.range( [0,graphHeight] );

		this.x_scale = this.x_scale || d3.scale.linear();
		this.x_scale.domain( data.extra['range'] )
			.range([0,graphWidth]);


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
		// line generator
		//
		this.line = d3.svg.line()
			.interpolate("linear")
			.x(function(d) { 
				return self.x_scale(+d.time); 
			})
			.y(function(d) { 
				return self.y_scale(+d.value); 
			});

		//
		// graph
		//
		//this.$el.empty();

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
			this.svg.select(".x.axis").transition(200).call(this.xAxis);
			this.svg.select(".y.axis").transition(200).call(this.yAxis);
		}

		var mapped_pairs = $.map(data.data,function(v,k) {
				return {value: v, pair: k}; 
			});


		// temporary hack
		//this.svg.selectAll("g.data").remove();

		var groups = this.svg.selectAll("g.data")
			.data(mapped_pairs, function(d){
				return d.pair;
			});

		groups.enter().append("g")
			.attr("opacity",0)
			.attr("class", "data")
			.attr("data-layer-id", function(d){
				return d.pair;
			})
			.attr("transform", function(d) {
				return "translate(" + (labelWidth + m[3]) + "," + (m[0]) + ")"
			}).transition(500)
			.attr("opacity", 1);

		groups.exit().remove();



		var lines = groups.selectAll(".line")
			.data(function(d){
			//console.dir(d);
				return [$.map(d.value,function(v,k){
					return {value: v, time: k}; 
				})];
			});

		var extra = data.extra;
		lines.enter().append("path")
			.attr("class", "line")
			.attr("d", this.line)
			.datum((function(d,i){
				return d;
			}).bind(data));

		lines.exit().remove();

		lines.transition(100).attr("d", this.line);

	},


	dataChanged: function(ev) {
		//console.log("dataChanged");
		//console.dir(ev);

		this.render();

		//this.drawData(this.model.get("data"));
	}

});

//
//
// 
//
//

IRA.Views.Overall.SidePanel = Backbone.View.extend({
	events: {

	},

	initialize: function() {

		this.listenTo(this.model, "change:data", this.dataChanged );

		var data = this.model.get("data");
		this.histogramModel = new IRA.Models.LineGraphModel({
			data: null, 
			xDomain: [0,100],
			xTicks: 3,
			yTicks: 3
		});

		this.layers = new IRA.Models.LayerCollection({});
		this.createLayers();


		this.transformBaseData(data);
		this.histogram = new IRA.Views.LineGraph({el: "#sp-histogram", model: this.histogramModel });
		this.stats = new IRA.Views.Overall.Stats({el: "#sp-details", model: this.model });
		//this.coderlist = new IRA.Views.Overall.CoderList({el: "#sp-coders", model: this.model });
		this.coderlist = new IRA.Views.LayerView({el: "#sp-coderlist", collection: this.layers });
	},

	onClose: function() {
		this.model.unbind("change:data", this.dataChanged);
	},

	render: function() {
		var data = this.model.get("data");

		if(data) {

		} else {
			//$("#sp-")
		}

		if(this.stats) {
			this.stats.render();
		}
	},

	transformBaseData: function(baseData) {
		if(typeof baseData == "undefined" || baseData == null ) {
			return;
		}

		var transformed = $.map(baseData.extra.histogram, function(d,i){
			return {x: +i, y: d };
		});

		// sort our data first
		transformed.sort(function(a,b){
			return a.x - b.x;
		});

		this.histogramModel.set({data: [transformed] });
	},

	dataChanged: function(ev) {
		//console.log("OverallSidePanel: dataChanged");
		//console.dir(ev);

		var baseData = this.model.get("data");
		this.transformBaseData(baseData);
		this.createLayers();

		this.stats.render();
	},

	createLayers: function() {

		if(this.model) {
			var data = this.model.get("data");

			if(typeof data != "undefined" && data != null) {
				var html = "";

				var coders = {};
				d3.entries(data.extra.pair_data).forEach(function(d,i){
					var matches = d.key.match(/(\d{1,2})-(\d{1,2})/);

					if(matches != null && matches.length > 2) {
						var coder1 = matches[1],
							coder2 = matches[2];

						if(!(coder1 in coders)) {
							coders[coder1] = {pairs: [d.key], vals: [d.value.avg] };
						} else {
							coders[coder1].pairs.push(d.key);
							coders[coder1].vals.push(d.value.avg);
						}
						if(!(coder2 in coders)) {
							coders[coder2] = {pairs: [d.key], vals: [d.value.avg] };
						} else {
							coders[coder2].pairs.push(d.key);
							coders[coder2].vals.push(d.value.avg);
						}


					} 
				});

				//console.log("coders");
				//console.dir(coders);

				var coder_array = d3.entries(coders).map(function(d,i){
					return {
						id: +d.key,
						name: d.key,
						details: Utils.Math.trunc(d3.mean(d.value.vals),2),
						pairs: d.value.pairs,
						averages: d.value.vals
					}
				});

				this.layers.reset(coder_array);

				this.coders = coders;


			} else {
				this.layers.reset([]);
			}
		} else {
			this.layers.reset([]);
		}

	}

	
});


//
//
// 
//
//

IRA.Views.Overall.Stats = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		//this.listenTo(this.model, "change:data", this.dataChanged );

		this.render();
	},

	render: function() {
		if(this.model) {
			var data = this.model.get("data");

			this.$el.empty();
			if(typeof data != "undefined" && data != null) {
				this.$el.append("<div><label>Mean</label><span>" + data.extra.overall.avg.toString().match(/-?\d*\.\d{2}/) + "</span></div>");	
			}

		}		
	}

});


//
//
// 
//
//

IRA.Views.Overall.CoderList = Backbone.View.extend({
	events: {
		"hover .coder-line": "onHover", 
		"mouseout .coder-line label": "onHoverExit",
	},

	initialize: function() {
		//this.listenTo(this.model, "change:data", this.dataChanged );

		this.render();
	},

	render: function() {
		if(this.model) {
			var data = this.model.get("data");

			this.$el.empty();
			if(typeof data != "undefined" && data != null) {
				var html = "";

				var coders = {};
				d3.entries(data.extra.pair_data).forEach(function(d,i){
					var matches = d.key.match(/(\d{1,2})-(\d{1,2})/);

					if(matches != null && matches.length > 2) {
						var coder1 = matches[1],
							coder2 = matches[2];

						if(!(coder1 in coders)) {
							coders[coder1] = {pairs: [d.key], vals: [d.value.avg] };
						} else {
							coders[coder1].pairs.push(d.key);
							coders[coder1].vals.push(d.value.avg);
						}
						if(!(coder2 in coders)) {
							coders[coder2] = {pairs: [d.key], vals: [d.value.avg] };
						} else {
							coders[coder2].pairs.push(d.key);
							coders[coder2].vals.push(d.value.avg);
						}


					} 
				});

				//console.dir(coders);
				this.coders = coders;

				d3.entries(coders).forEach(function(d){
					html += "<li class='coder-line' data-coder='" + d.key +"'>";
					html += '<div class="spotlight">&nbsp;</div>';
					html += '<div class="vis-togle">&nbsp;</div>';
					html += '<div>' + d.key + '</div>';
					html += '<div>' + (d3.mean(d.value.vals)) + '</div>'
					html += '</li>';
				});
				this.$el.html(html);

				var items = 0;
			}

		}		
	},

	renderHoverHilight: function(list) {
		// remove hilight 
		$('#graph g.data').attr('class', 'data');

		// skip out if no coder specified
		if(typeof list == "undefined" || list == null || list.length == 0) {
			return;
		}

		list.forEach(function(d){
			$('#graph g.data[data-layer-id="' + d + '"]').attr('class', 'data hover-hilight');
			//console.log($('.hover-hilight').first());
		});
	},

	onHover: function(ev) {
		//console.log("coder hover");
		//console.dir(ev);

		var data = this.model.get("data");
		var coder = null;
		if(ev.srcElement.tagName.toUpperCase() == "LI") {
			coder = $(ev.srcElement).attr('data-coder');
		} else {
			coder = $(ev.srcElement).parent('li').attr('data-coder');
		}
		
		this.renderHoverHilight(this.coders[coder].pairs);
	},

	onHoverExit: function(ev) {
		//console.log("coder hover exit");
		//console.dir(ev);

		this.renderHoverHilight();
	}

});



