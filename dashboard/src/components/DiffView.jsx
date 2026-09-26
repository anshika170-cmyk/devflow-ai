import React from 'react';

export default function DiffView({ diff }) {
  const lines = diff.split('\n');
  return (
    <pre className="code">
      {lines.map((line, i) => {
        let cls = '';
        if (line.startsWith('+')) cls = 'diff-add';
        else if (line.startsWith('-')) cls = 'diff-rem';
        return (
          <div key={i} className={cls}>
            {line || ' '}
          </div>
        );
      })}
    </pre>
  );
}
