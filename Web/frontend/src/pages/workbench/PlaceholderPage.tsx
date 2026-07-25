interface Props {
  title: string;
  section: string;
}

export function PlaceholderPage({ title, section }: Props) {
  return (
    <div className="page">
      <h2>{title}</h2>
      <p className="muted">
        {section} &gt; {title}（占位）
      </p>
      <div className="panel" style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="muted">此处为「{title}」页面内容区域</span>
      </div>
    </div>
  );
}
