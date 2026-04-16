// ============================================================
// SECTION 0: SOUND SYSTEM
// ============================================================
function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'select') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 520;
            gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);

        } else if (type === 'move') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 440;
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.15);

        } else if (type === 'capture') {
            oscillator.type = 'square';
            oscillator.frequency.value = 260;
            gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.25);

        } else if (type === 'check') {
            oscillator.type = 'sine';
            oscillator.frequency.value = 660;
            gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
            gainNode.gain.setValueAtTime(0.18, ctx.currentTime + 0.13);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.25);

        } else if (type === 'checkmate') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 180;
            gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 1.0);
        }

    } catch (e) {
        console.warn('Sound could not play:', e);
    }
}


// ============================================================
// SECTION 1: PIECE IMAGE DICTIONARY
// ============================================================
const pieceImages = {
    '♔': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    '♕': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    '♖': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    '♗': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    '♘': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    '♙': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    '♚': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    '♛': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    '♜': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    '♝': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    '♞': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    '♟': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
};

const pieceNames = {
    '♔': 'White King', '♕': 'White Queen', '♖': 'White Rook',
    '♗': 'White Bishop', '♘': 'White Knight', '♙': 'White Pawn',
    '♚': 'Black King', '♛': 'Black Queen', '♜': 'Black Rook',
    '♝': 'Black Bishop', '♞': 'Black Knight', '♟': 'Black Pawn',
};

const PIECE_VALUES = {
    '♙': 100, '♘': 320, '♗': 330, '♖': 500, '♕': 900, '♔': 20000,
    '♟': 100, '♞': 320, '♝': 330, '♜': 500, '♛': 900, '♚': 20000,
};


// ============================================================
// SECTION 2: TEAM DEFINITIONS
// ============================================================
const whitePieces = ['♙', '♖', '♘', '♗', '♕', '♔'];
const blackPieces = ['♟', '♜', '♞', '♝', '♛', '♚'];


// ============================================================
// SECTION 3: GAME STATE
// ============================================================
const board = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
];

let selectedRow = null;
let selectedCol = null;
let isWhiteTurn = true;
let capturedByWhite = [];
let capturedByBlack = [];
let capturedWhiteHTML = null;
let capturedBlackHTML = null;
let isGameOver = false;
let gameStarted = false;
let gameMode = '2player';
let playerColor = 'white';

const CLOCK_SECONDS = 10 * 60;
let whiteTime = CLOCK_SECONDS;
let blackTime = CLOCK_SECONDS;
let clockInterval = null;

let moveHistory = [];
let undoStack = [];

let castlingRights = {
    whiteKingMoved: false,
    whiteRookAMoved: false,
    whiteRookHMoved: false,
    blackKingMoved: false,
    blackRookAMoved: false,
    blackRookHMoved: false,
};

let enPassantTarget = null;

let dragImg = null;
let dragOriginRow = null;
let dragOriginCol = null;


// ============================================================
// SECTION 4: HELPERS
// ============================================================

function getPieceHTML(piece) {
    if (piece === '') return '';
    const imageUrl = pieceImages[piece];
    const altText = pieceNames[piece] || piece;
    return `<img src="${imageUrl}" alt="${altText}" draggable="false">`;
}

function updateGraveyards() {
    capturedWhiteHTML.innerHTML = '';
    capturedBlackHTML.innerHTML = '';

    capturedByWhite.forEach(piece => {
        const img = document.createElement('img');
        img.src = pieceImages[piece];
        capturedWhiteHTML.appendChild(img);
    });

    capturedByBlack.forEach(piece => {
        const img = document.createElement('img');
        img.src = pieceImages[piece];
        capturedBlackHTML.appendChild(img);
    });
}

function clearHighlights() {
    document.querySelectorAll('.highlight').forEach(square => {
        square.classList.remove('highlight');
        square.classList.remove('capture');
    });
}

function showLegalMoves(piece, fromRow, fromCol) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isValidMove(piece, fromRow, fromCol, row, col) &&
                !wouldLeaveKingInCheck(piece, fromRow, fromCol, row, col)) {

                const targetSquare = document.getElementById(`square-${row}-${col}`);
                targetSquare.classList.add('highlight');

                if (board[row][col] !== '') {
                    targetSquare.classList.add('capture');
                }
            }
        }
    }
}


