import React from 'react';

function Node({ node }) {
  if (node.type === 'dir') {
    return (
      <li>
        <span className="dir">{node.name}/</span>
        <ul>
          {node.children.map((c) => (
            <Node key={c.path} node={c} />
          ))}
        </ul>
      </li>
    );
  }
  return (
    <li>
      <span className="file">{node.name}</span>
    </li>
  );
}

export default function ProjectTree({ tree }) {
  if (!tree) return null;
  return (
    <div className="tree">
      <ul style={{ borderLeft: 'none', paddingLeft: 0 }}>
        {tree.map((n) => (
          <Node key={n.path} node={n} />
        ))}
      </ul>
    </div>
  );
}
