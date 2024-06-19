import { createSignal } from "solid-js";

interface TextInputProps {
  placeholder: string;
  onTextChange: (text: string) => void;
  maxLength: number;
}

const TextInput = (props: TextInputProps) => {
  const [text, setText] = createSignal("");
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.value.length <= props.maxLength) {
      setText(target.value);
      props.onTextChange(target.value);
    }
  };
  return (
    <div class="border border-gray-300 rounded-md px-3 py-2 w-full mb-4">
      <input
        type="text"
        value={text()}
        maxlength={props.maxLength}
        onInput={handleChange}
        placeholder={props.placeholder}
        class="focus:outline-none"
      />
    </div>
  );
};

export default TextInput;
