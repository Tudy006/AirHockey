import Peer, { DataConnection } from "peerjs";
import { For, createEffect, createSignal } from "solid-js";
import {
  Vector,
  addVec,
  handleCircleColision,
  subVec,
  Circle,
  absVec,
  mulVec,
  handleCircleSegmCollision,
} from "./physics";
import { peerConfig } from "./config";
import TextInput from "./TextInput";
import StartPage from "./test";

type DataType = "puck" | "racket";

interface BaseData {
  type: DataType;
}
interface PuckData extends BaseData {
  type: "puck";
  puck: Circle;
}
interface RacketData extends BaseData {
  type: "racket";
  racket: Racket;
}

interface Racket {
  id: string;
  racket: Circle;
}
type GameData = PuckData | RacketData;

const MAX_PUCK_SPEED = 0.04;

const TABLE_DIMENSIONS = {
  WIDTH: 1,
  LENGTH: 1.67172813,
  BORDER_SIZE: 0.05339913232,
  GOAL_SIZE: 0.447646738,
  PUCK_RADIUS: 0.03,
  RACKET_RADIUS: 0.06,
  MAX_SPEED: 0.04,
  GOAL_HEIGHT: 0.276176631,
};
const Table: Vector[] = [
  { x: TABLE_DIMENSIONS.BORDER_SIZE, y: TABLE_DIMENSIONS.BORDER_SIZE },
  { x: TABLE_DIMENSIONS.BORDER_SIZE, y: TABLE_DIMENSIONS.GOAL_HEIGHT },
  {
    x: TABLE_DIMENSIONS.BORDER_SIZE - TABLE_DIMENSIONS.PUCK_RADIUS,
    y: TABLE_DIMENSIONS.GOAL_HEIGHT,
  },
  {
    x: TABLE_DIMENSIONS.BORDER_SIZE - TABLE_DIMENSIONS.PUCK_RADIUS,
    y: TABLE_DIMENSIONS.GOAL_HEIGHT + TABLE_DIMENSIONS.GOAL_SIZE,
  },
  {
    x: TABLE_DIMENSIONS.BORDER_SIZE,
    y: TABLE_DIMENSIONS.GOAL_HEIGHT + TABLE_DIMENSIONS.GOAL_SIZE,
  },
  {
    x: TABLE_DIMENSIONS.BORDER_SIZE,
    y: TABLE_DIMENSIONS.WIDTH - TABLE_DIMENSIONS.BORDER_SIZE,
  },
  {
    x: TABLE_DIMENSIONS.LENGTH - TABLE_DIMENSIONS.BORDER_SIZE,
    y: TABLE_DIMENSIONS.WIDTH - TABLE_DIMENSIONS.BORDER_SIZE,
  },
  {
    x: TABLE_DIMENSIONS.LENGTH - TABLE_DIMENSIONS.BORDER_SIZE,
    y: TABLE_DIMENSIONS.WIDTH - TABLE_DIMENSIONS.GOAL_HEIGHT,
  },
  {
    x:
      TABLE_DIMENSIONS.LENGTH -
      TABLE_DIMENSIONS.BORDER_SIZE +
      TABLE_DIMENSIONS.PUCK_RADIUS,
    y: TABLE_DIMENSIONS.WIDTH - TABLE_DIMENSIONS.GOAL_HEIGHT,
  },
  {
    x:
      TABLE_DIMENSIONS.LENGTH -
      TABLE_DIMENSIONS.BORDER_SIZE +
      TABLE_DIMENSIONS.PUCK_RADIUS,
    y: TABLE_DIMENSIONS.GOAL_HEIGHT,
  },
  {
    x: TABLE_DIMENSIONS.LENGTH - TABLE_DIMENSIONS.BORDER_SIZE,
    y: TABLE_DIMENSIONS.GOAL_HEIGHT,
  },
  {
    x: TABLE_DIMENSIONS.LENGTH - TABLE_DIMENSIONS.BORDER_SIZE,
    y: TABLE_DIMENSIONS.BORDER_SIZE,
  },
];

const defaultRacket = {
  id: "-1",
  racket: {
    center: { x: 0.5, y: 0.5 },
    velo: { x: 0, y: 0 },
    rad: TABLE_DIMENSIONS.RACKET_RADIUS,
  },
};
const defaultPuck: Circle = {
  center: { x: TABLE_DIMENSIONS.WIDTH / 2, y: TABLE_DIMENSIONS.LENGTH / 2 },
  velo: { x: 0.001, y: 0.001 },
  rad: TABLE_DIMENSIONS.PUCK_RADIUS,
};