// ============================================================
// SECTION 5: MAIN — DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    const chessboardHTML = document.getElementById('chessboard');
    const statusDisplayHTML = document.getElementById('status-display');

    capturedWhiteHTML = document.getElementById('captured-white');
    capturedBlackHTML = document.getElementById('captured-black');

    const hasSavedGame = loadGameState();

    // Build the 64 squares
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {

            const square = document.createElement('div');
            square.classList.add('square');

            if ((row + col) % 2 === 0) {
                square.classList.add('light');
            } else {
                square.classList.add('dark');
            }

            square.id = `square-${row}-${col}`;
            square.innerHTML = getPieceHTML(board[row][col]);

            const img = square.querySelector('img');
            if (img) enableDragOnPiece(img, row, col);

            square.addEventListener('click', () => {

                if (isGameOver) return;

                if (selectedRow === null) {
                    const clickedPiece = board[row][col];

                    if (clickedPiece !== '') {
                        const isWhitePiece = whitePieces.includes(clickedPiece);
                        const isBlackPiece = blackPieces.includes(clickedPiece);

                        if ((isWhiteTurn && isWhitePiece) || (!isWhiteTurn && isBlackPiece)) {
                            selectedRow = row;
                            selectedCol = col;
                            square.classList.add('selected');
                            playSound('select');
                            showLegalMoves(clickedPiece, row, col);
                        } else {
                            console.log("Hey, wait your turn!");
                        }
                    }

                } else {
                    clearHighlights();

                    if (row === selectedRow && col === selectedCol) {
                        square.classList.remove('selected');

                    } else if (
                        board[row][col] !== '' &&
                        ((isWhiteTurn && whitePieces.includes(board[row][col])) ||
                            (!isWhiteTurn && blackPieces.includes(board[row][col])))
                    ) {
                        const prevSquare = document.getElementById(`square-${selectedRow}-${selectedCol}`);
                        prevSquare.classList.remove('selected');
                        selectedRow = row;
                        selectedCol = col;
                        square.classList.add('selected');
                        showLegalMoves(board[row][col], row, col);
                        return;

                    } else {
                        const pieceWeAreMoving = board[selectedRow][selectedCol];

                        const isBasicLegal = isValidMove(pieceWeAreMoving, selectedRow, selectedCol, row, col);
                        const leavesKingExposed = isBasicLegal && wouldLeaveKingInCheck(pieceWeAreMoving, selectedRow, selectedCol, row, col);

                        if (isBasicLegal && !leavesKingExposed) {

                            clearCheckHighlight();

                            const capturedPiece = board[row][col];
                            if (capturedPiece !== '') {
                                if (whitePieces.includes(pieceWeAreMoving)) {
                                    capturedByWhite.push(capturedPiece);
                                } else {
                                    capturedByBlack.push(capturedPiece);
                                }
                                updateGraveyards();
                            }

                            undoStack.push({
                                boardSnapshot: board.map(r => [...r]),
                                capturedByWhite: [...capturedByWhite],
                                capturedByBlack: [...capturedByBlack],
                                wasWhiteTurn: isWhiteTurn,
                                moveHistoryLen: moveHistory.length,
                            });

                            board[row][col] = pieceWeAreMoving;
                            board[selectedRow][selectedCol] = '';

                            // Update castling rights
                            if (pieceWeAreMoving === '♔') castlingRights.whiteKingMoved = true;
                            if (pieceWeAreMoving === '♚') castlingRights.blackKingMoved = true;
                            if (pieceWeAreMoving === '♖') {
                                if (selectedCol === 0) castlingRights.whiteRookAMoved = true;
                                if (selectedCol === 7) castlingRights.whiteRookHMoved = true;
                            }
                            if (pieceWeAreMoving === '♜') {
                                if (selectedCol === 0) castlingRights.blackRookAMoved = true;
                                if (selectedCol === 7) castlingRights.blackRookHMoved = true;
                            }

                            // Execute castling: move the rook too
                            if (pieceWeAreMoving === '♔' || pieceWeAreMoving === '♚') {
                                const colDiff = col - selectedCol;
                                if (colDiff === 2) {
                                    board[row][5] = board[row][7];
                                    board[row][7] = '';
                                    document.getElementById(`square-${row}-5`).innerHTML = getPieceHTML(board[row][5]);
                                    document.getElementById(`square-${row}-7`).innerHTML = '';
                                } else if (colDiff === -2) {
                                    board[row][3] = board[row][0];
                                    board[row][0] = '';
                                    document.getElementById(`square-${row}-3`).innerHTML = getPieceHTML(board[row][3]);
                                    document.getElementById(`square-${row}-0`).innerHTML = '';
                                }
                            }

                            // Update en passant target
                            if (pieceWeAreMoving === '♙' && selectedRow - row === 2) {
                                enPassantTarget = [selectedRow - 1, col];
                            } else if (pieceWeAreMoving === '♟' && row - selectedRow === 2) {
                                enPassantTarget = [selectedRow + 1, col];
                            } else {
                                enPassantTarget = null;
                            }

                            // Execute en passant: remove the captured pawn
                            const isEnPassant =
                                (pieceWeAreMoving === '♙' || pieceWeAreMoving === '♟') &&
                                enPassantTarget &&
                                row === enPassantTarget[0] &&
                                col === enPassantTarget[1] &&
                                capturedPiece === '';

                            if (isEnPassant) {
                                const capturedRow = selectedRow;
                                const capturedCol = col;
                                const epPawn = board[capturedRow][capturedCol];

                                if (whitePieces.includes(pieceWeAreMoving)) {
                                    capturedByWhite.push(epPawn);
                                } else {
                                    capturedByBlack.push(epPawn);
                                }

                                board[capturedRow][capturedCol] = '';
                                document.getElementById(`square-${capturedRow}-${capturedCol}`).innerHTML = '';
                                updateGraveyards();
                            }

                            if (capturedPiece !== '') {
                                playSound('capture');
                            } else {
                                playSound('move');
                            }

                            square.innerHTML = getPieceHTML(pieceWeAreMoving);
                            const movedImg = square.querySelector('img');
                            if (movedImg) enableDragOnPiece(movedImg, row, col);

                            const oldSquare = document.getElementById(`square-${selectedRow}-${selectedCol}`);
                            oldSquare.innerHTML = '';
                            oldSquare.classList.remove('selected');

                            recordMove(
                                pieceWeAreMoving,
                                selectedRow, selectedCol,
                                row, col,
                                capturedPiece !== ''
                            );

                            const promotionHappened = checkPromotion(row, col, () => {
                                isWhiteTurn = !isWhiteTurn;
                                afterMoveChecks(statusDisplayHTML);
                                saveGameState();
                            });

                            if (!promotionHappened) {
                                isWhiteTurn = !isWhiteTurn;
                                afterMoveChecks(statusDisplayHTML);
                                saveGameState();

                                if (gameMode === 'computer' && !isGameOver) {
                                    const computerColor = playerColor === 'white' ? 'black' : 'white';
                                    const isComputerTurn = computerColor === 'white' ? isWhiteTurn : !isWhiteTurn;
                                    if (isComputerTurn) {
                                        setTimeout(makeComputerMove, 1200);
                                    }
                                }
                            }

                        } else {
                            console.log("Illegal Move! Try somewhere else.");
                        }
                    }

                    selectedRow = null;
                    selectedCol = null;
                    document.querySelector('.selected')?.classList.remove('selected');
                }
            });

            chessboardHTML.appendChild(square);
        }
    }

    // Restore UI if a saved game was loaded (runs ONCE after all 64 squares are built)
    if (hasSavedGame && gameStarted) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = document.getElementById(`square-${r}-${c}`);
                if (sq) {
                    sq.innerHTML = getPieceHTML(board[r][c]);
                    const img = sq.querySelector('img');
                    if (img) enableDragOnPiece(img, r, c);
                }
            }
        }

        updateGraveyards();
        renderMoveHistory();

        const statusEl = document.getElementById('status-display');
        updateStatusDisplay(statusEl);

        const screen = document.getElementById('start-screen');
        if (screen) screen.classList.remove('active');

        if (!isGameOver) {
            startClock();
            updateTimerDisplay();
        }
    }
});


