import{O as l,r as f,j as n,Z as E,q as N,R as S}from"./index-CsPyOqhI.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=l("Bold",[["path",{d:"M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8",key:"mg9rjx"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=l("Heading2",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1",key:"9jr5yi"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=l("Heading3",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2",key:"68ncm8"}],["path",{d:"M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2",key:"1ejuhz"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=l("Italic",[["line",{x1:"19",x2:"10",y1:"4",y2:"4",key:"15jd3p"}],["line",{x1:"14",x2:"5",y1:"20",y2:"20",key:"bu0au3"}],["line",{x1:"15",x2:"9",y1:"4",y2:"20",key:"uljnxc"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=l("RemoveFormatting",[["path",{d:"M4 7V4h16v3",key:"9msm58"}],["path",{d:"M5 20h6",key:"1h6pxn"}],["path",{d:"M13 4 8 20",key:"kqq6aj"}],["path",{d:"m15 15 5 5",key:"me55sn"}],["path",{d:"m20 15-5 5",key:"11p7ol"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=l("Type",[["polyline",{points:"4 7 4 4 20 4 20 7",key:"1nosan"}],["line",{x1:"9",x2:"15",y1:"20",y2:"20",key:"swin9y"}],["line",{x1:"12",x2:"12",y1:"4",y2:"20",key:"1tx1rr"}]]);function O({value:t,onChange:y,label:b,rows:w=5,heading:m=!1}){const c=f.useRef(null),p=f.useRef({start:0,end:0}),[h,u]=f.useState(!1),d=()=>{const e=c.current;e&&(p.current={start:e.selectionStart,end:e.selectionEnd})},k=(e,s)=>{p.current={start:e,end:s},requestAnimationFrame(()=>{var a,r;(a=c.current)==null||a.focus(),(r=c.current)==null||r.setSelectionRange(e,s)})},j=e=>{if(!c.current){u(!1);return}const a=Math.min(p.current.start,t.length),r=Math.min(p.current.end,t.length);if(e==="bold"||e==="italic"||e==="accent"){const o=e==="bold"?"**":e==="italic"?"*":"==",x=t.slice(a,r)||"texto";if(a>=o.length&&t.slice(a-o.length,a)===o&&t.slice(r,r+o.length)===o){y(t.slice(0,a-o.length)+x+t.slice(r+o.length)),k(a-o.length,a-o.length+x.length);return}y(t.slice(0,a)+o+x+o+t.slice(r)),k(a+o.length,a+o.length+x.length);return}const i=t.lastIndexOf(`
`,Math.max(0,a-1))+1,M=t.indexOf(`
`,a),q=M<0?t.length:M,z=t.slice(i,q).replace(/^#{1,3}\s*/,""),g=e==="h2"?"## ":e==="h3"?"### ":"";y(t.slice(0,i)+g+z+t.slice(q)),k(i+g.length,i+g.length+z.length)},I=e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey){const s=e.key.toLowerCase();(s==="b"||s==="i")&&(e.preventDefault(),d(),j(s==="b"?"bold":"italic"))}},C=[{key:"bold",name:"Negrito · Ctrl+B",icon:R,aria:"Negrito"},{key:"italic",name:"Itálico · Ctrl+I",icon:B,aria:"Itálico"},{key:"accent",name:"Destacar com a cor do tema",icon:E,aria:"Destaque do tema"},{key:"h2",name:"Subtítulo grande",icon:V,aria:"Subtítulo grande"},{key:"h3",name:"Subtítulo menor",icon:T,aria:"Subtítulo menor"},{key:"normal",name:"Texto comum",icon:D,aria:"Texto comum"}];return n.jsxs("div",{className:"text-composer",children:[n.jsxs("div",{className:"composer-toolbar",role:"toolbar","aria-label":"Formatação: "+b,children:[C.map(({key:e,name:s,icon:a,aria:r})=>n.jsx("button",{type:"button",title:s,"aria-label":r,onMouseDown:i=>i.preventDefault(),onClick:()=>j(e),children:n.jsx(a,{size:16})},e)),n.jsx("button",{type:"button",className:h?"active":"","aria-label":h?"Voltar à edição":"Expandir visualização","aria-pressed":h,onClick:()=>u(e=>!e),title:"Alternar edição/prévia",children:h?n.jsx(H,{size:16}):n.jsx(N,{size:16})})]}),h?n.jsxs("div",{className:"composer-preview",children:[n.jsx(S,{value:t,heading:m}),n.jsx("button",{type:"button",onClick:()=>u(!1),children:"Voltar à edição"})]}):n.jsxs(n.Fragment,{children:[n.jsx("textarea",{ref:c,value:t,rows:w,onChange:e=>{y(e.target.value),p.current={start:e.target.selectionStart,end:e.target.selectionEnd}},onSelect:d,onClick:d,onKeyUp:d,onKeyDown:I,"aria-label":b,placeholder:m?"Escreva um título e selecione trechos para formatar.":"Escreva seu texto. Selecione palavras e clique em B, I ou na paleta roxa."}),t.trim()&&n.jsxs("div",{className:"composer-live-preview",children:[n.jsx("span",{className:"composer-preview-label",children:"Prévia formatada"}),n.jsx(S,{value:t,heading:m})]})]}),n.jsx("small",{children:"Selecione palavras e clique em B (negrito), I (itálico) ou na paleta (cor do tema). Atalhos: Ctrl+B e Ctrl+I."})]})}export{V as H,O as T};
