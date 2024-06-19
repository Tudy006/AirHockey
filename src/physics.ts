export type Vector = {
  x: number;
  y: number;
};
export type Circle = {
  center: Vector;
  velo: Vector;
  rad: number;
};
export function addVec(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y };
}
export function subVec(a: Vector, b: Vector): Vector {
  return { x: a.x - b.x, y: a.y - b.y };
}
export function mulVec(a: Vector, ct: number): Vector {
  return { x: a.x * ct, y: a.y * ct };
}
export function dotVec(a: Vector, b: Vector): number {
  return a.x * b.x + a.y * b.y;
}
export function crossVec(a: Vector, b: Vector): number {
  return a.x * b.y - a.y * b.x;
}
export function absVec(a: Vector): number {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}
export function normVec(a: Vector): number {
  return a.x * a.x + a.y * a.y;
}
export function normalizeVec(a: Vector): Vector {
  return normVec(a) != 1 ? mulVec(a, 1 / absVec(a)) : a;
}
export function distance(a: Vector, b: Vector): number {
  return absVec(subVec(a, b));
}
export function reflectVec(a: Vector, b: Vector): Vector {
  b = normalizeVec(b);
  return addVec(a, mulVec(b, -2 * dotVec(a, b)));
}
export function perpVec(a: Vector): Vector {
  return { x: -a.y, y: a.x };
}
export function abs(x: number): number {
  return x < 0 ? -x : x;
}
export function triangleArea(a: Vector, b: Vector, c: Vector): number {
  return abs(crossVec(subVec(b, a), subVec(c, a))) / 2;
}
export function trigOrder(a: Vector, b: Vector, c: Vector): boolean {
  return crossVec(subVec(b, a), subVec(c, a)) > 0;
}
export function distanceToSegment(o: Vector, p: Vector, q: Vector): number {
  /// returns distance from O to PQ
  if (
    dotVec(subVec(o, p), subVec(q, p)) >= 0 &&
    dotVec(subVec(o, q), subVec(p, q)) >= 0
  ) {
    return (2 * triangleArea(o, p, q)) / distance(p, q);
  } else {
    return Math.min(distance(o, p), distance(o, q));
  }
}
export function isColliding(circle1: Circle, circle2: Circle): boolean {
  return distance(circle1.center, circle2.center) <= circle1.rad + circle2.rad;
}
export function handleCircleCollision(
  circle1: Circle,
  circle2: Circle
): Circle {
  /// circle1 is not affected by collision
  const d = distance(circle1.center, circle2.center);
  if (d > circle1.rad + circle2.rad) return circle2; /// if circles dont intersect
  const relativeVelo = subVec(circle2.velo, circle1.velo),
    normDirVec = normalizeVec(subVec(circle2.center, circle1.center)),
    newVelo = addVec(reflectVec(relativeVelo, normDirVec), circle1.velo);
  console.log();
  var dt = 0,
    a = subVec(circle2.center, circle1.center),
    c = circle1.rad + circle2.rad,
    b =
      dotVec(relativeVelo, normDirVec) < 0
        ? relativeVelo
        : mulVec(relativeVelo, -1);

  dt =
    (2 * dotVec(a, b) +
      Math.sqrt(
        (2 * dotVec(a, b)) ** 2 - 4 * (normVec(a) - c * c) * normVec(b)
      )) /
    (2 * normVec(b));
  circle2 = {
    center: addVec(
      subVec(circle2.center, mulVec(b, dt)),
      mulVec(newVelo, dt * 0.1)
    ),
    velo: newVelo,
    rad: circle2.rad,
  };
  return circle2;
}

export function handleCircleCornerCollision(
  circle: Circle,
  a: Vector,
  b: Vector,
  c: Vector
): Circle {
  const dist = distance(circle.center, b);
  if (
    !trigOrder(circle.center, c, b) ||
    !trigOrder(circle.center, b, a) ||
    dist >= circle.rad
  ) {
    return circle;
  } else {
    const normVec = normalizeVec(
      addVec(normalizeVec(subVec(b, a)), normalizeVec(subVec(b, c)))
    );
    return {
      center: subVec(circle.center, circle.velo),
      velo: reflectVec(circle.velo, normVec),
      rad: circle.rad,
    };
  }
}

export function handleCircleSegmCollision(
  circle: Circle,
  p: Vector,
  q: Vector
): Circle {
  const dist = distanceToSegment(circle.center, p, q);
  if (dist > circle.rad) return circle;
  const normVec = normalizeVec(perpVec(subVec(p, q)));
  return {
    center: addVec(circle.center, mulVec(normVec, circle.rad - dist)),
    velo: reflectVec(circle.velo, normVec),
    rad: circle.rad,
  };
}
