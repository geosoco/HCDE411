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
		console.log('mainview-init');

		this.render();

		this.graph = new IRA.Views.Overall.Graph({el: "#graph", model: this.model });
		this.sidePanel = new IRA.Views.Overall.SidePanel({ el: "#sidepanel", model: this.model });
		
	}, 

	render: function() {
		var template = _.template($("#templ-main").html());
		this.$el.html( template );
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
		console.log('mainview-init');

		this.listenTo(this.model, "change:data", this.dataChanged );

		this.render();
	}, 

	render: function() {
		var data = this.model.get("data");

		if(data) {
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
		console.log("dataChanged");
		console.dir(ev);

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
			data: data, 
			xDomain: [0,100],
			xTicks: 3,
			yTicks: 3
		});
		this.histogram = new IRA.Views.LineGraph({el: "#histogram", model: this.histogramModel });
	},

	render: function() {

	},

	dataChanged: function(ev) {
		console.log("datachanged");
		console.dir(ev);

		var data = this.model.get("data");

		var transformed = $.map(data.extra.histogram, function(d,i){
			return {x: +i, y: d };
		});

		// sort our data first
		transformed.sort(function(a,b){
			return a.x - b.x;
		});

		this.histogramModel.set({data: [transformed] });
	}
});


