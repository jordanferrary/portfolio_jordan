import {normalizeBlockAppearance,type BlockAppearance} from '../../lib/component-settings'
export function BlockProperties({value,onChange}:{value?:BlockAppearance;onChange:(value?:BlockAppearance)=>void}){
 const patch=(next:Partial<BlockAppearance>)=>onChange(normalizeBlockAppearance({...value,...next}))
 return <details className="studio-component-properties"><summary>Propriedades do componente</summary>
  <label>Largura ({value?.width??100}%)<input type="range" min="50" max="100" step="5" value={value?.width??100} onChange={e=>patch({width:Number(e.target.value)})}/></label>
  <label>Espaço acima ({value?.space??0}px)<input type="range" min="0" max="64" step="4" value={value?.space??0} onChange={e=>patch({space:Number(e.target.value)})}/></label>
  <label>Alinhamento<select value={value?.align??'center'} onChange={e=>patch({align:e.target.value as BlockAppearance['align']})}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label>
  <label>Superfície<select value={value?.surface??'plain'} onChange={e=>patch({surface:e.target.value as BlockAppearance['surface']})}><option value="plain">Original</option><option value="panel">Painel do tema</option></select></label>
  <label className="studio-inline-checkbox"><input type="checkbox" checked={value?.hideMobile===true} onChange={e=>patch({hideMobile:e.target.checked})}/>Ocultar em celular</label>
  <label className="studio-inline-checkbox"><input type="checkbox" checked={value?.hideDesktop===true} onChange={e=>patch({hideDesktop:e.target.checked})}/>Ocultar em desktop</label>
  <button type="button" className="subtle-action" onClick={()=>onChange(undefined)}>Restaurar padrão</button>
 </details>
}
