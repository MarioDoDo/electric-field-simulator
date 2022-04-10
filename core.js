let T = [0];
let S = [0];

//force between two charges
const calculateForce = (t, s) => {
  let x1 = Math.abs(t.x - s.x);
  let y1 = Math.abs(t.y - s.y);
  let alpha = (Math.atan(y1 / x1) * 180) / Math.PI;
  let r = Math.sqrt(x1 ** 2 + y1 ** 2);
  let F = (1 / r) * 10000;
  let x2 =
    t.x > s.x
      ? (r + F) * Math.cos((alpha * Math.PI) / 180) + s.x
      : -(r + F) * Math.cos((alpha * Math.PI) / 180) + s.x;
  let y2 =
    t.y > s.y
      ? (r + F) * Math.sin((alpha * Math.PI) / 180) + s.y
      : -(r + F) * Math.sin((alpha * Math.PI) / 180) + s.y;
  if ((s.N && !t.N) || (!s.N && t.N)) {
    x2 = -x2 + 2 * t.x;
    y2 = -y2 + 2 * t.y;
  }
  return { x: x2, y: y2 };
};

//visualization
let svg = document.getElementById("out");
svg.setAttribute("width", window.innerWidth);
svg.setAttribute("height", window.innerHeight);
svg.setAttribute("style","background: #2f2f2f");

const drawCharge = (x, y, r, color) => {
  let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("cx", x);
  c.setAttribute("cy", y);
  c.setAttribute("fill", color);
  c.setAttribute("r", r);
  c.setAttribute("draggable", true);
  svg.appendChild(c);
};

const drawForce = (x1, y1, x2, y2, color) => {
  let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  l.setAttribute("stroke", color);
  l.setAttribute("stroke-width", 3);
  l.setAttribute(
    "marker-end",
    color == "red" ? "url(#red)" : "url(#white)"
  );
  svg.appendChild(l);
};

const draw = () => {
  let Tmass = document.getElementById("Tmass").checked;
  let fieldLines = document.getElementById("fieldLines").checked;
  clear();
  if (fieldLines) {
    drawFieldLines();
  }
  let vectors = [];
  for (let i = 0; i < T.length; i++) {
    for (let j = 0; j < S.length; j++) {
      if (S[j].x) {
        let force = calculateForce(T[i], S[j]);
        drawCharge(S[j].x, S[j].y, 30, S[j].N ? "blue" : "red");
        if (force.x && force.y && T[i].x) {
          drawForce(T[i].x, T[i].y, force.x, force.y, "white");
          vectors.push({ x: force.x, y: force.y });
        }
      }
    }
    if (T[i].x) {
      if (Tmass) {
        for (let k = 0; k < T.length; k++) {
          let force = calculateForce(T[i], T[k]);
          if (force.x && force.y) {
            drawForce(T[i].x, T[i].y, force.x, force.y, "white");
            vectors.push({ x: force.x, y: force.y });
          }
        }
      }
      let sumX = 0;
      let sumY = 0;
      vectors.forEach((vector) => {
        sumX += vector.x - T[i].x;
        sumY += vector.y - T[i].y;
      });
      vectors = [];
      T[i].forceX = sumX;
      T[i].forceY = sumY;

      drawForce(T[i].x, T[i].y, T[i].x + sumX, T[i].y + sumY, "red");
      drawCharge(T[i].x, T[i].y, 20, T[i].N ? "blue" : "red");
    }
  }
  addListener();
};

const drawFieldLines = () => {
  let Tmass = document.getElementById("Tmass").checked;
  clear(false, true);
  let lenght = document.getElementById("lenght").value;
  let linesCount = document.getElementById("linesCount").value;
  let linesQuality = document.getElementById("linesQuality").value;
  let vectors = [];
  let all = Tmass ? S.concat(T) : S;
  for (let k = 0; k < all.length; k++) {
    if (!all[k].N) {
      const distributePoints = (n, r, S) => {
        let points = [];
        alpha = (Math.PI * 2) / n;
        for (let i = 0; i < n; i++) {
          let beta = Math.PI * 2 - alpha * i;
          points.push({
            x: Math.round(S.x + r * Math.cos(beta)),
            y: Math.round(S.y + r * Math.sin(beta)),
          });
        }
        return points;
      };

      let test = distributePoints(linesCount, k < S.lenght ? 30 : 20, {
        x: all[k].x,
        y: all[k].y,
      });

      for (let l = 0; l < lenght; l++) {
        let c = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        c.setAttribute("d", "M 0,0");
        c.setAttribute("stroke", "white");
        c.setAttribute("fill", "none");
        for (let i = 0; i < test.length; i++) {
          for (let j = 0; j < S.length; j++) {
            if (S[j].x) {
              let force = calculateForce(test[i], S[j]);
              if (force.x && force.y) {
                vectors.push({ x: force.x, y: force.y });
              }
            }
          }
          if (test[i].x) {
            if (Tmass) {
              for (let p = 0; p < T.length; p++) {
                let force = calculateForce(test[i], T[p]);
                if (force.x && force.y) {
                  vectors.push({ x: force.x, y: force.y });
                }
              }
            }
            let sumX = 0;
            let sumY = 0;
            vectors.forEach((vector) => {
              sumX += vector.x - test[i].x;
              sumY += vector.y - test[i].y;
            });
            vectors = [];

            if (sumX != null) {
              c.setAttribute(
                "d",
                c.getAttribute("d") + `M${test[i].x},${test[i].y} `
              );

              test[i].x +=
                (sumX / Math.sqrt(sumX ** 2 + sumY ** 2)) * linesQuality;
              test[i].y +=
                (sumY / Math.sqrt(sumX ** 2 + sumY ** 2)) * linesQuality;
              c.setAttribute(
                "d",
                c.getAttribute("d") + `L${test[i].x},${test[i].y}`
              );
            }
          }
        }
        svg.appendChild(c);
      }
    }
  }
};

