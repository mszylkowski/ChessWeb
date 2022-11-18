import { Move } from "chess.js";
import { Chess, Square } from "chess.js";
import { Chessground } from "chessground";
import type { Api } from "chessground/api";

import * as cg from "chessground/types";
import { Observer, Subscription } from "./Observer";

export type MoveDetail = { notation: string; from: string; to: string };
export type MoveReport = { oldFen: string; newFen: string; move: MoveDetail };

export class Board {
  chess: Chess;
  board: Api;
  private audio_ = new Audio("tatiana/move.ogg");
  private moveObserver_ = new Observer<MoveReport>();
  private dom_ = (<div></div>) as HTMLElement;

  constructor() {
    this.chess = new Chess();
    this.board = Chessground(this.dom_, {
      turnColor: "white",
      orientation: "white",
      premovable: {
        enabled: false,
      },
      movable: {
        free: false,
      },
      events: {
        move: (from, to) => {
          const oldFen = this.getFen();
          let move = this.chess.move({ from, to });
          if (!move) {
            move = this.chess.move({ from, to, promotion: "q" });
            if (move.promotion) {
              this.board.set({ fen: this.chess.fen() });
            }
          }
          if (!move) {
            return;
          }
          this.audio_.play();
          if (move.san.includes("+") /* check */) {
            this.board.set({ check: move.color === "b" ? "white" : "black" });
          }
          this.moveObserver_.set({
            move: { notation: move.san, from, to },
            oldFen,
            newFen: this.getFen(),
          });
        },
        select: (key: Square) => {
          const validMoves = this.chess.moves({
            verbose: true,
            square: key,
          }) as Move[];
          this.board.set({
            movable: {
              dests: new Map([
                [key, validMoves.map((move) => move.to as cg.Key)],
              ]),
            },
          });
        },
      },
    });
  }

  getFen() {
    return this.chess.fen();
  }

  onMove(func: Subscription<MoveReport>, initialize = false) {
    if (initialize) {
      func({ move: null, oldFen: null, newFen: this.board.getFen() });
    }
    return this.moveObserver_.subscribe(func);
  }

  setFen(fen: string, lastMove: MoveDetail) {
    this.board.set({
      fen,
      lastMove: lastMove
        ? [lastMove.from as cg.Key, lastMove.to as cg.Key]
        : [],
    });
    this.chess.load(fen);
  }

  getDom() {
    return this.dom_;
  }
}
