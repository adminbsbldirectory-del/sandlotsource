export default function SocialInput({ prefix, value, onChange, placeholder }) {
  return (
    <div className="input-prefix-wrap">
      <span className="input-prefix">{prefix}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}