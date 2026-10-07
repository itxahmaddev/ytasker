function download(filename, mime, content) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

export function exportJSON(tasks) {
  download(`ytasker-tasks-${stamp()}.json`, 'application/json', JSON.stringify(tasks, null, 2));
}

// Quote every field and neutralise spreadsheet formula injection (=, +, -, @).
function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function exportCSV(tasks) {
  const header = ['Title', 'Description', 'Status', 'Priority', 'Due date', 'Tags', 'Subtasks done', 'Subtasks total', 'Focus minutes', 'Created', 'Completed'];
  const rows = tasks.map((t) => [
    t.title,
    t.description,
    t.status,
    t.priority,
    t.dueDate ? t.dueDate.slice(0, 10) : '',
    (t.tags || []).join(' '),
    (t.subtasks || []).filter((s) => s.done).length,
    (t.subtasks || []).length,
    t.focusMinutes || 0,
    t.createdAt,
    t.completedAt || '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  download(`ytasker-tasks-${stamp()}.csv`, 'text/csv;charset=utf-8', `\uFEFF${csv}`);
}