function App() {
  const [pointerPosition, setPointerPosition] = createSignal<Vector>({
    x: 0,
    y: 0,
  });

  const [playerType, setPlayerType] = createSignal<string | null>(null);
  const [playerId, setPlayerId] = createSignal<string | null>(null);
  const [peer, setPeer] = createSignal<Peer | null>(null);
  const [conn, setConn] = createSignal<DataConnection | null>(null);
  const [tableWidthPx, setTableWidthPx] = createSignal(
    Math.min(window.innerWidth, 1024) / TABLE_DIMENSIONS.LENGTH
  );
  const [myRacket, setMyRacket] = createSignal(defaultRacket);
  const [oppRacket, setOppRacket] = createSignal(defaultRacket);
  const [puck, setPuck] = createSignal<Circle>(defaultPuck);

  createEffect(() => {
    const handleResize = () => {
      setTableWidthPx(
        Math.min(window.innerWidth, 1024) / TABLE_DIMENSIONS.LENGTH
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });
  const handlePointerMove = (event: PointerEvent) => {
    const newX = event.clientX / tableWidthPx(),
      newY = event.clientY / tableWidthPx();
    const newPointerPos = {
      x: Math.max(
        TABLE_DIMENSIONS.RACKET_RADIUS + TABLE_DIMENSIONS.BORDER_SIZE,
        Math.min(
          newX,
          TABLE_DIMENSIONS.LENGTH -
            (TABLE_DIMENSIONS.RACKET_RADIUS + TABLE_DIMENSIONS.BORDER_SIZE)
        )
      ),
      y: Math.max(
        TABLE_DIMENSIONS.RACKET_RADIUS + TABLE_DIMENSIONS.BORDER_SIZE,
        Math.min(
          newY,
          TABLE_DIMENSIONS.WIDTH -
            (TABLE_DIMENSIONS.RACKET_RADIUS + TABLE_DIMENSIONS.BORDER_SIZE)
        )
      ),
    };
    const newRacketVelo = addVec(
      myRacket().racket.velo,
      subVec(newPointerPos, myRacket().racket.center)
    );
    setMyRacket({
      ...myRacket(),
      racket: {
        ...myRacket().racket,
        center: newPointerPos,
        velo: newRacketVelo,
      },
    });
    setPointerPosition(newPointerPos);
  };

  setInterval(() => {
    const curConn = conn();
    var newPuck = { ...puck(), center: addVec(puck().center, puck().velo) };
    for (let i = 0; i < Table.length; i++) {
      newPuck = handleCircleSegmCollision(
        newPuck,
        Table[i],
        Table[(i + 1) % 12]
      );
    }
    if (absVec(newPuck.velo) >= MAX_PUCK_SPEED) {
      newPuck.velo = mulVec(
        newPuck.velo,
        MAX_PUCK_SPEED / absVec(newPuck.velo)
      );
    }
    if (playerType() == "Host") {
      newPuck = handleCircleColision(myRacket().racket, newPuck);
      if (curConn) {
        newPuck = handleCircleColision(oppRacket().racket, newPuck);
        curConn.send({ type: "puck", puck: newPuck });
      }
    }
    if (curConn) {
      curConn.send({ type: "racket", racket: myRacket() });
    }
    setMyRacket({
      ...myRacket(),
      racket: { ...myRacket().racket, velo: { x: 0, y: 0 } },
    });
    setPuck({ ...newPuck });
  }, 17);
  const displayCircle = (circle: Circle, imgUrl: string) => {
    return (
      <div
        class="absolute"
        style={{
          width: `${2 * circle.rad * tableWidthPx()}px`,
          left: `${(circle.center.x - circle.rad) * tableWidthPx()}px`,
          top: `${(circle.center.y - circle.rad) * tableWidthPx()}px`,
        }}
      >
        <img src={imgUrl} />
      </div>
    );
  };
  function displayTable() {
    return (
      <div
        class="w-full h-screen flex touch-none"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      >
        <div class="h-auto max-w-5xl">
          {myRacket().id != "-1" &&
            displayCircle(myRacket().racket, "images/red.png")}
          {oppRacket().id != "-1" &&
            displayCircle(oppRacket().racket, "images/red.png")}
          {displayCircle(puck(), "images/puck.png")}
          <div>
            <img src="images/white_table_complete.png" />
          </div>
        </div>
      </div>
    );
  }

  const handleData = (data: GameData) => {
    switch (data.type) {
      case "puck":
        setPuck(data.puck);
        break;
      case "racket":
        setOppRacket(data.racket);
        break;
      default:
        console.log("Unkown data type: ", data);
    }
  };
  createEffect(() => {
    const curConn = conn();
    if (curConn) {
      curConn.on("open", () => {
        curConn.on("close", () => {
          console.log("WTF");
        });
        curConn.on("data", (data: any) => {
          handleData(data as GameData);
        });
      });
    }
  });

  const handlePlayerIdChange = (newId: string) => {
    setPlayerId(newId);
    setMyRacket((prevRacket) => ({ ...prevRacket, id: newId }));
  };
  const startPageProps = (userType: string, buttonText: string) => ({
    onPeerChange: setPeer,
    onConnChange: setConn,
    onPlayerIdChange: handlePlayerIdChange,
    onPlayerTypeChange: setPlayerType,
    userType: userType,
    buttonText: buttonText,
  });
  return (
    <div>
      {peer() ? (
        displayTable()
      ) : (
        <div class="flex flex-row w-full justify-center align-middle bg-gray-100">
          <StartPage {...startPageProps("Host", "Create Room")} />
          <StartPage {...startPageProps("Guest", "Join Room")} />
        </div>
      )}
    </div>
  );
}
//<StartPage {...startPageProps("Guest", "Create Room")} />
export default App;
