import React from 'react';

interface Props {
  mirror: boolean;
  setMirror: (v: boolean) => void;
}

export const MirrorToggle: React.FC<Props> = ({ mirror, setMirror }) => (
  <button onClick={() => setMirror(!mirror)} className="px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700">{mirror ? 'Mirror' : 'Normal'}</button>
);

export default MirrorToggle;
