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

  console.log("diff", {
    enter,
    update,
    exit
  });

  return {
    enter,
    update,
    exit
  };
}

export type ChangeSetCallback<T> = {
  enter: (data: T, index?: number) => Node,
  update: (dataDom: DataDOM<T>) => Node,
  exit: (dataDom: DataDOM<T>) => void,
};

export const render = <T>(dataStream: Subject<T[]>, changeSetCallback: ChangeSetCallback<T>): Observable<DataDOM<T>[]> => {
  // https://www.learnrxjs.io/learn-rxjs/recipes/gameloop
  // renderStream works like gameState
  /* TODO: not sure if this needs to be a BehaviorSubject or not */
  let renderStream = new BehaviorSubject<DataDOM<T>[]>([]);

  return dataStream.pipe(
    withLatestFrom(renderStream), // drag in renderStream as an argument, but only refire when dataStream changes
    map(([data, render]) => {
      let changeSet = diff(render, data);
  
      let enter = changeSet.enter.map((x, i) => ({
        data: x,
        dom: changeSetCallback.enter(x, i)
      }));
  
      let update = changeSet.update.map((x) => ({
        data: x.data,
        dom: changeSetCallback.update(x)
      }));
  
      /* let exit =  */changeSet.exit.map((x) => changeSetCallback.exit(x));
  
      console.log("from stream", data, render);
      renderStream.next([...enter, ...update]);
      return [...enter, ...update];
    }),
  );
}

export class CollectionSubject<T> extends Subject<T[]> {
  public render(changeSetCallback: ChangeSetCallback<T>): Observable<DataDOM<T>[]> {
    return render(this, changeSetCallback);
  }
}
