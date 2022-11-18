import { MoveDetail, MoveReport } from "./Board";

type TreeNode = {
  parent?: TreeNode;
  moves: Record<string, TreeNode>;
  lastMove?: MoveDetail;
  fen: string;
  pgn: () => string;
};

export class GameTree {
  private root_: TreeNode;
  private fens_: Record<string, TreeNode>;
  private dom_ = (
    <div class="tree">
      <span class="move" active current>
        <span class="num">0.</span>
      </span>
    </div>
  ) as HTMLElement;

  constructor(fen: string) {
    this.root_ = { parent: null, fen, moves: {}, pgn: () => "" };
    this.fens_ = { [fen]: this.root_ };
  }

  addMove(move: MoveReport) {
    const oldNode = this.fens_[move.oldFen];
    if (!oldNode) {
      throw new Error(move.oldFen + " not in tree");
    }

    let newNode: TreeNode = this.fens_[move.newFen];
    if (newNode) {
      newNode.parent = oldNode;
    } else {
      newNode = {
        parent: oldNode,
        moves: {},
        fen: move.newFen,
        lastMove: move.move,
        pgn: () => "",
      };
      newNode.pgn = () => nodeToPgn(newNode);
      this.fens_[move.newFen] = newNode;
      this.render(move.newFen);
    }
    oldNode.moves[move.move.notation] = newNode;
    this.render(move.newFen);
  }

  toString() {
    return nodeToString(this.root_);
  }

  get(fen: string): TreeNode {
    return (
      this.fens_[fen] ?? { lastMove: null, pgn: () => "", fen: "", moves: {} }
    );
  }

  getDom() {
    return this.dom_;
  }

  render(highlightFen: string) {
    this.dom_.textContent = "";
    const highlights = new Set<string>();
    let last = this.fens_[highlightFen];
    while (last) {
      highlights.add(last.fen);
      last = last.parent;
    }
    this.dom_.append(...nodeToDom(this.root_, highlights, highlightFen));
  }
}

function nodeToString(node: TreeNode) {
  const movesSection: string = Object.entries(node.moves).length
    ? ":{" +
      Object.entries(node.moves)
        .map(([move, n]) => move + nodeToString(n))
        .join(",") +
      "}"
    : "";
  if (!node.parent) {
    return "root" + movesSection;
  }
  return movesSection;
}

function nodeToDom(
  node: TreeNode,
  highlights?: Set<string>,
  current?: string
): JSX.Element[] {
  const moves = Object.keys(node.moves);

  const { fullMoves, turn } = parseFen(node.fen);

  return [
    <span
      class="move"
      data-fen={node.fen}
      data-pgn={nodeToPgn(node)}
      active={highlights?.has(node.fen)}
      current={current === node.fen}
    >
      {turn === "black" && <span class="num">{fullMoves + "."}</span>}
      {node.lastMove?.notation ?? <span class="num">0.</span>}
    </span>,
    ...moves
      .map((move) => nodeToDom(node.moves[move], highlights, current))
      .flat(),
  ];
}

function nodeToPgn(node: TreeNode): string {
  if (!node || !node.lastMove) {
    return "";
  }
  const { turn, fullMoves } = parseFen(node.fen);
  const curr =
    (turn === "black" ? fullMoves + "." : "") + node.lastMove.notation;
  return nodeToPgn(node.parent) + " " + curr;
}

function parseFen(fen: string) {
  const parts = fen.split(" ");
  return {
    board: parts[0],
    turn: (parts[1] === "b" ? "black" : "white") as "black" | "white",
    castling: parts[2],
    enPassant: parts[3],
    halfMoves: parseInt(parts[4]),
    fullMoves: parseInt(parts[5]),
  };
}
