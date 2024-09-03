// src/components/IsometricMap.js

import React, { useEffect, useRef, useState } from 'react';
import isometricImage from './31817.png';
import townImage from './townx.png';

const IsometricMap = () => {
  const canvasRef = useRef(null);
  const navCanvasRef = useRef(null);

  const [mapSize] = useState(5000);
  const [offset, setOffset] = useState({
    x: - mapSize * 50,
    y: - mapSize * 25,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isometricImgLoaded, setIsometricImgLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  const [navCanvasWidth] = useState(360);
  const [navCanvasHeight] = useState(180);
  const [scaleFactorValue] = useState(100);

  const [townImgLoaded, setTownImgLoaded] = useState(false);

  const [markerPosition, setMarkerPosition] = useState({
    x: 0,
    y: 0,
  });
  

  const isometricImgRef = useRef(new Image());
  const townImgRef = useRef(new Image());
  
  const [currentFrame, setCurrentFrame] = useState(0);
  const totalFrames = 4; // Replace with the total number of frames in your sprite sheet

  const updateFrame = () => {
    setCurrentFrame((prevFrame) => (prevFrame + 1) % totalFrames);
  };

  useEffect(() => {
    const animationInterval = setInterval(updateFrame, 500); // Adjust the interval based on your sprite sheet frame rate

    return () => {
      clearInterval(animationInterval);
    };
  }, []);

  useEffect(() => {
    isometricImgRef.current.src = isometricImage;
    isometricImgRef.current.onload = () => {
      setIsometricImgLoaded(true);
    };

    townImgRef.current.src = townImage;
    townImgRef.current.onload = () => {
      setTownImgLoaded(true);
    };
  }, []);

  useEffect(() => {
    if (!isometricImgLoaded) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    const tileSize = 50 * zoom;
    const numRows = mapSize;
    const numCols = numRows * 2;

    const visibleRows = {
      start: Math.floor((-offset.y - tileSize) / tileSize),
      end: Math.floor((-offset.y + canvas.height + tileSize) / tileSize),
    };

    const visibleCols = {
      start: Math.floor((-offset.x - tileSize * 2) / (tileSize * 1)),
      end: Math.floor((-offset.x + canvas.width + tileSize * 2) / (tileSize * 1)),
    };

    const tilesToDraw = [];

for (let row = Math.max(0, visibleRows.start); row <= Math.min(numRows, visibleRows.end); row++) {
  for (let col = Math.max(0, visibleCols.start); col <= Math.min(numCols, visibleCols.end); col++) {
    const x = col * (tileSize * 1) + offset.x;
    const y = row * tileSize + (col % 2 === 1 ? tileSize / 2 : 0) + offset.y;

    const tile = {
      x,
      y,
      row,
      col,
    };

    tilesToDraw.push(tile);
  }
}

// Sort tiles based on y-coordinate
tilesToDraw.sort((a, b) => a.y - b.y);

// Draw sorted tiles
for (const tile of tilesToDraw) {
  const x = tile.x;
  const y = tile.y;
  const row = tile.row;
  const col = tile.col;

  // Your existing drawing code here
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + tileSize * 1, y - tileSize / 2);
  ctx.lineTo(x + tileSize * 2, y);
  ctx.lineTo(x + tileSize * 1, y + tileSize / 2);
  ctx.closePath();
  ctx.stroke();

  // Check if the town image is loaded before attempting to draw it
  if (townImgLoaded) {
    if ((row === 13 && col === 14) || (row === 13 && col === 13) || (row === 13 && col === 12) || (row === 13 && col === 11)
    || (row === 12 && col === 14) || (row === 12 && col === 13) || (row === 12 && col === 11)
    || (row === 11 && col === 14) || (row === 11 && col === 13) || (row === 13 && col === 12)/* add more conditions */) {
      const spriteWidth = townImgRef.current.width / totalFrames;
    const spriteHeight = townImgRef.current.height;

    const sourceX = currentFrame * spriteWidth;
    const sourceY = 0;

    ctx.drawImage(
      townImgRef.current,
      sourceX,
      sourceY,
      spriteWidth,
      spriteHeight,
      x,
      y - tileSize * 1.5,
      tileSize * 2,
      tileSize * 2
    );
    } else {
      ctx.drawImage(isometricImgRef.current, x, y - tileSize * 1.5, tileSize * 2, tileSize * 2);
    }
  }
}
  }, [offset, isometricImgLoaded, zoom, mapSize, townImgLoaded, currentFrame]);

  useEffect(() => {
    const navCanvas = navCanvasRef.current;
    const navCtx = navCanvas.getContext('2d');

    navCanvas.width = navCanvasWidth;
    navCanvas.height = navCanvasHeight;

    navCtx.clearRect(0, 0, navCanvas.width, navCanvas.height);

    const scaleFactor = navCanvasWidth / (mapSize * scaleFactorValue);

    navCtx.strokeStyle = 'red';
    navCtx.lineWidth = 2;
    navCtx.strokeRect(0, 0, navCanvas.width, navCanvas.height);

     // Set the background color
  navCtx.fillStyle = 'green';
  navCtx.fillRect(0, 0, navCanvas.width, navCanvas.height);

    const markerSize = 10;
    const markerX = -(offset.x / zoom) * scaleFactor;
    const markerY = -(offset.y / zoom) * scaleFactor;

    navCtx.fillStyle = 'red';
    navCtx.fillRect(markerX-5, markerY-5, markerSize, markerSize);
  }, [offset, mapSize, navCanvasWidth, navCanvasHeight, scaleFactorValue, zoom]);

  

  useEffect(() => {
    const canvas = canvasRef.current;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      setOffset((prevOffset) => ({ ...prevOffset }));
    };

    

    const handleMouseDown = (e) => {
      setIsDragging(true);
      setStartPos({ x: e.clientX, y: e.clientY });
    };
    

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      setOffset((prevOffset) => ({
        x: prevOffset.x + deltaX,
        y: prevOffset.y + deltaY,
      }));

      setStartPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleWheel = (e) => {
      e.preventDefault();

      const zoomFactor = 0.003;
      const newZoom = zoom + e.deltaY * -zoomFactor;

      const clampedZoom = Math.max(1, Math.min(newZoom, 5));

      if (clampedZoom === zoom) {
        return;
      }

      const cursorX = e.clientX - canvasRef.current.getBoundingClientRect().left;
      const cursorY = e.clientY - canvasRef.current.getBoundingClientRect().top;

      const offsetX = (offset.x - cursorX) / zoom * clampedZoom + cursorX;
      const offsetY = (offset.y - cursorY) / zoom * clampedZoom + cursorY;

      setZoom(clampedZoom);
      setOffset({ x: offsetX, y: offsetY });
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isDragging, startPos, offset, zoom]);

  useEffect(() => {
    const navCanvas = navCanvasRef.current;
  
    const handleNavClick = (e) => {
      const rect = navCanvas.getBoundingClientRect();
      const scaleFactor = navCanvasWidth / (mapSize * scaleFactorValue);
  
      const clickedX = (e.clientX - rect.left) / scaleFactor;
      const clickedY = (e.clientY - rect.top) / scaleFactor;
  
      const newOffsetX = -clickedX;
      const newOffsetY = -clickedY;
  
      setOffset({ x: newOffsetX * zoom, y: newOffsetY * zoom});
    };


    const handleNavMouseDown = (e) => {
      const rect = navCanvasRef.current.getBoundingClientRect();
      const scaleFactor = navCanvasWidth / (mapSize * scaleFactorValue);

      const clickedX = (e.clientX - rect.left) / scaleFactor;
      const clickedY = (e.clientY - rect.top) / scaleFactor;

      setMarkerPosition({
        x: clickedX,
        y: clickedY,
      });

      setIsDragging(true);
    };

    const handleNavMouseMove = (e) => {
      if (!isDragging) return;

      const rect = navCanvasRef.current.getBoundingClientRect();
      const scaleFactor = navCanvasWidth / (mapSize * scaleFactorValue);

      const mouseX = (e.clientX - rect.left) / scaleFactor;
      const mouseY = (e.clientY - rect.top) / scaleFactor;

      setMarkerPosition({
        x: mouseX,
        y: mouseY,
      });

      // Update the isometric map position based on the marker position
      const newOffsetX = -mouseX;
      const newOffsetY = -mouseY;

      setOffset({
        x: newOffsetX * zoom,
        y: newOffsetY * zoom,
      });
    };

    const handleNavMouseUp = () => {
      setIsDragging(false);
    };

    navCanvas.addEventListener('mousedown', handleNavMouseDown);
    navCanvas.addEventListener('mousemove', handleNavMouseMove);
    navCanvas.addEventListener('mouseup', handleNavMouseUp);
  
    navCanvas.addEventListener('click', handleNavClick);
  
    return () => {

      navCanvas.removeEventListener('mousedown', handleNavMouseDown);
      navCanvas.removeEventListener('mousemove', handleNavMouseMove);
      navCanvas.removeEventListener('mouseup', handleNavMouseUp);


      navCanvas.removeEventListener('click', handleNavClick);
    };
  }, [isDragging, markerPosition, offset, zoom, mapSize, navCanvasWidth, scaleFactorValue]);

  return (
    <>
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />
      <canvas
        ref={navCanvasRef}
        width={navCanvasWidth}
        height={navCanvasHeight}
        style={{ position: 'absolute', bottom: '10px', left: '10px', border: '1px solid black' }}
      />
    </>
  );
};

export default IsometricMap;