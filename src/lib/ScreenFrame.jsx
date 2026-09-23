export default function ScreenFrame({ screenId, children }) {
  return <div className="screen-frame" data-screen={screenId}>{children}</div>;
}
