/* Test de fumée du Holocron : à lancer avant chaque publication (npm test).
   1) vérifie la cohérence du contenu PUBLIE ;
   2) simule plusieurs jours de séances sur une même tablette (mêmes données locales). */
const {JSDOM}=require('jsdom');
const fs=require('fs'), path=require('path'), assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

/* ---------- 1. Contenu ---------- */
function extrairePublie(){
  const dom=new JSDOM(html.replace(/<script>[\s\S]*<\/script>/,''),{runScripts:"outside-only"});
  const m=html.match(/var PUBLIE = ([\s\S]*?);\n/); assert(m,"objet PUBLIE introuvable");
  return dom.window.eval('('+m[1]+')');
}
const P=extrairePublie(), erreurs=[];
const err=(m)=>erreurs.push(m);
assert(html.includes('name="robots" content="noindex'),"balise noindex manquante");
assert(!/fetch\(|XMLHttpRequest|claude\.use\(/.test(html.replace(/window\.claude/g,'')),"appel réseau ou capacité Claude interdits");
if(P.semaine){
  const s=P.semaine;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s.id)) err("semaine.id doit être AAAA-MM-JJ");
  else if(new Date(s.id+"T12:00:00").getDay()!==3) err("semaine.id doit être un mercredi : "+s.id);
  if(!s.regle||!s.regle.titre) err("semaine.regle.titre manquant");
  (s.mots||[]).forEach((m,i)=>{ if(!m.mot||!m.phrase) err("mot "+i+" incomplet"); });
  if(!(s.mots||[]).length) err("aucun mot");
  (s.pieges||[]).forEach((p,i)=>{
    if(!p.phrase||p.phrase.indexOf("___")<0) err("piège "+i+" sans ___");
    if(!Array.isArray(p.options)||p.options.indexOf(p.reponse)<0) err("piège "+i+" : réponse absente des options");
    if(!p.test) err("piège "+i+" sans test");
  });
}
const ids=new Set();
(P.lecons||[]).forEach((l,i)=>{
  if(!l.id) err("leçon "+i+" sans id"); else if(ids.has(l.id)) err("id de leçon en double : "+l.id); else ids.add(l.id);
  if(l.echeance && !/^\d{4}-\d{2}-\d{2}$/.test(l.echeance)) err("échéance invalide : "+l.id);
  if(!(l.essentiel||[]).length) err("leçon "+l.id+" sans essentiel");
  ["souvenir","compris"].forEach(k=>(l[k]||[]).forEach((q,j)=>{ if(!q.q||!Array.isArray(q.options)||q.options.indexOf(q.reponse)<0) err("leçon "+l.id+" "+k+" "+j+" : réponse absente des options"); }));
  (l.recite||[]).forEach((q,j)=>{ if(!q.q||!q.r) err("leçon "+l.id+" recite "+j+" incomplet");
    else if(!Array.isArray(q.options)||q.options.length<3||q.options.indexOf(q.r)<0) err("leçon "+l.id+" recite "+j+" : il faut options = [r + au moins 2 réponses proches]"); });
});
if(P.packs){
  if(new Date(P.packs.cycle+"T12:00:00").getDay()!==3) err("packs.cycle doit être un mercredi");
  ["pack1","pack2"].forEach(k=>{ const p=P.packs[k]; if(!p) return; if(!p.texteA||!p.texteB) err(k+" incomplet");
    (p.erreursB||[]).forEach((e,j)=>{ if(p.texteB.indexOf(e.faute)<0) err(k+" : faute "+j+" (« "+e.faute+" ») absente du texte B"); }); });
}
if(erreurs.length){ console.error("CONTENU INVALIDE :\n - "+erreurs.join("\n - ")); process.exit(1); }
console.log("✓ Contenu cohérent ("+((P.semaine&&P.semaine.mots)||[]).length+" mots, "+(P.lecons||[]).length+" leçon(s))");

/* ---------- 2. Simulation de séances ---------- */
let stock=null;
async function seance(date,avecMots){
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://holocron.test/",beforeParse(w){
    const RD=w.Date, fixe=new RD(date).getTime();
    class FD extends RD{constructor(...a){ if(a.length===0) super(fixe); else super(...a);} static now(){return fixe;}}
    w.Date=FD;
    const si=w.setInterval.bind(w); w.setInterval=(f,t)=>si(f,Math.max(1,Math.floor(t/100))); /* accélère le chrono de relecture */
    w.SpeechSynthesisUtterance=function(t){this.text=t;};
    w.speechSynthesis={speaking:false,pending:false,paused:false,getVoices:()=>[],speak(){},cancel(){},resume(){}};
    if(stock) w.localStorage.setItem('holocron-v2',stock);
  }});
  const w=dom.window,d=w.document, errs=[];
  w.addEventListener('error',e=>errs.push(e.message));
  const pause=(ms)=>new Promise(r=>setTimeout(r,ms));
  await pause(100);
  const go=d.querySelector('#go'); assert(go,date+" : bouton de séance absent");
  go.click(); await pause(30);
  let k=0, dicte=0;
  for(let n=0;n<200;n++){
    const c=d.querySelector('#carte'); if(!c) break;
    if(/Mot n°/.test(c.textContent) && d.querySelector('#suite')) dicte++;
    const v=d.querySelector('#verif');
    if(v&&v.disabled){ await pause(700); continue; }
    const s=d.querySelector('#suite'); if(s){ s.click(); await pause(5); continue; }
    const o=[...d.querySelectorAll('.opt:not([disabled]),.emo:not([disabled])')]; if(o.length){ o[(k++)%o.length].click(); await pause(5); continue; }
    if(v){ v.click(); await pause(5); continue; }
    break;
  }
  await pause(150);
  assert(d.querySelector('.bilan'),date+" : la séance n'arrive pas au bilan");
  assert.deepStrictEqual(errs,[],date+" : erreurs JavaScript "+errs.join(" | "));
  if(avecMots) assert(dicte>0,date+" : aucun mot dicté dans la séance");
  stock=w.localStorage.getItem('holocron-v2');
  console.log("✓ Séance du "+date.slice(0,10)+" ("+d.querySelector('.gros').textContent+" points)");
  w.close();
}
(async()=>{
  const base=P.semaine ? new Date(P.semaine.id+"T12:00:00") : new Date();
  const jour=(n,h)=>{ const x=new Date(base); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10)+"T"+h; };
  /* mer, jeu, ven, sam, dim, lun, mar — du jeudi au lundi, la séance doit dicter des mots */
  for(const [n,h] of [[0,"18:40:00"],[1,"17:00:00"],[2,"17:00:00"],[3,"10:00:00"],[4,"10:00:00"],[5,"18:40:00"],[6,"18:40:00"]]) await seance(jour(n,h), n>=1&&n<=5);
  console.log("✓ Tous les tests passent");
  process.exit(0);
})().catch(e=>{ console.error("ÉCHEC : "+e.message); process.exit(1); });