// ============================================================
// SECTION 5B: updateStatusDisplay()
// ============================================================
function updateStatusDisplay(statusElement, message = null) {
    if (message) {
        statusElement.innerText = message;
        return;
    }
    if (isWhiteTurn) {
        statusElement.innerText = "♔ White's Turn";
        statusElement.className = 'status-banner white-turn';
    } else {
        statusElement.innerText = "♚ Black's Turn";
        statusElement.className = 'status-banner black-turn';
    }
}


// ============================================================
// SECTION 5C: afterMoveChecks()
// ============================================================
function afterMoveChecks(statusElement) {
    const currentColor = isWhiteTurn ? 'white' : 'black';
    const inCheck = isKingInCheck(currentColor);
    const noMoves = getLegalMovesForColor(currentColor).length === 0;

    if (inCheck && noMoves) {
        isGameOver = true;
        playSound('checkmate');
        const winner = isWhiteTurn ? 'Black' : 'White';
        statusElement.innerText = `♚ Checkmate! ${winner} Wins!`;
        statusElement.className = 'status-banner checkmate';
        highlightKingInCheck(currentColor);

    } else if (!inCheck && noMoves) {
        isGameOver = true;
        statusElement.innerText = `🤝 Stalemate! It's a Draw!`;
        statusElement.className = 'status-banner stalemate';

    } else if (inCheck) {
        const kinginCheckSymbol = isWhiteTurn ? '♔' : '♚';
        statusElement.innerText = `${kinginCheckSymbol} Check!`;
        statusElement.className = isWhiteTurn
            ? 'status-banner white-turn in-check'
            : 'status-banner black-turn in-check';
        highlightKingInCheck(currentColor);
        playSound('check');

    } else {
        updateStatusDisplay(statusElement);
        if (!isGameOver) startClock();
        updateTimerDisplay();
    }
}


