import { BehaviorSubject, Observable, Subject } from "rxjs";
import { withLatestFrom, tap, map } from 'rxjs/operators';

type DataDOM<T> = {
  data: T,
  dom: Node,
}

type ChangeSet<T> = {
  enter: T[],
  update: DataDOM<T>[],
  exit: DataDOM<T>[],
}

type Key = string | number | symbol;

type ChangeSetMap<K, T> = {
  enter: Map<K, T>,
  update: Map<K, DataDOM<T>>,
  exit: Map<K, DataDOM<T>>,
}

// TODO: might be faster to just tag everything with enter, update, or exit? then iterate through?
// idk. there are tradeoffs
const diff = <K, T>(prev: Map<K, DataDOM<T>>, curr: Map<K, T>): ChangeSetMap<K, T> => {
  const enter: Map<K, T> = new Map();
  const update: Map<K, DataDOM<T>> = new Map();
  const exit: Map<K, DataDOM<T>> = new Map();

  // there now,
  for (const [key, value] of curr.entries()) {
    if (!prev.has(key)) {
      // but wasn't prev: enter
      enter.set(key, value);
    }
  }

  // there prev,
  for (const [key, value] of prev.entries()) {
    if (curr.has(key)) {
      // and is now: update
      update.set(key, value);
    } else {
      // but isn't now: exit
      exit.set(key, value);
    }
  }

  console.log("diff", {
    enter,
    update,
    exit
  });

  return {
    enter,
    update,
    exit,
  };
}

export type ChangeSetCallback<T> = {
  enter: (data: T, index?: number) => Node,
  update: (dataDom: DataDOM<T>) => Node,
  exit: (dataDom: DataDOM<T>) => void,
};

const arrayToMap = <T>(arr: T[]): Map<number, T> => new Map(arr.map((x, i) => [i, x]));

const mapMap = <K, T, U>(m: Map<K, T>, f: ([k, v]: [K, T]) => U): Map<K, U> =>
  new Map(
    Array.from(m,
      ([k, v]) => [k, f([k, v])]
    )
  );

export const render = <T>(dataStream: Observable<T[]>, changeSetCallback: ChangeSetCallback<T>): Observable<Map<number, DataDOM<T>>> => {
  // https://www.learnrxjs.io/learn-rxjs/recipes/gameloop
  // renderStream works like gameState
  /* TODO: not sure if this needs to be a BehaviorSubject or not */
  let renderStream = new BehaviorSubject<Map<number, DataDOM<T>>>(new Map());

  return dataStream.pipe(
    withLatestFrom(renderStream), // drag in renderStream as an argument, but only refire when dataStream changes
    map(([data, render]) => {
      let changeSet = diff(render, arrayToMap(data));
  
      let enter = mapMap(changeSet.enter, ([i, x]) => ({
        data: x,
        dom: changeSetCallback.enter(x, i),
      }));
  
      let update = mapMap(changeSet.update, ([i, x]) => ({
        data: x.data,
        dom: changeSetCallback.update(x),
      }));
  
      /* let exit =  */mapMap(changeSet.exit, ([i, x]) => changeSetCallback.exit(x));
  
      console.log("from stream", data, render);

      const newRender = new Map([...Array.from(enter.entries()), ...Array.from(update.entries())]);

      renderStream.next(newRender);
      return newRender;
    }),
  );
}

export class CollectionSubject<T> extends Subject<T[]> {
  public render(changeSetCallback: ChangeSetCallback<T>): Observable<Map<number, DataDOM<T>>> {
    return render(this, changeSetCallback);
  }
}
