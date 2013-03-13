(function(Backbone){
	Backbone.View.prototype.close = function(remove){
		if(remove === true ) {
			this.remove();
		}
	  this.unbind();
	  if (this.onClose){
	    this.onClose();
	  }

	  // TODO: which calls are necessary... investigate
	  // is this the be-all-end-all call for this?
	  this.stopListening();

	  if(this._subviews) {
	  	this._subviews.forEach(function(subview){
	  		subview.close();
	  	});

	  	this._subviews = null;
	  }
	}

	Backbone.View.prototype.addSubview = function(view) {
		if(typeof this._subviews == "undefined" || this._subviews == null ) {
			this._subviews = [view];
		} else {
			this._subviews.push(view);
		}
	}
})(Backbone, jQuery);