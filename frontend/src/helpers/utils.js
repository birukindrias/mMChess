import {
  getRookMoves,
  getBishopMoves,
  getPawnMoves,
  getKnightMoves,
  getKingMoves,
} from "./pieceMoves";

export function getSquareColor(index) {
  const { row, col } = getRowCol(index);
  if (row % 2 === 0) {
    return col % 2 === 0 ? "light" : "dark";
  } else {
    return col % 2 === 0 ? "dark" : "light";
  }
}

export function getRowCol(index) {
  return {
    row: Math.floor(index / 8) + 1,
    col: index + 1 - Math.floor(index / 8) * 8,
  };
}

export function getIndex(row, col) {
  // Error giving index if either row or column is invalid
  if (row > 8 || col > 8 || row <= 0 || col <= 0) {
    return -1;
  }
  return col - 1 + 8 * (row - 1);
}

export function canMoveTo(board, pieceIndex, index) {
  if (index < 0 || index > 63) {
    return false;
  }
  const piece = board[pieceIndex];
  if (!board[index]) {
    return true;
  } else if (board[index] && board[index].color !== piece.color) {
    return true;
  }
  return false;
}

export function swap(board, index1, index2) {
  let swappedArray = [...board];
  const tmp = swappedArray[index2];
  swappedArray[index2] = swappedArray[index1];
  swappedArray[index1] = tmp;
  return swappedArray;
}

function checkCanAttackKing(board, index, kingIndex) {
  switch (board[index].pieceType) {
    case "B":
      if (getBishopMoves(board, index).includes(kingIndex)) {
        return true;
      }
      break;
    case "p":
      if (getPawnMoves(board, index).includes(kingIndex)) {
        return true;
      }
      break;
    case "H":
      if (getKnightMoves(board, index).includes(kingIndex)) {
        return true;
      }
      break;
    case "R":
      if (getRookMoves(board, index).includes(kingIndex)) {
        return true;
      }
      break;
    case "Q":
      if (
        getBishopMoves(board, index).includes(kingIndex) ||
        getRookMoves(board, index).includes(kingIndex)
      ) {
        return true;
      }
      break;
    case "K":
      if (getKingMoves(board, index).includes(kingIndex)) {
        return true;
      }
      break;
    default:
      throw Error(
        `Piecetype at index ${index} is ${board[index].pieceType}. This piecetype doesn't exist`
      );
  }
}

export function inCheck(board, kingColor) {
  const kingIndex = board.findIndex((curPiece) => {
    if (!curPiece) {
      return false;
    } else if (curPiece.color === kingColor && curPiece.pieceType === "K") {
      return true;
    } else {
      return false;
    }
  });
  const diagonalMoves = getBishopMoves(board, kingIndex);
  const verticalMoves = getRookMoves(board, kingIndex);
  const knightMoves = getKnightMoves(board, kingIndex);

  for (let index of diagonalMoves) {
    if (board[index] && board[index].color !== kingColor) {
      if (checkCanAttackKing(board, index, kingIndex)) {
        return true;
      }
    }
  }
  for (let index of verticalMoves) {
    if (board[index] && board[index].color !== kingColor) {
      if (checkCanAttackKing(board, index, kingIndex)) {
        return true;
      }
    }
  }
  for (let index of knightMoves) {
    if (board[index] && board[index].color !== kingColor) {
      if (checkCanAttackKing(board, index, kingIndex)) {
        return true;
      }
    }
  }
  return false;
}

function checkModifiedBoardInCheck(orgBoard, kingColor, fromIndex, toIndex) {
  let board = [...orgBoard];
  if (board[toIndex]) {
    board[toIndex] = "";
    board = swap(board, fromIndex, toIndex);
  } else {
    board = swap(board, fromIndex, toIndex);
  }
  return inCheck(board, kingColor);
}

export function checkCheckmated(board, kingColor) {
  let isCheckmated = true;
  for (let curIndex = 0; curIndex < board.length; curIndex++) {
    if (!isCheckmated) break;
    const piece = board[curIndex];
    if (piece === "" || piece.color !== kingColor) continue;
    let moves = [];
    switch (piece.pieceType) {
      case "p":
        moves = getPawnMoves(board, curIndex);
        break;
      case "B":
        moves = getBishopMoves(board, curIndex);
        break;
      case "H":
        moves = getKnightMoves(board, curIndex);
        break;
      case "R":
        moves = getRookMoves(board, curIndex);
        break;
      case "K":
        moves = getKingMoves(board, curIndex);
        break;
      case "Q":
        moves = getRookMoves(board, curIndex);
        moves.concat(getBishopMoves(board, curIndex));
        break;
      default:
        throw Error(
          `Piecetype at ${curIndex} is ${piece.pieceType}. This piecetype doesn't exist`
        );
    }
    for (let toIndex of moves) {
      if (!checkModifiedBoardInCheck(board, kingColor, curIndex, toIndex)) {
        isCheckmated = false;
        break;
      }
    }
  }
  return isCheckmated;
}

export function checkPromotion(board, curIndex, toIndex) {
  if (board[curIndex].pieceType !== "p") return false;
  if (board[curIndex].color === "white") {
    return getRowCol(toIndex).row === 8;
  } else {
    return getRowCol(toIndex).row === 1;
  }
}

