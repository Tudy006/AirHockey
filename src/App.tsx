import Peer, { DataConnection } from "peerjs";
import { createSignal } from "solid-js";
import * as myGame from "./Game";
import { handleCircleColision } from "./physics";

const HOST_PEER_ID = "dbd71e16-01c9-43f1-a75b-e916ddc60e10";

function App() {
  var idPlayerRacket: number = 0;
  var peerConns: DataConnection[] = [];
  const userType = window.location.hash.slice(1);
  if (userType == "host") {
    idPlayerRacket = 0;
    const peer = new Peer(HOST_PEER_ID);
    peer.on("open", () => {
      myGame.setStarted(true);
      peer.on("connection", (conn) => {
        peerConns.push(conn);
        conn.send(peerConns.length + 1);
        conn.on("data", (data) => {
          myGame.setPuck((data as myGame.GameData).puckData);
          myGame.setRackets((data as myGame.GameData).racketsData);
        });
      });
    });
  } else {
    const peer = new Peer();
    idPlayerRacket = 1;
    peer.on("open", (id) => {
      peerConns.push(peer.connect(HOST_PEER_ID));
      peerConns[0].on("open", () => {
        myGame.setStarted(true);
        peerConns[0].on("data", (data) => {
          myGame.setPuck((data as myGame.GameData).puckData);
          myGame.setRackets((data as myGame.GameData).racketsData);
        });
      });
    });
  }

  setInterval(() => {
    myGame.MovePuck();
    myGame.handlePuckCollisions();
    console.log(myGame.started());
    for (let i = 0; i < peerConns.length; i++)
      peerConns[i].send({
        puckData: myGame.puck(),
        racketsData: myGame.rackets(),
      });
  }, 17);
  const [tableWidthPx, setTableWidthPx] = createSignal(
    Math.min(window.innerWidth, 1024) / myGame.TABLE_LENGTH
  );

  function handlePointerMove(event: PointerEvent) {
    if (event.view) {
      setTableWidthPx(
        Math.min(event.view.innerWidth, 1024) / myGame.TABLE_LENGTH
      );
      myGame.updateRacket(
        event.clientX / tableWidthPx(),
        event.clientY / tableWidthPx(),
        idPlayerRacket
      );

      myGame.setPuck(
        handleCircleColision(myGame.rackets()[idPlayerRacket], myGame.puck())
      );
      for (let i = 0; i < peerConns.length; i++)
        peerConns[i].send({
          puckData: myGame.puck(),
          racketsData: myGame.rackets(),
        });
    }
  }
  return (
    <div
      class="top-0 max-w-5xl h-screen flex touch-none"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerMove}
    >
      <div class="h-auto max-w-5xl">
        <div
          class="absolute"
          style={{
            width: `${2 * myGame.RACKET_RADIUS * tableWidthPx()}px`,
            left: `${
              (myGame.rackets()[0].center.x - myGame.RACKET_RADIUS) *
              tableWidthPx()
            }px`,
            top: `${
              (myGame.rackets()[0].center.y - myGame.RACKET_RADIUS) *
              tableWidthPx()
            }px`,
          }}
        >
          <img src="/images/red.png" />
        </div>
        <div
          class="absolute"
          style={{
            width: `${2 * myGame.RACKET_RADIUS * tableWidthPx()}px`,
            left: `${
              (myGame.rackets()[1].center.x - myGame.RACKET_RADIUS) *
              tableWidthPx()
            }px`,
            top: `${
              (myGame.rackets()[1].center.y - myGame.RACKET_RADIUS) *
              tableWidthPx()
            }px`,
          }}
        >
          <img src="images/blue.png" />
        </div>
        <div
          class="absolute"
          style={{
            width: `${2 * myGame.PUCK_RADIUS * tableWidthPx()}px`,
            left: `${
              (myGame.puck().center.x - myGame.PUCK_RADIUS) * tableWidthPx()
            }px`,
            top: `${
              (myGame.puck().center.y - myGame.PUCK_RADIUS) * tableWidthPx()
            }px`,
          }}
        >
          <img src="images/puck.png" />
        </div>
        <div class="top-0">
          <img src="images/white_table_complete.png" />
        </div>
      </div>
    </div>
  );
}

export default App;
