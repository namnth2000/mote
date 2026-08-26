import './toast-top-layer.js';
import { formatSelection } from './format.js';

const editor = document.querySelector('#markdown-editor');

function applyIndent(command) {
  if (!editor || editor.readOnly) return;

  const result = formatSelection({
    text: editor.value,
    start: editor.selectionStart,
    end: editor.selectionEnd
  }, command);

  if (result.text === editor.value && result.start === editor.selectionStart && result.end === editor.selectionEnd) return;

  editor.value = result.text;
  editor.setSelectionRange(result.start, result.end);
  editor.dispatchEvent(new Event('input', { bubbles: true }));
}

editor?.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;

  event.preventDefault();
  applyIndent(event.shiftKey ? 'outdent' : 'indent');
});
