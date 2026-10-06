export const point=(angle,r=80)=>[100+Math.sin(angle*Math.PI/180)*r,100-Math.cos(angle*Math.PI/180)*r];
export const text=(x,y,value,size=13)=>`<text x="${x}" y="${y}" font-size="${size}">${value}</text>`;
export function scale(min,max,step,angle,labelEvery=1,label=v=>v,r=78){let s='';for(let v=min,i=0;v<=max;v+=step,i++){const a=angle(v),major=i%labelEvery===0,[x,y]=point(a,r),[x2,y2]=point(a,r-(major?10:5));s+=`<path class="tick" d="M${x} ${y}L${x2} ${y2}"/>`;if(major){const [tx,ty]=point(a,r-23);s+=text(tx,ty+4,label(v),13)}}return s}
export function arc(start,end,r,color,width=5){const a=point(start,r),b=point(end,r);return `<path d="M${a} A${r} ${r} 0 ${end-start>180?1:0} 1 ${b}" fill="none" stroke="${color}" stroke-width="${width}"/>`}
export const needle=(id,length=65,width=4)=>`<g data-part="${id}"><path class="needle" d="M${100-width} 112L100 ${100-length}L${100+width} 112Z"/></g>`;
export const hub='<circle class="hub" cx="100" cy="100" r="7"/>';
export function face(content){return `<svg viewBox="0 0 200 200" aria-hidden="true"><rect x="1" y="1" width="198" height="198" rx="17" fill="#252b2f" stroke="#434b50"/><circle cx="100" cy="100" r="94" fill="#080c0e" stroke="#42494d" stroke-width="6"/><circle cx="100" cy="100" r="87" fill="#101416" stroke="#232b2e"/>${content}${[ [13,13],[187,13],[13,187],[187,187]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="#687174"/><path d="M${x-2} ${y+2}l4 -4" stroke="#22292d"/>`).join('')}</svg>`}
export const rotate=(element,value)=>element.setAttribute('transform',`rotate(${value} 100 100)`);
export function mount(element,content){element.innerHTML=face(content);return id=>element.querySelector(`[data-part="${id}"]`)}
