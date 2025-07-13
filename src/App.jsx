import React, { useRef, useState } from "react";
import "./App.css";

const App = () => {
  const canvasRefOriginal = useRef(null);
  const canvasRefProcessed = useRef(null);
  const [grayscale, setGrayscale] = useState(false);
  const [kernelSize, setKernelSize] = useState(3);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRefOriginal.current;
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Clear processed canvas as well
      const processedCanvas = canvasRefProcessed.current;
      processedCanvas.width = img.width;
      processedCanvas.height = img.height;
      processedCanvas.getContext("2d").clearRect(0, 0, img.width, img.height);
    };
    img.src = URL.createObjectURL(file);
  };

  const applySmoothing = () => {
    const originalCanvas = canvasRefOriginal.current;
    const ctx = originalCanvas.getContext("2d");

    const width = originalCanvas.width;
    const height = originalCanvas.height;

    const srcImageData = ctx.getImageData(0, 0, width, height);
    const data = new Uint8ClampedArray(srcImageData.data); // clone
    const dstImageData = ctx.createImageData(width, height);

    if (grayscale) {
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
    }

    const half = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0, count = 0;

        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const ny = y + dy;
            const nx = x + dx;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const index = (ny * width + nx) * 4;
              r += data[index];
              g += data[index + 1];
              b += data[index + 2];
              a += data[index + 3];
              count++;
            }
          }
        }

        const i = (y * width + x) * 4;
        dstImageData.data[i] = r / count;
        dstImageData.data[i + 1] = g / count;
        dstImageData.data[i + 2] = b / count;
        dstImageData.data[i + 3] = a / count;
      }
    }

    const processedCanvas = canvasRefProcessed.current;
    processedCanvas.width = width;
    processedCanvas.height = height;
    processedCanvas.getContext("2d").putImageData(dstImageData, 0, 0);
  };

  const handleHover = (e) => {
    const canvas = canvasRefOriginal.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    const ctx = canvas.getContext("2d");

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const rgba = `(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`;

    document.getElementById("pixelInfo").innerText = `Pixel (R,G,B,A): ${rgba}`;
  };

  return (
    <div className="container">
      <h1>🖼️ Image Smoothing Filter UI</h1>

      <input type="file" accept="image/*" onChange={handleImageUpload} />

      <div className="options">
        <label>
          <input
            type="checkbox"
            checked={grayscale}
            onChange={() => setGrayscale(!grayscale)}
          />
          Convert to Grayscale First
        </label>

        <label>
          Neighborhood Size:&nbsp;
          <select
            value={kernelSize}
            onChange={(e) => setKernelSize(parseInt(e.target.value))}
          >
            <option value={3}>3x3</option>
            <option value={5}>5x5</option>
          </select>
        </label>

        <button onClick={applySmoothing}>Smooth Image</button>
      </div>

      <div className="canvas-section">
        <div>
          <h3>Original Image</h3>
          <canvas
            ref={canvasRefOriginal}
            className="canvas"
            onMouseMove={handleHover}
          />
          <div id="pixelInfo" className="pixel-info"></div>
        </div>

        <div>
          <h3>Smoothed Image</h3>
          <canvas ref={canvasRefProcessed} className="canvas" />
        </div>
      </div>
    </div>
  );
};

export default App;