// ============================================================
// SECTION 6: MOVE VALIDATOR — isValidMove()
// ============================================================
function isValidMove(piece, startRow, startCol, endRow, endCol) {
    const rowDiff = endRow - startRow;
    const colDiff = endCol - startCol;
    const destinationPiece = board[endRow][endCol];
    const absRowDiff = Math.abs(rowDiff);
    const absColDiff = Math.abs(colDiff);

    const isWhitePiece = whitePieces.includes(piece);
    if (isWhitePiece && whitePieces.includes(destinationPiece)) return false;
    if (!isWhitePiece && blackPieces.includes(destinationPiece)) return false;

    // White Pawn
    if (piece === '♙') {
        if (colDiff === 0) {
            if (rowDiff === -1 && destinationPiece === '') return true;
            if (rowDiff === -2 && startRow === 6 && destinationPiece === '' && board[startRow - 1][startCol] === '') return true;
        }
        if (rowDiff === -1 && Math.abs(colDiff) === 1 && blackPieces.includes(destinationPiece)) return true;

        // En Passant (White)
        if (rowDiff === -1 && Math.abs(colDiff) === 1 &&
            enPassantTarget &&
            endRow === enPassantTarget[0] && endCol === enPassantTarget[1]) {
            return true;
        }

        return false;
    }

    // Black Pawn
    if (piece === '♟') {
        if (colDiff === 0) {
            if (rowDiff === 1 && destinationPiece === '') return true;
            if (rowDiff === 2 && startRow === 1 && destinationPiece === '' && board[startRow + 1][startCol] === '') return true;
        }
        if (rowDiff === 1 && Math.abs(colDiff) === 1 && whitePieces.includes(destinationPiece)) return true;

        // En Passant (Black)
        if (rowDiff === 1 && Math.abs(colDiff) === 1 &&
            enPassantTarget &&
            endRow === enPassantTarget[0] && endCol === enPassantTarget[1]) {
            return true;
        }

        return false;
    }

    // King
    if (piece === '♔' || piece === '♚') {
        if (absRowDiff <= 1 && absColDiff <= 1) return true;

        if (absRowDiff === 0 && absColDiff === 2) {
            const isWhiteKing = (piece === '♔');
            const kingRow = isWhiteKing ? 7 : 0;

            if (startRow !== kingRow || startCol !== 4) return false;
            if (isWhiteKing && castlingRights.whiteKingMoved) return false;
            if (!isWhiteKing && castlingRights.blackKingMoved) return false;

            const enemyColor = isWhiteKing ? 'black' : 'white';

            if (endCol === 6) {
                const rookMoved = isWhiteKing ? castlingRights.whiteRookHMoved : castlingRights.blackRookHMoved;
                if (rookMoved) return false;
                if (board[kingRow][5] !== '' || board[kingRow][6] !== '') return false;
                if (isKingInCheck(isWhiteKing ? 'white' : 'black')) return false;
                if (isSquareAttackedBy(kingRow, 5, enemyColor)) return false;
                if (isSquareAttackedBy(kingRow, 6, enemyColor)) return false;
                return true;
            }

            if (endCol === 2) {
                const rookMoved = isWhiteKing ? castlingRights.whiteRookAMoved : castlingRights.blackRookAMoved;
                if (rookMoved) return false;
                if (board[kingRow][1] !== '' || board[kingRow][2] !== '' || board[kingRow][3] !== '') return false;
                if (isKingInCheck(isWhiteKing ? 'white' : 'black')) return false;
                if (isSquareAttackedBy(kingRow, 3, enemyColor)) return false;
                if (isSquareAttackedBy(kingRow, 2, enemyColor)) return false;
                return true;
            }
        }

        return false;
    }

    // Knight
    if (piece === '♘' || piece === '♞') {
        if ((absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2)) return true;
        return false;
    }

    // Rook
    if (piece === '♖' || piece === '♜') {
        if (absRowDiff === 0 || absColDiff === 0) return isPathClear(startRow, startCol, endRow, endCol);
        return false;
    }

    // Bishop
    if (piece === '♗' || piece === '♝') {
        if (absRowDiff === absColDiff) return isPathClear(startRow, startCol, endRow, endCol);
        return false;
    }

    // Queen
    if (piece === '♕' || piece === '♛') {
        const isStraight = (absRowDiff === 0 || absColDiff === 0);
        const isDiagonal = (absRowDiff === absColDiff);
        if (isStraight || isDiagonal) return isPathClear(startRow, startCol, endRow, endCol);
        return false;
    }

    return false;
}


// ============================================================
// SECTION 7: PATH CHECKER — isPathClear()
// ============================================================
function isPathClear(startRow, startCol, endRow, endCol) {
    const rowStep = Math.sign(endRow - startRow);
    const colStep = Math.sign(endCol - startCol);

    let currentRow = startRow + rowStep;
    let currentCol = startCol + colStep;

    while (currentRow !== endRow || currentCol !== endCol) {
        if (board[currentRow][currentCol] !== '') return false;
        currentRow += rowStep;
        currentCol += colStep;
    }

    return true;
}


// ============================================================
// SECTION 8: PROMOTION
// ============================================================
function checkPromotion(row, col, onComplete) {
    const piece = board[row][col];

    if (piece === '♙' && row === 0) {
        showPromotionDialog(row, col, 'white', onComplete);
        return true;
    }

    if (piece === '♟' && row === 7) {
        showPromotionDialog(row, col, 'black', onComplete);
        return true;
    }

    return false;
}

function showPromotionDialog(row, col, color, onComplete) {
    const modal = document.getElementById('promotion-modal');
    const optionsContainer = modal.querySelector('.promotion-options');

    optionsContainer.innerHTML = '';

    const promotionPieces = color === 'white'
        ? ['♕', '♖', '♗', '♘']
        : ['♛', '♜', '♝', '♞'];

    promotionPieces.forEach(promotionPiece => {
        const btn = document.createElement('button');
        btn.className = 'promotion-btn';
        btn.innerHTML = `<img src="${pieceImages[promotionPiece]}" alt="${promotionPiece}">`;

        btn.addEventListener('click', () => {
            board[row][col] = promotionPiece;

            const square = document.getElementById(`square-${row}-${col}`);
            square.innerHTML = getPieceHTML(promotionPiece);

            modal.classList.remove('active');
            onComplete();
        });

        optionsContainer.appendChild(btn);
    });

    modal.classList.add('active');
}


