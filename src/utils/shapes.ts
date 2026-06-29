import { Shape, BlockColor, GridMatrix } from '../types';

// Standard shapes in classic Block Blast
const SHAPE_GRIDS: number[][][] = [
  // 1x1 Single
  [[1]],
  
  // 1x2 Domino
  [[1, 1]],
  [[1], [1]],

  // 1x3 Straight
  [[1, 1, 1]],
  [[1], [1], [1]],

  // 1x4 Straight (tetromino line)
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],

  // 2x2 Square
  [[1, 1], [1, 1]],

  // Corner 2x2
  [[1, 1], [1, 0]],
  [[1, 1], [0, 1]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],

  // Large Corner 3x3
  [
    [1, 1, 1],
    [1, 0, 0],
    [1, 0, 0]
  ],
  [
    [1, 1, 1],
    [0, 0, 1],
    [0, 0, 1]
  ],
  [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1]
  ],
  [
    [0, 0, 1],
    [0, 0, 1],
    [1, 1, 1]
  ],

  // T-shape
  [
    [1, 1, 1],
    [0, 1, 0]
  ],
  [
    [0, 1, 0],
    [1, 1, 1]
  ],
  [
    [1, 0],
    [1, 1],
    [1, 0]
  ],
  [
    [0, 1],
    [1, 1],
    [0, 1]
  ],

  // Z-shapes & S-shapes
  [
    [1, 1, 0],
    [0, 1, 1]
  ],
  [
    [0, 1, 1],
    [1, 1, 0]
  ]
];

export const COLORS: BlockColor[] = ['orange', 'purple', 'green', 'yellow', 'blue'];

export interface ColorDetail {
  base: string;
  light: string; // Left/Top bevel highlight
  dark: string;  // Right/Bottom bevel shadow
  glow: string;  // Soft drop shadow effect
}

export const COLOR_MAP: Record<BlockColor, ColorDetail> = {
  orange: {
    base: '#FF6600',
    light: '#FFA366',
    dark: '#B34700',
    glow: 'rgba(255, 102, 0, 0.4)'
  },
  purple: {
    base: '#8A2BE2',
    light: '#B574F2',
    dark: '#5D14A1',
    glow: 'rgba(138, 43, 226, 0.4)'
  },
  green: {
    base: '#10B981',
    light: '#34D399',
    dark: '#047857',
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  yellow: {
    base: '#FBBF24',
    light: '#FDE047',
    dark: '#B45309',
    glow: 'rgba(251, 191, 36, 0.4)'
  },
  blue: {
    base: '#3B82F6',
    light: '#93C5FD',
    dark: '#1D4ED8',
    glow: 'rgba(59, 130, 246, 0.4)'
  }
};

/**
 * Generates a random shape with standard metadata
 */
export function getRandomShape(): Shape {
  const randomGridIdx = Math.floor(Math.random() * SHAPE_GRIDS.length);
  const grid = SHAPE_GRIDS[randomGridIdx];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const height = grid.length;
  const width = grid[0].length;
  const id = `shape_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    id,
    grid,
    color,
    width,
    height
  };
}

/**
 * Checks if a shape can fit on the 8x8 board at the specified target row/column
 */
export function canPlaceShape(
  shapeGrid: number[][],
  board: GridMatrix,
  startRow: number,
  startCol: number
): boolean {
  const height = shapeGrid.length;
  const width = shapeGrid[0].length;

  // Boundary check
  if (startRow < 0 || startRow + height > 8 || startCol < 0 || startCol + width > 8) {
    return false;
  }

  // Cell collision check
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (shapeGrid[r][c] === 1) {
        const boardRow = startRow + r;
        const boardCol = startCol + c;
        if (board[boardRow][boardCol] !== null) {
          return false; // Cell is already occupied
        }
      }
    }
  }

  return true;
}

/**
 * Iterates through all remaining active shapes in the bottom dock and checks if any
 * can fit in at least one available space on the 8x8 board.
 * Returns true if a valid move exists, false if it's GAME OVER.
 */
export function hasAnyValidMoves(activeShapes: (Shape | null)[], board: GridMatrix): boolean {
  // Extract non-null shapes
  const validShapes = activeShapes.filter((s): s is Shape => s !== null);
  
  if (validShapes.length === 0) {
    return true; // No pieces to place yet, we generated new ones
  }

  // For each shape, check all possible starting squares on the 8x8 grid
  for (const shape of validShapes) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (canPlaceShape(shape.grid, board, row, col)) {
          return true; // There is at least one legal move!
        }
      }
    }
  }

  return false; // Game over: zero moves are possible
}