//Dynamic field - animation
let interval;
let speed = 1;
const setSpeed = () => {
  speed = document.getElementById("speed").value;
  if (interval) {
    clearInterval(interval);
    anim();
  }
};
const anim = () => {
  let staticEnd = document.getElementById("staticEnd").checked;
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => {
    for (let i = 0; i < T.length; i++) {
      if (T[i].x) {
        if (T[i].x < screen.width + 20 && T[i].y < screen.height + 20) {
          T[i] = {
            x: T[i].x + T[i].forceX / 20,
            y: T[i].y + T[i].forceY / 20,
            N: T[i].N,
          };
        } else {
          T.splice(i, 1);
        }
        if (staticEnd && T[i]) {
          S.forEach((element) => {
            if (
              Math.abs(element.x - T[i].x) < 20 &&
              Math.abs(element.y - T[i].y) < 20
            ) {
              T.splice(i, 1);
              T = T == 0 ? [0] : T;
            }
          });
        }
      }
    }

    draw();
  }, speed);
};

const stop = () => {
  clearInterval(interval);
};

//User interaction - controls

const clear = (arr, lines) => {
  let el = svg.children;
  if (lines) {
    for (let i = 0; i < el.length; ) {
      if (el[i].tagName === "path") {
        el[i].remove();
      } else {
        i++;
      }
    }
  } else {
    for (let i = 0; i < el.length; ) {
      if (el[i].tagName !== "defs") {
        el[i].remove();
      } else {
        i++;
      }
    }
  }
  if (arr) {
    S = [0];
    T = [0];
    clearInterval(interval);
  }
};

document.querySelector(".clear").addEventListener("click", (event) => {
  clear(true);
});
document
  .querySelector(".positiveS")
  .addEventListener("dragend", (event) => {
    S.push({ x: event.x, y: event.y, N: false });
    draw();
  });
document
  .querySelector(".negativeS")
  .addEventListener("dragend", (event) => {
    S.push({ x: event.x, y: event.y, N: true });
    draw();
  });
document
  .querySelector(".positiveT")
  .addEventListener("dragend", (event) => {
    T.push({ x: event.x, y: event.y, N: false });
    draw();
  });
document
  .querySelector(".negativeT")
  .addEventListener("dragend", (event) => {
    T.push({ x: event.x, y: event.y, N: true });
    draw();
  });

const addListener = () => {
  let moving = false;
  let target;
  let panel = document.querySelector(".panel");
  document.querySelectorAll("circle").forEach((charge) => {
    charge.addEventListener("mousedown", (event) => {
      moving = true;
      target = event.target;
      panel.style.background = "red";
    });
  });
  window.addEventListener("mouseup", () => {
    moving = false;
    panel.style.background = "white";
  });
  window.addEventListener("mousemove", (event) => {
    if (moving) {
      let arr;
      let charge;
      let index = S.findIndex((element) => {
        if (
          element.x == target.getAttribute("cx") &&
          element.y == target.getAttribute("cy")
        ) {
          arr = "S";
          charge = element.N ? true : false;
          return true;
        }
      });
      index =
        index == -1
          ? T.findIndex((element) => {
              if (
                element.x == target.getAttribute("cx") &&
                element.y == target.getAttribute("cy")
              ) {
                arr = "T";
                charge = element.N ? true : false;
                return true;
              }
            })
          : index;
      if (arr === "T") {
          if(T[index].x > panel.offsetLeft && Math.abs(T[index].y - panel.offsetTop) < 15 && T[index].x < panel.getBoundingClientRect().right){
              T.splice(index, 1);
          }else{
              T[index] = { x: event.x, y: event.y, N: charge };
              target.setAttribute("cx", event.x);
              target.setAttribute("cy", event.y);
          }
      } else {
          if(S[index].x > panel.offsetLeft && Math.abs(S[index].y - panel.offsetTop) < 10 && S[index].x < panel.getBoundingClientRect().right){
              S.splice(index, 1);
          }else{
              S[index] = { x: event.x, y: event.y, N: charge };
              target.setAttribute("cx", event.x);
              target.setAttribute("cy", event.y);
          }
      }
      draw();
    }
  });
};