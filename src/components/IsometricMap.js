import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Image, Rect } from 'react-konva';  // Import Rect
import useImage from 'use-image';
import isometricImage from './31817.png';

const IsometricMap = () => {
  const [offset, setOffset] = useState({
    x: 0, // Start at 0 to make debugging easier
    y: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [visibleTiles, setVisibleTiles] = useState([]);
  const [tileSize] = useState(100); // Size of one tile

  const [tileImage, imageStatus] = useImage(isometricImage); // Load the isometric tile image
  const stageRef = useRef(null);

  // Debug: Log the image loading status
  useEffect(() => {
    console.log('Image loading status:', imageStatus);
  }, [imageStatus]);

  // Calculate isometric coordinates
  const cartesianToIsometric = useCallback((col, row) => {
    const isoX = (col - row) * (tileSize / 2);
    const isoY = (col + row) * (tileSize / 4);
    return { x: isoX, y: isoY };
  }, [tileSize]);

  // Calculate the visible tiles based on the current zoom and offset
  const calculateVisibleTiles = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const stageWidth = stage.width();
    const stageHeight = stage.height();
    const visibleRows = Math.ceil(stageHeight / (tileSize / 2) / zoom) + 2;
    const visibleCols = Math.ceil(stageWidth / tileSize / zoom) + 2;

    const startX = Math.max(0, Math.floor((-offset.x) / tileSize / zoom));
    const startY = Math.max(0, Math.floor((-offset.y) / tileSize / zoom));

    const tiles = [];
    for (let row = startY; row < startY + visibleRows; row++) {
      for (let col = startX; col < startX + visibleCols; col++) {
        const { x, y } = cartesianToIsometric(col, row);
        tiles.push({ row, col, x: x + offset.x, y: y + offset.y });
      }
    }

    // Debug: Log how many tiles are being rendered
    console.log('Visible tiles:', tiles.length);
    setVisibleTiles(tiles);
  }, [offset, zoom, tileSize, cartesianToIsometric]);

  useEffect(() => {
    calculateVisibleTiles();
  }, [offset, zoom, calculateVisibleTiles]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setZoom(newScale);

    stage.scale({ x: newScale, y: newScale });
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setOffset(newPos);
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    const pos = e.target.getStage().getPointerPosition();
    setStartPos({ x: pos.x, y: pos.y });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const pos = e.target.getStage().getPointerPosition();
    const deltaX = pos.x - startPos.x;
    const deltaY = pos.y - startPos.y;

    setOffset((prevOffset) => ({
      x: prevOffset.x + deltaX,
      y: prevOffset.y + deltaY,
    }));

    setStartPos({ x: pos.x, y: pos.y });
    calculateVisibleTiles(); // Update visible tiles while dragging
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      draggable
      scaleX={zoom}
      scaleY={zoom}
      onWheel={handleWheel}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
    >
      <Layer>
        {imageStatus === 'loaded' ? (
          visibleTiles.map((tile) => (
            <Image
              key={`${tile.row}-${tile.col}`}
              x={tile.x}
              y={tile.y}
              width={tileSize}
              height={tileSize}
              image={tileImage}
            />
          ))
        ) : (
          visibleTiles.map((tile) => (
            <Rect
              key={`${tile.row}-${tile.col}`}
              x={tile.x}
              y={tile.y}
              width={tileSize}
              height={tileSize}
              fill="lightgrey"
              stroke="black"
            />
          ))
        )}
      </Layer>
    </Stage>
  );
};

export default IsometricMap;
