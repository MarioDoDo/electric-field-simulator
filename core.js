let T = [0];
let S = [0];

const def = {
  dark: {
    background: "#000000",
    fieldLinesColor: "#ffffff",
    primaryVector: "#ff0000",
    secondaryVector: "#ffffff",
    positive: "#ff0000",
    negative: "#0000ff",
    gridCenter: "#ffffff",
    positiveGrid: "#0000ff",
    negativeGrid: "#ff0000",
  },
  light: {
    background: "#ffffff",
    fieldLinesColor: "#000000",
    primaryVector: "#ff0000",
    secondaryVector: "#000000",
    positive: "#ff0000",
    negative: "#0000ff",
    gridCenter: "#000000",
    positiveGrid: "#0000ff",
    negativeGrid: "#ff0000",
  }
}

let colors = JSON.parse(localStorage.getItem("colors")) ?? structuredClone(def.dark);

const syncInputs = () => {
  Object.keys(colors).forEach((name) => {
    document.getElementById(name).value = colors[name];
  });
}
syncInputs();

const resetSettings = () => {
  document.getElementById("Tmass").checked = false;
  document.getElementById("staticEnd").checked = true;
  document.getElementById("grid").checked = false;
  document.getElementById("fieldLines").checked = true;
  document.getElementById("linesCount").value = 11;
  document.getElementById("length").value = 110;
  document.getElementById("linesQuality").value = 6;
  document.getElementById("speed").value = 15;
  draw();
}


//force between two charges
const calculateForce = (t, s) => {
  let x1 = Math.abs(t.x - s.x);
  let y1 = Math.abs(t.y - s.y);
  let alpha = (Math.atan(y1 / x1) * 180) / Math.PI;
  let r = Math.sqrt(x1 * x1 + y1 * y1);
  let F = (10000000 / (r * r));
  let x2 =
    t.x > s.x
      ? (r + F) * Math.cos((alpha * Math.PI) / 180) + s.x
      : -(r + F) * Math.cos((alpha * Math.PI) / 180) + s.x;
  let y2 =
    t.y > s.y
      ? (r + F) * Math.sin((alpha * Math.PI) / 180) + s.y
      : -(r + F) * Math.sin((alpha * Math.PI) / 180) + s.y;
  if (s.N === !t.N) {
    x2 = -x2 + 2 * t.x;
    y2 = -y2 + 2 * t.y;
  }
  return { x: x2, y: y2 };
};

//visualization
let svg = document.getElementById("out");
svg.setAttribute("width", window.innerWidth);
svg.setAttribute("height", window.innerHeight);
svg.setAttribute("style", `background: ${colors.background}`);

const bgChange = (color) => {
  colors.background = color;
  svg.setAttribute("style", `background: ${color}`);
  localStorage.setItem("colors", JSON.stringify(colors));
};

const change = (color, name) => {
  colors[name] = color;
  localStorage.setItem("colors", JSON.stringify(colors));
  draw();
};

const resetColors = (theme) => {
  colors = structuredClone(def[theme]);
  bgChange(colors.background);
  syncInputs();
  draw();
};


const drawCharge = (x, y, r, color) => {
  let c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("cx", x);
  c.setAttribute("cy", y);
  c.setAttribute("fill", color);
  c.setAttribute("r", r);
  c.setAttribute("draggable", true);

  svg.appendChild(c);
};

const drawForce = (x1, y1, x2, y2, color, grid = false) => {
  let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
  l.setAttribute("x1", x1);
  l.setAttribute("y1", y1);
  l.setAttribute("x2", x2);
  l.setAttribute("y2", y2);
  l.setAttribute("stroke", color);
  l.setAttribute("stroke-width", 3);
  l.setAttribute(
    "marker-end", grid ? color == colors.positiveGrid ? `url(#positiveGridVector)` : `url(#negativeGridVector)` : color == colors.primaryVector ? `url(#primary)` : `url(#secondary)`
  );
  svg.appendChild(l);
  if (color == colors.primaryVector) {
    document.getElementById("primary").setAttribute("fill", color);
  } else {
    document.getElementById("secondary").setAttribute("fill", color);
  }
  if (color == colors.positiveGrid) {
    document.getElementById("positiveGridVector").setAttribute("fill", color);
  } else if (color == colors.negativeGrid) {
    document.getElementById("negativeGridVector").setAttribute("fill", color);
  }

};

