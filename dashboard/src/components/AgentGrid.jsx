import React from 'react';
import { Bug, FlaskConical, ShieldCheck, FileText } from 'lucide-react';

const AGENTS = [
  { key: 'debugging', label: 'Debugging Agent', icon: Bug },
  { key: 'testing', label: 'Testing Agent', icon: FlaskConical },
  { key: 'quality', label: 'Security / Quality Agent', icon: ShieldCheck },
  { key: 'documentation', label: 'Documentation Agent', icon: FileText }
];

export default function AgentGrid({ statuses }) {
  // statuses: { debugging: 'idle'|'running'|'done', ... }
  return (
    <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {AGENTS.map(({ key, label, icon: Icon }) => {
        const status = statuses[key] || 'idle';
        return (
          <div className="agent-card" key={key}>
            <div className="title">
              <Icon size={15} />
              {label}
            </div>
            <div className="status">
              {status === 'running' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="spinner" /> running…
                </span>
              )}
              {status === 'done' && <span className="pass">✓ complete</span>}
              {status === 'idle' && <span>waiting</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
