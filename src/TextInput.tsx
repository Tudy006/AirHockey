import { createSignal } from "solid-js";

interface TextInputProps {
  placeholder: string;
  onTextChange: (text: string) => void;
}

const TextInput = (props: TextInputProps) => {
  const [text, setText] = createSignal("");
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setText(target.value);
    props.onTextChange(target.value);
  };
  return (
    <div>
      <input
        type="text"
        value={text()}
        onInput={handleChange}
        placeholder={props.placeholder}
        class="focus:outline-none"
      />
    </div>
  );
};

export default TextInput;
