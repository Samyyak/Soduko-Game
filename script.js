var timerCount = 0;
var setTimer;

function displayTimer() {
    if (timerCount == null) {
        timerCount = 0;
    }
    timerCount += 1;
    let m = Math.floor(timerCount / 60);
    let s = timerCount % 60;
    if (s < 10) {
        s = "0" + s;
    }
    document.getElementById("timer").innerHTML = m + ":" + s;
}

function getBoard() {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("submitButton").setAttribute("disabled", "");
    document.getElementById("clearButton").setAttribute("disabled", "");
    window.clearInterval(setTimer);
    document.getElementById("actions").classList.add("pending");

    var level = document.getElementById("level").value;
    if (level == null || (level !== 'easy' && level !== 'medium' && level !== 'hard')) {
        level = 'easy'; 
    }

    var targetUrl = `https://sugoku.herokuapp.com/board?difficulty=${level}`;

    fetch(targetUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(response => {
            createBoard(response.board); 
        })
        .catch(() => {
            var fallbackBoard = [
                [3, 0, 6, 5, 0, 8, 4, 0, 0],
                [5, 2, 0, 0, 0, 0, 0, 0, 0],
                [0, 8, 7, 0, 0, 0, 0, 3, 1],
                [0, 0, 3, 0, 1, 0, 0, 8, 0],
                [9, 0, 0, 8, 6, 3, 0, 0, 5],
                [0, 5, 0, 0, 9, 0, 6, 0, 0],
                [1, 3, 0, 0, 0, 0, 2, 5, 0],
                [0, 0, 0, 0, 0, 0, 0, 7, 4],
                [0, 0, 5, 2, 0, 6, 3, 0, 0]
            ];
            window.localStorage.setItem("board", JSON.stringify(fallbackBoard));
            setUpBoard();
        })
        .finally(() => {
            document.getElementById("overlay").style.display = "none";
            document.getElementById("submitButton").removeAttribute("disabled");
            document.getElementById("clearButton").removeAttribute("disabled");
            document.getElementById("actions").classList.remove("pending");
        });
}


function createBoard(squares) {
    const board = Array(9).fill().map(() => Array(9).fill(0));

    squares.forEach(square => {
        const { x, y, value } = square;
        board[y][x] = value;
    });

    window.localStorage.setItem("board", JSON.stringify(board));
    setUpBoard();
}

function setUpBoard() {
    timerCount = 0;
    document.getElementById("timer").innerHTML = "0:00";
    document.getElementById("submitButton").setAttribute("disabled", "");
    document.getElementById("clearButton").setAttribute("disabled", "");

    const board = JSON.parse(window.localStorage.getItem("board"));

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cl = `row-${r} col-${c}`;
            const el = document.getElementsByClassName(cl)[0];
            el.value = null;
            el.classList.remove("background-salmon", "wrong-answer");
            el.removeAttribute("onfocus", "onblur", "type", "maxLength", "disabled");

            if (board[r][c] != 0) {
                el.value = board[r][c];
            } else {
                el.removeAttribute("disabled");
                el.setAttribute("type", "text");
                el.setAttribute("maxLength", 1);
                el.setAttribute("onfocus", "highlight(this)");
                el.setAttribute("onblur", "clearHighlight()");
            }
        }
    }

    solveBoard(board);
    window.localStorage.setItem("solved", JSON.stringify(board));
    document.getElementById("submitButton").removeAttribute("disabled");
    document.getElementById("clearButton").removeAttribute("disabled");
    document.getElementById("actions").classList.remove("pending");
    document.getElementById("overlay").style.display = "none";
    setTimer = window.setInterval(displayTimer, 1000);
}

function highlight(element) {
    element.classList.remove("wrong-answer");
    const classes = element.className.split(" ");
    classes.forEach(c => {
        const elements = document.getElementsByClassName(c);
        Array.from(elements).forEach(el => {
            el.classList.add("background-gray");
        });
    });
}

