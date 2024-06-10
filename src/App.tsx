import Peer, { DataConnection } from "peerjs";
import { For, createSignal } from "solid-js";
import * as myGame from "./Game";
import { handleCircleColision } from "./physics";
import { peerConfig } from "./config";

const HOST_PEER_ID = "dbd71e16-01c9-43f1-a75b-e916ddc60e10";

function App() {
  var idPlayerRacket: string = "0";
  var peerConns: DataConnection[] = [];
  const userType = window.location.hash.slice(1);
  if (userType == "host") {
    idPlayerRacket = "0";
    myGame.setRackets([
      {
        id: idPlayerRacket,
        racket: {
          center: { x: 0.1, y: 0.1 },
          velo: { x: 0, y: 0 },
          rad: myGame.RACKET_RADIUS,
        },
      },
    ]);
    const peer = new Peer(HOST_PEER_ID, peerConfig);
    peer.on("open", () => {
      myGame.setStarted(true);
      console.log("started game:", myGame.started());
      peer.on("connection", (conn) => {
        console.log("NEW CONNECTION");
        peerConns.push(conn);
        conn.on("open", () => {
          conn.send({ puckData: myGame.puck(), racketData: myGame.rackets() });
        });
        conn.on("close", () => {
          console.log(conn.connectionId);
        });
        conn.on("data", (data) => {
          const newRacket: myGame.Racket = data as myGame.Racket,
            prevRackets = [...myGame.rackets()];
          var exist = false;
          for (let i = 0; i < prevRackets.length; i++) {
            if (prevRackets[i].id == newRacket.id) {
              exist = true;
              prevRackets[i] = newRacket;
            }
          }
          if (!exist) {
            prevRackets.push(newRacket);
          }
          myGame.setRackets(prevRackets);
          conn.send({
            puckData: myGame.puck(),
            racketsData: myGame.rackets(),
          });
        });
      });
    });
  } else {
    const peer = new Peer(peerConfig);
    peer.on("open", (id) => {
      peerConns.push(peer.connect(HOST_PEER_ID));
      peerConns[0].on("open", () => {
        idPlayerRacket = id;
        peerConns[0].send({
          id: idPlayerRacket,
          racket: {
            center: { x: 0.1, y: 0.1 },
            velo: { x: 0, y: 0 },
            rad: myGame.RACKET_RADIUS,
          },
        });
        myGame.setStarted(true);
        peerConns[0].on("data", (data) => {
          myGame.setPuck((data as myGame.GameData).puckData);
          myGame.setRackets((data as myGame.GameData).racketsData);
        });
      });
    });
  }
  const [tableWidthPx, setTableWidthPx] = createSignal(
    Math.min(window.innerWidth, 1024) / myGame.TABLE_LENGTH
  );

  setInterval(() => {
    myGame.MovePuck();
    myGame.handlePuckCollisions();
    if (idPlayerRacket == "0") {
      for (let i = 0; i < peerConns.length; i++)
        peerConns[i].send({
          puckData: myGame.puck(),
          racketsData: myGame.rackets(),
        });
    } else {
      for (let i = 0; i < myGame.rackets().length; i++) {
        if (myGame.rackets()[i].id == idPlayerRacket)
          peerConns[0].send(myGame.rackets()[i]);
      }
    }
  }, 17);

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
      if (idPlayerRacket == "0") {
        for (let i = 0; i < myGame.rackets().length; i++) {
          if (myGame.rackets()[i].id == idPlayerRacket) {
            myGame.setPuck(
              handleCircleColision(myGame.rackets()[i].racket, myGame.puck())
            );
          }
        }
        for (let i = 0; i < peerConns.length; i++)
          peerConns[i].send({
            puckData: myGame.puck(),
            racketsData: myGame.rackets(),
          });
      } else {
        for (let i = 0; i < myGame.rackets().length; i++) {
          if (myGame.rackets()[i].id == idPlayerRacket)
            peerConns[0].send(myGame.rackets()[i]);
        }
      }
    }
  }

  function displayTable() {
    return (
      <div
        class="top-0 max-w-5xl h-screen flex touch-none"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      >
        <div class="h-auto max-w-5xl">
          <For each={myGame.rackets()}>
            {(r, i) => (
              <div
                class="absolute"
                style={{
                  width: `${2 * r.racket.rad * tableWidthPx()}px`,
                  left: `${
                    (r.racket.center.x - r.racket.rad) * tableWidthPx()
                  }px`,
                  top: `${
                    (r.racket.center.y - r.racket.rad) * tableWidthPx()
                  }px`,
                }}
              >
                <img src="images/red.png" />
              </div>
            )}
          </For>
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
  // const game = () => ();
  return <div>{myGame.started() ? displayTable() : <div></div>}</div>;
}

export default App;
