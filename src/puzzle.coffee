# count inversions of an array.
# this will be used to check if a situation is solvable.
countInversions = (array) ->
    if array.length <= 1
        return 0
    return countInversions(array[1..]) + (n for n in array when array[0] > n).length


# return a function can run many times,
# but it only calls callback once when it runs at the specified times.
runOnceAt = (at, callback) ->
    n = 0
    once = ->
        n += 1
        if n == at
            callback.apply(this, arguments)
    return once


arraySwap = (array, x, y) ->
    c = array[x]
    array[x] = array[y]
    array[y] = c


int = (obj) ->
    if toString.call(obj) == '[object String]'
        return parseInt(obj, 10)
    return obj


# square width is different at different column.
#
# the leftmost @colResidual columns have width of @sqWidth + 1,
# the rest columns have width of @sqWidth.
getWidth = (col) ->
    return if col <= @colResidual then @sqWidth + 1 else @sqWidth


# same as width, different rows different height.
getHeight = (row) ->
    return if row <= @rowResidual then @sqHeight + 1 else @sqHeight


# the distance from left border of the board to squares at COL
getLeft = (col) ->
    return (col - 1) * (@sqWidth + @spacing) + (if col <= @colResidual then col - 1 else @colResidual)


# the distance from top border of the board to squares at ROW
getTop = (row) ->
    return (row - 1) * (@sqHeight + @spacing) + (if row <= @rowResidual then row - 1 else @rowResidual)


# background position X
getPosX = (origCol, col) ->
    posX = -1 * getLeft.call(this, origCol)
    if col? and origCol == @cols and col <= @colResidual
        posX += 1
    return posX


# background position Y
getPosY = (origRow, row) ->
    posY = -1 * getTop.call(this, origRow)
    if row? and origRow == @rows and row <= @rowResidual
        posY += 1
    return posY


# move square to (row, col) dynamically.
slowlyMove = (row, col, callback) ->
    css = {
        left: getLeft.call(@board, col)
        top: getTop.call(@board, row)
        height: getHeight.call(@board, row)
        width: getWidth.call(@board, col)
    }

    if @origCol == @board.cols
        css['background-position-x'] = getPosX.call(@board, @origCol, col)

    if @origRow == @board.rows
        css['background-position-y'] = getPosY.call(@board, @origRow, row)

    moveCallback = =>
        @board.status.moving -= 1
        callback?.apply(this)

    @board.status.moving += 1

    @div.animate(css, moveCallback)


# swap current square with the square at (row, col).
swap = (row, col) ->
    if @row == row and @col == col
        return this

    square = @board.squareMatrix[row][col]

    # calculate incompletions
    if row == @origRow and col == @origCol
        # back to original position
        @board.incompletions -= 1
    else if @row == @origRow and @col == @origCol
        # leave from original position
        @board.incompletions += 1
    if square
        if @row == square.origRow and @col == square.origCol
            # back to original position
            @board.incompletions -= 1
        else if square.row == square.origRow and square.col == square.origCol
            # leave from original position
            @board.incompletions += 1

    # swap
    @board.squareMatrix[row][col] = this
    @board.squareMatrix[@row][@col] = square
    if square
        square.row = @row
        square.col = @col
    else
        # empty square
        @board.emptyRow = @row
        @board.emptyCol = @col
    @row = row
    @col = col

    return this