function clearHighlight() {
    const elements = document.getElementsByClassName("background-gray");
    Array.from(elements).forEach(el => {
        el.classList.remove("background-gray");
    });
}

function solveBoard(board) {
    const rows = Array(9).fill().map(() => new Set());
    const cols = Array(9).fill().map(() => new Set());
    const squares = Array(9).fill().map(() => new Set());

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const s = 3 * Math.floor(r / 3) + Math.floor(c / 3);
            if (board[r][c] != 0) {
                rows[r].add(board[r][c]);
                cols[c].add(board[r][c]);
                squares[s].add(board[r][c]);
            }
        }
    }

    function isValid(value, row, col, square) {
        return !rows[row].has(value) && !cols[col].has(value) && !squares[square].has(value);
    }

    function helper(r, c) {
        if (r === 9) return true;
        const nextR = c === 8 ? r + 1 : r;
        const nextC = c === 8 ? 0 : c + 1;
        if (board[r][c] !== 0) return helper(nextR, nextC);

        for (let v = 1; v <= 9; v++) {
            const s = 3 * Math.floor(r / 3) + Math.floor(c / 3);
            if (isValid(v, r, c, s)) {
                board[r][c] = v;
                rows[r].add(v);
                cols[c].add(v);
                squares[s].add(v);
                if (helper(nextR, nextC)) return true;
                board[r][c] = 0;
                rows[r].delete(v);
                cols[c].delete(v);
                squares[s].delete(v);
            }
        }
        return false;
    }

    helper(0, 0);
}

function clearboard() {
    const board = JSON.parse(window.localStorage.getItem("board"));

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cl = `row-${r} col-${c}`;
            const el = document.getElementsByClassName(cl)[0];
            el.classList.remove("wrong-answer");

            if (board[r][c] == 0) {
                el.value = null;
            }
        }
    }
}

function resetGame() {
    timerCount = 0;
    document.getElementById("timer").innerHTML = "0:00";
    window.clearInterval(setTimer);
    document.getElementById("submitButton").setAttribute("disabled", "");
    document.getElementById("clearButton").setAttribute("disabled", "");

    const elements = document.querySelectorAll("#grid input");
    Array.from(elements).forEach(el => {
        el.value = null;
        el.removeAttribute("onfocus", "onblur", "type", "maxLength", "disabled");
        el.classList.remove("background-salmon", "wrong-answer");
    });

    document.getElementById("actions").classList.remove("pending");
    document.getElementById("overlay").style.display = "none";
}

function check() {
    const board = JSON.parse(window.localStorage.getItem("board"));
    const solved = JSON.parse(window.localStorage.getItem("solved"));

    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cl = `row-${r} col-${c}`;
            const el = document.getElementsByClassName(cl)[0];

            if (board[r][c] == 0) {
                if (solved[r][c] != el.value) {
                    el.classList.add("wrong-answer");
                } else {
                    el.classList.remove("wrong-answer");
                    el.classList.add("background-salmon");
                    el.setAttribute("disabled", "");
                    el.removeAttribute("onfocus", "onblur", "type", "maxLength");
                    board[r][c] = solved[r][c];
                    window.localStorage.setItem("board", JSON.stringify(board));
                }
            }
        }
    }
}

function giveHint() {
    const board = JSON.parse(window.localStorage.getItem("board"));
    const solved = JSON.parse(window.localStorage.getItem("solved"));

    let hintGiven = false;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] == 0) {
                const cl = `row-${r} col-${c}`;
                const el = document.getElementsByClassName(cl)[0];
                el.value = solved[r][c];
                el.classList.add("background-salmon");
                el.setAttribute("disabled", "");
                el.removeAttribute("onfocus", "onblur", "type", "maxLength");
                board[r][c] = solved[r][c];
                window.localStorage.setItem("board", JSON.stringify(board));
                hintGiven = true;
                break;
            }
        }
        if (hintGiven) break;
    }
}
