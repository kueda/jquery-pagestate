// Page state is a jQuery plugin that stores the state of form inputs on a
// page behind an anchor in the URL.
(function($){
  $.pageState = function(options) {
    var options = $.extend({}, options);
    
    // Store the options as a var
    $.pageState.options = options;
    
    var state = {};
    
    if (typeof(options.only) == 'undefined') {
      var inputs = $("input[type!='submit']");
    } else {
      var inputs = $(options.only).find("input[type!='submit']");
    }
    
    // Store the name/values of all inputs as key/values in the data cache
    inputs.each(function() {
      console.log(this);
      var name = $(this).attr('name');
      if (typeof(name) == 'undefined' || name == '') { return false; };
      // Store it
      state[name] = $(this).val();
      
      // Bind changes to the input to update the data cache and the url
      $(this).change(function() {
        $.pageState.change($(this).attr('name'), $(this).val());
      });
    });
    
    // Create the pageState hash in the data cache
    $.pageState.state = state;
    
    // Reconstruct the URL
    updateURL();
  };
  
  $.fn.pageState = function(options) {
    var options = $.extend({}, options, {only: this});
    $.pageState(options);
  };
  
  // Update the URL with the current page state
  function updateURL() {
    // Grab the anchor portion of the URL and make it a hash
    var anchorObj = {};
    if (typeof(window.location.hash) != 'undefined') {
      var anchorStr = window.location.hash.substr(
        1,window.location.hash.length);
      $.each(anchorStr.split('&'), function() {
        if ($.trim(this) != '') {
          anchorObj[this.split('=')[0]] = this.split('=')[1];
        };
      });
    };
    console.log('anchorObj: ', anchorObj);
    
    // Extend the hash with the current page state
    anchorObj = $.extend(anchorObj, $.pageState.state);
    
    // Write the anchor portion back to the URL
    var anchorStr = '#';
    var anchorBits = [];
    $.each(anchorObj, function(k,v) {
      anchorBits.push(k + '=' + v);
    });
    anchorStr += anchorBits.join('&');
    window.location.hash = anchorStr;
  }
  
  $.pageState.requestData = function() {
    if (typeof($.pageState.options.dataHandler) != 'function') return false;
    
    // Fire away
    $.get(
      $.pageState.options.dataURL,
      $.pageState.options.state,
      $.pageState.options.dataHandler,
      $.pageState.options.dataType
    );
  }
  
  // Changes the pageState for a given key/value
  $.pageState.change = function(key, value) {
    console.log("Fired $.pageState.change with key: ", key, ", value: ", value);
    var tuple = {};
    tuple[key] = value;
    $.pageState.state = $.extend($.pageState.state, tuple);
    $.pageState.requestData();
    updateURL();
  };
  
  $.pageState.defaults = {
    dataURL: window.location.pathname
  };
})(jQuery);
