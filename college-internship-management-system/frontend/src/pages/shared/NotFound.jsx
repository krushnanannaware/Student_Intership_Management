import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,background:"var(--dark)"}}>
      <div style={{fontSize:80}}>🎓</div>
      <h1 style={{fontSize:48,fontWeight:900,color:"var(--primary-light)"}}>404</h1>
      <p style={{fontSize:18,color:"var(--text-secondary)"}}>Page not found</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}
