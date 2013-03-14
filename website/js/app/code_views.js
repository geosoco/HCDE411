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

		this.listenTo(this.model, "change:date", this.dateChanged );
		this.listenTo(this.model, "change:year", this.yearChanged );
		this.listenTo(this.model, "change:data", this.processDetails );

		this.layers = new IRA.Models.LayerCollection({});
		this.createLayers();


		this.render();

		this.yearSelectView = new IRA.Views.YearSelect({el: "#yearselect", model: this.model });

		this.graph = new IRA.Views.Codes.Graph({el: "#graph", model: this.model });
		this.sidePanel = new IRA.Views.Codes.SidePanel({ el: "#sidepanel", model: {baseModel: this.model, layers: this.layers } });
		
		this.model.set({year: '2012', yearIdx: 0 });

	}, 

	onClose: function() {
		this.model.unbind("change:date", this.dateChanged );
		this.model.unbind("change:year", this.yearChanged );

		this.yearSelectView.close();
		this.graph.close();
		this.sidePanel.close();
	},



	render: function() {
		var template = _.template($("#templ-codes").html());
		this.$el.html( template );
	},

	// handles grabbing appropriate data when the date changes
	// needs to be here because sessionSelect is a shared view, and this handles the mode
	// specific stuff
	dateChanged: function(ev) {
		//console.log('overall.mainview.datechanged');

		var date = this.model.get("date");
		var data = d3.select($('rect[data-date="' + date + '"]', this.$el).first()[0]).datum();
		var selected_values = data.values;

		var extra_data = this.processData(selected_values);

		//sessionData = transformPairs(selected_values);
		var new_data = {
			data: selected_values,
			extra: extra_data
		}

		// navigate the page the selected date
		router.navigate("code/" + date);

		this.model.set({data: selected_values});
	},

	yearChanged: function(ev) {
		//console.log('yearchanged: ' + ev.attributes['yearIdx']);

		var yearIdx = ev.attributes['yearIdx'];
		var modeData = this.model.get('modeData');

		if(modeData) {
			var selected_values = modeData[yearIdx].values;

			var extra_data = this.processData(selected_values);

			//sessionData = transformPairs(selected_values);
			var new_data = {
				data: selected_values,
				extra: extra_data
			};

			this.model.set({code_view_data: new_data });

		}

	},

	processData: function(data) {
		var data2 = this.model.get("data"); 
		var dayFormat = d3.time.format("%Y-%m-%d")

		var dateExtent = [Number.MAX_VALUE, Number.MIN_VALUE];

		this.createLayers();


		if(data) {
			data.forEach(function(d,i){
				d.values.forEach(function(d2){
					d2.values[0].date = dayFormat.parse(d2.values[0].day);
				});

				var extent = d3.extent(d.values, function(d2){
					return +d2.values[0].date;
				});

				d.avg = d3.mean(d.values, function(d2){
					return +d2.values[0].percent;
				});

				dateExtent[0] = Math.min(extent[0], dateExtent[0]);
				dateExtent[1] = Math.max(extent[1], dateExtent[1]);
			});
		}

		return {
			range: dateExtent,
			codes: data.map(function(d){ return d.key; })
		};
	},

	createLayers: function() {

		if(this.model) {
			var data = this.model.get("code_view_data");

			if(typeof data != "undefined" && data != null) {
				var html = "";

				var code_array = data.data.map(function(d,i){
					return {
						id: +d.key,
						name: +d.key,
						details: Utils.Math.trunc(+d.avg,2),
						pairs: [+d.key]
					}
				});


				this.layers.reset(code_array);

				this.codes = code_array;


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

IRA.Views.Codes.SidePanel = Backbone.View.extend({
	events: {

	},

	initialize: function() {

		this.listenTo(this.model.baseModel, "change:code_view_data", this.dataChanged );

		this.coderlist = new IRA.Views.LayerView({el: "#sp-codelist", collection: this.model.layers });


	},

	onClose: function() {
		//this.model.unbind("change:code_view_data", this.dataChanged);
	},


	render: function() {

	},

	dataChanged: function(ev) {

	},

	
});


//
//
// Codes Graph
//
//

IRA.Views.Codes.Graph = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		//console.log('mainview-init');

		this.listenTo(this.model, "change:code_view_data", this.dataChanged );

		this.render();
	}, 

	onClose: function() {
		//console.log('mainview-overall-close');
		this.model.unbind("change:code_view_data", this.dataChanged);
	},

	render: function() {
		var data = this.model.get("code_view_data");

		if(data) {
			this.drawData(data);	
		}
		
	},

	drawData: function(data) {
		this.m = [30,30,30,30];
		this.labelWidth = 30;

		var width = this.$el.width(),
			height = this.$el.height(),
			yAxisWidth = 10,
			xAxisHeight = 20,
			graphWidth = width- this.labelWidth - yAxisWidth - this.m[1] - this.m[3],
			graphHeight = height - xAxisHeight - this.m[0] - this.m[2];

		var self = this;

		//
		// scales
		//
		this.y_scale = this.y_scale || d3.scale.linear();
		this.y_scale.domain( [100.0, 0] )
			.range( [0,graphHeight] );

		this.x_scale = this.x_scale || d3.time.scale();
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
				return self.x_scale(d.value.date); 
			})
			.y(function(d) { 
				return self.y_scale(+d.value.percent); 
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
				.attr("transform", "translate(" + (this.labelWidth + this.m[3]) + "," + (this.m[0]+graphHeight) + ")" )
				.attr("class", "x axis")
				.call(this.xAxis);

			this.svg.append("g")
				.attr("transform", "translate(" + (this.labelWidth + this.m[3]) + "," + (this.m[0]) + ")" )
				.attr("class", "y axis")
				.call(this.yAxis);				
		} else 
		{
			this.svg.select(".x.axis").transition(200).call(this.xAxis);
			this.svg.select(".y.axis").transition(200).call(this.yAxis);
		}

		var mapped_pairs = $.map(data.data,function(v,k) {
				return {value: v.values, code: v.key}; 
			});


        // axes labels
        var gAxisLabels = this.svg.append("g");

        gAxisLabels.append("text")
            .attr("class", "yAxisLabel")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(10," + (graphHeight/2)+ ")rotate(-90)")
            .text("% Agreement");

        gAxisLabels.append("text")
            .attr("class", "xAxisLabel")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + ((graphWidth/2) +this.m[3] + this.labelWidth)+ "," + (height-10) + ")")
            .text("Code Application Date");


		// temporary hack
		//this.svg.selectAll("g.data").remove();

		var groups = this.svg.selectAll("g.data")
			.data(mapped_pairs, function(d){
				return d.code;
			});

		groups.enter().append("g")
			.attr("opacity",0)
			.attr("class", "data")
			.attr("data-layer-id", function(d){
				return d.code;
			})
			.attr("transform", function(d) {
				return "translate(" + (self.labelWidth + self.m[3]) + "," + (self.m[0]) + ")"
			}).transition(500)
			.attr("opacity", 1);

		groups.exit().remove();



		var lines = groups.selectAll(".line")
			.data(function(d){
			//console.dir(d);
				return [$.map(d.value,function(v,k){
					return {value: v.values[0], time: v.key}; 
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
