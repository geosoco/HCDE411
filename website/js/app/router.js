/****************************************************************
 *
 *
 * Router
 *
 *
 ****************************************************************/

var IRA = IRA || {};

IRA.IRAApp = Backbone.Router.extend({
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
		this.selectedMode = new IRA.Models.SelectedMode();
		this.selectedSession = new IRA.Models.SelectedSession();

		// views 
		this.modeSelectView = new IRA.Views.ModeSelect({el: "#mode-select", model: this.selectedMode });
		this.mainView = new IRA.Views.MainView({el: '#main-view', model: { selectedMode: this.selectedMode, selectedSession: this.selectedSession} });

		console.log('created subviews');

		this.selectedMode.set({mode: 0, overall_data: nestedOverallData, code_data: nestedCodeMap, user_data: nestedUserMap});
		this.selectedSession.set({ year: 2004, yearIdx: 0});

		console.log('starting history');
		console.log('router init finished');
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





