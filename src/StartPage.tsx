import { createSignal } from "solid-js";
import Peer, { DataConnection } from "peerjs";
import TextInput from "./TextInput";
import { peerConfig } from "./config";

interface StartPageProps {
  onPeerChange: (Peer: Peer | null) => void;
  onConnChange: (Conn: DataConnection) => void;
  onPlayerTypeChange: (PlayerType: string) => void;
  onPlayerConnect: (PlayerId: string, PlayerName: string) => void;
  onConnClose: (Conn: DataConnection) => void;
}
const StartPage = (props: StartPageProps) => {
  const [peerId, setPeerId] = createSignal("");
  const [playerName, setPlayerName] = createSignal("");
  const connectToPeer = (userType: string) => {
    if (peerId().length != 0) {
      props.onPlayerTypeChange(userType);

      if (userType == "Host") {
        const newPeer = new Peer(peerId(), peerConfig);
        newPeer.on("open", () => {
          props.onPlayerConnect("0", playerName());
          props.onPeerChange(newPeer);
          newPeer.on("connection", (connection) => {
            props.onConnChange(connection);
            connection.on("close", () => {
              console.log("CLOSED");
              props.onConnClose(connection);
            });
          });
        });
      } else if (userType == "Guest") {
        const newPeer = new Peer(peerConfig);

        newPeer.on("open", () => {
          const conn = newPeer.connect(peerId());
          props.onPlayerConnect(conn.connectionId, playerName());
          props.onPeerChange(newPeer);
          props.onConnChange(conn);
        });
        newPeer.on("error", () => {
          props.onPeerChange(null);
        });
      }
    } else {
      alert("PLEASE TYPE A ROOM ID");
    }
  };

  return (
    <div class="flex items-center justify-center mx-24 min-h-screen">
      <div class="p-6 bg-white rounded-lg shadow-md max-w-sm w-full">
        <TextInput
          placeholder="Name..."
          onTextChange={setPlayerName}
          maxLength={10}
        />
        <TextInput
          placeholder="Enter Room ID..."
          onTextChange={setPeerId}
          maxLength={25}
        />
        <div class="bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-300 mb-4">
          <button
            onClick={() => connectToPeer("Host")}
            class="w-full px-4 py-2"
          >
            Create Room
          </button>
        </div>
        <div class="bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-300">
          <button
            onClick={() => connectToPeer("Guest")}
            class="w-full px-4 py-2"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
