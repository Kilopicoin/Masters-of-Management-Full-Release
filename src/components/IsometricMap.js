import React, { useEffect, useState } from 'react';
import Konva from 'konva';
import grassImageSrc from './grass.png';
import whiteFlagImageSrc from './whiteFlag.png';
import nowaysrc from './55555.png';


const IsometricMap = () => {
  const [tileInfo, setTileInfo] = useState(null); // State to hold the clicked tile information

  useEffect(() => {
    // Tile dimensions
    const tileWidth = 386;
    const tileHeight = tileWidth / 2;

    // Initialize Konva stage and layer
    const stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: false, // Disable stage dragging by default
    });

    // Set an initial zoom level
    const initialZoomLevel = 0.3; // Example initial zoom level
    stage.scale({ x: initialZoomLevel, y: initialZoomLevel });

    // Zoom limits
    const minZoom = 0.2;  // Minimum zoom level
    const maxZoom = 1;    // Maximum zoom level

    const layer = new Konva.Layer();
    const flagLayer = new Konva.Layer(); // Create a separate layer for the flag
    stage.add(layer);
    stage.add(flagLayer); // Add flag layer to the stage

    // Track whether we are currently dragging
    let isDragging = false;
    let lastPos = { x: 0, y: 0 };

    // Mouse down event
    stage.on('mousedown', (e) => {
      if (e.evt.button === 0) { // Left mouse button
        isDragging = true;
        lastPos = { x: e.evt.clientX, y: e.evt.clientY }; // Store the initial click position
      }
    });

    // Mouse move event
    stage.on('mousemove', (e) => {
      if (isDragging) {
        const dx = e.evt.clientX - lastPos.x;
        const dy = e.evt.clientY - lastPos.y;

        stage.x(stage.x() + dx); // Adjust the stage x position
        stage.y(stage.y() + dy); // Adjust the stage y position

        lastPos = { x: e.evt.clientX, y: e.evt.clientY }; // Update the last mouse position
        stage.batchDraw(); // Redraw the stage to apply the new position
      }
    });

    // Mouse up event
    stage.on('mouseup', () => {
      isDragging = false; // Stop dragging when mouse is released
    });

    // Zoom functionality with mouse wheel
    stage.on('wheel', (e) => {
      e.evt.preventDefault();

      const scaleBy = 1.1; // Zoom factor
      const oldScale = stage.scaleX();

      // Get mouse pointer position relative to the stage
      const mousePointTo = {
        x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
        y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
      };

      // Zoom in or out based on wheel direction
      let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

      // Ensure newScale is within the zoom limits
      if (newScale < minZoom) {
        newScale = minZoom;
      }
      if (newScale > maxZoom) {
        newScale = maxZoom;
      }

      stage.scale({ x: newScale, y: newScale });

      // Adjust the position to zoom in where the mouse is pointing
      const newPos = {
        x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
        y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
      };

      stage.position(newPos);
      stage.batchDraw();
    });

    // Define createTilemap inside useEffect
    const createTilemap = (grassImage, whiteFlagImage) => {
      const mapWidth = 20;
      const mapHeight = 20;
    
      // Calculate offsets to center the map
      const offsetX = stage.width() * 1.6;
      const totalMapHeight = (mapWidth + mapHeight) * (tileHeight / 2); // Calculate total height of the map
      const offsetY = (stage.height() - totalMapHeight) / 8; // Center vertically based on map's total height
    
      for (let i = mapWidth; i > 0; i--) {
        for (let j = mapHeight; j > 0; j--) {
          const x = (i - j) * (tileWidth / 2 ) + offsetX;
          const y = (i + j) * (tileHeight / 2 ) + offsetY;
    
      
          const tile = new Konva.Image({
            x: x,
            y: y,
            image: grassImage,
            width: tileWidth,
            height: tileHeight * 2,
           
            offsetX: tileWidth / 2,
            offsetY: tileHeight / 2,
          });
    
          // Add grass tile
          layer.add(tile);


          

      

          // Add event listener for right-click (mouse button 2)
          tile.on('contextmenu', (e) => {
            e.evt.preventDefault(); // Prevent the default context menu from appearing
            setTileInfo({ x: i, y: j}); // Set the clicked tile's coordinates (starting from 1x1)
          });
        }
      }
    
      layer.batchDraw();




      const flagX = (4 - 4) * (tileWidth / 2) + offsetX;
      const flagY = (4 + 4) * (tileHeight / 2) + offsetY;

      const flag = new Konva.Image({
        x: flagX,
        y: flagY,
        image: whiteFlagImage,
        width: tileWidth,
        height: tileHeight * 2,
        offsetX: tileWidth / 2,
        offsetY: tileHeight / 2,
      });
// Create an off-screen canvas to check for transparency
const offScreenCanvas = document.createElement('canvas');
offScreenCanvas.width = whiteFlagImage.width;
offScreenCanvas.height = whiteFlagImage.height;
const offScreenContext = offScreenCanvas.getContext('2d');

// Draw the white flag image onto the off-screen canvas
offScreenContext.drawImage(whiteFlagImage, 0, 0, whiteFlagImage.width, whiteFlagImage.height);

// Add right-click event listener
flag.on('contextmenu', (e) => {
  e.evt.preventDefault();

  // Get the mouse pointer position relative to the stage
  const pointerPosition = stage.getPointerPosition();

  // Convert the pointer position relative to the flag's position
  const clickX = (pointerPosition.x - flag.getAbsolutePosition().x) / flag.scaleX();
  const clickY = (pointerPosition.y - flag.getAbsolutePosition().y) / flag.scaleY();

  // Scale the click coordinates to match the original image resolution
  const relativeX = (clickX / flag.width()) * whiteFlagImage.width;
  const relativeY = (clickY / flag.height()) * whiteFlagImage.height;

  // Get pixel data from the off-screen canvas
  const pixelData = offScreenContext.getImageData(relativeX, relativeY, 1, 1).data;

  // Check if the pixel is transparent (alpha value 0 means it's transparent)
  if (pixelData[3] !== 0) {
    alert('Warning: You clicked on the non-transparent part of the flag!');
  }
});



      // Add flag to the flag layer
      flagLayer.add(flag);
      flagLayer.batchDraw();



    };
    
    // Load the grass and white flag images
    const grassImage = new Image();
    grassImage.src = grassImageSrc;
    const whiteFlagImage = new Image();
    whiteFlagImage.src = whiteFlagImageSrc;
    const nowayImage = new Image();
    nowayImage.src = nowaysrc;

    grassImage.onload = () => {
      whiteFlagImage.onload = () => {
        createTilemap(grassImage, whiteFlagImage);
      };
    };

    // Cleanup on unmount
    return () => {
      stage.destroy();
    };
  }, []); // Empty dependency array

  return (
    <div>
      <div
        id="container"
        style={{
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(circle at 98% 1%, rgba(255, 223, 186, 0.8), rgba(255, 184, 108, 0.5), rgba(255, 184, 108, 0) 20%), /* Sun glow effect at the top right */
            radial-gradient(circle at 50% 100%, rgba(255,255,255,0.8), rgba(240,249,255,0) 70%), /* Light glow near horizon */
            radial-gradient(circle at 50% 110%, #f8f9fa, transparent 50%), /* Soft mist-like effect */
            linear-gradient(to bottom, #2a3a54 0%, #2a5298 30%, #4a89d8 60%, #99c9f5 80%, #e0f0ff 100%) /* Sky transition with horizon glow */
          `,
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
        }}
      ></div>

      {tileInfo && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '5px' }}>
          <strong>Tile Info:</strong><br />
          X: {tileInfo.x}<br />
          Y: {tileInfo.y}
        </div>
      )}
    </div>
  );
};

export default IsometricMap;
