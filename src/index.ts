import { BehaviorSubject, Observable, Subject } from "rxjs";
import { tap, withLatestFrom } from "rxjs/operators";

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

type ChangeSet<T> = {
  enter: T[],
  update: DataDOM<T>[],
  exit: DataDOM<T>[],
}

const diff = <T>(prev: DataDOM<T>[], curr: T[]): ChangeSet<T> => {
  // https://mistakes.io/#4679425 from https://tmcw.github.io/presentations/dcjq/
  let prevArr = prev.map(({ data }) => data);

  // there now, but wasn't prev
  let enter = curr.filter(function(n) {
    return prevArr.indexOf(n) === -1;
  });

  // there prev, and is now
  let update = prev.filter(function(n) {
    return curr.indexOf(n.data) !== -1;
  });

  // there prev, but isn't now
  let exit = prev.filter(function(n) {
    return curr.indexOf(n.data) === -1;
  });

  return {
    enter,
    update,
    exit
  };
}

type ChangeSetCallback<T> = {
  enter: (data: T) => Node,
  update: (dataDom: DataDOM<T>) => Node,
  exit: (dataDom: DataDOM<T>) => void,
};

const join = <T>(dataStream: Subject<T[]>, changeSetCallback: ChangeSetCallback<T>): Observable<[T[], DataDOM<T>[]]> => {
  // https://www.learnrxjs.io/learn-rxjs/recipes/gameloop
  // renderStream works like gameState
  let renderStream = new BehaviorSubject<DataDOM<T>[]>([]);

  return dataStream.pipe(
    withLatestFrom(renderStream), // drag in renderStream as an argument, but only refire when dataStream changes
    tap(([data, render]) => {
      let changeSet = diff(render, data);
  
      let enter = changeSet.enter.map((x) => ({
        data: x,
        dom: changeSetCallback.enter(x)
      }));
  
      let update = changeSet.update.map((x) => ({
        data: x.data,
        dom: changeSetCallback.update(x)
      }));
  
      /* let exit =  */changeSet.exit.map((x) => changeSetCallback.exit(x));
  
      console.log("from stream", data, render);
      renderStream.next([...enter, ...update]);
    }),
  );
}

let dataStream = new Subject<Letter[]>();

let dataDOMStream = join(dataStream,
  {
    enter: (x) => body.appendChild(document.createTextNode(x.name)),
    update: ({dom}) => dom,
    exit: ({dom}) => body.removeChild(dom),
  }
);

dataStream.subscribe((x) => console.log(x));
dataDOMStream.subscribe((x) => console.log("dataDOM", x));

dataStream.next(letters);
setTimeout(() => dataStream.next(vowels), 1000);
