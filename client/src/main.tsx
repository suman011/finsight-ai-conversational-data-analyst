import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';

type BoundaryState={error:Error|null};
class ErrorBoundary extends React.Component<React.PropsWithChildren,BoundaryState>{
  state:BoundaryState={error:null};
  static getDerivedStateFromError(error:Error):BoundaryState{return {error};}
  componentDidCatch(error:Error,info:React.ErrorInfo){console.error('FinSight render error',error,info.componentStack);}
  render(){if(this.state.error)return <main style={{fontFamily:'system-ui',maxWidth:680,margin:'10vh auto',padding:28,color:'#17203b'}}><h1>FinSight AI could not load</h1><p>The application encountered a frontend error. See the message below and the browser console.</p><pre style={{whiteSpace:'pre-wrap',padding:16,background:'#f2f3f9',borderRadius:12}}>{this.state.error.message}</pre><button onClick={()=>location.reload()} style={{padding:'12px 20px',background:'#6855e8',color:'white',border:0,borderRadius:8}}>Reload application</button></main>;return this.props.children;}
}
const root=document.getElementById('root');
if(!root)throw new Error('Missing root element in index.html');
createRoot(root).render(<ErrorBoundary><App/></ErrorBoundary>);
