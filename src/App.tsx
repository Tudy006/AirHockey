import Peer, { DataConnection } from "peerjs";
import { For, createEffect, createSignal } from "solid-js";
import {
  Vector,
  addVec,
  handleCircleCollision,
  subVec,
  Circle,
  absVec,
  mulVec,
  handleCircleSegmCollision,
  isColliding,
  distanceToSegment,
} from "./physics";
import StartPage from "./test";
import TextInput from "./TextInput";

type DataType = "puck" | "players" | "teamChange" | "scored" | "gameSettings";

interface BaseData {
  type: DataType;
}
interface PuckData extends BaseData {
  type: "puck";
  puck: Circle;
}
interface RacketsData extends BaseData {
  type: "players";
  players: Player[];
}
interface TeamData extends BaseData {
  type: "teamChange";
  team: string;
}
interface ScoreData extends BaseData {
  type: "scored";
  score: number;
}
interface GameSettingsData extends BaseData {
  type: "gameSettings";
  gameSettings: {
    maxPuckSpeed: number;
    puckRadius: number;
    racketRadius: number;
  };
}
interface Player {
  id: string;
  name: string;
  team: string;
  score: number;
  racket: Circle;
}
type GameData =
  | PuckData
  | RacketsData
  | TeamData
  | ScoreData
  | GameSettingsData;

