import {normalizeBlockAppearance,type BlockAppearance} from '../../lib/component-settings'
export function BlockProperties({value,onChange,expanded=false}:{value?:BlockAppearance;onChange:(value?:BlockAppearance)=>void;expanded?:boolean}){
 const patch=(next:Partial<BlockAppearance>)=>onChange(normalizeBlockAppearance({...value,...next}))
 return <details className="studio-component-properties" open={expanded||undefined}><summary>Propriedades do componente</summary>
  <label>Largura ({value?.width??100}%)<input type="range" min="50" max="100" step="5" value={value?.width??100} onChange={e=>patch({width:Number(e.target.value)})}/></label>
  <label>Espaço acima ({value?.space??0}px)<input type="range" min="0" max="64" step="4" value={value?.space??0} onChange={e=>patch({space:Number(e.target.value)})}/></label>
  <label>Alinhamento<select value={value?.align??'center'} onChange={e=>patch({align:e.target.value as BlockAppearance['align']})}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label>
  <label>Superfície<select value={value?.surface??'plain'} onChange={e=>patch({surface:e.target.value as BlockAppearance['surface']})}><option value="plain">Original</option><option value="panel">Painel do tema</option><option value="glass">Liquid Glass</option></select></label>
  <label>Preenchimento interno<select value={value?.padding??''} onChange={e=>patch({padding:e.target.value===''?undefined:Number(e.target.value)})}><option value="">Herdar</option>{[0,8,16,24,32,40,48].map(n=><option key={n} value={n}>{n}px</option>)}</select></label>
  <label>Cantos<select value={value?.corner??''} onChange={e=>patch({corner:e.target.value===''?undefined:Number(e.target.value)})}><option value="">Herdar</option>{[0,8,16,24,32,40,48].map(n=><option key={n} value={n}>{n}px</option>)}</select></label>
  <label>Opacidade ({value?.opacity??100}%)<input type="range" min="45" max="100" step="5" value={value?.opacity??100} onChange={e=>patch({opacity:Number(e.target.value)})}/></label>
  <label className="studio-inline-checkbox"><input type="checkbox" checked={value?.border===true} onChange={e=>patch({border:e.target.checked})}/>Borda na cor do tema</label>
  <label className="studio-inline-checkbox"><input type="checkbox" checked={value?.hideMobile===true} onChange={e=>patch({hideMobile:e.target.checked})}/>Ocultar em celular</label>
  <label className="studio-inline-checkbox"><input type="checkbox" checked={value?.hideDesktop===true} onChange={e=>patch({hideDesktop:e.target.checked})}/>Ocultar em desktop</label>
  <button type="button" className="subtle-action" onClick={()=>onChange(undefined)}>Restaurar padrão</button>
 </details>
}
