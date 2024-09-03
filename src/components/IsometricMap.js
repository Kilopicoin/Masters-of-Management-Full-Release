import React, { useEffect, useRef, useState, useCallback } from 'react';
import isometricImage from './31817.png';
import townImage from './townx.png';
import Web3 from 'web3';
import contractABI from './contractABI.json'; // Import the ABI JSON file

const contractAddress = "0x55d78cEe175B17e70d29bdaeD3176c1E24c2576d";
const ChainRPC = "https://api.s0.b.hmny.io";
const web3 = new Web3(ChainRPC);
const contract = new web3.eth.Contract(contractABI.abi, contractAddress);

const IsometricMap = () => {
  const canvasRef = useRef(null);
  const navCanvasRef = useRef(null);

  const [mapSize] = useState(5000);
  const [offset, setOffset] = useState({
    x: -mapSize * 50,
    y: -mapSize * 25,
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

  const [tileCoordinates, setTileCoordinates] = useState({ row: null, col: null });
  const [tileOccupancy, setTileOccupancy] = useState(null); // State to store the occupancy status
  const [showWarningBox, setShowWarningBox] = useState(false); // State to show/hide the warning box
  const [selectedTile, setSelectedTile] = useState(null); // Store the selected tile coordinates

  const isometricImgRef = useRef(new Image());
  const townImgRef = useRef(new Image());

  const [currentFrame, setCurrentFrame] = useState(0);
  const totalFrames = 1; // Replace with the total number of frames in your sprite sheet

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

  const fetchTileOccupancy = useCallback(async (col, row) => {
    try {
      const occupied = await contract.methods.getTileOccupied(col, row).call();
      return occupied;
    } catch (error) {
      console.error("Error fetching tile occupancy:", error);
      return null;
    }
  }, []);

  const handleOccupyTile = async () => {
    if (!selectedTile) return;
  
    try {
      // Get the list of accounts connected to the wallet
      const accounts = await web3.eth.getAccounts();
      
      // Ensure there is an account available
      if (accounts.length === 0) {
        alert("No accounts found. Please connect your wallet.");
        return;
      }
  
      // Get the first account
      const account = accounts[0];
  
      // Send the transaction with the specified `from` address
      await contract.methods.occupyTile(selectedTile.col, selectedTile.row).send({ from: account });
  
      // Update the tile occupancy status
      setTileOccupancy(true);
      setShowWarningBox(false); // Close the warning box
      alert("Tile occupied successfully!");
    } catch (error) {
      console.error("Error occupying tile:", error);
      alert("Failed to occupy tile. Please try again.");
    }
  };
  

  const handleCancelOccupy = () => {
    setShowWarningBox(false);
  };

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
        if ((row === 20 && col === 20)) {
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
    navCtx.fillRect(markerX - 5, markerY - 5, markerSize, markerSize);
  }, [offset, mapSize, navCanvasWidth, navCanvasHeight, scaleFactorValue, zoom]);

  const clampOffset = useCallback(
    (newOffsetX, newOffsetY) => {
      const tileSize = 50 * zoom;
      const maxOffsetX = -(mapSize - 100) * tileSize * 2;
      const minOffsetX = -(tileSize * 100);
      const maxOffsetY = -(mapSize - 100) * tileSize;
      const minOffsetY = -(tileSize * 100);

      return {
        x: Math.max(maxOffsetX, Math.min(minOffsetX, newOffsetX)),
        y: Math.max(maxOffsetY, Math.min(minOffsetY, newOffsetY)),
      };
    },
    [zoom, mapSize]
  );

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

      setOffset((prevOffset) => {
        const newOffsetX = prevOffset.x + deltaX;
        const newOffsetY = prevOffset.y + deltaY;
        return clampOffset(newOffsetX, newOffsetY);
      });

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

      const offsetX = ((offset.x - cursorX) / zoom) * clampedZoom + cursorX;
      const offsetY = ((offset.y - cursorY) / zoom) * clampedZoom + cursorY;

      const clampedOffset = clampOffset(offsetX, offsetY);

      setZoom(clampedZoom);
      setOffset(clampedOffset);
    };

    const handleCanvasClick = async (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate tile coordinates
      const tileSize = 50 * zoom;
      const col = Math.floor((mouseX - offset.x) / (tileSize * 1));
      const row = Math.floor((mouseY - offset.y - (col % 2 === 1 ? tileSize / 2 : 0)) / tileSize);

      setTileCoordinates({ row, col });

      // Fetch occupancy status and update state
      const occupancy = await fetchTileOccupancy(row, col);
      setTileOccupancy(occupancy);

      if (occupancy === false) {
        // If the tile is unoccupied, show the warning box
        setSelectedTile({ row, col });
        setShowWarningBox(true);
      } else {
        setShowWarningBox(false); // Hide the warning box if the tile is occupied
      }
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [isDragging, startPos, offset, zoom, clampOffset, fetchTileOccupancy]);

  useEffect(() => {
    const navCanvas = navCanvasRef.current;

    const handleNavClick = (e) => {
      const rect = navCanvas.getBoundingClientRect();
      const scaleFactor = navCanvasWidth / (mapSize * scaleFactorValue);

      const clickedX = (e.clientX - rect.left) / scaleFactor;
      const clickedY = (e.clientY - rect.top) / scaleFactor;

      const newOffsetX = -clickedX;
      const newOffsetY = -clickedY;

      const clampedOffset = clampOffset(newOffsetX * zoom, newOffsetY * zoom);

      setOffset(clampedOffset);
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

      const clampedOffset = clampOffset(newOffsetX * zoom, newOffsetY * zoom);

      setOffset(clampedOffset);
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
  }, [isDragging, markerPosition, offset, zoom, mapSize, navCanvasWidth, scaleFactorValue, clampOffset]);

  return (
    <>
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />
      <canvas
        ref={navCanvasRef}
        width={navCanvasWidth}
        height={navCanvasHeight}
        style={{ position: 'absolute', bottom: '10px', left: '10px', border: '1px solid black' }}
      />
      <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '10px', borderRadius: '5px' }}>
        {tileCoordinates.row !== null && tileCoordinates.col !== null && (
          <>
            <div>Tile Coordinates: Row {tileCoordinates.row}, Col {tileCoordinates.col}</div>
            {tileOccupancy !== null && (
              <div>Tile Status: {tileOccupancy ? "Occupied" : "Unoccupied"}</div>
            )}
            {showWarningBox && (
              <>
                <p>Do you want to occupy this tile?</p>
                <button onClick={handleOccupyTile}>Occupy</button>
                <button onClick={handleCancelOccupy} style={{ marginLeft: '10px' }}>Cancel</button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default IsometricMap;
