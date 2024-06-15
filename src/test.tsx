import { createSignal } from "solid-js";
import Peer, { DataConnection } from "peerjs";
import TextInputComponent from "./TextInput";

interface StartPageProps {
  onPeerChange: (Peer: Peer | null) => void;
  onConnChange: (Conn: DataConnection) => void;
  onPlayerTypeChange: (PlayerType: string) => void;
  onPlayerIdChange: (PlayerId: string) => void;
  userType: string;
  buttonText: string;
}
const StartPage = (props: StartPageProps) => {
  const [peerId, setPeerId] = createSignal("");
  //console.log(props.buttonText);
  const handleTextChange = (text: string) => {
    setPeerId(text);
  };

  const connectToPeer = () => {
    props.onPlayerTypeChange(props.userType);

    if (props.userType == "Host") {
      const newPeer = new Peer(peerId());
      newPeer.on("open", (id) => {
        props.onPlayerIdChange(id);
        props.onPeerChange(newPeer);
        newPeer.on("connection", (connection) => {
          props.onConnChange(connection);
        });
      });
    } else if (props.userType == "Guest") {
      const newPeer = new Peer();
      newPeer.on("open", (id) => {
        props.onPlayerIdChange(id);
        props.onPeerChange(newPeer);
        props.onConnChange(newPeer.connect(peerId()));
      });
      newPeer.on("error", () => {
        props.onPeerChange(null);
      });
    }
  };

  return (
    <div class="flex items-center justify-center min-h-screen mx-24">
      <div class="p-6 bg-white rounded-lg shadow-md max-w-sm w-full">
        <div class="border border-gray-300 rounded-md px-3 py-2 w-full mb-4">
          <TextInputComponent
            placeholder="Enter Room ID..."
            onTextChange={handleTextChange}
          />
        </div>
        <div class="bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-300">
          <button onClick={connectToPeer} class="w-full px-4 py-2">
            {props.buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
