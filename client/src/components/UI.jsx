import TypewriterText from './TypewriterText'

export function PageHeader({ icon: Icon, color, title, sub }) {
  return (
    <div className="ph">
      <div className="ph-icon" style={{ background: color + '18', border: `1px solid ${color}35` }}>
        {Icon && <Icon size={24} color={color} />}
      </div>
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
    </div>
  )
}

export function Label({ children }) {
  return <label className="lbl">{children}</label>
}

export function SubmitBtn({ loading, onClick, label, loadingLabel }) {
  return (
    <button className="btn" onClick={onClick} disabled={loading}>
      {loading ? <><span className="spin" />{loadingLabel}</> : label}
    </button>
  )
}

export function ResultCard({ icon, label, text, typewriter = true }) {
  return (
    <div className="card result">
      <div className="result-hd">
        {icon}
        <span className="result-lbl">{label}</span>
      </div>
      <p className="result-txt">
        {typewriter ? <TypewriterText text={text} /> : text}
      </p>
    </div>
  )
}
