export type BlockColor = 'orange' | 'purple' | 'green' | 'yellow' | 'blue';

export interface Shape {
  id: string;
  grid: number[][]; // 2D array representation (1 = solid block, 0 = empty)
  color: BlockColor;
  width: number;
  height: number;
}

export interface DraggedPiece {
  id: string;
  shape: Shape;
  clientX: number;
  clientY: number;
  offsetX: number; // offset of click relative to piece element left
  offsetY: number; // offset of click relative to piece element top
  originalIndex: number; // 0, 1, or 2 representing the bottom dock slot
  sourceRect: { left: number; top: number; width: number; height: number };
}

export type GridMatrix = (BlockColor | null)[][]; // 8x8 grid representation

export interface GameStats {
  score: number;
  highScore: number;
  combos: number;
  linesClearedTotal: number;
}
