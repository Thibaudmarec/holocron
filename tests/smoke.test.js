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
  (s.mots||[]).forEach((m,i)=>{ if(!m.mot||!m.phrase) err("mot "+i+" incomplet");
    const v=(m.variantes||[]).filter(x=>x&&x!==m.mot);
    if(v.length!==3||new Set(v).size!==3) err("mot « "+m.mot+" » : il faut 3 variantes piégées différentes du mot"); });
  if(!(s.mots||[]).length) err("aucun mot");
  (s.rates||[]).forEach(r=>{ if(!(s.mots||[]).some(m=>m.mot.toLowerCase()===String(r).toLowerCase().trim())) err("semaine.rates : « "+r+" » n'est pas écrit comme dans la liste des mots"); });
  (s.pieges||[]).forEach((p,i)=>{
    if(!p.phrase||p.phrase.indexOf("___")<0) err("piège "+i+" sans ___");
    if(!Array.isArray(p.options)||p.options.indexOf(p.reponse)<0) err("piège "+i+" : réponse absente des options");
    if(!p.test) err("piège "+i+" sans test");
  });
}
/* archives des semaines passées (pour les révisions) */
(P.archives||[]).forEach(a=>{ const n="archive "+a.id;
  if(!a.id||!(a.mots||[]).length) err(n+" : id ou mots manquants");
  (a.mots||[]).forEach(m=>{ const v=(m.variantes||[]).filter(x=>x&&x!==m.mot); if(!m.mot||!m.phrase||v.length!==3||new Set(v).size!==3) err(n+" : mot « "+m.mot+" » incomplet (phrase + 3 variantes)"); });
  (a.pieges||[]).forEach((p,i)=>{ if(!p.phrase||p.phrase.indexOf("___")<0||!Array.isArray(p.options)||p.options.indexOf(p.reponse)<0) err(n+" : piège "+i+" invalide"); }); });
const vusCarnet=new Set();
(P.carnet||[]).forEach((x,i)=>{ if(!x.mot||!x.phrase) err("carnet "+i+" : mot ou phrase manquant"); else if(vusCarnet.has(x.mot.toLowerCase())) err("carnet : doublon « "+x.mot+" »"); else vusCarnet.add(x.mot.toLowerCase()); });
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
  /* chaque dictée du week-end (texte A) doit contenir TOUS les mots de la liste (pluriel accepté ; une des deux formes pour les adjectifs) */
  const L="A-Za-zÀ-ÖØ-öø-ÿŒœ0-9\\-";
  const contient=(t,mot)=>mot.split(",").map(x=>x.trim().replace(/^(un|une|le|la|les)\s+/i,"")).some(c=>
    new RegExp("(^|[^"+L+"])"+c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(s|x)?(?=[^"+L+"]|$)","i").test(t));
  ["pack1","pack2"].forEach(k=>{ const p=P.packs[k]; if(!p||!p.texteA||!P.semaine) return;
    const manquants=(P.semaine.mots||[]).map(m=>m.mot).filter(m=>!contient(p.texteA,m));
    if(manquants.length) err(k+" : mots absents du texte A : "+manquants.join(" · ")); });
  ["pack1","pack2"].forEach(k=>{ const p=P.packs[k]; if(!p) return; if(!p.texteA||!p.texteB) err(k+" incomplet");
    (p.erreursB||[]).forEach((e,j)=>{ if(p.texteB.indexOf(e.faute)<0) err(k+" : faute "+j+" (« "+e.faute+" ») absente du texte B"); }); });
}
if(erreurs.length){ console.error("CONTENU INVALIDE :\n - "+erreurs.join("\n - ")); process.exit(1); }
console.log("✓ Contenu cohérent ("+((P.semaine&&P.semaine.mots)||[]).length+" mots, "+(P.lecons||[]).length+" leçon(s))");

/* ---------- 2. Simulation de séances ---------- */
let stock=null;
async function seance(date,avecMots,revision){
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
  if(revision){ const rv=d.querySelector('#rev'); assert(rv,date+" : bouton Révisions absent"); rv.click(); await pause(20);
    const g=d.querySelector('#grande'); assert(g,date+" : grande révision absente"); g.click(); await pause(50); }
  const go=revision ? {click(){}} : d.querySelector('#go');
  if(!go && !avecMots && /Pas de séance à l'écran/.test(d.body.textContent)){ console.log("✓ "+date.slice(0,10)+" : pas de séance prévue"); w.close(); return; }
  assert(go,date+" : bouton de séance absent");
  go.click(); await pause(30);
  let k=0, dicte=0;
  for(let n=0;n<(revision?800:200);n++){
    const c=d.querySelector('#carte'); if(!c) break;
    if((/Mot n°|Phrase \d+ sur/.test(c.textContent) && d.querySelector('#suite')) || d.querySelector('.orth:not([disabled])')) dicte++;
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
  const pts=d.querySelector('.gros').textContent;
  if(revision){ d.querySelector('#acc').click(); await pause(50); assert(d.querySelector('#go'),date+" : après une révision, la séance du jour doit rester possible"); }
  stock=w.localStorage.getItem('holocron-v2');
  console.log((revision?"✓ Grande révision du ":"✓ Séance du ")+date.slice(0,10)+" ("+pts+" points)");
  w.close();
}
(async()=>{
  const base=P.semaine ? new Date(P.semaine.id+"T12:00:00") : new Date();
  const jour=(n,h)=>{ const x=new Date(base); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10)+"T"+h; };
  /* mer, jeu, ven, sam, dim, lun, mar — du mercredi au lundi, la séance doit faire travailler les mots */
  for(const [n,h] of [[0,"18:40:00"],[1,"17:00:00"],[2,"17:00:00"],[3,"10:00:00"],[4,"10:00:00"],[5,"18:40:00"],[6,"18:40:00"]]) await seance(jour(n,h), n<=5);
  await seance(jour(7,"10:00:00"),false,true); /* grande révision (tout, 1 h), puis la séance du jour reste possible */
  await seance(jour(7,"18:40:00"),false); /* mercredi suivant, feuille pas encore chargée : découverte papier */
  console.log("✓ Tous les tests passent");
  process.exit(0);
})().catch(e=>{ console.error("ÉCHEC : "+e.message); process.exit(1); });
