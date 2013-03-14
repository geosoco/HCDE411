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
		console.log('userview-init');

		this.listenTo(this.model, "change:date", this.dateChanged );
		this.listenTo(this.model, "change:data", this.processDetails );
		//this.listenTo(this.model, "change:year", this.yearChanged );

		this.detailsModel = new IRA.Models.PairsDetails();
		this.graphControlsModel = new IRA.Models.GraphTrends();		
		this.layers = new IRA.Models.LayerCollection({});


		this.render();

		this.yearSelectView = new IRA.Views.YearSelect({el: "#yearselect", model: this.model });
		this.sessionDatesView = new IRA.Views.SessionDatesView({el: '#sessions', model: this.model });
		this.graph = new IRA.Views.Users.Graph({el: "#graph", model: this.model });
		this.graphControls = new IRA.Views.GraphControlsView({el: "#graph-controls", model: this.graphControlsModel });
		this.sidePanel = new IRA.Views.Users.SidePanel({ el: "#sidepanel", model: { baseModel: this.model, layers: this.layers } });
		this.detailsPane = new IRA.Views.Overall.DetailsPane({ el: "#bottom-view", model: this.detailsModel });

		this.dateChanged();
	}, 

	onClose: function() {
		this.model.unbind("change:date", this.dateChanged );
		//this.model.unbind("change:year", this.yearChanged );

		this.yearSelectView.close();
		this.sessionDatesView.close();
		this.graph.close();
		this.sidePanel.close();
	},


	render: function() {
		var template = _.template($("#templ-users").html());
		this.$el.html( template );
	},

	// handles grabbing appropriate data when the date changes
	// needs to be here because sessionSelect is a shared view, and this handles the mode
	// specific stuff
	dateChanged: function(ev) {
		console.log('overall.mainview.datechanged');

		var date = this.model.get("date");

		if(date && date != null) {
			var data = d3.select($('rect[data-date="' + date + '"]', this.$el).first()[0]).datum();
			var selected_values = data.values;

			var sessionData = this.processData(data);

			router.navigate("users/" + date);

			this.model.set({user_view_data: sessionData});
			this.createLayers();
			
		}
	},

	// handle detail specific numbers
	processDetails: function() {
		var data = this.model.get('data');

		console.log('processDetails');
		console.dir(data);

		if(data) {

			this.createLayers();			

			var vals = {};

			vals['numlines'] = (data.extra.range[1] + 20) - data.extra.range[0];
			vals['numusers'] = data.extra.coders.length;
			vals['avgagreement'] = Utils.Math.trunc(data.extra.overall.avg,2);

			this.detailsModel.set(vals);

		}
	},


	processData: function(data) {
		var res = {};
		var coders = {};


		this.createLayers();

		var dateExtent = [Number.MAX_VALUE, Number.MIN_VALUE];
		var lineExtent = [Number.MAX_VALUE, Number.MIN_VALUE];

		data.values.forEach(function(d,i){

			var lineId = d['id'];
			var time = Date.parse(d['time']);

			dateExtent[0] = Math.min(dateExtent[0], +time);
			dateExtent[1] = Math.max(dateExtent[1], +time);

			lineExtent[0] = Math.min(lineExtent[0], +lineId);
			lineExtent[1] = Math.max(lineExtent[1], +lineId);

			// run through each column of each object
			for(var col in d) {
				// skip non-coder columns
				if(!col || col.toLowerCase() == "id" || col.toLowerCase() == "time" ) {
					continue;
				}

				var value = d[col];

				// if the cell isn't empty
				if(value && value.length > 0) {
					// add it to our coders list as necessary
					if(!(col in coders)) {
						coders[col] = {
							id: col,
							entries: [{
								time: time,
								id: lineId,
								value: value 
							}],
						}
					} else {
						coders[col].entries.push({
							time: time,
							id: lineId,
							value: value
						});
					}
				}
			}
		});

		d3.entries(coders).forEach(function(d,i){
			coders[d.key].avg = d3.mean(d.value.entries, function(d2) { return +d2.value; } )
		});



		// set up return structure
		res = {
				data: coders,
				extra: {
					coders: d3.keys(coders),
					range: lineExtent
				}
			}


		return res;
	},

	createLayers: function() {

		if(this.model) {
			var data = this.model.get("user_view_data");

			if(typeof data != "undefined" && data != null) {

				var user_array = d3.entries(data.data).map(function(d,i){
					return {
						id: +d.key,
						name: +d.key,
						details: Utils.Math.trunc(+d.value.avg,2),
						pairs: [+d.key]
					}
				});


				this.layers.reset(user_array);

				this.users = user_array;


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

IRA.Views.Users.SidePanel = Backbone.View.extend({
	events: {

	},

	initialize: function() {

		//this.listenTo(this.model, "change:user_view_data", this.dataChanged );

		this.coderlist = new IRA.Views.LayerView({el: "#sp-userlist", collection: this.model.layers });

	},

	onClose: function() {
		//this.model.unbind("change:user_view_data", this.dataChanged);
	},



	render: function() {

	},

	dataChanged: function(ev) {

		//var baseData = this.model.get("user_view_data");
		//this.transformBaseData(baseData);
		//this.createLayers();

		//this.stats.render();
	},

	
});

//
//
//
//
//

IRA.Views.Users.Graph = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		//console.log('mainview-init');

		this.listenTo(this.model, "change:user_view_data", this.dataChanged );

		this.render();
	}, 

	onClose: function() {
		//console.log('mainview-overall-close');
		this.model.unbind("change:user_view_data", this.dataChanged);
	},

	render: function() {
		var data = this.model.get("user_view_data");

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
			.interpolate("monotone")
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
				.attr("transform", "translate(" + (this.labelWidth + this.m[3]) + "," + (this.m[0]+graphHeight) + ")" )
				.attr("class", "x axis")
				.call(this.xAxis);

			this.svg.append("g")
				.attr("transform", "translate(" + (this.labelWidth + this.m[3]) + "," + (this.m[0]) + ")" )
				.attr("class", "y axis")
				.call(this.yAxis);			

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
	            .text("Line Number");					
		} else 
		{
			this.svg.select(".x.axis").transition(200).call(this.xAxis);
			this.svg.select(".y.axis").transition(200).call(this.yAxis);
		}




		var mapped_pairs = $.map(data.data,function(v,k) {
				return {value: v.entries, pair: k}; 
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
				return "translate(" + (self.labelWidth + self.m[3]) + "," + (self.m[0]) + ")"
			}).transition(500)
			.attr("opacity", 1);

		groups.exit().remove();



		var lines = groups.selectAll(".line")
			.data(function(d){
			//console.dir(d);
				return [$.map(d.value,function(v,k){
					return {value: +v.value, time: v.id}; 
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
		//var modelData

		//this.data = 

		this.render();

		//this.drawData(this.model.get("data"));
	},

		controlsChanged: function(ev) {
		console.log('controlsChanged');

		if(typeof(this.svg) === "undfined" || this.svg == null ) {
			return;
		}


		var meanSource = this.model.controlsModel.get("MeanSource");
		var meanType = this.model.controlsModel.get("MeanType");
		var coneType = this.model.controlsModel.get("MeanDistMethod");

		var meanData = this.processMeanData(meanSource, meanType);
		var coneData = this.processConeData(meanData, coneType);

		console.log('meandata');
		console.dir(meanData);

		console.log('coneData');
		console.dir(coneData);


		if(typeof(this.svg) !== "undefined") {
			var self = this;


			//
			// cone layer
			//
			if(coneData) {
				this.conelayer = this.conelayer || this.svg.append("g");
				this.conelayer.attr("transform", function(d) {
						return "translate(" + (self.labelWidth + self.m[3]) + "," + (self.m[0]) + ")"
					}).classed("cone");

				this.coneline = d3.svg.area()
					.interpolate("linear")
					.x(function(d){
						return self.x_scale(+d.x); 
					})
					.y0(function(d) { 
						return self.y_scale(+d.y0); 
					})
					.y1(function(d){
						return self.y_scale(+d.y1);
					});


				var cone = this.conelayer.selectAll('path.cone').data([coneData]);

				cone.enter()
					.append("path")
					.attr("class","cone")
					.attr("d", this.coneline);

				cone.transition(500).attr("d", this.coneline);

				cone.exit().remove();

			}


			//
			// mean layer
			//
			this.meanlinelayer = this.meanlinelayer || this.svg.append("g");
			this.meanlinelayer.attr("transform", function(d) {
					return "translate(" + (self.labelWidth + self.m[3]) + "," + (self.m[0]) + ")"
				}).classed("mean");

			this.meanline = d3.svg.line()
				.interpolate("linear")
				.x(function(d) { 
					return self.x_scale(+d.x); 
				})
				.y(function(d) { 
					return self.y_scale(+d.y); 
				});

			var meanlines = this.meanlinelayer.selectAll('path.meanline').data([meanData]);

			meanlines.enter()
				.append("path")
				.attr("class", "meanline")
				.attr("d", this.meanline);

			meanlines.transition(500).attr("d", this.meanline);

			meanlines.exit().remove();

		}

	}

});