class Square
    constructor: (id, board, row, col) ->
        @id = id
        # original and current positions.
        @origRow = @row = row
        @origCol = @col = col
        # which board this square belongs.
        @board = board
        @bindings = {
            one: {}
            always: {}
            proxy: {}
        }

        @div = $('<div></div>')
        @board.carpet.append(@div)
        @redraw()
        @div.data('id', id)

        return this

    # re-apply CSS attributes.
    redraw: ->
        css = {
            position: 'absolute'
            left: getLeft.call(@board, @col)
            top: getTop.call(@board, @row)
            width: getWidth.call(@board, @col)
            height: getHeight.call(@board, @row)
            'background-image': @board.image
            'background-position-x': getPosX.call(@board, @origCol, @col)
            'background-position-y': getPosY.call(@board, @origRow, @row)
        }

        @div.css(css)
        return this

    # return if square is movable.
    isMovable: ->
        # square is movable only if it is adjacent to the empty square.
        if @board.emptyCol == @col
            movable = @board.emptyRow == @row - 1 or @board.emptyRow - 1 == @row
        else if @board.emptyRow == @row
            movable = @board.emptyCol == @col - 1 or @board.emptyCol - 1 == @col
        else
            movable = false

        return movable

    # swap squares with animation
    swap: (row, col, callback) ->
        dest = @board.squareMatrix[row][col]
        swap.call(this, row, col)
        if dest
            callback = callback and runOnceAt(2, callback)
            slowlyMove.call(dest, dest.row, dest.col, callback)
        slowlyMove.call(this, @row, @col, callback)

        return this

    # bind event 'done' and 'step' to callback.
    stepCallback = (callback) ->
        =>
            callback?.apply(this)
            @trigger('step')
            if @board.isComplete() and @board.status.moving == 0
                @board.trigger('done')

    # shift current square if it's adjacent empty square.
    step: (callback) ->
        if @isMovable()
            callback = stepCallback.call(this, callback)
            @swap(@board.emptyRow, @board.emptyCol, callback)
        return this

    # shift current row or col if possible
    steps: (callback) ->
        callback = stepCallback.call(this, callback)

        if @board.emptyCol == @col
            once = runOnceAt(Math.abs(@board.emptyRow - @row), callback)
            for row in [@board.emptyRow .. @row]
                @board.squareMatrix[row][@col]?.swap(@board.emptyRow, @board.emptyCol, once)

        else if @board.emptyRow == @row
            once = runOnceAt(Math.abs(@board.emptyCol - @col), callback)
            for col in [@board.emptyCol .. @col]
                @board.squareMatrix[@row][col]?.swap(@board.emptyRow, @board.emptyCol, once)

        return this

    # bind jQuery events
    # in the callback function "this" refers to square.
    bind: (event, handler, one=false) ->
        bindings = if one then @bindings.one else @bindings.always
        if event not of bindings
            bindings[event] = []
        bindings[event].push(handler)

        if event not in ['step']
            @bindings.proxy[handler] = => handler.apply(this)
            if one
                @div.one(event, @bindings.proxy[handler])
            else
                @div.bind(event, @bindings.proxy[handler])

        return this

    # call all square handlers
    trigger: (event) ->
        if event of @bindings.always
            for handler in @bindings.always[event]
                handler?.call(this)

        if event of @bindings.one
            handlers = @bindings.one[event]
            @bindings.one[event] = []
            for handler in handlers
                handler?.call(this)

        return this

    # unbind jQuery events
    unbind: (event, handler) ->
        for type in ['one', 'always']
            bindings = @bindings[type]
            if event of bindings
                bindings[event] = if handler?
                    (cc for cc in bindings[event] when cc isnt handler)
                else
                    []

        if event not in ['step']
            if handler of @bindings.proxy
                @div.off(event, @bindings.proxy[handler])
                delete @bindings.proxy[handler]
            else
                @div.off(event, handler)

        return this

    one: (event, handler) ->
        @bind(event, handler, true)
        return this

    reset: (callback) ->
        @swap(@origRow, @origCol, callback)
        return this


