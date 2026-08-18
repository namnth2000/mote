import './task-interactions.css';
import { setTaskChecked } from './tasks.js';

const preview = document.querySelector('#preview-view');
const markdownEditor = document.querySelector('#markdown-editor');

function directTaskCheckbox(item) {
  return [...item.children].find(
    (child) => child instanceof HTMLInputElement && child.type === 'checkbox'
  ) ?? null;
}

function enhanceTaskCheckboxes() {
  if (!preview || !markdownEditor) return;

  const taskInputs = [...preview.querySelectorAll('li > input[type="checkbox"]')];

  taskInputs.forEach((input, index) => {
    const item = input.parentElement;
    if (!item) return;

    item.classList.add('mote-task-item');
    input.dataset.taskIndex = String(index);
    input.disabled = markdownEditor.readOnly;
    input.setAttribute('aria-label', input.checked ? 'Mark task incomplete' : 'Mark task complete');
  });

  for (const list of preview.querySelectorAll('ul, ol')) {
    const items = [...list.children].filter((child) => child.tagName === 'LI');
    const allTasks = items.length > 0 && items.every((item) => Boolean(directTaskCheckbox(item)));
    list.classList.toggle('mote-task-list', allTasks);
  }
}

function onTaskChanged(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox' || !preview?.contains(input)) return;
  if (input.disabled || !markdownEditor) return;

  const taskIndex = Number.parseInt(input.dataset.taskIndex ?? '', 10);
  if (!Number.isInteger(taskIndex)) return;

  const current = markdownEditor.value;
  const next = setTaskChecked(current, taskIndex, input.checked);

  if (next === current) {
    input.checked = !input.checked;
    return;
  }

  markdownEditor.value = next;
  markdownEditor.dispatchEvent(new Event('input', { bubbles: true }));
  input.setAttribute('aria-label', input.checked ? 'Mark task incomplete' : 'Mark task complete');
}

if (preview) {
  const observer = new MutationObserver(enhanceTaskCheckboxes);
  observer.observe(preview, { childList: true, subtree: true });
  preview.addEventListener('change', onTaskChanged);
  enhanceTaskCheckboxes();
}
