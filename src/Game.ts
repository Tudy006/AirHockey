import { createSignal } from "solid-js";
import * as collider2D from "./physics";

export type Racket = {
  id: string;
  racket: collider2D.Circle;
};
export type GameData = {
  puckData: collider2D.Circle;
  racketsData: Racket[];
};
export const TABLE_WIDTH = 1,
  TABLE_LENGTH = 1.67172813,
  BORDER_SIZE = 0.05339913232,
  GOAL_SIZE = 0.447646738,
  GOAL_HEIGHT = (1 - GOAL_SIZE) / 2,
  PUCK_RADIUS = 0.03,
  RACKET_RADIUS = 0.06,
  MAX_SPEED = 0.04;

export const Table: collider2D.Vector[] = [
  { x: BORDER_SIZE, y: BORDER_SIZE },
  { x: BORDER_SIZE, y: GOAL_HEIGHT },
  { x: BORDER_SIZE - PUCK_RADIUS, y: GOAL_HEIGHT },
  { x: BORDER_SIZE - PUCK_RADIUS, y: GOAL_HEIGHT + GOAL_SIZE },
  { x: BORDER_SIZE, y: GOAL_HEIGHT + GOAL_SIZE },
  { x: BORDER_SIZE, y: TABLE_WIDTH - BORDER_SIZE },
  { x: TABLE_LENGTH - BORDER_SIZE, y: TABLE_WIDTH - BORDER_SIZE },
  { x: TABLE_LENGTH - BORDER_SIZE, y: TABLE_WIDTH - GOAL_HEIGHT },
  { x: TABLE_LENGTH - BORDER_SIZE + PUCK_RADIUS, y: TABLE_WIDTH - GOAL_HEIGHT },
  { x: TABLE_LENGTH - BORDER_SIZE + PUCK_RADIUS, y: GOAL_HEIGHT },
  { x: TABLE_LENGTH - BORDER_SIZE, y: GOAL_HEIGHT },
  { x: TABLE_LENGTH - BORDER_SIZE, y: BORDER_SIZE },
];

export const [started, setStarted] = createSignal(false);

//console.log(started());
export const [puck, setPuck] = createSignal<collider2D.Circle>({
  center: {
    x: TABLE_LENGTH * 0.1,
    y: TABLE_WIDTH / 2,
  },
  velo: { x: -0.0005, y: -0.001 },
  rad: PUCK_RADIUS,
});
export const [rackets, setRackets] = createSignal<Racket[]>([]);
export function MovePuck() {
  setPuck({
    center: collider2D.addVec(puck().center, puck().velo),
    velo: puck().velo,
    rad: puck().rad,
  });
}
export function handlePuckCollisions() {
  var newPuck = puck();
  for (let i = 0; i < Table.length; i++) {
    newPuck = collider2D.handleCircleCornerCollision(
      newPuck,
      Table[i],
      Table[(i + 1) % 12],
      Table[(i + 2) % 12]
    );
  }
  for (let i = 0; i < Table.length; i++) {
    newPuck = collider2D.handleCircleSegmCollision(
      newPuck,
      Table[i],
      Table[(i + 1) % 12]
    );
  }
  for (let i = 0; i < rackets().length; i++) {
    newPuck = collider2D.handleCircleColision(rackets()[i].racket, newPuck);
  }
  if (collider2D.absVec(newPuck.velo) >= MAX_SPEED) {
    newPuck.velo = collider2D.mulVec(
      newPuck.velo,
      MAX_SPEED / collider2D.absVec(newPuck.velo)
    );
  }
  //newPuck = putInsideTable( newPuck );
  setPuck(newPuck);
}
export function updateRacket(
  newX: number,
  newY: number,
  idPlayerRacket: string
) {
  var newRackets = rackets();
  const newCenter: collider2D.Vector = {
    x: Math.max(
      RACKET_RADIUS + BORDER_SIZE,
      Math.min(newX, TABLE_LENGTH - (RACKET_RADIUS + BORDER_SIZE))
    ),
    y: Math.max(
      RACKET_RADIUS + BORDER_SIZE,
      Math.min(newY, TABLE_WIDTH - (RACKET_RADIUS + BORDER_SIZE))
    ),
  };
  for (let i = 0; i < newRackets.length; i++) {
    if (newRackets[i].id == idPlayerRacket) {
      console.log(rackets().length);
      // console.log("CHANGED", newRackets[i].racket.center.x);
      newRackets[i] = {
        id: idPlayerRacket,
        racket: {
          center: newCenter,
          velo: collider2D.mulVec(
            collider2D.subVec(newCenter, newRackets[i].racket.center),
            1
          ),
          rad: RACKET_RADIUS,
        },
      };
      // console.log("HAS CHANGED?", newRackets[i].racket.center.x);
    }
  }
  setRackets([...newRackets]);
}