// ============================================================
// SECTION 9: CHECK SYSTEM
// ============================================================
function findKing(color) {
    const kingSymbol = color === 'white' ? '♔' : '♚';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === kingSymbol) return [row, col];
        }
    }
    return null;
}

function isKingInCheck(color) {
    const kingPos = findKing(color);
    if (!kingPos) return false;
    const [kingRow, kingCol] = kingPos;
    const enemyColor = color === 'white' ? 'black' : 'white';
    return isSquareAttackedBy(kingRow, kingCol, enemyColor);
}

function isSquareAttackedBy(targetRow, targetCol, attackerColor) {
    const attackerPieces = attackerColor === 'white' ? whitePieces : blackPieces;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece === '' || !attackerPieces.includes(piece)) continue;
            if (isValidMove(piece, row, col, targetRow, targetCol)) return true;
        }
    }
    return false;
}

function wouldLeaveKingInCheck(piece, fromRow, fromCol, toRow, toCol) {
    const movingColor = whitePieces.includes(piece) ? 'white' : 'black';

    const originalAtDest = board[toRow][toCol];
    const originalAtSource = board[fromRow][fromCol];

    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';

    const kingSymbol = movingColor === 'white' ? '♔' : '♚';
    const enemyPieces = movingColor === 'white' ? blackPieces : whitePieces;

    let kingRow = -1, kingCol = -1;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === kingSymbol) {
                kingRow = r;
                kingCol = c;
            }
        }
    }

    let kingIsInCheck = false;
    outerLoop:
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p !== '' && enemyPieces.includes(p)) {
                if (isValidMove(p, r, c, kingRow, kingCol)) {
                    kingIsInCheck = true;
                    break outerLoop;
                }
            }
        }
    }

    board[toRow][toCol] = originalAtDest;
    board[fromRow][fromCol] = originalAtSource;

    return kingIsInCheck;
}

function getLegalMovesForColor(color) {
    const myPieces = color === 'white' ? whitePieces : blackPieces;
    const legalMoves = [];

    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece === '' || !myPieces.includes(piece)) continue;

            for (let toRow = 0; toRow < 8; toRow++) {
                for (let toCol = 0; toCol < 8; toCol++) {
                    if (isValidMove(piece, fromRow, fromCol, toRow, toCol)) {
                        if (!wouldLeaveKingInCheck(piece, fromRow, fromCol, toRow, toCol)) {
                            legalMoves.push({ fromRow, fromCol, toRow, toCol });
                        }
                    }
                }
            }
        }
    }
    return legalMoves;
}

function highlightKingInCheck(color) {
    const kingPos = findKing(color);
    if (!kingPos) return;
    const [row, col] = kingPos;
    const square = document.getElementById(`square-${row}-${col}`);
    if (square) square.classList.add('in-check');
}

function clearCheckHighlight() {
    document.querySelectorAll('.in-check').forEach(el => {
        el.classList.remove('in-check');
    });
}


// ============================================================
// SECTION 10: MOVE HISTORY & NOTATION
// ============================================================
function toChessNotation(row, col) {
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = 8 - row;
    return `${file}${rank}`;
}

function recordMove(piece, fromRow, fromCol, toRow, toCol, isCapture) {
    const color = whitePieces.includes(piece) ? 'white' : 'black';
    const turnNum = Math.ceil((moveHistory.length + 1) / 2);

    moveHistory.push({
        piece,
        from: toChessNotation(fromRow, fromCol),
        to: toChessNotation(toRow, toCol),
        capture: isCapture,
        color,
        turnNum,
    });

    renderMoveHistory();
}

function renderMoveHistory() {
    const moveList = document.getElementById('move-list');
    const moveCount = document.getElementById('move-count');
    if (!moveList) return;

    moveList.innerHTML = '';

    const total = moveHistory.length;
    if (moveCount) {
        moveCount.textContent = total === 0 ? '0 moves' :
            total === 1 ? '1 move' : `${total} moves`;
    }

    for (let i = 0; i < moveHistory.length; i += 2) {
        const whiteMove = moveHistory[i];
        const blackMove = moveHistory[i + 1];

        const formatMove = (m) => {
            const arrow = m.capture ? '×' : '→';
            return `${m.piece} ${m.from}${arrow}${m.to}`;
        };

        const row = document.createElement('div');
        row.className = 'move-row';

        const numSpan = document.createElement('span');
        numSpan.className = 'move-num';
        numSpan.textContent = `${whiteMove.turnNum}.`;

        const whiteSpan = document.createElement('span');
        whiteSpan.className = `move-white${whiteMove.capture ? ' is-capture' : ''}`;
        whiteSpan.textContent = formatMove(whiteMove);

        row.appendChild(numSpan);
        row.appendChild(whiteSpan);

        if (blackMove) {
            const blackSpan = document.createElement('span');
            blackSpan.className = `move-black${blackMove.capture ? ' is-capture' : ''}`;
            blackSpan.textContent = formatMove(blackMove);
            row.appendChild(blackSpan);
        }

        moveList.appendChild(row);
    }

    const panel = document.querySelector('.move-history-panel');
    if (panel) panel.scrollTop = panel.scrollHeight;
}