class Puzzle
    recalc = ->
        @carpet.width(@div.width()).height(@div.height())
        @sqHeight = Math.floor((@carpet.height() - (@rows - 1) * @spacing) / @rows)
        @sqWidth = Math.floor((@carpet.width() - (@cols - 1) * @spacing) / @cols)
        @rowResidual = (@carpet.height() - (@rows - 1) * @spacing) % @rows
        @colResidual = (@carpet.width() - (@cols - 1) * @spacing) % @cols

    # empty board and rebuild everything.
    rebuild: ->
        @div.empty()
        @carpet = $('<div style="position:relative; margin:0"></div>')
        @div.append(@carpet)
        @incompletions = 0
        @squareList = []
        @squareMatrix = []
        @emptyRow = @rows
        @emptyCol = @cols

        recalc.apply(this)

        # create squares
        id = 0
        for row in [1 .. @rows]
            @squareMatrix[row] = []
            for col in [1 .. @cols]
                if row == @emptyRow and col == @emptyCol
                    square = null
                else
                    square = new Square(id, this, row, col)
                    @squareList[id] = square
                    id += 1
                @squareMatrix[row][col] = square

        @$squares = @carpet.children()

        # rebind events
        bindings = @bindings.one
        @bindings.one = {}
        for event, handlers of bindings
            @bind(event, handler, true) for handler in handlers

        bindings = @bindings.always
        @bindings.always = {}
        for event, handlers of bindings
            @bind(event, handler) for handler in handlers

        return this

    # re-apply each square's CSS attributes.
    redraw = ->
        # redraw after shuffling, resetting, or stepping.
        if @status.shuffling > 0
            @one('shuffle', redraw)

        else if @status.resetting > 0
            @one('reset', redraw)

        else if @status.moving > 0
            @one('step', => redraw.apply(this))

        recalc.apply(this)

        for square in @squareList
            square.redraw()

        return this

    constructor: (div, options={}) ->
        defaults = {
            div: div
            rows: 4
            cols: 4
            spacing: 0
        }

        for key, value of defaults
            if key not of options
                options[key] = value

        @bindings = {
            one: {}
            always: {}}

        @status = {
            moving: 0
            shuffling: 0
            resetting: 0
        }

        @set(options)

    # changing options takes effect immediately.
    set: (options={}) ->
        doRebuild = false
        doRedraw = false

        if 'div' of options
            @div = options.div
            doRebuild = true

        if 'rows' of options
            @rows = options.rows
            doRebuild = true

        @rows = int(@rows)

        if @rows < 2
            throw {msg: 'at least 2 rows required.'}

        if 'cols' of options
            @cols = options.cols
            doRebuild = true

        @cols = int(@cols)

        if @cols < 2
            throw {msg: 'at least 2 cols required.'}

        if 'spacing' of options
            @spacing = options.spacing
            doRedraw = true

        @spacing = int(@spacing)

        if @spacing < 0
            throw {msg: 'spacing must be non-negative.'}

        if 'image' of options
            @image = options.image
            doRedraw = true

        if doRebuild
            @rebuild()

        if doRedraw
            redraw.apply(this)

        return this

    isSolvable = (array, rows, cols, emptyRow) ->
        # http://www.cs.bham.ac.uk/~mdr/teaching/modules04/java2/TilesSolvability.html
        # ( (grid width odd) && (#inversions even) )  ||
        # ( (grid width even) && ((blank on odd row from bottom) == (#inversions even)) )
        inversions = countInversions(array)
        return ((cols % 2 != 0) and (inversions % 2 == 0)) or
            ((cols % 2 == 0) and ((rows - emptyRow + 1) % 2 != inversions % 2))

    # check if current situation is solvable.
    isSolvable: ->
        return isSolvable(@map(-> @id), @rows, @cols, @emptyRow)

    shuffle: (callback) ->
        if @status.shuffling > 0
            return @one('shuffle', Puzzle.prototype.shuffle)

        # place empty square to the bottom right corner
        if @squareMatrix[@rows][@cols]
            @squareMatrix[@rows][@cols].swap(@emptyRow, @emptyCol)

        # get the map from square id to its position after shuffling.
        swapMap = {}
        squares = []
        @each(->
            squares.push(this)
            swapMap[@id] = [@row, @col])
        # Fisher–Yates shuffle
        # http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
        for last in [squares.length - 1 .. 1]
            rand = Math.floor(Math.random() * (last + 1))
            arraySwap(swapMap, squares[rand].id, squares[last].id)
            arraySwap(squares, last, rand)

        # shuffle by swapping
        for id, [row, col] of swapMap
            swap.call(@squareList[id], row, col)

        if not isSolvable(@map(-> @id), @rows, @cols, @emptyRow)
            # swapping arbitrary 2 squares always changes the
            # odd-even status of the number of inversions.
            #
            # according to the solvability formula giving at
            # http://www.cs.bham.ac.uk/~mdr/teaching/modules04/java2/TilesSolvability.html
            # if current situation is not solvable, then swapping
            # arbitrary 2 squares can always get a solvable situation.
            swap.call(@squareList[0], @squareList[1].row, @squareList[1].col)

        once = runOnceAt(@squareList.length, =>
            @status.shuffling -= 1
            callback?.apply(this)
            @trigger('shuffle')
        )

        @status.shuffling += 1
        @each(-> slowlyMove.call(this, @row, @col, once))

        return this

    # iterate through each square in the matrix (left to right, top to
    # bottom).
    each: (callback) ->
        for row in [1 .. @rows]
            for col in [1 .. @cols]
                if not @isEmpty(row, col)
                    callback.call(@squareMatrix[row][col], row, col)

        return this

    map: (callback) ->
        results = []
        @each((row, col)-> results.push(callback.call(this, row, col)))
        return results

    # return if all squares are at their original places
    isComplete: ->
        return @incompletions == 0

    isEmpty: (row, col) ->
        return not @squareMatrix[row][col]?

    # bind jQuery events or specific puzzle events
    bind: (event, handler, one=false) ->
        bindings = if one then @bindings.one else @bindings.always

        if event not of bindings
            bindings[event] = []
        bindings[event].push(handler)

        if event not in ['shuffle', 'reset', 'done']
            @each(-> @bind(event, handler, one))

        return this

    # unbind jQuery events or specific puzzle events
    unbind: (event, handler) ->
        for type in ['one', 'always']
            bindings = @bindings[type]
            if event of bindings
                bindings[event] = if handlers?
                    (cc for cc in bindings[event] when cc isnt handler)
                else
                    []

        if event not in ['shuffle', 'reset', 'done']
            @each(-> @unbind(event, handler))

        return this

    # handler runs at most one time.
    one: (event, handler) ->
        @bind(event, handler, true)
        return this

    # call all board handlers
    trigger: (event) ->
        if event of @bindings.always
            for handler in @bindings.always[event]
                handler?.call(this)

        if event of @bindings.one
            handlers = @bindings.one[event]
            @bindings.one[event] = []
            for handler in handlers
                handler?.call(this)

        return this

    # put back all squares to their original places
    reset: (callback) ->
        once = runOnceAt(@squareList.length, =>
            @status.resetting -= 1
            callback?.apply(this)
            @trigger('reset'))
        swap.call(sq, sq.origRow, sq.origCol) for sq in @squareList
        @status.resetting += 1
        @each(-> slowlyMove.call(this, @row, @col, once))
        return this


# jQuery plugin
do ($=jQuery) ->
    $.fn.puzzle = (options) ->
        puzzle = new Puzzle(this, options)