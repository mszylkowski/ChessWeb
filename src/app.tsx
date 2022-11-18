import { Key } from "chessground/types";
import "tsx-dom";
import "./app.less";
import { Board } from "./Board";
import { GameTree } from "./GameTree";
import "./icon.svg";
import { StockfishWorker } from "./StockfishWorker";
import { pgnToResult } from "./Wikibooks";

const board = new Board();
const tree = new GameTree(board.getFen());

const title = (
  <h1>
    Openings Trainer <input type="checkbox"></input>
  </h1>
);
const results = (
  <table class="results">
    <tr>
      <th>Prop</th>
      <th>Value</th>
    </tr>
  </table>
);
const evalBar = <div class="eval-bar" />;
const wikiRead = (<ul class="wiki-read"></ul>) as HTMLElement;
const toggle = title.querySelector("input");

document.body.append(
  title,
  <div class="columns">
    {evalBar}
    {board.getDom()}
    {results}
  </div>,
  tree.getDom(),
  wikiRead
);

board.onMove(async (move) => {
  tree.addMove(move);
  const extract = await pgnToResult(tree.get(move.newFen).pgn());
  if (toggle.checked) stockfish.calculate(move.newFen);
  wikiRead.innerHTML = extract;
});

pgnToResult("-").then((extract) => {
  wikiRead.innerHTML = extract;
});

board.getDom().addEventListener("wheel", async (ev) => {
  let node = tree.get(board.getFen());
  if (ev.deltaY > 0) {
    for (let move in node.moves) {
      node = node.moves[move];
      break;
    }
  } else {
    if (node.parent) {
      node = node.parent;
    }
  }
  if (node.fen !== board.getFen()) {
    board.setFen(node.fen, node.lastMove);
    tree.render(node.fen);
    cleanResults();
    if (toggle.checked) stockfish.calculate(node.fen);
    const extract = await pgnToResult(node.pgn());
    wikiRead.innerHTML = extract;
  }
});

function cleanResults() {
  results.querySelectorAll("tr:not(:first-child)").forEach((x) => x.remove());
}

tree.getDom().addEventListener("click", (ev) => {
  const target = ev.target as HTMLElement;
  const { lastMove } = tree.get(target.dataset.fen);
  if (target.dataset.fen) {
    board.setFen(target.dataset.fen, lastMove);
    tree.render(target.dataset.fen);
    cleanResults();
    if (toggle.checked) stockfish.calculate(target.dataset.fen);
  }
});

function updateResult(report: Record<string, any>) {
  if (!toggle.checked) return;
  if (report.bestmove) {
    const orig: Key = report.bestmove.substring(0, 2);
    const dest: Key = report.bestmove.substring(2);
    board.board.setAutoShapes([
      { orig, dest, brush: "green", modifiers: { lineWidth: 3 } },
    ]);
  }
  const { score, ...rest } = report;

  if (score) {
    const [scoreType, scoreVal]: ["mate" | "cp", number] = [
      report.score[0],
      parseFloat(report.score[1]) * (board.chess.turn() === "w" ? 1 : -1),
    ];
    if (scoreType === "cp") {
      evalBar.textContent =
        (scoreVal >= 0 ? "+" : "-") +
        Math.abs(scoreVal * 0.01)
          .toString()
          .replace(/^0\./, ".")
          .substring(0, 3);
      evalBar.style.setProperty("--p", `${evalToPercentage(scoreVal * 0.01)}%`);
    } else {
      evalBar.textContent = `M${scoreVal}`;
      evalBar.style.setProperty("--p", `${50 - Math.sign(scoreVal) * 50}%`);
    }
    evalBar.dataset.winning = scoreVal >= 0 ? "white" : "black";
  }
  Object.entries(rest).forEach(([k, v]) => {
    if (v === undefined) return;
    if (k === "nodes") {
      v = new Intl.NumberFormat("en-US", {
        notation: "compact",
      }).format(parseInt(v));
    }
    let resultEntry = results.querySelector(`[data-k="${k}"]`);
    const parsedV = v.toString().replaceAll(",", " ");
    if (!resultEntry) {
      resultEntry = (
        <tr data-k={k}>
          <td>{k}</td>
          <td>{parsedV}</td>
        </tr>
      );
      results.appendChild(resultEntry);
    } else {
      resultEntry.lastChild.textContent = parsedV;
    }
  });
}

const stockfish = new StockfishWorker((report) => updateResult(report));

toggle.addEventListener("input", () => {
  if (toggle.checked) {
    cleanResults();
    stockfish.calculate(board.getFen());
  } else {
    stockfish.stop();
    cleanResults();
    board.board.setAutoShapes([]);
  }
});

function evalToPercentage(cp: number) {
  return 50 - Math.tanh(cp * 0.2) * 50;
}

toggle.click();

window.exports = { board, tree };
