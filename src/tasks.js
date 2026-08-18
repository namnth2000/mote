const TASK_LINE = /^(\s*(?:>\s*)*(?:(?:[-+*])|(?:\d+[.)]))\s+\[)([ xX])(\](?:\s+|$))/;
const FENCE_LINE = /^\s*(`{3,}|~{3,})/;

export function setTaskChecked(markdown, taskIndex, checked) {
  if (typeof markdown !== 'string' || !Number.isInteger(taskIndex) || taskIndex < 0) return markdown;

  const newline = markdown.includes('\r\n') ? '\r\n' : '\n';
  const lines = markdown.split(/\r?\n/);
  let fence = null;
  let currentTask = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = line.match(FENCE_LINE);

    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) {
        fence = { char: marker[0], length: marker.length };
      } else if (marker[0] === fence.char && marker.length >= fence.length) {
        fence = null;
      }
      continue;
    }

    if (fence) continue;

    const taskMatch = line.match(TASK_LINE);
    if (!taskMatch) continue;

    if (currentTask === taskIndex) {
      lines[index] = line.replace(TASK_LINE, `$1${checked ? 'x' : ' '}$3`);
      return lines.join(newline);
    }

    currentTask += 1;
  }

  return markdown;
}
