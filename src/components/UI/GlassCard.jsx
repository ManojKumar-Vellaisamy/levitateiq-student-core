
const GlassCard = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        ${hover ? 'glass-card-hover cursor-pointer' : 'glass-card'}
        p-6 animate-fade-in
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