// ============================================================
// SECTION 11: RESTART — restartGame()
// ============================================================
function restartGame() {
    localStorage.removeItem(SAVE_KEY);

    const startingPositions = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
        ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
    ];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const startPiece = startingPositions[r][c];
            board[r][c] = startPiece;

            const sq = document.getElementById(`square-${r}-${c}`);
            if (sq) {
                sq.innerHTML = getPieceHTML(startPiece);
                const img = sq.querySelector('img');
                if (img) enableDragOnPiece(img, r, c);
                sq.classList.remove('selected', 'highlight', 'capture', 'in-check');
            }
        }
    }

    selectedRow = null;
    selectedCol = null;
    isWhiteTurn = true;
    capturedByWhite = [];
    capturedByBlack = [];
    isGameOver = false;
    moveHistory = [];
    undoStack = [];
    castlingRights = {
        whiteKingMoved: false, whiteRookAMoved: false, whiteRookHMoved: false,
        blackKingMoved: false, blackRookAMoved: false, blackRookHMoved: false,
    };
    whiteTime = CLOCK_SECONDS;
    blackTime = CLOCK_SECONDS;
    clearInterval(clockInterval);
    enPassantTarget = null;

    gameStarted = false;
    const screen = document.getElementById('start-screen');
    if (screen) screen.classList.add('active');

    playerColor = 'white';
    const colorPick = document.getElementById('color-pick');
    if (colorPick) colorPick.style.display = 'none';

    updateGraveyards();
    renderMoveHistory();
    applyBoardOrientation();

    const statusEl = document.getElementById('status-display');
    if (statusEl) {
        statusEl.innerText = "♔ White's Turn";
        statusEl.className = 'status-banner white-turn';
    }
}

function showColorPick() {
    document.getElementById('color-pick').style.display = 'flex';
}


// ============================================================
// SECTION 12: START GAME — startGame()
// ============================================================
function startGame(mode, color = 'white') {
    gameMode = mode;
    playerColor = color;
    gameStarted = true;

    const screen = document.getElementById('start-screen');
    screen.classList.remove('active');

    // Hide the color picker again (for next time)
    const colorPick = document.getElementById('color-pick');
    if (colorPick) colorPick.style.display = 'none';

    startClock();
    updateTimerDisplay();
    applyBoardOrientation();

    // If player picked Black, the computer (White) must move first!
    if (gameMode === 'computer' && playerColor === 'black') {
        setTimeout(makeComputerMove, 1200);
    }
}

function applyBoardOrientation() {
    const chessboard = document.getElementById('chessboard');
    const rankLabels = document.querySelector('.rank-labels');
    const fileLabels = document.querySelector('.file-labels');

    // Clear any old CSS rotation (from previous approach)
    chessboard.style.transform = '';
    document.querySelector('.board-wrapper').style.transform = '';
    if (rankLabels) rankLabels.style.transform = '';
    if (fileLabels) fileLabels.style.transform = '';
    document.querySelectorAll('.square img').forEach(img => img.style.transform = '');

    if (playerColor === 'black') {
        // Reorder squares: row 7→0, col 7→0 (Black's view: Black pieces at bottom)
        for (let row = 7; row >= 0; row--) {
            for (let col = 7; col >= 0; col--) {
                chessboard.appendChild(document.getElementById(`square-${row}-${col}`));
            }
        }
        // Update labels for Black's perspective
        if (rankLabels) rankLabels.innerHTML =
            '<span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span>';
        if (fileLabels) fileLabels.innerHTML =
            '<span>h</span><span>g</span><span>f</span><span>e</span><span>d</span><span>c</span><span>b</span><span>a</span>';
    } else {
        // Normal order: row 0→7, col 0→7 (White's view: White pieces at bottom)
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                chessboard.appendChild(document.getElementById(`square-${row}-${col}`));
            }
        }
        // Reset labels
        if (rankLabels) rankLabels.innerHTML =
            '<span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>';
        if (fileLabels) fileLabels.innerHTML =
            '<span>a</span><span>b</span><span>c</span><span>d</span><span>e</span><span>f</span><span>g</span><span>h</span>';
    }
}


// ============================================================
// SECTION 13: CHESS CLOCK
// ============================================================
function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const wEl = document.getElementById('timer-white');
    const bEl = document.getElementById('timer-black');
    if (!wEl || !bEl) return;

    wEl.textContent = `⏱ ${formatTime(whiteTime)}`;
    bEl.textContent = `⏱ ${formatTime(blackTime)}`;

    wEl.classList.toggle('active-clock', isWhiteTurn && !isGameOver);
    bEl.classList.toggle('active-clock', !isWhiteTurn && !isGameOver);

    wEl.classList.toggle('low-time', whiteTime <= 30);
    bEl.classList.toggle('low-time', blackTime <= 30);
}

function startClock() {
    clearInterval(clockInterval);
    if (isGameOver) return;
    if (!gameStarted) return;

    clockInterval = setInterval(() => {
        if (isGameOver) { clearInterval(clockInterval); return; }

        if (isWhiteTurn) {
            whiteTime--;
            if (whiteTime <= 0) {
                whiteTime = 0;
                clearInterval(clockInterval);
                isGameOver = true;
                const el = document.getElementById('status-display');
                el.innerText = '⏰ Time! Black Wins!';
                el.className = 'status-banner checkmate';
                playSound('checkmate');
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                blackTime = 0;
                clearInterval(clockInterval);
                isGameOver = true;
                const el = document.getElementById('status-display');
                el.innerText = '⏰ Time! White Wins!';
                el.className = 'status-banner checkmate';
                playSound('checkmate');
            }
        }

        updateTimerDisplay();
    }, 1000);
}