const TABLE_DIMENSIONS = {
  WIDTH: 1,
  LENGTH: 1.67172813,
  BORDER_SIZE: 0.05339913232,
  GOAL_SIZE: 0.447646738,
  GOAL_HEIGHT: 0.276176631,
};
const Table: Vector[] = [
  { x: TABLE_DIMENSIONS.BORDER_SIZE, y: TABLE_DIMENSIONS.BORDER_SIZE },
  { x: TABLE_DIMENSIONS.BORDER_SIZE, y: TABLE_DIMENSIONS.GOAL_HEIGHT },
  {
    x: TABLE_DIMENSIONS.BORDER_SIZE - 0.1,
    y: TABLE_DIMENSIONS.GOAL_HEIGHT,
  },
  {
    x: TABLE_DIMENSIONS.BORDER_SIZE - 0.1,
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
    x: TABLE_DIMENSIONS.LENGTH - TABLE_DIMENSIONS.BORDER_SIZE + 0.1,
    y: TABLE_DIMENSIONS.WIDTH - TABLE_DIMENSIONS.GOAL_HEIGHT,
  },
  {
    x: TABLE_DIMENSIONS.LENGTH - TABLE_DIMENSIONS.BORDER_SIZE + 0.1,
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

const defaultGameSettings = {
  puckRadius: 0.03,
  racketRadius: 0.06,
  maxPuckSpeed: 0.04,
};
const defaultPlayer = {
  id: "-1",
  team: "red",
  name: "",
  score: 0,
  racket: {
    center: { x: 0.5, y: 0.5 },
    velo: { x: 0, y: 0 },
    rad: defaultGameSettings.racketRadius,
  },
};
const defaultPuck: Circle = {
  center: { x: TABLE_DIMENSIONS.LENGTH / 2, y: TABLE_DIMENSIONS.WIDTH / 2 },
  velo: { x: 0.00000001, y: 0.00000001 },
  rad: defaultGameSettings.puckRadius,
};

function App() {
  const [gameSettings, setGameSettings] = createSignal(defaultGameSettings);

  const [playerType, setPlayerType] = createSignal<string | null>(null);
  const [peer, setPeer] = createSignal<Peer | null>(null);
  const [conns, setConns] = createSignal<DataConnection[]>([]);
  const [lastTouch, setLastTouch] = createSignal<string[]>(["", ""]);
  const [tableWidthPx, setTableWidthPx] = createSignal(
    Math.min(window.innerWidth, 1024) / TABLE_DIMENSIONS.LENGTH
  );
  const [myPlayer, setMyPlayer] = createSignal<Player>(defaultPlayer);
  const [oppPlayers, setOppPlayers] = createSignal<Player[]>([]);
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
    const table = document.getElementById("table"),
      rect = table?.getBoundingClientRect();
    const newX = (event.clientX - (rect ? rect.left : 0)) / tableWidthPx(),
      newY = (event.clientY - (rect ? rect.top : 0)) / tableWidthPx();
    const newPointerPos = {
      x: Math.max(
        myPlayer().team == "red"
          ? gameSettings().racketRadius + TABLE_DIMENSIONS.BORDER_SIZE
          : TABLE_DIMENSIONS.LENGTH / 2,
        Math.min(
          newX,
          myPlayer().team == "red"
            ? TABLE_DIMENSIONS.LENGTH / 2
            : TABLE_DIMENSIONS.LENGTH -
                (gameSettings().racketRadius + TABLE_DIMENSIONS.BORDER_SIZE)
        )
      ),
      y: Math.max(
        gameSettings().racketRadius + TABLE_DIMENSIONS.BORDER_SIZE,
        Math.min(
          newY,
          TABLE_DIMENSIONS.WIDTH -
            (gameSettings().racketRadius + TABLE_DIMENSIONS.BORDER_SIZE)
        )
      ),
    };
    const newRacketVelo = addVec(
      myPlayer().racket.velo,
      subVec(newPointerPos, myPlayer().racket.center)
    );
    setMyPlayer({
      ...myPlayer(),
      racket: {
        ...myPlayer().racket,
        center: newPointerPos,
        velo: newRacketVelo,
      },
    });
  };

  const handleGameReset = () => {
    setPuck(defaultPuck);
    setMyPlayer({
      ...myPlayer(),
      score: 0,
      racket: { ...myPlayer().racket, rad: defaultGameSettings.racketRadius },
    });
    setGameSettings(defaultGameSettings);

    for (const conn of conns()) {
      conn.send({ type: "scored", score: 0 });
      conn.send({ type: "gameSettings", gameSettings: defaultGameSettings });
    }
  };
  const handlePuckTouch = (player: Player) => {
    if (player.team == "red") setLastTouch([player.id, lastTouch()[1]]);
    else setLastTouch([lastTouch()[0], player.id]);
  };
  const handleScoring = (side: number) => {
    const scorerID = lastTouch()[1 - side];
    if (scorerID == myPlayer().id)
      setMyPlayer({ ...myPlayer(), score: myPlayer().score + 1 });
    else {
      for (const conn of conns()) {
        if (conn.connectionId == scorerID) {
          for (const player of oppPlayers())
            if (player.id == scorerID)
              conn.send({ type: "scored", score: player.score + 1 });
        }
      }
    }
    if (side == 0)
      setPuck({
        ...defaultPuck,
        center: {
          x:
            TABLE_DIMENSIONS.LENGTH *
            (0.5 - gameSettings().racketRadius - gameSettings().puckRadius),
          y: TABLE_DIMENSIONS.WIDTH / 2,
        },
        rad: gameSettings().puckRadius,
      });
    else
      setPuck({
        ...defaultPuck,
        center: {
          x:
            TABLE_DIMENSIONS.LENGTH *
            (0.5 + gameSettings().racketRadius + gameSettings().puckRadius),
          y: TABLE_DIMENSIONS.WIDTH / 2,
        },
        rad: gameSettings().puckRadius,
      });
  };
  setInterval(() => {
    if (playerType() == "Host") {
      var newPuck = { ...puck(), center: addVec(puck().center, puck().velo) },
        goal = false;
      for (let i = 0; i < Table.length; i++) {
        if (
          i % 6 == 2 &&
          distanceToSegment(newPuck.center, Table[i], Table[i + 1]) <=
            newPuck.rad
        ) {
          handleScoring(Math.floor(i / 6));
          goal = true;
        } else {
          newPuck = handleCircleSegmCollision(
            newPuck,
            Table[i],
            Table[(i + 1) % Table.length]
          );
        }
      }
      if (!goal) {
        if (isColliding(myPlayer().racket, newPuck)) {
          newPuck = handleCircleCollision(myPlayer().racket, newPuck);
          handlePuckTouch(myPlayer());
        }
        for (const oppPlayer of oppPlayers()) {
          if (isColliding(oppPlayer.racket, newPuck)) {
            newPuck = handleCircleCollision(oppPlayer.racket, newPuck);
            handlePuckTouch(oppPlayer);
          }
        }
        if (absVec(newPuck.velo) >= gameSettings().maxPuckSpeed) {
          newPuck.velo = mulVec(
            newPuck.velo,
            gameSettings().maxPuckSpeed / absVec(newPuck.velo)
          );
        }
        for (const conn of conns()) {
          conn.send({ type: "puck", puck: newPuck });
        }
        setPuck({ ...newPuck });
      }
    }
    for (const curConn of conns()) {
      if (playerType() == "Host") {
        curConn.send({
          type: "players",
          players: [myPlayer(), ...oppPlayers()],
        });
      } else {
        curConn.send({ type: "players", players: [myPlayer()] });
      }
    }
    setMyPlayer({
      ...myPlayer(),
      racket: { ...myPlayer().racket, velo: { x: 0, y: 0 } },
    });
  }, 10);
  const displayCircle = (circle: Circle, imgUrl: string) => {
    const table = document.getElementById("table"),
      rect = table?.getBoundingClientRect();
    return (
      <div
        class="absolute z-10"
        style={{
          width: `${2 * circle.rad * tableWidthPx()}px`,
          height: `${2 * circle.rad * tableWidthPx()}px`,
          top: `${
            (circle.center.y - circle.rad) * tableWidthPx() +
            (rect ? rect.top : 0)
          }px`,
          left: `${
            (circle.center.x - circle.rad) * tableWidthPx() +
            (rect ? rect.left : 0)
          }px`,
        }}
      >
        <img class="w-full" src={imgUrl} />
      </div>
    );
  };
  const totalTeamScore = (team: string, players: Player[]) => {
    var sum = 0;
    for (const player of players) {
      if (player.team == team) sum += player.score;
    }
    return sum;
  };
  const changePlayerTeam = (player: Player) => {
    if (playerType() == "Host") {
      if (player.id == "0") {
        setMyPlayer({
          ...myPlayer(),
          team: player.team == "red" ? "blue" : "red",
        });
      } else {
        for (const curConn of conns()) {
          if (curConn.connectionId == player.id) {
            curConn.send({
              type: "teamChange",
              team: player.team == "red" ? "blue" : "red",
            });
          }
        }
      }
    }
  };
  const displayTeamScoreboard = (team: string) => {
    const bg1 = `bg-${team}-200`,
      bg2 = `bg-${team}-300`,
      colors = "bg-red-200 bg-red-300 bg-blue-200 bg-blue-300";
    const teamPlayers = [myPlayer(), ...oppPlayers()].filter((player) => {
      return player.team == team;
    });
    return (
      <div class={"max-w-md mx-auto p-4 rounded-lg shadow-md " + bg1}>
        <h2 class="text-xl font-bold mb-4 text-center">
          {team.toUpperCase()} TEAM
        </h2>
        <table class="w-full bg-white rounded-lg overflow-hidden shadow-md">
          <thead class={"text-gray-700 " + bg2}>
            <tr>
              <th class="py-2 px-4 text-left">Player Name</th>
              <th class="py-2 px-4 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            <For each={teamPlayers}>
              {(player) => (
                <tr
                  onpointerdown={() => changePlayerTeam(player)}
                  class="hover:bg-gray-200 transition-transform duration-500 ease-in-out transform cursor-pointer"
                >
                  <td class="py-2 px-4">{player.name}</td>
                  <td class="py-2 px-4">{player.score}</td>
                </tr>
              )}
            </For>
            <tr>
              <td class="py-2 px-4">Total</td>
              <td class="py-2 px-4">{totalTeamScore(team, teamPlayers)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const Scoreboards = () => {
    return (
      <div class="flex flex-row justify-between mt-3">
        {displayTeamScoreboard("red")}
        {displayTeamScoreboard("blue")}
      </div>
    );
  };
  const ControlPanel = () => {
    const handleTextChange = (text: string, settingType: string) => {
      if (parseInt(text)) {
        setGameSettings({
          ...gameSettings(),
          [settingType]: parseInt(text) / 100,
        });
        if (settingType == "puckRadius") {
          setPuck({ ...puck(), rad: gameSettings().puckRadius });
        } else if (settingType == "racketRadius") {
          setMyPlayer({
            ...myPlayer(),
            racket: { ...myPlayer().racket, rad: gameSettings().racketRadius },
          });
        }
        for (const conn of conns()) {
          conn.send({
            type: "gameSettings",
            gameSettings: gameSettings(),
          });
        }
      }
    };
    return (
      <div class="flex flex-row justify-between px-3 space-x-2 mx-auto">
        <button
          class="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-300 mx-auto mb-4 px-4 py-2"
          onclick={handleGameReset}
        >
          RESET GAME
        </button>
        <TextInput
          placeholder="Puck Radius"
          onTextChange={(text: string) => handleTextChange(text, "puckRadius")}
          maxLength={2}
        />
        <TextInput
          placeholder="Racket Radius"
          onTextChange={(text: string) =>
            handleTextChange(text, "racketRadius")
          }
          maxLength={2}
        />
        <TextInput
          placeholder="Puck Speed"
          onTextChange={(text: string) =>
            handleTextChange(text, "maxPuckSpeed")
          }
          maxLength={1}
        />
      </div>
    );
  };
  function displayTable() {
    return (
      <div
        class="w-full h-screen flex flex-col touch-none"
        onPointerMove={handlePointerMove}
      >
        {Scoreboards()}
        <div
          id="table"
          class="m-auto"
          style={{
            width: `${tableWidthPx() * TABLE_DIMENSIONS.LENGTH}px`,
            height: `${tableWidthPx()}px`,
          }}
        >
          <img src="images/white_table_complete.png" />
        </div>
        <div class="absolute">
          <For each={[myPlayer(), ...oppPlayers()]}>
            {(player) =>
              displayCircle(player.racket, `images/${player.team}.png`)
            }
          </For>
          {displayCircle(puck(), "images/puck.png")}
        </div>
        {playerType() == "Host" ? ControlPanel() : <div></div>}
      </div>
    );
  }
  const handleData = (data: GameData) => {
    switch (data.type) {
      case "puck":
        setPuck(data.puck);
        break;
      case "players":
        if (playerType() == "Host") {
          const newPlayer = data.players[0],
            newOppPlayers = oppPlayers();
          var existed = false;
          for (let i = 0; i < newOppPlayers.length; i++) {
            if (newOppPlayers[i].id == newPlayer.id) {
              existed = true;
              newOppPlayers[i] = newPlayer;
            }
          }
          if (!existed) newOppPlayers.push(newPlayer);
          setOppPlayers([...newOppPlayers]);
        } else {
          setOppPlayers(
            data.players.filter((player) => player.id != myPlayer().id)
          );
        }
        break;
      case "teamChange":
        setMyPlayer({ ...myPlayer(), team: data.team });
        break;
      case "scored":
        setMyPlayer({ ...myPlayer(), score: data.score });
        break;
      case "gameSettings":
        setMyPlayer({
          ...myPlayer(),
          racket: { ...myPlayer().racket, rad: data.gameSettings.racketRadius },
        });
        setGameSettings(data.gameSettings);
        break;
      default:
        console.log("Unkown data type: ", data);
    }
  };
  createEffect(() => {
    for (const curConn of conns()) {
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
    }
  });

  const handlePlayerConnect = (newId: string, newName: string) => {
    setMyPlayer((prevRacket) => ({ ...prevRacket, id: newId, name: newName }));
  };
  const startPageProps = () => ({
    onPeerChange: setPeer,
    onConnChange: (newConn: DataConnection) => {
      setConns([...conns(), newConn]);
    },
    onPlayerConnect: handlePlayerConnect,
    onPlayerTypeChange: setPlayerType,
    onConnClose: (closedConn: DataConnection) => {
      setOppPlayers([
        ...oppPlayers().filter((oppPlayer) => {
          return oppPlayer.id != closedConn.connectionId;
        }),
      ]);
      setConns([
        ...conns().filter((conn) => {
          return conn != closedConn;
        }),
      ]);
    },
  });
  return (
    <div>
      {peer() ? (
        displayTable()
      ) : (
        <div class="flex flex-row w-full justify-center align-middle bg-gray-100">
          <StartPage {...startPageProps()} />
        </div>
      )}
    </div>
  );
}
export default App;
