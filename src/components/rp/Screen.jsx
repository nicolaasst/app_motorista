// Fluid full-width wrapper — content occupies 100% of the viewport width.
// Only the responsive gutter scale changes across breakpoints.
// Full-screen map views pass `full` to opt out of the gutter entirely.
export function Screen({ children, className = "", full = false, as: Tag = "div", ...props }) {
  if (full) {
    return (
      <Tag className={className} {...props}>
        {children}
      </Tag>
    );
  }
  return (
    <div
      className={`w-full px-5 pb-28 md:px-6 lg:px-8 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Screen;