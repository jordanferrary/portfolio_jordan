import { Link } from "react-router-dom";
export default function NotFound() {
  return <div className="page not-found"><span className="eyebrow">404 / WRONG TURN</span><h1>This world<br/><em>isn't here.</em></h1><Link className="button button-primary" to="/">Return home</Link></div>;
}
