
// brand.js — extract a brand color from /logo.png and set CSS var --brand
(async function(){
  try{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = './logo.png';

    await new Promise((res, rej)=>{ img.onload = res; img.onerror = rej; });

    const cnv = document.createElement('canvas');
    const size = 64;
    cnv.width = cnv.height = size;
    const ctx = cnv.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0,0,size,size);

    let r=0,g=0,b=0,c=0;
    for(let i=0;i<data.length;i+=4){
      const R=data[i], G=data[i+1], B=data[i+2], A=data[i+3];
      if(A<8) continue; // ignore transparent
      const max = Math.max(R,G,B), min = Math.min(R,G,B);
      const sat = (max-min)/(max||1);
      const lum = (0.2126*R + 0.7152*G + 0.0722*B)/255;
      if(lum>0.92 || lum<0.08 || sat<0.2) continue; // ignore too light/dark/gray
      r+=R; g+=G; b+=B; c++;
    }
    if(c>0){
      r=Math.round(r/c); g=Math.round(g/c); b=Math.round(b/c);
      const brand = `rgb(${r}, ${g}, ${b})`;
      document.documentElement.style.setProperty('--brand', brand);
      // also tweak gradient backdrop tone
      document.body.style.background = `radial-gradient(1200px 800px at 20% -20%, rgba(${r},${g},${b},0.18) 2%, transparent 50%), radial-gradient(1200px 800px at 100% -40%, rgba(${r},${g},${b},0.12) 0%, transparent 60%), var(--bg)`;
    }
  }catch(e){
    // fallback color kept
  }
})();

