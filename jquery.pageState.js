// Page state is a jQuery plugin that stores the state of form inputs on a
// page behind an anchor in the URL.
// TODO:
//   * add a delay so you don't make a billion requests
//   * add optional 'ignored' selector for inputs that should get updated in the URL but should NOT trigger and ajax call
//   * add before ajax callback
(function($){
  $.pageState = function(options) {
    // console.log("DEBUG: Initializing pageState...");
    var options = $.extend({}, options);
    
    // Store the options as a var
    $.pageState.options = options;
    
    var state = {};
    
    if (typeof(options.only) == 'undefined') {
      var inputs = $(':input');
    } else {
      var inputs = $(options.only).find(':input');
      
      // If this is a form, bind its submit to request data instead of
      // submitting the form
      $(options.only).find('form').submit(function() {
        $.pageState.requestData();
        return false;
      });
    }
    
    // Store the name/values of all inputs as key/values in the data cache
    var getParams = $.extend({}, 
      queryString2Obj(window.location.search), 
      queryString2Obj(window.location.hash)
    );
    inputs.each(function() {
      // console.log("DEBUG: Working on input: ", this);
      var name = $(this).attr('name');
      
      // Ignore unnamed inputs
      if (typeof(name) == 'undefined' || name == '') { return true; };
      
      switch ($(this).attr('type')) {
        case 'checkbox':
          // console.log("\tDEBUG: Working on checkbox...");
          if (typeof(getParams[name]) == 'undefined') {
            state[name] = getCheckboxVal(this);
          } else {
            state[name] = getParams[name];
            setCheckboxVals(this, state[name]);
          };
          $(this).change(function() {
            $.pageState.change($(this).attr('name'), getCheckboxVal(this));
          });
          break;
        case 'radio':
          if (typeof(getParams[name]) == 'undefined') {
            state[name] = getRadioVal(this);
          } else {
            state[name] = getParams[name];
            setRadioVal(this, state[name]);
          };
          $(this).change(function() {
            $.pageState.change($(this).attr('name'), getRadioVal(this));
          });
          break;
        default:
          // Store it
          // If the input is also a GET param in the URL, set its value to the
          // URL value (URL is the king)
          if (typeof(getParams[name]) == 'undefined') {
            state[name] = $(this).val();
          } else {
            state[name] = getParams[name];
            $(this).val(state[name]);
          };

          // Bind changes to the input to update the data cache and the url
          $(this).change(function() {
            $.pageState.change($(this).attr('name'), $(this).val());
          });
      }
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
      anchorObj = queryString2Obj(window.location.hash);
    };
    
    // Extend the hash with the current page state
    anchorObj = $.extend(anchorObj, $.pageState.state);
    
    // Write the anchor portion back to the URL
    var anchorStr = '#' + obj2QueryString(anchorObj);
    if (anchorStr != '#') {
      window.location.hash = anchorStr;
    };
  }
  
  // Convert a URL query string to an object literal
  function queryString2Obj(str) {
    str = str.replace(/^[\?#]+/, '');
    var pieces = str.split('&');
    var obj = {};
    jQuery.each(pieces, function() {
      var bits = this.split('=');
      obj[bits[0]] = bits[1];
    });
    return obj;
  }
  
  function obj2QueryString(obj) {
    var pieces = [];
    jQuery.each(obj, function(k,v) {
      if (typeof(v) != 'undefined' && v != '') {
        pieces.push(k+'='+v); 
      };
    });
    return pieces.join('&');
  }
  
  function getCheckboxVal(input) {
    var name = $(input).attr('name');
    return $.makeArray(
      $(":checkbox[name='"+name+"']:checked").map(
        function() {return $(this).val()}
      )
    );
  }
  
  function getRadioVal(input) {
    var name = $(input).attr('name');
    return $("input[name='"+name+"']:checked").val();
  }
  
  function setCheckboxVals(input, values) {
    // console.log("DEBUG: Setting checkbox val to ", values, "for input: ", this);
    var name = $(input).attr('name');
    $("input[name='"+name+"']").each(function() {
      // console.log('input: ', this);
      if ($.inArray(values, $(this).val())) {
        this.checked = true;
      } else {
        this.checked = false;
      };
    });
  }
  
  function setRadioVal(input, value) {
    var name = $(input).attr('name');
    $("input[name='"+name+"'][value='"+value+"']").get(0).checked = true;
  }
  
  $.pageState.requestData = function() {
    if (typeof($.pageState.options.dataHandler) != 'function') return false;
    
    // Fire away
    $.get(
      $.pageState.options.dataURL,
      $.pageState.state,
      $.pageState.options.dataHandler,
      $.pageState.options.dataType
    );
  };
  
  // Changes the pageState for a given key/value
  $.pageState.change = function(key, value) {
    // console.log("DEBUG: Fired change.  key: ", key, ", value: ", value);
    var tuple = {};
    tuple[key] = value;
    $.pageState.state = $.extend({}, $.pageState.state, tuple);
    $.pageState.requestData();
    updateURL();
  };
  
  $.pageState.defaults = {
    dataURL: window.location.pathname
  };
})(jQuery);
