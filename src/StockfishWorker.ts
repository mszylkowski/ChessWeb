// const INIT_MESSAGE =

import { Deferred } from "./utils/deferred";

//   "Stockfish 15 64 POPCNT WASM Multithreaded by the Stockfish developers (see AUTHORS file)";
const INIT_MESSAGE = "uciok";

export class StockfishWorker {
  worker: Worker;
  ready_: Deferred<boolean>;

  reportFun_: (report: Record<string, any>) => void;

  constructor(reportFun: (report: Record<string, any>) => void) {
    this.worker = new Worker("./stockfish/stockfish.js", { name: "Stockfish" });
    this.reportFun_ = reportFun;

    // this.worker.addEventListener("message", ({data}) => {
    //   console.log('%cReceived', 'color: red', data);
    // })
    this.send_("uci");
    this.ready_ = new Deferred<boolean>();

    this.worker.addEventListener("message", ({data}: MessageEvent) => {
      if (data === "uciok") {
        this.send_("ucinewgame");
        this.ready_.resolve(true);
      }
      if (data.startsWith("info")) {
        this.reportFun_(parseInfo(data));
      }
    });
  }

  whenReady() {
    return this.ready_;
  }

  send_(message: string) {

    // console.log('%cSent', 'color: green', message);
    this.worker.postMessage(message);
  }

  async calculate(fen: string, resetGame = false) {
    await this.ready_.promise;
    this.send_("stop");
    if (resetGame) {
      this.send_("ucinewgame");
    }
    
    this.send_("position fen " + fen);
    this.send_("go");
  }

  stop() {
    this.send_("stop");
  }
}

function parseInfo(info: string): Record<string, any> {
  const words = info.split(" ");
  if (words[0] === "info") {
    const parsed: Record<string, any> = {};
    for (let i = 1; i < words.length; i += 2) {
      const k = words[i];
      if (
        ["depth", "multipv", "nodes"].includes(k)
      ) {
        parsed[k] = words[i + 1];
      } else if (k === "score") {
        parsed[k] = words.slice(i + 1, i + 3);
        i += 1;
      } else if (k === "pv") {
        parsed[k] = words.slice(i + 1, words.length).slice(0, 10);
        parsed["bestmove"] = words[i + 1];
        break;
      }
    }
    return parsed;
  } else if (words[0] === "bestmove") {
    return { bestmove: words[1], ponder: words[3] };
  }
  return { text: info };
}