// ============================================================
// SECTION 14: DRAG & DROP
// ============================================================
function enableDragOnPiece(imgEl, row, col) {
    imgEl.addEventListener('mousedown', (e) => {
        const piece = board[row][col];
        if (!piece) return;

        const isMyPiece = (isWhiteTurn && whitePieces.includes(piece)) ||
            (!isWhiteTurn && blackPieces.includes(piece));
        if (!isMyPiece || isGameOver) return;

        e.preventDefault();

        dragOriginRow = row;
        dragOriginCol = col;
        dragImg = imgEl;

        imgEl.classList.add('piece-dragging');
        imgEl.style.left = `${e.clientX - 32}px`;
        imgEl.style.top = `${e.clientY - 32}px`;

        clearHighlights();
        document.querySelector('.selected')?.classList.remove('selected');
        selectedRow = row;
        selectedCol = col;
        document.getElementById(`square-${row}-${col}`).classList.add('selected');
        showLegalMoves(piece, row, col);
        playSound('select');
    });

    imgEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];

        const piece = board[row][col];
        if (!piece) return;

        const isMyPiece = (isWhiteTurn && whitePieces.includes(piece)) ||
            (!isWhiteTurn && blackPieces.includes(piece));
        if (!isMyPiece || isGameOver) return;

        dragOriginRow = row;
        dragOriginCol = col;
        dragImg = imgEl;

        imgEl.classList.add('piece-dragging');
        imgEl.style.left = `${touch.clientX - 32}px`;
        imgEl.style.top = `${touch.clientY - 32}px`;

        clearHighlights();
        document.querySelector('.selected')?.classList.remove('selected');
        selectedRow = row;
        selectedCol = col;
        document.getElementById(`square-${row}-${col}`).classList.add('selected');
        showLegalMoves(piece, row, col);
        playSound('select');
    }, { passive: false });
}

document.addEventListener('mousemove', (e) => {
    if (!dragImg) return;
    dragImg.style.left = `${e.clientX - 32}px`;
    dragImg.style.top = `${e.clientY - 32}px`;
});

document.addEventListener('touchmove', (e) => {
    if (!dragImg) return;
    e.preventDefault();
    const touch = e.touches[0];
    dragImg.style.left = `${touch.clientX - 32}px`;
    dragImg.style.top = `${touch.clientY - 32}px`;
}, { passive: false });

document.addEventListener('mouseup', (e) => {
    if (!dragImg) return;

    dragImg.classList.remove('piece-dragging');
    dragImg.style.left = '';
    dragImg.style.top = '';

    dragImg.style.display = 'none';
    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
    dragImg.style.display = '';

    const targetSquare = elementUnder?.closest('.square');

    if (targetSquare && targetSquare.id !== `square-${dragOriginRow}-${dragOriginCol}`) {
        targetSquare.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } else if (!targetSquare) {
        clearHighlights();
        document.getElementById(`square-${dragOriginRow}-${dragOriginCol}`)?.classList.remove('selected');
        selectedRow = null;
        selectedCol = null;
    }

    dragImg = null;
    dragOriginRow = null;
    dragOriginCol = null;
});

document.addEventListener('touchend', (e) => {
    if (!dragImg) return;

    const touch = e.changedTouches[0];

    dragImg.classList.remove('piece-dragging');
    dragImg.style.left = '';
    dragImg.style.top = '';

    dragImg.style.display = 'none';
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    dragImg.style.display = '';

    const targetSquare = elementUnder?.closest('.square');

    if (targetSquare && targetSquare.id !== `square-${dragOriginRow}-${dragOriginCol}`) {
        targetSquare.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    } else if (!targetSquare) {
        clearHighlights();
        document.getElementById(`square-${dragOriginRow}-${dragOriginCol}`)?.classList.remove('selected');
        selectedRow = null;
        selectedCol = null;
    }

    dragImg = null;
    dragOriginRow = null;
    dragOriginCol = null;
});


// ============================================================
// SECTION 15: UNDO — undoMove()
// ============================================================
function undoMove() {
    if (undoStack.length === 0) return;

    const snapshot = undoStack.pop();

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            board[r][c] = snapshot.boardSnapshot[r][c];
        }
    }

    capturedByWhite = snapshot.capturedByWhite;
    capturedByBlack = snapshot.capturedByBlack;
    isWhiteTurn = snapshot.wasWhiteTurn;
    isGameOver = false;

    moveHistory.splice(snapshot.moveHistoryLen);

    selectedRow = null;
    selectedCol = null;
    clearHighlights();
    clearCheckHighlight();
    document.querySelector('.selected')?.classList.remove('selected');

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.getElementById(`square-${r}-${c}`);
            if (sq) sq.innerHTML = getPieceHTML(board[r][c]);
            const img = sq.querySelector('img');
            if (img) enableDragOnPiece(img, r, c);
        }
    }

    saveGameState();

    updateGraveyards();
    renderMoveHistory();

    const statusEl = document.getElementById('status-display');
    updateStatusDisplay(statusEl);
}