const onScreen = (charge, r = 0) => {
  return charge.x < window.innerWidth + r && charge.x > -r && charge.y < window.innerHeight + r && charge.y > -r;
}

const draw = () => {
  let Tmass = document.getElementById("Tmass").checked;
  let grid = document.getElementById("grid").checked;
  let fieldLines = document.getElementById("fieldLines").checked;
  clear();
  if (grid) {
    makeGrid();
  }
  if (fieldLines) {
    drawFieldLines();
  }
  let vectors = [];
  for (let i = 0; i < T.length; i++) {
    for (let j = 0; j < S.length; j++) {
      if (S[j].x) {
        let force = calculateForce(T[i], S[j]);
        drawCharge(S[j].x, S[j].y, 30, S[j].N ? colors.negative : colors.positive);
        if (force.x && force.y && T[i].x) {
          drawForce(T[i].x, T[i].y, force.x, force.y, colors.secondaryVector);
          vectors.push({ x: force.x, y: force.y });
        }
      }
    }
    if (T[i].x) {
      if (Tmass) {
        for (let k = 0; k < T.length; k++) {
          let force = calculateForce(T[i], T[k]);
          if (force.x && force.y) {
            drawForce(T[i].x, T[i].y, force.x, force.y, colors.secondaryVector);
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

      drawForce(T[i].x, T[i].y, T[i].x + sumX, T[i].y + sumY, colors.primaryVector);
      drawCharge(T[i].x, T[i].y, 20, T[i].N ? colors.negative : colors.positive);
    }
  }
  addListener();
};

const drawFieldLines = () => {
  let Tmass = document.getElementById("Tmass").checked;
  clear(false, true);
  let length = document.getElementById("length").value;
  let linesCount = document.getElementById("linesCount").value;
  let linesQuality = document.getElementById("linesQuality").value;
  let vectors = [];
  let all = Tmass ? S.concat(T) : S;
  for (let k = 1; k < all.length; k++) {
    if (!all[k].N) {
      const distributePoints = (n, r, S) => {
        let points = [];
        alpha = (Math.PI * 2) / n;
        for (let i = 0; i < n; i++) {
          let beta = alpha * i;
          points.push({
            x: Math.round(S.x + r * Math.cos(beta)),
            y: Math.round(S.y + r * Math.sin(beta)),
          });
        }
        return points;
      };


      let test = distributePoints(linesCount, k < S.length ? 30 : 20, {
        x: all[k].x,
        y: all[k].y,
      });

      for (let l = 0; l < length; l++) {
        let c = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        c.setAttribute("d", "M 0,0");
        c.setAttribute("stroke", colors.fieldLinesColor);
        c.setAttribute("fill", "none");
        for (let i = 0; i < test.length; i++) {
          if (onScreen(test[i], 100)) {
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
              sumX = sumX === 0 ? 1 : sumX;
              sumY = sumY === 0 ? 1 : sumY;

              if (sumX) {
                c.setAttribute(
                  "d",
                  c.getAttribute("d") + `M${test[i].x},${test[i].y} `
                );

                test[i].x +=
                  norm(sumX, sumY) * linesQuality;
                test[i].y +=
                  norm(sumY, sumX) * linesQuality;
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
const resetAnim = () => {
  clear(true, true);
  S = JSON.parse(localStorage.getItem("S"));
  T = JSON.parse(localStorage.getItem("T"));
  draw();
}
const anim = () => {
  localStorage.setItem("S", JSON.stringify(S));
  localStorage.setItem("T", JSON.stringify(T));
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => {
    let staticEnd = document.getElementById("staticEnd").checked;
    for (let i = 1; i < T.length; i++) {
      if (T[i].x) {
        if (onScreen(T[i], 30)) {
          T[i] = {
            x: T[i].x + T[i].forceX / 20,
            y: T[i].y + T[i].forceY / 20,
            forceX: T[i].forceX,
            forceY: T[i].forceY,
            N: T[i].N,
          };
        } else {
          T.splice(i, 1);
          break;
        }
        if (staticEnd && T.length > 1) {
          for (let k = 1; k < S.length; k++) {
            if (!T[i]) { break; }
            if (
              Math.abs(S[k].x - T[i].x) < 20 &&
              Math.abs(S[k].y - T[i].y) < 20
            ) {
              T.splice(i, 1);
              if (T.length < 1) {
                T = [0];
                break;
              }
            }
          };
        }
      }
    }

    draw();
  }, speed * 10);
};

const stop = () => {
  clearInterval(interval);
};

//User interaction - controls

const clear = (arr, lines) => {
  let el = svg.children;
  if (lines) {
    for (let i = 0; i < el.length;) {
      if (el[i].tagName === "path") {
        el[i].remove();
      } else {
        i++;
      }
    }
  } else {
    for (let i = 0; i < el.length;) {
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

window.addEventListener("resize", () => {
  svg.setAttribute("width", window.innerWidth);
  svg.setAttribute("height", window.innerHeight);
});

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
  let finalCheck = false;
  let target;
  let panel = document.querySelector(".panel");
  document.querySelectorAll("circle").forEach((charge) => {
    charge.addEventListener("mousedown", (event) => {
      moving = true;
      target = event.target;
      panel.style.background = "rgba(200, 0, 0, 0.8)";
    });
  });
  window.addEventListener("mouseup", () => {
    moving = false;
    finalCheck = true;
    panel.style.background = "rgba(20, 20, 20, 0.8)";
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
        if (T[index].x > panel.offsetLeft && T[index].y > panel.offsetTop && T[index].x < panel.getBoundingClientRect().right) {
          T.splice(index, 1);
          moving = false;
        } else {
          let x = event.x === 0 ? 1 : event.x;
          let y = event.y;
          T[index] = { x: x, y: y, N: charge };
          target.setAttribute("cx", x);
          target.setAttribute("cy", y);
        }
      } else {
        if (S[index].x > panel.offsetLeft && S[index].y > panel.offsetTop && S[index].x < panel.getBoundingClientRect().right) {
          S.splice(index, 1);
          moving = false;
        } else {
          let x = event.x === 0 ? 1 : event.x;
          let y = event.y;
          S[index] = { x: x, y: y, N: charge };
          target.setAttribute("cx", x);
          target.setAttribute("cy", y);
        }
      }
      draw();
    }
  });
};

//make grid of charges
const makeGrid = () => {
  let Tmass = document.getElementById("Tmass").checked;
  for (let i = 20; i < window.innerWidth; i += 100) {
    for (let j = 20; j < window.innerHeight; j += 100) {
      if (S.length > 1 || T.length > 1) {
        let vectors = [];
        for (let a = 1; a < S.length; a++) {
          vectors.push(calculateForce({ x: i, y: j, N: false }, S[a]));
        }

        if (Tmass) {
          for (let a = 1; a < T.length; a++) {
            vectors.push(calculateForce({ x: i, y: j, N: false }, T[a]));
          }
        }
        let sumX = 0;
        let sumY = 0;
        vectors.forEach((vector) => {
          sumX += vector.x - i;
          sumY += vector.y - j;
        });

        drawForce(i, j, i - norm(sumX, sumY) * 10, j - norm(sumY, sumX) * 10, colors.positiveGrid, true);
        drawForce(i, j, i + norm(sumX, sumY) * 10, j + norm(sumY, sumX) * 10, colors.negativeGrid, true);
        drawCharge(i, j, 3, colors.gridCenter);
      }
    }
  }
}

const norm = (a, b) => {
  return a / Math.sqrt(a * a + b * b);
}

/*
//evry 200ms push random new charge to T
const randomCharge = () => {
  let x = Math.random() * window.innerWidth;
  let y = Math.random() * window.innerHeight;
  let N = Math.random() > 0.5 ? true : false;
  T.push({ x: x, y: y, N: N });
}
for (let i = 0; i < 10; i++) {
  randomCharge();
}
*/