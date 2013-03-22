// Generated by CoffeeScript 1.4.0
(function() {
  var PUZZLE_EVENTS, Puzzle, Square, arraySwap, countInversions, getHeight, getLeft, getPosX, getPosY, getTop, getWidth, int, runOnceAt, slowlyMove, swap, triggerBoardEvent, triggerSquareEvent,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  PUZZLE_EVENTS = ['puzzle.done', 'puzzle.step', 'puzzle.shuffle', 'puzzle.reset'];

  countInversions = function(array) {
    var n;
    if (array.length <= 1) {
      return 0;
    }
    return countInversions(array.slice(1)) + ((function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        n = array[_i];
        if (array[0] > n) {
          _results.push(n);
        }
      }
      return _results;
    })()).length;
  };

  runOnceAt = function(at, callback) {
    var n, once;
    n = 0;
    once = function() {
      n += 1;
      if (n === at) {
        return callback.apply(this, arguments);
      }
    };
    return once;
  };

  triggerBoardEvent = function(event) {
    var callback, _i, _len, _ref, _results;
    if (event in this.bindings) {
      _ref = this.bindings[event];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback != null ? callback.apply(this) : void 0);
      }
      return _results;
    }
  };

  triggerSquareEvent = function(event) {
    var callback, _i, _len, _ref, _results;
    if (event in this.board.bindings) {
      _ref = this.board.bindings[event];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback != null ? callback.apply(this) : void 0);
      }
      return _results;
    }
  };

  arraySwap = function(array, x, y) {
    var c;
    c = array[x];
    array[x] = array[y];
    return array[y] = c;
  };

  int = function(obj) {
    if (toString.call(obj) === '[object String]') {
      return parseInt(obj, 10);
    }
    return obj;
  };

  getWidth = function(col) {
    if (col <= this.colResidual) {
      return this.sqWidth + 1;
    } else {
      return this.sqWidth;
    }
  };

  getHeight = function(row) {
    if (row <= this.rowResidual) {
      return this.sqHeight + 1;
    } else {
      return this.sqHeight;
    }
  };

  getLeft = function(col) {
    return (col - 1) * (this.sqWidth + this.spacing) + (col <= this.colResidual ? col - 1 : this.colResidual);
  };

  getTop = function(row) {
    return (row - 1) * (this.sqHeight + this.spacing) + (row <= this.rowResidual ? row - 1 : this.rowResidual);
  };

  getPosX = function(origCol, col) {
    var posX;
    posX = -1 * getLeft.call(this, origCol);
    if ((col != null) && origCol === this.cols && col <= this.colResidual) {
      posX += 1;
    }
    return posX;
  };

  getPosY = function(origRow, row) {
    var posY;
    posY = -1 * getTop.call(this, origRow);
    if ((row != null) && origRow === this.rows && row <= this.rowResidual) {
      posY += 1;
    }
    return posY;
  };

  slowlyMove = function(row, col, callback) {
    var css, moveCallback,
      _this = this;
    css = {
      left: getLeft.call(this.board, col),
      top: getTop.call(this.board, row),
      height: getHeight.call(this.board, row),
      width: getWidth.call(this.board, col)
    };
    if (this.origCol === this.board.cols) {
      css['background-position-x'] = getPosX.call(this.board, this.origCol, col);
    }
    if (this.origRow === this.board.rows) {
      css['background-position-y'] = getPosY.call(this.board, this.origRow, row);
    }
    moveCallback = function() {
      _this.board.status.moving -= 1;
      return callback != null ? callback.apply(_this) : void 0;
    };
    this.board.status.moving += 1;
    return this.div.animate(css, moveCallback);
  };

  swap = function(row, col) {
    var square;
    if (this.row === row && this.col === col) {
      return this;
    }
    square = this.board.squareMatrix[row][col];
    if (row === this.origRow && col === this.origCol) {
      this.board.incompletions -= 1;
    } else if (this.row === this.origRow && this.col === this.origCol) {
      this.board.incompletions += 1;
    }
    if (square) {
      if (this.row === square.origRow && this.col === square.origCol) {
        this.board.incompletions -= 1;
      } else if (square.row === square.origRow && square.col === square.origCol) {
        this.board.incompletions += 1;
      }
    }
    this.board.squareMatrix[row][col] = this;
    this.board.squareMatrix[this.row][this.col] = square;
    if (square) {
      square.row = this.row;
      square.col = this.col;
    } else {
      this.board.emptyRow = this.row;
      this.board.emptyCol = this.col;
    }
    this.row = row;
    this.col = col;
    return this;
  };

  Square = (function() {
    var stepCallback;

    function Square(id, board, row, col) {
      this.id = id;
      this.origRow = this.row = row;
      this.origCol = this.col = col;
      this.board = board;
      this.bindingProxy = {};
      this.div = $('<div></div>');
      this.board.carpet.append(this.div);
      this.redraw();
      return this;
    }

    Square.prototype.redraw = function() {
      var css;
      css = {
        position: 'absolute',
        left: getLeft.call(this.board, this.col),
        top: getTop.call(this.board, this.row),
        width: getWidth.call(this.board, this.col),
        height: getHeight.call(this.board, this.row),
        'background-image': this.board.image,
        'background-position-x': getPosX.call(this.board, this.origCol, this.col),
        'background-position-y': getPosY.call(this.board, this.origRow, this.row)
      };
      this.div.css(css);
      return this;
    };

    Square.prototype.isMovable = function() {
      var movable;
      if (this.board.emptyCol === this.col) {
        movable = this.board.emptyRow === this.row - 1 || this.board.emptyRow - 1 === this.row;
      } else if (this.board.emptyRow === this.row) {
        movable = this.board.emptyCol === this.col - 1 || this.board.emptyCol - 1 === this.col;
      } else {
        movable = false;
      }
      return movable;
    };

    Square.prototype.swap = function(row, col, callback) {
      var dest;
      dest = this.board.squareMatrix[row][col];
      swap.call(this, row, col);
      if (dest) {
        callback = callback && runOnceAt(2, callback);
        slowlyMove.call(dest, dest.row, dest.col, callback);
      }
      slowlyMove.call(this, this.row, this.col, callback);
      return this;
    };

    stepCallback = function(callback) {
      var _this = this;
      return function() {
        if (callback != null) {
          callback.apply(_this);
        }
        triggerSquareEvent.call(_this, 'puzzle.step');
        if (_this.board.isComplete() && _this.board.status.moving === 0) {
          return triggerBoardEvent.call(_this.board, 'puzzle.done');
        }
      };
    };

    Square.prototype.step = function(callback) {
      if (this.isMovable()) {
        callback = stepCallback.call(this, callback);
        this.swap(this.board.emptyRow, this.board.emptyCol, callback);
      }
      return this;
    };

    Square.prototype.steps = function(callback) {
      var col, once, row, _i, _j, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      callback = stepCallback.call(this, callback);
      if (this.board.emptyCol === this.col) {
        once = runOnceAt(Math.abs(this.board.emptyRow - this.row), callback);
        for (row = _i = _ref = this.board.emptyRow, _ref1 = this.row; _ref <= _ref1 ? _i <= _ref1 : _i >= _ref1; row = _ref <= _ref1 ? ++_i : --_i) {
          if ((_ref2 = this.board.squareMatrix[row][this.col]) != null) {
            _ref2.swap(this.board.emptyRow, this.board.emptyCol, once);
          }
        }
      } else if (this.board.emptyRow === this.row) {
        once = runOnceAt(Math.abs(this.board.emptyCol - this.col), callback);
        for (col = _j = _ref3 = this.board.emptyCol, _ref4 = this.col; _ref3 <= _ref4 ? _j <= _ref4 : _j >= _ref4; col = _ref3 <= _ref4 ? ++_j : --_j) {
          if ((_ref5 = this.board.squareMatrix[this.row][col]) != null) {
            _ref5.swap(this.board.emptyRow, this.board.emptyCol, once);
          }
        }
      }
      return this;
    };

    Square.prototype.bind = function(event, callback) {
      var squareCallback,
        _this = this;
      squareCallback = function() {
        return callback.apply(_this);
      };
      this.bindingProxy[callback] = squareCallback;
      this.div.bind(event, squareCallback);
      return this;
    };

    Square.prototype.unbind = function(event, callback) {
      if (callback != null) {
        if (callback in this.bindingProxy) {
          this.div.unbind(event, this.bindingProxy[callback]);
          delete this.bindingProxy[callback];
        } else {
          this.div.unbind(event, callback);
        }
      } else {
        this.div.unbind(event);
      }
      return this;
    };

    Square.prototype.reset = function(callback) {
      this.swap(this.origRow, this.origCol, callback);
      return this;
    };

    return Square;

  })();

  Puzzle = (function() {
    var isSolvable, recalc, redraw;

    recalc = function() {
      this.carpet.width(this.div.width()).height(this.div.height());
      this.sqHeight = Math.floor((this.carpet.height() - (this.rows - 1) * this.spacing) / this.rows);
      this.sqWidth = Math.floor((this.carpet.width() - (this.cols - 1) * this.spacing) / this.cols);
      this.rowResidual = (this.carpet.height() - (this.rows - 1) * this.spacing) % this.rows;
      return this.colResidual = (this.carpet.width() - (this.cols - 1) * this.spacing) % this.cols;
    };

    Puzzle.prototype.rebuild = function() {
      var bindings, callbacks, cc, col, event, id, row, square, _i, _j, _k, _len, _ref, _ref1;
      this.div.empty();
      this.carpet = $('<div style="position:relative; margin:0"></div>');
      this.div.append(this.carpet);
      this.incompletions = 0;
      this.squareList = [];
      this.squareMatrix = [];
      this.emptyRow = this.rows;
      this.emptyCol = this.cols;
      recalc.apply(this);
      id = 0;
      for (row = _i = 1, _ref = this.rows; 1 <= _ref ? _i <= _ref : _i >= _ref; row = 1 <= _ref ? ++_i : --_i) {
        this.squareMatrix[row] = [];
        for (col = _j = 1, _ref1 = this.cols; 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; col = 1 <= _ref1 ? ++_j : --_j) {
          if (row === this.emptyRow && col === this.emptyCol) {
            square = null;
          } else {
            square = new Square(id, this, row, col);
            this.squareList[id] = square;
            id += 1;
          }
          this.squareMatrix[row][col] = square;
        }
      }
      bindings = this.bindings;
      this.bindings = {};
      for (event in bindings) {
        callbacks = bindings[event];
        for (_k = 0, _len = callbacks.length; _k < _len; _k++) {
          cc = callbacks[_k];
          this.bind(event, cc);
        }
      }
      return this;
    };

    redraw = function() {
      var square, _i, _len, _ref,
        _this = this;
      if (this.status.shuffling > 0) {
        this.one('puzzle.shuffle', function() {
          return redraw.apply(_this);
        });
      } else if (this.status.resetting > 0) {
        this.one('puzzle.reset', function() {
          return redraw.apply(_this);
        });
      } else if (this.status.moving > 0) {
        this.one('puzzle.step', function() {
          return redraw.apply(_this);
        });
      }
      recalc.apply(this);
      _ref = this.squareList;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        square = _ref[_i];
        square.redraw();
      }
      return this;
    };

    function Puzzle(div, options) {
      var defaults, key, value;
      if (options == null) {
        options = {};
      }
      defaults = {
        div: div,
        rows: 4,
        cols: 4,
        spacing: 0
      };
      for (key in defaults) {
        value = defaults[key];
        if (!(key in options)) {
          options[key] = value;
        }
      }
      this.bindings = {};
      this.status = {
        moving: 0,
        shuffling: 0,
        resetting: 0
      };
      this.set(options);
    }

    Puzzle.prototype.set = function(options) {
      var doRebuild, doRedraw;
      if (options == null) {
        options = {};
      }
      doRebuild = false;
      doRedraw = false;
      if ('div' in options) {
        this.div = options.div;
        doRebuild = true;
      }
      if ('rows' in options) {
        this.rows = options.rows;
        doRebuild = true;
      }
      this.rows = int(this.rows);
      if (this.rows < 2) {
        throw {
          msg: 'at least 2 rows required.'
        };
      }
      if ('cols' in options) {
        this.cols = options.cols;
        doRebuild = true;
      }
      this.cols = int(this.cols);
      if (this.cols < 2) {
        throw {
          msg: 'at least 2 cols required.'
        };
      }
      if ('spacing' in options) {
        this.spacing = options.spacing;
        doRedraw = true;
      }
      this.spacing = int(this.spacing);
      if (this.spacing < 0) {
        throw {
          msg: 'spacing must be non-negative.'
        };
      }
      if ('image' in options) {
        this.image = options.image;
        doRedraw = true;
      }
      if (doRebuild) {
        this.rebuild();
      }
      if (doRedraw) {
        redraw.apply(this);
      }
      return this;
    };

    isSolvable = function(array, rows, cols, emptyRow) {
      var inversions;
      inversions = countInversions(array);
      return ((cols % 2 !== 0) && (inversions % 2 === 0)) || ((cols % 2 === 0) && ((rows - emptyRow + 1) % 2 !== inversions % 2));
    };

    Puzzle.prototype.isSolvable = function() {
      return isSolvable(this.map(function() {
        return this.id;
      }), this.rows, this.cols, this.emptyRow);
    };

    Puzzle.prototype.shuffle = function(callback) {
      var col, id, last, once, rand, row, squares, swapMap, _i, _ref, _ref1,
        _this = this;
      if (this.squareMatrix[this.rows][this.cols]) {
        this.squareMatrix[this.rows][this.cols].swap(this.emptyRow, this.emptyCol);
      }
      swapMap = {};
      squares = [];
      this.each(function() {
        squares.push(this);
        return swapMap[this.id] = [this.row, this.col];
      });
      for (last = _i = _ref = squares.length - 1; _ref <= 1 ? _i <= 1 : _i >= 1; last = _ref <= 1 ? ++_i : --_i) {
        rand = Math.floor(Math.random() * (last + 1));
        arraySwap(swapMap, squares[rand].id, squares[last].id);
        arraySwap(squares, last, rand);
      }
      for (id in swapMap) {
        _ref1 = swapMap[id], row = _ref1[0], col = _ref1[1];
        swap.call(this.squareList[id], row, col);
      }
      if (!isSolvable(this.map(function() {
        return this.id;
      }), this.rows, this.cols, this.emptyRow)) {
        swap.call(this.squareList[0], this.squareList[1].row, this.squareList[1].col);
      }
      once = runOnceAt(this.squareList.length, function() {
        _this.status.shuffling -= 0;
        if (callback != null) {
          callback.apply(_this);
        }
        return triggerBoardEvent.call(_this, 'puzzle.shuffle');
      });
      this.status.shuffling += 1;
      this.each(function() {
        return slowlyMove.call(this, this.row, this.col, once);
      });
      return this;
    };

    Puzzle.prototype.each = function(callback) {
      var col, row, _i, _j, _ref, _ref1;
      for (row = _i = 1, _ref = this.rows; 1 <= _ref ? _i <= _ref : _i >= _ref; row = 1 <= _ref ? ++_i : --_i) {
        for (col = _j = 1, _ref1 = this.cols; 1 <= _ref1 ? _j <= _ref1 : _j >= _ref1; col = 1 <= _ref1 ? ++_j : --_j) {
          if (!this.isEmpty(row, col)) {
            callback.call(this.squareMatrix[row][col], row, col);
          }
        }
      }
      return this;
    };

    Puzzle.prototype.map = function(callback) {
      var results;
      results = [];
      this.each(function(row, col) {
        return results.push(callback.call(this, row, col));
      });
      return results;
    };

    Puzzle.prototype.isComplete = function() {
      return this.incompletions === 0;
    };

    Puzzle.prototype.isEmpty = function(row, col) {
      return !(this.squareMatrix[row][col] != null);
    };

    Puzzle.prototype.bind = function(event, handler) {
      if (!(event in this.bindings)) {
        this.bindings[event] = [];
      }
      this.bindings[event].push(handler);
      if (__indexOf.call(PUZZLE_EVENTS, event) < 0) {
        this.each(function() {
          return this.bind(event, handler);
        });
      }
      return this;
    };

    Puzzle.prototype.unbind = function(event, handler) {
      var cc, square, _i, _len, _ref;
      if (event in this.bindings) {
        this.bindings[event] = (function() {
          var _i, _len, _ref, _results;
          _ref = this.bindings[event];
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cc = _ref[_i];
            if (cc !== handler) {
              _results.push(cc);
            }
          }
          return _results;
        }).call(this);
      }
      if (__indexOf.call(PUZZLE_EVENTS, event) < 0) {
        _ref = this.squareList;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          square = _ref[_i];
          square.unbind(event, handler);
        }
      }
      return this;
    };

    Puzzle.prototype.one = function(event, handler) {
      var selfRemoveHandler;
      selfRemoveHandler = function() {
        handler.apply(this);
        return this.unbind(event, selfRemoveHandler);
      };
      this.bind(event, selfRemoveHandler);
      return this;
    };

    Puzzle.prototype.reset = function(callback) {
      var once, sq, _i, _len, _ref,
        _this = this;
      once = runOnceAt(this.squareList.length, function() {
        _this.status.resetting -= 1;
        if (callback != null) {
          callback.apply(_this);
        }
        return triggerBoardEvent.call(_this, 'puzzle.reset');
      });
      _ref = this.squareList;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sq = _ref[_i];
        swap.call(sq, sq.origRow, sq.origCol);
      }
      this.status.resetting += 1;
      this.each(function() {
        return slowlyMove.call(this, this.row, this.col, once);
      });
      return this;
    };

    return Puzzle;

  })();

  (function($) {
    return $.fn.puzzle = function(options) {
      var puzzle;
      return puzzle = new Puzzle(this, options);
    };
  })(jQuery);

}).call(this);