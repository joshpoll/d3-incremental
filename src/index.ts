import { CollectionSubject } from "./d3-incremental";

// recreating (non-animated version of) this tutorial https://www.youtube.com/watch?v=IyIAR65G-GQ

const svg = document.querySelector("svg");
const width = +svg.getAttribute("width");
const height = +svg.getAttribute("height");

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

let dataStream = new CollectionSubject<Fruit>();

/* TODO: convert to .pipe(render()) */
let dataDOMStream = dataStream.render({
  enter: (_x, i) => {
    const svgns = "http://www.w3.org/2000/svg";
    const circle = document.createElementNS(svgns, "circle");
    circle.setAttributeNS(null, "cx", `${i * 120 + 60}`);
    circle.setAttributeNS(null, "cy", `${height / 2}`);
    circle.setAttributeNS(null, "fill", "#c11d1d");
    circle.setAttributeNS(null, "r", "50");
    return svg.appendChild(circle);
  },
  update: ({dom}) => dom,
  exit: ({dom}) => svg.removeChild(dom),
});

dataStream.subscribe((x) => console.log(x));
dataDOMStream.subscribe((x) => console.log("dataDOM", x));

// dataStream.next(letters);
// setTimeout(() => dataStream.next(vowels), 1000);

type Fruit = {
  type: string,
}

const makeFruit = (type: string): Fruit => ({ type });

const range = (n: number) => Array.from(Array(n).keys());

dataStream.next(range(5).map(() => makeFruit("apple")));

/* TODO: this doesn't diff properly, because the indexOf calculation is too weak I think */
setTimeout(() => dataStream.next(range(4).map(() => makeFruit("apple"))), 1000);
setTimeout(() => dataStream.next(range(6).map(() => makeFruit("apple"))), 2000);
