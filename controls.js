const triggerDownload = (imgURI, fileName) => {
    let a = document.createElement("a");

    a.setAttribute("download", "field.svg");
    a.setAttribute("href", imgURI);
    a.setAttribute("target", "_blank");

    a.click();
  };

  const save = () => {
    let svg = document.getElementById("out");
    let data = new XMLSerializer().serializeToString(svg);
    let svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    let url = URL.createObjectURL(svgBlob);

    triggerDownload(url);
  };

  const toggleControls = () =>{
    document.querySelector(".controls").style.display = document.querySelector(".controls").style.display == "grid" ? "none" : "grid";
  }