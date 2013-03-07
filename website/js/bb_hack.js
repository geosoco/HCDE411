(function(Backbone){
	Backbone.View.prototype.close = function(remove){
		if(remove === true ) {
			this.remove();
		}
	  this.unbind();
	  if (this.onClose){
	    this.onClose();
	  }
	}
})(Backbone, jQuery);