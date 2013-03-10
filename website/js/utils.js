/****************************************************************
 *
 *
 * Utils
 *
 *
 ****************************************************************/

// Namespace 
var Utils = Utils || {};


Utils.Math = {
	"trunc": function(value, places) {
		var dec_val = Math.pow(10,places);
		return Math.round(value * dec_val) / dec_val;
	}
};