export function checkCastlingRights(currentPieceIndex, pieceType, boardProps) {
  let finalObj = { ...boardProps };
  if (pieceType === "K") {
    if (boardProps.currentMove === "white") {
      finalObj.canWhiteKingSideCastle = false;
      finalObj.canWhiteQueenSideCastle = false;
    } else {
      finalObj.canBlackKingSideCastle = false;
      finalObj.canBlackQueenSideCastle = false;
    }
  } else if (pieceType === "R" && [0, 7, 56, 63].includes(currentPieceIndex)) {
    switch (currentPieceIndex) {
      case 7:
        finalObj.canWhiteQueenSideCastle = false;
        break;
      case 0:
        finalObj.canWhiteKingSideCastle = false;
        break;
      case 56:
        finalObj.canBlackKingSideCastle = false;
        break;
      case 63:
        finalObj.canBlackQueenSideCastle = false;
        break;
    }
  }
  return finalObj;
}

export function castledBoard(board, kingIndex, toIndex) {
  let finalBoard = [...board];
  finalBoard = swap(finalBoard, kingIndex, toIndex);
  switch (toIndex) {
    case 1:
      finalBoard = swap(finalBoard, 0, 2);
      break;
    case 5:
      finalBoard = swap(finalBoard, 7, 4);
      break;
    case 57:
      finalBoard = swap(finalBoard, 56, 58);
      break;
    case 61:
      finalBoard = swap(finalBoard, 63, 60);
      break;
  }
  return finalBoard;
}

function notationToRowCol(notation) {
  if (notation.length > 2) throw Error();
  return {
    row: notation[1],
    col: notation.charCodeAt(0) - 96,
  };
}

export function getMoves(boardProps, index) {
  let movableIndexes = [];
  let board = boardProps.board;
  const pieceType = board[index].pieceType;
  switch (pieceType) {
    case "R":
      movableIndexes = movableIndexes.concat(getRookMoves(board, index));
      break;
    case "p":
      movableIndexes = movableIndexes.concat(getPawnMoves(board, index));
      break;
    case "H":
      movableIndexes = movableIndexes.concat(getKnightMoves(board, index));
      break;
    case "B":
      movableIndexes = movableIndexes.concat(getBishopMoves(board, index));
      break;
    case "K":
      movableIndexes = movableIndexes.concat(
        getKingMoves(
          board,
          index,
          boardProps[
            `can${
              boardProps.currentMove.charAt(0).toUpperCase() +
              boardProps.currentMove.slice(1)
            }KingSideCastle`
          ],
          boardProps[
            `can${
              boardProps.currentMove.charAt(0).toUpperCase() +
              boardProps.currentMove.slice(1)
            }QueenSideCastle`
          ],
          boardProps[`${boardProps.currentMove}InCheck`]
        )
      );
      break;
    case "Q":
      movableIndexes = movableIndexes.concat(getRookMoves(board, index));
      movableIndexes = movableIndexes.concat(getBishopMoves(board, index));
      break;
    default:
      throw Error(
        `PieceType at ${index} is ${pieceType}. This pieceType doesn't exist.`
      );
  }
  // don't allow moves that would make the king in check
  movableIndexes = movableIndexes.filter((toIndex) => {
    if (board[toIndex] === "") {
      return !inCheck(swap(board, index, toIndex), boardProps.currentMove);
    } else {
      let tmp = [...board];
      tmp[toIndex] = "";
      return !inCheck(swap(tmp, toIndex, index), boardProps.currentMove);
    }
  });
  return movableIndexes;
}

export function isCastling(board, currentIndex, toIndex, boardProps) {
  if (board[currentIndex].pieceType !== "K") {
    return false;
  }
  const color = board[currentIndex].color;
  switch (toIndex) {
    case 1:
      if (color === "white" && boardProps.canWhiteKingSideCastle) {
        return true;
      } else {
        return false;
      }
    case 5:
      if (color === "white" && boardProps.canWhiteQueenSideCastle) {
        return true;
      } else {
        return false;
      }
    case 57:
      if (color === "black" && boardProps.canBlackKingSideCastle) {
        return true;
      } else {
        return false;
      }
    case 61:
      if (color === "black" && boardProps.canBlackQueenSideCastle) {
        return true;
      } else {
        return false;
      }
    default:
      return false;
  }
}

export const orgBoard = [
  { color: "white", pieceType: "R" },
  { color: "white", pieceType: "H" },
  { color: "white", pieceType: "B" },
  { color: "white", pieceType: "K" },
  { color: "white", pieceType: "Q" },
  { color: "white", pieceType: "B" },
  { color: "white", pieceType: "H" },
  { color: "white", pieceType: "R" },
  { color: "white", pieceType: "p" },
  { color: "white", pieceType: "p" },
  { color: "white", pieceType: "p" },
  { color: "white", pieceType: "p" },
  { color: "white", pieceType: "p" },
  { color: "white", pieceType: "p" },
  { color: "white", pieceType: "p" },
  { color: "white", pieceType: "p" },
]
  .concat(Array(32).fill(""))
  .concat([
    { color: "black", pieceType: "p" },
    { color: "black", pieceType: "p" },
    { color: "black", pieceType: "p" },
    { color: "black", pieceType: "p" },
    { color: "black", pieceType: "p" },
    { color: "black", pieceType: "p" },
    { color: "black", pieceType: "p" },
    { color: "black", pieceType: "p" },
    { color: "black", pieceType: "R" },
    { color: "black", pieceType: "H" },
    { color: "black", pieceType: "B" },
    { color: "black", pieceType: "K" },
    { color: "black", pieceType: "Q" },
    { color: "black", pieceType: "B" },
    { color: "black", pieceType: "H" },
    { color: "black", pieceType: "R" },
  ]);

export function getOrgBoardProps(running) {
  return {
    board: orgBoard,
    currentMove: "white",
    isMoving: false,
    movableSquares: [],
    movingPiece: null,
    canWhiteKingSideCastle: true,
    canWhiteQueenSideCastle: true,
    canBlackKingSideCastle: true,
    canBlackQueenSideCastle: true,
    whiteInCheck: false,
    blackInCheck: false,
    gameEnd: !running,
  };
}
