/*import { createSignal } from "solid-js";
import * as collider2D from "./physics";

export type GameData = {
  puckData: collider2D.Circle;
  racketsData: Racket[];
};


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
  for (let i = 0; i < rackets().length; i++) {
    newPuck = collider2D.handleCircleColision(rackets()[i].racket, newPuck);
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
  const newCenter: collider2D.Vector = 
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
*/
