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
		this.dayFormat = d3.time.format("%Y-%m-%d");


		// event listening
		//console.log('mainview-init');
		this.listenTo(this.model, "change:date", this.dateChanged );
		this.listenTo(this.model, "change:data", this.processDetails );

		this.render();

		// local models
		this.detailsModel = new IRA.Models.PairsDetails();
		this.graphControlsModel = new IRA.Models.GraphTrends();
		this.layers = new IRA.Models.LayerCollection({});
		this.createLayers();

		// views
		this.yearSelectView = new IRA.Views.YearSelect({el: "#yearselect", model: this.model });
		this.sessionDatesView = new IRA.Views.SessionDatesView({el: '#sessions', model: this.model });
		this.graph = new IRA.Views.Overall.Graph({el: "#graph", model: {baseModel: this.model, controlsModel: this.graphControlsModel} });
		this.graphControls = new IRA.Views.GraphControlsView({el: "#graph-controls", model: this.graphControlsModel });
		this.sidePanel = new IRA.Views.Overall.SidePanel({ el: "#sidepanel", model: { baseModel: this.model, layers: this.layers} });
		this.detailsPane = new IRA.Views.Overall.DetailsPane({ el: "#bottom-view", model: this.detailsModel });

		this.addSubview(this.yearSelectView);
		this.addSubview(this.sessionDatesView);
		this.addSubview(this.graph);
		this.addSubview(this.sidePanel);
		this.addSubview(this.detailsPane);
	}, 

	onClose: function() {
		this.stopListening();
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

		// transform data
		sessionData = transformPairs(selected_values);

		// recrreate layers
		this.createLayers();

		// navigate and set data
		router.navigate("main/" + date);
		this.model.set({data: sessionData});
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
				data.extra['coders'] = coder_array;

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

IRA.Views.Overall.Graph = Backbone.View.extend({
	events: {

	},

	initialize: function() {
		//console.log('mainview-init');

		this.listenTo(this.model.baseModel, "change:data", this.dataChanged );
		this.listenTo(this.model.controlsModel, "change", this.controlsChanged );

		this.render();
	}, 

	onClose: function() {
		//console.log('mainview-overall-close');
		//this.model.unbind("change:data", this.dataChanged);
		this.stopListening(this.model.baseModel );
		this.stopListening(this.model.controlsModel);
	},

	render: function() {
		var yearIdx = this.model.baseModel.get("yearIdx");
		var data = this.model.baseModel.get("data");

		if(data && yearIdx >= 0) {
			this.drawData(this.model.baseModel.get("data"));	
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
				.attr("transform", "translate(" + (self.labelWidth + self.m[3]) + "," + (self.m[0]+graphHeight) + ")" )
				.attr("class", "x axis")
				.call(this.xAxis);

			this.svg.append("g")
				.attr("transform", "translate(" + (self.labelWidth + self.m[3]) + "," + (self.m[0]) + ")" )
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
	},


	processMeanData: function(source, type) {
		var data = this.model.baseModel.get("data");

		console.dir(data);

		// return an empty array if we don't have data
		if(typeof(data) === "undefined" || typeof(data.extra) === "undefined" || typeof(data.extra) === "undefined") {
			return [];
		}

		//
		switch(+source) {
			case 0:
				return [];
			case 1:
				return [];
			case 2:
				switch(+type) {
					case 0:
						var avg = data.extra.overall.avg;
						return d3.entries(data.extra.point_data).map(function(d,i){
							return {x: d.key, y: avg }
						});
					case 1:
						return d3.entries(data.extra.point_data).map(function(d,i){
							return {x: d.key, y: d.value.avg }
						});
				}

		}

		console.log('-------------[ error: unexpected source/type combo ]-------------------');

	},

	processConeData: function(means, type, range) {
		var data = this.model.baseModel.get("data");

		console.dir(data);

		// return an empty array if we don't have data
		if(typeof(data) === "undefined" || typeof(data.extra) === "undefined" || typeof(data.extra) === "undefined") {
			return [];
		}

		//

		switch(+type) {
			case 0:
				return [];
			case 1:
				var range = [-2,2];
				return d3.entries(data.extra.point_data).map(function(d,i){
					return {x: d.key, y0: d.value.avg + (d.value.sd * range[0]), y1: d.value.avg + (d.value.sd * range[1]) }
				});				
			case 2:
				var avg = data.extra.overall.avg;
				var range = [-15,15];
				return d3.entries(data.extra.point_data).map(function(d,i){
					return {x: d.key, y0: avg + range[0], y1: avg + range[1] }
				});
		}


		console.log('-------------[ error: unexpected source/type combo ]-------------------');

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

//
//
// 
//
//

IRA.Views.Overall.SidePanel = Backbone.View.extend({
	events: {

	},

	initialize: function() {

		this.listenTo(this.model.baseModel, "change:data", this.dataChanged );

		var data = this.model.baseModel.get("data");
		this.histogramModel = new IRA.Models.LineGraphModel({
			data: null, 
			xDomain: [0,100],
			xTicks: 3,
			yTicks: 3
		});


		this.transformBaseData(data);
		this.histogram = new IRA.Views.LineGraph({el: "#sp-histogram", model: this.histogramModel });
		this.coderlist = new IRA.Views.LayerView({el: "#sp-coderlist", collection: this.model.layers });
	},

	onClose: function() {
		this.model.baseModel.unbind("change:data", this.dataChanged);
	},

	render: function() {

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
		var baseData = this.model.baseModel.get("data");
		this.transformBaseData(baseData);
	},

	
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


//
//
// 
//
//

IRA.Views.Overall.DetailsPane = Backbone.View.extend({
	events: {
	},

	initialize: function() {
		this.listenTo(this.model, "change", this.render);
		//this.listenTo(this.model, "change:data", this.dataChanged );

		//this.yearSelectView = new IRA.Views.YearSelect({el: "#yearselect", model: this.model });


		this.logdetails = new IRA.Views.Overall.LogDetailsPane({model: this.model });
		this.pairdetails = new IRA.Views.Overall.PairDetailsPane({model: this.model });

		this.addSubview(this.logdetails);
		this.addSubview(this.pairdetails);

		this.render();
	},

	addOne: function(item) {
		var view = new IRA.Views.LayerItemView({model: item});
		this.$("ul", this.el).append(view.render().el);
	},

	addAll: function() {
		this.collection.each(this.addOne, this);
	},	

	onClose: function() {

	},

	render: function() {
		if(this.model) {
			var html = _.template($("#templ-detailspane").html());
			$(this.el).html(html);

			html = "";
			if(this._subviews) {
				this._subviews.forEach(function(subview){
					this.$("#details", this.el).append(subview.render().el);
				});
			}

		}		
	},

});

//
//
// 
//
//

IRA.Views.Overall.LogDetailsPane = Backbone.View.extend({
	tagName: "div",
	events: {
	},

	initialize: function() {
		//this.listenTo(this.model, "change:data", this.dataChanged );

		this.render();
	},

	onClose: function() {

	},

	render: function() {
		if(this.model) {
			this.$el.html(_.template($("#templ-log-details-panel").html(), this.model.attributes));
			this.$el.attr('id', 'log_details');
			this.$el.addClass("pull_left details_panel span3");

			return this;
		} else {
			return null;
		}
		
	},

});


//
//
// 
//
//

IRA.Views.Overall.PairDetailsPane = Backbone.View.extend({
	tagName: "div",
	events: {
	},

	initialize: function() {
		//this.listenTo(this.model, "change:data", this.dataChanged );

		this.render();
	},

	onClose: function() {

	},

	render: function() {
		if(this.model) {
			this.$el.html(_.template($("#templ-pair-details-panel").html(), this.model.attributes));
			this.$el.attr('id', 'pair_details');
			this.$el.addClass("pull_left details_panel span3");

			return this;
		} else {
			return null;
		}
	},

});

