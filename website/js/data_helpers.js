function getNominalDomain(arr, fieldname) {
    var ret = {};
    arr.forEach(function(d,i){
      var item = d[fieldname].toLowerCase();
      ret[item] = 1;
    });

    return d3.keys(ret);
}

function getOrdinalDomain(arr, fieldname) {
    var ret = {
      min: Number.MAX_VALUE,
      max: Number.MIN_VALUE,
      values: []
    };
    var values = {};

    arr.forEach(function(d,i){
      var item = d[fieldname];
      ret.min = Math.min(ret.min, item);
      ret.max = Math.max(ret.max, item);
      values[item] = 1;
    });

    ret.values = d3.keys(values);

    return ret;
}

function getDescriptiveStats(arr, fieldname) {
    var ret = {
      min: Number.MAX_VALUE,
      max: Number.MIN_VALUE,
      sum: null,
      mean: null,
    };

    arr.forEach(function(d,i){
      var item = +d[fieldname];
      ret.min = Math.min(ret.min, item);
      ret.max = Math.max(ret.max, item);
      ret.sum += item;
    });

    ret.mean = ret.sum / arr.length;

    return ret;
}
