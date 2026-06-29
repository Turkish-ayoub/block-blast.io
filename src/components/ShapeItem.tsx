import React from 'react';
import { Shape, BlockColor } from '../types';
import { COLOR_MAP } from '../utils/shapes';

interface ShapeItemProps {
  key?: any;
  shape: Shape | null;
  index: number;
  isDraggingThis: boolean;
  onPointerDown: (e: React.PointerEvent<any>, index: number, shape: any) => void;
}

export default function ShapeItem({ shape, index, isDraggingThis, onPointerDown }: ShapeItemProps) {
  if (!shape) {
    // Empty slot (piece already placed)
    return (
      <div
        id={`dock-slot-${index}-empty`}
        className="w-28 h-28 xs:w-32 xs:h-32 rounded-2xl bg-slate-950/20 border border-slate-800/50 flex items-center justify-center shadow-inner"
      >
        <div className="w-2 h-2 rounded-full bg-slate-800/40 animate-pulse"></div>
      </div>
    );
  }

  // Calculate dynamic size of each cell inside the mini-dock to ensure everything fits beautifully
  const maxDim = Math.max(shape.width, shape.height);
  const cellSizeClass = 
    maxDim === 1 
      ? 'w-10 h-10 xs:w-12 xs:h-12 rounded-lg' 
      : maxDim === 2 
      ? 'w-6 h-6 xs:w-8 xs:h-8 rounded-[6px]' 
      : maxDim === 3 
      ? 'w-5 h-5 xs:w-6.5 xs:h-6.5 rounded-[4px]' 
      : 'w-4 h-4 xs:w-5 xs:h-5 rounded-[3px]';

  const colorDetail = COLOR_MAP[shape.color];

  return (
    <div
      id={`dock-slot-${index}`}
      onPointerDown={(e) => onPointerDown(e, index, shape)}
      className={`w-28 h-28 xs:w-32 xs:h-32 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700/60 transition-all duration-200 flex items-center justify-center cursor-grab active:cursor-grabbing relative select-none shadow-md ${
        isDraggingThis ? 'opacity-25' : 'opacity-100'
      }`}
    >
      <div 
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${shape.width}, minmax(0, 1fr))`,
        }}
      >
        {shape.grid.map((row, rIdx) =>
          row.map((val, cIdx) => {
            if (val === 1) {
              return (
                <div
                  key={`mini-cell-${rIdx}-${cIdx}`}
                  className={`${cellSizeClass} border-t border-l border-r border-b`}
                  style={{
                    backgroundColor: colorDetail.base,
                    borderTopColor: colorDetail.light,
                    borderLeftColor: colorDetail.light,
                    borderBottomColor: colorDetail.dark,
                    borderRightColor: colorDetail.dark,
                    boxShadow: `inset 1px 1px 0px rgba(255,255,255,0.2), 0 2px 4px ${colorDetail.glow}`,
                  }}
                />
              );
            } else {
              return (
                <div
                  key={`mini-cell-empty-${rIdx}-${cIdx}`}
                  className={`${cellSizeClass} opacity-0 pointer-events-none`}
                />
              );
            }
          })
        )}
      </div>
    </div>
  );
}