// ============================================================
// SECTION 16: COMPUTER AI
// ============================================================
function makeComputerMove() {
    if (isGameOver) return;

    const computerColor = playerColor === 'white' ? 'black' : 'white';

    // Guard: only run on the computer's turn
    if (computerColor === 'white' && !isWhiteTurn) return;
    if (computerColor === 'black' && isWhiteTurn) return;

    const move = getBestComputerMove(computerColor);
    if (!move) return;

    const fromSquare = document.getElementById(`square-${move.fromRow}-${move.fromCol}`);
    fromSquare.click();

    setTimeout(() => {
        const toSquare = document.getElementById(`square-${move.toRow}-${move.toCol}`);
        toSquare.click();
    }, 50);
}



function evaluateBoard() {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece === '') continue;

            const value = PIECE_VALUES[piece] || 0;

            if (blackPieces.includes(piece)) {
                score += value;   // Black piece = good for Black
            } else {
                score -= value;   // White piece on board hurts Black
            }
        }
    }
    return score;
}

function minimax(depth, alpha, beta, isMaximizing) {
    if (depth === 0) return evaluateBoard();

    const color = isMaximizing ? 'black' : 'white';
    const moves = getLegalMovesForColor(color);

    if (moves.length === 0) {
        if (isKingInCheck(color)) {
            return isMaximizing ? -99999 : 99999;
        }
        return 0;
    }

    if (isMaximizing) {
        let best = -Infinity;
        for (const move of moves) {
            const piece = board[move.fromRow][move.fromCol];
            const captured = board[move.toRow][move.toCol];
            board[move.toRow][move.toCol] = piece;
            board[move.fromRow][move.fromCol] = '';

            const score = minimax(depth - 1, alpha, beta, false);

            board[move.fromRow][move.fromCol] = piece;
            board[move.toRow][move.toCol] = captured;

            best = Math.max(best, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return best;
    } else {
        let best = Infinity;
        for (const move of moves) {
            const piece = board[move.fromRow][move.fromCol];
            const captured = board[move.toRow][move.toCol];
            board[move.toRow][move.toCol] = piece;
            board[move.fromRow][move.fromCol] = '';

            const score = minimax(depth - 1, alpha, beta, true);

            board[move.fromRow][move.fromCol] = piece;
            board[move.toRow][move.toCol] = captured;

            best = Math.min(best, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
        }
        return best;
    }
}

function getBestComputerMove(computerColor) {
    const moves = getLegalMovesForColor(computerColor);
    if (moves.length === 0) return null;

    let bestMove = null;

    if (computerColor === 'black') {
        let bestScore = -Infinity;
        for (const move of moves) {
            const piece = board[move.fromRow][move.fromCol];
            const captured = board[move.toRow][move.toCol];
            board[move.toRow][move.toCol] = piece;
            board[move.fromRow][move.fromCol] = '';

            const score = minimax(2, -Infinity, Infinity, false);

            board[move.fromRow][move.fromCol] = piece;
            board[move.toRow][move.toCol] = captured;

            if (score > bestScore) { bestScore = score; bestMove = move; }
        }
    } else {
        // Computer plays White — wants to MINIMIZE score (since score is Black's perspective)
        let bestScore = Infinity;
        for (const move of moves) {
            const piece = board[move.fromRow][move.fromCol];
            const captured = board[move.toRow][move.toCol];
            board[move.toRow][move.toCol] = piece;
            board[move.fromRow][move.fromCol] = '';

            const score = minimax(2, -Infinity, Infinity, true);

            board[move.fromRow][move.fromCol] = piece;
            board[move.toRow][move.toCol] = captured;

            if (score < bestScore) { bestScore = score; bestMove = move; }
        }
    }

    return bestMove;
}



// ============================================================
// SECTION 17: GAME PERSISTENCE — localStorage
// ============================================================
const SAVE_KEY = 'grandmasterChess_save';

function saveGameState() {
    if (!gameStarted) return;

    const state = {
        board: board.map(r => [...r]),
        isWhiteTurn,
        capturedByWhite: [...capturedByWhite],
        capturedByBlack: [...capturedByBlack],
        isGameOver,
        moveHistory: [...moveHistory],
        castlingRights: { ...castlingRights },
        enPassantTarget,
        whiteTime,
        blackTime,
        gameStarted,
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadGameState() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    try {
        const state = JSON.parse(raw);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                board[r][c] = state.board[r][c];
            }
        }

        isWhiteTurn = state.isWhiteTurn;
        capturedByWhite = state.capturedByWhite || [];
        capturedByBlack = state.capturedByBlack || [];
        isGameOver = state.isGameOver;
        moveHistory = state.moveHistory || [];
        castlingRights = state.castlingRights || castlingRights;
        enPassantTarget = state.enPassantTarget || null;
        whiteTime = state.whiteTime ?? CLOCK_SECONDS;
        blackTime = state.blackTime ?? CLOCK_SECONDS;
        gameStarted = state.gameStarted || false;

        return true;

    } catch (e) {
        console.warn('Could not load saved game:', e);
        localStorage.removeItem(SAVE_KEY);
        return false;
    }
}
