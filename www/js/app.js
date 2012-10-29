require.config({
  baseUrl: 'js/lib',
  paths: {'jquery':
      ['//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min',
       'jquery']},

});

// When you write javascript in separate files, list them as
// dependencies along with jquery
define("app", function(require) {

  var $ = require('jquery');

  var install = require('install');

  function updateInstallButton() {
      $(function() {
          var btn = $('#install');
          if(install.state == 'uninstalled') {
              btn.show();
          }
          else if(install.state == 'installed' || install.state == 'unsupported') {
              btn.hide();
          }
      });
  }

  install.on('change', updateInstallButton);

  install.on('error', function(e, err) {
      console.log(err.toString());
  });

  $(function() {
    $('#install').click(install);

    $('body').on('click touch', 'button', function() {
      var $this = $(this);
      var id = $this.prop('id');

      if ($this.hasClass('number')) {
        var digit = parseFloat(id);
        if (Stack.progress) {
          var num = Stack.pop();
          var negative = num < 0;
          num = Math.abs(num);

          if (Stack.decimal) {
            num = num + '';
            if (num.indexOf('.') == -1) {
              num += '.';
            }
            num += '' + digit;
            num = parseFloat(num);
          } else {
            num *= 10;
            num += digit;
          }
          if (negative) {
            num = -num;
          }
          Stack.push(num);
        } else {
          Stack.push(digit);
          Stack.progress = true;
        }
      }
      else if ($this.hasClass('operator')) {
        var op = Operators[id];
        if (op === undefined) {
          flash('error', 'Undefined operator ' + id);
        }
        op();
      }
      else if ($this.hasClass('action')) {
        if (id == 'enter') {
          Stack.decimal = false;
          Stack.progress = true;
          Stack.push(0);
        }
        else if (id == 'decimal') {
          Stack.decimal = true;
          Stack.progress = true;
          Stack.redraw();
        }
      } else {
        flash('error', 'wat');
      }
    });
  });
});

function flash(level, message) {
  var $msg = $('<span>' + message + '</span>')
    .addClass(level)
    .appendTo('.screen .messages');

  setTimeout(function() {
    $msg.fadeOut(1000);
  }, 3000);
}

function safe_op(n, op, stop_progress) {
  if (stop_progress === undefined) {
    stop_progress = true;
  }
  return function() {
    if (Stack.data.length < n) {
      flash('error', 'Not enough parameters.');
      return;
    } else {
      var args = [];
      var v;
      for (var i = 0; i < n; i++) {
        // Insert in reverse order.
        args.splice(0, 0, Stack.pop());
      }

      console.log(args);

      var ret = op.apply(this, args);
      if (ret instanceof Array) {
        for (var i = 0; i < ret.length; i++) {
          Stack.push(ret[i]);
        }
      } else if (ret !== undefined) {
        Stack.push(ret);
      }

      if (stop_progress) {
        Stack.progress = false;
        Stack.decimal = false;
      }
    }
  }
}

Operators = {
  add: safe_op(2, function(a, b) { return a + b; }),
  sub: safe_op(2, function(a, b) { return a - b; }),
  mul: safe_op(2, function(a, b) { return a * b; }),
  div: safe_op(2, function(a, b) { return a / b; }),
  neg: safe_op(1, function(a) { return -a; }, false),

  sin: safe_op(1, function(a) { return Math.sin(a); }),
  cos: safe_op(1, function(a) { return Math.cos(a); }),
  tan: safe_op(1, function(a) { return Math.tan(a); }),

  pow: safe_op(2, function(a, b) { return Math.pow(a, b); }),
  inv: safe_op(1, function(a) { return 1 / a; }),

  drop: safe_op(1, function(a) { return undefined; }),
  swap: safe_op(2, function(a, b) { return [b, a]; }),
}

Stack = {
  data: [],
  progress: false,
  decimal: false,
  push: function(n) {
    this.data.push(n );
    this.redraw();
  },
  pop: function() {
    var n = this.data.pop();
    this.redraw();
    return n;
  },
  redraw: function() {
    var disp = "";
    for (var i = 0; i < this.data.length; i++) {
      var num = this.data[i];
      if (this.decimal && i == this.data.length - 1) {
        num = num + '';
        if (num.indexOf('.') == -1) {
          num += '.';
        }
      }
      disp += '<span class="row">' + num + '</span>';
    }
    $('#main-screen .stack').html(disp);
  }
}
