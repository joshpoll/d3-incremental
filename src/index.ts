import { BehaviorSubject, ReplaySubject, Subject } from "rxjs";
import { map, tap, withLatestFrom } from "rxjs/operators";

console.log("Hello World!");

console.log(document.querySelector("body"));
const body = document.querySelector("body");

type Letter = {
  name: string,
  frequency: number,
}

let letters: Letter[] = [
  {name: "A", frequency: .08167},
  {name: "B", frequency: .01492},
  {name: "C", frequency: .02780},
  {name: "D", frequency: .04253},
  {name: "E", frequency: .12702},
];

let vowels: Letter[] = [
  {name: "A", frequency: .08167},
  {name: "I", frequency: .06973},
  {name: "O", frequency: .07507},
  {name: "U", frequency: .02758},
  {name: "E", frequency: .12702}, // TODO: putting this in the wrong place so I can key by index for now
];

type DataDOM<T> = {
  data: T,
  dom: Node,
}

const diff = <T>(prev: DataDOM<T>[], curr: T[]) => {

}

// https://www.learnrxjs.io/learn-rxjs/recipes/gameloop
// renderStream works like gameState
// TODO: specify type
let renderStream = new BehaviorSubject<DataDOM<Letter>[]>([]);
let dataStream = new Subject<Letter[]>();

let dataDOMStream = dataStream.pipe(
  withLatestFrom(renderStream), // drag in renderStream as an argument, but only refire when dataStream changes
  tap(([data, render]) => {
    console.log("from stream", data, render);
    renderStream.next([{
      data: {name: "A", frequency: .08167},
      dom: null,
    }]);
  }),
  // map((xs) => xs.map((x): DataDOM<Letter> => ({
  //   data: x,
  //   dom: body.appendChild(document.createTextNode(x.name)),
  // })))
);

dataStream.subscribe((x) => console.log(x));
dataDOMStream.subscribe((x) => console.log("dataDOM", x));

dataStream.next(letters);
dataStream.next(vowels);
